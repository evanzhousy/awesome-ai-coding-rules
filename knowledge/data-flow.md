# TradingFlow Data Pipeline

## Overview

The primary ETL is **`tradingflow-process-service-ec2`** — a long-running TypeScript/Node 20
service on EC2 managed by `forever` (entry: `dist/app.js`, launch: `run_process_service.sh`).
Daily ETL runs inside this process, scheduled via `node-cron`. A secondary
**`tradingflow-cron-service-lambda`** (AWS Lambda, CloudWatch `cron(0/5 * ? * * *)`) exists but
currently only runs `CanaryCheckLambda` — the original AppSync fetcher is disabled.
`CanaryCheckLambda` probes both the CF-service and the process-service canary endpoints.

Key deps: `@clickhouse/client`, `node-cron`, `dynamoose`, `@google-cloud/bigquery`, `pg`,
`black-scholes`, `greeks`, `longport`, `@sentry/node`, `@logtail/node`, `discord-webhook-node`.

---

## High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│                                                                  │
│  ┌────────────────┐ ┌────────┐ ┌──────────┐ ┌────────────────┐ │
│  │Polygon/Massive │ │ Alpaca │ │ LongPort │ │ Alpha Vantage  │ │
│  │   REST API     │ │  REST  │ │ OpenAPI  │ │  (earnings)    │ │
│  │(chains,prices) │ │(eq ref)│ │(idx quot)│ │                │ │
│  └───────┬────────┘ └───┬────┘ └────┬─────┘ └───────┬────────┘ │
└──────────┼──────────────┼───────────┼───────────────┼──────────┘
           └──────────────┴───────────┘               │
                  (reference / fallback)               │
                           ▼                           ▼
┌──────────────────────────────────────────────────────────────────┐
│      tradingflow-process-service-ec2  (Node 20/TS, EC2, forever) │
│                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │  06:30 ET PREOPEN callback  │  │  17:00 ET FINAL callback│ │
│  │  PreopenMetadataVolStructure│  │  FinalMetadataVolStruct.│ │
│  │  1. sync-symbol-meta        │  │  1. sync-symbol-meta    │ │
│  │     (phase=preopen)         │  │     (phase=final)       │ │
│  │  2. optionchain-data snap   │  │  (skip if not completed │ │
│  │  3. symbolVolDaily          │  │   or row_count==0)      │ │
│  │     (phase=preopen)         │  │  2. symbolVolDaily      │ │
│  │  4. fillContractStructure   │  │     (phase=final)       │ │
│  │  5. fillSymbolStructure-    │  │  3. fillSymbolStructure │ │
│  │     Preopen                 │  │     (phase=final, IV)   │ │
│  └────────────┬────────────────┘  └────────────┬────────────┘ │
│               │  (fills coverage-verified;      │              │
│               │   rerunOnceThenVerify)          │              │
└───────────────┼─────────────────────────────────┼─────────────┘
                │                                  │
                ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA DESTINATIONS                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ClickHouse Cloud                      │  │
│  │  SymbolMetaData       (sync-symbol-meta;                 │  │
│  │      IV30/rank/percentile/vol cols via symbolVolDaily)   │  │
│  │  OptionChainTable      (optionchain-data)                │  │
│  │  AggregatedOptionTrades (UW flow batches)                │  │
│  │  mv_symbol_day_flow    (flow MV + symbol structure fill) │  │
│  │  mv_contract_rank_flow (flow MV + contract structure fill)│ │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

  Side: tradingflow-cron-service-lambda ──► CanaryCheckLambda (every 5 min, canary only)
