---
name: gex-insiderfinance-comparison
description: >-
  Runbook for comparing the TradingFlow Rank symbol drawer GEX tab against
  InsiderFinance Gamma Exposure, and for comparing TradingFlow Rank IV-family
  metrics against Barchart IV Rank and Percentile pages for the same ticker and
  market session. Use when asked to audit GEX totals, wall/flip semantics,
  heatmap/profile UX, IV30/ATM IV, IV Rank, IV Percentile, or copyable product
  ideas from https://www.insiderfinance.io/gamma-exposure/<TICKER> and
  https://www.barchart.com/options/iv-rank-percentile.
---

# GEX / IV Vendor Comparison Runbook

Use this runbook to compare TradingFlow's **GEX** tab in the Rank symbol drawer
with InsiderFinance's Gamma Exposure page for the same ticker, and to compare
TradingFlow's **IV-family metrics** in Rank with Barchart's IV Rank and
Percentile pages. The goal is not to prove either vendor is canonical; the goal
is to gather current evidence, separate source freshness from calculation
semantics, and identify product patterns worth copying.

## Objective

Produce a current, evidence-backed comparison between TradingFlow's Rank
symbol-drawer GEX tab and InsiderFinance's Gamma Exposure page, or between
TradingFlow's Rank IV-family metrics and Barchart's IV Rank and Percentile
page, for the same ticker and market session.

Expected operator: an AI agent with browser automation, local repo access, and
permission to use the local TradingFlow test account. The runbook is executable
for live comparison work and maintainable as documentation without executing
the browser workflow.

Canonical owner: this file,
`ops/webappp-fullstack/gex-insiderfinance-comparison/SKILL.md`. As of 2026-06-28 there
is no separate ops index or alias runbook for this workflow.

## Agent Handoff

Last updated: 2026-06-28

No open handoff items after the latest maintenance pass. This was a
documentation maintenance update only: the comparison workflow was not executed.
Barchart page/help semantics were checked for durable methodology guidance, but
no live ticker comparison or local-browser TradingFlow check was run.

## Recommended Invocation

```text
/goal Objective: Compare TradingFlow Rank GEX tab against InsiderFinance Gamma Exposure for <TICKER> on the latest available session and produce a concise discrepancy report.
Success criteria: both pages are loaded and timestamped; headline totals, wall/flip levels, scope controls, heatmap, profile chart/table, and signals are compared; discrepancies are classified as data freshness, calculation semantics, or copyable UX; no code changes unless explicitly requested.
Stop condition: report delivered with evidence, or a blocker identifies auth, network, local server, or vendor-page failure.
```

For IV-family checks:

```text
/goal Objective: Compare TradingFlow Rank IV-family metrics against Barchart IV Rank and Percentile for <TICKER> on the latest available session and produce a concise discrepancy report.
Success criteria: TradingFlow IV30/ATM IV, IV Rank, IV Percentile, and historical-window availability are captured; Barchart implied volatility, IV Rank, IV Percentile, timestamp/update cadence, and visible filters are captured; differences are classified as freshness, methodology, scale/format, unavailable-by-contract, or copyable UX.
Stop condition: report delivered with evidence, or a blocker identifies auth, network, local server, Barchart access, or missing source-window data.
```

Default ticker: `SPY`.

## Prerequisites

1. Work from `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack`.
2. Read the Rank domain context before comparing behavior:
   - `knowledge/basic_concepts.md` if present. If the file is missing in the
     checkout, state that explicitly.
   - `doc/domain-knowledge/rank/domain-invariants.md`
   - `doc/domain-knowledge/rank/functionality.md`
3. Start or verify the local dev server:

   ```bash
   pnpm dev
   ```

   Use `http://127.0.0.1:8000/app/rank/symbols` unless the server reports a
   different port.
4. Browser automation must be available. Prefer Chrome when the user asks for
   Chrome or when existing browser state matters. Otherwise use the in-app
   browser, Playwright, or another browser tool that can read visible text and
   capture screenshots.
5. Use the local paid test login when TradingFlow asks for auth:
   - Email: `active+clerk_test@example.com`
   - OTP: `424242`
