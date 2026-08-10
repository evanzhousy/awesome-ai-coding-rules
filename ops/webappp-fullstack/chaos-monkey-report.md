# Chaos Monkey Report

This is the one living report for [`chaos-monkey-ux-review.md`](./chaos-monkey-ux-review.md). It records round-based, Browser-observed TradingFlow UX evidence from the perspective of a first-time novice trader with experienced product-manager judgment.

Preserve completed round narratives. Update the status, coverage ledger, and finding register as each new round is appended.

## Report Status

- Last updated: 2026-08-10 05:58 EDT (UTC-04:00)
- Last completed round: Round 002
- Environment: `https://testapp.tradingflow.com`; visible build `v0.2.1+01ad1e9`
- Overall state: Round 002 complete; planned coverage remains in progress
- Next recommended round: Round 003 — entitled desktop Option Trades Live market-closed snapshot and mode continuity
- Residual unknowns: Post-auth guest-intent restoration, unpaid/canceled access, mobile entry and core journeys, Live market-hours streaming, Rank, secondary surfaces, Saved Filter Sets, watchlist scope, export, and most loading/error/degraded states remain untested

## Coverage Ledger

`untested` is not a pass. Split or add rows when a persona, viewport, state, or newly visible surface creates a materially different user job.

| Area / user job | Persona | Viewport | State or boundary | Status | Round / evidence |
| --- | --- | --- | --- | --- | --- |
| Entry, product comprehension, and first useful value | Guest | Desktop | First visit / public Home / guided workflow | `findings` | Round 001; `CM-UX-001`, `CM-UX-002` |
| Entry, navigation, and first useful value | Guest | Mobile | First visit / responsive shell | `untested` | — |
| Auth and premium-gate intent recovery | Guest | Desktop | Signed out / gated destination / dismiss and return | `findings` | Round 001; `CM-UX-001`, `CM-UX-003` |
| Account, billing, and access recovery | Active / unpaid or canceled / trial when relevant | Desktop / mobile as materially different | Entitled, gated, account, billing, return path | `untested` | — |
| Entitled access transition to core research | Active | Desktop | Test sign-in / paid Historical workstation | `good` | Round 002; addressed challenge plus `User menu` and entitled rows |
| Home and path to a research decision | Active | Desktop / mobile as materially different | Initial load, success, empty/degraded when reachable | `untested` | — |
| Global ticker search, Watchlists, navigation, and announcements | Guest / active | Desktop / mobile as materially different | Discover, switch context, return | `untested` | — |
| Option Trades Historical | Active | Desktop | Latest-day success, row interpretation, session-only empty/recovery, multi-day lookback | `findings` | Round 002; `CM-UX-004`, `CM-UX-005`, `CM-UX-006` |
| Option Trades Historical | Active plus guest/unpaid gate where relevant | Mobile plus remaining desktop states | Mobile, unpaid gate, Saved Filter Sets, scope, pagination, export, other errors | `untested` | — |
| Option Trades Live | Active plus guest/unpaid gate where relevant | Desktop / mobile | Market open/closed, connect or snapshot, stale/error, mode handoff | `untested` | — |
| Rank Contracts | Active plus guest/unpaid gate where relevant | Desktop / mobile | Discover, rank, inspect drawer, interpret freshness, handoff | `untested` | — |
| Rank Symbols | Active plus guest/unpaid gate where relevant | Desktop / mobile | Discover, inspect structure/vol/chain, interpret caveats, handoff | `untested` | — |
| Market Recap | Available persona | Desktop / mobile as materially different | Discover, understand date/freshness, follow offered actions | `untested` | — |
| Portfolio | Active | Desktop / mobile as materially different | Discover, understand value, empty/success without durable mutation | `untested` | — |
| Cookbooks | Active | Desktop / mobile as materially different | Discover, understand live vs saved output, safe read-only report path | `untested` | — |
| Assistant Channels | Active | Desktop / mobile as materially different | Discover, understand purpose and boundaries without sending | `untested` | — |
| Scheduled deliveries | Active | Desktop / mobile as materially different | Discover, understand setup and state without creating | `untested` | — |
| Assistant Skills | Active | Desktop / mobile as materially different | Discover, understand purpose and state without editing | `untested` | — |
| Cross-surface continuity and recovery | Guest | Desktop | Home workflow to premium step / gate dismiss | `findings` | Round 001; `CM-UX-003` |
| Cross-surface continuity and recovery | Relevant signed-in persona | Desktop / mobile as materially different | Back, reload, drawer/tab/route handoff, interrupted flow | `untested` | — |
| Final holistic free-exploration sweep | Mixed, within safe read-only boundary | Desktop and mobile | Unscripted but hypothesis-led | `untested` | — |

