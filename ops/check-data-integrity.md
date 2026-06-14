---
name: check-data-integrity
description: Runs a post-close ClickHouse data integrity and Option Trades latency scan on the latest trading date for TradingFlow UW ingest from the local workspace projects. Checks premium mix, metadata pollution, DEI gaps, row counts, SymbolMetaData coverage, and producer persist lag (open-window p50/p95, >30s/>5m tails, small-trade coverage). Use when the user asks for data integrity, data pollution, ETL health, post-close audit, latency, May-29-style regressions, or zero market_cap/dei issues.
---

# Data Integrity Scan (TradingFlow)

Workspace runbook for judging whether **AggregatedOptionTrades** data for the latest trading date is healthy. Based on the May 2026 CF Worker cutover incident (write-buffer starvation, missing SymbolMetaData, BRKB/BFB alias gaps).

## Local workspace project map

The workspace root on this machine is:

```bash
WORKSPACE=/Users/evansmacbookpro/Desktop/Projects
```

| Role | Project |
| --- | --- |
| Runbook source | `$WORKSPACE/awesome-ai-coding-rules` |
| ClickHouse audit scripts, symbol meta sync, backfills | `$WORKSPACE/tradingflow-process-service-ec2` |
| Live UW ingest, write buffer, Better Stack health logs | `$WORKSPACE/tradingflow-cfworker-service` |
| Webapp consumers, contract-rank backfill helper | `$WORKSPACE/tradingflow-webapp-fullstack` |

Other sibling projects currently in the workspace (`tradingflow-api-service-lambda`, `tradingflow-cron-service-lambda`, `tradingflow-quant-service`, `tradingflow-web-landingpage`) are not primary sources for this UW trade/meta integrity audit. Only pull them in if a drill-down points to an API, cron, quant, or landing-page boundary.

## When to run

- After market close (ET), once `SyncSymbolMetaService` has finished (~19:00 ET)
- After a CF Worker deploy, process-service deploy, or symbol-meta config change
- When users report filters broken (`market_cap`, DEI, earning_date) or suspiciously thin trade flow

## Prerequisites

| Item | Workspace location |
| --- | --- |
| ClickHouse credentials | `$WORKSPACE/tradingflow-process-service-ec2/.env` — `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD` |
| Integrity script | `$WORKSPACE/tradingflow-process-service-ec2/scripts/check-data-integrity.ts` |
| Latency scripts | `$WORKSPACE/tradingflow-process-service-ec2/scripts/verify-producer-freshness.ts`, `audit-small-trade-coverage.ts` |
| Latency harness (SLOs, Better Stack fields) | `$WORKSPACE/tradingflow-process-service-ec2/wiki/harness/check-optiontrades-latency/` |
| **Do not** use ClickHouse MCP against production cloud | Use `.env` + HTTP/fetch or `bun` script per process-service `AGENTS.md` |

Live UW ingest runs in **`tradingflow-cfworker-service`** (`UwIngestionDO`). Nightly symbol meta runs in **`tradingflow-process-service-ec2`** (`SyncSymbolMetaService`).

Run the executable checks from `tradingflow-process-service-ec2`; keep this repo as the runbook/docs source. Prefer `bun` for these scripts because it auto-loads `.env` in this project.

---

## Domain context (read before interpreting metrics)

### INDEX vs STOCK vs ETF — expected field differences

Integrity checks **must** filter by `underlying_type`. Many “zeros” are **by design** for index options, not pollution.

| Field | INDEX | STOCK / ETF |
| --- | --- | --- |
| `market_cap` | **0** (always) | From `SymbolMetaData`; zero = meta gap |
| `dei` | **0** (always) | `\|dex\| / average_stock_volume × 100`; zero with `dex > 0` on non-index = investigate |
| `earning_date` | **`1970-01-01`** sentinel | From Alpha Vantage map; sentinel on stock/ETF = meta gap |
| `avg_stock_volume_at_normalization` | **0** | From meta; required for DEI |
| Ref price | Index quote provider / proxy (SPY×10, etc.) | `SymbolMetaData.last` or live vendor |