6. Confirm network access to:
   - `https://www.insiderfinance.io/gamma-exposure/<TICKER>`
   - `https://www.barchart.com/options/iv-rank-percentile/high?orderBy=optionsImpliedVolatilityRank1y&orderDir=desc`
   - local TradingFlow dev server

## Capture Discipline

Market data changes while you compare it. Record absolute timestamps and avoid
relative phrases such as "today" without the exact date.

Capture these fields at the top of the report:

```markdown
## Comparison Evidence
- Run date/time:
- Ticker:
- TradingFlow URL:
- TradingFlow session date:
- TradingFlow last-trade timestamp:
- InsiderFinance URL:
- InsiderFinance visible timestamp, if any:
- InsiderFinance spot:
- Browser/tool used:
```

If the two captures are more than a few minutes apart during market hours,
refresh both pages or state the capture window clearly.

For IV-family comparisons, also capture:

```markdown
## IV Comparison Evidence
- Run date/time:
- Ticker:
- TradingFlow URL:
- TradingFlow session date:
- TradingFlow symbol metadata / vol date if visible:
- TradingFlow IV30:
- TradingFlow ATM IV:
- TradingFlow IV Rank:
- TradingFlow IV Percentile:
- TradingFlow unavailable reason, if any:
- Barchart URL:
- Barchart visible timestamp / list updated time:
- Barchart Implied Volatility:
- Barchart IV Rank:
- Barchart IV Percentile:
- Barchart filters/view used:
- Browser/tool used:
```

## Workflow

### 1. Preflight

1. Run `git status --short --branch`. Do not mutate code or docs unless the
   user explicitly asks for implementation.
2. Read the required Rank docs listed in **Prerequisites**.
3. Verify the dev server is reachable.
4. Open a clean browser session or a known signed-in session.

### 2. Capture InsiderFinance

Open:

```text
https://www.insiderfinance.io/gamma-exposure/<TICKER>
```

Wait for the Gamma Exposure page to finish rendering. Record the visible values:

| Area | Fields to capture |
| --- | --- |
| Header | ticker, spot price, visible timestamp/session if present |
| Headline GEX | Net GEX, GEX ratio, Call GEX, Put GEX, Total/Gross GEX |
| Levels | Call Wall, Put Wall, Zero Gamma |
| Expiry scope | 0DTE, Weekly, Monthly, All Expirations values and labels |
| Heatmap | number of visible expiries, visible strike range, expand/all-strikes affordance |
| Profile | chart mode, net/call-put display, table behavior, near-spot filtering |
| Signals | volatility/magnet/squeeze or other narrative signal cards |

Take a screenshot when values are visible. If InsiderFinance blocks content,
changes markup, or omits a field, record the visible fallback evidence rather
than guessing.

### 3. Capture TradingFlow

Open:

```text
http://127.0.0.1:8000/app/rank/symbols
```

Sign in with the local test account if required. Select the same ticker and
open the Rank symbol drawer. Go to the **GEX** tab.

Record:

| Area | Fields to capture |
| --- | --- |
| Session | session date, last-trade timestamp, spot/last shown by TradingFlow |
| Scope controls | All, 0DTE, Weekly, Monthly buttons and percentages |
| Headline GEX | Net GEX, regime, GEX ratio, Gross GEX, Call GEX, Put GEX, Total OI, strike count |
| Levels | Zero-Gamma Flip, Gamma Magnet, Call Wall, Put Wall, 0DTE Flip if shown |
| GEX Level Map | header (symbol, spot, regime, active scope), prior-close structure date + resolved-at time, Above/At/Below rows with role badges (Call Wall, Put Wall, Gamma Magnet, 0DTE Top, Charm Pin, Max Pain), dollar/percent/Daily-ATR distances, gross-GEX share per node, separate Flip row, chart-layer toggles (Core/Magnet/Max Pain/Charm/0DTE), ATR-unavailable note if shown |
| Expiry Concentration | bucket labels, percentage denominator wording, net/gross values, expiry counts |
| Heatmap | expiry count, strike count, near-spot range, tooltip contents, expand affordance |
| Profile | chart/table toggle, net vs call/put toggle, near/all-strikes toggle |
| Extras | 0DTE Focus, GEX Ladder, Charm/Vanna section |