## Finding Register

| ID | Severity | Status | User job / surface | First round | Last round | Evidence summary |
| --- | --- | --- | --- | --- | --- | --- |
| `CM-UX-001` | Medium | Open | Guest first entry / public Home / auth | 001 | 001 | A clean signed-out root visit settled on `/app/home` but immediately opened a full “Welcome back” sign-in dialog over the public orientation surface. |
| `CM-UX-002` | Medium | Open | Guest first value / Home workflow builder | 001 | 001 | The plain-language question entry gives way to internal architecture terms such as “atomic ability,” “lenses,” and “local composition,” forcing a novice to learn the product model before completing one analysis step. |
| `CM-UX-003` | High | Open | Guest premium handoff / recovery | 001 | 001 | After loading a non-default workflow, `Start step 1` opened the premium gate; dismissing it reset both the selected template and Current Build to defaults with no visible destination or resume cue. |
| `CM-UX-004` | Critical | Open | Historical composition and trade interpretation | 002 | 002 | Bullish, Smart Money, Moneyness, and OI help copy turns quote-relative and overnight-data heuristics into asserted buying/selling, institutional identity, speculation, and opening-position conclusions. |
| `CM-UX-005` | High | Open | Historical multi-day research | 002 | 002 | Selecting `Past 3 days` twice exposed the new range and an applying message, then left the page unresponsive to settled-state inspection until the route was reloaded. |
| `CM-UX-006` | Medium | Open | Historical single-trade interpretation / accessibility | 002 | 002 | The bid/ask evidence behind `Side` is available only by hovering a non-focusable cell; the table exposes no keyboard-operable row or cell detail action. |

## Round Entry Template

Copy this structure under `Completed Rounds`. Write the plan before Browser interaction, then finish the same entry after the settled evidence is collected.

### Round NNN — Short title

#### Round Test Plan

- Date/time and timezone:
- Environment and build/version if visible:
- Why this round is next:
- User job:
- Surface and entry point:
- Persona/account proof:
- Viewport and state(s):
- Greenfield first-use hypothesis:
- Novice expectation:
- Journeys and safe actions:
- Domain sources read by the operator:
- Evidence to collect:
- Explicit non-goals:

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |

#### What is good

- Evidence-backed design strength and why it should be kept.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-NNN · Severity · Short title**
> Observed evidence, why it is unreasonable, trader consequence, greenfield target, and acceptance signal.

#### Round Conclusion

- Greenfield verdict:
- Findings added or strengthened:
- Coverage rows updated:
- What remains unknown:
- Next recommended round:
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change.

## Completed Rounds

### Round 001 — Guest first entry and path to first useful value

#### Round Test Plan

- Date/time and timezone: 2026-08-10 02:42:49 EDT (UTC-04:00)
- Environment and build/version if visible: `https://testapp.tradingflow.com`; build/version to be captured from visible UI if available
- Why this round is next: Every coverage row is untested. The public first-entry experience is the highest-leverage place to learn whether a new trader can understand the product before encountering premium gates or advanced workbenches.
- User job: Understand what TradingFlow helps me decide, choose one relevant research question, and reach the next useful step without knowing the product's internal architecture.
- Surface and entry point: Begin at `https://testapp.tradingflow.com/`; expect the canonical redirect to `/app/home`, then use only visible Home and app-shell affordances.
- Persona/account proof: Clean guest state, proven by signed-out UI and absence of an authenticated account control.
- Viewport and state(s): Desktop; first visit, settled Home success state, one recommended-workflow exploration, and one guest premium handoff/recovery.
- Greenfield first-use hypothesis: A clean first-use product should lead with a small set of trader questions, explain the evidence path in plain language, distinguish live flow from structural context at the moment of choice, and ask for registration only after the user understands the value while preserving the selected task.
- Novice expectation: Within the first screen and one interaction, understand what the product is for, which path fits my question, what evidence I will inspect, and what happens next; advanced terms should not require internal documentation.
- Journeys and safe actions:
  1. Open the root URL, wait for the settled destination, inventory the visible hierarchy, navigation, first-value prompts, freshness/demo labels, and primary actions.
  2. Choose one visible pain-point workflow or orientation control, then inspect whether its steps, destinations, and caveats form a coherent novice mental model. Do not submit AI, save, schedule, or persist anything.
  3. Follow one visible premium destination from the chosen path, verify the guest gate and preserved intent, then close/back out and confirm recovery to the prior public context.
