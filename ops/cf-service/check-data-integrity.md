---
name: check-data-integrity
description: Comprehensive post-close ClickHouse data integrity, Option Trades latency, SymbolMetaData coverage, write-buffer health, and Greeks/price parity scans for TradingFlow UW ingest and option chain. Use when the user asks for data integrity, data pollution, ETL health, post-close audit, latency, Greeks parity, IV/delta drift, contract-rank vs chain consistency, May-29-style regressions, zero market_cap/dei issues, or post option-chain deploy validation.
---

# Data Integrity and Greeks Parity Scans (TradingFlow)

Workspace runbook covering **trade/metadata integrity + latency** (UW ingest health, premium mix, meta pollution, write buffer behavior) **and Greeks/price parity** (local BS recalc vs vendor, flow vs chain internal consistency).

Companion concerns that together give a full picture after nightly `SyncSymbolMetaService` (~19:00 ET) and `OptionChainTable` ingest.

## Recommended Invocation

Use `/goal` for each full audit:

- Objective: audit the most recent fully closed ET trading session for data integrity, latency, small-trade coverage, and Greeks/price parity.
- Success criteria: target date and healthy baseline are justified, integrity/latency/small-trade checks are run or explicitly blocked, Greeks Phase A/B status is reported, and `Latest run note` plus `Agent Handoff` are pruned/updated.
- Stop condition: the report separates healthy signals from triage triggers, or a blocker names the missing credential/schema/tool and the next verification step.

## Agent Handoff

Last updated: 2026-06-17

### Look First

- [ ] Resolve the Phase B Greeks parity blocker before trusting full Greeks parity: live `mv_contract_day_flow` may expose legacy `premium` instead of execution-side `ask_premium`/`bid_premium`/`mid_premium` states. Run `DESCRIBE TABLE mv_contract_day_flow` and align `scripts/check-greeks-parity.ts` with the deployed schema before Phase B.

## Local workspace project map

The workspace root on this machine is:

```bash
WORKSPACE=/Users/evansmacbookpro/Desktop/Projects
```

| Role | Project |
| --- | --- |
| Runbook source | `$WORKSPACE/awesome-ai-coding-rules` |
| ClickHouse audit scripts, symbol meta sync, backfills, OptionChain mapper + local BS | `$WORKSPACE/tradingflow-process-service-ec2` |
| Live UW ingest, write buffer (priority tiers, pressure/overflow drops), Better Stack health logs, UwIngestionDO | `$WORKSPACE/tradingflow-cfworker-service` |
| Webapp consumers, contract-rank, backfill helpers | `$WORKSPACE/tradingflow-webapp-fullstack` |

Sibling projects (api-service-lambda, cron-service-lambda, quant-service, web-landingpage) are secondary; pull in only for specific boundary drill-downs.

## When to run

- **After market close (ET)**, once `SyncSymbolMetaService` has finished (~19:00 ET) — run data integrity + latency.
- **After option-chain ingest** (~19:00 ET or post-deploy) — run Greeks parity (Phase A + B).
- After CF Worker deploy, process-service deploy, symbol-meta config/alias change, or mapper/BS model change.
- When users report broken filters (`market_cap`, DEI, earning_date), thin trade flow, wrong IV/delta on Contract or Option Chain views, or contract-rank drift.
- Daily smoke (data + small Greeks sample), weekly full, or investigation.

**Timing notes:**
- Data/meta scan: after symbol meta sync completes.
- Greeks: after `OptionChainTable` ingest. Massive snapshot is live at fetch time — same evening for best EOD parity; intraday runs expect more drift.

## Prerequisites

| Item | Workspace location |
| --- | --- |
| ClickHouse credentials | `$WORKSPACE/tradingflow-process-service-ec2/.env` (CLICKHOUSE_URL, USERNAME, PASSWORD) |
| Massive API key (for Greeks Phase A) | `MASSIVE_API_KEY` in same `.env` |
| Data integrity script | `tradingflow-process-service-ec2/scripts/check-data-integrity.ts` |
| Latency scripts | `tradingflow-process-service-ec2/scripts/verify-producer-freshness.ts`, `audit-small-trade-coverage.ts` |
| Greeks parity script | `tradingflow-process-service-ec2/scripts/check-greeks-parity.ts` |
| **Do not** use ClickHouse MCP against production cloud | Use `.env` + `bun` scripts per process-service `AGENTS.md` |

Live UW ingest + write buffer lives in **`tradingflow-cfworker-service`** (`UwIngestionDO`, PriorityWriteBuffer).

Nightly symbol meta + OptionChainTable + audits run from **`tradingflow-process-service-ec2`**.

Prefer running the executable checks from the process-service checkout (it auto-loads `.env` via bun).

## Self-maintained runbook rules

Keep this file as the canonical operator entrypoint for this check:

