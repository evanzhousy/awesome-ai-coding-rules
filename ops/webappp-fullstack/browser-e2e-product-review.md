---
name: browser-e2e-product-review
description: Browser-driven TradingFlow webapp product E2E walkthrough runbook. Uses the Browser plugin to manually exercise real user journeys, find UI defects, and produce PM/trader UX findings without running repository Playwright scripts.
disable-model-invocation: true
---

# Browser E2E Product Review (Webapp Fullstack)

Use this runbook when the user asks an AI agent to use `@Browser` / `plugin://browser@openai-bundled` to walk the TradingFlow webapp like a real user, find UI errors, and judge product UX from a product manager and option trader perspective.

This runbook is intentionally **browser-first**. Do not run the repository Playwright E2E suite as the review mechanism. Use existing E2E specs and automation docs as read-only journey maps, then execute the journeys interactively with the Browser plugin.

## Recommended Invocation

Use `/goal` for a full review:

- Objective: run a Browser-driven product E2E walkthrough for the requested TradingFlow webapp surface, finding UI defects and PM/trader UX issues without executing repository E2E scripts.
- Success criteria: Browser plugin is used for walkthroughs, required product/domain context is read, scoped journeys are exercised for the relevant personas and viewports, findings use the required output tables, and this runbook is maintained if reusable friction is discovered.
- Stop condition: scoped journeys are complete, a real browser/auth/data/local-env blocker is documented with evidence, or the user redirects scope.

Pasteable objective:

```text
Use ops/webappp-fullstack/browser-e2e-product-review.md as the runbook. Use @Browser / plugin://browser@openai-bundled to walk the requested TradingFlow webapp journeys in the browser. Do not run repository Playwright E2E scripts. Use existing E2E specs only as read-only journey maps. Produce UI defect findings, ProductReviewFinding rows, ElementActionMatrix, TraderScorecard, BrowserJourneyCoverage, evidence index, blockers, and runbook maintenance note.
```

## Agent Handoff

Last updated: 2026-06-17

No open handoff items.

## Goal

Produce an evidence-backed Browser walkthrough report that answers:

1. Does the selected surface work end-to-end for realistic users?
2. What visible UI defects, broken states, layout issues, dead clicks, or confusing flows did the browser walkthrough expose?
3. What is unreasonable or weak from a product manager and option trader perspective?
4. Which UI elements should be added, deleted, merged, updated, or kept?

## Non-Negotiables

- Use the Browser plugin for product walkthroughs. In Codex, follow the `Browser:control-in-app-browser` skill and use the in-app browser surface.
- Do not substitute `pnpm exec playwright test`, `npx playwright test`, test generators, or repo automation scripts for the walkthrough.
- Do not edit tests, product code, route files, or docs unless the user explicitly expands scope beyond review.
- Do not commit `FINDINGS.md`, screenshots, browser exports, or review artifacts. Findings stay in the session output unless the user asks for a persistent artifact.
- Treat E2E specs as journey maps only: read titles, personas, setup, routes, and expected user outcomes; do not use selectors or spec line numbers as UX evidence.
- Domain truth wins over current code and current tests. If glossary or invariant docs conflict with the observed UI, report the mismatch.
- Do not transmit sensitive data, make purchases, save payment methods, submit destructive forms, or change account permissions unless the user explicitly authorized that exact action.

## What "Not From Scripts" Means

Allowed:

- Start or reuse the local dev server.
- Read docs, E2E specs, and app code for context.
- Use `@Browser` interactions: navigate, click, type, inspect DOM, check console/network, take screenshots, switch viewports, and verify visible states.
- Use Browser's internal locator or DOM APIs as a control aid.

Forbidden unless the user explicitly changes scope:

- `pnpm exec playwright test ...`
- `npx playwright test ...`
- Running `tests/e2e/**/*.spec.ts`
- Running custom scripts that automate the review in place of interactive Browser walkthroughs.
- Editing specs to make the review pass.
- Treating a screenshot alone as proof of auth, billing, saved preference, stream health, access gate, or route-state correctness.

## Required Context

