---
name: browser-e2e-product-review
description: Browser-driven TradingFlow webapp product E2E walkthrough runbook. Uses the Browser plugin to manually exercise real user journeys, find UI defects, and produce PM/trader UX findings without running repository Playwright scripts.
disable-model-invocation: true
---

# Browser E2E Product Review (Webapp Fullstack)

Use this runbook when the user asks an AI agent to use `@Browser` / `plugin://browser@openai-bundled` to walk the TradingFlow webapp like a real user, find UI errors, and judge product UX from a product manager and option trader perspective.

This runbook is intentionally **browser-first**. Do not run the repository Playwright E2E suite as the review mechanism. Use existing E2E specs and automation docs as read-only journey maps, then execute the journeys interactively with the Browser plugin.

## Recommended Invocation

Use `/goal` for a full review or user-authorized review/fix loop. The loop is not "test everything once"; it is an explicit review/fix/drift-check cycle:

- Objective: run a Browser-driven product E2E walkthrough for the requested TradingFlow webapp surface, finding UI defects and PM/trader UX issues without executing repository E2E scripts. When the user explicitly asks to fix findings, continue in iterative rounds: design the next test use cases, test them in Browser, fix confirmed findings, verify the fix, and check that the implementation still satisfies the relevant domain invariants before choosing the next round.
- Success criteria: Browser plugin is used for walkthroughs, required product/domain context is read, scoped journeys are exercised for the relevant personas and viewports, each round records its use-case design before testing, confirmed findings are fixed only when implementation scope is authorized, every code fix gets a pre-edit `InvariantImpactMatrix`, focused automated verification, Browser re-check when feasible, and a post-fix `InvariantDriftCheck` proving it did not weaken documented access, persistence, live-stream, data-integrity, billing, or Watchlist contracts. Registration is tested with a real disposable email plus OTP when auth/signup is in scope, premium guards are checked across the required account states when access is in scope, Option Trades saved filters are checked with create/rename/use/persistence/delete coverage when Option Trades filters are in scope, explicitly authorized payment-capability tests prove through Browser that a user can start from the app, make a test payment, add a payment method, change payment method or billing/payment status through the user-facing flow, cancel or schedule cancellation where the UI permits it, return to the app, and see the correct billing/access result. The report must frame these as user capabilities, not as "Stripe status mutation" tests. No payment capability or payment-status change is marked passed from SDK-only mutation. Any Stripe SDK fixture mutations are restored to the original seeded state, findings use the required output tables, and this runbook is maintained if reusable friction is discovered.
- Stop condition: scoped journeys are complete, a real browser/auth/data/local-env blocker is documented with evidence, or the user redirects scope.

Recommended Codex command:

```text
/goal Use ops/webappp-fullstack/browser-e2e-product-review.md as the executable runbook. Run Browser-driven rounds. For each round: design the use cases first, execute them in @Browser, classify findings against domain invariants, fix only user-authorized true defects, verify the fix, run an invariant-drift check from the final diff, then choose the next round.
```

Codex `/goal` execution contract:

One `/goal` round is the unit of progress. A round is not complete when Browser testing finds an issue; it is complete only after the finding is classified, any authorized fix is verified, and any implementation diff has been checked against the domain invariants. If the user says `fix the findings`, keep working in the same round instead of starting a new engineering task or a new test area. If the user says `continue`, resume the first missing phase in the current `RoundExecutionLog` row.

1. Treat a round as incomplete until it has use-case design, Browser execution evidence, finding classification, invariant-impact status, authorized-fix status, fix verification, invariant-drift status, and a next-round decision.
2. After a code fix, do not start the next round until the changed files/functions are mapped back to the relevant domain-invariant or functionality docs and the original Browser finding is rechecked or explicitly blocked.
3. If a finding is actually expected by the current domain contract, record it as expected behavior. If fixing it would change the product contract, stop for a product/domain decision instead of patching code silently.
4. End the `/goal` only when the scoped matrices and invariant gates are complete, the user redirects or stops the run, or a concrete blocker prevents further Browser or implementation progress.
5. Keep the `/goal` state in the current response or handoff as `RoundExecutionLog` rows. Do not turn this runbook into a transcript of completed rounds.
6. If the user asks only for `what to test next`, output the next `UseCaseDesign` and wait or proceed according to the user's instruction. If the user says `continue`, execute the current round's next missing phase.

Goal-mode resume rules:

- At the start of a new `/goal` turn or after `continue`, read the latest `RoundExecutionLog` and resume the first missing phase of the current round. Do not restart from the top unless the user asks for a greenfield restart.
- If the user says `fix the findings`, first run the pre-fix domain gate and `InvariantImpactMatrix` for each finding. Fix only `true_defect` findings or explicitly approved product decisions.
- If the user says `what to test next`, choose the next round from uncovered high-risk controls and state its use-case design before opening the Browser.
- If the user says to end testing, wrap the current round, list incomplete matrices and blockers, and avoid marking untested scope as passed.
- If the latest turn ended after classification but before invariant-impact mapping, resume with `InvariantImpactMatrix` before editing. If it ended after a fix but before Browser re-check or invariant drift check, resume verification first. Do not design new use cases until the previous fix is proven or explicitly blocked.

Codex `/goal` operator checklist:

1. Start or resume exactly one active `RoundExecutionLog` row.
2. Write `UseCaseDesign` before Browser action:
   - route and persona;
   - controls, filters, drawers, sorters, inputs, account states, or billing actions to exercise;
   - expected contract from domain docs;
   - visible evidence that will prove pass/fail;
   - cleanup plan for any stateful test data.
3. Execute the use cases in `@Browser`; for each action, verify the settled UI/result state, not just that the click happened.
4. Classify every finding with `FindingGate` before implementation.
5. If fixes are authorized, write `FixBoundary` and `InvariantImpactMatrix` before editing files.
6. Implement the smallest domain-backed change, then run focused tests and Browser re-check the original symptom when feasible.
7. Run `InvariantDriftCheck` from the final diff before selecting the next round.
8. Only then set `nextRoundDecision`.

Minimum per-round `/goal` packet:

```text
RoundState:
- roundId:
- roundState:
- missingPhase:

UseCaseDesign:
- route/persona/account/viewport:
- controls/inputs/sorters/drawers/actions:
- expected domain contract:
- pass/fail evidence to collect:
- cleanup plan:

BrowserExecution:
- actions performed:
- settled visible result:
- result/table/state match:

FindingGate:
- findingId:
- classification:
- domain basis:

FixBoundary:
- required only when fixes are authorized:
- smallest intended change:
- forbidden drift:

InvariantImpactMatrix:
- required before editing:
- invariant docs/IDs:
- adjacent surfaces:
- verification plan:

FixVerification:
- focused tests:
- Browser re-check:

InvariantDriftCheck:
- final diff reviewed:
- invariant docs re-read:
- access/persistence/data-source/cross-surface/test-contract drift checked:
- status:

NextRoundDecision:
- continue/stop/blocked/needs-product-decision:
```

Hard gates:

- No file edits before `FindingGate`, `FixBoundary`, and `InvariantImpactMatrix` exist for the finding being fixed.
- No next test round after a code fix until `fixVerification` and `InvariantDriftCheck` are recorded.
- No `/goal` completion while any scoped round is still `ready-for-browser`, `finding-classified`, `ready-for-invariant-impact`, `fix-needed`, `fix-in-progress`, `ready-for-browser-recheck`, or `ready-for-invariant-drift-check`.
- No domain-doc update to justify a fix unless the user explicitly approved the product-contract change.
- No claim that a control passed until Browser evidence proves the action changed the intended result or left state unchanged for a gated user.

Goal start packet for Codex:

1. Create or continue the `/goal` objective with the pasteable objective below.
2. Read Required Context before the first Browser action for each surface.
3. Start the first `RoundExecutionLog` row in `ready-for-browser` state, including the use-case design and expected invariant evidence.
4. After every user `continue`, update the same row until it reaches `round-complete`, `blocked`, or `needs-product-decision`.
5. If product code changes, finish the current round with `InvariantImpactMatrix`, focused tests, Browser re-check, and `InvariantDriftCheck` before selecting the next test area.