- Canonical path: `ops/cf-service/check-data-integrity.md`.
- If a duplicate or alias file exists, update this file first and keep the alias in sync only when a caller still depends on it.
- At the end of each run, decide whether this runbook changed because the run revealed a reusable lesson. Promote durable lessons into procedure, prerequisites, thresholds, SQL, verification, or remediation sections.
- Keep transient state in `Agent Handoff` and `Latest run note` only. Prune completed or obsolete handoff items before adding new ones.
- If no durable rule changed, state `Runbook maintenance: no change` in the final report.
- Every time you run this runbook, update the "Latest run note" below with the target date, baseline, commands, exit status, and the short verdict. Do not let old run notes masquerade as current proof.
- Prefer the most recent fully closed ET trading session as `DATE`. If the current US session is still open, use the prior trading day. Confirm `last_time_et >= 16:55:00` and that RTH hours 9-16 have rows before calling it complete.
- Pick `BASELINE` from a recent healthy full session with normal row volume and no known disconnect or backfill artifact. Do not use the target date as its own baseline. If the investigation asks for an April-average comparison, run the explicit April-average SQL instead of forcing the single-date script to answer that question.
- Treat a strict failure as a triage trigger, not an automatic outage verdict. Drill down by symptom: row ratio and small-trade coverage for ingest loss, DEI/market-cap top symbols for metadata gaps, and Better Stack/Queue telemetry for write-buffer or spillover pressure.
- Before Phase B Greeks parity, run `DESCRIBE TABLE mv_contract_day_flow`. The deployed table may be either legacy `premium` state or execution-side `ask_premium`/`bid_premium`/`mid_premium` states. If the script query does not match the live schema, run `--phase a` only and record Phase B as blocked until the script/query is aligned.
- Do not update durable procedure for one-off counts, temporary vendor incidents, raw logs, or current-run-only findings.

### Latest run note

2026-06-16 Asia/Shanghai / 2026-06-15 ET:

- Target: `DATE=2026-06-15`, `BASELINE=2026-06-10`.
- Latest-date SQL showed `2026-06-15` had `14,432,815` aggregate rows and `last_time_et=2026-06-15 16:59:59`; `SymbolMetaData` had `6,070` rows for the same date.
- `bun scripts/check-data-integrity.ts --date 2026-06-15 --baseline-date 2026-06-10 --strict` exited `1` only because `zero_dei_with_dex_share=0.0204` exceeded the `0.02` threshold. Other metrics were healthy: `<25k premium share=0.9690`, `zero_market_cap_stock_share=0.0003`, `agg_row_ratio=2.3517`.
- `bun scripts/verify-producer-freshness.ts 2026-06-15` showed open p50 `1s`, p95 `59s`, no `>5m` or `>10m` rows, and full-session extent `09:30:44` to `16:59:59`.
- `bun scripts/audit-small-trade-coverage.ts --compare 2026-06-10,2026-06-15` showed all RTH raw-vs-aggregate ratios near `1.0`; `2026-06-15` raw rows were `23,834,360` and aggregate `sum(trade_count)` was `23,831,756`.
- DEI drill-down pointed to localized metadata gaps, not broad ingest loss: top non-index `dei=0 AND dex>10` symbols were `SOXS` (`3,451` rows), `PBRA` (`126`), `SHOE` (`123`), and `TZA` (`69`); coverage gate missing symbols were `PBRA` (`126`), `MOGA` (`45`), `MXEF` (`40`), and `XSPBW` (`33`).
- `bun scripts/check-greeks-parity.ts --date 2026-06-15 --phase a` completed but Phase A breached on `39/39` compared contracts across `AAPL,NVDA,QQQ,SPY,TSLA`; treat as a Greeks/chain parity investigation, not an Option Trades row-loss signal.
- Full Greeks run was blocked in Phase B because live `mv_contract_day_flow` currently has legacy `premium AggregateFunction(sum, Int32)` and does not have `ask_premium`, `bid_premium`, or `mid_premium`. Align `scripts/check-greeks-parity.ts` with the live schema before trusting Phase B.

---

## Domain context — read before interpreting any numbers

### INDEX vs STOCK vs ETF — expected differences (critical for "pollution" alerts)

Many zeros are **by design** for indexes.

| Field | INDEX | STOCK / ETF |
| --- | --- | --- |
| `market_cap` | **0** (always) | From `SymbolMetaData`; zero after sync = meta gap or exclusion |
| `dei` | **0** (always) | `\|dex\| / average_stock_volume × 100`; zero + `dex > 0` on non-index = investigate |
| `earning_date` | `1970-01-01` sentinel | From Alpha Vantage; sentinel on stock/ETF = meta gap |
| `avg_stock_volume_at_normalization` | **0** | From meta; required for DEI |
| Ref price source | Index quote provider / proxies (SPY×10 etc.) | `SymbolMetaData.last` or live vendor |

**Scan rules (enforced in scripts):**
- `underlying_type = 'STOCK'` for `market_cap` thresholds.
- `underlying_type != 'INDEX'` for DEI thresholds.
- Never flag INDEX rows for `market_cap=0` or `dei=0`.
- `expiry_days=0` on high-volume names is usually **0DTE**, not missing data.

Sanity breakdown:

```sql
SELECT
  underlying_type,
  count() AS rows,
  countIf(market_cap = 0) AS zero_mc,
  countIf(dei = 0 AND dex > 0) AS zero_dei_with_dex
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
GROUP BY underlying_type
ORDER BY rows DESC;
```

### OCC symbol aliases + index roots (vendor ticker ≠ persisted symbol)

Trades and `SymbolMetaData` use **OCC roots** (`symbol` column).

Polygon/Massive/Longport use different vendor ids for some.

Canonical maps (keep in sync across repos):

- `src/shared/symbol-meta-aliases.ts` (process-service) + equivalent in cfworker.
- `src/shared/index-roots.ts` for weekly/monthly index option roots (SPXW → SPX etc.).

**Key aliases (examples):**
- `CMCS` ↔ `CMCSA`
- `BRKB`, `BFB` ↔ `BRK.B`
- Index roots (SPXW, RUTW, etc.) clone meta from canonical (SPX, RUT...).

