# Data Schema

> **Concepts Reference**: [OptionData Product Concepts](./basic_concepts.md)
> **Last Updated**: 2026-03-08

This document describes all persistent data stores: the ClickHouse analytics tables used for options flow and chain data, and the DynamoDB table used for user persistence.

---

## Table of Contents

### ClickHouse
1. [AggregatedOptionTrades](#aggregatedoptiontrades)
2. [RawOptionTrades](#rawoptiontrades)
3. [OptionChainTable](#optionchaintable)
4. [SymbolMetaData](#symbolmetadata)

### DynamoDB
5. [TradingFlow-Users](#tradingflow-users)

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
| `updated_timestamp` | UInt64 | ETL/update timestamp |

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY (symbol, option_symbol)`  
**Settings**: `index_granularity = 8192`

---

## SymbolMetaData

Per-symbol, per-day metadata: price, volume, fundamentals, and classification. Use for filtering and joining with flow/chain tables.

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

**Engine**: `SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')`  
**Partition**: `PARTITION BY date`  
**Primary Key**: `PRIMARY KEY symbol`  
**Order**: `ORDER BY symbol`  
**Settings**: `index_granularity = 8192`

---

## Table Summary

| Table | Purpose | Key use cases |
|-------|---------|----------------|
| **AggregatedOptionTrades** | Aggregated option flow (per second) | UOA, block detection, sentiment/DEX/DEI |
| **RawOptionTrades** | Raw option trades | Exact T&S, research, unaggregated flow |
| **OptionChainTable** | Option chain snapshot | OI, GEX, call/put walls, strike analysis |
| **SymbolMetaData** | Underlying metadata | Filters, joins, sector/volume/market cap |

---

## Notes

- **OI timing**: Open interest is updated overnight (e.g. ~6:30 AM ET). Intraday `oi` in flow/chain tables is the prior day’s value; see [OI Update Frequency](./basic_concepts.md#oi-update-frequency).
- **Time zones**: `AggregatedOptionTrades.time` is `DateTime` (server TZ); `RawOptionTrades.time` is explicitly `America/New_York`.
- **SharedMergeTree**: Tables use ClickHouse shared storage (`{uuid}`, `{shard}`, `{replica}`); replace with your cluster layout as needed.

---

## TradingFlow-Users

DynamoDB table for user persistence. Implemented in `src/server/repositories/userRepository.ts`.

### Table Config

| Property | Value |
|---|---|
| **Table name (prod)** | `TradingFlow-Users` |
| **Table name (non-prod)** | `TradingFlow-Users-test` |
| **Region** | `us-west-2` (hard-coded) |
| **SDK** | `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (v3) |
| **Marshalling** | `removeUndefinedValues: true` |

### Keys & Indexes

| Key | Attribute | Type | Notes |
|---|---|---|---|
| Primary partition key | `id` | String | UUID v4, generated at creation |
| Global Secondary Index | `emailGlobalIndex` | — | Keyed on `email`; used for all email-based lookups |

### Attributes

| Attribute | DynamoDB Type | Required | Notes |
|---|---|---|---|
| `id` | String | Yes | Primary key (UUID v4) |
| `email` | String | Yes | Normalized to lowercase + trimmed before storage; GSI key |
| `password` | String | No | Random UUID assigned at creation (Clerk is primary auth) |
| `stripe_customer_id` | String | No | Links user to Stripe billing; set on registration |
| `watch_list` | String | No | `JSON.stringify(string[])` — each item is `"SYMBOL:EXCHANGE"` (e.g. `"AAPL:NASDAQ"`) |
| `table_filters` | String | No | `JSON.stringify(TableFiltersProps[])` |
| `option_trades_preference` | String | No | `JSON.stringify(OptionTradesPreferenceDoc)` — column layout and preferences for option trades table |
| `created_time` | Number | Yes | `Date.now()` — Unix milliseconds |
| `updated_time` | Number | Yes | `Date.now()` — Unix milliseconds; updated on every write |

### Serialization Contracts

Changing these formats silently breaks deserialization of existing stored data.

| Attribute | Stored format |
|---|---|
| `watch_list` | `JSON.stringify(string[])` — items are `"SYMBOL:EXCHANGE"` strings |
| `table_filters` | `JSON.stringify(TableFiltersProps[])` |
| `option_trades_preference` | `JSON.stringify(OptionTradesPreferenceDoc)` |

### Operations

| Operation | Method | Key used |
|---|---|---|
| Look up user by email | `QueryCommand` on `emailGlobalIndex` | `email` (normalized) |
| Look up user by ID | `GetCommand` | `id` |
| Create user | `PutCommand` | — |
| Update Stripe customer ID | `UpdateCommand` | `id` |
| Update watchlist | `UpdateCommand` | `id` |
| Update table filters | `UpdateCommand` | `id` |
| Update option trades preference | `UpdateCommand` | `id` |

### Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `AWS_ACCESS_KEY_ID_TF` | Yes | IAM access key |
| `AWS_SECRET_ACCESS_KEY_TF` | Yes | IAM secret key |
| `DYNAMODB_USERS_TABLE` | No | Overrides the default table name |
