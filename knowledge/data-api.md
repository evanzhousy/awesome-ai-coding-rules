# Data API Reference

This document summarises every external data API currently consumed across the TradingFlow platform, which project uses it, and exactly what each call does.

---

## Massive.com API

Base URL: `https://api.massive.com`

Auth strategies vary by project:
- **webapp** – `apiKey` query parameter (env: `MASSIVE_API_KEY`)
- **process-service** – `Authorization: Bearer <MASSIVE_API_KEY>` header

### tradingflow-webapp-fullstack

The webapp exposes two internal server-side proxy routes that call Massive and return the result to the frontend.

#### 1. Stock Snapshot (Live Quote)

| | |
|---|---|
| **Internal route** | `GET /api/massive/v2/snapshot/locale/us/markets/stocks/tickers` |
| **Massive endpoint** | `GET /v2/snapshot/locale/us/markets/stocks/tickers?tickers={TICKER}` |
| **Symbols** | ⚠️ **Single symbol only** — the proxy enforces exactly one ticker; requests with 0 or 2+ tickers are rejected with HTTP 400. |
| **Purpose** | Fetch a real-time price quote for a single stock ticker. Used by the **GEX Screener** page to display a live underlying price. |
| **Caching** | In-memory cache with a 5-second TTL per ticker to reduce external calls. |
| **Consumer** | `massiveSnapshotService.ts` → `fetchSelectedSymbolLiveQuote` |

**Sample request:**
```
GET /api/massive/v2/snapshot/locale/us/markets/stocks/tickers?tickers=AAPL
```

**Massive upstream call:**
```
GET https://api.massive.com/v2/snapshot/locale/us/markets/stocks/tickers?tickers=AAPL&apiKey=<KEY>
```

**Sample response shape:**
```json
{
  "tickers": [
    {
      "ticker": "AAPL",
      "day": { "c": 213.49, "h": 214.20, "l": 211.80, "o": 212.10, "v": 45000000 },
      "lastTrade": { "p": 213.49, "s": 100, "t": 1710000000000000000 },
      "lastQuote": { "P": 213.50, "p": 213.48 },
      "prevDay": { "c": 210.00 }
    }
  ]
}
```

---

#### 2. 1-Minute OHLC Aggregates (Backfill)

| | |
|---|---|
| **Internal route** | `GET /api/massive/v2/aggs` |
| **Massive endpoint** | `GET /v2/aggs/ticker/{TICKER}/range/1/minute/{from}/{to}` |
| **Symbols** | ⚠️ **Single symbol only** — the ticker is embedded in the URL path; one call per ticker. |
| **Purpose** | Fetch 1-minute OHLC bars for a stock or index for a given date range. Used by the **Option Trades** page to backfill the `underlying_price` field on each trade by matching trade timestamps to the nearest minute bar close. |
| **Index fallback** | For known index underlyings (SPX, SPXW, NDX, RUT, VIX, VIXW, XSP, XND), if the stock ticker returns no results, the call is retried with Polygon indices format `I:{TICKER}`. |
| **Consumer** | `massiveSpotBackfill.ts` → `fetchMinuteSpotMap` |

**Sample request:**
```
GET /api/massive/v2/aggs?ticker=SPY&from=2026-03-14&to=2026-03-14
```

**Massive upstream call:**
```
GET https://api.massive.com/v2/aggs/ticker/SPY/range/1/minute/2026-03-14/2026-03-14?apiKey=<KEY>
```

**Index fallback upstream call (if SPY returned 0 results and ticker is an index like SPX):**
```
GET https://api.massive.com/v2/aggs/ticker/I:SPX/range/1/minute/2026-03-14/2026-03-14?apiKey=<KEY>
```

**Sample response shape:**
```json
{
  "ticker": "SPY",
  "results": [
    { "t": 1710421200000, "o": 513.10, "h": 513.45, "l": 512.90, "c": 513.20, "v": 120000 },
    { "t": 1710421260000, "o": 513.20, "h": 513.60, "l": 513.00, "c": 513.40, "v": 95000 }
  ],
  "queryCount": 390
}
```

---

### tradingflow-process-service-ec2

#### Option Chain Snapshot (Full Chain)