## Comparison Matrix

Use this matrix in the report. Keep values current to the run; do not reuse old
numbers except as clearly labeled examples.

| Field | TradingFlow | InsiderFinance | Assessment |
| --- | --- | --- | --- |
| Spot / last |  |  | Freshness or source drift? |
| Net GEX |  |  | Direction and magnitude close? |
| Gross/Total GEX |  |  | Same scale and denominator? |
| Call GEX |  |  | Same direction and scale? |
| Put GEX |  |  | Same direction and scale? |
| GEX ratio |  |  | Same formula? |
| Zero Gamma |  |  | Methodology gap or data gap? |
| Call Wall |  |  | Same wall definition? |
| Put Wall |  |  | Same wall definition? |
| Gamma Magnet / signal level |  |  | Same concept or adjacent concept? |
| 0DTE / weekly / monthly |  |  | Same denominator and buckets? |
| Heatmap depth |  |  | Coverage and interaction gap? |
| Profile chart/table |  |  | Missing useful toggle or filter? |
| Signals/readout |  |  | Copyable summary pattern? |

## IV Family Metrics vs Barchart

Use this workflow when the user asks to compare TradingFlow's IV / IV Rank /
IV Percentile / 30D historical IV behavior with Barchart.

### Vendor Methodology Baseline

Record these definitions in the report before judging discrepancies:

| Metric | TradingFlow contract | Barchart visible/help contract | Comparison rule |
| --- | --- | --- | --- |
| IV30 / ATM IV | Qualified two-sided ATM call+put IV by expiry, linearly interpolated to 30 DTE from TradingFlow's volatility producer | Implied Volatility is the average IV of the nearest monthly options contract that is 30 days out or more | Expect close direction, not exact parity; classify differences as methodology unless source data proves otherwise |
| IV Rank | `(today IV30 - 1Y low IV30) / (1Y high IV30 - 1Y low IV30)` over a full clean 252-trading-observation ATM 30D IV window | ATM average IV relative to the highest and lowest values over the past 1-year | Normalize scale before comparing: TradingFlow stores fractions and displays percent; Barchart displays percent |
| IV Percentile | Share of clean prior ATM 30D IV observations below today's IV30; only valid with the full clean window | Percentage of days where IV closed below current ATM IV over the past 1-year | Compare concept and rough value; exact parity can differ if lookback, IV construction, or day inclusion differs |
| 30D historical IV window | Full 252 clean TradingFlow ATM 30D IV observations are required for one-year Rank/Percentile | Vendor 1-year history is implicit in the page | If TradingFlow shows unavailable because the clean window is incomplete, that is expected behavior, not a bug |

Barchart's public help also states the IV Rank and Percentile page starts
updating for the new trading day around 9:50 a.m. ET, options information is
delayed roughly 25-30 minutes, and the list updates during the session. Capture
the page's visible timestamp because a freshness gap can explain otherwise
reasonable IV differences.

### 1. Capture Barchart

Open:

```text
https://www.barchart.com/options/iv-rank-percentile/high?orderBy=optionsImpliedVolatilityRank1y&orderDir=desc
```

Use the page search/filter to find `<TICKER>`, or sort/search the table if the
page does not expose a direct symbol route. Capture only visible values; do not
guess hidden or paywalled columns.

Record:

| Area | Fields to capture |
| --- | --- |
| Header / timestamp | page date, visible list update time, market delay note if visible |
| Filters / view | market, Stocks/ETFs/Indices toggles, High/Low Volatility page mode, active sort, active view |
| Ticker row | symbol, name, last price, change, volume, time of last trade if visible |
| IV metrics | Implied Volatility, IV Rank, IV Percentile, any IV change color/up-down indication |
| Adjacent context | 20D/30D historic volatility, IV/HV, option volume, open interest, or earnings columns if visible |
| Access limits | login wall, delayed data banner, missing columns, or custom-view requirement |