```

---

## Production Cron Schedule

All cron jobs run in the `America/New_York` timezone, Mon–Fri (`1-5`).  
Wrapper: `runScheduledJob()` (`app.ts:56-82`) logs begin/finished/failed with durations.

The metadata, vol-surface, and structure stages were consolidated into two combined
cron callbacks (06:30 ET preopen + 17:00 ET final). There is **no** standalone `0 19`
or `30 19` cron — `app.schedule.test.ts:9-13` asserts the `0 17` final cron is present
and both `0 19` and `30 19` are absent.

| Cron expression           | Callback job name                | Notes |
|---------------------------|----------------------------------|-------|
| `*/5 * * * *`             | (anonymous) `sendBetterStackHeartbeat` | Uptime heartbeat |
| `30 6 * * 1-5`            | `PreopenMetadataVolStructure`    | 06:30 ET. `isTradingDate` gate. Chains, in order: `SyncSymbolMetaService(d,{phase:'preopen'})` → `FetchOptionChainDataService(d)` → `computeSymbolVolDailyForDate(d,{phase:'preopen'})` → `fillContractStructureForDate(d)` → `fillSymbolStructurePreopenForDate(d)`. Each fill is coverage-verified (see below). |
| `30 9 * * 1-5`            | `CheckCFServiceDataController.run` | 09:30 ET CF worker data check |
| `0 17 * * 1-5`            | `FinalMetadataVolStructure`      | 17:00 ET. `isTradingDate` gate. Runs `SyncSymbolMetaService(d,{phase:'final'})`; **skips** vol + structure if its `status !== 'completed'` or `rowCount === 0`. Otherwise chains `computeSymbolVolDailyForDate(d,{phase:'final'})` → `fillSymbolStructureForDate(d,{phase:'final'})` (IV fields), coverage-verified. |
| `0 20 * * 1-5`            | `deleteOldData`                  | 20:00 ET retention cleanup (production-only `NODE_ENV` gate) |
| `setInterval(86_400_000)` | `cleanupLogs`                    | Rolling 24 h, **production-only** (inside `if(isProductionRuntime)`) |
| `setInterval(86_400_000)` | `cleanupSyncUwSmokeData`         | Rolling 24 h, **all environments** (outside the prod block; passes `'interval_24h'`) |

Coverage verification: each fill in the 06:30/17:00 callbacks is wrapped in
`rerunOnceThenVerify` — the fill is re-run once if a coverage assertion fails
(`assertOptionChainReadyForStructure`, `assertContractStructureCoverage`,
`assertSymbolStructureCoverage`, `assertFinalSymbolIvCoverage`).

Also: `CheckCFServiceDataController.run()` invoked once at startup, inside
`if(isProductionRuntime)` (`app.ts:135-136`, gate at `app.ts:134`).

---

## ClickHouse Mart Maintenance

The daily marts have two update paths. This split is intentional and is the current production
contract.

| Mart | Flow columns | Structure columns |
|---|---|---|
| `mv_symbol_day_flow` | ClickHouse materialized view trigger on `AggregatedOptionTrades` inserts | `fillSymbolStructurePreopenForDate` (06:30 preopen) for chain/GEX/meta fields; `fillSymbolStructureForDate(phase:'final')` (17:00 final) for volatility fields |
| `mv_contract_rank_flow` | ClickHouse materialized view trigger on `AggregatedOptionTrades` inserts | `fillContractStructureForDate` in `tradingflow-process-service-ec2`, chained after `FetchOptionChainDataService` in the 06:30 callback. Writes **only** `mv_contract_rank_flow` (sole execution-side contract mart since 2026-06-15). The legacy `mv_contract_day_flow` is frozen/unused and is **never** dropped — a `syncUwData` preflight DESCRIBE still validates its schema. |

### Flow Columns

Flow updates are insert-driven, not cron-refresh-driven. During market hours, when the process
service writes new `AggregatedOptionTrades` batches, ClickHouse automatically appends aggregate
states into the marts. For `mv_contract_rank_flow`, this covers:

- `trade_count`
- `ask_premium` / `bid_premium` / `mid_premium`
- `ask_size` / `bid_size` / `mid_size`
- `ask_dex` / `bid_dex` / `mid_dex`
- `latest_trade_time`
- `latest_trade_price`

The side buckets are `AggregateFunction(sumIf, ...)` columns. Read them with `sumIfMerge(...)`,
and derive the sentiment family via `put_call` (sentiment ≡ f(put_call, side)):

```sql
SELECT
  option_symbol,
  anyMerge(put_call) AS put_call,
  if(put_call = 'CALL', sumIfMerge(ask_dex), sumIfMerge(bid_dex)) AS bullish_dex,
  if(put_call = 'CALL', sumIfMerge(bid_dex), sumIfMerge(ask_dex)) AS bearish_dex,
  if(put_call = 'CALL', sumIfMerge(ask_dex) - sumIfMerge(bid_dex),
     sumIfMerge(bid_dex) - sumIfMerge(ask_dex)) AS net_dex,
  sumIfMerge(ask_premium) + sumIfMerge(bid_premium) + sumIfMerge(mid_premium) AS premium