> 📄 Docs: [https://massive.com/docs/rest/options/snapshots/option-chain-snapshot](https://massive.com/docs/rest/options/snapshots/option-chain-snapshot)

> Retrieve a comprehensive snapshot of all options contracts associated with a specified underlying ticker. Consolidates pricing details, greeks (delta, gamma, theta, vega), implied volatility, quotes, trades, open interest, underlying asset price, and break-even calculations in a single paginated response.

| | |
|---|---|
| **Source file** | `src/optionchain-data/massive-client.ts` |
| **Massive endpoint** | `GET /v3/snapshot/options/{symbol}?limit=250&sort=ticker&order=asc` |
| **Symbols** | ⚠️ **Single underlying symbol per call** — the symbol is in the URL path. The controller loops over all target symbols, calling this once per symbol. |
| **Purpose** | Fetch the **complete option chain snapshot** for an underlying symbol — all contracts with greeks (delta, gamma, theta, vega), IV, OI, last quote/trade, and underlying asset data. |
| **Pagination** | Cursor-based via `next_url` in each response; iterates until `next_url` is absent. |
| **Retries** | Up to 3 attempts per page with exponential backoff (1s, 2s, 4s). Retries on network errors, HTTP 429, and HTTP 5xx. |
| **Output** | Mapped to internal `TF_OptionChainData` schema via `mapMassiveOptionToTfOptionChain` and written to ClickHouse. |
| **IV handling** | Uses Massive-provided IV; recalculates with Black-Scholes if the provided value is missing or invalid. |
| **Trigger** | Cron-driven controller (`fetchOptionChainDataController`) and ad-hoc endpoint `GET /fetchOptionChainDataControllerMassive`. |

**Upstream call (page 1):**
```
GET https://api.massive.com/v3/snapshot/options/SPY?limit=250&sort=ticker&order=asc
Authorization: Bearer <MASSIVE_API_KEY>
```

**Upstream call (subsequent pages, from next_url in response):**
```
GET https://api.massive.com/v3/snapshot/options/SPY?limit=250&sort=ticker&order=asc&cursor=<CURSOR>
Authorization: Bearer <MASSIVE_API_KEY>
```

**Sample response shape (one page):**
```json
{
  "results": [
    {
      "details": { "contract_type": "call", "strike_price": 500, "expiration_date": "2026-03-21", "ticker": "SPY260321C00500000" },
      "greeks": { "delta": 0.62, "gamma": 0.015, "theta": -0.08, "vega": 0.21 },
      "implied_volatility": 0.18,
      "open_interest": 8500,
      "day": { "volume": 1200 },
      "last_quote": { "ask": 14.20, "bid": 14.00 },
      "last_trade": { "price": 14.10 },
      "underlying_asset": { "ticker": "SPY", "price": 513.40 }
    }
  ],
  "next_url": "https://api.massive.com/v3/snapshot/options/SPY?cursor=abc123..."
}
```

---

## Massive API — Future Use (Not Yet Integrated)

> These Massive endpoints have been identified as candidates for future integration. None are currently called by any code in the platform.

---

### Full Market Snapshot

> 📄 Docs: [https://massive.com/docs/rest/stocks/snapshots/full-market-snapshot](https://massive.com/docs/rest/stocks/snapshots/full-market-snapshot)

> Retrieve a comprehensive snapshot of the entire U.S. stock market — 10,000+ actively traded tickers in a single response. Snapshot data is cleared daily at 3:30 AM EST and begins to repopulate as exchanges report new data (from ~4:00 AM EST onward).

| | |
|---|---|
| **Massive endpoint** | `GET https://api.massive.com/v2/snapshot/locale/us/markets/stocks?apiKey=<KEY>` |
| **Symbols** | ✅ **All tickers at once** — no symbol list needed; returns the full US equity market in one call. |
| **Purpose** | Returns price, volume, OHLC, and trade activity for every actively traded US stock in a single response. Eliminates the need for per-ticker queries when full market coverage is required. |
| **Key params** | `include_otc` (bool, include OTC tickers), `tickers` (optional comma-separated filter to narrow results to a subset) |
| **Data freshness** | Reset at 3:30 AM EST daily; repopulates from 4:00 AM EST as exchanges open. |
| **Potential use case** | Could replace the per-symbol snapshot loop in `massiveSnapshotService.ts` for bulk underlying price resolution, or power heat-map / screener features that need full-market data in one shot (Market Rank, Volatility Desk, etc.). |

**Sample request (full market):**
```
GET https://api.massive.com/v2/snapshot/locale/us/markets/stocks?apiKey=<KEY>
Accept: application/json
```

**Sample request (filtered to specific tickers):**
```
GET https://api.massive.com/v2/snapshot/locale/us/markets/stocks?tickers=AAPL,TSLA,SPY&apiKey=<KEY>
Accept: application/json
```

**Sample response shape:**
```json
{
  "tickers": [
    {
      "ticker": "AAPL",
      "day": { "o": 212.10, "h": 214.20, "l": 211.80, "c": 213.49, "v": 45000000, "vw": 213.01 },
      "lastTrade": { "p": 213.49, "s": 100, "t": 1710000000000000000 },
      "lastQuote": { "P": 213.50, "p": 213.48 },
      "prevDay": { "c": 210.00, "v": 42000000 },
      "todaysChangePerc": 1.66,
      "todaysChange": 3.49
    },
    {
      "ticker": "TSLA",
      "day": { "o": 176.00, "h": 180.00, "l": 175.50, "c": 178.20, "v": 30000000, "vw": 177.80 },
      "lastTrade": { "p": 178.20, "s": 50, "t": 1710000000000000001 },
      "lastQuote": { "P": 178.25, "p": 178.15 },
      "prevDay": { "c": 175.00, "v": 28000000 },
      "todaysChangePerc": 1.83,
      "todaysChange": 3.20
    }
  ],
  "status": "OK",
  "count": 10452
}
```

---

## Alpaca API

Base URL: `https://data.alpaca.markets`  
Auth: `APCA-API-KEY-ID` + `APCA-API-SECRET-KEY` headers (env vars)  
Feed: `iex`

**Only used in `tradingflow-process-service-ec2`.** Not present in the webapp.

### Stock Snapshots (Underlying Spot Price)

| | |
|---|---|
| **Source file** | `src/syncUwData/alpaca.ts` |
| **Alpaca endpoint** | `GET /v2/stocks/snapshots?symbols={SYMBOLS}&feed=iex` |
| **Symbols** | ✅ **Multiple symbols per request** — up to **500 symbols** passed as a comma-separated list in the `symbols` query param. |
| **Purpose** | Resolve the current spot price for a list of stock symbols. Used during the **`syncUwData`** process to attach an `underlying_price` to each UW (Unusual Whales) trade record before writing to ClickHouse. |
| **Price resolution** | Tries in order: `latestTrade.p` → `minuteBar.c` → `dailyBar.c` |
| **Batch strategy** | First attempts a single giant batch (all symbols at once); on failure (HTTP 400, 408, 413, 414, 422, 429, or 5xx) falls back to sequential chunked requests of 500 each. |
| **Timeout** | 30 seconds per request. |
| **Credential check** | `hasAlpacaSnapshotCredentials()` skips the call entirely if env vars are absent. |
| **Output** | `Map<symbol, price>` — written into UW trade rows in the `AlpacaTrades` ClickHouse table. |
| **Refresh interval** | Called on a 5-minute rolling interval during market hours as part of the `syncUwData` loop. |

**Sample request (giant batch):**
```
GET https://data.alpaca.markets/v2/stocks/snapshots?symbols=AAPL,TSLA,NVDA,SPY,QQQ&feed=iex
APCA-API-KEY-ID: <KEY_ID>
APCA-API-SECRET-KEY: <SECRET_KEY>
```

**Sample response shape:**
```json
{
  "AAPL": {
    "latestTrade": { "p": 213.49, "s": 100, "t": "2026-03-14T20:59:59Z" },
    "minuteBar":  { "c": 213.45, "h": 213.60, "l": 213.30, "o": 213.35, "v": 5200 },
    "dailyBar":   { "c": 213.49, "h": 214.20, "l": 211.80, "o": 212.10, "v": 45000000 }
  },
  "TSLA": {
    "latestTrade": { "p": 178.20, "s": 50, "t": "2026-03-14T20:59:58Z" },
    "minuteBar":  { "c": 178.15, "h": 178.40, "l": 177.90, "o": 178.00, "v": 3100 },
    "dailyBar":   { "c": 178.20, "h": 180.00, "l": 175.50, "o": 176.00, "v": 30000000 }
  }
}

---

## Alpaca API — Future Use (Not Yet Integrated)

> These two Alpaca endpoints have been identified as candidates for future integration. Neither is currently called by any code in the platform.

---

### Option Snapshots

> 📄 Docs: [https://docs.alpaca.markets/reference/optionsnapshots](https://docs.alpaca.markets/reference/optionsnapshots)

| | |
|---|---|
| **Alpaca endpoint** | `GET https://data.alpaca.markets/v1beta1/options/snapshots` |
| **Symbols** | ✅ **Multiple option contract symbols** — pass a comma-separated list of OCC-format option symbols (e.g. `AAPL260321C00200000,AAPL260321P00200000`). |
| **Purpose** | Returns the latest trade, latest quote, and greeks for each given **option contract symbol**. Useful for looking up specific known contracts by their full OCC ticker. |
| **Potential use case** | Could replace or supplement the Massive `/v3/snapshot/options/{symbol}` call for fetching greeks + quotes on a targeted subset of contracts (rather than paginating through a full chain). |

**Sample request:**
```
GET https://data.alpaca.markets/v1beta1/options/snapshots?symbols=AAPL260321C00200000,AAPL260321P00200000&feed=indicative
APCA-API-KEY-ID: <KEY_ID>
APCA-API-SECRET-KEY: <SECRET_KEY>
```

**Sample response shape:**
```json
{
  "snapshots": {
    "AAPL260321C00200000": {
      "latestTrade": { "p": 14.10, "s": 1, "t": "2026-03-14T19:59:00Z" },
      "latestQuote": { "ap": 14.20, "bp": 14.00, "as": 10, "bs": 10 },
      "greeks": { "delta": 0.62, "gamma": 0.015, "theta": -0.08, "vega": 0.21, "rho": 0.05 },
      "impliedVolatility": 0.18
    },
    "AAPL260321P00200000": {
      "latestTrade": { "p": 1.85, "s": 5, "t": "2026-03-14T19:58:00Z" },
      "latestQuote": { "ap": 1.90, "bp": 1.80, "as": 20, "bs": 15 },
      "greeks": { "delta": -0.38, "gamma": 0.015, "theta": -0.05, "vega": 0.21, "rho": -0.03 },
      "impliedVolatility": 0.20
    }
  }
}
```

---

### Option Chain

> 📄 Docs: [https://docs.alpaca.markets/reference/optionchain](https://docs.alpaca.markets/reference/optionchain)

| | |
|---|---|
| **Alpaca endpoint** | `GET https://data.alpaca.markets/v1beta1/options/snapshots/{underlying_symbol}` |
| **Symbols** | ⚠️ **Single underlying symbol** — the underlying (e.g. `SPY`, `AAPL`) is embedded in the URL path. Returns all option contracts for that underlying. |
| **Purpose** | Returns the latest trade, latest quote, and greeks for **every option contract** on a given underlying symbol. This is the Alpaca equivalent of the Massive `/v3/snapshot/options/{symbol}` call currently in use. |
| **Key params** | `expiration_date` (filter by expiry), `strike_price_gte` / `strike_price_lte` (strike range), `type` (`call`/`put`), `feed`, `limit`, `page_token` (cursor pagination). |
| **Potential use case** | Could serve as a direct alternative or fallback to the Massive option chain endpoint (`massive-client.ts`) for fetching full option chain data with greeks and quotes. Uses the same `APCA-API-KEY-ID` / `APCA-API-SECRET-KEY` credentials already in use. |

**Sample request:**
```
GET https://data.alpaca.markets/v1beta1/options/snapshots/SPY?expiration_date=2026-03-21&feed=indicative&limit=100
APCA-API-KEY-ID: <KEY_ID>
APCA-API-SECRET-KEY: <SECRET_KEY>
```

**Sample response shape:**
```json
{
  "snapshots": {
    "SPY260321C00500000": {
      "latestTrade": { "p": 14.10, "s": 2, "t": "2026-03-14T19:59:00Z" },
      "latestQuote": { "ap": 14.20, "bp": 14.00, "as": 5, "bs": 5 },
      "greeks": { "delta": 0.62, "gamma": 0.015, "theta": -0.08, "vega": 0.21, "rho": 0.05 },
      "impliedVolatility": 0.18
    },
    "SPY260321P00500000": {
      "latestTrade": { "p": 2.05, "s": 1, "t": "2026-03-14T19:58:30Z" },
      "latestQuote": { "ap": 2.10, "bp": 2.00, "as": 10, "bs": 8 },
      "greeks": { "delta": -0.38, "gamma": 0.015, "theta": -0.05, "vega": 0.21, "rho": -0.03 },
      "impliedVolatility": 0.20
    }
  },
  "next_page_token": "abc123..."
}
```
