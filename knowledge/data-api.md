# Data API Reference

This document summarises external data APIs used across the broader TradingFlow platform, categorized by the core data domain they serve.

> **Webapp runtime boundary (updated 2026-07-10):** Rank structure, GEX, and daily price/ATR context still read normalized data from the CF Worker + ClickHouse contract-rank path. The one deliberate provider exception is the paid GEX price chart's intraday candle endpoint, which fetches Massive one-minute aggregates server-side. The browser never receives the provider credential or provider response shape. The webapp still does not consume Alpaca market-data (`APCA_*`) or Longport/LONGBRIDGE; Portfolio's Alpaca OAuth remains a separate read-only broker integration.

---

## 1. Symbol Metadata

APIs used to retrieve intrinsic properties of a symbol (name, sector, outstanding shares, type, historical volatility).

### Symbol Reference (Polygon Ticker Details)
> 📄 Docs: [https://polygon.io/docs/stocks/get_v3_reference_tickers__ticker](https://polygon.io/docs/stocks/get_v3_reference_tickers__ticker)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/sync-symbol-meta/api/polygon-reference.ts` |
| **Endpoint** | `GET https://api.polygon.io/v3/reference/tickers/{symbol}` |
| **Auth** | `apiKey` query parameter (using `MASSIVE_API_KEY` directly against Polygon) |
| **Symbols** | ⚠️ **Single symbol only** per call. |
| **Purpose** | Fetch enriched ticker details. Used by **`sync-symbol-meta`** to override the underlying type (e.g. `ETF` vs `STOCK` vs `INDEX`), get company description, outstanding shares, and calculate Market Cap. |
| **Index & Alias Support** | ✅ **Supports Indices** (requires `I:` prefix, e.g., `I:SPX`). Alias roots (`SPXW`, `XSP`, `VIXW`, `NDXP`, `XND`) return 404 and must be mapped to their canonical index ticker (`I:SPX`) for the API lookup. |
| **Consumer** | `SyncSymbolMetaService` → `enrichWithPolygonReference` |

### Longport Basic Information Of Securities (Future Integration)
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

*Not yet integrated — candidate for future use.*

| | |
|---|---|
| **Endpoint** | `GET /v1/quote/pull/static` |
| **Index & Alias Support** | ✅ **Supports Indices** (uses `.SYMBOL.US` format). Alias roots (`SPXW`, `RUTW`, `VIXW`, `XSP`, `MRUT`, `NDXP`, `XND`) are **not** separate symbols; they must be mapped to canonical (e.g., `SPXW` -> `.SPX.US`). |
| **Response Schema** | JSON array of results (e.g., `secu_static_info: [...]`). |

### Earnings Calendar (Alpha Vantage)
> 📄 Docs: [https://www.alphavantage.co/documentation/#earnings-calendar](https://www.alphavantage.co/documentation/#earnings-calendar)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/sync-symbol-meta/api/alpha-vantage.ts` |
| **Endpoint** | `GET /query?function=EARNINGS_CALENDAR&horizon=3month&apikey={KEY}` |
| **Purpose** | Fetch upcoming earnings report dates for stocks. Used by `sync-symbol-meta` to enrich ticker metadata. |
| **Index & Alias Support** | ❌ **Does not support Indices.** Indices do not have earnings reports. |

---

## 2. Symbol Stock Price (Spot, Quotes, & Aggregates)

APIs used to fetch current live spot prices, batch market snapshots, and daily/minute historical aggregates (OHLCV) for stocks and indices.

### Full Market Snapshot (Batch Spot Prices)
> 📄 Docs: [https://massive.com/docs/rest/stocks/snapshots/full-market-snapshot](https://massive.com/docs/rest/stocks/snapshots/full-market-snapshot)

| | |
|---|---|
| **Project** | Retired from `tradingflow-webapp-fullstack` |
| **Massive endpoint** | `GET /v2/snapshot/locale/us/markets/stocks?apiKey=<KEY>` |
| **Symbols** | ✅ **Multiple tickers at once** — supports a `tickers` comma-separated list, or full market if omitted. |
| **Purpose** | Returns price, volume, OHLC, and trade activity in a single response. Formerly used as a webapp GEX/chain spot fallback. |
| **Index & Alias Support** | ❌ **Does not support Indices.** Returns empty data or fails for `SPX`, `SPXW`, and `I:SPX`. (Optimized for US Equities and ETFs). Use `Index Snapshot` for indices. |
| **Consumer** | No current `tradingflow-webapp-fullstack` consumer. |

**Sample request (filtered to specific tickers):**
```
GET https://api.massive.com/v2/snapshot/locale/us/markets/stocks?tickers=AAPL,TSLA,SPY&apiKey=<KEY>
```

### Alpaca Stock Snapshots (Underlying Spot Price)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/syncUwData/alpaca.ts` |
| **Alpaca endpoint** | `GET /v2/stocks/snapshots?symbols={SYMBOLS}&feed=iex` |
| **Symbols** | ✅ **Multiple symbols per request** — up to **500 symbols** passed as a comma-separated list. |
| **Purpose** | Resolve the current spot price for a list of stock symbols. Used during the **`syncUwData`** process to attach an `underlying_price` to each UW (Unusual Whales) trade record before writing to ClickHouse. |
| **Price resolution** | Tries in order: `latestTrade.p` → `minuteBar.c` → `dailyBar.c` |
| **Index & Alias Support** | ❌ **Does not support Indices.** Returns empty data for `SPX`/`SPXW` and a 400 error for `I:SPX`. (Optimized for US Equities and ETFs). |
| **Consumer** | `syncUwData` loop |

**Sample request:**
```
GET https://data.alpaca.markets/v2/stocks/snapshots?symbols=AAPL,TSLA,NVDA,SPY,QQQ&feed=iex
APCA-API-KEY-ID: <KEY_ID>
APCA-API-SECRET-KEY: <SECRET_KEY>
```

### Single Stock Snapshot (Live Quote)

| | |
|---|---|
| **Project** | Retired from `tradingflow-webapp-fullstack` |
| **Internal route** | Removed |
| **Massive endpoint** | `GET /v2/snapshot/locale/us/markets/stocks/tickers?tickers={TICKER}` |
| **Symbols** | ⚠️ **Single symbol only** — the proxy enforces exactly one ticker. |
| **Purpose** | Former single-stock live quote proxy. Rank/GEX no longer calls this provider path. |
| **Consumer** | No current `tradingflow-webapp-fullstack` consumer. |

**Former sample request:** removed with the retired webapp proxy route.

### Index Snapshot (Live Quote)
> 📄 Docs: [https://polygon.io/docs/indices/get_v3_snapshot_indices](https://polygon.io/docs/indices/get_v3_snapshot_indices)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/syncUwData/massive.ts` |
| **Massive endpoint** | `GET /v3/snapshot/indices?ticker.any_of={TICKERS}` |
| **Symbols** | ✅ **Multiple symbols per request** — up to all four index families passed via `ticker.any_of` (e.g. `I:SPX,I:RUT,I:VIX,I:NDX`). |
| **Index & Alias Support** | ✅ **Supports Indices**. Highly permissive: accepts and returns data for `I:SPX`, `SPX`, `SPXW`, and `I:SPXW` interchangeably without error. |
| **Purpose** | Fetch a real-time price quote for multiple major market indices. Used by the **`syncUwData`** component to resolve canonical underlying prices for index options. |
| **Consumer** | `MassiveIndexQuoteProvider` → `getLatestQuote()` (process service). No current `tradingflow-webapp-fullstack` consumer. |

**Sample request:**
```
GET https://api.massive.com/v3/snapshot/indices?ticker.any_of=I:SPX,I:RUT,I:VIX,I:NDX&apiKey=<MASSIVE_API_KEY>
```

### 1-Minute OHLC Aggregates (GEX price candles)

| | |
|---|---|
| **Project** | `tradingflow-webapp-fullstack` |
| **Internal route** | Paid `GET /api/market-rank/symbol-candles?symbol={SYMBOL}&date={YYYY-MM-DD}&interval={1\|5\|15\|30\|60\|240}` |
| **Massive endpoint** | `GET /v2/aggs/ticker/{TICKER}/range/1/minute/{from}/{to}` |
| **Symbols** | ⚠️ **Single symbol only** — one call per ticker. |
| **Auth** | Server-only `Authorization: Bearer <MASSIVE_API_KEY>`; the internal endpoint separately enforces the Rank premium entitlement. |
| **Purpose** | True underlying candles for the GEX `1m · 5m · 15m · 30m · 1h · 4h` selector. The server requests one-minute bars (explicitly unadjusted for stocks/ETFs; adjustment and volume not applicable for cash indices), keeps 09:30 ET through the official close (normally 16:00; 13:00 on early-close sessions), and resamples larger intervals from the regular-session open. |
| **Index & Alias Support** | ✅ **Supports Indices** via `I:` tickers. Weekly roots fold to the same cash index (`SPXW→I:SPX`, `NDXP→I:NDX`, etc.); price-distinct mini products remain distinct (`XSP→I:XSP`, `XND→I:XND`, `MRUT→I:MRUT`). |
| **Caching / polling** | The visible latest-session browser query polls every 30s from 09:30 ET through official close + 20m. A per-instance 15s server cache coalesces concurrent calls; historical responses cache for 6h; transient refresh failures can serve the last-good response for up to 30m. Empty/malformed provider refreshes are failures and cannot overwrite last-good candles. |
| **Consumer** | Symbol-level analysis → symbol drawer → GEX → Price & GEX Levels. |

Production use must be covered by a Massive plan/license that permits commercial redistribution to TradingFlow users; individual/personal plan access is not sufficient evidence of redistribution rights.

### Daily OHLCV & HV (Polygon Aggregates)
> 📄 Docs: [https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to](https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/sync-symbol-meta/api/polygon-aggregates.ts` |
| **Endpoint** | `GET https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}` |
| **Symbols** | ⚠️ **Single symbol only** per call. |
| **Purpose** | Fetch up to 60 daily bars for a given symbol. Used by **`sync-symbol-meta`** to extract end-of-day price/volume, derive 20-day average volume, and self-calculate Historical Volatility (HV) over the last 35 trading days. |
| **Index & Alias Support** | ✅ **Supports Indices.** Strictly requires the `I:` prefix (e.g., `I:SPX`). Alias roots like `SPXW` or `VIXW` return no results and must be mapped to canonical `I:SPX` before requesting from Polygon. |
| **Consumer** | `SyncSymbolMetaService` → `fetchAggregatesAndBuildBaseMeta` |

**Sample request:**
```
GET https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2026-01-15/2026-03-11?adjusted=true&sort=asc&limit=60&apiKey=<MASSIVE_API_KEY>
```

### Longport Real-time Quotes & History (Future Integration)
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

*Not yet integrated — candidate for future use.*

| | |
|---|---|
| **Real-time Quotes endpoint** | `GET /v1/quote/pull/quote` |
| **History endpoint** | `GET /v1/quote/pull/history-candlestick` |
| **Purpose** | Fetch real-time live spot prices or historical OHLCV candlestick data for securities. Not a webapp fallback provider. |
| **Index & Alias Support** | ✅ **Supports Indices** (requires `.SYMBOL.US` format). Alias roots like `SPXW.US` must map to canonical `.SPX.US`. |
| **Response Schema** | Standard JSON format returning an array of quote/history data elements mapped from Protobuf (e.g., `"securityCalcIndex": [...]`). |

---

## 3. Option Chain Data

APIs used to fetch full option chains, including greeks, implied volatility, quotes, and open interest for specific underlying assets.

### Option Chain Snapshot (Full Chain)
> 📄 Docs: [https://massive.com/docs/rest/options/snapshots/option-chain-snapshot](https://massive.com/docs/rest/options/snapshots/option-chain-snapshot)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/optionchain-data/massive-client.ts` |
| **Massive endpoint** | `GET /v3/snapshot/options/{symbol}?limit=250&sort=ticker&order=asc` |
| **Symbols** | ⚠️ **Single underlying symbol per call** — the symbol is in the URL path. |
| **Purpose** | Fetch the **complete option chain snapshot** for an underlying symbol — all contracts with greeks (delta, gamma, theta, vega), IV, OI, last quote/trade, and underlying asset data. |
| **Index & Alias Support** | ✅ **Supports Indices.** Requires the **`I:`-prefixed canonical index** (e.g., `I:SPX`). Requesting bare roots (`SPX`) or alias roots (`SPXW`, `XSP`, `VIXW`) is not reliable for IV/greeks and must be normalized to canonical `I:` symbols before requesting the chain. |
| **Pagination** | Cursor-based via `next_url` in each response; iterates until `next_url` is absent. |
| **Consumer** | `fetchOptionChainDataController` and ad-hoc endpoint `GET /fetchOptionChainDataControllerMassive`. |

**Upstream call (page 1):**
```
GET https://api.massive.com/v3/snapshot/options/SPY?limit=250&sort=ticker&order=asc
Authorization: Bearer <MASSIVE_API_KEY>
```

### Alpaca Option Snapshots (Future Integration)
> 📄 Docs: [https://docs.alpaca.markets/reference/optionsnapshots](https://docs.alpaca.markets/reference/optionsnapshots)

*Not yet integrated — candidate for future use.*

| | |
|---|---|
| **Alpaca endpoint** | `GET https://data.alpaca.markets/v1beta1/options/snapshots` |
| **Symbols** | ✅ **Multiple option contract symbols** — pass a comma-separated list of OCC-format option symbols (e.g. `AAPL260321C00200000,AAPL260321P00200000`). |
| **Purpose** | Returns the latest trade, latest quote, and greeks for each given **option contract symbol**. Useful for looking up specific known contracts by their full OCC ticker. |
| **Index & Alias Support** | ✅ **Supports Indices.** Works for index options using OCC format. |
| **Potential use case** | None in `tradingflow-webapp-fullstack`; retained here only as upstream API reference. |

### Alpaca Option Chain
> 📄 Docs: [https://docs.alpaca.markets/reference/optionchain](https://docs.alpaca.markets/reference/optionchain)

| | |
|---|---|
| **Alpaca endpoint** | `GET https://data.alpaca.markets/v1beta1/options/snapshots/{underlying_symbol}` |
| **Symbols** | ⚠️ **Single underlying symbol** — the underlying (e.g. `SPY`, `AAPL`) is embedded in the URL path. |
| **Purpose** | Returns the latest trade, latest quote, and greeks for **every option contract** on a given underlying symbol. This is the Alpaca equivalent of the Massive `/v3/snapshot/options/{symbol}` call currently in use. |
| **Index & Alias Support** | ✅ **Supports Indices.** Uses root-form underlyings (`SPX`, `SPXW`, `XSP`) in the path. Does **not** accept Polygon/Massive-style `I:` prefixes (`I:SPX` returns a 400 error). |
| **Current TradingFlow use** | Retired from `tradingflow-webapp-fullstack`; Rank/GEX full-chain data comes from the CF Worker + ClickHouse contract-rank path. |

### Longport Symbol & Price Details (Verified)
| Category | Details |
|---|---|
| **Index Symbol Format** | `.SYMBOL.US` (e.g., `.SPX.US`, `.NDX.US`) |
| **Alias Root Mapping** | `SPXW` -> `.SPX.US`, `RUTW` -> `.RUT.US` (Not supported natively) |
| **Security Category (Index)** | Identified by leading `.`, empty `exchange`, and/or index `board` values. |
| **Security Category (Stock/ETF)** | Differentiate via name scanning (e.g., "ETF" in name) and `totalShares > 0`. |
| **Spot Quote Coverage** | Verified live spot quotes for stocks/ETFs and major index symbols using the `.SYMBOL.US` canonical format. |

### Longport Option Chain & Quotes
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

| Feature | Details |
|---|---|
| **Option Chain endpoint** | `GET /v1/quote/pull/optionchain-date-strike` |
| **Option Quotes endpoint** | `GET /v1/quote/pull/option-quote` |
| **Index Options Format** | Uses `{Root}{YYMMDD}{C/P}{Strike}.US`, e.g., `AAPL220429C150000.US`. |
| **Access Warning** | Real-time options require `USOption` market data permissions (Error `301604` if missing). |
| **Response Schema** | JSON array format (e.g., `option_quote: [...]`, `strike_price_info: [...]`). |
| **Underlying Price** | Included in the `OptionQuote` response (verified via SDK definitions). |
| **Current TradingFlow use** | Retired from `tradingflow-webapp-fullstack`; Longport is not a webapp fallback provider. |
