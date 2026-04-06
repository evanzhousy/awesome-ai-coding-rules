# Data Schema

> **Concepts Reference**: [OptionData Product Concepts](./basic_concepts.md)
> **Last Updated**: 2026-04-06

This document describes all persistent data stores: the ClickHouse analytics tables used for options flow and chain data, and the DynamoDB table used for user persistence.

---

## Table of Contents

### ClickHouse — Base Tables

1. [AggregatedOptionTrades](#aggregatedoptiontrades)
2. [RawOptionTrades](#rawoptiontrades)
3. [OptionChainTable](#optionchaintable)
4. [SymbolMetaData](#symbolmetadata)

### ClickHouse — Materialized Views

5. [mv_symbol_day_flow](#mv_symbol_day_flow)
6. [mv_contract_day_flow](#mv_contract_day_flow)

### ClickHouse — Derived Tables

7. [SymbolVolDaily](#symbolvoldaily)

### DynamoDB

8. [TradingFlow-Users](#tradingflow-users)

---

## AggregatedOptionTrades

Real-time option trades in **aggregated** mode: trades for the same option symbol executed in the same second are consolidated into a single row. Use for identifying block trades and unusual flow; see [Aggregation Mode](./basic_concepts.md#aggregation-mode) in basic concepts.

| Column                 | Type     | Description                                                                                                                                |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `date`                 | Date     | Trade date                                                                                                                                 |
| `time`                 | DateTime | Trade time (second-level; aggregation key)                                                                                                 |
| `symbol`               | String   | Underlying symbol (e.g. AAPL, TSLA)                                                                                                        |
| `option_symbol`        | String   | Full option symbol (e.g. OCC format)                                                                                                       |
| `put_call`             | String   | `CALL` or `PUT`                                                                                                                            |
| `strike`               | Float32  | Strike price                                                                                                                               |
| `expiration_date`      | Date     | Option expiration                                                                                                                          |
| `expiry_days`          | Int32    | Days to expiration (DTE)                                                                                                                   |
| `size`                 | Int32    | Number of contracts (summed when aggregated)                                                                                               |
| `trade_count`          | Int32    | Number of raw trades aggregated (≥ 1)                                                                                                      |
| `price`                | Float32  | Option price (avg when aggregated)                                                                                                         |
| `premium`              | Int32    | Total dollar value: price × size × 100 (summed)                                                                                            |
| `bid`                  | Float32  | Bid price                                                                                                                                  |
| `ask`                  | Float32  | Ask price                                                                                                                                  |
| `bid_size`             | Int64    | Bid size                                                                                                                                   |
| `ask_size`             | Int64    | Ask size                                                                                                                                   |
| `underlying_price`     | Float32  | Underlying price at trade time                                                                                                             |
| `underlying_type`      | String   | Underlying asset type                                                                                                                      |
| `side`                 | String   | Execution vs spread: `AASK`, `ASK`, `MID`, `BID`, `BBID` — see [Trade Execution Side](./basic_concepts.md#trade-execution-side-side-field) |
| `sentiment`            | String   | Inferred: `BULLISH`, `BEARISH`, `NEUTRAL` — see [Sentiment Derivation](./basic_concepts.md#sentiment-derivation-sentiment-field)           |
| `moneyness`            | String   | `ITM`, `ATM`, `OTM` — see [Moneyness](./basic_concepts.md#moneyness-classification-moneyness-field)                                        |
| `option_activity_type` | String   | Execution mechanism (e.g. AUTO, MLET) — see [Trade Activity Types](./basic_concepts.md#trade-activity-types-option_activity_type-field)    |
| `exchange`             | String   | Exchange identifier                                                                                                                        |
| `oi`                   | Int32    | Open interest (prior day; not real-time)                                                                                                   |
| `daily_volume`         | Int32    | Daily volume for the option                                                                                                                |
| `iv`                   | Float32  | Implied volatility                                                                                                                         |
| `delta`                | Float32  | Delta (price sensitivity to $1 move in underlying)                                                                                         |
| `gamma`                | Float32  | Gamma                                                                                                                                      |
| `vega`                 | Float32  | Vega                                                                                                                                       |
| `theta`                | Float32  | Theta                                                                                                                                      |
| `rho`                  | Float32  | Rho                                                                                                                                        |
| `dex`                  | Int32    | Delta exposure: delta × size (directional exposure) — see [Delta Exposure (DEX)](./basic_concepts.md#delta-exposure-dex)                   |
| `dei`                  | Float32  | Delta impact: dex ÷ avg_daily_volume — see [Delta Impact (DEI)](./basic_concepts.md#delta-impact-dei)                                      |
| `earning_date`         | Date     | Next earnings date (if available)                                                                                                          |
| `market_cap`           | UInt128  | Underlying market cap                                                                                                                      |
| `updated_timestamp`    | UInt64   | ETL/update timestamp                                                                                                                       |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Order**: `ORDER BY (symbol, date, time)`  
**Settings**: `index_granularity = 8192`

---

## RawOptionTrades

Unaggregated option trades (raw Time & Sales). Use when you need exact trade-level detail; see [Aggregation Mode](./basic_concepts.md#aggregation-mode) (RAW vs AGGREGATED).

| Column             | Type                              | Description                   |
| ------------------ | --------------------------------- | ----------------------------- |
| `date`             | Date                              | Trade date                    |
| `time`             | DateTime64(3, 'America/New_York') | Trade timestamp (millisecond) |
| `symbol`           | LowCardinality(String)            | Underlying symbol             |
| `put_call`         | Enum8('CALL' = 1, 'PUT' = 2)      | Option type                   |
| `strike`           | Decimal(9, 3)                     | Strike price                  |
| `expiration_date`  | Date                              | Expiration date               |
| `size`             | UInt32                            | Contracts traded              |
| `price`            | Decimal(9, 4)                     | Trade price                   |
| `bid`              | Decimal(9, 4)                     | Bid                           |
| `ask`              | Decimal(9, 4)                     | Ask                           |
| `underlying_price` | Decimal(9, 4)                     | Underlying at trade time      |
| `iv`               | Decimal(9, 4)                     | Implied volatility            |
| `delta`            | Decimal(9, 4)                     | Delta                         |
| `gamma`            | Decimal(9, 6)                     | Gamma                         |
| `oi`               | UInt32                            | Open interest                 |
| `dei`              | Decimal(9, 4)                     | Delta impact                  |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY (symbol, time)`  
**Order**: `ORDER BY (symbol, time, put_call, expiration_date, strike)`  
**Settings**: `index_granularity = 8192`

---

## OptionChainTable

Snapshot of the option chain: OI, volume, Greeks, and quotes per strike/expiration. Use for “where is the market positioned?” and GEX/walls; see [Option Chain vs Option Flow](./basic_concepts.md#option-chain-vs-option-flow) and [Open Interest (OI)](./basic_concepts.md#open-interest-oi).

| Column                  | Type                   | Description                                                                         |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `symbol`                | String                 | Underlying symbol                                                                   |
| `date`                  | Date                   | Snapshot date                                                                       |
| `option_symbol`         | String                 | Full option symbol                                                                  |
| `put_call`              | LowCardinality(String) | `CALL` or `PUT`                                                                     |
| `strike`                | Float32                | Strike price                                                                        |
| `expiration_date`       | Date                   | Expiration                                                                          |
| `expiry_days`           | Int32                  | Days to expiration                                                                  |
| `oi`                    | Int32                  | Open interest                                                                       |
| `daily_volume`          | Int32                  | Daily volume                                                                        |
| `bid`                   | Float32                | Bid                                                                                 |
| `ask`                   | Float32                | Ask                                                                                 |
| `close`                 | Float32                | Closing/settlement price                                                            |
| `iv`                    | Float32                | Implied volatility                                                                  |
| `historical_volatility` | Float32                | Historical volatility                                                               |
| `delta`                 | Float32                | Delta                                                                               |
| `gamma`                 | Float32                | Gamma                                                                               |
| `vega`                  | Float32                | Vega                                                                                |
| `theta`                 | Float32                | Theta                                                                               |
| `oi_change_1d`          | Int32                  | Daily OI change: today's OI minus prior day's OI (default 0; computed at ingestion) |
| `updated_timestamp`     | UInt64                 | ETL/update timestamp                                                                |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY (symbol, option_symbol)`  
**Settings**: `index_granularity = 8192`

---

## SymbolMetaData

Per-symbol, per-day metadata: price, volume, fundamentals, and classification. Use for filtering and joining with flow/chain tables.

| Column                  | Type    | Description                     |
| ----------------------- | ------- | ------------------------------- |
| `symbol`                | String  | Underlying symbol               |
| `date`                  | Date    | Data date                       |
| `underlying_type`       | String  | Asset type (e.g. equity, index) |
| `exchange`              | String  | Primary exchange                |
| `description`           | String  | Company/asset description       |
| `sector`                | String  | Sector classification           |
| `open`                  | Float32 | Open price                      |
| `high`                  | Float32 | High price                      |
| `low`                   | Float32 | Low price                       |
| `close`                 | Float32 | Close price                     |
| `last`                  | Float32 | Last traded price               |
| `pre_close`             | Float32 | Previous close                  |
| `change_percentage`     | Float32 | Day-over-day change %           |
| `volume`                | Int32   | Daily share volume              |
| `average_stock_volume`  | UInt32  | Average daily volume            |
| `outstanding_shares`    | UInt64  | Shares outstanding              |
| `market_cap`            | UInt64  | Market capitalization           |
| `historical_volatility` | Float32 | Historical volatility           |
| `earning_date`          | Date    | Next earnings date (if known)   |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY symbol`  
**Settings**: `index_granularity = 8192`

---

## mv_symbol_day_flow

Materialized view pre-aggregating `AggregatedOptionTrades` per (date, underlying `symbol`). Powers the Market Rank screener — reads ~2K rows instead of scanning ~1M raw trades. Automatically populated on each INSERT to `AggregatedOptionTrades`.

| Column            | Type                             | Description                                            |
| ----------------- | -------------------------------- | ------------------------------------------------------ |
| `date`            | Date                             | Trade date (group key)                                 |
| `symbol`          | String                           | Underlying symbol (group key)                          |
| `underlying_type` | AggregateFunction(any, String)   | Asset type (coalesced; defaults to `'INDEX'` if empty) |
| `total_premium`   | AggregateFunction(sum, Int32)    | Total premium                                          |
| `call_premium`    | AggregateFunction(sumIf, Int32)  | Call-side premium                                      |
| `put_premium`     | AggregateFunction(sumIf, Int32)  | Put-side premium                                       |
| `net_dex`         | AggregateFunction(sum, Int64)    | Net signed delta exposure (bullish +, bearish −)       |
| `net_dei`         | AggregateFunction(sum, Float64)  | Net signed delta impact                                |
| `last_trade_time` | AggregateFunction(max, DateTime) | Latest trade time in the day                           |
| `earning_date`    | AggregateFunction(any, Date)     | Next earnings date                                     |

**Engine**: `AggregatingMergeTree()`  
**Partition**: `PARTITION BY date`  
**Order**: `ORDER BY (date, symbol)`  
**Source**: `AggregatedOptionTrades`

**Query pattern**: Use `-Merge` suffix functions to finalize aggregate state:

```sql
SELECT
  symbol,
  anyMerge(underlying_type)  AS underlying_type,
  sumMerge(total_premium)    AS total_premium,
  sumMerge(call_premium)     AS total_call_premium,
  sumMerge(put_premium)      AS total_put_premium,
  sumMerge(net_dex)          AS sum_net_dex,
  maxMerge(last_trade_time)  AS last_trade_time
FROM mv_symbol_day_flow
WHERE date = {rank_date:Date}
GROUP BY date, symbol
```

---

## mv_contract_day_flow

Materialized view pre-aggregating `AggregatedOptionTrades` per (date, `option_symbol` contract). Powers the Contract Flow Rank screener (full_day mode) — reads ~50K pre-aggregated rows instead of scanning ~1M raw trades. Automatically populated on each INSERT to `AggregatedOptionTrades`. Time-windowed queries (1h/2h/4h) still read from the raw table.

| Column              | Type                                                 | Description                                   |
| ------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `date`              | Date                                                 | Trade date (group key)                        |
| `option_symbol`     | String                                               | Full OCC contract symbol (group key)          |
| `symbol`            | AggregateFunction(any, String)                       | Underlying ticker                             |
| `put_call`          | AggregateFunction(any, String)                       | `CALL` or `PUT`                               |
| `strike`            | AggregateFunction(any, Float64)                      | Strike price                                  |
| `expiration_date`   | AggregateFunction(any, String)                       | Expiration date (stored as string)            |
| `underlying_type`   | AggregateFunction(any, String)                       | Asset type (coalesced; defaults to `'INDEX'`) |
| `moneyness`         | AggregateFunction(argMax, String, DateTime)          | Latest moneyness (`ITM`/`ATM`/`OTM`)          |
| `expiry_days`       | AggregateFunction(argMax, Nullable(Int32), DateTime) | Latest DTE                                    |
| `premium`           | AggregateFunction(sum, Int32)                        | Total premium                                 |
| `size`              | AggregateFunction(sum, Int64)                        | Total contracts                               |
| `trade_count`       | AggregateFunction(sum, Int64)                        | Total raw trades aggregated                   |
| `oi`                | AggregateFunction(argMax, Int64, DateTime)           | Latest open interest                          |
| `daily_volume`      | AggregateFunction(argMax, Int64, DateTime)           | Latest daily volume                           |
| `net_dex`           | AggregateFunction(sum, Int64)                        | Net signed DEX                                |
| `bullish_dex`       | AggregateFunction(sumIf, Int64)                      | DEX from bullish-sentiment trades             |
| `bearish_dex`       | AggregateFunction(sumIf, Int64)                      | DEX from bearish-sentiment trades             |
| `iv`                | AggregateFunction(argMax, Float32, DateTime)         | Latest implied volatility                     |
| `delta`             | AggregateFunction(argMax, Float32, DateTime)         | Latest delta                                  |
| `underlying_price`  | AggregateFunction(argMax, Float32, DateTime)         | Latest underlying price                       |
| `latest_trade_time` | AggregateFunction(max, DateTime)                     | Latest trade time                             |

**Engine**: `AggregatingMergeTree()`  
**Partition**: `PARTITION BY date`  
**Order**: `ORDER BY (date, option_symbol)`  
**Source**: `AggregatedOptionTrades`

**Query pattern**: Merge states in a CTE, then filter/sort on materialized columns:

```sql
WITH merged_contracts AS (
  SELECT
    option_symbol,
    anyMerge(symbol)          AS symbol,
    anyMerge(put_call)        AS put_call,
    sumMerge(premium)         AS premium,
    sumMerge(trade_count)     AS trade_count,
    argMaxMerge(oi)           AS oi,
    argMaxMerge(daily_volume) AS daily_volume,
    sumMerge(net_dex)         AS net_dex
    -- ... other columns
  FROM mv_contract_day_flow
  WHERE date = {effective_date:Date}
  GROUP BY option_symbol
)
SELECT *, if(oi > 0, toFloat64(daily_volume) / toFloat64(oi), 0) AS vol_oi_ratio
FROM merged_contracts
ORDER BY premium DESC
LIMIT {limit:UInt64} OFFSET {offset:UInt64}
```

---

## SymbolVolDaily

Per-symbol, per-day derived volatility metrics. Stores underlying-level ATM IV (30 DTE) with 400+ day retention, enabling IV Rank and IV Percentile screener rankings. **Not** a materialized view — populated by a daily batch job after OptionChainTable ingestion (~06:30 AM ET).

| Column             | Type                   | Description                                                                                                  |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `date`             | Date                   | Snapshot date                                                                                                |
| `symbol`           | LowCardinality(String) | Underlying ticker (e.g. AAPL, SPY)                                                                           |
| `iv30`             | Float32                | ATM implied vol at ~30 DTE (avg of call + put IV at best ATM strike/expiry pair)                             |
| `iv_rank_1y`       | Float32                | 0–1; position of today's iv30 in its 252-trading-day high/low range. NULL if < 2 data points or flat history |
| `iv_percentile_1y` | Float32                | 0–1; % of trading days in past year with iv30 lower than today's. NULL if insufficient history               |
| `snapshot_spot`    | Float32                | Underlying price at snapshot time (from SymbolMetaData)                                                      |
| `underlying_type`  | LowCardinality(String) | `ETF` / `STOCK` / `INDEX`                                                                                    |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY toYYYYMM(date)`  
**Order**: `ORDER BY (symbol, date)`  
**Settings**: `index_granularity = 8192`  
**Retention**: 400+ days (monthly partitions; drop partitions older than 14 months)

---

## Table Summary

| Table                      | Purpose                                | Key use cases                                                         |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| **AggregatedOptionTrades** | Aggregated option flow (per second)    | UOA, block detection, sentiment/DEX/DEI                               |
| **RawOptionTrades**        | Raw option trades                      | Exact T&S, research, unaggregated flow                                |
| **OptionChainTable**       | Option chain snapshot                  | OI, GEX, call/put walls, strike analysis, `oi_change_1d` per contract |
| **SymbolMetaData**         | Underlying metadata                    | Filters, joins, sector/volume/market cap                              |
| **mv_symbol_day_flow**     | MV: per-symbol daily flow aggregates   | Market Rank screener (replaces full-day scan)                         |
| **mv_contract_day_flow**   | MV: per-contract daily flow aggregates | Contract Flow Rank screener, full_day mode                            |
| **SymbolVolDaily**         | Derived daily ATM IV + rank/percentile | IV Rank, IV Percentile, Volatility Desk                               |

---

## Notes

- **OI timing**: Open interest is updated overnight (e.g. ~6:30 AM ET). Intraday `oi` in flow/chain tables is the prior day’s value; see [OI Update Frequency](./basic_concepts.md#oi-update-frequency).
- **Time zones**: `AggregatedOptionTrades.time` is `DateTime` (server TZ); `RawOptionTrades.time` is explicitly `America/New_York`.
- **SharedMergeTree**: Tables use ClickHouse shared storage (`{uuid}`, `{shard}`, `{replica}`); replace with your cluster layout as needed.
- **Materialized views (`AggregatingMergeTree`)**: `mv_symbol_day_flow` and `mv_contract_day_flow` store `AggregateFunction(...)` columns. Query with `-Merge` suffix functions (e.g. `sumMerge(total_premium)`). They trigger on INSERTs to `AggregatedOptionTrades` only — OptionChainTable inserts do not affect them.
- **SymbolVolDaily**: Populated by a daily batch job (not an MV). IV Rank and IV Percentile require ~252 trading days of history to reach full accuracy.
- **`oi_change_1d`**: Computed at ingestion time in the pipeline. For backfill, use a `Join` engine table + `ALTER TABLE UPDATE ... joinGet(...)` pattern (version-sensitive; validate against your ClickHouse version).

---

## TradingFlow-Users

DynamoDB table for user persistence. Implemented in `src/server/repositories/userRepository.ts`.

### Table Config

| Property                  | Value                                                     |
| ------------------------- | --------------------------------------------------------- |
| **Table name (prod)**     | `TradingFlow-Users`                                       |
| **Table name (non-prod)** | `TradingFlow-Users-test`                                  |
| **Region**                | `us-west-2` (hard-coded)                                  |
| **SDK**                   | `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (v3) |
| **Marshalling**           | `removeUndefinedValues: true`                             |

### Keys & Indexes

| Key                    | Attribute          | Type   | Notes                                              |
| ---------------------- | ------------------ | ------ | -------------------------------------------------- |
| Primary partition key  | `id`               | String | UUID v4, generated at creation                     |
| Global Secondary Index | `emailGlobalIndex` | —      | Keyed on `email`; used for all email-based lookups |

### Attributes

| Attribute                  | DynamoDB Type | Required | Notes                                                                                               |
| -------------------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `id`                       | String        | Yes      | Primary key (UUID v4)                                                                               |
| `email`                    | String        | Yes      | Normalized to lowercase + trimmed before storage; GSI key                                           |
| `password`                 | String        | No       | Random UUID assigned at creation (Clerk is primary auth)                                            |
| `stripe_customer_id`       | String        | No       | Links user to Stripe billing; set on registration                                                   |
| `watch_list`               | String        | No       | `JSON.stringify(string[])` — each item is `"SYMBOL:EXCHANGE"` (e.g. `"AAPL:NASDAQ"`)                |
| `table_filters`            | String        | No       | `JSON.stringify(TableFiltersProps[])`                                                               |
| `option_trades_preference` | String        | No       | `JSON.stringify(OptionTradesPreferenceDoc)` — column layout and preferences for option trades table |
| `created_time`             | Number        | Yes      | `Date.now()` — Unix milliseconds                                                                    |
| `updated_time`             | Number        | Yes      | `Date.now()` — Unix milliseconds; updated on every write                                            |

### Serialization Contracts

Changing these formats silently breaks deserialization of existing stored data.

| Attribute                  | Stored format                                                      |
| -------------------------- | ------------------------------------------------------------------ |
| `watch_list`               | `JSON.stringify(string[])` — items are `"SYMBOL:EXCHANGE"` strings |
| `table_filters`            | `JSON.stringify(TableFiltersProps[])`                              |
| `option_trades_preference` | `JSON.stringify(OptionTradesPreferenceDoc)`                        |

### Operations

| Operation                       | Method                               | Key used             |
| ------------------------------- | ------------------------------------ | -------------------- |
| Look up user by email           | `QueryCommand` on `emailGlobalIndex` | `email` (normalized) |
| Look up user by ID              | `GetCommand`                         | `id`                 |
| Create user                     | `PutCommand`                         | —                    |
| Update Stripe customer ID       | `UpdateCommand`                      | `id`                 |
| Update watchlist                | `UpdateCommand`                      | `id`                 |
| Update table filters            | `UpdateCommand`                      | `id`                 |
| Update option trades preference | `UpdateCommand`                      | `id`                 |

### Environment Variables

| Variable                   | Required | Notes                            |
| -------------------------- | -------- | -------------------------------- |
| `AWS_ACCESS_KEY_ID_TF`     | Yes      | IAM access key                   |
| `AWS_SECRET_ACCESS_KEY_TF` | Yes      | IAM secret key                   |
| `DYNAMODB_USERS_TABLE`     | No       | Overrides the default table name |