**Ingest (CF Worker):** `applySymbolMetaLookupAliases()` + `resolveStockMetaFromMap()` after loading snapshot.

**Sync (process-service):** `resolvePolygonVendorTicker()` (and Longport equivalents) in `sync-symbol-meta/config.ts` and api layers. All history providers should use the same mapping.

**Integrity implication:**
- `BRKB`/`BFB` with `market_cap=0` while `BRK.B` meta row exists → **local alias/sync bug**, not upstream.
- Symbol in `EXCLUDED_SYMBOLS` → intentionally never synced (config, zeros expected).
- See `tradingflow-process-service-ec2/wiki/domain-invariants/symbol-meta.md` for current exclusion list and more invariants.

### Write buffer priority & drops (CF Worker ingest health)

The UW ingest uses a **PriorityWriteBuffer** with tiers (critical/local-smoke > high > medium > low) based on premium and special flags.

Configurable (defaults in code; override via env in DO):

- `UW_PREMIUM_HIGH_PRIORITY_THRESHOLD`: 25000 (default)
- `UW_PREMIUM_MEDIUM_PRIORITY_THRESHOLD`: 5000 (default)
- `UW_WRITE_BUFFER_MAX_ENTRIES`: 15000
- `UW_WRITE_BUFFER_MAX_RAW_ROWS`: 50000
- `UW_LOW_DRAIN_GATE_HIGH_DEPTH`: 1500 (while high depth below this, interleave low/medium drains)
- `UW_LOW_STARVATION_FORCE_DRAIN_MS`: 5000 (force low/medium drain when oldest low entry ages this long)

**Classification (in `scoreWriteBufferPriority`):**
- Local smoke/test → critical/high
- Max trade premium in bucket >= high → high
- >= medium and < high → medium (still "low" queue but higher value)
- < medium → low

**Drain logic:** Prefers high; falls back to medium/low when high is shallow or starvation timer fires. `selectDrainQueue`, `takeNextBatchSlice`.

**Telemetry / Better Stack fields (uw_websocket_health):**
- `write_buffer_high_drops`, `low_drops`, `high_pressure_drops`, `low_pressure_drops`, `overflow_drops`
- `write_buffer_dropped_raw_rows`
- `max_write_buffer_depth`
- `max_low_priority_lag_ms`
- Plus legacy `dei_suppressed_missing_symbol_meta`, `market_cap_suppressed_missing_symbol_meta`

High sustained low-priority lag + drops at bell, or inverted premium mix in aggregates, are classic buffer starvation signals (see May 2026 incidents).

**In integrity checks:** The `< $25k` share (high-priority volume) is still the primary "did high-value trades get through?" proxy. Use the separate `audit-small-trade-coverage.ts` + freshness script for full picture (hourly raw vs agg ratios, small-trade presence).

### Upstream APIs — fallbacks and partial rows (symbol meta + reference)

Nightly `SyncSymbolMetaService` (process-service):

History (required — symbol skipped if all providers fail for the lookback):
- Polygon Aggregates (primary, uses `resolvePolygonVendorTicker`)
  - On error/empty: if `SYNC_SYMBOL_META_EMPTY_POLYGON_FALLBACK`, fall back:
    - Equities: Alpaca → Longport
    - Certain indexes (SPX, NDX, VIX, RUT, DJI, WSB): Longport only

Reference (best-effort — row is still inserted if history succeeded):
- Polygon Reference (market_cap, sector, shares, underlying_type)
  - 404/error → Longport static
  - Still null → row kept with nulls (`referenceAnomalies`)

Earnings:
- Alpha Vantage calendar → `earning_date` (malformed/empty → partial sentinel, not skip)

**Longport session caps and other transient errors** are now explicitly handled in the service (see `isLongportSessionCapError`, retry/backoff config).

**Outcomes for integrity scan:**
- Symbol **skipped** (`aggregatesNoData`, `EXCLUDED_SYMBOLS`) → no `SymbolMetaData` → trades get zeros for market_cap/DEI/earning_date.
- Row inserted with **null market_cap** (history OK, reference missed) → expected upstream partial (OTC/illiquid or vendor gap for that ticker/date); row kept.
- Full fields → healthy for that symbol.

**Do not** conclude "Massive/Polygon is down" from a handful of alias/excluded/OTC symbols. Look for **broad** `aggregatesNoData` counts + sync logs showing errors at scale.

Live ingest (CF Worker) uses its own live ref price providers (Alpaca/Massive/Longport/index) during the session. The nightly meta snapshot drives the persistent `market_cap`/`earning_date`/DEI volume fields used in most analytics.

**Coverage gate** (`src/sync-symbol-meta/coverage-gate.ts`): after sync, any symbol with significant trade count but no meta row is treated as a sync failure for the next open.

### Option chain / Greeks — local vs vendor (for the parity companion)

From current `optionchain-data/mapper.ts` (GLOBAL INVARIANT) and `local-bs-model.ts`:

- **IV**: Local bisection (via `getImpliedVolatility` in shared util, using mid or close) is **preferred** when underlying, strike, DTE, price inputs are valid. Falls back to vendor `implied_volatility`.
- **Greeks**: Vendor values used when present and non-zero. **Mandatory local recalc** (`calculateIVAndGreeks`) whenever `iv===0 || delta===0 || !input.greeks` (and inputs valid). This runs for both Massive and Longport snapshots. Always for indexes (which often arrive without Greeks).
- **Close**: Prefers official `day.close` (null check, not falsy) over `last_trade.price`.
- **Model**: European BS, fixed `RISK_FREE_RATE = 0.045`. Local derivation uses bisection for IV + `greeks` lib for delta/gamma/theta/vega/rho + theoretical price. Handles intrinsic floor, t >= 0.001, etc.
- Longport path for option chain is similar but has less per-option underlying price in some snapshots.

