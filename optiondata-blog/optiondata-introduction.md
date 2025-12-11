---
title: "Unlock the Power of Market Data with OptionData.io: A Guide to Real-Time & Historical Option Data APIs"
date: "2024-05-20"
description: "Discover OptionData.io, a premier provider of real-time option data via WebSocket and historical option data via a flexible SQL-based API. Learn how to integrate these powerful tools into your trading strategies and applications."
keywords: ["Option Data API", "Real-time Option Data", "Historical Option Data", "WebSocket API", "Financial Data", "OptionData.io", "Algorithmic Trading", "Market Data"]
---

# Unlock the Power of Market Data with OptionData.io

In the fast-paced world of financial markets, access to accurate, timely, and comprehensive data is the cornerstone of any successful trading strategy. Whether you are an algorithmic trader, a quantitative analyst, or a developer building the next generation of fintech applications, having reliable data streams is non-negotiable.

Enter **[OptionData.io](https://www.optiondata.io/)**, a robust platform designed to democratize access to institutional-grade option data. With a focus on flexibility and performance, OptionData.io offers two core services that cater to the diverse needs of the market: a low-latency **Real-Time Option Data Websocket Service** and a powerful **Historical Option Data API**.

In this article, we'll explore these services in detail and show you how to leverage them for your projects.

## Real-Time Option Data Websocket Service

Speed is everything when it comes to live trading. OptionData.io provides a high-performance WebSocket API that delivers real-time option trades directly to your application. This service is perfect for monitoring market flow, detecting unusual option activity, and executing automated trading strategies.

### Key Features
*   **Full Market Firehose:** Unlike competitors that require you to specify a limited list of symbols to manage bandwidth, OptionData.io's unique high-volume technology allows you to stream **every single US option trade reported on the OPRA feed**. This is a game-changer for developers looking to detect unusual option activity across the entire market without needing to know which symbols to watch in advance.
*   **Low Latency:** Receive trade data the instant it happens.
*   **Comprehensive Filtering:** Subscribe to specific symbols or filter the entire market stream based on criteria like premium, sentiment, delta, moneyness, and more.
*   **Rich Data Points:** Each data packet includes detailed Greeks (Delta, Gamma, Vega, Theta, Rho), Implied Volatility (IV), sentiment analysis (Bullish/Bearish/Neutral), and trade details (Size, Price, Exchange).

### How to Connect
Connecting to the WebSocket is straightforward. You simply establish a connection to `wss://ws.optiondata.io` and send a JSON payload to authenticate and subscribe.

**Endpoint:** `wss://ws.optiondata.io`  
**Documentation:** [Realtime Option Data API Docs](https://docs.optiondata.io/websocket-data-api/realtime-option-data-api)

#### Sample Subscription Request
Here is an example of how to subscribe to real-time data for `SPY` and `TSLA` with a minimum premium of $100,000:

```json
{
  "token": "your_api_token_here",
  "symbols": "SPY,TSLA",
  "premium": "[100000,null]",
  "aggregation_mode": "AGGREGATED"
}
```

#### Sample Response
The API returns a rich JSON object for every trade:

```json
{
  "status": "SUCCESS",
  "data": {
    "symbol": "TSLA",
    "time": "2024-11-11 11:50:20",
    "price": 15.24,
    "size": 10,
    "premium": 15240,
    "put_call": "CALL",
    "strike": 27,
    "expiration_date": "2027-01-15",
    "iv": 0.67,
    "delta": 0.7664,
    "sentiment": "NEUTRAL",
    "option_activity_type": "AGGREGATED"
    // ... and more
  }
}
```

## Historical Option Data API

Backtesting is a critical step in validating any trading hypothesis. OptionData.io's Historical Option Data API allows you to query vast archives of option trade data using standard SQL syntax. This unique approach gives you unparalleled flexibility to retrieve exactly the data you need without downloading massive CSV files.

### Key Features
*   **SQL-Based Querying:** Use standard SQL (`SELECT`, `WHERE`, `GROUP BY`, `ORDER BY`) to filter and aggregate data on the fly.
*   **Granular Access:** Query by symbol, date range, strike price, option type, and more.
*   **Materialized Views:** Access optimized views like `RawOptionTradesMaxDateOnlyMV` for faster queries on the most recent data.

### How to Query
The historical data is accessed via a simple HTTP POST request. You send your SQL query in the request body, and the API returns the results in JSON format.

**Endpoint:** `https://api.optiondata.io/api-portal/historical-trades-by-sql`  
**Documentation:** [Historical Option Data API Docs](https://docs.optiondata.io/http-data-api/historical-option-data-api)

#### Sample Request (cURL)
To get the top 10 trades for AAPL:

```bash
curl -X POST https://api.optiondata.io/api-portal/historical-trades-by-sql \
-H "Content-Type: application/json" \
-d '{
  "api_key": "your_api_key_here",
  "sql": "SELECT * FROM RawOptionTrades WHERE symbol = '\''AAPL'\'' LIMIT 10"
}'
```

#### Powerful Analytical Queries
You can perform complex analysis directly via the API. For example, to find the total volume and average premium for a specific symbol grouped by day:

```sql
SELECT 
  date, 
  COUNT(*) as total_trades, 
  AVG(premium) as avg_premium, 
  SUM(size) as total_volume 
FROM RawOptionTrades 
WHERE symbol = 'TSLA' 
GROUP BY date 
ORDER BY date DESC 
LIMIT 20
```

## Why Choose OptionData.io?

1.  **Developer Friendly:** With clear documentation and standard protocols (WebSocket & HTTP/SQL), integration is seamless.
2.  **Cost-Effective:** Access institutional-quality data without the institutional price tag.
3.  **Data Integrity:** Reliable data sourced and processed to ensure accuracy for your critical trading decisions.

## Get Started Today

Ready to elevate your trading strategy? Visit **[OptionData.io](https://www.optiondata.io/)** to sign up for an account and get your API keys. Whether you need the pulse of the market in real-time or deep historical insights, OptionData.io has you covered.

*   **Homepage:** [https://www.optiondata.io/](https://www.optiondata.io/)
*   **Real-Time API Docs:** [https://docs.optiondata.io/websocket-data-api/realtime-option-data-api](https://docs.optiondata.io/websocket-data-api/realtime-option-data-api)
*   **Historical API Docs:** [https://docs.optiondata.io/http-data-api/historical-option-data-api](https://docs.optiondata.io/http-data-api/historical-option-data-api)