**Scan rules:**

- Use `underlying_type = 'STOCK'` for `market_cap` thresholds (script already does).
- Use `underlying_type != 'INDEX'` for DEI thresholds (script already does).
- Do **not** flag INDEX rows with `dei=0` or `market_cap=0` as defects.
- `expiry_days=0` on high volume is often **0DTE**, not missing data.

Breakdown sanity check:

```sql
SELECT
  underlying_type,
  count() AS rows,
  countIf(market_cap = 0) AS zero_mc,
  countIf(dei = 0 AND dex > 0) AS zero_dei_with_dex
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
GROUP BY underlying_type
ORDER BY rows DESC
```

### OCC symbol aliases (vendor ticker ≠ persisted symbol)

Option trades use **OCC roots** (`symbol` column). Polygon/Massive often uses a **different vendor id**. We persist the OCC root everywhere in ClickHouse; aliases map lookup only.

Canonical map (`src/shared/symbol-meta-aliases.ts` in both repos):

| OCC root (trades + meta `symbol`) | Polygon / Alpaca / Longport query id |
| --- | --- |
| `CMCS` | `CMCSA` |
| `BRKB` | `BRK.B` |
| `BFB` | `BRK.B` |

**Ingest (CF Worker):** after loading `SymbolMetaData`, `applySymbolMetaLookupAliases()` clones vendor rows onto missing OCC keys; `resolveStockMetaFromMap()` resolves at normalize time.

**Sync (process-service):** `resolvePolygonVendorTicker()` in `sync-symbol-meta/config.ts` — all three history providers should use it (Polygon primary, Alpaca/Longport fallbacks).

**Integrity implication:**

- Drill-down showing `BRKB` / `BFB` with `market_cap=0` while `BRK.B` meta exists → **alias bug** (local), not upstream outage.
- Symbol in `EXCLUDED_SYMBOLS` → **never synced**; zeros are config, not API failure.
- See `wiki/domain-invariants/symbol-meta.md` for current exclusion list.

### Upstream APIs — limitations and fallback chain

Symbol meta and ref prices come from vendors that **often have no bar or no reference row** for a given ticker/date. That is normal; the pipeline uses **ordered fallbacks** and sometimes inserts **partial rows**.

**Nightly `SyncSymbolMetaService` (19:00 ET)** — per symbol:

```
History (required — symbol skipped if all fail):
  Massive/Polygon Aggregates  (primary; uses resolvePolygonVendorTicker)
    → on error OR empty bars (if SYNC_SYMBOL_META_EMPTY_POLYGON_FALLBACK):
        Equities: Alpaca → Longport
        Indexes (SPX, NDX, VIX, RUT, DJI, WSB): Longport only

Reference (best-effort — row still inserted if history succeeded):
  Polygon Reference  (market_cap, sector, shares, underlying_type)
    → on 404/error: Longport static
    → still null: row kept with null fundamentals (referenceAnomalies)

Earnings only:
  Alpha Vantage calendar → earning_date (empty map = partial nulls, not skip)
```

**Outcomes agents should distinguish:**

| Sync outcome | Meaning for integrity scan |
| --- | --- |
| Symbol **skipped** (`aggregatesNoData`, `EXCLUDED_SYMBOLS`) | No `SymbolMetaData` row → trades get `market_cap=0`, DEI alerts |
| Row inserted, **null `market_cap`** | History OK, reference chain missed — **upstream partial**; may be OTC/illiquid |
| Row inserted, full fields | Healthy for that symbol |
| All symbols fail Polygon | Check sync logs — rare true upstream outage |

**Do not** conclude “Massive is down” from a handful of alias or excluded symbols. Require **broad** `aggregatesNoData` / error counts in `SyncSymbolMetaService` summary or multi-symbol drill-down.

