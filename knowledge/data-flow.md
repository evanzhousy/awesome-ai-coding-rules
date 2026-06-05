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
│  │  mv_symbol_day_flow    (MV / backfill-only, no cron)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

  Side: tradingflow-cron-service-lambda ──► CanaryCheckLambda (every 5 min, canary only)
```

---

## Production Cron Schedule

All jobs run in the `America/New_York` timezone, Mon–Fri.  
Wrapper: `runScheduledJob()` (`app.ts:47-73`) logs begin/finished/failed with durations.

| Cron expression           | Job                            | Source       | Notes                                         |
|---------------------------|--------------------------------|--------------|-----------------------------------------------|
| `*/5 * * * *`             | `sendBetterStackHeartbeat`     | app.ts:133   | Uptime heartbeat                              |
| `30 6 * * 1-5`            | `FetchOptionChainDataService`  | app.ts:140   | 06:30 ET — option chain snapshot              |
| `30 9 * * 1-5`            | `CheckCFServiceDataController` | app.ts:151   | 09:30 ET — CF worker data check               |
| `0 19 * * 1-5`            | `SyncSymbolMetaService`        | app.ts:160   | 19:00 ET — symbol metadata ETL                |
| `30 19 * * 1-5`           | `ComputeSymbolVolDailyDaily`   | app.ts:172   | 19:30 ET — IV30 surface; `isTradingDate` gate |
| `0 20 * * 1-5`            | `deleteOldData`                | app.ts:190   | 20:00 ET — retention cleanup                  |
| `setInterval(86_400_000)` | `cleanupLogs`, `cleanupSyncUwSmokeData` | app.ts:199,205 | Rolling 24 h                        |

Also: `CheckCFServiceDataController.run()` invoked once at startup (app.ts:107).

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