**Expected (non-bug) diffs:**
- Fixed 4.5% RFR vs vendor curves.
- European BS vs American/dividend-adjusted vendor models.
- Mid vs close vs last-trade price input.
- Index underlyings vs equity chains.
- Deep OTM / 0DTE / low-liquidity / penny options.
- Snapshot timing (EOD chain vs intraday live).

In `check-greeks-parity.ts` (Phase A) these are the main sources of "breaches" that are actually by-design.

Contract-rank uses **flow Greeks** from `mv_contract_day_flow` (normalized at trade time, currently `argMaxMerge` of iv/delta), **not** the EOD `OptionChainTable` Greeks. Phase B exists to catch pipeline-internal disagreement.

**Schema note (Phase B):** verify the live `mv_contract_day_flow` schema before running Phase B. Some deployments use legacy `premium AggregateFunction(sum, Int32)`; newer execution-side marts derive premium as `sumIfMerge(ask_premium) + sumIfMerge(bid_premium) + sumIfMerge(mid_premium)`. The parity script must match the deployed schema.

---

## Data Integrity Workflow (Trade Flow + Metadata + Latency)

Copy and track:

- [ ] 1. Resolve latest trading date (ET)
- [ ] 2. Run automated integrity script (--strict)
- [ ] 3. Run Option Trades latency + small-trade coverage audits
- [ ] 4. If any breach → drill-down SQL
- [ ] 5. Check SymbolMetaData coverage + sync outcome for the date
- [ ] 6. Optional: Better Stack `uw_websocket_health` corroboration (write buffer drops, lag)
- [ ] 7. Verdict + remediation
- [ ] 8. Report (template below)
- [ ] 9. (After option chain) Run Greeks parity (see dedicated section below)

### 1. Resolve latest trading date

Use the most recent weekday with a full session in `AggregatedOptionTrades`:

```sql
SELECT
  date,
  count() AS agg_rows,
  max(time) AS last_time_et
FROM AggregatedOptionTrades
WHERE date >= today() - 10
GROUP BY date
ORDER BY date DESC
LIMIT 5;
```

Pick a normal-volume day (typically 4M–7M+ rows for a full RTH session). Confirm `SymbolMetaData` coverage for the same date:

```sql
SELECT count(), max(date) AS meta_date
FROM SymbolMetaData
WHERE date = toDate('YYYY-MM-DD');
```

**Cutover / race signal:** `meta_date` < trade date or very low meta row count → ingest may have run before usable snapshot → expect widespread `market_cap=0` / `earning_date=1970-01-01`.

### 2. Run the automated integrity script

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
DATE=2026-06-12
BASELINE=2026-06-05   # recent healthy full day
bun scripts/check-data-integrity.ts --date "$DATE" --baseline-date "$BASELINE" --strict
```

Exit 0 = all thresholds passed.

Exit 1 (with --strict) = at least one breach → investigate.

### 3. Thresholds (current in `check-data-integrity.ts`)

```ts
const DEFAULT_THRESHOLDS = {
  minPremiumUnder25kShare: 0.9,
  maxZeroMarketCapStockShare: 0.005,
  maxZeroDeiWithDexShare: 0.02,
  minAggRowCountRatio: 0.7,
};
```

| Metric | Healthy (typical full day) | Breach | Likely cause |
| --- | --- | --- | --- |
| `premium_under_25k_share` | ~0.95–0.98+ | < 0.90 | Local CF Worker write-buffer starvation (high-value trades only got through) |
| `zero_market_cap_stock_share` (STOCK only) | < 0.001 (post-sync) | > 0.005 | Missing `SymbolMetaData`, `EXCLUDED_SYMBOLS`, or alias bug (BRKB etc.) |
| `zero_dei_with_dex_share` (non-INDEX) | < 0.02 | > 0.02 | Missing `average_stock_volume` in meta, or tiny dex rounding |
| `agg_row_ratio` vs baseline | ~0.85–1.05 | < 0.70 | Missing writes, buffer drops, shortened session, or upstream gap |

Good verdict: all pass, total rows within ~15% of baseline, no dominant symbol with thousands of zeros in drill-down.

### 4. Option Trades latency + small trade coverage (separate scripts)

These are **not** part of the single integrity script anymore.

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
DATE=2026-06-12
bun scripts/verify-producer-freshness.ts "$DATE"
bun scripts/verify-producer-freshness.ts --compare 2026-06-05,"$DATE"
bun scripts/audit-small-trade-coverage.ts "$DATE"
```

**Key latency thresholds (open 09:30–09:35 ET window):**

| Metric | Healthy | Investigate |
| --- | --- | --- |
| Open p50 lag | ≤ 3s | > 10s |
| Open p95 lag | ≤ ~65s | > 120s |
| Open `rows_gt_30s` / open rows | Down vs prior | > ~30% |
| Open `rows_gt_5min` | 0 | > 0 sustained |
| Full-day `rows_gt_5min_day` | < ~50k | > ~100k **with** `rows_gt_10min_day = 0` |
| Full-day `rows_gt_10min_day` | 0 (healthy) | > 0 |
| Hourly coverage | All RTH hours > 0 | Any 10 ET (or other) hour = 0 |
| `agg_to_raw_ratio` (from small-trade audit) | ~0.99–1.01 per hour | < 0.95 |