**Live ingest ref prices** (separate from nightly meta): CF Worker uses live Alpaca/Massive/Longport/index providers during the session; nightly meta snapshot drives `market_cap`, `earning_date`, and DEI volume.

---

## Workflow

Copy and track:

```
- [ ] 1. Resolve latest trading date (ET)
- [ ] 2. Run automated integrity script (--strict)
- [ ] 3. Run Option Trades latency audit (Section 4)
- [ ] 4. If any breach → drill-down SQL (Section 5)
- [ ] 5. Check SymbolMetaData coverage for that date
- [ ] 6. Optional: Better Stack uw_websocket_health corroboration (Section 6)
- [ ] 7. Verdict + remediation (Section 7–8)
- [ ] 8. Report to user (Section 9 template)
```

### 1. Resolve latest trading date

Use the most recent **weekday** with a full session in `AggregatedOptionTrades` (not calendar “today” if holiday or pre-open):

```sql
SELECT
  date,
  count() AS agg_rows,
  max(time) AS last_time_et
FROM AggregatedOptionTrades
WHERE date >= today() - 10
GROUP BY date
ORDER BY date DESC
LIMIT 5
```

Pick the top row where `agg_rows` is in a normal range (typically **4M–7M** for a full day). Confirm `SymbolMetaData` exists for the same date:

```sql
SELECT count(), max(date) AS meta_date
FROM SymbolMetaData
WHERE date = toDate('YYYY-MM-DD')
```

**Cutover race signal:** `meta_date` ≠ trade `date`, or meta row count ≪ 5000 → ingest may have run before nightly sync; expect widespread `market_cap=0` / `earning_date=1970-01-01`.

### 2. Run automated script

From the process-service project:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
DATE=2026-06-03          # from step 1
BASELINE=2026-05-28       # recent healthy day, ~1 week prior
bun scripts/check-data-integrity.ts --date "$DATE" --baseline-date "$BASELINE" --strict
```

Exit **0** = all thresholds pass. Exit **1** = at least one breach (investigate Section 5).

### 3. Thresholds (defaults in integrity script)

| Metric | Healthy (typical) | Breach threshold | Likely cause |
| --- | --- | --- | --- |
| `premium_under_25k_share` | **~0.95–0.98** | &lt; **0.90** | **Local** — CF Worker write-buffer drained only high-priority queue (`UW_PREMIUM_HIGH_PRIORITY_THRESHOLD` = $25k) |
| `zero_market_cap_stock_share` | **&lt; 0.001** (after meta sync) | &gt; **0.005** (0.5%) | **Local config/sync** — missing `SymbolMetaData` row, `EXCLUDED_SYMBOLS`, or OCC alias (`BRKB`/`BFB`/`CMCS`); not usually Massive outage |
| `zero_dei_with_dex_share` (non-index) | **&lt; 0.02** | &gt; **0.02** | Missing `average_stock_volume`, tiny-DEX rounding (5 dp); **exclude INDEX** (DEI=0 by design) |
| `agg_row_ratio` vs baseline | **~0.85–1.05** | &lt; **0.70** | Missing writes, buffer drops, or shortened session |

**Good pollution verdict:** all four pass, `total` agg rows within ~15% of baseline, no dominant symbol in drill-down with thousands of `market_cap=0` rows.

**Bad pollution verdict:** any threshold breach, or drill-down shows systematic zeros (not isolated OTC/excluded symbols).

---

## 4. Option Trades latency (producer persist lag)

Measures **trade time → ClickHouse row** lag on `AggregatedOptionTrades` (`time` vs `updated_timestamp`). This is **not** UI latency or UW vendor delay alone — see `wiki/harness/check-optiontrades-latency/reference-metrics.md` for Δ vs persist lag and Better Stack fields.

**Timing:** Run on the same `DATE` as the integrity scan, after the session has rows (post-close). Skip if `total = 0` (pre-open / ingest not finished).

From the process-service project:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
DATE=2026-06-08   # from step 1
bun scripts/verify-producer-freshness.ts "$DATE"
bun scripts/verify-producer-freshness.ts --compare 2026-06-05,"$DATE"   # optional baseline day
bun scripts/audit-small-trade-coverage.ts "$DATE"
```

