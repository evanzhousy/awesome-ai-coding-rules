# This is the data flow diagram for TradingFlow.com and optiondata.io
- tradingflow.com is the option data feed analysis platform, enable user to see the option data visual

# Data source
- we get the raw option data from our OPRA data provider.
- API documentation: https://api.unusualwhales.com/docs#/operations/PublicApi.SocketController.option_trades
- the schema is 
```json
{
  ask_vol: number;
  bid_vol: number;
  delta: number;
  ewma_nbbo_ask: number;
  ewma_nbbo_bid: number;
  exchange: string;
  executed_at: number;
  gamma: number;
  id: string;
  implied_volatility: number;
  mid_vol: number;
  multi_vol: number;
  nbbo_ask: number;
  nbbo_bid: number;
  no_side_vol: number;
  open_interest: number;
  option_symbol: string;
  premium: number;
  price: number;
  report_flags: string[];
  rho: number;
  size: number;
  stock_multi_vol: number;
  tags: string[];//tags":["bid_side","bullish","etf"] "tags":["ask_side","bullish","index"]
  theo: number;
  theta: number;
  trade_code: string;
  underlying_price: number;
  vega: number;
  volume: number;
}
```

sample data for UWTradeData is
```json
{
  "ask_vol": 75579,
  "bid_vol": 63966,
  "delta": "0.994228192461621",
  "ewma_nbbo_ask": "1.44",
  "ewma_nbbo_bid": "1.37",
  "exchange": "XPHO",
  "executed_at": 1712951756982,
  "gamma": "0.0295023324215793",
  "id": "7b16cc41-fff1-467d-ba27-2833ed36b8aa",
  "implied_volatility": "0.417829062773295",
  "mid_vol": 15186,
  "multi_vol": 14665,
  "nbbo_ask": "1.44",
  "nbbo_bid": "1.37",
  "no_side_vol": 0,
  "open_interest": 30349,
  "option_symbol": "AAPL240412C00175000",
  "premium": "7050.00",
  "price": "1.41",
  "report_flags": [],
  "rho": "0.0000993041222724721",
  "size": 50,
  "stock_multi_vol": 16,
  "tags": [
    "ask_side",
    "bullish"
  ],
  "theo": "1.401030929199951",
  "theta": "-0.001030929199945518",
  "trade_code": "slan",
  "underlying_price": "176.415",
  "vega": "0.0002189364423635975",
  "volume": 154731
}
```
- we convert the UW data to the UWTradeData schema to
```javascript
export interface OptionFlowItemBase {
  id: string; // system generated unique id
  date: string,
  size: number; // TradeQuantity
  price: number; // TradePrice
  premium: number;
  bid: number; //OptNBBOBid
  ask: number;
  time: string;
  symbol: string;
  put_call: CALL_PUT_TAG;
  strike: number;
  expiration_date: string;
  underlying_type: UNDERLYING_TYPE_TAG; // UndEquityType;
  option_activity_type: string;
  oi: number; //open interest
  underlying_price: number;
  sentiment: SENTIMENT_TAG;
  expiry_days: number;
  side: SIDE_LABEL;
  moneyness: MONEYNESS_LABEL;
  iv: number;
  delta: number;
  option_symbol: string; //OptSymbol
  gamma: number;// UW: available,  MC: N/A
  daily_volume: number; // UW: available,  MC: N/A
  earning_date: string; //Sync from SymbolMetaData
}
export interface OptionFlowItemFull extends OptionFlowItemBase {
  dex: number;
  dei: number; // could be null
  trade_count: number; //By default it is 1, aggregate trades will modify this field later
  updated_timestamp: number; //in UTC milliseconds
  ask_size: number;
  bid_size: number;
  exchange: string;
  vega: number; // UW: available,  MC: N/A  drop from full option flow table from 05/13/2024
  theta: number; // UW: available,  MC: N/A
  rho: number; // UW: available,  MC: N/A
  market_cap: number; //source: symbol_meta and alphavantage
  // expiration_cycle: string; //Monthly, Weekly or LEAPS UW: N/A,  MC: available
}
```
- then we store the data into the clickhouse database named `AggregatedOptionTrades` and `RawOptionTrades`

```sql
create table default.AggregatedOptionTrades
(
    id                   String,
    date                 Date,
    size                 Int32,
    price                Float32,
    premium              Int32,
    bid                  Float32,
    ask                  Float32,
    time                 DateTime,
    symbol               String,
    put_call             String,
    strike               Float32,
    expiration_date      Date,
    underlying_type      String,
    option_activity_type String,
    oi                   Int32,
    underlying_price     Float32,
    sentiment            String,
    expiry_days          Int32,
    side                 String,
    moneyness            String,
    iv                   Float32,
    delta                Float32,
    option_symbol        String,
    gamma                Float32,
    daily_volume         Int32,
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
)
```

-- this is the DDL for the `RawOptionTrades` table
```sql
create table default.RawOptionTrades
(
    id                   String,
    date                 Date,
    size                 UInt32,
    price                Float32,
    premium              UInt32,
    bid                  Float32,
    ask                  Float32,
    time                 DateTime,
    symbol               String,
    put_call             String,
    strike               Float32,
    expiration_date      Date,
    underlying_type      String,
    option_activity_type String,
    oi                   UInt32,
    underlying_price     Float32,
    sentiment            String,
    expiry_days          UInt16,
    side                 String,
    moneyness            String,
    iv                   Float32,
    delta                Float32,
    option_symbol        String,
    gamma                Float32,
    daily_volume         UInt32,
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
    engine = SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PARTITION BY date
        PRIMARY KEY time
        ORDER BY time
        SETTINGS index_granularity = 8192;


```

- the reason why we need the `AggregatedOptionTrades` is that it allows us to aggregate the option trades for those executed at the same time, symbol, and strike price. This is important because it allows us to analyze the overall market sentiment and volume for a given option contract. It reduces the amount of data that needs to be processed and analyzed, making it more efficient and scalable. and it is useful to aggregate those orders that trade split across multiple exchanges, it is useful to identify the unusual option trading activity even the trader split the huge order into smaller orders.
