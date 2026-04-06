# Data API Reference

This document summarises every external data API currently consumed across the TradingFlow platform, categorized by the core data domain they serve.

---

## Overview Table: Data Dimensions (Stock/ETF vs Indices)

Option-chain data is consumed on **two different surfaces**, each with its own provider order:

- **Batch / ETL (`optionchain-data` → `OptionChainTable`)** — historical snapshot loads used for downstream analytics and ClickHouse; ordering below reflects the process service.
- **GEX live symbol inspection (`tradingflow-webapp-fullstack`)** — per-request live chain for the Gamma Exposure screener drawer (`resolveGexSource` in `gexDrawerInspectionService.ts`). **Massive is primary** (avoids Longport rate/expiry limits on the hot path); Alpaca supplies the chain when paired with **Longport spot** where applicable; Longport chain+spot is **tertiary for equities only**. Indices **never** use Longport as an option-chain source (known unusable expiries for cash index underlyings). All paths run the same **local Black–Scholes enrichment** when IV/Greeks are missing. See also `wiki/current-wiki/domain-invariants/data-apps/gex-screener.md` in `tradingflow-webapp-fullstack`.

| Target Schema | Data Fields | Asset Class | Primary API | Primary Fallback API | Secondary Fallback API |
| --- | --- | --- | --- | --- | --- |
| **`OptionChainTable`**<br>(from `optionchain-data`, **batch / ETL**) | All Option Chain Fields<br>(`close`, `delta`, `theta`, `oi`, `iv`, `gamma`, etc.) | **Stock/ETF** | **Massive/Polygon API**<br><code>/v3/snapshot/options/...</code> | **Alpaca API** + **Local BS Calc**<br><code>/v1beta1/options/snapshots</code> | **Longport Options API**<br><code>/v1/quote/pull/optionchain...</code> |
| | | **Indices** | **Massive/Polygon API** + **Local BS Calc**<br><code>/v3/snapshot/options/...</code> | **Alpaca API** + **Local BS Calc**<br><code>/v1beta1/options/snapshots</code> | **None (N/A)** |
| **GEX symbol inspection (live drawer)**<br>`tradingflow-webapp-fullstack`<br><code>gexDrawerInspectionService.ts</code> | Live option chain + spot for GEX drawer surfaces (same contracts feed ladders, surfaces, Option Chain tab) | **Stock/ETF** | **Massive/Polygon API**<br><code>/v3/snapshot/options/...</code> + spot (embedded or stock snapshot) | **Alpaca API** chain + **Longport** spot<br><code>/v1beta1/options/snapshots/{underlying}</code> + <code>/v1/quote/pull/quote</code> | **Longport** chain + spot<br><code>/v1/quote/pull/optionchain...</code> + quotes |
| | | **Indices** | **Massive/Polygon API**<br><code>/v3/snapshot/options/...</code> + embedded/chain spot | **Alpaca API** chain + **Longport** spot<br>(cash index quote) | **None (N/A)**<br>(_Longport index option-chain expiries not usable_) |
| **`SymbolMetaData`**<br>(from `sync-symbol-meta`) | `earning_date` | **Stock/ETF** | **Alpha Vantage API**<br><code>/query?function=EARNINGS_...</code> | **Massive/Polygon API**<br><code>/v3/reference/tickers/...</code> | **None**<br>(_Defaults to `1970-01-01`_) |
| | | **Indices** | _N/A (Indices do not have earnings)_ | _N/A_ | _N/A_ |
| **`SymbolMetaData`**<br>(from `sync-symbol-meta`) | OHLCV & Historical Volatility<br>(`open`, `high`, `close`, `volume`, `historical_volatility`) | **Stock/ETF** | **Massive/Polygon API**<br><code>/v2/aggs/ticker/...</code> | **Alpaca API**<br><code>/v2/stocks/bars</code> | **Longport History API**<br><code>/v1/quote/pull/history...</code> |
| | | **Indices** | **Massive/Polygon API**<br><code>/v2/aggs/ticker/...</code> | **Longport History API**<br><code>/v1/quote/pull/history...</code> | **None (N/A)** |
| **`SymbolMetaData`**<br>(from `sync-symbol-meta`) | Company Metrics / Static Info<br>(`description`, `market_cap`, `outstanding_shares`, `sector`) | **Stock/ETF** | **Massive/Polygon API**<br><code>/v3/reference/tickers/...</code> | **Longport Static Info API**<br><code>/v1/quote/pull/static</code> | **None (N/A)** |
| | | **Indices** | **Massive/Polygon API**<br><code>/v3/reference/tickers/...</code> | **Longport Static Info API**<br><code>/v1/quote/pull/static</code> | **None (N/A)** |
| **`AggregatedOptionTrades`**<br>**`RawOptionTrades`**<br>(from `syncUwData`) | Option Trade Flow<br>(`price`, `size`, `put_call`, `strike`, `premium`, `dex`, `dei`, etc.) | **Stock/ETF** | **Unusual Whales WebSocket Server**<br><code>wss://options.unusualwhales.com</code> | **None (N/A)** | **None (N/A)** |
| | | **Indices** | **Unusual Whales WebSocket Server**<br><code>wss://options.unusualwhales.com</code> | **None (N/A)** | **None (N/A)** |
| **Trade Enrichment**<br>(from `syncUwData`) | `underlying_price` | **Stock/ETF** | **SymbolMetaData Table**<br>(_Warmed via Alpaca API_) | **Massive/Polygon API**<br>(_Batch spot warming fallback_) | **Longport Quotes API**<br><code>/v1/quote/pull/quote</code> |
| | | **Indices** | **Index Quotes API** (Longport SDK)<br><code>/v1/quote/pull/quote</code> | **Massive/Polygon API**<br><code>/v3/snapshot/indices</code> | **Index Proxy Fallback**<br>(_e.g., SPY x10 for SPX_) |

