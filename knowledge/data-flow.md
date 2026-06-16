# TradingFlow Data Pipeline

## Overview

The primary ETL is **`tradingflow-process-service-ec2`** — a long-running TypeScript/Node 20
service on EC2 managed by `forever` (entry: `dist/app.js`, launch: `run_process_service.sh`).
Daily ETL runs inside this process, scheduled via `node-cron`. A secondary
**`tradingflow-cron-service-lambda`** (AWS Lambda, CloudWatch `cron(0/5 * ? * * *)`) exists but
currently only runs `CanaryCheckLambda` — the original AppSync fetcher is disabled.

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
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │optionchain-data│  │sync-symbol-  │  │  symbolVolDaily     │ │
│  │(06:30 ET snap) │  │meta (19:00ET)│  │  (19:30 ET)         │ │
│  │                │  │fallback chain│  │  IV30 surface       │ │
│  │                │  │              │  │                     │ │
│  └───────┬────────┘  └──────┬───────┘  └──────────┬──────────┘ │
│          │                  │                      │            │
│          ▼                  │                      ▼            │
│  ┌────────────────────┐     │        ┌───────────────────────┐ │
│  │FillContractStruct. │     │        │ FillSymbolStructure   │ │
│  │FillSymbolPreopen   │     │        │ final after VolDaily  │ │
│  └────────┬───────────┘     │        └───────────┬───────────┘ │
└──────────┼─────────────────-┼────────────────────-─┼────────────┘
           │                  │                       │
           ▼                  ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA DESTINATIONS                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ClickHouse Cloud                      │  │
│  │  SymbolMetaData       (sync-symbol-meta)                 │  │
│  │  SymbolVolDaily        (symbolVolDaily)                  │  │
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

All jobs run in the `America/New_York` timezone, Mon–Fri.  
Wrapper: `runScheduledJob()` (`app.ts:47-73`) logs begin/finished/failed with durations.

| Cron expression           | Job                            | Notes |
|---------------------------|--------------------------------|-------|
| `*/5 * * * *`             | `sendBetterStackHeartbeat`     | Uptime heartbeat |
| `30 6 * * 1-5`            | `FetchOptionChainDataService`  | 06:30 ET option chain snapshot. After it completes on a trading date, the same callback runs `FillContractStructure` and `FillSymbolStructurePreopen`. |
| `30 9 * * 1-5`            | `CheckCFServiceDataController` | 09:30 ET CF worker data check |
| `0 19 * * 1-5`            | `SyncSymbolMetaService`        | 19:00 ET symbol metadata ETL |
| `30 19 * * 1-5`           | `ComputeSymbolVolDailyDaily`   | 19:30 ET IV30 surface; `isTradingDate` gate. After it completes on a trading date, the same callback runs `FillSymbolStructure`. |
| `0 20 * * 1-5`            | `deleteOldData`                | 20:00 ET retention cleanup |
| `setInterval(86_400_000)` | `cleanupLogs`, `cleanupSyncUwSmokeData` | Rolling 24 h |

Also: `CheckCFServiceDataController.run()` invoked once at startup (app.ts:107).

---

## ClickHouse Mart Maintenance

The daily marts have two update paths. This split is intentional and is the current production
contract.

| Mart | Flow columns | Structure columns |
|---|---|---|
| `mv_symbol_day_flow` | ClickHouse materialized view trigger on `AggregatedOptionTrades` inserts | `FillSymbolStructurePreopen` after option-chain ingest for chain/GEX/meta fields; `FillSymbolStructure` final after `ComputeSymbolVolDailyDaily` for volatility fields |
| `mv_contract_rank_flow` | ClickHouse materialized view trigger on `AggregatedOptionTrades` inserts | `FillContractStructure` in `tradingflow-process-service-ec2`, chained after `FetchOptionChainDataService` (dual-fills the legacy `mv_contract_day_flow` until decommission) |

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
| `FillContractStructure` | Same `06:30 ET` cron callback, after option-chain ingest completes | `OptionChainTable`, prior `OptionChainTable` date | `oi`, `daily_volume`, `prev_oi`, `bid`, `ask`, `iv`, `delta`, greeks, identity fields, plus the `latest_trade_price` chain-close mark for non-traded contracts (009 print-else-mark; `underlying_type` is symbol scope and no longer written here) |
| `FillSymbolStructurePreopen` | Same `06:30 ET` cron callback, after option-chain ingest completes | `OptionChainTable`, `SymbolMetaData` | GEX rollups, zero gamma, max pain, chain contract count, `underlying_type`, spot/meta fields; skips IV fields |
| `FillSymbolStructure` | Same `19:30 ET` cron callback, after `SymbolVolDaily` completes | `OptionChainTable`, `SymbolMetaData`, `SymbolVolDaily` | Same preopen fields plus IV30, IV rank, IV percentile, and vol as-of date |