Per-turn `/goal` response packet:

- `RoundState`: current round id and state, plus the missing phase that this turn will execute next.
- `NextUseCases`: the concrete controls, inputs, filters, sorters, drawers, account states, and result evidence selected for the next round.
- `BrowserResult`: what was clicked or typed in Browser, what visibly changed, and whether table/results/state matched the action.
- `FindingGate`: classification for every issue before implementation: `true_defect`, `expected_by_domain_invariant`, `product_decision_needed`, `testability_gap`, or `environment/tooling_blocker`.
- `InvariantImpactMatrix`: before any fix, identify the invariant docs/IDs, adjacent surfaces, forbidden drift, focused tests, and Browser re-check required for the changed behavior.
- `FixBoundary`: only when the user has authorized fixes; state the smallest change, affected files, relevant invariants, forbidden drift, tests, and Browser re-check.
- `InvariantDriftCheck`: after every code fix, compare the final diff against the relevant `domain-invariants.md` / `functionality.md` files before starting another round.
- `NextRoundDecision`: continue to the next highest-risk uncovered surface, resume blocked verification, stop because scope is complete, or stop because the user redirected.

Pasteable objective:

```text
Use ops/webappp-fullstack/browser-e2e-product-review.md as the runbook. Use @Browser / plugin://browser@openai-bundled to walk the requested TradingFlow webapp journeys in the browser. Do not run repository Playwright E2E scripts as the review mechanism. Use existing E2E specs only as read-only journey maps. Run iterative rounds. For each round: design the concrete use cases from domain docs, prior findings, and trader/PM risk; test those use cases in Browser; classify findings against the documented domain contract; when the user has authorized implementation, complete an InvariantImpactMatrix before editing, fix confirmed findings, verify the fix, run an invariant-drift check against the relevant domain-invariants.md/functionality.md files, then select the next round. Never start the next round after a code fix until the fix verification and invariant-drift check are recorded. When auth or registration is in scope, test a real create-account flow with a unique disposable email alias, retrieve the OTP through an approved Gmail path, and verify the new signed-in account state. When auth, billing, paid controls, or premium data are in scope, test the premium guard with guest, active, canceled, trial_no_pm, and trial_with_pm accounts. When Option Trades filter behavior is in scope, include the saved-filter lifecycle: create from an edited draft, rename, duplicate or set-default when available, use/apply, reload and account-switch persistence, cross Live/Historical sharing, delete cleanup, and gated behavior for guest/canceled accounts. When payment, add-card, change-card, cancellation, or billing-access behavior is explicitly in scope, run a Browser payment-capability review: prove whether the user can perform the app -> Stripe-hosted UI -> app-return journey and see the correct billing/access result. Do not scope or summarize the review as testing Stripe mutation. Use Stripe SDK/API mutation only to create preconditions, verify canonical state, force terminal states that the UI cannot directly create, or restore fixtures. Produce UI defect findings, ProductReviewFinding rows, RoundExecutionLog rows, ElementActionMatrix, RegistrationFlowMatrix when applicable, AccessTierGuardMatrix, SavedFilterLifecycleMatrix when applicable, BillingLifecycleMatrix when applicable, InvariantImpactMatrix rows before every fix, InvariantDriftCheck rows after every fix, TraderScorecard, BrowserJourneyCoverage, evidence index, blockers, and runbook maintenance note.
```

## Agent Handoff

Last updated: 2026-07-07

No open handoff items after this maintenance-only update. No Browser product review was executed in this pass. The durable `/goal` round loop now treats each round as `UseCaseDesign -> BrowserExecution -> FindingClassification -> InvariantImpactMatrix -> AuthorizedFix -> FixVerification -> InvariantDriftCheck -> NextRoundDecision`, with an explicit copy-paste `/goal` command, a fill-in per-round `/goal` packet, resumable round states, a goal-lifecycle rule for when to keep or close the active goal, and hard gates that forbid file edits before invariant impact is written or new test rounds before fix verification and drift check are recorded. The saved-filter, Watchlist, registration, premium-guard, and billing-capability rules remain encoded in the procedure below. Do not store completed round transcripts here; keep only unresolved next-run blockers with current evidence and the next action.

## Goal

Produce an evidence-backed Browser walkthrough report that answers:

1. Does the selected surface work end-to-end for realistic users?
2. What visible UI defects, broken states, layout issues, dead clicks, or confusing flows did the browser walkthrough expose?
3. What is unreasonable or weak from a product manager and option trader perspective?
4. Which UI elements should be added, deleted, merged, updated, or kept?
5. Do premium guards allow paid/trial users to use premium controls while preventing guest or unpaid users from receiving premium data, starting live streams, or mutating gated table state?
6. When billing lifecycle behavior is in scope, can the user complete the Browser-visible test-mode payment, add-payment-method, change-payment-method, payment-status, and cancellation journeys from the app through Stripe-hosted UI and back to the app with the correct billing/access result?
7. When auth or registration is in scope, can a new user create an account with email verification and land in the expected signed-in access state?

## Non-Negotiables

- Use the Browser plugin for product walkthroughs. In Codex, follow the `Browser:control-in-app-browser` skill and use the in-app browser surface.
- Do not substitute `pnpm exec playwright test`, `npx playwright test`, test generators, or repo automation scripts for the walkthrough.
- Do not edit tests, product code, route files, or docs unless the user explicitly expands scope beyond review.
- Do not commit `FINDINGS.md`, screenshots, browser exports, or review artifacts. Findings stay in the session output unless the user asks for a persistent artifact.
- Treat E2E specs as journey maps only: read titles, personas, setup, routes, and expected user outcomes; do not use selectors or spec line numbers as UX evidence.
- Domain truth wins over current code and current tests. If glossary or invariant docs conflict with the observed UI, report the mismatch.
- Do not transmit sensitive data, make purchases, save payment methods, submit destructive forms, change account permissions, or mutate Stripe/Neon billing state unless the user explicitly authorized that exact action for a test environment.
- When the user explicitly authorizes billing lifecycle testing, judge pass/fail from the Browser-visible user action and app result. Stripe SDK/API mutation is support evidence only; it cannot prove that a user can pay, add or change payment method, change payment status, or cancel.
- Do not bypass CAPTCHA, MFA, or account-protection challenges during registration. If a visible CAPTCHA challenge appears, ask the user to complete or explicitly approve the step. Automated E2E may use Clerk's test-token helper, but this Browser product review should treat CAPTCHA as a blocker unless the user intervenes.

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
2. Glossary when present. The current checkout may not have `doc/knowledge/glossary.md`; do not block the run on that missing file.
3. Relevant domain docs in the current checkout:
   - Shared auth, billing, access, Watchlist, and app shell context: `doc/domain-knowledge/shared/domain-invariants.md` and `doc/domain-knowledge/shared/functionality.md`
   - Option Trades: `doc/domain-knowledge/option-trades/domain-invariants.md` and `doc/domain-knowledge/option-trades/functionality.md`
   - Rank workbench, Contract-level analysis, Symbol-level analysis: `doc/domain-knowledge/rank/domain-invariants.md` and `doc/domain-knowledge/rank/functionality.md`
   - Cookbooks when in scope: `doc/domain-knowledge/cookbooks/domain-invariants.md` and `doc/domain-knowledge/cookbooks/functionality.md`; if AI chat, recipe creation, or recipe editing is explicitly in scope, also read `doc/automation/ai-chat-e2e/SKILL.md` as a journey map.
4. Shared product review contract when present: `doc/automation/product-review/README.md`
5. Shared E2E policy when present: `doc/automation/e2e-test/e2e-update-skills.md`
6. The module-specific product-review prompt when present:
   - Auth: `doc/automation/product-review/auth-goal-driven-prompt.md`
   - Option Trades: `doc/automation/product-review/option-trades-goal-driven-prompt.md`
   - Contract-level analysis: `doc/automation/product-review/contract-rank-goal-driven-prompt.md`