---

## 1. Symbol Metadata

APIs used to retrieve intrinsic properties of a symbol (name, sector, outstanding shares, type, historical volatility).

### ⚠️ Alpaca API Limitation (Static Information)
> **Note on Fallback Exclusions:** Live verification confirmed that the Alpaca Assets API (`/v2/assets`) returns strictly brokerage-level metadata (exchange, fractionability, margin requirements). It natively **lacks all fundamental data points** such as `description`, `market_cap`, `outstanding_shares`, and `sector`. Consequently, Alpaca does not have the technical capacity to supply Company Metrics and is rigidly designated as **None (N/A)** for static info fallbacks globally across all asset classes.

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
| **Index & Alias Support** | ✅ **Supports Indices** (requires `I:` prefix, e.g., `I:SPX`). Alias roots (`SPXW`, `XSP`, `VIXW`, `NDXP`, `XND`) return 404 and must be mapped to their canonical index ticker (`I:SPX`) for the API lookup. *Live verification confirmed indices naturally return `undefined` for Market Cap/Shares, while equities (`SPY`) return exact equity structures.* |
| **Consumer** | `SyncSymbolMetaService` → `enrichWithPolygonReference` |

### Longport Basic Information Of Securities (Future Integration)
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

*Not yet integrated — candidate for future use.*

| | |
|---|---|
| **Endpoint** | `GET /v1/quote/pull/static` |
| **Index & Alias Support** | ✅ **Supports Indices** (uses `.SYMBOL.US` format). Alias roots (`SPXW`, `RUTW`, `VIXW`, `XSP`, `MRUT`, `NDXP`, `XND`) are **not** separate symbols; they must be mapped to canonical (e.g., `SPXW` -> `.SPX.US`). *Live verification confirmed Longport seamlessly returns exact Board & Market info properties across both `.SPX.US` and `SPY.US` natively.* |
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
| **Project** | `tradingflow-webapp-fullstack` |
| **Massive endpoint** | `GET /v2/snapshot/locale/us/markets/stocks?apiKey=<KEY>` |
| **Symbols** | ✅ **Multiple tickers at once** — supports a `tickers` comma-separated list, or full market if omitted. |
| **Purpose** | Returns price, volume, OHLC, and trade activity in a single response. Used to bulk-resolve underlying spot prices. |
| **Index & Alias Support** | ❌ **Does not support Indices.** Returns empty data or fails for `SPX`, `SPXW`, and `I:SPX`. (Optimized for US Equities and ETFs). Use `Index Snapshot` for indices. |
| **Consumer** | `stocks.ts` (`fetchBatchStockSpots`) → Used by the **GEX Screener** backend (`gexScreener.ts`). |

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
| **Historical Data (Bars API)** | The exact same restriction natively applies across the `/v2/stocks/bars` endpoint logic format. Requests for index strings drop all payload data completely. Thus, all Alpaca fallback parameters logically rest at **N/A** for Indices globally. |
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
| **Project** | `tradingflow-webapp-fullstack` |
| **Internal route** | `GET /api/massive/v2/snapshot/locale/us/markets/stocks/tickers` |
| **Massive endpoint** | `GET /v2/snapshot/locale/us/markets/stocks/tickers?tickers={TICKER}` |
| **Symbols** | ⚠️ **Single symbol only** — the proxy enforces exactly one ticker. |
| **Purpose** | Fetch a real-time price quote for a single stock ticker. Used by the **GEX Screener** page to display a live underlying price. |
| **Consumer** | `massiveSnapshotService.ts` → `fetchSelectedSymbolLiveQuote` |

