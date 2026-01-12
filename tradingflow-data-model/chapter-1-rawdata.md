# Chapter 1: Raw Data Pipeline

## Overview

This document describes the data flow for **TradingFlow.com** and **optiondata.io** - option data feed analysis platforms that enable users to visualize and analyze option trading activity.

## Data Source

We receive raw option trade data from our OPRA data provider via the Unusual Whales API.

**API Documentation:** [Option Trades Socket API](https://api.unusualwhales.com/docs#/operations/PublicApi.SocketController.option_trades)

### Source Schema (UWTradeData)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique trade identifier |
| `executed_at` | number | Execution timestamp (Unix ms) |
| `option_symbol` | string | OCC option symbol (e.g., `AAPL240412C00175000`) |
| `exchange` | string | Exchange code (e.g., `XPHO`) |
| `size` | number | Trade quantity (contracts) |
| `price` | number | Trade price |
| `premium` | number | Total premium (price x size x 100) |
| `nbbo_bid` | number | National best bid at execution |
| `nbbo_ask` | number | National best ask at execution |
| `underlying_price` | number | Underlying stock price |
| `open_interest` | number | Open interest for this contract |
| `volume` | number | Daily volume |
| **Greeks** |||
| `delta` | number | Delta |
| `gamma` | number | Gamma |
| `theta` | number | Theta |
| `vega` | number | Vega |
| `rho` | number | Rho |
| `implied_volatility` | number | Implied volatility |
| `theo` | number | Theoretical price |
| **Volume Breakdown** |||
| `ask_vol` | number | Volume at ask |
| `bid_vol` | number | Volume at bid |
| `mid_vol` | number | Volume at mid |
| `multi_vol` | number | Multi-leg volume |
| `no_side_vol` | number | Unattributed volume |
| `stock_multi_vol` | number | Stock/option combo volume |
| **Other** |||
| `ewma_nbbo_ask` | number | EWMA of NBBO ask |
| `ewma_nbbo_bid` | number | EWMA of NBBO bid |
| `tags` | string[] | Trade classification (e.g., `["ask_side", "bullish"]`) |
| `report_flags` | string[] | Reporting flags |
| `trade_code` | string | Trade condition code |

<details>
<summary>Sample API Response</summary>

```json
{
  "id": "7b16cc41-fff1-467d-ba27-2833ed36b8aa",
  "executed_at": 1712951756982,
  "option_symbol": "AAPL240412C00175000",
  "exchange": "XPHO",
  "size": 50,
  "price": "1.41",
  "premium": "7050.00",
  "nbbo_bid": "1.37",
  "nbbo_ask": "1.44",
  "underlying_price": "176.415",
  "open_interest": 30349,
  "volume": 154731,
  "delta": "0.994228192461621",
  "gamma": "0.0295023324215793",
  "theta": "-0.001030929199945518",
  "vega": "0.0002189364423635975",
  "rho": "0.0000993041222724721",
  "implied_volatility": "0.417829062773295",
  "theo": "1.401030929199951",
  "ask_vol": 75579,
  "bid_vol": 63966,
  "mid_vol": 15186,
  "multi_vol": 14665,
  "no_side_vol": 0,
  "stock_multi_vol": 16,
  "ewma_nbbo_ask": "1.44",
  "ewma_nbbo_bid": "1.37",
  "tags": ["ask_side", "bullish"],
  "report_flags": [],
  "trade_code": "slan"
}
```

</details>

---

## Data Transformation

We transform the raw API data into our internal `OptionFlowItem` schema before storage.

### Internal Schema

#### OptionFlowItemBase

Core fields present in all option flow records:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | System-generated unique ID |
| `date` | string | Trade date |
| `time` | string | Trade time |
| `symbol` | string | Underlying ticker |
| `option_symbol` | string | OCC option symbol |
| `put_call` | CALL_PUT_TAG | Call or Put |
| `strike` | number | Strike price |
| `expiration_date` | string | Option expiration |
| `expiry_days` | number | Days to expiration |
| `size` | number | Trade quantity |
| `price` | number | Trade price |
| `premium` | number | Total premium |
| `bid` | number | NBBO bid |
| `ask` | number | NBBO ask |
| `underlying_price` | number | Stock price at execution |
| `underlying_type` | UNDERLYING_TYPE_TAG | ETF, Index, or Equity |
| `oi` | number | Open interest |
| `daily_volume` | number | Daily volume |
| `iv` | number | Implied volatility |
| `delta` | number | Delta |
| `gamma` | number | Gamma |
| `sentiment` | SENTIMENT_TAG | Bullish/Bearish/Neutral |
| `side` | SIDE_LABEL | Bid/Ask/Mid side |
| `moneyness` | MONEYNESS_LABEL | ITM/ATM/OTM |
| `option_activity_type` | string | Trade/Sweep/Block |
| `earning_date` | string | Next earnings date (from SymbolMetaData) |

#### OptionFlowItemFull (extends Base)

Additional fields for detailed analysis:

| Field | Type | Description |
|-------|------|-------------|
| `dex` | number | Delta exposure |
| `dei` | number | Delta exposure index (nullable) |
| `trade_count` | number | Number of aggregated trades (default: 1) |
| `updated_timestamp` | number | Last update (UTC ms) |
| `ask_size` | number | Ask size |
| `bid_size` | number | Bid size |
| `exchange` | string | Exchange code |
| `vega` | number | Vega |
| `theta` | number | Theta |
| `rho` | number | Rho |
| `market_cap` | number | Market cap (from symbol_meta/alphavantage) |

---

## Database Storage

Data is stored in ClickHouse in two tables:

### RawOptionTrades

Stores individual option trades as received (after transformation).

```sql
CREATE TABLE default.RawOptionTrades
(
    id                   String,
    date                 Date,
    time                 DateTime,
    symbol               String,
    option_symbol        String,
    put_call             String,
    strike               Float32,
    expiration_date      Date,
    expiry_days          UInt16,
    size                 UInt32,
    price                Float32,
    premium              UInt32,
    bid                  Float32,
    ask                  Float32,
    underlying_price     Float32,
    underlying_type      String,
    oi                   UInt32,
    daily_volume         UInt32,
    iv                   Float32,
    delta                Float32,
    gamma                Float32,
    sentiment            String,
    side                 String,
    moneyness            String,
    option_activity_type String,
    earning_date         String,
    dex                  UInt32,
    dei                  Float32,
    trade_count          UInt16,
    updated_timestamp    UInt64,
    ask_size             UInt32,
    bid_size             UInt32,
    exchange             String,
    vega                 Float32,
    theta                Float32,
    rho                  Float32,
    market_cap           UInt128
)
ENGINE = SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
PARTITION BY date
PRIMARY KEY time
ORDER BY time
SETTINGS index_granularity = 8192;
```

### AggregatedOptionTrades

Stores trades aggregated by time, symbol, and strike price.

```sql
CREATE TABLE default.AggregatedOptionTrades
(
    id                   String,
    date                 Date,
    time                 DateTime,
    symbol               String,
    option_symbol        String,
    put_call             String,
    strike               Float32,
    expiration_date      Date,
    expiry_days          Int32,
    size                 Int32,
    price                Float32,
    premium              Int32,
    bid                  Float32,
    ask                  Float32,
    underlying_price     Float32,
    underlying_type      String,
    oi                   Int32,
    daily_volume         Int32,
    iv                   Float32,
    delta                Float32,
    gamma                Float32,
    sentiment            String,
    side                 String,
    moneyness            String,
    option_activity_type String,
    earning_date         Date,
    dex                  Int32,
    dei                  Float32,
    trade_count          Int32,
    updated_timestamp    UInt64,
    ask_size             Int64,
    bid_size             Int64,
    exchange             String,
    vega                 Float32,
    theta                Float32,
    rho                  Float32,
    market_cap           UInt128
);
```

### Why Two Tables?

| Concern | RawOptionTrades | AggregatedOptionTrades |
|---------|-----------------|------------------------|
| **Granularity** | Individual trades | Grouped by time/symbol/strike |
| **Use Case** | Audit trail, detailed analysis | Dashboard views, pattern detection |
| **Performance** | Higher storage, slower queries | Lower storage, faster queries |

**Aggregation Benefits:**
- **Detect split orders:** Large orders often split across multiple exchanges to minimize market impact. Aggregation reconstructs the true order size.
- **Identify unusual activity:** Easier to spot institutional flows when fragmented trades are combined.
- **Improve query performance:** Fewer rows to scan for time-series analysis and sentiment aggregation.


### Enhancement