### Latency thresholds (open window 09:30–09:35 ET)

| Metric | Healthy (typical) | Investigate | Likely cause |
| --- | --- | --- | --- |
| Open **p50** lag | **≤ 3s** | **> 10s** | Write-buffer backlog, slow drain, or upstream burst at bell |
| Open **p95** lag | **≤ ~65s** | **> 120s** | Buffer depth, CH insert pressure, or UW upstream tail |
| Open **`rows_gt_30s` / open rows** | Down vs prior days | **> ~30%** of open rows | Same; compare with `--compare` |
| Open **`rows_gt_5min`** | **0** (usual) | **> 0** sustained at bell | Severe producer backlog at open |
| Full-day **`rows_gt_5min_day`** | **&lt; ~50k** | **> ~100k** with **`rows_gt_10min_day = 0`** | Mid-session catch-up (5–10 min lag), not row drops |
| Full-day **`rows_gt_10min_day`** | **0** on healthy days | **> 0** or **0** with low row count | **0 + thin day** → possible dropped rows (May 19 pattern) |
| Hourly coverage | All RTH hours **> 0** | Hour **10 ET = 0** | Mid-morning ingest failure |
| **`agg_to_raw_ratio`** (coverage script) | **~0.99–1.01** per hour | **&lt; 0.95** | Silent raw/agg loss or aggregation gap |

**Small-trade coverage (`audit-small-trade-coverage.ts`):** Confirms low-premium bands are present and hourly `raw_rows` ≈ `sum(trade_count)` on aggregates. A healthy premium mix with ratio ≈ 1.0 rules out May-29-style buffer starvation even when latency tails are elevated.

**Good latency verdict:** open p50 ≤ 3s, p95 ≤ ~65s, `rows_gt_10min_day = 0`, hourly holes none, `agg_to_raw_ratio` ≈ 1.0, no Better Stack buffer drops (Section 6).

**Degraded latency verdict:** open p50 OK but elevated p95 or large `rows_gt_5min_day` with `rows_gt_10min_day = 0` — usually **catch-up backlog**, corroborate with Better Stack `max_low_priority_lag_ms` / `write_buffer_*_drops`.

**Bad latency verdict:** open p50 **> 10s**, hour 10 = 0 rows, `write_buffer_high_drops > 0`, or `agg_to_raw_ratio` collapse with inverted premium mix (integrity breach).

Full audit procedure, Better Stack signals, and report fields: `tradingflow-process-service-ec2/wiki/harness/check-optiontrades-latency/SKILL.md`.

---

## 5. Drill-down SQL (run on breach)

Run from process-service with `.env` loaded (`bun -e` or script). Replace `YYYY-MM-DD`.

### Premium mix (buffer starvation)

```sql
SELECT
  countIf(premium < 25000) AS under_25k,
  countIf(premium >= 25000) AS over_25k,
  count() AS total,
  round(countIf(premium < 25000) / count(), 4) AS under_25k_share
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
```

Healthy full session: **under_25k_share ≥ 0.90**. May 29 incident: ~**0.31** (inverted).

### Top symbols missing market_cap (meta gaps)

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
LIMIT 30
```

**Known alias roots:** `BRKB`, `BFB` → Polygon `BRK.B`; `CMCS` → `CMCSA`. Check meta:

```sql
SELECT symbol, market_cap, average_stock_volume, underlying_type
FROM SymbolMetaData
WHERE date = toDate('YYYY-MM-DD')
  AND symbol IN ('BRKB', 'BFB', 'CMCS', 'BRK.B', 'CMCSA')