**Sample request:**
```
GET /api/massive/v2/snapshot/locale/us/markets/stocks/tickers?tickers=AAPL
```

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
| **Consumer** | `MassiveIndexQuoteProvider` → `getLatestQuote()` |

**Sample request:**
```
GET https://api.massive.com/v3/snapshot/indices?ticker.any_of=I:SPX,I:RUT,I:VIX,I:NDX&apiKey=<MASSIVE_API_KEY>
```

### 1-Minute OHLC Aggregates (Backfill)

| | |
|---|---|
| **Project** | `tradingflow-webapp-fullstack` |
| **Internal route** | `GET /api/massive/v2/aggs` |
| **Massive endpoint** | `GET /v2/aggs/ticker/{TICKER}/range/1/minute/{from}/{to}` |
| **Symbols** | ⚠️ **Single symbol only** — one call per ticker. |
| **Purpose** | Fetch 1-minute OHLC bars for a stock or index for a given date range. Used by the **Option Trades** page to backfill the `underlying_price` field on each trade. |
| **Index & Alias Support** | ✅ **Supports Indices.** Strictly requires Polygon's `I:` prefix (e.g., `I:SPX`). `SPX` and `SPXW` return no results. Known indices trigger a fallback to automatically prefix with `I:`. |
| **Consumer** | `massiveSpotBackfill.ts` → `fetchMinuteSpotMap` |

**Sample request:**
```
GET /api/massive/v2/aggs?ticker=SPY&from=2026-03-14&to=2026-03-14
```