Set the app repo first:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
```

Read in this order:

1. `AGENTS.md`
2. `doc/knowledge/glossary.md`
3. Relevant invariant docs:
   - Auth, billing, access, Watchlist, app shell: `doc/domain-knowledge/domain-invariants/platform.md`
   - Option Trades: `doc/domain-knowledge/domain-invariants/data-apps/option-trades.md`
   - Rank workbench, Contract-level analysis, Symbol-level analysis: `doc/domain-knowledge/domain-invariants/data-apps/rank.md`
4. Shared product review contract: `doc/automation/product-review/README.md`
5. Shared E2E policy: `doc/automation/e2e-test/e2e-update-skills.md`
6. The module-specific product-review prompt when present:
   - Auth: `doc/automation/product-review/auth-goal-driven-prompt.md`
   - Option Trades: `doc/automation/product-review/option-trades-goal-driven-prompt.md`
   - Contract-level analysis: `doc/automation/product-review/contract-rank-goal-driven-prompt.md`
7. The module-specific E2E prompt and spec as read-only journey maps.

Path drift note: older product-review prompts may still mention `contract-rank.md` or standalone `/app/contract-rank`. If the current checkout has the unified Rank invariant in `rank.md`, use `rank.md` as source of truth and record prompt drift in `Prompt maintenance suggestion`.

## Module Map

| Surface | Primary routes | Domain truth | Read-only journey maps |
| --- | --- | --- | --- |
| Auth, Billing, Access Gates | `/`, `/app`, `/app/billing`, `/app/account`, `/app/settings/profile`, gated app routes | `platform.md` | `doc/automation/product-review/auth-goal-driven-prompt.md`, `doc/automation/e2e-test/auth-goal-driven-prompt.md`, `tests/e2e/specs/auth/` |
| Option Trades | `/app/option-trades`, `/app/option-trades/live`, `/app/option-trades/historical` | `option-trades.md`, plus `platform.md` for Watchlist/access | `doc/automation/product-review/option-trades-goal-driven-prompt.md`, `doc/automation/e2e-test/option-trades-goal-driven-prompt.md`, `tests/e2e/specs/option-trades/option-trades.spec.ts`, `watchlist.spec.ts` |
| Contract-level analysis | `/app/rank/contracts`, legacy `/app/contract-rank` | `rank.md`, plus `platform.md` for Watchlist/access | `doc/automation/product-review/contract-rank-goal-driven-prompt.md`, `doc/automation/e2e-test/contract-rank-goal-driven-prompt.md`, `tests/e2e/specs/contract-rank/contract-rank.spec.ts` |
| Symbol-level analysis | `/app/rank/symbols`, legacy `/app/symbol-level` or `/app/market-rank` if supported | `rank.md`, plus `platform.md` for Watchlist/access | `doc/automation/e2e-test/market-rank-goal-driven-prompt.md`, `tests/e2e/specs/market-rank/market-rank.spec.ts`; if product-review prompt is missing, use `product-review/README.md` + `rank.md` |

## Runtime Setup

Local default:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm dev
```

Default URL: `http://localhost:8000`

Default credentials from `tests/e2e/fixtures/auth.ts`:

| Persona | Email | Expected state |
| --- | --- | --- |
| Guest | Clean Browser context / cleared Clerk cookies | Public preview or `LoginModal` gates |
| Active | `active+clerk_test@example.com` | Paid/entitled baseline |
| Canceled | `canceled+clerk_test@example.com` | Signed-in unpaid baseline |
| Trial variants | See `tests/e2e/fixtures/auth.ts` | Use only when the prompt asks for trial behavior |

OTP defaults to `424242` unless the repo docs or user say otherwise.

## Browser Plugin Procedure

1. Read and follow the Browser plugin skill before browser work. The required plugin is `plugin://browser@openai-bundled`.
2. Use the in-app Browser. Keep it hidden unless the user explicitly wants to watch.
3. Do not fall back to Chrome, standalone Playwright, Computer Use, or web search for local app testing unless `@Browser` is unavailable and the user approves the fallback.
4. Before each interaction, know the current visible state. After each click, type, navigation, filter apply, modal action, or viewport switch, collect the cheapest verification signal:
   - DOM/state snapshot for labels, roles, enabled state, route, modal open/closed.
   - Screenshot only when visual layout, overlap, chart rendering, table density, or mobile fit matters.
   - Console/network inspection when a UI error, blank widget, dead action, or failed load is suspected.
