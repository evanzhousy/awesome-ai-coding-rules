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
- Success criteria: Browser plugin is used for walkthroughs, required product/domain context is read, scoped journeys are exercised for the relevant personas and viewports, premium guards are checked across the required account states when access is in scope, explicitly authorized billing lifecycle tests prove the user-visible payment/add-card/change-card/cancel flows through Browser, any Stripe SDK fixture mutations are restored to the original seeded state, findings use the required output tables, and this runbook is maintained if reusable friction is discovered.
- Stop condition: scoped journeys are complete, a real browser/auth/data/local-env blocker is documented with evidence, or the user redirects scope.

Pasteable objective:

```text
Use ops/webappp-fullstack/browser-e2e-product-review.md as the runbook. Use @Browser / plugin://browser@openai-bundled to walk the requested TradingFlow webapp journeys in the browser. Do not run repository Playwright E2E scripts. Use existing E2E specs only as read-only journey maps. When auth, billing, paid controls, or premium data are in scope, test the premium guard with guest, active, canceled, trial_no_pm, and trial_with_pm accounts. Produce UI defect findings, ProductReviewFinding rows, ElementActionMatrix, AccessTierGuardMatrix, TraderScorecard, BrowserJourneyCoverage, evidence index, blockers, and runbook maintenance note.
```

## Agent Handoff

Last updated: 2026-06-18

Last maintenance was documentation-only. Reframed the Stripe test section around Browser-driven user payment lifecycle testing; SDK mutation is documented as setup/verification/cleanup support only, not the testing goal.

No open handoff items.

## Goal

Produce an evidence-backed Browser walkthrough report that answers:

1. Does the selected surface work end-to-end for realistic users?
2. What visible UI defects, broken states, layout issues, dead clicks, or confusing flows did the browser walkthrough expose?
3. What is unreasonable or weak from a product manager and option trader perspective?
4. Which UI elements should be added, deleted, merged, updated, or kept?
5. Do premium guards allow paid/trial users to use premium controls while preventing guest or unpaid users from receiving premium data, starting live streams, or mutating gated table state?

## Non-Negotiables

- Use the Browser plugin for product walkthroughs. In Codex, follow the `Browser:control-in-app-browser` skill and use the in-app browser surface.
- Do not substitute `pnpm exec playwright test`, `npx playwright test`, test generators, or repo automation scripts for the walkthrough.
- Do not edit tests, product code, route files, or docs unless the user explicitly expands scope beyond review.
- Do not commit `FINDINGS.md`, screenshots, browser exports, or review artifacts. Findings stay in the session output unless the user asks for a persistent artifact.
- Treat E2E specs as journey maps only: read titles, personas, setup, routes, and expected user outcomes; do not use selectors or spec line numbers as UX evidence.
- Domain truth wins over current code and current tests. If glossary or invariant docs conflict with the observed UI, report the mismatch.
- Do not transmit sensitive data, make purchases, save payment methods, submit destructive forms, change account permissions, or mutate Stripe/Neon billing state unless the user explicitly authorized that exact action for a test environment.

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
| Trial without payment method | `trialing+clerk_test@example.com` | Trial access granted, payment method still needed |
| Trial with payment method | `trialingwithpayment+clerk_test@example.com` | Trial access granted, payment method confirmed |

OTP defaults to `424242` unless the repo docs or user say otherwise.

Before using these credentials in a Browser review, re-open `tests/e2e/fixtures/auth.ts` in the app repo and confirm the scenario labels and email defaults have not drifted. Environment overrides such as `E2E_LOGIN_EMAIL_ACTIVE` can change the actual seeded account in a local checkout.

## Premium Guard Account Matrix

Use this section whenever the requested surface includes auth, billing, paid controls, premium data, live data, export/download, gated filters, drawers, or cross-route handoffs into premium surfaces. The goal is to prove the premium guard with real Browser interaction, not to assume it works because an account is signed in.

| Scenario | Required account state proof | Expected premium-control behavior |
| --- | --- | --- |
| Guest | Clean context, signed-out header or login prompt, no user avatar | Gated actions open `LoginModal` or redirect to sign in; premium table/filter/live/export state must not apply as if entitled |
| Active | `/app/billing` and app chrome show paid access for `active+clerk_test@example.com` | Premium controls work; filters/sorters/live/export/drawer content visibly update or open as intended |
| Canceled | `/app/billing` shows no active subscription for `canceled+clerk_test@example.com` | Premium controls open `PaywallModal` or upgrade CTA; gated table/result state does not mutate behind the paywall |
| Trial without payment method | `/app/billing` shows trial access plus payment-method-needed messaging | Premium controls work, but billing clearly asks for payment method; add-payment CTA may reach Stripe test flow but must not be completed unless explicitly authorized |
| Trial with payment method | `/app/billing` shows trial access with payment method confirmed or equivalent reassurance | Premium controls work; UI must not incorrectly ask for a payment method |

