---
name: check-greeks-parity
description: Samples OptionChainTable and contract-flow Greeks against Massive raw snapshots and internal chain consistency. Use when validating local Black-Scholes IV/Greek recalculation, post option-chain deploy, or investigating contract-rank vs chain drift.
---

# Greeks / Price Parity Sample (TradingFlow)

Companion to [check-data-integrity](./check-data-integrity.md). That runbook covers **UW trade flow / symbol meta pollution**; this one covers **pricing model and Greeks correctness**.

## When to run

| Cadence | Scope |
| --- | --- |
| **Daily smoke** (optional) | Phase A only, 3 symbols (`SPY,QQQ,AAPL`) |
| **Post option-chain deploy** | Phase A + B, default symbol set |
| **Weekly** | Full Phase A + B |
| **Investigation** | After user reports wrong IV/delta on Contract-level analysis or Option Chain Analysis |

**Timing:** After nightly `OptionChainTable` ingest completes (~19:00 ET). Massive snapshot is **live at fetch time** — run same evening for EOD parity; intraday runs expect wider drift.

## Prerequisites

| Item | Location |
| --- | --- |
| ClickHouse credentials | `tradingflow-process-service-ec2/.env` |
| Massive API key | `MASSIVE_API_KEY` in same `.env` |
| Script | `tradingflow-process-service-ec2/scripts/check-greeks-parity.ts` |
| **Do not** use ClickHouse MCP on production cloud | Use `.env` + script per process-service `AGENTS.md` |

```bash
cd tradingflow-process-service-ec2
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase a --symbols SPY,NVDA --strict
bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase b --phase-b-top 100
```

---

## Why two phases

| Phase | Compares | Validates |
| --- | --- | --- |
| **A** | `OptionChainTable` vs **Massive raw** `implied_volatility` / `greeks` | Local BS recalc (`mapper.ts`, `local-bs-model.ts`) vs vendor |
| **B** | `mv_contract_day_flow` iv/delta vs **same-day `OptionChainTable`** | Trade-normalized Greeks vs chain snapshot (internal consistency) |

Contract-rank **does not** read chain Greeks for ranking — it uses flow Greeks from `mv_contract_day_flow`. Phase B catches **pipeline disagreeing with itself**, not “Massive is wrong intraday.”

---

## Domain context — local vs vendor Greeks

From `wiki/domain-invariants/optionchain-data.md` (Invariant 5):

1. **IV** — local bisection preferred when underlying, strike, DTE, and price inputs are valid (`calculateIv` in `mapper.ts`).
2. **Greeks** — Massive values used when present; if missing/zero, recomputed via `calculateIVAndGreeks` (`RISK_FREE_RATE = 0.045`, European BS, mid or close).
3. **Close** — official day close preferred over last trade (`close != null` check).

**Expected vendor diffs (not bugs):**

- Fixed 4.5% risk-free vs Massive’s curve
- European BS vs American / dividend-adjusted vendor models
- Mid vs close vs last-trade price input
- Index underlyings (SPX) vs equity chain
- Deep OTM / 0DTE / penny options

---

## Phase A — OptionChainTable vs Massive

### Sample design

Default symbols: `SPY, QQQ, AAPL, TSLA, NVDA`.

Per symbol: **top 8 contracts by OI** from `OptionChainTable` for the scan date.

Massive fetch uses `resolveMassiveUnderlyingSymbol()` (`CMCS→CMCSA`, `BRKB→BRK.B`, etc.) for the API path; comparison key is **OCC `option_symbol`**.

### Default thresholds (script constants)

| Metric | Alert when | Notes |
| --- | --- | --- |
| **IV** | rel diff &gt; **5%** **and** abs diff &gt; **0.03** | Both must fail |
| **Delta** | abs diff &gt; **0.10** | Wider for deep OTM manually |
| **Close** | rel diff &gt; **2%** **and** abs diff &gt; **$0.10** | Mid vs close common |
| **Per-symbol breach share** | &gt; **10%** of compared contracts | Symbol flagged |
| **Hard fail (`--strict`)** | ≥ **3** symbols flagged in Phase A | |

### Auto-skip (excluded from breach rate)

- `iv=0` and `delta=0`
- `expiry_days=0` (0DTE)
- Bid-ask spread &gt; **20%** of mid
- Missing price or missing Massive contract