```

If trade symbol missing from meta but vendor row exists → alias/sync bug. If neither exists → sync skip or exclusion.

### earning_date sentinel

```sql
SELECT
  countIf(earning_date = toDate('1970-01-01') AND underlying_type != 'INDEX') AS zero_earning,
  count() AS total
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
```

Spike vs prior day often means **metadata snapshot unusable at ingest** (cutover), not Alpha Vantage outage alone.

### DEI gaps

```sql
SELECT
  countIf(dei = 0 AND dex > 0 AND underlying_type != 'INDEX') AS zero_dei_with_dex,
  countIf(underlying_type != 'INDEX') AS non_index
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
```

Actionable subset (exclude tiny dex noise):

```sql
SELECT symbol, count() AS n
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
  AND dei = 0 AND dex > 10 AND underlying_type NOT IN ('INDEX')
GROUP BY symbol
ORDER BY n DESC
LIMIT 20
```

### SymbolMetaData coverage (post-sync gate)

Same check as `src/sync-symbol-meta/coverage-gate.ts`:

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
LIMIT 50
```

Non-empty → sync skipped symbol (`EXCLUDED_SYMBOLS`, `aggregatesNoData`) before next open.

### Session completeness

```sql
SELECT
  min(time) AS first_trade,
  max(time) AS last_trade,
  count() AS rows
FROM AggregatedOptionTrades
WHERE date = toDate('YYYY-MM-DD')
```

Expect first trade ~**09:35 ET**, last ~**16:59 ET** on full days.

---

## 6. Better Stack corroboration (optional)

Search **`uw_websocket_health`** on production CF Worker during the session:

| Field | Healthy | Incident signal |
| --- | --- | --- |
| `max_low_priority_lag_ms` | &lt; 60s sustained | High lag + low premium share |
| `write_buffer_high_drops` / `write_buffer_low_drops` | 0 | Buffer overflow / starvation |
| `dei_suppressed_missing_symbol_meta` | ~0 after meta loaded | Missing snapshot rows at normalize |
| `market_cap_suppressed_missing_symbol_meta` | ~0 after meta loaded | Same, for market_cap |

See `/Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service/wiki/operation.md` (Post-incident prevention deploy). Treat existing uncommitted changes in that repo as user work unless the task explicitly asks to modify them.

---

## 7. Remediation (after bad verdict)

| Finding | Fix |
| --- | --- |
| Low premium &lt;$25k share | Deploy CF Worker write-buffer fix; verify `UW_LOW_STARVATION_FORCE_DRAIN_MS` |
| Widespread `market_cap=0` on one day | `bun scripts/backfill-trade-metadata.ts --date YYYY-MM-DD --apply` |
| BRKB/BFB/CMCS zeros | Ensure not in `EXCLUDED_SYMBOLS`; aliases in `src/shared/symbol-meta-aliases.ts`; re-run sync or one-off meta insert |
| DEI zeros | `bun scripts/backfill-dei.ts --date YYYY-MM-DD --apply` |
| Elevated open p95 / large `>5m` tail, coverage OK | Check CF Worker `UW_LOW_STARVATION_FORCE_DRAIN_MS`, buffer depth; see `check-optiontrades-latency/reference-audit.md` |
| Missing agg rows (never written) | **Not recoverable** from ClickHouse alone — gap is permanent for that window |
| MV contract columns stale | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/scripts/clickhouse/backfill/run-backfill.mjs` (schema probe picks legacy vs modern) |

After backfills, wait for ClickHouse mutations (`system.mutations`, `is_done=1`) before re-running this scan.

---

## 8. Upstream vs local (attribution cheat sheet)

| Symptom | Usually |
| --- | --- |
| ~96% row collapse + inverted premium mix | **Local** CF Worker buffer |
| All symbols `market_cap=0` same day | **Local** ingest before usable `SymbolMetaData` |
| One symbol (e.g. BRKB) all zeros | **Local** exclusion / missing alias / no meta row |
| Meta row exists, trades still zero | **Local** stale in-memory snapshot; run CF Worker refresh or wait for periodic meta reload |
| Polygon primary works, fallbacks fail for aliased OCC | **Local** — fallback must use same vendor id as Polygon (`resolvePolygonVendorTicker`) |
| Reference null `market_cap`, history OK | **Expected upstream gap** — Polygon Reference + Longport static both missed; row still inserted; not a full skip |
| Symbol skipped after all history providers empty | **Upstream no-data** for that ticker — check `aggregatesNoData` in sync summary |
| Broad Polygon errors (&gt;5% of universe) | Possible **true upstream outage** — corroborate sync logs |
| Open p50 OK, large `>5m(d)`, `>10m(d)=0`, ratios ≈ 1.0 | **Local** catch-up backlog — buffer/drain tuning, not data loss |
| High open p50 + CH hour gaps | **Local** ingest / write-buffer incident |

Do **not** blame Massive API outage until drill-down shows **broad** multi-symbol failure **and** sync logs show Polygon errors at scale. Isolated symbols (aliases, exclusions, illiquid OTC) are usually config or per-ticker upstream limits, not platform outage.

---

## 9. Report template

```markdown
## Data integrity — {date} (ET)