The structure fills are merge-safe partial inserts. They write zero-valued flow states so they do
not change `premium`, `trade_count`, or DEX sums. Manual backfill scripts under
`scripts/clickhouse/backfill/` are for post-migration historical rehydration, not normal daily
operation. Do not run full flow backfill on a live date that already received trade inserts because
that can double-count additive flow states.

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

Runs daily at 19:00 ET.  
Source: `sync-symbol-meta/service.ts:442 (skipped), 543-659 (runHistoryFallbackChain), 737-806 (reference stage call site), 926,931 (completed/failed)`.  
Reference-stage implementation: `sync-symbol-meta/api/polygon-reference.ts:46`.

```
  19:00 ET cron fires
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
      │  _date)    │   │   runHistoryFallbackChain()  (service.ts:535-651)    │
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
                       │    service.ts:737-806)                               │
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
                     fatal errors?          all symbols done
                   > 100 abs OR > 5%             │
                            │                    ▼
                            ▼             ┌─────────────┐
                       ┌─────────┐        │  COMPLETED  │
                       │  FAILED │        └─────────────┘
                       └─────────┘

Run terminal states: "completed" | "skipped" | "failed"  (service.ts:442, 926, 931)
```

**Constants** (`service.ts:52-53`):

| Constant | Value |
|---|---|
| `ERROR_ALERT_THRESHOLD_ABSOLUTE` | 100 |
| `ERROR_ALERT_THRESHOLD_RATIO` | 0.05 (5%) |

---

### 2. Option Chain Snapshot Pipeline

Runs daily at 06:30 ET.  
Source: `optionchain-data/index.ts:116-376`, `265-288`.

```
  06:30 ET cron fires
           │
           ▼
  ┌──────────────────────────────────────────────────┐
  │             OUTER PIPELINE                       │
  │  step tracking: string field (index.ts:308-376)  │
  │                                                  │
  │  init                                            │
  │   ▼                                              │
  │  deleteTodayOptionChainData                      │
  │   ▼                                              │
  │  fetchPriorOiMap                                 │
  │   ▼                                              │
  │  fetchTickersAndHvMap                            │
  │   ▼                                              │
  │  processBatch_1  processBatch_2  ... (CONC=15)   │
  │                                                  │
  └───────────────────┬──────────────────────────────┘
                      │  per ticker (processTicker, index.ts:116-299)
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

Runs at 19:30 ET (after `SyncSymbolMetaService` at 19:00).  
Source: `symbolVolDaily/service.ts:23-33` (constants), `:182-189` (zero-row skip inside `publishSymbolVolDailyForDate`), `:281-313` (low-row P1 alert + catch/rethrow).

```
  19:30 ET cron fires
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
                                    │ (service.ts:182-189)
                                    │
               ┌────────────────────┼─────────────────────┐
               │                    │                      │
          out.length == 0    0 < out.length         out.length >=
          (service.ts:182)  < MIN_ROWS (500)        MIN_ROWS (500)
               │             AND isTradingDate        │
               ▼             (service.ts:283-301)     ▼
       ┌──────────────┐             │         ┌─────────────────┐
       │ SKIP PUBLISH │             ▼         │ DELETE today's  │
       │ log info;    │     ┌──────────────┐  │ SymbolVolDaily  │
       │ prior data   │     │ PUBLISH rows │  │ INSERT new rows │
       │ preserved    │     │ (INSERT)     │  └────────┬────────┘
       └──────────────┘     │     +        │           │
                            │  P1 ALERT   │           ▼
                            │logErrorHandl│   ┌─────────────┐
                            └─────────────┘   │  COMPLETE   │
                                               └─────────────┘

  Exception in publish ──► log error + rethrow (service.ts:302-313)
```

**Constants** (`service.ts:23-33`):

| Constant | Value |
|---|---|
| `SYMBOL_VOL_DAILY_MIN_PUBLISHED_ROWS` | 500 (env-overridable, must be finite ≥ 0) |
| `INSERT_SINGLE_SHOT_MAX` | 2 000 |
| `INSERT_CHUNK` | 2 000 |
| `CHAIN_BATCH` | 150 |
| `PRIOR_IV_SYMBOL_BATCH` | 500 |