- Domain sources read by the operator: webapp `AGENTS.md`; `knowledge/basic_concepts.md`; `doc/domain-knowledge/shared/domain-invariants.md`; `doc/domain-knowledge/shared/functionality.md`; current Browser skill; setup and safety guidance from `browser-e2e-product-review.md`.
- Evidence to collect: Final URL and redirect behavior; signed-out proof; visible above-the-fold hierarchy and copy; labels and explanations for the selected workflow; action-by-action settled DOM state; screenshot labels for hierarchy/layout claims; guest gate copy; route/intent behavior after gate close or browser back.
- Explicit non-goals: No registration or sign-in, no AI submission, no account/watchlist/saved-view mutation, no billing action, no mobile claim, no source or Playwright substitution, and no application-code or product-doc changes.

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Root entry and public orientation | Fresh guest at `https://testapp.tradingflow.com/`, desktop `1280 × 720`; expected the public question-led Home to be immediately usable. | Navigated to the root URL and waited for the signed-out state to settle. | The route settled at `/app/home`, `Sign in` was visible, and the Home heading existed, but a full auth dialog automatically covered the page. Its returning-user heading was “Welcome back” even though this was a clean guest context. After `Close`, the Home exposed four guided questions and visible build `v0.2.1+01ad1e9`. | `R001-S1`: unsolicited auth dialog over fresh guest Home. `R001-S2`: settled public Home after close. DOM: `/app/home`; signed-out `Sign in`; dialog copy and visibility. | Finding: `CM-UX-001` |
| Choose and load a first research workflow | Public Home after closing the unsolicited dialog; expected one trader question to become a coherent, plain-language evidence checklist. | Selected “Is unusual options positioning building before a catalyst?” and activated `Use template`. | The selected panel explained the job, warned that activity cannot prove identity, intent, or inside information, and loaded four relevant steps: screen ranked contracts, trace multi-session OI accumulation, cross-check symbol structure, and check live follow-through. A visible “Template loaded into Current Build” confirmation appeared. Farther down, the same journey introduced “Atomic Ability Library,” “lenses,” “Local Composition,” and navigation-group taxonomy before the novice had completed a step. | `R001-S3`: selected catalyst workflow and its disclosed preview. `R001-S4`: loaded Current Build. Settled DOM excerpts for the selected template and four loaded steps. | Good design plus finding: `CM-UX-002` |
| Premium handoff and recovery | Non-default catalyst template selected and its four-step Current Build loaded; expected `Start step 1` either to open the named analysis or gate access while preserving the exact task. | Activated `Start step 1`, observed the settled premium dialog, then activated `Close`. | The URL remained `/app/home`. The gate clearly stated the seven-day Premium offer, 100 AI credits, and no-card requirement, but it did not name the interrupted destination. After close, the first template was selected again (`aria-pressed=true`), the catalyst template was no longer selected (`aria-pressed=false`), and Current Build had reverted to its original symbol-volatility/GEX/tradeability/history steps. | `R001-S5`: premium gate after `Start step 1`. `R001-S6`: Home reset after gate close. DOM before/after excerpts and selected-button states. | Finding: `CM-UX-003` |

#### What is good