**Small-trade coverage** (`audit-small-trade-coverage.ts`): confirms low-premium bands exist and `raw_rows ≈ sum(trade_count)` on aggregates. This is the best signal for "buffer starvation without total row collapse" (May-29 pattern).

**Good latency + coverage verdict:** open p50 OK, p95 reasonable, no 10m+ day rows, hourly holes none, ratios ≈1.0, small trades present.

**Degraded:** elevated tails or >5m day but coverage/ratios OK → catch-up backlog.

**Bad:** open p50 >10s + hour gaps + inverted premium mix or buffer drops in Better Stack.

Full details (reference metrics, Δ vs persist lag, Better Stack mapping, harness): see the latency harness under `tradingflow-process-service-ec2/wiki/harness/check-optiontrades-latency/` (or the self-contained sections in this runbook).

### 5. Drill-down SQL (on breach)

Replace `YYYY-MM-DD`.

#### Premium mix (buffer starvation / high-priority only)

```sql
SELECT
  countIf(premium < 25000) AS under_25k,
  countIf(premium >= 25000) AS over_25k,
  count() AS total,
  round(countIf(premium < 25000) / count(), 4) AS under_25k_share
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD');
```

Healthy: **under_25k_share ≥ 0.90**. Inverted (~0.3x) was the May-29 starvation signature.

#### Top symbols missing market_cap (meta gaps or aliases)

```sql
SELECT
  symbol,
  countIf(market_cap = 0) AS zero_mc,
  count() AS total
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
  AND underlying_type = 'STOCK'
GROUP BY symbol
HAVING zero_mc > 0
ORDER BY zero_mc DESC
LIMIT 30;
```

Cross-check meta for known aliases:

```sql
SELECT symbol, market_cap, average_stock_volume, underlying_type
FROM SymbolMetaData
WHERE date = toDate('YYYY-MM-DD')
  AND symbol IN ('BRKB','BFB','CMCS','BRK.B','CMCSA', ...);
```

#### earning_date sentinel (meta snapshot unusable at ingest time)

```sql
SELECT
  countIf(earning_date = toDate('1970-01-01') AND underlying_type != 'INDEX') AS zero_earning,
  count() AS total
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD');
```

Spike often means cutover race (ingest before meta) rather than pure Alpha Vantage outage.

#### DEI gaps (non-index)

```sql
SELECT
  countIf(dei = 0 AND dex > 0 AND underlying_type != 'INDEX') AS zero_dei_with_dex,
  countIf(underlying_type != 'INDEX') AS non_index
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD');
```

Actionable (dex > 10 to cut noise):

```sql
SELECT symbol, count() AS n
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
  AND dei = 0 AND dex > 10 AND underlying_type NOT IN ('INDEX')
GROUP BY symbol
ORDER BY n DESC
LIMIT 20;
```

#### SymbolMetaData coverage gate (post-sync)

Same as the service's `coverage-gate.ts`:

```sql
SELECT t.symbol, count() AS trade_count
FROM AggregatedOptionTrades t
WHERE t.date = toDate('YYYY-MM-DD')
  AND t.symbol NOT IN (
    SELECT symbol FROM SymbolMetaData WHERE date = toDate('YYYY-MM-DD')
  )
GROUP BY t.symbol
HAVING trade_count >= 10
ORDER BY trade_count DESC
LIMIT 50;
```

Non-empty → those symbols were effectively skipped for analytics until next sync.

#### Session completeness

```sql
SELECT
  min(time) AS first_trade,
  max(time) AS last_trade,
  count() AS rows
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD');
```

Expect first ~09:35 ET, last ~16:59 ET on full days.

### 6. Better Stack corroboration (`uw_websocket_health`)