5. Use a clean Browser context for guest checks. Do not confuse signed-out UI with cached Clerk/session state.
6. Reload after code or build changes only if implementation scope was added. For review-only sessions, do not modify code.

## Workflow

### 0. Scope The Run

Write a short scope block before opening the UI:

- Surface(s) and routes.
- Personas: guest, active, canceled, trial, or user-specified.
- Viewports: desktop default and mobile if the surface has responsive controls.
- Explicit non-goals.
- Whether this is review-only or user-approved implementation follow-up.

### 1. Build The Journey Map

Use the read-only E2E docs and specs to turn test coverage into user outcomes:

1. List relevant `test.describe` / `test(...)` titles and module prompt journey IDs.
2. Translate them into user-language journeys, not selector tasks.
3. Merge duplicates into a compact `BrowserJourneyCoverage` checklist.
4. Add exploratory checks that E2E scripts usually miss: visual layout, copy clarity, scanability, empty/loading/error states, mobile fit, and cross-route continuity.

Do not paste Playwright locators into the walkthrough plan unless they are the only stable way to identify a control internally. User-facing findings must cite visible behavior, copy, URL, persona, and state.

### 2. Pass 0: Greenfield Model

Before opening the route, state:

- The primary user or trader job.
- The ideal workflow if this product did not already exist.
- One sentence product promise.
- The clearest path to a useful decision or conversion.

This pass prevents "the existing UI works as designed" from becoming the default answer.

### 3. Browser Walkthrough

For each persona and route in scope:

1. Navigate from the route a real user would use, not only a deep link.
2. Verify the initial state: title, nav location, loading state, data presence or empty state, account state, and visible gates.
3. Exercise the journey actions in Browser:
   - Auth: login, logout, gate redirects, billing/account/profile flows, subscription copy, guest-to-signed-in recovery.
   - Option Trades: Historical/Live modes, filters, date/time controls, chips, Watchlist/symbol scope, saved filter behavior, column layout, sorting, pagination, export affordance, Live status/empty/error states.
   - Contract-level analysis: Rank shell tabs, preview vs paid snapshot, filters/sort/pagination, symbol/watchlist scope, KPI/brief, row inspect, drawer tabs, exact-contract Option Trades handoff.
   - Symbol-level analysis: Rank shell tabs, symbol filters/sort, drawer tabs, Watchlist/symbol lookup, Option Trades handoff, premium gates.
4. For each action, record the visible outcome and whether it matches the domain invariant.
5. Switch to mobile viewport for any surface with sheets, drawers, tabs, dense tables, or modal controls. Check for overlap, clipped text, scroll traps, unusable tap targets, and lost state.

### 3A. Exhaustive Control Matrix

For data-app surfaces, do not assume a visible control works because it renders or because a test spec names it. Build and execute an `ElementActionMatrix` for every user-facing actionable element in scope:

1. Inventory the rendered controls by visible UI group:
   - Tabs, segmented controls, date/session selectors, symbol/watchlist controls, filter dialogs, numeric inputs, switches, column pickers, sort headers, pagination, export/download, refresh/live controls, row actions, drawer tabs, and handoff buttons.
   - Record disabled controls too, including whether the UI explains why they are disabled.
2. Exercise each actionable control at least once with Browser interaction.
3. After every filter, sorter, input, date/time, symbol/watchlist, or pagination change, verify the table/result state:
   - For visible table fields, every visible row sampled must match the selected value or numeric range.
   - For sorters, the active sort indicator must change and visible row values must be ordered in the displayed direction after the table settles.
   - For pagination/page-size controls, the visible row count and page label must match the selected setting.
   - For symbol/watchlist filters, the trigger/chip and visible row symbols must both reflect the selection.
   - For columns, the header set and row cell alignment must change consistently.