### Daily OHLCV & HV (Polygon Aggregates)
> 📄 Docs: [https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to](https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__range__multiplier___timespan___from___to)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/sync-symbol-meta/api/polygon-aggregates.ts` |
| **Endpoint** | `GET https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}` |
| **Symbols** | ⚠️ **Single symbol only** per call. |
| **Purpose** | Fetch up to 60 daily bars for a given symbol. Used by **`sync-symbol-meta`** to extract end-of-day price/volume, derive 20-day average volume, and self-calculate Historical Volatility (HV) over the last 35 trading days. |
| **Index & Alias Support** | ✅ **Supports Indices.** Strictly requires the `I:` prefix (e.g., `I:SPX`). Alias roots like `SPXW` or `VIXW` return no results and must be mapped to canonical `I:SPX` before requesting from Polygon. *Live verification successfully fetched full history pipelines natively for both `SPY` and `I:SPX` without failure.* |
| **Consumer** | `SyncSymbolMetaService` → `fetchAggregatesAndBuildBaseMeta` |

**Sample request:**
```
GET https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2026-01-15/2026-03-11?adjusted=true&sort=asc&limit=60&apiKey=<MASSIVE_API_KEY>
```

### Alpaca Daily OHLCV (Primary Fallback for Stocks/ETFs)
> 📄 Docs: [https://docs.alpaca.markets/reference/stockbars](https://docs.alpaca.markets/reference/stockbars)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Alpaca endpoint** | `GET /v2/stocks/bars?symbols={SYMBOLS}&timeframe=1Day` |
| **Symbols** | ✅ **Multiple symbols per request** |
| **Purpose** | Serve as the **Primary Fallback API** for equities, capable of supplying `open`, `high`, `close`, and `volume` metrics required to self-calculate Historical Volatility. Used when Massive/Polygon API fails. |
| **Index & Alias Support** | ❌ **Does not support Indices.** Fails entirely for index strings (`SPX`, `I:SPX`), hence its limitation to serving strictly as a fallback for the Stock/ETF segment. |
| **Consumer** | `SyncSymbolMetaService` fallback layer |

### Longport Real-time Quotes & History (Secondary Fallback)
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

| | |
|---|---|
| **Real-time Quotes endpoint** | `GET /v1/quote/pull/quote` |
| **History endpoint** | `GET /v1/quote/pull/history-candlestick` |
| **Purpose** | Fetch real-time live spot prices or historical OHLCV candlestick data for securities. Serves as the **Secondary Fallback** API for Stocks/ETFs (after Alpaca) and the **Primary Fallback** API for Indices (since Alpaca does not support them). |
| **Index & Alias Support** | ✅ **Supports Indices** (requires `.SYMBOL.US` format). Alias roots like `SPXW.US` must map to canonical `.SPX.US`. |
| **Response Schema** | Standard JSON format returning an array of quote/history data elements mapped from Protobuf (e.g., `"securityCalcIndex": [...]`). |

---

## 3. Option Chain Data

APIs used to fetch full option chains, including greeks, implied volatility, quotes, and open interest for specific underlying assets.

### ⚠️ Global System Invariant: Mandatory Local Greek/IV Calculation
Regardless of the asset class (Equity, ETF, or Index) or the upstream API provider yielding the Option Chain (Longport, Massive, or Alpaca), **if Implied Volatility (IV) or the Greeks (Delta, Gamma, Theta, Vega, Rho) are ever missing or undefined in the option contract response payload, the system MUST mathematically calculate them locally on the fly.**
This is a STRICTLY MANDATORY safeguard. It requires iteratively executing a local Black-Scholes pricing module on a **per-contract basis**, sequentially injecting the real-time underlying asset spot price, the contract strike, and the time to expiration.

### GEX live symbol inspection (`tradingflow-webapp-fullstack`)

| | |
|---|---|
| **Entry point** | `GET /api/gex/symbol-inspection/{symbol}` → `resolveGexSource` in `gexDrawerInspectionService.ts` |
| **Routing** | Summarised in the **Overview Table** row **GEX symbol inspection (live drawer)**. **Stock/ETF:** Massive (chain + spot) first → Alpaca chain with Longport spot → Longport chain + spot. **Indices:** Massive first → Alpaca chain + Longport spot; Longport is **not** used for index **option chains** (expiry path unusable for cash index underlyings in practice). |
| **Note** | This ordering perfectly mirrors the **`OptionChainTable` / `optionchain-data`** batch pipeline hierarchy for Stock/ETF (Massive -> Alpaca -> Longport).

---

### Option Chain Snapshot (Full Chain)
> 📄 Docs: [https://massive.com/docs/rest/options/snapshots/option-chain-snapshot](https://massive.com/docs/rest/options/snapshots/option-chain-snapshot)

| | |
|---|---|
| **Project** | `tradingflow-process-service-ec2` |
| **Source file** | `src/optionchain-data/massive-client.ts` |
| **Massive endpoint** | `GET /v3/snapshot/options/{symbol}?limit=250&sort=ticker&order=asc` |
| **Symbols** | ⚠️ **Single underlying symbol per call** — the symbol is in the URL path. |
| **Purpose** | Fetch the **complete option chain snapshot** for an underlying symbol — all contracts with greeks (delta, gamma, theta, vega), IV, OI, last quote/trade, and underlying asset data. |
| **Index & Alias Support** | ✅ **Supports Indices (Partial Data).** Requires the **canonical index** without prefix (e.g., `SPX`). Requesting alias roots directly (like `SPXW`) returns 0 contracts; they must be mapped to `SPX`. ⚠️ **Critical limitation:** While Massive API successfully returns all standard index contracts, it natively fails to derive the underlying reference price dynamically. Consequently, Massive **drops all Implied Volatility (IV) and Greek calculations** for indices (returning empty/undefined), while successfully populating them seamlessly for Equities/ETFs like `SPY`. In **this ETL client**, Massive therefore acts as the **Primary Fallback** behind Alpaca for Indices. (**Contrast:** the **`tradingflow-webapp-fullstack` GEX live drawer** uses Massive **first** for indices; see overview table and §GEX live symbol inspection.) If Greeks/IV are strictly required downstream for Indices, the system must mathematically calculate them iteratively on a **strictly per-contract basis** utilizing a local Black-Scholes module injected with the real-time index spot price. |
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
| **Potential use case** | Could replace or supplement the Massive `/v3/snapshot/options/{symbol}` call for fetching greeks + quotes on a targeted subset of contracts. |

### Alpaca Option Chain (Future Integration)
> 📄 Docs: [https://docs.alpaca.markets/reference/optionchain](https://docs.alpaca.markets/reference/optionchain)

*Not yet integrated — candidate for future use.*

| | |
|---|---|
| **Alpaca endpoint** | `GET https://data.alpaca.markets/v1beta1/options/snapshots/{underlying_symbol}` |
| **Symbols** | ⚠️ **Single underlying symbol** — the underlying (e.g. `SPY`, `AAPL`) is embedded in the URL path. |
| **Purpose** | Returns the latest trade and latest quote for **every option contract** on a given underlying symbol. ⚠️ **Critical Verification:** Alpaca strictly returns raw pricing (Market Bid/Ask, Last Trade). It does **NOT** natively calculate or return Implied Volatility (IV) or Greeks (Delta, Gamma, etc.) for any asset class (Equities, ETFs, or Indices). |
| **Index & Alias Support** | ✅ **Supports Indices.** Natively supports passing alias roots (e.g., `SPXW`) directly in the path to fetch only that root's chain. Does not require prefixing (`I:SPX` returns a 400 error). |
| **Potential use case** | Acts as the **Definitive Primary API** for retrieving Index option chain endpoints (`SPX`, `NDX`), as its exact OCC ticker mappings reliably capture the chain. It also serves as the highly reliable **Primary Fallback API** for standard Stock/ETF option chains. Crucially, any pipeline utilizing Alpaca (for any asset class) must simultaneously implement **Local BS Model Calculations** sequentially on the fly since Greeks/IV are fundamentally stripped from the API entirely. |