Take a screenshot with the ticker row and timestamp visible. If the page is
blocked or the row is unavailable, capture the visible blocker and stop the
Barchart side rather than fabricating data.

### 2. Capture TradingFlow IV Metrics

Open:

```text
http://127.0.0.1:8000/app/rank/symbols
```

Sign in with the local test account if required for filters or historical date
selection. For the same ticker:

1. Search or filter to `<TICKER>` on Symbols view.
2. Capture the Symbols-row columns:
   - `IV30`
   - `ATM IV`
   - `IV Rank`
   - `IV Percentile`
   - `25Δ Skew`
   - `Term Slope`
   - `25Δ Bfly`
3. Open the symbol drawer and go to the **Vol** tab.
4. Capture the IV Rank headline card, its sub-label, and its tooltip.
5. If Rank/Percentile are unavailable, capture the exact unavailable label and
   verify it matches the full-clean-window invariant.
6. If a data-path check is needed, inspect the current reader path for
   `SymbolVolDaily`, `SymbolMetaData`, and `mv_symbol_day_flow` rather than
   assuming the UI is the source of truth.

Do not treat a null TradingFlow IV Rank / IV Percentile as a regression until
you have checked whether the producer has a full clean 252-observation ATM 30D
IV window. The intended contract is to show unavailable rather than publish a
partial one-year metric.

### 3. IV Comparison Matrix

Use this matrix for the IV report:

| Field | TradingFlow | Barchart | Assessment |
| --- | --- | --- | --- |
| Capture timestamp |  |  | Same session and close enough in time? |
| Session / vol date |  |  | Same trading date? |
| Spot / last |  |  | Freshness or underlying-price source drift? |
| IV30 / Implied Volatility |  |  | Interpolated 30D ATM vs nearest monthly 30D-or-more method? |
| ATM IV |  |  | Same as IV30, nearest expiry, or separate vendor construction? |
| IV Rank |  |  | Same scale after normalizing 0-1 vs 0-100? |
| IV Percentile |  |  | Same below-current-days interpretation? |
| Historical window |  |  | TradingFlow has full 252 clean observations? |
| Unavailable/null state |  |  | Correct unavailable-by-contract or missing data bug? |
| 30D historical IV trend |  |  | If available, does trend direction agree even if level differs? |
| Adjacent context |  |  | Earnings, option volume, HV/IV, or filters explain difference? |

### 4. IV Discrepancy Classification

Classify each material difference:

| Bucket | How to decide | Typical action |
| --- | --- | --- |
| Freshness/source | Barchart timestamp, TradingFlow session, spot, or last trade is stale/different | Refresh both; record capture gap; avoid code changes |
| Methodology | IV level differs but both use plausible ATM/30D variants | Document interpolation vs nearest-monthly difference |
| Scale/format | One value is fraction and the other is percent, or percent rounding differs | Normalize before judging |
| Unavailable-by-contract | TradingFlow lacks the clean 252-observation window | Keep unavailable; explain why this is correct |
| Data-pipeline gap | TradingFlow should have the clean window but source rows are missing or stale | Trace `SymbolVolDaily` / metadata producer before UI changes |
| Presentation/UX | Barchart explains the metric or update cadence more clearly | Recommend tooltip, timestamp, update-cadence, or filter-label copy |
| Vendor/access limitation | Barchart row, timestamp, or columns are hidden/blocked | Report limitation and compare only visible fields |

Do not call TradingFlow wrong just because Barchart differs. First rule out:

- delayed Barchart options data versus TradingFlow session date
- Barchart's nearest-monthly 30D-or-more IV versus TradingFlow's interpolated
  30D ATM IV
- different one-year day inclusion rules
- missing clean observations in TradingFlow's volatility producer
- display-scale differences (`0.42` fraction versus `42%`)
- ticker-type mismatches such as ETF versus index roots

### 5. IV Copy Opportunities Checklist

Recommend Barchart-inspired changes only when the current comparison supports
them.