Search during the session (or the exact date's window):

Current high-signal fields (from `ingestion-telemetry.ts` and write-buffer):

- `max_low_priority_lag_ms`
- `write_buffer_high_drops` / `low_drops` / `high_pressure_drops` / `low_pressure_drops` / `overflow_drops`
- `write_buffer_dropped_raw_rows`
- `max_write_buffer_depth`
- `dei_suppressed_missing_symbol_meta` / `market_cap_suppressed_missing_symbol_meta`

Also watch for `write_buffer_*_drops` coinciding with low premium share or elevated open p95.

### 7. Remediation (after bad verdict)

| Finding | Fix |
| --- | --- |
| Low <25k premium share + buffer drops | Deploy/tune CF Worker write buffer (high/medium thresholds, max entries/raw rows, low starvation force drain, low drain gate depth). Verify env vars took effect. |
| Widespread `market_cap=0` / `earning_date` sentinel on one day | `bun scripts/backfill-trade-metadata.ts --date YYYY-MM-DD --apply` (or the DEI-specific backfill). |
| BRKB/BFB/CMCS (or index roots) zeros | Ensure not in `EXCLUDED_SYMBOLS`; aliases present in `src/shared/symbol-meta-aliases.ts` (and cfworker copy); re-run sync or manual meta insert for the date. |
| DEI zeros (with dex) | `bun scripts/backfill-dei.ts --date YYYY-MM-DD --apply`. |
| Elevated open p95 / large >5m day tail but coverage OK | Buffer depth / drain tuning; look at `UW_LOW_STARVATION_FORCE_DRAIN_MS` and pressure metrics. |
| Missing agg rows (never written) | Permanent gap for that window — not recoverable from CH alone. |
| MV contract columns stale (legacy vs 009+ schema) | Use the webapp fullstack backfill runner for `mv_contract_day_flow` / symbol day flow (it auto-detects schema). |
| Symbol meta coverage gaps after sync | Investigate `aggregatesNoData` / provider errors in `SyncSymbolMetaService` summary + logs. Trigger CF worker metadata refresh if needed (`trigger-cfworker-metadata-refresh.ts`). |

After any ClickHouse backfill/mutation, wait for `system.mutations` `is_done=1` before re-running scans.

### 8. Upstream vs local attribution (cheat sheet)

| Symptom | Usually |
| --- | --- |
| ~96% row collapse + inverted <25k premium mix | **Local** CF Worker write-buffer starvation (high priority only drained) |
| All (or vast majority) symbols `market_cap=0` / earning sentinel same day | **Local** ingest ran before usable `SymbolMetaData` snapshot (cutover race) |
| One or few symbols (BRKB, BFB, CMCS, specific index roots) all zeros | **Local** exclusion, missing alias clone, or no meta row for that OCC root |
| Meta row exists in CH but trades still zero for the symbol | **Local** stale in-memory snapshot in CF Worker (refresh or wait for periodic reload) |
| Polygon primary works for canonical but fallbacks fail for aliased OCC root | **Local** — fallback providers must also use the vendor ticker mapping (`resolvePolygonVendorTicker` etc.) |
| Reference `market_cap` null but history succeeded | **Expected upstream** partial (Polygon Reference + Longport static both missed for that ticker/date); row is correctly kept |
| Symbol skipped after *all* history providers returned empty | **Upstream** no-data for that ticker (check `aggregatesNoData` + sync summary) |
| Broad Polygon/Massive errors across >5% of universe | Possible true upstream outage — corroborate with sync logs at scale |
| Open p50 OK, large >5m(d) tails, but `agg_to_raw_ratio` ≈ 1.0 and small trades present | **Local** catch-up backlog (buffer depth / drain pressure) |
| High open p50 + CH hour gaps + buffer drops | **Local** ingest / write-buffer incident |

**Do not** blame a vendor (Massive, Polygon, Longport, Alpha Vantage) until you have **broad** multi-symbol failure **and** the sync logs show provider errors at scale. Isolated alias/excluded/OTC/illiquid cases are almost always local config or per-ticker upstream limits.

---

## Greeks / Price Parity Check (OptionChainTable + Contract Flow)

This validates **pricing model and Greeks correctness** (local Black-Scholes IV/Greek recalc vs vendor, and internal pipeline consistency for contract-rank).

Run **after** nightly OptionChainTable ingest completes.

### Why two phases

| Phase | Compares | Validates |
| --- | --- | --- |
| **A** | `OptionChainTable` vs **Massive raw** `implied_volatility` / `greeks` (and close) | Local BS recalc (`mapper.ts` + `local-bs-model.ts`) vs vendor snapshot |
| **B** | `mv_contract_day_flow` (argMaxMerge iv/delta) vs **same-day `OptionChainTable`** | Trade-normalized Greeks vs EOD chain snapshot (internal consistency) |

Contract-rank does **not** read chain Greeks for ranking — it uses the flow Greeks stored in `mv_contract_day_flow` (normalized at execution time). Phase B catches the pipeline disagreeing with itself.

**Schema note for Phase B:** Run `DESCRIBE TABLE mv_contract_day_flow` first. If the table has legacy `premium AggregateFunction(sum, Int32)`, Phase B must use `sumMerge(premium)`. If the table has execution-side `ask_premium`, `bid_premium`, and `mid_premium` states, Phase B must use their `sumIfMerge(...)` total. Do not trust a Phase B failure caused only by a query/schema mismatch.

### When to run (Greeks-specific)

| Cadence | Scope |
| --- | --- |
| Daily smoke (optional) | Phase A only, small symbol set (e.g. SPY,QQQ,AAPL) |
| Post option-chain deploy or mapper/BS model change | Phase A + B |
| Weekly / investigation | Full Phase A + B, or targeted symbols after user reports wrong IV/delta |

**Timing:** Same evening as OptionChainTable ingest for best EOD parity. Intraday runs will have wider natural drift.

### Prerequisites (Greeks)

Same ClickHouse creds + `MASSIVE_API_KEY` (Phase A only).

Script: `tradingflow-process-service-ec2/scripts/check-greeks-parity.ts`

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2

# Full (recommended)
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD

# Phase A only, custom symbols, strict
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase a --symbols SPY,NVDA,AAPL --strict

# Phase B only, more contracts from flow
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase b --phase-b-top 100
```

### Domain context — local vs vendor Greeks (current implementation)

From `src/optionchain-data/mapper.ts` (see `calculateIv` + the **GLOBAL INVARIANT** block) and `local-bs-model.ts`:

- **IV calculation**: Local bisection (shared `getImpliedVolatility`, European BS, RFR=0.045) is **preferred** when underlying, strike, DTE, and a usable price (mid preferred, else close) are present. Falls back to vendor `implied_volatility`.
- **Greeks**: Vendor values used when present/non-zero. **Mandatory local recalc** (`calculateIVAndGreeks`) if `iv === 0 || delta === 0 || !input.greeks` (and inputs valid). This is the invariant for both Massive and Longport paths. Always exercised for indexes.
- **close**: Prefers `day.close` (explicit `!= null` check) over `last_trade.price`.
- **Model details** (`local-bs-model.ts`): Bisection (with bounds) for IV + `greeks` library for delta/gamma/theta/vega/rho + theoretical price. Handles intrinsic floor (`effectiveOptionPrice = max(optionPrice, intrinsic)`), `t >= 0.001`, clamps vol, etc. RISK_FREE_RATE = 0.045.

**Expected (non-bug) diffs vs Massive:**
- Fixed 4.5% RFR vs vendor curve.
- European BS vs American / dividend-adjusted models.
- Mid vs close vs last-trade price.
- Index underlyings vs equity.
- Deep OTM / 0DTE / low-liquidity / penny options.
- Snapshot timing.

In the parity script these are filtered or expected within thresholds.

### Phase A — OptionChainTable vs Massive raw (current)

**Sample design (current script):**
- Default symbols: `SPY, QQQ, AAPL, TSLA, NVDA` (configurable via --symbols).
- Per symbol: top N contracts by `oi DESC, daily_volume DESC, option_symbol` (default N=8) from `OptionChainTable` for the date, where `oi > 0`.
- Massive fetch: uses `resolveMassiveUnderlyingSymbol` (via `POLYGON_AGGREGATES_SYMBOL_ALIASES` + index roots) for the API path. Paginates with `next_url`. Comparison key = normalized OCC `option_symbol` (strips O: prefix).
- Massive payload mapped via `mapMassiveRaw` (iv, greeks.delta/gamma, day.close or last_trade.price, bid/ask, underlying price).

**Auto-skip (excluded from breach calculations, exact from `shouldSkipContract`):**
- `iv <= 0 && delta === 0`
- `expiry_days === 0` (0DTE)
- Bid-ask spread > 20% of mid (configurable `maxSpreadShareOfMid`)
- Missing usable price (close and mid both <=0) or no matching Massive contract

**Thresholds (exact from `DEFAULT_THRESHOLDS` in current script):**

| Metric | Alert when |
| --- | --- |
| IV | rel diff > 0.05 **and** abs diff > 0.03 |
| Delta | abs diff > 0.10 (wider tolerance for deep OTM) |
| Close | rel diff > 0.02 **and** abs diff > 0.10 |
| Per-symbol breach share | > 0.10 of compared contracts for that symbol |
| Hard fail (`--strict`) | ≥ 3 symbols flagged in Phase A |

**Comparison logic (`comparePhaseA`):**
- Uses vendor close (or mid if no close) when available.
- Only compares IV when both >0; only delta/close when they have magnitude.

**Drill-down when Phase A fails (current paths):**
1. Inputs in CH row vs Massive payload (underlyingPrice, bid/ask/close, DTE, strike).
2. Did the mapper run local recalc? (`iv === 0 || delta === 0 || !input.greeks` block in `mapper.ts`).
3. Provider: Longport vs Massive for that symbol on that run (check option-chain service logs).
4. Model: `local-bs-model.ts` bisection + greeks lib vs vendor.
5. Use the sample SQL in the old greeks doc (still valid) or query the exact rows the script sampled.

### Phase B — Contract flow vs OptionChainTable (internal)

**Sample (current):**
- Top N contracts by derived premium from `mv_contract_day_flow` for the date (default 50, configurable `--phase-b-top`).
- Query for execution-side schema:

```sql
SELECT
  option_symbol,
  anyMerge(symbol) AS symbol,
  toString(sumIfMerge(ask_premium) + sumIfMerge(bid_premium) + sumIfMerge(mid_premium)) AS premium,
  toString(sumMerge(trade_count)) AS trade_count,
  toString(argMaxMerge(iv)) AS iv,
  toString(argMaxMerge(delta)) AS delta
FROM mv_contract_day_flow
WHERE date = toDate('YYYY-MM-DD')
GROUP BY option_symbol
HAVING sumMerge(trade_count) > 0
ORDER BY ...premium... DESC, trade_count DESC
LIMIT N;
```

- Query for legacy schema:

```sql
SELECT
  option_symbol,
  anyMerge(symbol) AS symbol,
  toString(sumMerge(premium)) AS premium,
  toString(sumMerge(trade_count)) AS trade_count,
  toString(argMaxMerge(iv)) AS iv,
  toString(argMaxMerge(delta)) AS delta
FROM mv_contract_day_flow
WHERE date = toDate('YYYY-MM-DD')
GROUP BY option_symbol
HAVING sumMerge(trade_count) > 0
ORDER BY sumMerge(premium) DESC, sumMerge(trade_count) DESC
LIMIT N;
```

- Then joins to the same-date `OptionChainTable` row by `option_symbol`.

**Thresholds (current):**

| Metric | Alert when |
| --- | --- |
| IV abs diff | > 0.08 |
| Delta abs diff | > 0.12 |
| Overall breach share | > 0.15 (hard fail with --strict) |

**Expected drift:** Flow Greeks are from **last-trade normalization during the session** (argMax). Chain is an **EOD snapshot**. Actively traded names late in the day will naturally show gaps — this is usually not a calculation bug.

**Skip in Phase B:**
- Zero flow greeks (`iv<=0 && delta===0`)
- No matching OptionChainTable row for that `option_symbol` + date

### Attribution cheat sheet (combined)

| Symptom | Usually |
| --- | --- |
| Phase A fails one or two symbols, others OK | Local mapper bug for that symbol, alias resolution for that root, or Longport→Massive fallback path used for that symbol only |
| Phase A fails many/all symbols on same metric (e.g. all IV) | Global config (RFR, DTE calc, mapper regression) or widespread provider difference |
| Phase A IV diff but delta OK (within threshold) | Local IV preferred (by design in `calculateIv`); check if it crossed the dual (rel+abs) threshold |
| Phase A close diff | Mid vs close vs last-trade common and expected in thresholds |
| Phase B wide, Phase A clean | Time horizon (intraday flow normalization vs EOD chain snapshot) — normal for high-volume names |
| Phase B fails on symbols with no chain row | Chain ingest gap for that symbol/date, or symbol not in the nightly OptionChainTable universe |
| Both phases flag the exact same contracts | Wrong `--date`, stale chain for that date, or mapper wrote bad values that then fed flow normalization |
| Systematic IV inflation on OTM | Review bisection bounds or price-to-use logic in `mapper.ts` + `calculateIv` |
| Delta zero while Massive has value | Local recalc path triggered (or underlying price 0 at ingest time) |

### Remediation (Greeks)

| Finding | Action |
| --- | --- |
| Systematic IV or Greeks drift on many symbols post-deploy | Review `mapper.ts` (calculateIv + mandatory recalc block) and `local-bs-model.ts` (bisection + greeks lib). Re-run with known-good date. |
| One symbol badly off | Check alias (resolveMassiveUnderlyingSymbol), provider used (Longport vs Massive), input prices at snapshot time. |
| Phase B only on high-flow names | Expected (intraday vs EOD). Widen thresholds for Phase B or run only post-close. Document in report. |
| Missing OptionChainTable rows for symbols that had flow | Re-run `FetchOptionChainDataService` / option chain pipeline for the date; check aggregatesNoData or service logs. |
| Massive fetch empty / low count for aliased root | Script uses the alias map; if still empty, the vendor may not have data for that root on that date. |
| Local recalc producing bad values | Test with `test-massive-iv.ts` or similar against raw payload; adjust bisection / price handling / intrinsic logic. |

### Report template (Greeks)

```markdown
## Greeks parity — {date} (ET)

**Verdict:** Good / Degraded / Bad (Phase A / Phase B / overall)

### Phase A (OptionChainTable vs Massive)
| Metric | Value | Threshold | Status |
| --- | --- | --- | --- |
| Sampled contracts | | | |
| Compared (non-skipped) | | | |
| Breach share | | | |
| Failing symbols | | ≤ 2 (or per --strict) | |

Sample breaches (symbol, option_symbol, metric, stored vs ref):
...

### Phase B (mv_contract_day_flow vs OptionChainTable)
| Metric | Value | Threshold | Status |
| --- | --- | --- | --- |
| Top contracts sampled | | | |
| Compared | | | |
| Breach share | | ≤ 0.15 | |

Sample breaches:
...

**Likely cause:** (local model / time horizon / mapper invariant / upstream snapshot / alias / ingest gap)

**Recommended actions:**
```

---

## Combined Report Template (Data + Greeks)

You can run both on the same date and produce one report.

```markdown
## Data integrity + Greeks parity — {date} (ET)

**Data verdict:** Good / Degraded / Bad
**Greeks verdict:** Good / Degraded / Bad

### Metadata & row health (data integrity)
... (copy table from data section) ...

### Option Trades latency
... (copy latency table) ...

### Greeks parity
... (copy the two phase tables from Greeks section) ...

**Top issues (data + Greeks):**
- ...

**Likely cause (one paragraph):**
...

**Recommended actions (deploy / backfill / config / none):**
...
```

---

## Related code & artifacts (current)

| Artifact | Project |
| --- | --- |
| `scripts/check-data-integrity.ts` | `tradingflow-process-service-ec2` |
| `scripts/verify-producer-freshness.ts`, `audit-small-trade-coverage.ts` | `tradingflow-process-service-ec2` |
| `scripts/check-greeks-parity.ts` | `tradingflow-process-service-ec2` |
| `scripts/backfill-*.ts` (trade metadata, dei, mv flow, index spot, etc.) | `tradingflow-process-service-ec2` |
| `src/optionchain-data/mapper.ts`, `local-bs-model.ts`, clients | `tradingflow-process-service-ec2` |
| `src/sync-symbol-meta/*` (config, service, coverage-gate, apis for Polygon/Alpaca/Longport/AlphaVantage, aliases, index-roots) | `tradingflow-process-service-ec2` |
| `src/syncUwData/*` (write buffer priority/tiers, drain policy, telemetry, ingest) | `tradingflow-process-service-ec2` (some shared with cfworker) |
| `src/uw-ingestion/*` (PriorityWriteBuffer, write-buffer-priority.ts, env, telemetry, UwIngestionDO) | `tradingflow-cfworker-service` |
| `src/shared/symbol-meta-aliases.ts`, `index-roots.ts` | process-service + cfworker |
| `wiki/domain-invariants/*` (symbol-meta, optionchain-data, etc.) | `tradingflow-process-service-ec2` |
| `wiki/operation.md`, `wiki/uw-ingestion-do.md` | `tradingflow-cfworker-service` |
| Contract rank / flow consumers | `tradingflow-webapp-fullstack` |
| Pipeline overview | `awesome-ai-coding-rules/knowledge/data-flow.md` |

---

**Run both families of checks on the same date for a complete picture.** The data/meta/latency scan tells you whether the trades and reference data arrived and were normalized correctly. The Greeks parity scan tells you whether the pricing model and the two sources of Greeks (chain snapshot vs flow-normalized) are consistent with each other and with the external vendor.

After any change to mapper, local-bs-model, write buffer config, symbol meta aliases, or fallbacks — re-run the relevant phase(s) on a known-good recent date + the current date.