7. The module-specific E2E prompt and spec as read-only journey maps.

Path drift note: older product-review prompts may still mention `doc/knowledge/glossary.md`, `platform.md`, `option-trades.md`, `rank.md`, `contract-rank.md`, or standalone `/app/contract-rank`. Some checkouts may also lack the older `doc/automation/product-review/*` and `doc/automation/e2e-test/*` prompt files. Prefer the current checkout's `doc/domain-knowledge/{shared,option-trades,rank}/...` files as source of truth, use existing `tests/e2e` specs only as journey maps when prompt docs are absent, and record prompt drift in `Prompt maintenance suggestion`.

## Module Map

| Surface | Primary routes | Domain truth | Read-only journey maps |
| --- | --- | --- | --- |
| Auth, Billing, Access Gates | `/`, `/app`, `/app/billing`, `/app/account`, `/app/settings/profile`, gated app routes | `shared/domain-invariants.md`, `shared/functionality.md` | `doc/automation/product-review/auth-goal-driven-prompt.md`, `doc/automation/e2e-test/auth-goal-driven-prompt.md`, `tests/e2e/specs/auth/` |
| Option Trades | `/app/option-trades`, `/app/option-trades/live`, `/app/option-trades/historical` | `option-trades/domain-invariants.md`, `option-trades/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/product-review/option-trades-goal-driven-prompt.md`, `doc/automation/e2e-test/option-trades-goal-driven-prompt.md`, `tests/e2e/specs/option-trades/option-trades.spec.ts`, `watchlist.spec.ts` |
| Contract-level analysis | `/app/rank/contracts`, legacy `/app/contract-rank` | `rank/domain-invariants.md`, `rank/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/product-review/contract-rank-goal-driven-prompt.md`, `doc/automation/e2e-test/contract-rank-goal-driven-prompt.md`, `tests/e2e/specs/contract-rank/contract-rank.spec.ts` |
| Symbol-level analysis | `/app/rank/symbols`, legacy `/app/symbol-level` or `/app/market-rank` if supported | `rank/domain-invariants.md`, `rank/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/e2e-test/market-rank-goal-driven-prompt.md`, `tests/e2e/specs/market-rank/market-rank.spec.ts`; if product-review prompt is missing, use `product-review/README.md` + rank domain docs |
| Cookbooks | `/app/cookbooks`, `/app/cookbooks/$templateId`, pinned-session `slug~YYYY-MM-DD` reports, AI/edit workspaces only when explicitly in scope | `doc/domain-knowledge/cookbooks/domain-invariants.md`, `doc/domain-knowledge/cookbooks/functionality.md`; AI flows: `doc/automation/ai-chat-e2e/SKILL.md` | use the gallery/report UI as the journey map; do not submit AI prompts, fork recipes, delete drafts, or save recipes unless explicitly authorized |

## Cookbooks Browser Review Rules

- Treat Cookbooks as live-run recipes, not frozen snapshots. Opening an official template resolves the recipe for the latest completed session; pinned-session URLs such as `slug~YYYY-MM-DD` rerun the same recipe for that date.
- Verify the gallery in two groups: `Official templates` open read-only live reports; `My recipes` rows and `/edit` links are user-owned draft/edit surfaces and can mutate state.
- For read-only report coverage, verify official template `Open`, report rendering, `Run`, date picker or pinned-session URL, TOC anchors, Back navigation, localized report copy, and the canonical disclaimer.
- Do not click `New recipe`, private draft delete confirmations, `/edit` workspace links, `Edit with AI`, or `Save` unless the user explicitly authorizes recipe-draft mutation for this run.
- Do not click `AI Insight`, starter prompts, or submit global/sidebar AI prompts unless the user explicitly authorizes AI-costing behavior. It is safe to open and close the global assistant without submitting, but record that no prompt was submitted.
- If Browser cannot expose Network entries, use visible UI plus current domain docs as evidence for live-run behavior. Do not assert "no live query / no LLM call" for Cookbooks; the current product intentionally runs recipe data live and generates AI insight only on explicit demand.

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

Seeded test-account OTP defaults to `424242` unless the repo docs or user say otherwise. Fresh disposable registration must use the code actually delivered to Gmail.

Before using these credentials in a Browser review, re-open `tests/e2e/fixtures/auth.ts` in the app repo and confirm the scenario labels and email defaults have not drifted. Environment overrides such as `E2E_LOGIN_EMAIL_ACTIVE` can change the actual seeded account in a local checkout.

## Browser Registration Test

Use this section whenever auth, signup, onboarding, or guest-to-user conversion is in scope. The app-under-test interactions must happen in `@Browser`; Gmail or Chrome is only support for retrieving the verification code.

Disposable email pattern:

- Preferred manual Browser-review address family: `evanzhousyforward+<date-or-run-id>@gmail.com`, for example `evanzhousyforward+0619codex1552@gmail.com`.
- The verification email should arrive in the base Gmail mailbox `evanzhousyforward@gmail.com`.
- Use a unique plus-address per run. If a run is retried after code expiry or account creation, generate a new suffix instead of reusing the same alias.

OTP retrieval order:

1. Prefer the Gmail connector when it is already available or the user approves installing it.
2. If the Gmail connector is unavailable and the user has approved `@Chrome`, use `plugin://chrome@openai-bundled` to open Gmail and read the latest verification email for the alias.
3. If neither path is available, stop at the verification-code screen and ask the user for the OTP. Do not guess or bypass the code.
4. Do not include the OTP value in the final report unless the user explicitly asks. Record only that the OTP was retrieved from the approved mailbox path.

Manual Browser procedure:

1. Start from a signed-out state:
   - Verify the header shows `Sign in` or equivalent signed-out copy.
   - If a previous avatar/email is visible, sign out and clear Clerk/browser session state before continuing.
2. Open the app route under review, normally `/app/option-trades/live` or the auth entrypoint requested by the user.
3. Open `LoginModal` from the visible app CTA or gate.
4. Switch to `Create account` / registration mode.
5. Enter the unique disposable email alias and submit.
6. CAPTCHA handling:
   - If the Clerk CAPTCHA container is present but no visible challenge blocks the flow, continue.
   - If a visible CAPTCHA, MFA, or account-protection challenge appears, stop and ask the user to complete or approve the step. Do not use automated CAPTCHA bypasses in this Browser review.
7. Verify the modal advances to the code-entry state and clearly shows the target email alias.
8. Retrieve the OTP from Gmail using the approved support path.
9. Enter the OTP in Browser and submit.
10. Verify post-registration state:
    - Login modal closes.
    - Header shows user avatar or signed-in account control.
    - User/account menu shows the exact disposable email.
    - `/app/billing` or the current app surface shows the expected new-user access state, such as trial banner, add-payment CTA, or default free/trial guard.
    - The route under review recovers without losing the intended return path.
11. If registration is part of premium-guard review, continue with the same account only after recording it as a new-user/trial scenario. Do not assume it replaces the seeded `active`, `canceled`, `trial_no_pm`, or `trial_with_pm` accounts unless the billing state proof matches one of those scenarios.

Automated E2E note:

- Repository E2E registration may use Clerk's testing token helper and `#clerk-captcha` fixture support.
- That helper is not proof for this Browser product review. Browser review requires a real visible create-account flow unless the user explicitly changes scope to automated E2E certification.

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

Safety rule: do not complete Stripe checkout, add a payment method, change a subscription, or mutate seeded account billing state during a normal product review. In a normal review, verifying that a button reaches Stripe Checkout or the customer portal proves CTA wiring only; it does not prove that the user can pay, add or change payment method, change payment status, or cancel. If the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, payment-status change, or billing-access behavior in a test environment, use `Authorized Browser Payment Capability Test` below.

## Authorized Browser Payment Capability Test

Use this section only when the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, payment-status change, or billing-access behavior in a test environment. The testing goal is the user-visible Browser journey: the user starts from the app, completes the Stripe-hosted step a real user would take, returns to the app, and sees the correct billing/access result. Do not call this a Stripe mutation test; Stripe mutation is only fixture support.