- The public Home does lead with four recognizable trader questions rather than a raw feature grid. That is the right greenfield starting model: intent first, tools second.
- The catalyst workflow earned trust by stating at the point of choice that activity may support a hypothesis but cannot prove identity, intent, or inside information. The four loaded steps also separated screening, historical accumulation, broader structure, and current follow-through instead of implying that one signal predicts price.
- `Use template` produced explicit feedback and a visibly changed Current Build, while the build itself disclosed that it was browser-local and would reset on refresh.
- The premium dialog made the commercial terms unusually concrete: eligible new accounts get seven days of Premium, 100 AI credits are included, and no credit card is required.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-001 · Medium · The public first-use surface opens behind an unsolicited sign-in wall**
> A clean guest root visit settled correctly at `/app/home`, but a full auth dialog immediately covered the public orientation experience without any premium action from the user. “Welcome back” also assumes a returning relationship that the first-time persona does not have. This is unreasonable conversion friction and conflicts with the audience-stateless purpose of Home: the trader must dismiss an account decision before understanding the product. In a greenfield design, public orientation would load unobstructed and authentication would appear only after an explicit sign-in or premium-destination action; if optional onboarding is desired, it would use neutral first-visit language and a non-blocking treatment. Acceptance signal: a clean guest root visit exposes the first question and lets the user choose a workflow without a dialog, while explicit premium actions still open the gate.

> [!IMPORTANT]
> **CM-UX-002 · Medium · The guided question path gives way to internal product architecture**
> The first screen uses a strong plain-language question, but the next layer asks a novice to parse “Atomic Ability Library,” “atomic ability,” “lenses,” “Local Composition,” “navigation groups,” and multiple module names before completing one evidence step. The trader now has competing mental models—choose a question, assemble abilities, edit a build, use AI, or navigate a module—and must understand TradingFlow's implementation taxonomy to know what to do next. A greenfield path would keep the chosen checklist dominant, explain necessary market terms in context, and progressively disclose the ability library only through an explicit advanced/customize action. Acceptance signal: a first-time trader can identify the single next step and why it matters without learning the terms “atomic ability” or “local composition”; builder controls remain available after opting into customization.

> [!IMPORTANT]
> **CM-UX-003 · High · Dismissing the premium gate destroys the workflow context it interrupted**
> The guest selected the catalyst workflow and loaded four non-default steps, then activated `Start step 1`. The premium gate kept the visible URL at `/app/home` and did not name the intended destination. Closing it silently restored the default selected template and default Current Build, confirmed by the selected-button states and changed step list. This loses essential context in a core first-value/conversion journey and teaches the trader that exploring before registration is unsafe; a more customized build would lose even more work. A greenfield gate would preserve the exact selected template, step order, lenses, and pending destination across dismiss and authentication, and would say what will resume after sign-in. Acceptance signal: dismissing the gate returns to the unchanged catalyst build, and completing authentication resumes the explicitly named first step with the same context.

#### Round Conclusion

- Greenfield verdict: The question-led front door and evidence caveats are strong foundations, but the current guest journey is not yet a coherent first-use design. It asks for authentication too early, exposes internal composition concepts too soon, and fails the most important conversion invariant: preserve the user's chosen task through the gate.
- Findings added or strengthened: Added `CM-UX-001` (Medium), `CM-UX-002` (Medium), and `CM-UX-003` (High).
- Coverage rows updated: Guest desktop first entry, guest desktop auth/premium-gate recovery, and guest desktop cross-surface interruption now have `findings` evidence from Round 001.
- What remains unknown: Whether the pending step resumes after successful authentication; signed-in Home behavior; active, unpaid/canceled, and trial access states; mobile first entry; other workflows; loading/empty/error/degraded behavior; production parity; and all remaining core and secondary surfaces.
- Next recommended round: Round 002 — sign in with the active test account and test the desktop Option Trades Historical first-research loop: initial comprehension and freshness, one reversible filter/no-result recovery, one trade-detail inspection, and return-context preservation.
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change. The operational workflow, evidence rules, report schema, and completion gate were executable without a durable runbook ambiguity.

### Round 002 — Entitled desktop Historical first-research loop

#### Round Test Plan