4. If a control affects data that is not represented in the visible UI, mark it as `not directly verifiable from UI`, then still verify applied chips, row-count/result changes, loading/error handling, and absence of contradictory success/failure feedback. File a UX/testability finding when a trader cannot tell whether the control did what it says.
5. Wait for the final settled state before judging a control. A first non-loading DOM frame is not sufficient when rows continue to update after a filter/date/symbol change.
6. When the page cannot load rows, record the exact blocker and do not claim filter/sorter coverage for that surface. Test any controls still available in the blocked state, such as disabled explanations, refresh, date selectors, tabs, and empty/loading copy.

### 4. UI Defect Sweep

Look specifically for:

- App crash, error boundary, blank route, blank chart/widget, or infinite spinner.
- Dead click, disabled control with no explanation, wrong modal (`LoginModal` vs `PaywallModal`), or action with no visible feedback.
- Text overflow, clipped labels, hidden buttons, overlapping sticky headers, inaccessible mobile controls, and horizontal scroll that hides primary actions.
- Conflicting copy, stale labels, wrong canonical product names, implementation terms visible to users, or copy that contradicts the glossary.
- Broken route state: reload loses committed state where the contract says it should persist, or query params leak where docs say state should be local/path-only.
- Loading, empty, market-closed, live-streaming, stale-data, and error states that do not explain what happened or what to do next.
- Console errors that correlate with visible breakage.
- Network failures that leave the user in a misleading success state.
- TradingView widgets that are blank only on this Mac. Before filing a product bug, check whether Shadowrocket/fake-IP routing is blocking `www.tradingview-widget.com`.

### 5. Product And Option Trader Review

Judge the surface with these dimensions:

| Dimension | What to ask |
| --- | --- |
| `speedToInsight` | How fast can the user reach the first useful read? |
| `scanability` | Can a trader compare rows, contracts, symbols, metrics, and states without fighting the UI? |
| `decisionConfidence` | Are freshness, caveats, context, and metric labels strong enough to support a trading/research decision? |
| `dataTrust` | Are delayed/intraday/historical/live states explicit and credible? |
| `controlErgonomics` | Are filters, sorting, tabs, drawers, sheets, and reset/apply flows discoverable and efficient? |
| `statePersistence` | Do saved preferences, route state, reload, and tab switches behave as promised? |
| `crossRouteHandoff` | Does movement to related surfaces preserve enough context to continue the job? |
| `accessConversion` | For auth/paywall surfaces, does the gate explain value and recover cleanly? |

For option-trader judgment, prioritize the trader's workflow over visual polish: contract identity, symbol/date/put-call/strike, premium and liquidity context, volume/OI, delta, GEX/regime context, live/off-hours truth, and ability to carry context into Option Trades.

### 6. Synthesize Findings

Deduplicate as you go. A finding is real when it has:

- Persona.
- Route and viewport.
- Visible evidence.
- Expected behavior from invariant/docs or clear PM/trader job.
- Consequence.
- Acceptance signal for a future browser review.

Do not file a product bug for missing account data, market-closed live states, empty Watchlist, or local network/proxy problems unless the UI fails to explain or recover from those states.

## Required Output

### BrowserJourneyCoverage

| Field | Meaning |
| --- | --- |
| `journeyId` | Stable ID from module prompt or local ID, e.g. `OT-BROWSER-LIVE-001` |
| `surface` | Route or area |
| `persona` | Guest, active, canceled, trial, or other |
| `viewport` | Desktop, mobile, or exact size |
| `journey` | User-outcome phrasing |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, state/copy observed, screenshot label, console/network note |

### ProductReviewFinding

| Field | Meaning |
| --- | --- |
| `id` | Stable ID, e.g. `OT-UX-001`, `CR-UX-001`, `AUTH-UX-001` |
| `severity` | `Critical`, `High`, `Medium`, or `Low` |
| `action` | `add`, `delete`, `merge`, `update`, or `keep` |
| `surface` | Route, panel, drawer, table, modal, gate, chart, handoff |
| `personaJob` | User/trader job being blocked or improved |
| `observedFriction` | What was visible in the browser |
| `traderConsequence` | Why it matters for speed, trust, decision quality, or conversion |
| `greenfieldTarget` | Cleaner product shape from Pass 0 |
| `recommendation` | PM-level recommendation, not implementation steps |
| `evidence` | URLs, visible copy, state descriptions, screenshot labels, console/network correlation |
| `acceptanceSignal` | What a future Browser review would see to call it resolved |