Intent boundary:

- Name the objective and findings in user-capability language: `user can make payment`, `user can add payment method`, `user can change payment/billing status`, `user can cancel`, or `user cannot ... because ...`.
- The product test asks whether the user can make payment, add a payment method, change payment method, change payment status through a user-facing billing flow, cancel or schedule cancellation, and still see correct access status in the app.
- This is not a Stripe state-mutation test. A Stripe SDK/API state change can help set up, verify, force a terminal state, or clean up a scenario, but it is not the evidence that the user flow works.
- If the app or Stripe-hosted UI blocks a Browser step, report that capability as `blocked` or `fail`; do not replace the missing Browser step with an SDK/API mutation and call it passed.
- If terminal `canceled` cannot be produced through the user-facing portal, first test the Browser cancellation path that the user can actually perform, then use SDK/API only to force a disposable subscription into terminal `canceled` for app-state verification.
- Treat `payment-status change` as a Browser-initiated user transition, such as trial/no-payment-method to trial-with-payment-method or active, active to scheduled cancellation, or active to terminal canceled when the portal exposes immediate cancellation. Direct SDK/API status mutation is fixture support, not the user capability under test.

Browser-first pass rules:

- To mark `user can make payment`, `user can add payment method`, `user can change payment method`, `user can change payment status`, or `user can cancel payment/subscription` as passed, the agent must perform the corresponding app and Stripe-hosted UI action in Browser and verify the visible result after returning to the app.
- SDK/API state mutation may create a precondition that would be slow or impossible to reach safely through UI, verify the canonical Stripe/Neon state, force a terminal state that the UI cannot produce directly, or restore the seeded account.
- Do not report a user payment capability as passed when the only evidence is a Stripe SDK update.
- If `browserAction` is empty, skipped, or replaced by SDK/API mutation, the user capability is `blocked` or `fail`; the SDK/API step can only explain support work in `sdkSupportUsed`.
- Put SDK/API work in the `sdkSupportUsed` column of `BillingLifecycleMatrix`; never put SDK/API mutation in `browserAction` as a substitute for the user action.

Required safety gates before any payment-capability test:

1. Confirm the target app repo is `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack`.
2. Read `.env.local` or the active runtime config locally and require the Stripe secret key used for verification or cleanup to start with `sk_test_`. Abort on missing key, `sk_live_`, or unknown key source.
3. Treat Stripe connector/plugin results as unsafe for mutation until proven test-mode. If any fetched Stripe object has `livemode: true`, do not mutate through that connector. Use only the local test key or stop.
4. Use only Stripe test cards or test tokens on Stripe-hosted pages. Never enter a real card, real address beyond harmless test values, or personal payment data.
5. Verify the target Clerk/Neon user and current Stripe customer before the run. For the seeded trial-no-payment account, expected baseline is:
   - Email: `trialing+clerk_test@example.com`
   - Original Stripe customer: `cus_UCYiFPXSi5JJgb`
   - Current restored subscription: verify live before mutating. Do not rely on a hardcoded subscription id because seeded Stripe IDs drift after lifecycle tests and fixture restores.
   - Expected baseline state: `trialing`, `cancel_at_period_end=false`, no `default_payment_method`, no attached card payment methods.
6. Prefer disposable test customers/subscriptions for destructive or hard-to-restore states. If the seeded user's Neon `stripe_customer_id` is repointed to a disposable customer, restore it before final response.
7. Print only safe object IDs and statuses. Do not print API keys, raw env files, Clerk secrets, full card details, or full payment method payloads.

Browser capability pattern:

1. Prove the starting state in Browser:
   - `/app/billing` shows the expected account state and CTA, such as `Add Payment Method`, `View Plans`, `Manage Subscription`, or `Manage Payment Methods`.
   - The header/account identity matches the intended Clerk user.
2. Test payment or add-payment-method through UI:
   - Click the app CTA in Browser (`Add Payment Method`, `View Plans`, paywall CTA, or equivalent).
   - Verify navigation to Stripe Checkout or Customer Portal test flow.
   - Complete the Stripe-hosted test flow only after the user has explicitly authorized this payment-capability test and test mode is verified.
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
6. When starting from `trialing+clerk_test@example.com`, cover the full seeded-account lifecycle the user requested:
   - Prove the initial `/app/billing` state is trial access with no payment method.
   - Use Browser to start from the app CTA, complete the Stripe-hosted add-payment or checkout flow with Stripe test data, return to the app, and verify payment-method/active-access state plus premium surface access.
   - Use Browser to open the billing portal from the app, cancel through the user-facing cancellation flow, return to the app, and verify scheduled-cancel or canceled copy plus the correct access behavior.
   - If immediate terminal `canceled` cannot be produced from the user-facing portal, use SDK/API only after the Browser cancel flow, preferably on a disposable subscription, then Browser-verify the app's terminal canceled state.
   - Restore the seeded user to the original trial/no-payment-method baseline before final response.
7. Restore the seeded user:
   - Update Neon `users.stripe_customer_id` back to the original customer id if it was changed.
   - Ensure the seeded customer has exactly one current access subscription that is `trialing` and not set to cancel.
   - Ensure the original customer has no default payment method and no attached card payment methods when restoring `trialing+clerk_test@example.com`.
   - Detach payment methods from disposable customers when possible.
   - Delete disposable customers when possible.
8. Browser-verify restored state:
   - `/app/billing` shows the original trial/no-payment-method banner and management state.
   - `/app/option-trades/live` or the scoped premium surface regains entitled access.
   - If Live streaming is in scope, click `Start`, wait for `Connected` / `Pause`, and verify populated rows.

Support-only SDK/API examples:

- Create a disposable Stripe test customer/subscription only to isolate the seeded user from destructive tests.
- Use metadata such as `codex_billing_state_test=active_cancel_restore`, `restore_customer_id=<original customer id>`, and `neon_user_id=<Neon user id>` on disposable objects.
- Verify canonical state after Browser actions when app UI does not expose enough detail.
- Force terminal canceled state only after the Browser cancellation flow has already been tested and only on a disposable test subscription.
- Restore Neon and Stripe test fixtures before final response.
- Never use these SDK/API examples as a replacement for Browser proof that the user can perform the corresponding billing action.

Minimum evidence to report:

| Evidence | Required proof |
| --- | --- |
| Test-mode guard | State that all payment lifecycle actions used Stripe test mode; do not reveal the key |
| Original baseline | User id, email, original customer id, original subscription id, original status, payment-method absence |
| Browser payment/add-card flow | App CTA clicked, Stripe-hosted test flow reached/completed, return URL or app billing success state, premium access result |
| Browser change-card flow | Portal/payment-method UI action performed, returned app state, canonical default/payment-method proof when app UI lacks card metadata |
| Browser cancel flow | Portal subscription-cancel action performed, returned app scheduled-cancel or canceled copy, premium access result |
| Support-only SDK terminal-state verification | If used, explain the UI limitation, disposable subscription id, status transition, linked Browser cancel-flow evidence, and Browser proof after mutation |
| Restore state | Neon pointer restored to original customer id, original subscription status, no attached payment methods |
| Live data | Connected/Pause state plus non-empty sampled rows when streaming is in scope |

Failure recovery:

- If any SDK/API step fails after the Neon pointer changes, restore the pointer to the original customer id before investigating further.
- If the Browser payment or portal flow cannot be completed, report the visible blocker and do not replace that missing Browser evidence with SDK mutation.
- If Stripe Elements card fields are visible but the in-app Browser cannot click or type into the cross-origin iframe, record the Stripe test portal URL and visible form as Browser evidence, then stop for user approval before using `@Chrome` or SDK support. If SDK support is approved, use Stripe test tokens such as `tok_visa` instead of sending raw card numbers to the API.
- If a disposable customer cannot be deleted, detach its test payment methods, leave the original user restored, and report the disposable customer id for cleanup.
- If Browser still shows stale billing after Stripe/Neon changes, wait for billing refetch, reload `/app/billing`, and verify the canonical state from Stripe/Neon before filing a UI bug.
- If Stripe's API shape lacks top-level `current_period_end`, inspect subscription item `current_period_end` and `cancel_at`; do not assume `N/A` is acceptable billing copy.