- Date/time and timezone: 2026-08-10 05:33:50 EDT (UTC-04:00)
- Environment and build/version if visible: `https://testapp.tradingflow.com`; prior visible build `v0.2.1+01ad1e9`, to be rechecked in the entitled shell if visible
- Why this round is next: The living report names Option Trades Historical as the next highest-value uncovered core research job. It is the first place an entitled novice must translate dense option-flow data into a bounded research conclusion rather than merely understand the product's promise.
- User job: Find and inspect past options activity for a credible research question while understanding the active scope, data window, freshness, inferred trade direction, and how to recover from an empty constraint without losing place.
- Surface and entry point: Start from the signed-out Round 001 Home handoff, authenticate with the documented active test account, enter Option Trades from visible navigation, and select Historical using only visible controls.
- Persona/account proof: Entitled test user `active+clerk_test@example.com`; prove the session through the visible account identity plus premium rows or equivalent entitled-only workstation state. Do not infer entitlement from a successful login alone.
- Viewport and state(s): Desktop at approximately `1280 × 720`; signed-out-to-entitled transition, settled Historical success state, one trade-detail inspection, one session-only empty/no-result constraint if naturally reachable, and explicit recovery.
- Greenfield first-use hypothesis: A clean historical-flow workstation should reveal one linear loop—confirm scope and time window, understand the evidence summary, scan interpretable rows, inspect one trade with caveats, and return without losing context—while progressively disclosing advanced workstation controls.
- Novice expectation: Know which session and symbols are represented, whether the data is current for that chosen window, what one row means, that aggressor/sentiment and OI context are bounded inferences rather than intent, which controls are currently committed, and how to undo a no-result choice.
- Journeys and safe actions:
  1. Sign in with the active test account, use visible navigation to reach Option Trades Historical, wait for rows and composition metrics to settle, then inventory hierarchy, active Saved Filter Set label, scope, date/time window, freshness, controls, table columns, and explanations.
  2. Inspect one visible trade through its ordinary row/detail affordance, look for in-context explanations of side/sentiment/OI freshness, then close or return and verify that route, window, scroll/page, and row context remain stable.
  3. Use only a session-only Historical date/time control to create a narrow empty or no-match state if the UI safely permits it, judge its explanation and recovery action, then revert to the original committed window and confirm rows return. Do not apply screening filters because Apply auto-saves the active Saved Filter Set.