Minimum cross-account pass:

1. Start from a clean guest context and verify at least one premium action per scoped surface opens the correct guest gate.
2. Sign in as `active`, prove billing/access state, and exercise the same premium actions until the table, drawer, stream, or export affordance visibly behaves as entitled.
3. Sign out fully, then sign in as `canceled`; prove billing/access state changed to unpaid and repeat the same premium actions. The visible outcome must be paywall/upgrade, not premium data access and not a silent no-op.
4. If trial behavior is in scope, repeat with `trial_no_pm` and `trial_with_pm`; both should have premium access, but billing copy and CTAs must differ by payment-method status.
5. After every account switch, verify the displayed email or account identity plus `/app/billing` state before continuing. If the identity or billing state did not change, clear Clerk/browser session state and retry; do not count the run.

Safety rule: do not complete Stripe checkout, add a payment method, change a subscription, or mutate seeded account billing state during a normal product review. It is acceptable to verify that a button navigates to Stripe test checkout or customer portal, then stop and record the destination evidence. If the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, or billing-status transitions in a test environment, use `Authorized Browser Billing Lifecycle Test` below.

## Authorized Browser Billing Lifecycle Test

Use this section only when the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, or billing-status transitions in a test environment. The testing goal is the user-visible Browser journey. Stripe SDK/API mutation is only fixture setup, canonical verification, or cleanup support; an SDK-only state change does not prove that the product flow works.

Browser-first rule:

- To mark `user can make payment`, `user can add payment method`, `user can change payment method`, or `user can cancel payment/subscription` as passed, the agent must perform the corresponding app/Stripe-hosted UI action in Browser and verify the visible result after returning to the app.
- SDK/API state mutation may create a precondition that would be slow or impossible to reach safely through UI, verify the canonical Stripe/Neon state, force a terminal state that the UI cannot produce directly, or restore the seeded account.
- Do not report a user payment capability as passed when the only evidence is a Stripe SDK update.

Required safety gates before any payment lifecycle test:

1. Confirm the target app repo is `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack`.
2. Read `.env.local` or the active runtime config locally and require the Stripe secret key used for verification or cleanup to start with `sk_test_`. Abort on missing key, `sk_live_`, or unknown key source.
3. Treat Stripe connector/plugin results as unsafe for mutation until proven test-mode. If any fetched Stripe object has `livemode: true`, do not mutate through that connector. Use only the local test key or stop.
4. Use only Stripe test cards or test tokens on Stripe-hosted pages. Never enter a real card, real address beyond harmless test values, or personal payment data.
5. Verify the target Clerk/Neon user and current Stripe customer before the run. For the seeded trial-no-payment account, expected baseline is:
   - Email: `trialing+clerk_test@example.com`
   - Original Stripe customer: `cus_UCYiFPXSi5JJgb`
   - Original subscription: `sub_1TE9bNDVsC6tSD27iGuCP46M`
   - Expected baseline state: `trialing`, `cancel_at_period_end=false`, no `default_payment_method`, no attached card payment methods.
6. Prefer disposable test customers/subscriptions for destructive or hard-to-restore states. If the seeded user's Neon `stripe_customer_id` is repointed to a disposable customer, restore it before final response.
7. Print only safe object IDs and statuses. Do not print API keys, raw env files, Clerk secrets, full card details, or full payment method payloads.

Browser lifecycle pattern:

1. Prove the starting state in Browser:
   - `/app/billing` shows the expected account state and CTA, such as `Add Payment Method`, `View Plans`, `Manage Subscription`, or `Manage Payment Methods`.
   - The header/account identity matches the intended Clerk user.
2. Test payment or add-payment-method through UI:
   - Click the app CTA in Browser (`Add Payment Method`, `View Plans`, paywall CTA, or equivalent).
   - Verify navigation to Stripe Checkout or Customer Portal test flow.
   - Complete the Stripe-hosted test flow only after the user has explicitly authorized this payment lifecycle test and test mode is verified.
   - Return to the app and verify billing refreshes to the expected state, such as active/trial-with-payment-method copy, subscription management controls, or premium access.
3. Test changing payment method through UI:
   - Start from a state that has a payment method.
   - Open `Manage Payment Methods` or the customer portal from `/app/billing`.
   - Add, replace, or set a default test payment method using the Stripe-hosted UI.
   - Return to the app and verify visible billing copy, portal success state, and canonical Stripe state if the app does not display card metadata.