## Browser Plugin Procedure

1. Read and follow the Browser plugin skill before browser work. The required plugin is `plugin://browser@openai-bundled`.
2. Use the in-app Browser. Keep it hidden unless the user explicitly wants to watch.
3. Do not fall back to Chrome, standalone Playwright, Computer Use, or web search for local app testing unless `@Browser` is unavailable and the user approves the fallback.
   - Exception: when registration testing needs an email verification code, user-approved `@Chrome` may be used only to visit Gmail and retrieve the OTP. Continue using `@Browser` for the TradingFlow app itself.
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
- Registration scope: whether to create a fresh disposable account, which alias pattern to use, and which approved Gmail path will retrieve the OTP.
- Premium-guard scope: list the gated controls or data surfaces to compare across account states. If any paid control is in scope, include guest, active, and canceled at minimum; include both trial states when the user asks about Stripe/subscription status or trial UX.
- Billing-capability scope: if payment lifecycle behavior is in scope, list the exact user capabilities to prove in Browser, such as make payment, add payment method, change payment method, change payment status, schedule cancellation, immediate canceled-state handling, restore seeded state, and streaming/access after billing change.
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

### 2A. `/goal` Round Loop And Invariant Gate

When this runbook is invoked through Codex `/goal`, treat the work as a sequence of explicit rounds until the scoped review is complete, the user redirects scope, or a real blocker stops progress.

The round order is mandatory: `UseCaseDesign -> BrowserExecution -> FindingClassification -> InvariantImpactMatrix -> AuthorizedFix -> FixVerification -> InvariantDriftCheck -> NextRoundDecision`. Do not collapse the design and execution phases, and do not treat "fixed and tests pass" as enough to move on when the domain drift check is still missing.

Use `RoundExecutionLog` as the live goal ledger. At the end of every turn, leave the latest round in one of these states: `ready-for-browser`, `finding-classified`, `ready-for-invariant-impact`, `fix-needed`, `fix-in-progress`, `ready-for-browser-recheck`, `ready-for-invariant-drift-check`, `round-complete`, `needs-product-decision`, or `blocked`. The next `continue` must resume from that state before doing unrelated exploration.

Codex goal lifecycle rule: keep the `/goal` active while any scoped round is not `round-complete`, `needs-product-decision`, or `blocked`. Do not mark the goal complete because the latest Browser finding was fixed, because focused tests passed, or because the current response is ready. The goal is complete only when every scoped `RoundExecutionLog` row is closed and the final response includes the verification and drift-check evidence required by this runbook. If the user asks to end testing, wrap the current round honestly, mark untested scope as incomplete or user-stopped, and then close the goal only after the unfinished coverage, blockers, and invariant status are explicit.

Round state transitions:

| State | Required action before moving on | Allowed next state |
| --- | --- | --- |
| `ready-for-browser` | Write `useCaseDesign` with route, persona, controls, expected invariant, acceptance evidence, and cleanup plan. | `finding-classified` or `blocked` |
| `finding-classified` | Classify every issue with `FindingGate`; decide whether implementation is authorized and domain-backed. | `ready-for-invariant-impact`, `round-complete`, `needs-product-decision`, or `blocked` |
| `ready-for-invariant-impact` | Write `InvariantImpactMatrix` and `FixBoundary` before any file edit. | `fix-needed`, `needs-product-decision`, or `blocked` |
| `fix-needed` / `fix-in-progress` | Make the smallest domain-backed change; avoid unrelated refactors and preserve adjacent contracts. | `ready-for-browser-recheck`, `ready-for-invariant-drift-check`, or `blocked` |
| `ready-for-browser-recheck` | Re-test the original Browser symptom or record the exact Browser/data/auth blocker. | `ready-for-invariant-drift-check` or `blocked` |
| `ready-for-invariant-drift-check` | Compare the final diff and observed behavior against the relevant invariant/functionality docs. | `round-complete`, `needs-product-decision`, or `blocked` |
| `round-complete` | Choose the next highest-risk uncovered use case or stop if scoped coverage is complete. | `ready-for-browser` or stop |

The agent must think in rounds, not in a single broad checklist. A round is the smallest useful slice that can be designed, tested, fixed if authorized, and checked for invariant drift without losing evidence. Good rounds are usually scoped to one surface plus one interaction family, such as Historical numeric filters, saved-filter lifecycle, Watchlist/ticker-tape sync, Rank drawer controls, billing portal handoff, registration lifecycle, or Live streaming.

Invariant-safe implementation rule: a Browser finding is evidence, not the product contract. Before editing code, name the invariant or functionality statement that the fix restores. After editing code, inspect the actual diff and prove the changed behavior still fits that contract. If the diff touches a shared boundary, check the adjacent surfaces too; for example, a Historical filter fix can affect Live/Historical sharing, saved-filter persistence, premium guards, query serialization, and table-result semantics.

If the invariant source cannot be found, or if the expected behavior is a product decision rather than a documented contract, stop the round as `needs-product-decision`. Do not normalize the current UI behavior into code just because it was easy to patch, and do not update domain docs to match a fix unless the user explicitly approved the product-contract change.

When a Browser finding suggests a fix, explicitly check for domain-invariant drift risks before editing:

- Access drift: guest, canceled, expired, or trial states receiving actions/data outside the documented entitlement.
- Persistence drift: session-only date, time, lookback, pagination, saved-filter draft state, or URL state becoming durable by accident.
- Data-source drift: a UI label, metric, query predicate, spot source, stream state, or server field changing semantics to satisfy one row sample.
- Cross-surface drift: Rank, Option Trades Live/Historical, Watchlist, TradingView tape, billing, export, drawer, or handoff behavior changing because a shared hook/store/serializer was touched.
- Test-contract drift: a focused test being updated to match the current implementation when the domain docs still require different behavior.

Each round must include:

1. **Use-case design before Browser testing.**
   - Name the route, persona, account state, viewport, and exact user-facing controls to exercise.
   - State the expected product contract from `domain-invariants.md` / `functionality.md`, not from the current code.
   - Include the table/result evidence that will prove the action worked: chips, row samples, sort aria/state, row count, live status, drawer content, billing copy, or no-mutation proof for gated users.
   - Include the destructive or stateful cleanup plan when the test can create saved filters, Watchlist entries, billing records, account state, or temporary server data.
   - Draft the `RoundExecutionLog.useCaseDesign` entry before clicking through the UI so the test does not become an after-the-fact explanation.
2. **Browser execution.**
   - Use Browser interactions for the user journey. Repository Playwright E2E scripts remain forbidden as the review mechanism.
   - Record pass/fail/blocked with visible evidence. A rendered control is not a pass until the resulting state matches the action.
3. **Finding classification.**
   - Separate product defects, environment blockers, Browser-control limitations, fixture drift, and PM/trader UX improvements.
   - Use implementation-gate labels before touching code: `true_defect`, `expected_by_domain_invariant`, `product_decision_needed`, `testability_gap`, or `environment/tooling_blocker`.
   - Do not turn a domain decision into a bug. If a control is intentionally non-sortable or gated by product contract, record that as `keep` unless visible feedback is missing.
4. **Invariant impact and implementation follow-up, only when authorized.**
   - If the user asks to fix confirmed findings, make the smallest code change that restores the documented product contract.
   - Focused unit/component/server tests are allowed and expected for implementation verification. They do not replace the Browser review.
   - Do not broaden saved payloads, query params, access gates, billing state, or stream behavior just to satisfy one Browser scenario.
   - Before editing, write an `InvariantImpactMatrix` row and the intended invariant-safe fix boundary: finding id, expected contract, affected invariant docs/IDs, adjacent surfaces to protect, files likely to change, invariants that must still hold, forbidden behavior changes, focused tests to run, and Browser evidence needed afterward.
   - If the fix is not traceable to a domain invariant, functionality doc, explicit user product decision, or clearly broken UI feedback contract, do not edit. Reclassify the finding as `product_decision_needed` or `testability_gap`.
   - If the classification is `product_decision_needed` or the fix would change an invariant, do not implement until the domain contract is explicitly updated or the user gives a concrete product decision.