- Domain sources read by the operator: `AGENTS.md`; `knowledge/basic_concepts.md`; `doc/domain-knowledge/option-trades/domain-invariants.md`; `doc/domain-knowledge/option-trades/functionality.md`; current runbook-maintainer, greenfield, and in-app Browser skills.
- Evidence to collect: Signed-in and entitlement proof; settled URL; viewport; visible build if present; committed scope/date/time/filter labels; settled row and metrics state; exact visible terminology and caveats; before/detail/after state; screenshot labels for hierarchy, density, clipping, and recovery; session-only empty-state copy; and restored-row proof.
- Explicit non-goals: No Saved Filter Set Apply/Use/create/rename/duplicate/delete/default/overwrite action, no column or sort persistence change, no watchlist mutation or scoping, no export, no notification permission, no AI, no Live stream lifecycle action, no billing/account mutation beyond test sign-in, no production claim, no repository Playwright execution, and no application-code or product-doc change.

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Authenticate and reach entitled Historical | Signed-out `/app/home` at `1280 × 720`; expected authentication to prove identity first, then paid access to settle before any Option Trades data rendered. | Opened `Sign in`, entered the documented active test identity, filled the six verification-code inputs individually, used primary navigation to enter Option Trades, and followed the visible Historical destination. | The verification dialog addressed `active+clerk_test@example.com`. After completion, `Sign in` disappeared and `User menu` appeared. Historical settled at `/app/option-trades/historical` with visible build `v0.2.1+01ad1e9`, `Default` as the active Filter Set, `Date range: 2026-08-07`, `Time range: Full day`, six composition cards, 100 rendered data rows plus the header, `7,497,850 total records`, and `Page 1 of 74979`. This entitled-only table state proved paid access rather than login alone. | `R002-D1`: addressed test-account challenge, signed-in shell roles, final URL, toolbar labels, row count, total count, and build. The semantic click on the visible Historical link exceeded the Browser locator deadline; the exact visible href from the DOM was then opened in the same tab and the destination was verified. | Good design; Browser interaction fallback disclosed |
| Interpret one trade and its analytical labels | Latest-day all-symbol view; expected the workstation to distinguish observed quote-relative facts from inferred aggressor, sentiment, identity, opening/closing, and intent. | Read the per-column help, hovered the first visible `SPXW` row's `Side` cell, and hovered the composition-card explanations for Bullish Flow, Smart Money, and Moneyness. | The first row's `Mid` hover exposed `Price: $0.55 | Bid: $0.50 | Ask: $0.60 | Spread: $0.10` and `Midpoint Trade`, which is useful execution evidence. The header help said ASK is “buyer aggressive,” BID is “seller aggressive,” and Sentiment is classified from option type and side. More consequentially, Bullish Flow was defined as “Call Buys + Put Sells,” Smart Money as simultaneous aggregated activity “often by institutions,” Moneyness as OTM premium “indicating speculation,” and OI help said low OI with high volume signals new positions being opened. The Side help instructed users to hover row values for bid/ask detail, but those cells were generic, non-focusable DOM nodes with no row/detail button. | `R002-D2`: exact header, composition-tooltip, OI-help, first-row, and quote-hover text; accessibility snapshot and visible-interactable DOM. Three Historical screenshot attempts—two viewport and one clipped—timed out, so no visual density or clipping conclusion is made. | Findings: `CM-UX-004`, `CM-UX-006` |
| Session-only constraint, empty recovery, and multi-day research | Settled latest-day page with the Default Filter Set untouched; expected session-only controls to update honestly, keep the shell responsive, explain zero rows, and recover without altering saved criteria. | Selected `Past 3 days` twice in separate restored states; after each failure reloaded the route to its session-only latest-day default. Then staged `00:00`–`00:01` in the Time Range editor, applied it, and activated `Clear time filter`. | Each three-day selection immediately announced `Applying Past 3 days lookback.` and changed the visible date range to `2026-08-05 - 2026-08-07`, but the page did not yield a settled visible state. On both attempts subsequent visible-state and control reads timed out; the second remained unresponsive after a 12-second wait and exhausted the Browser connection's 30-second execution window. Reload restored `Latest trading day`, `2026-08-07`, and full-day rows. By contrast, the narrow time window settled correctly at `0 total records`, displayed the committed `00:00 to 00:01` chip, explained that no trades matched, and offered `Clear time filter`; clearing it restored `Time range: Full day`, `7,497,850 total records`, first-page rows, and no saved-filter mutation. Console corroboration showed no application error for the hang; its internal cause remains unknown. | `R002-D3`: two immediate three-day applying/range states, repeated post-wait Browser timeouts, and reload recovery. `R002-D4`: empty-state copy, committed chip, zero count, and recovery control. `R002-D5`: restored full-day label, total, first rows, and page. | Good empty recovery plus finding: `CM-UX-005` |

#### What is good

- The access boundary behaved honestly in this tested transition: the guest saw no premium workstation, and the active test user reached real Historical controls and rows only after authentication and entitlement settled.
- Historical clearly surfaced its active Filter Set, lookback, committed date, and committed time window before the data. `2026-08-07` was the correct latest trading day for the pre-market Monday test state, and the composition cards showed both percentage and premium against a common `$38.11B` denominator.
- Column-level help exists where dense option terminology first appears. The first row's Side hover added the actual price, bid, ask, spread, and midpoint classification instead of asking the trader to trust a color alone.
- The zero-row path was exemplary: it retained the table headers, named the applied `00:00 to 00:01` constraint, distinguished zero matching rows from failure, explained the likely cause, and provided a targeted `Clear time filter` action. Clearing the session-only constraint returned the original rows, full-day label, page, and total without touching the active Saved Filter Set.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-004 · Critical · Historical presents inferred identity and intent as observed fact**
> On the settled latest-day view, Bullish Flow's help defined the metric as premium from “Call Buys + Put Sells,” even though the tape observes execution relative to the quote and cannot know whether the aggressor opened, closed, hedged, or traded a multi-leg strategy. The adjacent summary went further: `Smart Money` described aggregated simultaneous trades as “often by institutions,” `Moneyness` described OTM premium as “indicating speculation,” and OI help told the user that low OI with high volume signals new positions being opened without an OI as-of date or T+1 qualification. These labels can materially mislead a trader about buyer/seller direction, participant identity, intent, and persistence—the exact conclusions the product's own first-use caveat says flow cannot prove. A greenfield evidence surface would label observed facts first (`ask-/bid-aggressive premium`, `simultaneous aggregated premium`, `OTM premium share`), mark aggressor and sentiment as inference, disclose opening/closing ambiguity, and show that OI is an overnight snapshot requiring later confirmation. Acceptance signal: no summary or help text states buys, sells, institutions, speculation, or opening positions as known facts; every derived interpretation exposes its rule, uncertainty, OI as-of boundary, and a path to corroborating evidence.