FROM mv_contract_rank_flow
WHERE date = toDate('2026-06-08')
GROUP BY option_symbol;
```

### Structure Columns

Structure columns do not come from trade inserts. They are filled after the upstream reference
tables finish loading.

| Fill job | Trigger point | Source tables | Target fields |
|---|---|---|---|
| `fillContractStructureForDate` | Same `06:30 ET` `PreopenMetadataVolStructure` callback, after option-chain ingest completes | `OptionChainTable`, prior `OptionChainTable` date | `oi`, `daily_volume`, `prev_oi`, `bid`, `ask`, `iv`, `delta`, greeks, identity fields, plus the `latest_trade_price` chain-close mark for non-traded contracts (009 print-else-mark; `underlying_type` is symbol scope and no longer written here). Writes **only** `mv_contract_rank_flow` — the legacy `mv_contract_day_flow` dual-fill was removed (service.ts "Decommission B2", 2026-06-15). |
| `fillSymbolStructurePreopenForDate` | Same `06:30 ET` `PreopenMetadataVolStructure` callback, after option-chain ingest completes | `OptionChainTable`, `SymbolMetaData` | GEX rollups, zero gamma, max pain, chain contract count, `underlying_type`, spot/meta fields; skips IV fields |
| `fillSymbolStructureForDate(phase:'final')` | Same `17:00 ET` `FinalMetadataVolStructure` callback, after meta(final) + `computeSymbolVolDailyForDate(final)` | `OptionChainTable`, `SymbolMetaData` | Same preopen fields plus IV30, IV rank, IV percentile, and vol as-of date |

The structure fills are merge-safe partial inserts. They write zero-valued flow states so they do
not change `premium`, `trade_count`, or DEX sums. Manual backfill scripts under
`scripts/clickhouse/backfill/` are for post-migration historical rehydration, not normal daily
operation. Do not run full flow backfill on a live date that already received trade inserts because
that can double-count additive flow states.

Retention (`deleteOldData`, 20:00 ET, production-only) prunes 7 ClickHouse tables —
`AggregatedOptionTrades`, `RawOptionTrades`, `OptionChainTable`, `SymbolMetaData`,
`SymbolVolDaily`, `mv_contract_rank_flow`, and `mv_symbol_day_flow` (the loop labels in
`deleteOldData.ts:16-20` read `AggregateOptionTrades`/`OptionChainData`, but the physical
targets are `AggregatedOptionTrades`/`OptionChainTable`). The frozen legacy
`mv_contract_day_flow` is intentionally **not** in the deletion list.

### Verification Queries

Flow parity for a date:

```sql
WITH toDate('2026-06-08') AS d
SELECT
  raw.raw_trade_count,
  mv.mv_trade_count,
  mv.mv_trade_count - raw.raw_trade_count AS trade_count_delta,
  raw.raw_premium,
  mv.mv_premium,
  round(mv.mv_premium - raw.raw_premium, 2) AS premium_delta
FROM (
  SELECT
    sum(toInt64(trade_count)) AS raw_trade_count,
    sum(premium) AS raw_premium
  FROM AggregatedOptionTrades
  WHERE date = d
) AS raw
CROSS JOIN (
  SELECT
    sum(mv_trade_count) AS mv_trade_count,
    sum(mv_premium) AS mv_premium
  FROM (
    SELECT
      option_symbol,
      sumMerge(trade_count) AS mv_trade_count,
      sumMerge(premium) AS mv_premium
    FROM mv_contract_rank_flow
    WHERE date = d
    GROUP BY option_symbol
  )
) AS mv;
```

Contract structure coverage for a date:

```sql
WITH toDate('2026-06-08') AS d
SELECT
  count() AS contracts,
  countIf(mv_trade_count = 0) AS structure_only_contracts,
  countIf(mv_prev_oi IS NOT NULL AND mv_prev_oi > 0) AS contracts_with_prev_oi,
  countIf(mv_oi > 0) AS contracts_with_oi,
  countIf(mv_latest_trade_price IS NOT NULL AND mv_latest_trade_price > 0) AS contracts_with_price_or_mark