**Verdict:** Good / Degraded / Bad

### Metadata & row health

| Check | Value | Threshold | Status |
| --- | --- | --- | --- |
| Agg rows | | ~baseline | |
| Premium &lt;$25k share | | ≥ 0.90 | |
| zero_market_cap_stock share | | ≤ 0.005 | |
| zero_dei_with_dex share | | ≤ 0.02 | |
| SymbolMetaData rows | | ≥ 5000 | |
| Coverage gaps (≥10 trades) | | 0 symbols | |

### Option Trades latency (09:30–09:35 ET)

| Check | Value | Threshold | Status |
| --- | --- | --- | --- |
| Open p50 lag | | ≤ 3s | |
| Open p95 lag | | ≤ ~65s | |
| Open rows &gt; 30s | | down vs baseline | |
| Full-day rows &gt; 5m | | &lt; ~100k (context) | |
| Full-day rows &gt; 10m | | 0 typical | |
| agg_to_raw_ratio (hourly) | | ~1.0 | |
| Hourly gaps | | none | |

**Top issues:** (symbols / counts)

**Likely cause:** (local vs upstream, one sentence)

**Recommended actions:** (deploy / backfill / none)
```

---

## Companion check — Greeks parity

Trade/metadata integrity does **not** validate IV, delta, or option prices. After option-chain ingest (~19:00 ET), run the sibling runbook **[check-greeks-parity](./check-greeks-parity.md)**:

- **Phase A** — `OptionChainTable` vs Massive raw (validates local BS recalc)
- **Phase B** — `mv_contract_day_flow` vs `OptionChainTable` (internal consistency for contract-rank Greeks)

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD
```

---

## Related code

| Artifact | Workspace project |
| --- | --- |
| `scripts/check-data-integrity.ts` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `scripts/verify-producer-freshness.ts`, `scripts/audit-small-trade-coverage.ts` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `wiki/harness/check-optiontrades-latency/` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `scripts/check-greeks-parity.ts` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `scripts/backfill-trade-metadata.ts`, `backfill-dei.ts` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `src/sync-symbol-meta/coverage-gate.ts` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` |
| `src/shared/symbol-meta-aliases.ts` | process-service and `/Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service` |
| `wiki/operation.md`, `wiki/uw-ingestion-do.md` | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service` |
| Pipeline context | `/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules/knowledge/data-flow.md` |
| Symbol meta invariants + fallback detail | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2/wiki/domain-invariants/symbol-meta.md` |