> [!IMPORTANT]
> **CM-UX-005 · High · The three-day research path repeatedly becomes unresponsive while applying**
> `Past 3 days` was selected twice from independently restored latest-day states. Both times the control quickly announced `Applying Past 3 days lookback.` and changed the visible range to `2026-08-05 - 2026-08-07`, but the workbench never produced a settled result accessible to the in-app Browser. Subsequent visible-state operations repeatedly timed out; on the second attempt the page was still non-responsive after twelve seconds and exhausted the Browser's remaining execution window. Reloading the same route immediately restored the latest-day table, which isolates the failure to the multi-day transition in this environment, though the absence of an application console error leaves the internal cause unknown. This blocks the core job of comparing flow across sessions and prevents the user from knowing whether the query is working, failed, or merely slow. A greenfield implementation would keep the shell and cancel/retry controls responsive, bound the request/render lifecycle, and either settle the three-day rows and metrics or show a specific recoverable failure. Acceptance signal: repeated `Past 3 days` changes reach a matching date range, metrics, rows, and total within an explicit performance budget; the page remains interactive throughout and never requires reload.

> [!IMPORTANT]
> **CM-UX-006 · Medium · The quote evidence behind Side is hover-only**
> The Side header explicitly tells the trader to “Hover a row value for bid/ask detail.” A mouse hover did reveal valuable quote evidence for the first trade, but the Side cell was a generic, non-focusable table cell and the visible interactive DOM exposed no row- or cell-detail control. Keyboard users therefore cannot reach the evidence used to interpret Side, and the availability of an equivalent touch path remains unknown until mobile coverage. Hiding the strongest execution evidence behind an undiscoverable hover weakens both accessibility and analytical confidence. A greenfield table would make each Side value focusable and clickable/tappable, keep hover as an accelerator, and open the same persistent quote-relative detail for pointer, keyboard, and touch. Acceptance signal: Tab can reach the Side value, Enter/Space and pointer/tap reveal the same price/bid/ask/spread content, the control has an honest accessible name/state, and dismissal returns to the unchanged row and page.

#### Round Conclusion

- Greenfield verdict: Historical has a strong workstation skeleton—honest scope/window controls, useful per-column help, and excellent empty recovery—but it is not yet decision-safe. Its composition language overclaims identity and intent, its key quote evidence is pointer-only, and the multi-session path failed to remain usable.
- Findings added or strengthened: Added `CM-UX-004` (Critical), `CM-UX-005` (High), and `CM-UX-006` (Medium).
- Coverage rows updated: Active desktop entitlement-to-Historical access is `good`; active desktop Historical latest-day interpretation, session-only empty/recovery, and multi-day lookback have `findings` evidence from Round 002.
- What remains unknown: A successfully settled multi-day result and its latest-known-OI labeling; Saved Filter Set behavior; symbol/watchlist scope; pagination and sort continuity; export; Historical mobile; guest/unpaid Historical gates; other loading/error states; and production parity. Historical screenshot evidence remains unavailable because both viewport and clipped captures timed out, so no layout/clipping finding was filed.
- Next recommended round: Round 003 — test entitled desktop Option Trades Live in the current market-closed state: latest-snapshot freshness, off-hours explanation, Live/ Historical filter and mode continuity, non-streaming controls, and a safe route-away/return lifecycle without starting alerts or changing saved configuration.
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change. The round selection, safe-action boundaries, evidence classifications, and blocker recording rules handled this run without a durable runbook ambiguity.