### Longport Symbol & Price Details (Verified)
| Category | Details |
|---|---|
| **Index Symbol Format** | `.SYMBOL.US` (e.g., `.SPX.US`, `.NDX.US`) |
| **Alias Root Mapping** | `SPXW` -> `.SPX.US`, `RUTW` -> `.RUT.US` (Not supported natively) |
| **Security Category (Index)** | Identified by leading `.`, empty `exchange`, and/or index `board` values. |
| **Security Category (Stock/ETF)** | Differentiate via name scanning (e.g., "ETF" in name) and `totalShares > 0`. |

### Longport Option Chain & Quotes (Future Integration)
> 📄 Docs: [https://open.longportapp.com/docs/quote/overview](https://open.longportapp.com/docs/quote/overview)

*Not yet integrated — candidate for future use.*

| Feature | Details |
|---|---|
| **Option Chain endpoint** | `GET /v1/quote/pull/optionchain-date-strike` |
| **Option Quotes endpoint** | `GET /v1/quote/pull/option-quote` |
| **Index Options Format** | ❌ **UNSUPPORTED:** Live verification (March 25, 2026) natively confirmed Longport returns no usable index option-chain data:<br>- `.SPX.US` -> 0 option expiries<br>- `.NDX.US` -> 0 option expiries<br>- `.VIX.US` -> 0 option expiries<br>- `.RUT.US` -> 301600 invalid symbol<br>- `SPY.US` control -> 38 option expiries<br>Conclusion: Longport definitively only works for standard stock/ETF option-chain data. |
| **Access Warning** | Real-time options require `USOption` market data permissions (Error `301604` if missing). |
| **Response Schema** | JSON array format (e.g., `option_quote: [...]`, `strike_price_info: [...]`). |
| **IV & Greeks** | For Equities/ETFs, `impliedVolatility` is natively exposed within the `OptionQuote`/`CalcIndex` object and was correctly verified in live testing. |