5. **Fix verification.**
   - Re-run the focused automated checks that cover the changed boundary.
   - Re-check the original Browser finding when the environment allows it.
   - Record remaining risk explicitly when Browser, market-hours, fixture, CAPTCHA, Stripe, or data freshness limitations prevent full verification.
6. **Invariant drift check before moving on.**
   - Re-read the relevant invariant/functionality sections for the touched surface.
   - Use the actual implementation diff as input: map each changed file, function, API parameter, persisted key, entitlement check, or query predicate to the invariants it could affect.
   - Compare the post-fix behavior against the domain docs, not only against the original Browser symptom. A fix that removes the symptom but changes who can access data, what persists, how data is sourced, or what a metric means fails the drift check.
   - Verify the fix did not weaken access gating, Saved Filter persistence, Live freshness/stream lifecycle, Historical date/time session-only behavior, Watchlist/symbol exclusivity, billing entitlement mapping, or metric/data-integrity promises.
   - Check for cross-surface drift, not only the exact Browser scenario. For example, an Option Trades filter fix must be checked against Live/Historical sharing, saved preference persistence, guest/canceled guards, query serialization, and table result semantics when those seams are touched.
   - Treat current passing tests as supporting evidence, not as the domain contract. If a focused test now encodes behavior that conflicts with the domain docs, the fix is not complete.
   - If the code change adds or removes behavior that the docs do not describe, classify it as `needs-product-decision` or update the domain docs only when the user explicitly approved the product-contract change.
   - If implementation and domain docs disagree, stop and report the conflict. Do not silently normalize code around the current broken behavior.
   - Do the drift check after reviewing the final diff, not only from the original plan; a correct plan can still drift during implementation.
7. **Next-round selection.**
   - Pick the next use cases from the highest remaining user/trader risk and the unexplored controls in the relevant matrices.
   - Do not mark the full `/goal` complete merely because the latest fix is merged or tests pass; completion needs the scoped Browser coverage and invariant gates to be satisfied, or a user-directed stop.

### 3. Browser Walkthrough

For each persona and route in scope:

1. Navigate from the route a real user would use, not only a deep link.
2. Verify the initial state: title, nav location, loading state, data presence or empty state, account state, and visible gates.
3. Exercise the journey actions in Browser:
   - Auth and billing: login, registration with disposable email and OTP, logout, gate redirects, billing/account/profile flows, subscription copy, guest-to-signed-in recovery, and explicitly authorized test-mode payment/add-card/change-card/cancel journeys through the app and Stripe-hosted UI.
   - Option Trades: Historical/Live modes, filters, date/time controls, chips, Watchlist/symbol scope, saved filter behavior, column layout, sorting, pagination, export affordance, Live status/empty/error states.
   - Contract-level analysis: Rank shell tabs, preview vs paid snapshot, filters/sort/pagination, symbol/watchlist scope, KPI/brief, row inspect, drawer tabs, exact-contract Option Trades handoff.
   - Symbol-level analysis: Rank shell tabs, symbol filters/sort, drawer tabs, Watchlist/symbol lookup, Option Trades handoff, premium gates.
4. For each action, record the visible outcome and whether it matches the domain invariant.
5. For each account state, record the billing/access proof before recording premium-control results. A premium-control result without account-state proof is not valid evidence.
6. Switch to mobile viewport for any surface with sheets, drawers, tabs, dense tables, or modal controls. Check for overlap, clipped text, scroll traps, unusable tap targets, and lost state.
   - After setting a Browser viewport override, verify `window.innerWidth` and `window.innerHeight` changed before counting mobile coverage. If the Browser still reports desktop dimensions, mark mobile verification as Browser-capability blocked for this run instead of claiming a mobile pass from desktop layout.

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

### 3A.1 Option Trades Saved Filter Lifecycle

When `/app/option-trades/live` or `/app/option-trades/historical` filter behavior is in scope for an entitled account, execute a reversible saved-filter lifecycle test in Browser and report it in `SavedFilterLifecycleMatrix`.

Use a clearly temporary name, such as `Codex Saved Filter <date>`, and delete it before finishing unless cleanup is blocked. Do not delete user-created saved sets except temporary sets created during the run.

Required active-account coverage:

1. Prove the starting state: account email, active/trial entitlement, route, active saved-filter trigger label, applied chips, row count/page label, and sampled rows.
2. Open the real filter dialog and inventory saved-set rows plus row actions: select row, `Use`, rename, duplicate, set default, delete, `Create from Current View`, `Reset to Defaults`, `Apply`, and `Close`.
3. Change a draft filter that has visible row evidence, preferably `Size` or `Open Interest`. Do not apply it yet.
4. Click `Create from Current View`.
   - Expected: an in-app name entry UI appears, not a native browser prompt and not a silent no-op.
   - If a generic `New Saved Filter Set` already exists, verify the default proposed name is unique or that the new row is otherwise visibly distinguishable.
5. Submit the temporary name and verify a new saved-filter row appears after the server round trip.
6. Prove the saved set captured the draft:
   - Switch/select another saved set so the draft field changes away from the temporary value.
   - Select the temporary set again and verify the edited filter value returns.
7. Apply or `Use` the temporary set and verify table state:
   - Filter chips and the toolbar saved-filter label reflect the temporary set.
   - The table settles, row count/page label changes when expected, and sampled visible rows satisfy the saved numeric range or selected filter.
   - The `Use` action gives clear feedback, such as closing the dialog or updating the toolbar; it must not leave the user unsure whether anything happened.
8. Reload the route and verify the active saved-filter label, chips, and sampled rows persist.
9. Navigate between Live and Historical and verify shared saved-filter state behaves according to the product contract. If Live cannot stream because the market is closed, still verify the saved-filter label/chips and sampled loaded rows when rows are available.
10. If auth/account persistence is in scope, sign out and back into the same account and verify the active saved-filter selection and saved set contents both restore.
11. Test rename using the row action.
   - Expected: visible app UI appears, the current name is prefilled, Save updates the row, and failure is visible.
   - File a finding if rename uses an invisible native prompt, silently no-ops, or loses the saved set.
12. Test duplicate and set-default when available.
   - Expected: duplicate creates a distinguishable non-default copy; set-default moves exactly one default marker and does not confuse default vs in-use state.
13. Test delete cleanup for the temporary set.
   - Expected: non-default temporary set deletes, active state falls back to a valid saved set, and default/last-set deletion is disabled with clear copy.
   - Verify delete icon buttons have accessible labels/tooltips.
14. Reopen the dialog at the end and verify only the intended non-temporary saved sets remain. Record any cleanup blocker with row names and route state.

Required gated-account coverage when premium guard is in scope:

1. Guest users: open saved-filter controls and verify login feedback appears; the table/filter state must not mutate behind the login modal.
2. Canceled/unpaid users: open saved-filter controls and verify upgrade/billing feedback appears; the table/filter state must not mutate behind the paywall.
3. Trial and active users: saved-filter lifecycle should behave as entitled; differences should be billing copy only, not saved-filter access.

Do not mark saved-filter coverage complete when:

- Only row creation is tested without proving the saved draft affects table results.
- The active saved-filter label changes but sampled rows/chips do not match the saved filter.
- The run does not test reload persistence.
- Temporary test saved sets are left behind without an explicit cleanup blocker.

### 3A.2 Watchlist and TradingView Tape Sync

When Watchlist behavior is in scope, verify the global TradingView ticker tape follows the active Watchlist, not merely the initially loaded default list.

Required reversible coverage:

1. Prove the starting account and active Watchlist state, including the visible Watchlist row items and the ticker tape symbols or iframe configuration.
2. Switch to another existing Watchlist in the symbol/watchlist dialog. The active list panel, selected rail row, and global ticker tape symbols must all update to the same symbol set without a page reload.
3. Switch back to the starting Watchlist before continuing.
4. Add one temporary symbol that is not already in the starting Watchlist, then verify the active Watchlist panel and global ticker tape both include it.
5. Remove that temporary symbol and verify the active Watchlist panel and global ticker tape return to the original symbol set.
6. If a TradingView widget is blank or missing, first classify whether the configured app-side symbol list updated. Then check local network/proxy causes before filing a product defect for third-party rendering.

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
5. If a gate opens Stripe test checkout or the customer portal during a normal product review, record only the safe navigation evidence and return to the app. Do not complete checkout, add payment methods, or change subscriptions. If the user explicitly authorized a payment-capability test, continue under `Authorized Browser Payment Capability Test` and record the completed Browser user flow in `BillingLifecycleMatrix`.

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

### RoundExecutionLog

Required for `/goal` runs and any iterative review/fix loop. Treat this table as the goal-state ledger: create or update one row as each round progresses, and do not move to the next round until the row has the required verification and invariant-drift fields.

| Field | Meaning |
| --- | --- |
| `roundId` | Stable ID, e.g. `OT-HIST-ROUND-004` |
| `roundState` | Current resumable state: `ready-for-browser`, `finding-classified`, `ready-for-invariant-impact`, `fix-needed`, `fix-in-progress`, `ready-for-browser-recheck`, `ready-for-invariant-drift-check`, `round-complete`, `needs-product-decision`, or `blocked` |
| `useCaseDesign` | Route, persona, account state, viewport, controls, expected contract, and acceptance evidence planned before Browser testing |
| `browserExecution` | Browser actions performed and visible evidence collected |
| `findings` | Finding IDs or `none`; classify each as product defect, UX issue, fixture drift, environment blocker, Browser-control limitation, or expected invariant behavior |
| `preFixDomainGate` | Required before implementation: `true_defect`, `expected_by_domain_invariant`, `product_decision_needed`, `testability_gap`, `environment/tooling_blocker`, or `not-applicable-no-finding` |
| `invariantImpact` | `not-needed`, blocked reason, or `InvariantImpactMatrix` row IDs completed before editing |
| `fixStatus` | `not-authorized`, `not-needed`, `fixed`, `blocked`, or `needs-product-decision` |
| `fixVerification` | Focused tests, Browser re-check, or reason verification was blocked |
| `invariantDriftStatus` | `pass`, `blocked`, `not-applicable-no-code-change`, or `needs-product-decision` |
| `nextRoundDecision` | Continue to the next highest-risk use cases, stop because scope is complete, stop because blocked, or stop because user redirected scope |

### FixBoundary

Required before editing product code in a `/goal` review/fix loop. This can be a short paragraph or table row, but it must exist before the first file edit for each confirmed finding.

| Field | Meaning |
| --- | --- |
| `findingId` | Browser finding being fixed |
| `preFixDomainGate` | `true_defect` or the explicit product decision that authorized a behavior change |
| `expectedContract` | Domain-invariant/functionality statement the fix is restoring |
| `intendedChange` | Smallest implementation change planned |
| `forbiddenDrift` | Behaviors the fix must not change, such as unpaid access, saved-filter session-only fields, query/sort contract, live-stream lifecycle, Watchlist identity, billing entitlement, or metric semantics |
| `filesLikelyTouched` | Expected components, hooks, server handlers, query builders, or tests |
| `verificationPlan` | Focused automated checks plus Browser re-check needed before next round |

### InvariantImpactMatrix

Required before every user-authorized product-code fix made after Browser findings. This is the pre-edit guardrail that prevents a local UI fix from breaking a wider domain contract.

| Field | Meaning |
| --- | --- |
| `findingId` | Browser finding or product-decision item being considered for implementation |
| `findingGate` | `true_defect`, explicit product decision, or stop value such as `product_decision_needed` |
| `invariantSource` | Exact docs read before editing, such as `shared/domain-invariants.md Access` or `option-trades/domain-invariants.md INV-8` |
| `expectedContract` | Domain behavior the fix must restore or preserve |
| `adjacentSurfaces` | Other surfaces that could be affected, such as Live/Historical sharing, Rank drawers, Watchlist tape, billing portal, saved filters, export, or streaming |
| `likelyImplementationSeams` | Components, hooks, stores, serializers, server handlers, query builders, persisted keys, API params, or cache boundaries likely to change |
| `forbiddenDrift` | Behavior the fix must not introduce, such as unpaid access, stale data source, persisted session-only fields, unsupported sort keys, broadened billing entitlement, or changed metric semantics |
| `preEditDecision` | `edit-allowed`, `needs-product-decision`, `blocked`, or `no-code-change` |
| `verificationPlan` | Focused tests and Browser re-checks that must pass before moving to `InvariantDriftCheck` |
| `cleanupOrRollbackPlan` | How to undo temporary saved filters, Watchlist entries, billing fixtures, accounts, data mutations, or code changes if verification fails |

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

### InvariantDriftCheck

Required for every user-authorized code fix made after Browser findings. Each row should map one touched behavior or boundary to the product contract that must still hold.

| Field | Meaning |
| --- | --- |
| `fixOrCommit` | Commit hash, patch label, or finding ID fixed |
| `touchedSurface` | Route/component/server boundary changed |
| `implementationDelta` | Files/functions/API params/persisted keys/query predicates changed by the fix |
| `invariantSource` | Exact docs read, such as `option-trades/domain-invariants.md INV-8` or `shared/domain-invariants.md Access and Entitlement` |
| `mustNotChange` | Domain behavior that the fix must not weaken, broaden, persist, gate, or reclassify |
| `riskChecked` | What could have drifted, e.g. unpaid mutation, saved lookback persistence, Live stream stale date, Watchlist/symbol overlap, billing over-grant, metric mislabel |
| `evidence` | Code path, focused test, Browser re-check, or query/server proof that the invariant still holds |
| `status` | `pass`, `fail`, `blocked`, or `needs-product-decision` |
| `followUp` | Remaining risk, blocked verification, or `none` |

Minimum drift checks for common fixes:

- Option Trades Saved Filters: verify `date_filter`, `time_filter`, `lookback`, and `pagination.current` remain session-only; active paid users persist saveable filters/columns/sort/page size; unpaid users cannot hydrate or save real views.
- Option Trades Live: verify Live still projects to the latest trading day, runs only for entitled users during market hours, surfaces real stream failures, and does not let stale results overwrite the current feed.
- Historical filtering/sorting: verify premium-only sort/filter controls do not mutate unpaid preview state and row samples match committed filters after settle.
- Watchlist/symbol changes: verify watchlist scope and single-symbol scope remain mutually exclusive, watchlist identity is plain ticker, guests do not persist watchlists, and TradingView tape sync follows the active Watchlist without masking app-side state bugs.
- Billing/access changes: verify paid access still comes only from a valid billing relationship; canceled/expired states do not grant access; SDK/Stripe mutations are support evidence only, not proof of user capability.
- Metric/data changes: verify UI labels, filters, server predicates, and row/table values still use the same metric semantics; unknown values fail safe rather than matching a known category.

### RegistrationFlowMatrix

Required when auth, signup, registration, onboarding, or guest-to-user conversion is in scope.

| Field | Meaning |
| --- | --- |
| `step` | `signed_out_start`, `open_auth_modal`, `switch_to_register`, `submit_email`, `captcha_or_protection`, `otp_sent`, `otp_retrieved`, `otp_submitted`, `post_register_identity`, `post_register_access_state`, or user-specified |
| `route` | Route and modal/surface where the step was exercised |
| `emailAlias` | Disposable alias used, such as `evanzhousyforward+0619codex1552@gmail.com`; do not include passwords or OTP values |
| `browserAction` | Browser action performed in the TradingFlow app |
| `supportTool` | `gmail_connector`, `chrome_gmail`, `user_provided_otp`, `none`, or `blocked` |
| `visibleResult` | Settled UI state, modal copy, identity proof, account menu copy, billing/access banner, or return-path result |
| `expectedBehavior` | What the auth/platform contract requires |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, approved Gmail path note, screenshot label, console/network note; never print OTP values unless explicitly requested |

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