### ElementActionMatrix

| Field | Meaning |
| --- | --- |
| `elementControl` | UI element, control, copy block, chart, tab, table affordance, modal, or handoff |
| `currentRole` | What it appears to do today |
| `action` | `add`, `delete`, `merge`, `update`, or `keep` |
| `rationale` | Why this follows from the user job and invariant contract |
| `expectedImpact` | Expected improvement |
| `riskTradeoff` | What could get worse or needs product decision |

### TraderScorecard

Use concise ratings or notes for:

- `speedToInsight`
- `scanability`
- `decisionConfidence`
- `dataTrust`
- `controlErgonomics`
- `statePersistence`
- `crossRouteHandoff`
- `accessConversion` when auth/paywall is in scope

### Final Report Shape

1. Scope and environment.
2. Browser procedure summary: routes, personas, viewports, and whether Browser was hidden or visible.
3. BrowserJourneyCoverage table.
4. Ranked ProductReviewFinding table.
5. ElementActionMatrix.
6. TraderScorecard.
7. Evidence index: screenshot labels/descriptions, URLs, notable console/network observations.
8. Blockers and uncertainty.
9. Prompt/runbook maintenance suggestion.
10. Explicit statement: `Repository Playwright E2E scripts were not run`.

## Severity Guide

| Severity | Use when |
| --- | --- |
| `Critical` | Core route/action unusable, account/access flow broken, user is misled into wrong payment/access/data state, or critical trading context is dangerously wrong. |
| `High` | Major workflow blocked, visible data trust failure, broken handoff, unusable mobile path for a core flow, or high-friction access/conversion blocker. |
| `Medium` | Meaningful friction, confusing copy, weak empty/loading/error state, hard-to-use control, or scanability issue that slows decisions. |
| `Low` | Polish, minor copy, localized layout issue, or coverage gap that does not block the journey. |

## Troubleshooting

- If login hits CAPTCHA, MFA, or account protection, stop and ask the user to complete or approve the step. Do not bypass it.
- If active/canceled seeded accounts do not work, report the exact login step, URL, visible copy, and whether the OTP was accepted.
- If the local app is not running, start it with `PATH=/opt/homebrew/bin:$PATH pnpm dev` from the app repo and retry the route.
- If a route returns stale UI after implementation changes, reload the Browser page before re-verifying.
- If the in-app Browser cannot observe a CSV or file download artifact, record export button/gate coverage and mark artifact verification blocked by Browser capability; do not switch to repository Playwright scripts unless the user changes scope.
- If a TradingView widget is blank only on this Mac, verify local proxy/Shadowrocket routing for `www.tradingview-widget.com` before treating it as a product defect.
- If product-review docs reference missing paths, use the current checkout's `AGENTS.md`, glossary, and invariant docs, then record doc drift in the final maintenance suggestion.

## When To Switch Runbooks

- User asks to fix tests or certify Playwright coverage: switch to the matching `doc/automation/e2e-test/*-goal-driven-prompt.md` in the app repo.
- User asks for code implementation and PR after findings: use the app repo product-review full playbook workflow and then normal engineering workflow.
- User asks for production error correlation: use `ops/webappp-fullstack/error-investigate.md`.
- User asks for PostHog analytics, traffic, dashboards, or session replay research: use `ops/webappp-fullstack/posthog-research.md`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether Browser walkthrough, docs, auth, route, or product-contract behavior revealed a reusable lesson.
2. Promote durable lessons into Required Context, Module Map, Browser Plugin Procedure, Workflow, Troubleshooting, or output templates.
3. Keep transient state in Agent Handoff only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Browser plugin usage, available routes, test-account behavior, canonical product names, domain invariant paths, or output formats drift.
- A repeated Browser review blocker needs a standard recovery step.
- A verification gate was too weak, too broad, or missing.
- The source app docs consolidate or rename product-review/E2E prompts.

Do not update this runbook for:

- One-off UI findings.
- Raw screenshot lists.
- Temporary local data availability.
- Completed review progress.
- Speculative PM ideas not supported by an actual Browser walkthrough.