FROM (
  SELECT
    option_symbol,
    sumMerge(trade_count) AS mv_trade_count,
    argMaxMerge(prev_oi) AS mv_prev_oi,
    argMaxMerge(oi) AS mv_oi,
    argMaxMerge(latest_trade_price) AS mv_latest_trade_price
  FROM mv_contract_rank_flow
  WHERE date = d
  GROUP BY option_symbol
);
```

---

## State Machine Diagrams

### 1. Symbol Metadata Fallback Chain (per symbol)

Runs as the symbol-metadata stage of two combined cron jobs: 06:30 ET
`PreopenMetadataVolStructure` (`phase=preopen`) and 17:00 ET `FinalMetadataVolStructure`
(`phase=final`). The `phase` flows into logging/metrics; default is `'final'`.  
Source: `sync-symbol-meta/service.ts:501-502 (skipped), 606-722 (runHistoryFallbackChain), 800-883 (reference stage; primary call enrichWithPolygonReference at 803), 982 (completed), 996 (failed)`.  
Reference-stage implementation: `sync-symbol-meta/api/polygon-reference.ts:46`.

```
  06:30 ET preopen / 17:00 ET final cron fires
           │
           ▼
  ┌──────────────────────────┐
  │  isTradingDate(today)?   │
  └──────────┬───────────────┘
          NO │                 YES
             ▼                  │
      ┌────────────┐            ▼
      │  SKIPPED   │   ┌──────────────────────────────────────────────────────┐
      │(non_trading│   │            HISTORY STAGE                             │
      │  _date)    │   │   runHistoryFallbackChain()  (service.ts:606-722)    │
      └────────────┘   │                                                      │
                       │   EQUITY symbols:                                    │
                       │   ┌────────────┐  empty   ┌────────┐  fail  ┌─────┐ │
                       │   │Massive/Poly│─────────►│ Alpaca │───────►│Long │ │
                       │   │   (primary)│          │(fallbk1│        │port │ │
                       │   └─────┬──────┘          └────────┘        └──┬──┘ │
                       │         │ ok                                    │    │
                       │         └───────────────────────────────────────┘    │
                       │                       ▼                              │
                       │   INDEX symbols (SPX/NDX/VIX/RUT/DJI/WSB):          │
                       │   ┌────────────┐  empty   ┌──────────┐              │
                       │   │Massive/Poly│─────────►│ LongPort │              │
                       │   └────────────┘          │(no Alpaca fallback)     │
                       │                           └──────────┘              │
                       │                                                      │
                       │   LONGPORT SESSION-CAP GUARD:                        │
                       │   isLongportSessionCapError ──► disableLongportForRun│
                       │   (all remaining symbols skip LongPort for this run) │
                       └──────────────────────────────────────────────────────┘
                                         │
                                         ▼
                       ┌──────────────────────────────────────────────────────┐
                       │             REFERENCE STAGE                          │
                       │   enrichWithPolygonReference()                       │
                       │   (impl: polygon-reference.ts:46; call site:         │
                       │    service.ts:800-883, primary call at 803)          │
                       │                                                      │
                       │   ┌──────────────────────┐  404/empty               │
                       │   │ Polygon Reference     │──────────────┐           │
                       │   │     (primary)         │              │           │
                       │   └──────────┬────────────┘              ▼           │
                       │              │ ok               ┌──────────────────┐ │
                       │              │                  │ LongPort Static  │ │
                       │              │                  │(non-fatal fallbk)│ │
                       │              │                  └──────────────────┘ │
                       └──────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  ClickHouse UPSERT     │
                          │  SymbolMetaData        │
                          │  (batched, BATCH_COUNT)│
                          └───────────┬────────────┘
                                      │
                            ┌─────────┴──────────┐
                            │                    │
                  thrown fatal error?      all symbols done
                  (outer catch,                  │
                   service.ts:996)               ▼
                            │             ┌─────────────┐
                            ▼             │  COMPLETED  │
                       ┌─────────┐        └─────────────┘
                       │  FAILED │              ▲
                       └─────────┘              │
                                                │
   threshold breach (>= 100 abs OR >= 5% of tickerCount for
   aggregatesNoData / aggregatesErrors / referenceErrors /
   reference anomalies / outerErrors) emits a P-level ERROR ALERT
   (shouldEscalate -> logErrorHandler only) but the run STILL COMPLETES.

Run terminal states: "completed" | "skipped" | "failed"  (service.ts:982, 501, 996)
```

The 100/0.05 thresholds (`shouldEscalate`, `service.ts:202-208`) gate **alerts**, not the
FAILED state — they only emit P-level error logs/alerts via `logErrorHandler`. A run becomes
`failed` **only** when an exception is thrown and caught by the outer catch (`service.ts:996`).

**Constants** (`service.ts:54-55`):

| Constant | Value |
|---|---|
| `ERROR_ALERT_THRESHOLD_ABSOLUTE` | 100 |
| `ERROR_ALERT_THRESHOLD_RATIO` | 0.05 (5%) |

On the 17:00 final run, a non-`completed`/zero-row metadata result short-circuits the rest of
the `FinalMetadataVolStructure` callback — the downstream vol-surface and final symbol-structure
fills are skipped (`app.ts:228-240`). The symbol-metadata publish also preserves previously
computed IV fields (`iv30`, `iv_rank_1y`, `iv_percentile_1y`, `vol_date`, `vol_updated_timestamp`)
when republishing the same date, so a re-run before the vol stage does not wipe IV.

---

### 2. Option Chain Snapshot Pipeline

Runs daily at 06:30 ET (the option-chain stage of the `PreopenMetadataVolStructure` callback).  
Source: `optionchain-data/index.ts:347-587 (FetchOptionChainDataService outer pipeline), 153-345 (processRequestPlan per-ticker)`.

```
  06:30 ET cron fires
           │
           ▼
  ┌──────────────────────────────────────────────────┐
  │             OUTER PIPELINE                       │
  │  step tracking: string field                     │
  │  (index.ts:354 init; 378, 383, 391, 438)         │
  │                                                  │
  │  init                                            │
  │   ▼                                              │
  │  deleteTodayOptionChainData                      │
  │   ▼                                              │
  │  fetchPriorOiMap                                 │
  │   ▼                                              │
  │  fetchTickersAndHvMap                            │
  │   ▼                                              │
  │  processBatch_1  processBatch_2 ...(CONCURRENCY=15)│
  │                                                  │
  └───────────────────┬──────────────────────────────┘
                      │  per ticker (processRequestPlan, index.ts:153-345)
                      ▼
  ┌──────────────────────────────────────────────────┐
  │          PER-TICKER FALLBACK CHAIN               │
  │                                                  │
  │  EQUITY tickers:                                 │
  │  ┌───────────────┐  fail  ┌────────┐  fail ┌───┐ │
  │  │Massive/Polygon│───────►│ Alpaca │──────►│LP │ │
  │  │  (primary)    │        │(fallbk1│       │   │ │
  │  └──────┬────────┘        └────────┘       └───┘ │
  │         │ ok                                      │
  │                                                   │
  │  INDEX tickers (SPX/XSP/SPXW etc.):              │
  │  ┌───────────────┐  fail  ┌────────┐             │
  │  │Massive/Polygon│───────►│ Alpaca │  (no LP)    │
  │  └───────────────┘        └────────┘             │
  └───────────────────┬──────────────────────────────┘
                      │
                      ▼
  ┌──────────────────────────────────────────────────┐
  │          CLICKHOUSE WRITE (with retry)           │
  │                                                  │
  │  attempt 1 ──► fail ──► wait 1 000 ms            │
  │  attempt 2 ──► fail ──► wait 2 000 ms            │
  │  attempt 3 ──► fail ──► throw                    │
  │  attempt N ──► ok   ──► INSERT OptionChainTable  │
  │                         (linear backoff: 1s × n) │
  └──────────────────────────────────────────────────┘
```

---

### 3. Daily Vol Surface Gating (`symbolVolDaily`)

Runs as the vol-surface stage of two combined cron jobs: 06:30 ET
`PreopenMetadataVolStructure` (`phase=preopen`, after the option-chain ingest) and 17:00 ET
`FinalMetadataVolStructure` (`phase=final`, after `SyncSymbolMetaService` final).  
Source: `symbolVolDaily/service.ts:22-32` (constants), `:186-193` (zero-row skip inside `publishSymbolVolDailyForDate`, 180-252), `:333-352` (low-row P1 alert), `:353-365` (publish-failure catch/rethrow).

```
  06:30 ET preopen / 17:00 ET final cron fires
           │
           ▼
  ┌──────────────────────────┐
  │  isTradingDate(today)?   │
  └──────────┬───────────────┘
         NO  │              YES
             ▼               │
       ┌──────────┐          ▼
       │  SKIP    │  ┌────────────────────────────────┐
       │(no-op;   │  │  computeSymbolVolDailyForDate() │
       │ preserve │  │  reads OptionChainTable         │
       │ prior    │  └──────────────┬─────────────────┘
       │snapshot) │                 │ produces out[]
       └──────────┘                 │
                                    │ passed to publishSymbolVolDailyForDate()
                                    │ (service.ts:186-193)
                                    │
               ┌────────────────────┴─────────────────────┐
               │                                           │
          out.length == 0                          out.length > 0
          (service.ts:186-193)                            │
               │                                           ▼
               ▼                          ┌──────────────────────────────────┐
       ┌──────────────┐                   │  PUBLISH (always runs first):    │
       │ SKIP PUBLISH │                   │  ALTER TABLE SymbolMetaData      │
       │ log info;    │                   │  UPDATE iv30, iv_rank_1y,        │
       │ prior data   │                   │  iv_percentile_1y, vol_date,     │
       │ preserved    │                   │  vol_updated_timestamp,          │
       └──────────────┘                   │  skew_25d_30d, atm_iv_30d,       │
                                          │  butterfly_25d_30d,              │
                                          │  iv_term_slope_30_90             │
                                          │  WHERE date AND symbol IN (...)  │
                                          │  chunked by UPDATE_CHUNK=250     │
                                          └────────────────┬─────────────────┘
                                                           │
                              ┌────────────────────────────┴───────────┐
                              │ ADDITIONALLY, if 0 < out.length         │
                              │ < MIN_ROWS (500) AND isTradingDate      │
                              │ AND MIN_ROWS > 0 (service.ts:333-352):  │
                              │ P1 ALERT (logErrorHandler) — publish    │
                              │ already happened, this is extra.        │
                              └────────────────────────────┬───────────┘
                                                           ▼
                                                    ┌─────────────┐
                                                    │  COMPLETE   │
                                                    └─────────────┘

  Exception in publish ──► log error + rethrow (service.ts:353-365)
```

The low-row case is **not** a separate publish path: publish (the `ALTER...UPDATE`) always runs
first, then the P1 low-row alert fires in addition when `0 < out.length < MIN_ROWS` on a trading
date. Publish does **not** delete+insert into a `SymbolVolDaily` table; the IV/vol fields are an
in-place mutation of `SymbolMetaData` (the standalone `SymbolVolDaily` table is retired).

**Constants** (`service.ts:22-32`):

| Constant | Value |
|---|---|
| `SYMBOL_VOL_DAILY_MIN_PUBLISHED_ROWS` | 500 (env-overridable, must be finite ≥ 0) |
| `CHAIN_BATCH` | 75 |
| `PRIOR_IV_SYMBOL_BATCH` | 250 |
| `UPDATE_CHUNK` | 250 |