| Pattern from Barchart | Copy when | Do not copy when |
| --- | --- | --- |
| Visible page/list updated timestamp | Users could confuse stale vendor data with formula mismatch | TradingFlow already shows an equally precise vol-date label in context |
| Plain-language IV Rank / Percentile definitions near the table | Users need formula help while scanning Rank columns | The explanation would duplicate an existing tooltip without adding calculation detail |
| Separate High / Low volatility modes | Vol users need a faster cheap-vs-expensive scan | Existing sort/filter already solves the workflow clearly |
| Stocks / ETFs / Indices toggles | Cross-asset comparisons are noisy without asset-type scoping | The active TradingFlow filters already make asset type obvious |
| IV change color versus prior day | We have reliable prior-day IV deltas | The producer does not carry same-method prior-day deltas yet |
| Download/custom view affordance | Users need an exportable IV screener view | It would bypass the paid export/access contract |

## Discrepancy Classification

Classify every material difference into one of these buckets:

| Bucket | How to decide | Typical action |
| --- | --- | --- |
| Data freshness/source | Spot differs, timestamps differ, or one page has not refreshed latest chain data | Refresh both pages, sanity-check spot from the app/source, avoid code changes |
| Calculation semantics | Same data neighborhood, but wall/flip/magnet levels differ consistently | Document the semantic gap; inspect formulas before changing UI |
| Presentation/UX | Values are directionally aligned, but one page explains or exposes the data better | Recommend copyable UI behavior |
| Access/vendor limitation | InsiderFinance field is blocked, hidden, or changed | Report limitation and compare only visible fields |

Do not call a wall or flip discrepancy a bug until you have ruled out:

- Different spot timestamp
- Full-chain versus filtered-chain inputs
- Different expiry bucket definitions
- Different wall definitions, such as largest raw call concentration versus
  strongest call-side gamma near spot
- Different zero-gamma calculation, such as repriced full-chain flip versus
  strike-crossing approximation

## Copy Opportunities Checklist

Use this checklist after the evidence table. Recommend only ideas supported by
the comparison.

| Pattern from InsiderFinance | Copy when | Do not copy when |
| --- | --- | --- |
| Clear Call Wall / Put Wall headline cards | Our wall semantics are available and can be labeled precisely | The value would duplicate Gamma Magnet with a different name |
| Separate signal cards for volatility, magnet, and squeeze | The signal adds interpretation beyond raw totals | It would restate the existing GEX Level Map without new evidence |
| Expanded heatmap or "show all strikes" affordance | Users need to inspect more expiries or far strikes than the compact panel exposes | It slows the drawer or buries the near-spot read |
| Explicit expiry-scope labels | Percentages could be confused across vendors | Our denominator is already obvious in the local panel |
| Near-spot strike count disclosure | The profile intentionally filters to a window | The chart already shows all strikes |
| Wall/magnet semantic labels | InsiderFinance and TradingFlow levels differ but both are useful | The label implies exact vendor parity we do not provide |

Current high-value recommendations usually come from level semantics and UX
clarity, not from forcing headline GEX totals to match exactly.

## Report Format

Use this structure for the final comparison. Select the GEX matrix, the IV
matrix, or both depending on the user request.

```markdown
## Summary
One or two sentences with the main conclusion.

## Evidence
<capture metadata and comparison matrix>

## Material Discrepancies
1. <highest-impact gap with current values and likely bucket>
2. ...

## What To Copy
- <copyable item, why it helps, and any semantic/methodology label needed>

## What Not To Copy Yet
- <item that needs formula/source validation first>

## Blockers Or Caveats
- <auth/network/vendor/local-data caveats, or "None">
```

## Browser Automation Notes

Element identifiers are not stable. Discover the page state each run before
clicking.

Example browser-use style flow:

```bash
browser-use --session gex-compare open https://www.insiderfinance.io/gamma-exposure/SPY
browser-use --session gex-compare wait text "Gamma Exposure" --timeout 30000
browser-use --session gex-compare state
browser-use --session gex-compare open http://127.0.0.1:8000/app/rank/symbols
browser-use --session gex-compare wait text "Symbol-level analysis" --timeout 30000
browser-use --session gex-compare state
```

