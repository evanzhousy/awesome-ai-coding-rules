---
name: check-data-integrity
description: Runs a post-close ClickHouse data integrity scan on the latest trading date for TradingFlow UW ingest. Checks premium mix, metadata pollution, DEI gaps, row counts, and SymbolMetaData coverage. Use when the user asks for data integrity, data pollution, ETL health, post-close audit, May-29-style regressions, or zero market_cap/dei issues.
---

# Data Integrity Scan (TradingFlow)

Agent runbook for judging whether **AggregatedOptionTrades** data for the latest trading date is healthy. Based on the May 2026 CF Worker cutover incident (write-buffer starvation, missing SymbolMetaData, BRKB/BFB alias gaps).

## When to run

- After market close (ET), once `SyncSymbolMetaService` has finished (~19:00 ET)
- After a CF Worker deploy, process-service deploy, or symbol-meta config change
- When users report filters broken (`market_cap`, DEI, earning_date) or suspiciously thin trade flow

## Prerequisites

| Item | Location |
| --- | --- |
| ClickHouse credentials | `tradingflow-process-service-ec2/.env` — `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD` |
| Automated script | `tradingflow-process-service-ec2/scripts/check-data-integrity.ts` |
| **Do not** use ClickHouse MCP against production cloud | Use `.env` + HTTP/fetch or `bun` script per process-service `AGENTS.md` |

Live UW ingest runs in **`tradingflow-cfworker-service`** (`UwIngestionDO`). Nightly symbol meta runs in **`tradingflow-process-service-ec2`** (`SyncSymbolMetaService`).

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
- [ ] 3. If any breach → drill-down SQL (Section 4)
- [ ] 4. Check SymbolMetaData coverage for that date
- [ ] 5. Optional: Better Stack uw_websocket_health corroboration
- [ ] 6. Verdict + remediation (Section 6–7)
- [ ] 7. Report to user (Section 8 template)
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

From `tradingflow-process-service-ec2`:

```bash
cd tradingflow-process-service-ec2
DATE=2026-06-03          # from step 1
BASELINE=2026-05-28       # recent healthy day, ~1 week prior
bun scripts/check-data-integrity.ts --date "$DATE" --baseline-date "$BASELINE" --strict
```

Exit **0** = all thresholds pass. Exit **1** = at least one breach (investigate Section 4).

### 3. Thresholds (defaults in script)

| Metric | Healthy (typical) | Breach threshold | Likely cause |
| --- | --- | --- | --- |
| `premium_under_25k_share` | **~0.95–0.98** | &lt; **0.90** | **Local** — CF Worker write-buffer drained only high-priority queue (`UW_PREMIUM_HIGH_PRIORITY_THRESHOLD` = $25k) |
| `zero_market_cap_stock_share` | **&lt; 0.001** (after meta sync) | &gt; **0.005** (0.5%) | **Local config/sync** — missing `SymbolMetaData` row, `EXCLUDED_SYMBOLS`, or OCC alias (`BRKB`/`BFB`/`CMCS`); not usually Massive outage |
| `zero_dei_with_dex_share` (non-index) | **&lt; 0.02** | &gt; **0.02** | Missing `average_stock_volume`, tiny-DEX rounding (5 dp); **exclude INDEX** (DEI=0 by design) |
| `agg_row_ratio` vs baseline | **~0.85–1.05** | &lt; **0.70** | Missing writes, buffer drops, or shortened session |

**Good pollution verdict:** all four pass, `total` agg rows within ~15% of baseline, no dominant symbol in drill-down with thousands of `market_cap=0` rows.

**Bad pollution verdict:** any threshold breach, or drill-down shows systematic zeros (not isolated OTC/excluded symbols).

---

## 4. Drill-down SQL (run on breach)

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

## 5. Better Stack corroboration (optional)

Search **`uw_websocket_health`** on production CF Worker during the session:

| Field | Healthy | Incident signal |
| --- | --- | --- |
| `max_low_priority_lag_ms` | &lt; 60s sustained | High lag + low premium share |
| `write_buffer_high_drops` / `write_buffer_low_drops` | 0 | Buffer overflow / starvation |
| `dei_suppressed_missing_symbol_meta` | ~0 after meta loaded | Missing snapshot rows at normalize |
| `market_cap_suppressed_missing_symbol_meta` | ~0 after meta loaded | Same, for market_cap |

See `tradingflow-cfworker-service/wiki/operation.md` (Post-incident prevention deploy).

---

## 6. Remediation (after bad verdict)

| Finding | Fix |
| --- | --- |
| Low premium &lt;$25k share | Deploy CF Worker write-buffer fix; verify `UW_LOW_STARVATION_FORCE_DRAIN_MS` |
| Widespread `market_cap=0` on one day | `bun scripts/backfill-trade-metadata.ts --date YYYY-MM-DD --apply` |
| BRKB/BFB/CMCS zeros | Ensure not in `EXCLUDED_SYMBOLS`; aliases in `src/shared/symbol-meta-aliases.ts`; re-run sync or one-off meta insert |
| DEI zeros | `bun scripts/backfill-dei.ts --date YYYY-MM-DD --apply` |
| Missing agg rows (never written) | **Not recoverable** from ClickHouse alone — gap is permanent for that window |
| MV contract columns stale | `tradingflow-webapp-fullstack/scripts/clickhouse/backfill/run-backfill.mjs` (schema probe picks legacy vs modern) |

After backfills, wait for ClickHouse mutations (`system.mutations`, `is_done=1`) before re-running this scan.

---

## 7. Upstream vs local (attribution cheat sheet)

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

Do **not** blame Massive API outage until drill-down shows **broad** multi-symbol failure **and** sync logs show Polygon errors at scale. Isolated symbols (aliases, exclusions, illiquid OTC) are usually config or per-ticker upstream limits, not platform outage.

---

## 8. Report template

```markdown
## Data integrity — {date} (ET)

**Verdict:** Good / Degraded / Bad

| Check | Value | Threshold | Status |
| --- | --- | --- | --- |
| Agg rows | | ~baseline | |
| Premium &lt;$25k share | | ≥ 0.90 | |
| zero_market_cap_stock share | | ≤ 0.005 | |
| zero_dei_with_dex share | | ≤ 0.02 | |
| SymbolMetaData rows | | ≥ 5000 | |
| Coverage gaps (≥10 trades) | | 0 symbols | |

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
cd tradingflow-process-service-ec2
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD
```

---

## Related code

| Artifact | Repo |
| --- | --- |
| `scripts/check-data-integrity.ts` | `tradingflow-process-service-ec2` |
| `scripts/check-greeks-parity.ts` | `tradingflow-process-service-ec2` |
| `scripts/backfill-trade-metadata.ts`, `backfill-dei.ts` | `tradingflow-process-service-ec2` |
| `src/sync-symbol-meta/coverage-gate.ts` | `tradingflow-process-service-ec2` |
| `src/shared/symbol-meta-aliases.ts` | both process-service and cfworker |
| `wiki/operation.md`, `wiki/uw-ingestion-do.md` | `tradingflow-cfworker-service` |
| Pipeline context | `awesome-ai-coding-rules/knowledge/data-flow.md` |
| Symbol meta invariants + fallback detail | `tradingflow-process-service-ec2/wiki/domain-invariants/symbol-meta.md` |