4. Test canceling through UI:
   - Open `Manage Subscription` or the customer portal from `/app/billing`.
   - Use the Stripe-hosted cancellation flow a real user would use.
   - Return to the app and verify `cancel_at_period_end` / scheduled-cancel copy when the portal schedules cancellation.
   - Verify premium access behavior still matches the scheduled-cancel contract.
5. Test terminal canceled status when required:
   - If the product must handle immediate `canceled` but the user-facing portal only creates scheduled cancellation, use Stripe SDK/API only to move the disposable test subscription to the terminal canceled state after the Browser cancel flow has already been tested.
   - Browser-verify `/app/billing` canceled copy, hidden/gated paid management controls, and premium guard behavior on the scoped app route.
6. Restore the seeded user:
   - Update Neon `users.stripe_customer_id` back to the original customer id if it was changed.
   - Ensure the original subscription is still `trialing` and not set to cancel.
   - Ensure the original customer has no default payment method and no attached card payment methods when restoring `trialing+clerk_test@example.com`.
   - Detach payment methods from disposable customers when possible.
   - Delete disposable customers when possible.
7. Browser-verify restored state:
   - `/app/billing` shows the original trial/no-payment-method banner and management state.
   - `/app/option-trades/live` or the scoped premium surface regains entitled access.
   - If Live streaming is in scope, click `Start`, wait for `Connected` / `Pause`, and verify populated rows.

SDK/API support examples:

- Create a disposable Stripe test customer/subscription only to isolate the seeded user from destructive tests.
- Use metadata such as `codex_billing_state_test=active_cancel_restore`, `restore_customer_id=<original customer id>`, and `neon_user_id=<Neon user id>` on disposable objects.
- Verify canonical state after Browser actions when app UI does not expose enough detail.
- Force terminal canceled state only after the Browser cancellation flow has already been tested and only on a disposable test subscription.
- Restore Neon and Stripe test fixtures before final response.

Minimum evidence to report:

| Evidence | Required proof |
| --- | --- |
| Test-mode guard | State that all payment lifecycle actions used Stripe test mode; do not reveal the key |
| Original baseline | User id, email, original customer id, original subscription id, original status, payment-method absence |
| Browser payment/add-card flow | App CTA clicked, Stripe-hosted test flow reached/completed, return URL or app billing success state, premium access result |
| Browser change-card flow | Portal/payment-method UI action performed, returned app state, canonical default/payment-method proof when app UI lacks card metadata |
| Browser cancel flow | Portal subscription-cancel action performed, returned app scheduled-cancel or canceled copy, premium access result |
| SDK-supported terminal state | If used, explain the UI limitation, disposable subscription id, status transition, and Browser proof after mutation |
| Restore state | Neon pointer restored to original customer id, original subscription status, no attached payment methods |
| Live data | Connected/Pause state plus non-empty sampled rows when streaming is in scope |

Failure recovery:

- If any SDK/API step fails after the Neon pointer changes, restore the pointer to the original customer id before investigating further.
- If the Browser payment or portal flow cannot be completed, report the visible blocker and do not replace that missing Browser evidence with SDK mutation.
- If a disposable customer cannot be deleted, detach its test payment methods, leave the original user restored, and report the disposable customer id for cleanup.
- If Browser still shows stale billing after Stripe/Neon changes, wait for billing refetch, reload `/app/billing`, and verify the canonical state from Stripe/Neon before filing a UI bug.
- If Stripe's API shape lacks top-level `current_period_end`, inspect subscription item `current_period_end` and `cancel_at`; do not assume `N/A` is acceptable billing copy.

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
- Premium-guard scope: list the gated controls or data surfaces to compare across account states. If any paid control is in scope, include guest, active, and canceled at minimum; include both trial states when the user asks about Stripe/subscription status or trial UX.
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
5. For each account state, record the billing/access proof before recording premium-control results. A premium-control result without account-state proof is not valid evidence.
6. Switch to mobile viewport for any surface with sheets, drawers, tabs, dense tables, or modal controls. Check for overlap, clipped text, scroll traps, unusable tap targets, and lost state.

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

### 3B. Premium Guard Verification

When a route exposes any paid or high-value action, build an `AccessTierGuardMatrix` before the final report. Cover every user-facing gated control in the scoped surface, not just one representative CTA.

Required gated-control inventory:

- Route access and deep links.
- Premium filters, date/session controls, saved filters, Watchlist-only scopes, live stream/start controls, refresh controls, export/download, column sets, drawers, detail tabs, cross-route handoff buttons, and table row actions.
- Billing, account, subscription banners, plan CTAs, manage-subscription CTAs, add-payment CTAs, paywall/login modals, and gate copy.

For each gated control:

1. Capture the baseline visible state before the click: route, persona, account email or signed-out state, billing/access proof, active chips/sort, visible row count, first sampled rows, and modal/drawer state.
2. Click or type in Browser as the current persona.
3. Verify the settled result:
   - Active and trial accounts: the control should perform the paid action, and table-affecting actions must visibly change rows, chips, sort indicators, route state, drawer content, stream status, or export affordance as appropriate.
   - Canceled accounts: the control should show paywall or upgrade copy, and the underlying premium result must not silently apply. Confirm table rows, active filters, live status, drawer content, and export state did not change as if entitled.
   - Guest accounts: the control should show login or redirect to sign-in, and the underlying premium result must not silently apply.
4. Compare the same control across at least guest, active, and canceled. If trial states are in scope, compare both trial states against active for access and against each other for billing/payment-method copy.
5. If a gate opens Stripe test checkout or the customer portal, record only the safe navigation evidence and return to the app. Do not complete checkout, add payment methods, or change subscriptions.

Do not mark premium-guard coverage complete when:

- Only the active account was tested.
- The run did not prove the account state after switching users.
- A modal appeared but the underlying table/result state was not checked for accidental mutation.
- A control has no visible verification signal and no UX/testability finding explains that gap.

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

### AccessTierGuardMatrix

Required when premium guard, auth, billing, subscription, trial state, or any gated data/action is in scope.

| Field | Meaning |
| --- | --- |
| `control` | User-facing gated route/control/action, e.g. Live Start, export, premium filter, drawer tab, billing CTA |
| `route` | Route and panel/modal/drawer where it was exercised |
| `accountScenario` | `guest`, `active`, `canceled`, `trial_no_pm`, `trial_with_pm`, or user-specified |
| `accountStateProof` | Visible email/session plus billing/access state observed before the action |
| `beforeState` | Relevant route, chips, sort, row count, first sampled rows, modal/drawer state, live status, or CTA state before interaction |
| `actionTaken` | Browser action performed |
| `afterState` | Settled visible result after the action |
| `expectedGuard` | What `platform.md` and module invariants require for that account state |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, screenshot label, console/network note, or safe Stripe destination note |

### BillingLifecycleMatrix

Required when the user explicitly asks to test payment, add-payment-method, change-payment-method, cancellation, or billing lifecycle behavior. SDK/API evidence can support this matrix, but each user capability must have Browser evidence or be marked `blocked`/`fail`.

| Field | Meaning |
| --- | --- |
| `capability` | `make_payment`, `add_payment_method`, `change_payment_method`, `schedule_cancel`, `terminal_canceled`, `restore_seeded_state`, or user-specified |
| `startingState` | Account email, visible billing state, Stripe/Neon baseline when used |
| `browserAction` | The app and Stripe-hosted UI actions actually performed in Browser |
| `browserResult` | Visible settled state after returning to the app |
| `sdkSupportUsed` | `none`, `precondition`, `canonical_verify`, `terminal_state`, or `cleanup_restore`; include safe object IDs only |
| `expectedBehavior` | What the billing/access contract requires |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, safe Stripe destination note, safe object IDs/statuses, or console/network note |

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
4. AccessTierGuardMatrix when premium guard/auth/billing is in scope.
5. BillingLifecycleMatrix when payment/add-card/change-card/cancel behavior is in scope.
6. Ranked ProductReviewFinding table.
7. ElementActionMatrix.
8. TraderScorecard.
9. Evidence index: screenshot labels/descriptions, URLs, notable console/network observations.
10. Blockers and uncertainty.
11. Prompt/runbook maintenance suggestion.
12. Explicit statement: `Repository Playwright E2E scripts were not run`.

## Severity Guide

| Severity | Use when |
| --- | --- |
| `Critical` | Core route/action unusable, account/access flow broken, user is misled into wrong payment/access/data state, or critical trading context is dangerously wrong. |
| `High` | Major workflow blocked, visible data trust failure, broken handoff, unusable mobile path for a core flow, or high-friction access/conversion blocker. |
| `Medium` | Meaningful friction, confusing copy, weak empty/loading/error state, hard-to-use control, or scanability issue that slows decisions. |
| `Low` | Polish, minor copy, localized layout issue, or coverage gap that does not block the journey. |

## Troubleshooting

- If login hits CAPTCHA, MFA, or account protection, stop and ask the user to complete or approve the step. Do not bypass it.
- If active/canceled/trial seeded accounts do not work, report the exact login step, URL, visible copy, and whether the OTP was accepted.
- If account switching leaves the previous avatar/email, billing banner, or entitlement state visible, sign out, clear the Browser context or Clerk cookies, and retry once. If it still persists, stop counting premium-guard coverage and file a blocker with evidence.
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