### Drill-down when Phase A fails

1. **Inputs** — underlying price, bid/ask/close, DTE in CH row vs Massive payload.
2. **Mapper path** — did local recalc run? (`iv === 0 \|\| delta === 0 \|\| !input.greeks` in `mapper.ts`).
3. **Provider path** — Longport primary vs Massive fallback for that symbol (check option-chain P1 logs).
4. **Model** — `local-bs-model.ts` vs vendor; try `test-massive-iv.ts` for raw payload inspection.

```sql
SELECT option_symbol, symbol, strike, expiry_days, bid, ask, close, iv, delta, gamma, vega, theta, oi
FROM OptionChainTable
WHERE date = toDate('YYYY-MM-DD')
  AND symbol = 'AAPL'
ORDER BY oi DESC
LIMIT 10
```

---

## Phase B — Contract flow vs OptionChainTable

Top **50** contracts by premium from `mv_contract_day_flow` for the session date (default).

Compare `argMaxMerge(iv)` / `argMaxMerge(delta)` from flow vs chain row for same `option_symbol` + `date`.

### Default thresholds

| Metric | Alert when |
| --- | --- |
| **IV** abs diff | &gt; **0.08** |
| **Delta** abs diff | &gt; **0.12** |
| **Overall breach share** | &gt; **15%** of compared (hard fail with `--strict`) |

**Expected drift:** Flow Greeks come from **last trade normalization** during the session; chain is **EOD snapshot**. Large gaps on actively traded contracts late in the day are normal.

---

## Attribution cheat sheet

| Symptom | Usually |
| --- | --- |
| Phase A fails one symbol, others OK | Local mapper bug, alias vendor id, or Longport→Massive fallback for that symbol |
| Phase A fails all symbols same metric | Risk-free rate / DTE / global mapper regression |
| Phase A IV diff, delta OK | Local IV preferred over vendor (by design) — check if diff &gt; threshold |
| Phase B wide spread, Phase A OK | **Time horizon** — intraday flow vs EOD chain, not calculation bug |
| Phase B fails on symbols with no chain row | Chain ingest gap or symbol not in nightly universe |
| Both phases fail same contracts | Stale chain date or wrong `--date` |

---

## Remediation

| Finding | Action |
| --- | --- |
| Systematic IV inflation on OTM | Review `calculateIv` / bisection bounds in `mapper.ts` |
| Delta zero while Massive has delta | Local recalc path; check underlying price at ingest |
| Phase B only, high-flow names | Document as expected intraday vs EOD; widen thresholds or run post-close only |
| Missing OptionChainTable rows | Re-run `FetchOptionChainDataService` for date; check `aggregatesNoData` in sync logs |
| Massive fetch empty for aliased root | Use vendor ticker (`BRK.B` not `BRKB`) — script handles via alias map |

---

## Report template

```markdown
## Greeks parity — {date} (ET)

**Verdict:** Good / Degraded / Bad

### Phase A (OptionChainTable vs Massive)
| Metric | Value | Threshold | Status |
| --- | --- | --- | --- |
| Sampled contracts | | | |
| Compared (non-skipped) | | | |
| Breach share | | | |
| Failing symbols | | ≤ 2 | |

### Phase B (flow vs chain)
| Metric | Value | Threshold | Status |
| --- | --- | --- | --- |
| Top contracts | 50 | | |
| Breach share | | ≤ 0.15 | |

**Sample breaches:** (option_symbol, metric, stored vs ref)

**Likely cause:** (local model / time horizon / upstream / config)

**Recommended actions:**
```

---

## Related code

| Artifact | Repo |
| --- | --- |
| `scripts/check-greeks-parity.ts` | `tradingflow-process-service-ec2` |
| `scripts/check-data-integrity.ts` | `tradingflow-process-service-ec2` (trade/meta scan) |
| `src/optionchain-data/mapper.ts`, `local-bs-model.ts` | `tradingflow-process-service-ec2` |
| `src/contract-rank-snapshot/index.ts` | `tradingflow-cfworker-service` (flow iv/delta source) |
| `wiki/domain-invariants/optionchain-data.md` | `tradingflow-process-service-ec2` |
| Trade integrity runbook | `awesome-ai-coding-rules/ops/check-data-integrity.md` |