### SavedFilterLifecycleMatrix

Required when Option Trades saved-filter behavior is in scope. Each row should describe one Browser-proven capability or blocker from the saved-filter lifecycle, not an implementation assumption.

| Field | Meaning |
| --- | --- |
| `capability` | `inventory`, `create_from_draft`, `draft_restore`, `apply_or_use`, `reload_persistence`, `account_switch_persistence`, `cross_live_historical`, `rename`, `duplicate`, `set_default`, `delete_cleanup`, `guest_guard`, `canceled_guard`, or user-specified |
| `route` | Route and dialog/panel where the action was exercised |
| `accountScenario` | `active`, `trial_no_pm`, `trial_with_pm`, `guest`, `canceled`, or user-specified |
| `beforeState` | Active saved-set label, chips, row/page count, sampled rows, dialog state, and relevant draft field value before interaction |
| `browserAction` | Exact Browser-visible action performed, such as `Create from Current View`, row rename, row `Use`, reload, sign-out/sign-in, Live/Historical navigation, or delete |
| `afterState` | Settled UI result: saved-set row label, active toolbar label, chips, field value, table rows, modal/paywall/login feedback, or cleanup state |
| `expectedBehavior` | Product contract for saved filters and account access |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, saved-set temporary name/id when safe, visible copy, sampled row values, screenshot label, console/network note, or cleanup blocker |

### BillingLifecycleMatrix

Required when the user explicitly asks to test payment, add-payment-method, change-payment-method, payment-status change, cancellation, or billing-access behavior. Keep the existing matrix name for continuity, but treat it as a user payment-capability evidence matrix. SDK/API evidence can support this matrix, but each user capability must have Browser evidence or be marked `blocked`/`fail`.

Do not produce a passed row when the `browserAction` is only "mutated Stripe status", "updated subscription with SDK", "changed Neon row", or any other backend-only fixture action. Those actions belong in `sdkSupportUsed`; the pass/fail claim belongs to what the user actually did and saw in Browser.

| Field | Meaning |
| --- | --- |
| `capability` | User-facing capability such as `make_payment`, `add_payment_method`, `change_payment_method`, `change_payment_status`, `schedule_cancel`, `terminal_canceled_state_visible_in_app`, `restore_seeded_state`, or user-specified |
| `startingState` | Account email, visible billing state, Stripe/Neon baseline when used |
| `browserAction` | The app and Stripe-hosted UI actions actually performed in Browser; never use SDK/API mutation as this value |
| `browserResult` | Visible settled state after returning to the app |
| `sdkSupportUsed` | `none`, `precondition`, `canonical_verify`, `terminal_state`, or `cleanup_restore`; include safe object IDs only and explain how the SDK/API action supported the Browser journey |
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
3. RoundExecutionLog table.
4. FixBoundary for every code fix made or proposed during the run.
5. InvariantImpactMatrix before every code fix made or proposed during the run.
6. BrowserJourneyCoverage table.
7. InvariantDriftCheck for every code fix made during the run.
8. RegistrationFlowMatrix when auth/signup/registration is in scope.
9. AccessTierGuardMatrix when premium guard/auth/billing is in scope.
10. SavedFilterLifecycleMatrix when Option Trades saved filters are in scope.
11. BillingLifecycleMatrix when payment/add-card/change-card/cancel behavior is in scope.
12. Ranked ProductReviewFinding table.
13. ElementActionMatrix.
14. TraderScorecard.
15. Evidence index: screenshot labels/descriptions, URLs, notable console/network observations.
16. Blockers and uncertainty.
17. Prompt/runbook maintenance suggestion.
18. Explicit statement: `Repository Playwright E2E scripts were not run`.

## Severity Guide

| Severity | Use when |
| --- | --- |
| `Critical` | Core route/action unusable, account/access flow broken, user is misled into wrong payment/access/data state, or critical trading context is dangerously wrong. |
| `High` | Major workflow blocked, visible data trust failure, broken handoff, unusable mobile path for a core flow, or high-friction access/conversion blocker. |
| `Medium` | Meaningful friction, confusing copy, weak empty/loading/error state, hard-to-use control, or scanability issue that slows decisions. |
| `Low` | Polish, minor copy, localized layout issue, or coverage gap that does not block the journey. |

## Troubleshooting

- If login hits CAPTCHA, MFA, or account protection, stop and ask the user to complete or approve the step. Do not bypass it.
- If registration submission returns `Request timed out. Please try again.` before OTP and console logs mention Cloudflare Turnstile, search Gmail for the alias to prove no OTP was sent, retry the visible registration submit once, then record the registration as CAPTCHA/challenge blocked unless the retry reaches OTP. Do not bypass the challenge or call Gmail retrieval failed when no email was sent.
- If registration reaches OTP entry and the Gmail connector is unavailable, use the user-approved `@Chrome` Gmail path if available. If neither Gmail path is available, ask the user for the OTP and mark OTP retrieval blocked until provided.
- If the OTP email does not arrive for a plus-address, verify the alias shown in the modal, search the base Gmail mailbox for recent TradingFlow/Clerk verification messages, wait for the resend timer, then resend once. If it still fails, retry with a fresh alias and record the first alias as blocked.
- If active/canceled/trial seeded accounts do not work, report the exact login step, URL, visible copy, and whether the OTP was accepted.
- If account switching leaves the previous avatar/email, billing banner, or entitlement state visible, sign out, clear the Browser context or Clerk cookies, and retry once. If it still persists, stop counting premium-guard coverage and file a blocker with evidence.
- If the local app is not running, start it with `PATH=/opt/homebrew/bin:$PATH pnpm dev` from the app repo and retry the route.
- If a route returns stale UI after implementation changes, reload the Browser page before re-verifying.
- If the in-app Browser cannot observe a CSV or file download artifact, record export button/gate coverage and mark artifact verification blocked by Browser capability; do not switch to repository Playwright scripts unless the user changes scope.
- If a TradingView widget is blank only on this Mac, verify local proxy/Shadowrocket routing for `www.tradingview-widget.com` before treating it as a product defect.
- If product-review docs reference missing paths, use the current checkout's `AGENTS.md`, glossary, and invariant docs, then record doc drift in the final maintenance suggestion.
- If Browser viewport override does not change `window.innerWidth` / `window.innerHeight` after reload, retry once, reset the viewport before finishing, and mark mobile coverage blocked by Browser capability if it still reports desktop dimensions. If `viewport.reset()` leaves the Browser at the mobile dimensions, explicitly set a desktop fallback such as `1280x720` before continuing desktop checks, then record the reset drift in the handoff.
- If the in-app Browser page-control channel repeatedly times out with `Page.getFrameTree` or leaves only an unusable `about:blank` tab, reset the Browser-control session, reacquire `iab`, close the stuck tab when possible, create a new blank tab with `browser.tabs.new()`, then call `tab.goto(<route>)`. After recovery, verify signed-in identity and route state before counting any product coverage.

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
5. Keep Agent Handoff bounded to unresolved next-run blockers. Do not store completed round transcripts there.
6. For `/goal` loops, ensure the final report includes `RoundExecutionLog`; if code fixes were made, also ensure it includes `FixBoundary`, `InvariantImpactMatrix`, and `InvariantDriftCheck`. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Browser plugin usage, available routes, test-account behavior, canonical product names, domain invariant paths, or output formats drift.
- A repeated Browser review blocker needs a standard recovery step.
- A verification gate was too weak, too broad, or missing.
- An implementation fix passed the visible Browser scenario but exposed a missing or weak domain-invariant drift check.
- A `/goal` run needed an extra round checkpoint to prevent fixes from drifting away from the domain contract.
- A future agent skipped use-case design, Browser re-check, or invariant drift review after fixing a finding.
- The source app docs consolidate or rename product-review/E2E prompts.

Do not update this runbook for:

- One-off UI findings.
- Raw screenshot lists.
- Temporary local data availability.
- Completed review progress.
- Speculative PM ideas not supported by an actual Browser walkthrough.