For Barchart IV comparisons, use a separate page load in the same session:

```bash
browser-use --session gex-compare open "https://www.barchart.com/options/iv-rank-percentile/high?orderBy=optionsImpliedVolatilityRank1y&orderDir=desc"
browser-use --session gex-compare wait text "IV Rank" --timeout 30000
browser-use --session gex-compare state
```

For sign-in, use the element ids from the current `state` output:

```bash
browser-use --session gex-compare input <email-input-id> "active+clerk_test@example.com"
browser-use --session gex-compare click <continue-button-id>
browser-use --session gex-compare input <otp-input-id> "424242"
browser-use --session gex-compare click <verify-button-id>
```

Do not paste raw browser state into the final answer. Summarize the fields and
attach screenshots only when they materially support the conclusion.

## Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| TradingFlow redirects to login or hides the drawer tab | Premium gate | Sign in with the local paid test account |
| Local page never loads | Dev server down, stale port, backend unavailable | Check `pnpm dev`, terminal errors, and browser console/network |
| InsiderFinance values disappear or page layout changes | Vendor markup/access change | Capture screenshots and visible fallback fields; do not infer hidden values |
| Barchart row or IV columns are hidden | Vendor access, custom-view, or markup change | Capture visible filters/timestamp and compare only visible fields |
| Spot differs materially | Data freshness/source mismatch | Refresh both pages and sanity-check spot before judging GEX math |
| Headline GEX is close but wall/flip differs | Calculation semantics | Compare formulas and label the semantic gap |
| Expiry percentages do not line up | Different denominators or buckets | Record labels exactly; avoid direct numeric parity claims |
| TradingFlow IV Rank / IV Percentile is unavailable | Missing clean 252-observation ATM 30D IV window | Verify the producer window before calling it a bug; unavailable is correct when the full clean window is absent |
| Barchart IV differs from TradingFlow IV30 | Different IV construction | Compare Barchart nearest-monthly 30D-or-more IV against TradingFlow interpolated 30D ATM IV; classify as methodology unless evidence says otherwise |
| Ticker looks wrong | Symbol mismatch | Confirm `SPY` versus `SPX`, `SPXW`, ETF roots, or adjusted symbols |

## Verification

For documentation-only runbook updates:

```bash
git diff --check
test -f ops/webappp-fullstack/gex-insiderfinance-comparison/SKILL.md
test -f doc/domain-knowledge/rank/domain-invariants.md
test -f doc/domain-knowledge/rank/functionality.md
```

Then re-read the runbook and verify:

- It has a clear objective, expected operator, canonical owner, and bounded
  `Agent Handoff`.
- It tells the agent to capture timestamps and same-ticker evidence.
- It separates freshness, formula/methodology semantics, unavailable-by-contract
  states, and UX copy opportunities.
- It explains Barchart IV Rank / IV Percentile comparison rules without treating
  Barchart as canonical.
- It does not present old numeric examples as current truth.
- It has a clear report template and troubleshooting path.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the run revealed a reusable lesson that should change this
   runbook.
2. Promote durable lessons into the procedure, prerequisites, verification, or
   troubleshooting sections.
3. Keep transient next-run state in `Agent Handoff` only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the
   final report.

Update this runbook when:

- A TradingFlow route, auth flow, drawer label, or GEX tab label drifts.
- Required Rank domain docs move, disappear, or gain relevant constraints.
- InsiderFinance visible field names or page structure change.
- Barchart visible field names, help definitions, timestamp/update semantics, or
  page structure change.
- Browser automation commands or selector-discovery steps stop working.
- Comparison fields no longer exist, or new fields should be standard.
- A repeated blocker or ambiguity slows execution.
- A verification gate is too weak, too broad, or missing.
- A duplicate runbook or alias needs a clearer canonical owner.

If another automation index is added under `ops/webappp-fullstack/`, add this runbook
there as part of the same maintenance pass.

Do not update this runbook for:

- One-off numeric comparison results that belong only in the final report.
- Raw browser state, screenshots, or logs from a single run.
- Completed progress with no remaining next action.
- Speculative copy ideas that were not supported by a current comparison.
