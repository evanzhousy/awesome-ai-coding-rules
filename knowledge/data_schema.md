# Data Schema

> **Concepts Reference**: [OptionData Product Concepts](./basic_concepts.md)
> **Last Updated**: 2026-06-19

This document describes all persistent data stores: the ClickHouse analytics tables used for options flow and chain data, and the Neon Postgres table used for user persistence.

---

## Table of Contents

### ClickHouse — Base Tables
1. [AggregatedOptionTrades](#aggregatedoptiontrades)
2. [RawOptionTrades](#rawoptiontrades)
3. [OptionChainTable](#optionchaintable)
4. [SymbolMetaData](#symbolmetadata)

### ClickHouse — Materialized Views
5. [mv_symbol_day_flow](#mv_symbol_day_flow)
6. [mv_contract_rank_flow](#mv_contract_rank_flow)

### ClickHouse — Derived Tables
7. [SymbolVolDaily](#symbolvoldaily)

### Neon Postgres
8. [users](#users)

---

## AggregatedOptionTrades

Real-time option trades in **aggregated** mode: trades for the same option symbol executed in the same second are consolidated into a single row. Use for identifying block trades and unusual flow; see [Aggregation Mode](./basic_concepts.md#aggregation-mode) in basic concepts.

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Trade date |
| `time` | DateTime | Trade time (second-level; aggregation key) |
| `symbol` | String | Underlying symbol (e.g. AAPL, TSLA) |
| `option_symbol` | String | Full option symbol (e.g. OCC format) |
| `put_call` | String | `CALL` or `PUT` |
| `strike` | Float32 | Strike price |
| `expiration_date` | Date | Option expiration |
| `expiry_days` | Int32 | Days to expiration (DTE) |
| `size` | Int32 | Number of contracts (summed when aggregated) |
| `trade_count` | Int32 | Number of raw trades aggregated (≥ 1) |
| `price` | Float32 | Option price (avg when aggregated) |
| `premium` | Int32 | Total dollar value: price × size × 100 (summed) |
| `bid` | Float32 | Bid price |
| `ask` | Float32 | Ask price |
| `bid_size` | Int64 | Bid size |
| `ask_size` | Int64 | Ask size |
| `underlying_price` | Float32 | Underlying price at trade time |
| `underlying_type` | String | Underlying asset type |
| `side` | String | Execution vs spread: `AASK`, `ASK`, `MID`, `BID`, `BBID` — see [Trade Execution Side](./basic_concepts.md#trade-execution-side-side-field) |
| `sentiment` | String | Inferred: `BULLISH`, `BEARISH`, `NEUTRAL` — see [Sentiment Derivation](./basic_concepts.md#sentiment-derivation-sentiment-field) |
| `moneyness` | String | `ITM`, `ATM`, `OTM` — see [Moneyness](./basic_concepts.md#moneyness-classification-moneyness-field) |
| `option_activity_type` | String | Execution mechanism (e.g. AUTO, MLET) — see [Trade Activity Types](./basic_concepts.md#trade-activity-types-option_activity_type-field) |
| `exchange` | String | Exchange identifier |
| `oi` | Int32 | Open interest (prior day; not real-time) |
| `daily_volume` | Int32 | Daily volume for the option |
| `iv` | Float32 | Implied volatility |
| `delta` | Float32 | Delta (price sensitivity to $1 move in underlying) |
| `gamma` | Float32 | Gamma |
| `vega` | Float32 | Vega |
| `theta` | Float32 | Theta |
| `rho` | Float32 | Rho |
| `dex` | Int32 | Delta exposure: delta × size (directional exposure) — see [Delta Exposure (DEX)](./basic_concepts.md#delta-exposure-dex) |
| `dei` | Float32 | Delta impact: dex ÷ avg_daily_volume — see [Delta Impact (DEI)](./basic_concepts.md#delta-impact-dei) |
| `earning_date` | Date | Next earnings date (if available) |
| `market_cap` | UInt128 | Underlying market cap |
| `updated_timestamp` | UInt64 | ETL/update timestamp |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Order**: `ORDER BY (symbol, date, time)`  
**Settings**: `index_granularity = 8192`

---

## RawOptionTrades

Unaggregated option trades (raw Time & Sales). Use when you need exact trade-level detail; see [Aggregation Mode](./basic_concepts.md#aggregation-mode) (RAW vs AGGREGATED).

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Trade date |
| `time` | DateTime64(3, 'America/New_York') | Trade timestamp (millisecond) |
| `symbol` | LowCardinality(String) | Underlying symbol |
| `put_call` | Enum8('CALL' = 1, 'PUT' = 2) | Option type |
| `strike` | Decimal(9, 3) | Strike price |
| `expiration_date` | Date | Expiration date |
| `size` | UInt32 | Contracts traded |
| `price` | Decimal(9, 4) | Trade price |
| `bid` | Decimal(9, 4) | Bid |
| `ask` | Decimal(9, 4) | Ask |
| `underlying_price` | Decimal(9, 4) | Underlying at trade time |
| `iv` | Decimal(9, 4) | Implied volatility |
| `delta` | Decimal(9, 4) | Delta |
| `gamma` | Decimal(9, 6) | Gamma |
| `oi` | UInt32 | Open interest |
| `dei` | Decimal(9, 4) | Delta impact |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY (symbol, time)`  
**Order**: `ORDER BY (symbol, time, put_call, expiration_date, strike)`  
**Settings**: `index_granularity = 8192`

---

## OptionChainTable

Snapshot of the option chain: OI, volume, Greeks, and quotes per strike/expiration. Use for “where is the market positioned?” and GEX/walls; see [Option Chain vs Option Flow](./basic_concepts.md#option-chain-vs-option-flow) and [Open Interest (OI)](./basic_concepts.md#open-interest-oi).

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | String | Underlying symbol |
| `date` | Date | Snapshot date |
| `option_symbol` | String | Full option symbol |
| `put_call` | LowCardinality(String) | `CALL` or `PUT` |
| `strike` | Float32 | Strike price |
| `expiration_date` | Date | Expiration |
| `expiry_days` | Int32 | Days to expiration |
| `oi` | Int32 | Open interest |
| `daily_volume` | Int32 | Daily volume |
| `bid` | Float32 | Bid |
| `ask` | Float32 | Ask |
| `close` | Float32 | Closing/settlement price |
| `iv` | Float32 | Implied volatility |
| `historical_volatility` | Float32 | Historical volatility |
| `delta` | Float32 | Delta |
| `gamma` | Float32 | Gamma |
| `vega` | Float32 | Vega |
| `theta` | Float32 | Theta |
| `oi_change_1d` | Int64 | Daily OI change: today's OI minus prior day's OI (default 0; computed at ingestion; type aligned with `oi`) |
| `updated_timestamp` | UInt64 | ETL/update timestamp |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY (symbol, option_symbol)`  
**Settings**: `index_granularity = 8192`

---

## SymbolMetaData

Per-symbol, per-day metadata: price, volume, fundamentals, and classification. Use for filtering and joining with flow/chain tables. It is also the **physical home of the logical "SymbolVolDaily" volatility surface**: the IV/vol columns below are written back nightly by the process-service `symbolVolDaily` batch via `ALTER TABLE SymbolMetaData UPDATE` on existing rows (not by the `sync-symbol-meta` insert).

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | String | Underlying symbol |
| `date` | Date | Data date |
| `underlying_type` | String | Asset type (e.g. equity, index) |
| `exchange` | String | Primary exchange |
| `description` | String | Company/asset description |
| `sector` | String | Sector classification |
| `open` | Float32 | Open price |
| `high` | Float32 | High price |
| `low` | Float32 | Low price |
| `close` | Float32 | Close price |
| `last` | Float32 | Last traded price |
| `pre_close` | Float32 | Previous close |
| `change_percentage` | Float32 | Day-over-day change % |
| `volume` | Int32 | Daily share volume |
| `average_stock_volume` | UInt32 | Average daily volume |
| `outstanding_shares` | UInt64 | Shares outstanding |
| `market_cap` | UInt64 | Market capitalization |
| `historical_volatility` | Float32 | Historical volatility |
| `earning_date` | Date | Next earnings date (if known) |
| `iv30` | Nullable(Float32) | ATM 30-DTE implied volatility (IV/vol batch) |
| `iv_rank_1y` | Nullable(Float32) | IV rank, 0–1 (IV/vol batch) |
| `iv_percentile_1y` | Nullable(Float32) | IV percentile, 0–1 (IV/vol batch) |
| `vol_date` | Nullable(Date) | As-of date for the IV/vol inputs |
| `vol_updated_timestamp` | Nullable(UInt64) | Epoch (ms) of the last IV/vol update |
| `skew_25d_30d` | Nullable(Float32) | 25Δ 30-DTE skew |
| `atm_iv_30d` | Nullable(Float32) | ATM 30-DTE IV (equals `iv30` by construction) |
| `butterfly_25d_30d` | Nullable(Float32) | 25Δ 30-DTE butterfly |
| `iv_term_slope_30_90` | Nullable(Float32) | IV term-structure slope, 30→90 DTE |

> The nine IV/vol columns (`iv30` … `iv_term_slope_30_90`) are added by one-time DDL (webapp `008_alter_symbol_metadata_iv_fields.sql` for the first five; process-service `sql/symbolmeta-add-iv-skew-term.sql` for the last four) and populated by a separate daily volatility batch (process-service `symbolVolDaily`) via `ALTER … UPDATE` on existing rows — the `sync-symbol-meta` insert does not write them. They are the live store of the metrics formerly held in the standalone `SymbolVolDaily` table.

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY symbol`  
**Settings**: `index_granularity = 8192`

---

## mv_symbol_day_flow

Canonical **symbol-day daily mart** at `(date, symbol)` grain. It combines live flow aggregates from `AggregatedOptionTrades` with structure, metadata, volatility, and GEX fields populated by batch/backfill writes.

> **No longer read by any live webapp surface (v1, 2026-06-11).** The Symbol-level page was consolidated into the Contract-level **Symbols** tab, which is derived from `mv_contract_rank_flow` (the contract snapshot) joined with the `SymbolMetaData` catalog (which now carries the IV/vol surface — see below); the `mv_symbol_day_flow` Day Trend reader and the `marketRankList.ts` list/universe queries were deleted. There are **zero live webapp readers** — every remaining `mv_symbol_day_flow` reference in the webapp is a comment or test (a unit test actively asserts the contract symbol-context CTE does *not* read it). The mart is still **populated** (the `fillSymbolStructure` preopen/final crons plus the `004`/`007` trade MVs trigger on `AggregatedOptionTrades` INSERTs).

**Write paths**:
- **Flow (live)**: materialized view on `AggregatedOptionTrades` INSERT. Flow columns and `trade_count` are populated immediately; structure columns receive no-op `argMaxState` values until batch structure rows win on merge.
- **Structure preopen (batch/backfill)**: after option-chain ingest, process-service writes chain/GEX and stable metadata fields from `OptionChainTable` and latest `SymbolMetaData.date <= date`. It also writes `underlying_type` from `SymbolMetaData` so structure-present rows classify stocks/ETFs/indexes before the first trade. Volatility fields are skipped.
- **Structure final (batch/backfill)**: after the `symbolVolDaily` IV/vol batch writes the IV columns onto `SymbolMetaData`, process-service rewrites the same structure fields with a later structure version and adds `iv30`, `iv_rank_1y`, `iv_percentile_1y`, and `vol_date` (read from `SymbolMetaData`).

**Presence checks are query-time derived, not stored**: flow-present when `sumMerge(trade_count) > 0 OR sumMerge(total_premium) > 0`; structure-present when `argMaxMerge(chain_contract_count) > 0`.

| Column | Type | Source | Description |
| ------ | ---- | ------ | ----------- |
| `date` | Date | key | Symbol-day key |
| `symbol` | String | key | Underlying symbol |
| `underlying_type` | AggregateFunction(any, String) | flow + structure | Asset type (coalesced; defaults to `'INDEX'` if empty); structure fill reads `SymbolMetaData.underlying_type` |
| `total_premium` | AggregateFunction(sum, Int32) | flow | Total premium |
| `call_premium` | AggregateFunction(sumIf, Int32, UInt8) | flow | Call-side premium |
| `put_premium` | AggregateFunction(sumIf, Int32, UInt8) | flow | Put-side premium |
| `net_dex` | AggregateFunction(sum, Int64) | flow | Net signed delta exposure (bullish +, bearish -) |
| `net_dei` | AggregateFunction(sum, Float64) | flow | Net signed delta impact |
| `last_trade_time` | AggregateFunction(max, DateTime) | flow | Latest trade time in the day |
| `earning_date` | AggregateFunction(any, Date) | flow | Next earnings date |
| `trade_count` | AggregateFunction(sum, Int64) | flow | Raw trade count |
| `snapshot_spot` | AggregateFunction(argMax, Nullable(Float32), UInt64) | structure | Underlying spot at snapshot (`SymbolMetaData.last`) |
| `average_stock_volume` | AggregateFunction(argMax, Nullable(UInt64), UInt64) | structure | Average daily stock volume from latest `SymbolMetaData.date <= date` |
| `market_cap` | AggregateFunction(argMax, Nullable(UInt64), UInt64) | structure | Market capitalization |
| `sector` | AggregateFunction(argMax, String, UInt64) | structure | Sector classification |
| `iv30` | AggregateFunction(argMax, Nullable(Float32), UInt64) | final structure | ATM IV around 30 DTE (from `SymbolMetaData.iv30`, written by the `symbolVolDaily` batch) |
| `iv_rank_1y` | AggregateFunction(argMax, Nullable(Float32), UInt64) | final structure | IV rank, 0-1 |
| `iv_percentile_1y` | AggregateFunction(argMax, Nullable(Float32), UInt64) | final structure | IV percentile, 0-1 |
| `vol_date` | AggregateFunction(argMax, Nullable(Date), UInt64) | final structure | As-of date for volatility metrics |
| `chain_contract_count` | AggregateFunction(argMax, UInt32, UInt64) | structure | Contracts in chain snapshot |
| `call_gex` | AggregateFunction(argMax, Float64, UInt64) | structure | Sum of call-side GEX (`gamma * oi * 100`) |
| `put_gex_signed` | AggregateFunction(argMax, Float64, UInt64) | structure | Sum of put-side signed GEX |
| `zero_gamma_level` | AggregateFunction(argMax, Nullable(Float64), UInt64) | structure | Interpolated zero-gamma strike |
| `neg_gex_centroid` | AggregateFunction(argMax, Nullable(Float64), UInt64) | structure | Gamma-weighted centroid of negative net-GEX strikes |
| `neg_gex_concentration` | AggregateFunction(argMax, Nullable(Float64), UInt64) | structure | Top-3 negative GEX concentration, 0-1 |
| `max_pain_strike` | AggregateFunction(argMax, Nullable(Float64), UInt64) | structure | Minimum total OI pain strike |

**Compute at query time, do not store**: `net_put_premium`, `call_pct`, `sentiment`, `gross_gex`, `net_gex`, `gamma_regime`, `gex_ratio`, `flip_distance`, `above_flip`, `squeeze_score`, `max_pain_distance`.

- **Engine**: `SharedAggregatingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`
- **Partition**: `PARTITION BY date`
- **Order**: `ORDER BY (date, symbol)`
- **Settings**: `index_granularity = 8192`
- **Source**: `AggregatedOptionTrades` for live flow; batch/backfill SQL for structure fields
- **Retention**: 425 days (daily partition drops in the process-service `deleteOldData` job, `shared-clients/clickhouse/retention.ts`; one row per symbol-day, aligned with the SymbolMetaData year window)

**Query pattern**: Use `-Merge` suffix functions to finalize aggregate state:

```sql
SELECT
  symbol,
  anyMerge(underlying_type)         AS underlying_type,
  sumMerge(total_premium)           AS total_premium,
  sumMerge(call_premium)            AS total_call_premium,
  sumMerge(put_premium)             AS total_put_premium,
  sumMerge(trade_count)             AS trade_count,
  sumMerge(net_dex)                 AS sum_net_dex,
  maxMerge(last_trade_time)         AS last_trade_time,
  argMaxMerge(snapshot_spot)        AS snapshot_spot,
  argMaxMerge(call_gex)             AS call_gex,
  argMaxMerge(put_gex_signed)       AS put_gex_signed,
  argMaxMerge(chain_contract_count) AS chain_contract_count
FROM mv_symbol_day_flow
WHERE date = {rank_date:Date}
GROUP BY date, symbol
```

---

## mv_contract_rank_flow

Canonical **contract-day daily mart** at `(date, option_symbol)` grain, on the **execution-side schema** (`009_create_mv_contract_rank_flow.sql`). It combines live flow aggregates from `AggregatedOptionTrades` with chain snapshot fields populated by batch/backfill writes.

> **Blue/green transition (complete)**: this mart is the successor of the legacy `mv_contract_day_flow`. Both the read-side flip (2026-06-11) and the writer cutover are **done**. The contract structure fill now writes **only** `mv_contract_rank_flow` and no longer dual-fills the legacy mart (process-service `service.ts` "Decommission B2", 2026-06-15). The legacy `mv_contract_day_flow` is kept **frozen and unused** but is **never dropped** (project decision) — it is no longer written or read, yet it must still **exist** because the `syncUwData` ingest preflight still `DESCRIBE`s it strictly (`mv_contract_rank_flow` is DESCRIBE-optional). The `010_decommission_mv_contract_day_flow.sql` DROP script exists in-repo but is intentionally not executed. NOTE: the in-repo DDL headers (`009`)/README and the process-service `client.ts` constant comment still describe the old "blue/green dual-fill, dropped at decommission" model — those artifacts are stale; ground truth is the fill code (`martStructureFill/service.ts`/`sql.ts`).

The stored flow dimension is **execution side** (`ask_*` / `bid_*` / `mid_*` for premium, size, and DEX). Sentiment is **not stored**: it is exactly `f(put_call, side)` (see [Sentiment Derivation](./basic_concepts.md#sentiment-derivation-sentiment-field)), so the bullish/bearish/neutral family derives exactly at read time. The MV's flow expressions do not reference the `sentiment` column at all.

**Write paths**:
- **Flow (live)**: materialized view on `AggregatedOptionTrades` INSERT. Flow columns and trade-sourced bid/ask/Greeks are populated immediately; `prev_oi` receives a no-op value until batch structure rows win on merge.
- **Structure (batch/backfill)**: process-service `fillContractStructureForDate` (`martStructureFill/service.ts`; SQL in `martStructureFill/sql.ts` `CONTRACT_STRUCTURE_SQL` / `CONTRACT_PREV_OI_SQL`) and the webapp backfill scripts seed all chain contracts, including non-traded contracts, with structure fields from `OptionChainTable`. The structure write also **mark-fills `latest_trade_price` with the chain close** at version `toDateTime(1)` (real prints always win the merge) and writes placeholder states for the flow-only columns `moneyness` (`''`) and `underlying_price` (`0`) at the chain timestamp.

**Rank filter**: contract flow ranks should filter on `sumMerge(trade_count) > 0` so structure-only baseline rows do not appear in flow rank lists.

| Column | Type | Source | Description |
| ------ | ---- | ------ | ----------- |
| `date` | Date | key | Contract-day key |
| `option_symbol` | String | key | Full OCC contract symbol |
| `symbol` | AggregateFunction(any, String) | both | Underlying ticker |
| `put_call` | AggregateFunction(any, String) | both | `CALL` or `PUT` |
| `strike` | AggregateFunction(any, Float64) | both | Strike price |
| `expiration_date` | AggregateFunction(any, String) | both | Expiration date, stored as string |
| `moneyness` | AggregateFunction(argMax, String, DateTime) | flow | Latest moneyness (`ITM`/`ATM`/`OTM`); structure writes an empty placeholder |
| `trade_count` | AggregateFunction(sum, Int64) | flow | Total raw trades aggregated; flow-existence gate and `avg_trade_size` denominator |
| `ask_premium` | AggregateFunction(sumIf, Int32, UInt8) | flow | Premium from ask-side prints (`AASK`/`ASK`) |
| `bid_premium` | AggregateFunction(sumIf, Int32, UInt8) | flow | Premium from bid-side prints (`BID`/`BBID`) |
| `mid_premium` | AggregateFunction(sumIf, Int32, UInt8) | flow | Premium from the mid/unclassified catch-all bucket (`side NOT IN` ask/bid sets) |
| `ask_size` | AggregateFunction(sumIf, Int64, UInt8) | flow | Execution-side traded size at ask (**not** the `AggregatedOptionTrades.ask_size` quote depth) |
| `bid_size` | AggregateFunction(sumIf, Int64, UInt8) | flow | Execution-side traded size at bid (**not** quote depth) |
| `mid_size` | AggregateFunction(sumIf, Int64, UInt8) | flow | Traded size in the mid/unclassified bucket |
| `oi` | AggregateFunction(argMax, Int64, DateTime) | both | Latest open interest |
| `daily_volume` | AggregateFunction(argMax, Int64, DateTime) | both | Latest daily volume |
| `ask_dex` | AggregateFunction(sumIf, Int64, UInt8) | flow | DEX from ask-side prints |
| `bid_dex` | AggregateFunction(sumIf, Int64, UInt8) | flow | DEX from bid-side prints |
| `mid_dex` | AggregateFunction(sumIf, Int64, UInt8) | flow | DEX from the mid/unclassified bucket |
| `iv` | AggregateFunction(argMax, Float32, DateTime) | both | Latest implied volatility |
| `delta` | AggregateFunction(argMax, Float32, DateTime) | both | Latest delta |
| `underlying_price` | AggregateFunction(argMax, Float32, DateTime) | flow | Latest underlying price; structure writes a `0` placeholder |
| `latest_trade_time` | AggregateFunction(max, DateTime) | flow | Latest trade time; absent on mark-only rows (print vs mark detector) |
| `prev_oi` | AggregateFunction(argMax, Nullable(Int32), UInt64) | structure | Prior available snapshot OI |
| `bid` | AggregateFunction(argMax, Float32, DateTime) | both | Latest bid quote |
| `ask` | AggregateFunction(argMax, Float32, DateTime) | both | Latest ask quote |
| `latest_trade_price` | AggregateFunction(argMax, Nullable(Float32), DateTime) | both | **Print-else-mark**: latest session print when traded, else the chain-close mark from the structure fill |
| `gamma` | AggregateFunction(argMax, Float32, DateTime) | both | Latest gamma |
| `theta` | AggregateFunction(argMax, Float32, DateTime) | both | Latest theta |
| `vega` | AggregateFunction(argMax, Float32, DateTime) | both | Latest vega |

**Compute at query time, do not store** (canonical derivations):

```sql
premium      = sumIfMerge(ask_premium) + sumIfMerge(bid_premium) + sumIfMerge(mid_premium)
size         = sumIfMerge(ask_size) + sumIfMerge(bid_size) + sumIfMerge(mid_size)
expiry_days  = dateDiff('day', date, toDate(expiration_date))
bullish_dex  = if(put_call = 'CALL', ask_dex, bid_dex)        -- sentiment ≡ f(put_call, side)
bearish_dex  = if(put_call = 'CALL', bid_dex, ask_dex)
neutral_dex  = mid_dex
net_dex      = if(put_call = 'CALL', ask_dex - bid_dex, bid_dex - ask_dex)
bullish/bearish/neutral premium follow the same put_call mapping over the side premiums
net_dei      = (net_dex / average_stock_volume) * 100          -- display percent units
underlying_type / average_stock_volume come from the symbol-context join on SymbolMetaData (latest date <= effective_date via argMax(col, date))
```

Also query-time only: `oi_delta_pct`, `vol_oi_ratio`, `contract_gex`, `premium_per_contract`, `avg_trade_size`, expiry buckets. Contract Rank `oi_delta`/`Δ OI` uses `OptionChainTable.oi_change_1d` as the canonical value (resolved by `option_symbol`, then identity key); when chain delta is absent it falls back to `oi − prior OI`, where prior OI prefers `mv_contract_rank_flow.prev_oi` and fills gaps from prior-day chain OI lookups (by `option_symbol`, then identity key) — live flow MV rows can carry null `prev_oi` until structure writes/backfills run. Flow-only contracts missing from same-day `OptionChainTable` can receive `prev_oi` via `backfill_flow_only_contract_prev_oi.sql`.

**Price semantics (print-else-mark)**: `latest_trade_price` is the latest flow trade print from `AggregatedOptionTrades.price` when the contract traded; otherwise it carries the chain-close mark written by the daily structure fill. A price with no `latest_trade_time` is a mark, not a print. The former `close` column is retired — the chain snapshot is fetched pre-open (~06:30 ET), so it always held the *prior* session's close; the mark-fill preserves exactly that value for non-traded contracts while traded contracts get a fresher end-of-session print.

**Do not store**: `next_oi`, `next_oi_delta`, `next_oi_delta_pct`. Use date `D` flow versus date `D+1` mart rows for lead-lag research.

- **Engine**: `SharedAggregatingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`
- **Partition**: `PARTITION BY date`
- **Order**: `ORDER BY (date, option_symbol)`
- **Settings**: `index_granularity = 8192`
- **Source**: `AggregatedOptionTrades` for live flow; process-service `fillContractStructureForDate` (`martStructureFill/service.ts` + `sql.ts`) / backfill SQL for structure fields
- **Retention**: 120 days (daily partition drops in the process-service `deleteOldData` job, via the embedded MV's inner storage table); deepest consumer is the 90-day contract drawer history

**Query pattern**: Merge states in a CTE, derive the read-time columns, then filter/sort:

```sql
WITH symbol_context AS (
  SELECT symbol,
         argMax(underlying_type, date) AS underlying_type,
         argMax(average_stock_volume, date) AS average_stock_volume
  FROM SymbolMetaData
  WHERE date <= {effective_date:Date}
  GROUP BY symbol
),
merged_contracts AS (
  SELECT
    option_symbol,
    anyMerge(symbol)          AS symbol,
    anyMerge(put_call)        AS put_call,
    sumMerge(trade_count)     AS trade_count,
    sumIfMerge(ask_premium) + sumIfMerge(bid_premium) + sumIfMerge(mid_premium) AS premium,
    if(anyMerge(put_call) = 'CALL',
       sumIfMerge(ask_dex) - sumIfMerge(bid_dex),
       sumIfMerge(bid_dex) - sumIfMerge(ask_dex)) AS net_dex,
    argMaxMerge(oi)           AS oi,
    argMaxMerge(prev_oi)      AS prev_oi,
    argMaxMerge(daily_volume) AS daily_volume,
    argMaxMerge(latest_trade_price) AS latest_trade_price
  FROM mv_contract_rank_flow
  WHERE date = {effective_date:Date}
  GROUP BY option_symbol
)
SELECT
  mc.*,
  mc.oi - mc.prev_oi AS oi_delta,
  if(mc.oi > 0, toFloat64(mc.daily_volume) / toFloat64(mc.oi), 0) AS vol_oi_ratio,
  if(coalesce(sc.average_stock_volume, 0) > 0,
     (toFloat64(mc.net_dex) / toFloat64(sc.average_stock_volume)) * 100, 0) AS net_dei
FROM merged_contracts AS mc
LEFT JOIN symbol_context AS sc ON sc.symbol = mc.symbol
WHERE mc.trade_count > 0
ORDER BY premium DESC
LIMIT {limit:UInt64} OFFSET {offset:UInt64}
```

---

## SymbolVolDaily

> **Retired table — the IV/vol surface now lives on `SymbolMetaData`.** The per-symbol ATM IV (30 DTE), IV Rank, IV Percentile, and the skew/butterfly/term companions are stored as columns **on `SymbolMetaData`** (`iv30`, `iv_rank_1y`, `iv_percentile_1y`, `vol_date`, `vol_updated_timestamp`, `skew_25d_30d`, `atm_iv_30d`, `butterfly_25d_30d`, `iv_term_slope_30_90`; added by webapp DDL `008_alter_symbol_metadata_iv_fields.sql` + process-service `sql/symbolmeta-add-iv-skew-term.sql`). They are written nightly by the process-service `symbolVolDaily` batch via `ALTER TABLE SymbolMetaData UPDATE` after OptionChainTable ingestion (~06:30 AM ET), and the webapp reads IV30 / IV-rank / IV-percentile from `SymbolMetaData`. The standalone `SymbolVolDaily` table is **no longer written and no longer read** — it is kept only as rollback-only legacy with partition retention.

The compute logic (preserved, now writing onto `SymbolMetaData`): `iv30` is the ATM IV per expiry interpolated to 30 DTE (avg of call + put IV at the best ATM strike/expiry pair); `iv_rank_1y` is 0–1, the position of today's `iv30` in the adaptive high/low window (prior non-null `iv30` days plus today), NULL if fewer than **30** prior+current samples or flat min=max history; `iv_percentile_1y` is 0–1, the fraction of **prior** trading days with `iv30` strictly lower than today's, NULL under the same **30**-sample minimum; the `snapshot_spot` input comes from `SymbolMetaData.last`; `underlying_type` classifies `ETF` / `STOCK` / `INDEX`. IV Rank and IV Percentile require ~252 trading days of history to reach full accuracy.

The legacy table (retained for rollback only):

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY toYYYYMM(date)`  
**Order**: `ORDER BY (symbol, date)`  
**Settings**: `index_granularity = 8192`  
**Retention**: 425 days (`SYMBOL_VOL_DAILY_RETENTION_DAYS`; monthly `YYYYMM` partitions, drop partitions whose first day is older than today − 425d) — rollback-only legacy retention, since the table is no longer written or read.

---

## Table Summary

| Table | Purpose | Key use cases |
|-------|---------|----------------|
| **AggregatedOptionTrades** | Aggregated option flow (per second) | UOA, block detection, sentiment/DEX/DEI |
| **RawOptionTrades** | Raw option trades | Exact T&S, research, unaggregated flow |
| **OptionChainTable** | Option chain snapshot | OI, GEX, call/put walls, strike analysis, `oi_change_1d` per contract |
| **SymbolMetaData** | Underlying metadata | Filters, joins, sector/volume/market cap |
| **mv_symbol_day_flow** | MV: symbol-day flow + structure mart | **No live webapp readers (v1 2026-06-11)** — Symbol-level consolidated into the snapshot-derived Contract-level Symbols tab; still populated (crons + trade MVs) but every webapp reference is a comment/test |
| **mv_contract_rank_flow** | MV: execution-side contract-day flow + structure mart | Contract Flow Rank screener (Contracts **and** snapshot-derived Symbols tab), OI/contract context, symbol-drawer Flow history + Chain quotes |
| **mv_contract_day_flow** | Legacy contract-day mart (frozen; never dropped) | Writer cutover done (2026-06-15) — no longer dual-filled or read; kept frozen/unused but must still exist for the `syncUwData` strict DESCRIBE preflight |
| **SymbolVolDaily** | Retired vol table (rollback-only) | IV Rank / IV Percentile / Volatility Desk now read the IV columns on **SymbolMetaData** (`iv30`/`iv_rank_1y`/`iv_percentile_1y`/…); this table is no longer written or read |

---

## Notes

- **OI timing**: Open interest is updated overnight (e.g. ~6:30 AM ET). Intraday `oi` in flow/chain tables is the prior day’s value; see [OI Update Frequency](./basic_concepts.md#oi-update-frequency).
- **Time zones**: `AggregatedOptionTrades.time` is `DateTime` (server TZ); `RawOptionTrades.time` is explicitly `America/New_York`.
- **SharedMergeTree**: Tables use ClickHouse shared storage (`{uuid}`, `{shard}`, `{replica}`); replace with your cluster layout as needed.
- **Materialized views (`SharedAggregatingMergeTree`)**: `mv_symbol_day_flow` and `mv_contract_rank_flow` store `AggregateFunction(...)` columns. (The legacy `mv_contract_day_flow` is frozen — no longer written or read — but still exists; it must remain because the `syncUwData` ingest preflight `DESCRIBE`s it strictly. The preflight stays strict until a future human-run DROP, which is intentionally not executed.) Query with `-Merge` suffix functions (e.g. `sumMerge(total_premium)`). Live flow rows trigger on INSERTs to `AggregatedOptionTrades`; structure fields are populated by separate batch/backfill writes — `OptionChainTable` and `SymbolMetaData` for the symbol mart (the IV/vol fields are read from `SymbolMetaData`, where the `symbolVolDaily` batch now writes them), `OptionChainTable` only for the contract mart (its `underlying_type`/`net_dei`/`average_stock_volume` resolve via the symbol-context join on `SymbolMetaData` at read time).
- **Embedded MVs — no `ADD COLUMN`**: on TradingFlow ClickHouse Cloud both marts are materialized views with embedded storage. Schema changes require DROP+CREATE (the `004`/`009`-style recreate scripts) followed by rehydration via `scripts/clickhouse/backfill/run-backfill.mjs` (the Node runner; `run-backfill.sh` is a thin wrapper); partition operations target the inner `.inner_id.<uuid>` table. See `scripts/clickhouse/ddl/README.md`.
- **Mart retention**: `mv_contract_rank_flow` 120 days, `mv_symbol_day_flow` 425 days — daily partition drops in the process-service `deleteOldData` job (orchestrated by `controllers/maintenance/deleteOldData.ts`; constants/logic in `shared-clients/clickhouse/retention.ts`). The legacy `mv_contract_day_flow` is **not** in the retention job (frozen/unused). `SymbolVolDaily` (rollback-only legacy) is retained 425 days via monthly `YYYYMM` partition drops.
- **IV/vol surface on `SymbolMetaData`**: The retired standalone `SymbolVolDaily` table's metrics now live as columns on `SymbolMetaData` (`iv30`, `iv_rank_1y`, `iv_percentile_1y`, `vol_date`, `vol_updated_timestamp`, `skew_25d_30d`, `atm_iv_30d`, `butterfly_25d_30d`, `iv_term_slope_30_90`), written nightly by the process-service `symbolVolDaily` batch via `ALTER TABLE SymbolMetaData UPDATE` (not an MV). IV Rank and IV Percentile require ~252 trading days of history to reach full accuracy.
- **`oi_change_1d`**: Computed at ingestion time in the pipeline. For backfill, use a `Join` engine table + `ALTER TABLE UPDATE ... joinGet(...)` pattern (version-sensitive; validate against your ClickHouse version).

---

## users

Neon Postgres table for user persistence. Schema lives in `scripts/neon-users-migration.sql`.

### Columns

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | `UUID` | Yes | Primary key, generated with `gen_random_uuid()` when not supplied |
| `email` | `TEXT` | Yes | Normalized lowercase email; unique by `lower(email)` |
| `password` | `TEXT` | No | Legacy random UUID field; Clerk remains primary auth |
| `stripe_customer_id` | `TEXT` | No | Links user to Stripe billing |
| `watchlists` | `JSONB` | Yes | Array of Watchlist entries; default `[]` |
| `option_trades_preferences` | `JSONB` | No | `OptionTradesPreferenceDocV1` object |
| `created_at` | `TIMESTAMPTZ` | Yes | Defaults to `now()` |
| `updated_at` | `TIMESTAMPTZ` | Yes | Set by `BEFORE UPDATE` trigger `users_set_updated_at` calling `set_users_updated_at()` |

**Constraints**:

- `users_watchlists_array` — `CHECK (jsonb_typeof(watchlists) = 'array')`: `watchlists` must be a JSON array.
- `users_option_trades_preferences_object` — `CHECK (option_trades_preferences IS NULL OR jsonb_typeof(option_trades_preferences) = 'object')`: `option_trades_preferences` must be NULL or a JSON object.

### JSONB Contracts

`watchlists` stores an array of entries:

```json
{
  "id": "uuid",
  "name": "Default",
  "items": [{ "symbol": "AAPL", "exchange": "XNAS" }],
  "is_default": true,
  "created_at": "2026-05-04T00:00:00.000Z",
  "updated_at": "2026-05-04T00:00:00.000Z"
}
```

Watchlist identity is `items[*].symbol`. `exchange` is cached metadata for display: the key is always present but its value may be `null` (`string | null`), and it may be refreshed from `SymbolMetaData`. The repository uppercases and trims `symbol`/`exchange` and de-duplicates items by symbol on read/write. Option Trades query consumers project Watchlists to bare symbols.

`option_trades_preferences` stores the canonical Option Trades Preference document. The document may contain `savedFilterSets`, an array of named Option Trades Saved Filter Sets:

```json
{
  "id": "uuid",
  "name": "Default",
  "filterState": {},
  "columnLayout": {},
  "is_default": true,
  "created_at": "2026-05-04T00:00:00.000Z",
  "updated_at": "2026-05-04T00:00:00.000Z"
}
```

The server normalizes legacy singleton Option Trades Preference documents into one default Saved Filter Set named `Default`. The API enforces at least one set, exactly one default, default delete rejection, and last-set delete rejection. Legacy DynamoDB `table_filters` are converted only by the one-time backfill script and are not preserved in Neon.

### Indexes

| Index | Notes |
|---|---|
| `users_email_lower_unique` | Unique index on `lower(email)` for email lookup and upsert |
| `users_stripe_customer_id_idx` | Partial index for non-null Stripe customer ids |

### Repositories

| Repository | Responsibility |
|---|---|
| `src/server/repositories/userRepository.ts` | Identity and billing fields |
| `src/server/repositories/watchlistRepository.ts` | Watchlist JSONB read/update |
| `src/server/repositories/optionTradesPreferenceRepository.ts` | Option Trades Preference JSONB read/update |

### Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` or `NEON_DATABASE_URL` | Yes | Neon Postgres connection URL |
| `MAINTENANCE_MODE_BLOCK_WRITES` | No | Set `true` during cutover to reject write handlers |
| `MAINTENANCE_BYPASS_EMAILS` | No | Comma-separated lowercase/normalized QA bypass list |
