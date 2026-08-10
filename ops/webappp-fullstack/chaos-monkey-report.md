# Chaos Monkey Report

This is the one living report for [`chaos-monkey-ux-review.md`](./chaos-monkey-ux-review.md). It records round-based, Browser-observed TradingFlow UX evidence from the perspective of a first-time novice trader with experienced product-manager judgment.

Preserve completed round narratives. Update the status, coverage ledger, and finding register as each new round is appended.

## Report Status

- Last updated: 2026-08-10 06:35 EDT (UTC-04:00)
- Last completed round: Round 005
- Environment: `https://testapp.tradingflow.com`; visible build `v0.2.1+01ad1e9`
- Overall state: Five rounds completed; the completion gate remains open
- Next recommended round: Round 006 — active desktop Market Recap first-research loop, date/freshness comprehension, and one offered cross-route handoff
- Residual unknowns: Post-auth guest-intent restoration, unpaid/canceled access, mobile entry and core journeys, Live market-hours streaming/reconnect/stale states, alert enablement, Rank access/mobile/filter/error states, the missing Rank Symbols handoff destination and Back behavior, exact-contract handoff persistence across refresh or copied URLs, Market Recap and other secondary surfaces, Saved Filter Sets, watchlist scope, export, the Option Trades ticker-tape transport cause, and most loading/error/degraded states remain untested

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
| Option Trades Live | Active | Desktop | Market closed / latest snapshot / disabled controls / mode handoff / route-away return | `findings` | Round 003; `CM-UX-004`, `CM-UX-006`, `CM-UX-007`, `CM-UX-008` |
| Option Trades Live | Active plus guest/unpaid gate where relevant | Desktop / mobile | Market-open streaming, reconnect, stale/error, mobile, and access gates | `untested` | — |
| Rank Contracts | Active plus guest/unpaid gate where relevant | Desktop / mobile | Discover, rank, inspect drawer, interpret freshness, handoff | `findings` | Round 004; `CM-UX-009`; active desktop success path and exact handoff tested |
| Rank Symbols | Active plus guest/unpaid gate where relevant | Desktop / mobile | Discover, inspect structure/vol/chain, interpret caveats, handoff | `findings` | Round 005; `CM-UX-010`, `CM-UX-011`, `CM-UX-012`; active desktop success path tested |
| Market Recap | Available persona | Desktop / mobile as materially different | Discover, understand date/freshness, follow offered actions | `untested` | — |
| Portfolio | Active | Desktop / mobile as materially different | Discover, understand value, empty/success without durable mutation | `untested` | — |
| Cookbooks | Active | Desktop / mobile as materially different | Discover, understand live vs saved output, safe read-only report path | `untested` | — |
| Assistant Channels | Active | Desktop / mobile as materially different | Discover, understand purpose and boundaries without sending | `untested` | — |
| Scheduled deliveries | Active | Desktop / mobile as materially different | Discover, understand setup and state without creating | `untested` | — |
| Assistant Skills | Active | Desktop / mobile as materially different | Discover, understand purpose and state without editing | `untested` | — |
| Cross-surface continuity and recovery | Guest | Desktop | Home workflow to premium step / gate dismiss | `findings` | Round 001; `CM-UX-003` |
| Option Trades mode and route continuity | Active | Desktop | Market-closed Live → Historical → Live / Home → Live fresh mount | `good` | Round 003; same first row, no visible loading state, filters remained `Default` |
| Rank Contracts exact-contract continuity | Active | Desktop | Latest-session contract drawer → Historical exact identity → Browser Back | `good` | Round 004; GTIM 2026-12-18 CALL $2.5, session 2026-08-07, 46 matching rows, drawer restored |
| Rank Symbols symbol-only continuity | Active | Desktop | Latest-session symbol drawer → Option Trades → Browser Back | `findings` | Round 005; `CM-UX-012`; source control absent, so destination and Back could not be tested |
| Cross-surface continuity and recovery | Relevant signed-in persona | Desktop / mobile as materially different | Back, reload, drawer/route handoff, interrupted flow outside the tested Option Trades path | `untested` | — |
| Final holistic free-exploration sweep | Mixed, within safe read-only boundary | Desktop and mobile | Unscripted but hypothesis-led | `untested` | — |

## Finding Register

| ID | Severity | Status | User job / surface | First round | Last round | Evidence summary |
| --- | --- | --- | --- | --- | --- | --- |
| `CM-UX-001` | Medium | Open | Guest first entry / public Home / auth | 001 | 001 | A clean signed-out root visit settled on `/app/home` but immediately opened a full “Welcome back” sign-in dialog over the public orientation surface. |
| `CM-UX-002` | Medium | Open | Guest first value / Home workflow builder | 001 | 001 | The plain-language question entry gives way to internal architecture terms such as “atomic ability,” “lenses,” and “local composition,” forcing a novice to learn the product model before completing one analysis step. |
| `CM-UX-003` | High | Open | Guest premium handoff / recovery | 001 | 001 | After loading a non-default workflow, `Start step 1` opened the premium gate; dismissing it reset both the selected template and Current Build to defaults with no visible destination or resume cue. |
| `CM-UX-004` | Critical | Open | Option Trades composition, sentiment, and trade interpretation | 002 | 003 | Historical overclaims buying/selling, identity, speculation, and opening positions; Live repeats `BULLISH` / `BEARISH` classifications from option type and Side without an uncertainty qualifier. |
| `CM-UX-005` | High | Open | Historical multi-day research | 002 | 002 | Selecting `Past 3 days` twice exposed the new range and an applying message, then left the page unresponsive to settled-state inspection until the route was reloaded. |
| `CM-UX-006` | Medium | Open | Option Trades single-trade interpretation / accessibility | 002 | 003 | Historical and Live direct users to hover non-focusable Side values, and Live also puts sentiment logic behind a non-focusable row badge. |
| `CM-UX-007` | Medium | Open | Live off-hours snapshot freshness | 003 | 003 | Live says only `Latest trading day`; on pre-market 2026-08-10 it showed `08-07` row dates but no explicit `2026-08-07` session or snapshot as-of label. |
| `CM-UX-008` | Medium | Open | Option Trades degraded third-party ticker tape | 003 | 003 | A failed TradingView ticker-tape iframe persisted as an unlabeled 72-pixel full-width gray band with a broken-image icon and no fallback; transport cause remains unverified. |
| `CM-UX-009` | Critical | Open | Rank Contracts GEX interpretation | 004 | 004 | Rank mechanically maps symbol-level GEX regime plus contract moneyness to `Support`, `Resistance`, `Bullish Target`, and `Bearish Target`, turning context into forecast-like trading levels. |
| `CM-UX-010` | Critical | Open | Rank Symbols universe and provenance | 005 | 005 | The Symbols leaf retains Contract-level caveat, opportunity cards, leaders, freshness, and refresh copy above its independently sourced 6,094-symbol catalog, while row GEX badges do not disclose which source supplied them. |
| `CM-UX-011` | Critical | Open | Rank Symbols price and strike precision | 005 | 005 | GTIM's Vol surface rounds the only $2.5 strike to `$3` in its range and flat grid while the same drawer's smile and Chain show `$2.5`; the leaderboard similarly reduces Spot to `$1` while Overview shows `$1.47`. |
| `CM-UX-012` | High | Open | Rank Symbols to Option Trades handoff | 005 | 005 | The symbol drawer exposes no visible or accessible `Open in Option Trades` action on any inspected tab, blocking the documented symbol-only continuation. |

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

### Round 003 — Entitled desktop Live off-hours snapshot and mode continuity

#### Round Test Plan

- Date/time and timezone: 2026-08-10 06:02:45 EDT (UTC-04:00)
- Environment and build/version if visible: `https://testapp.tradingflow.com`; prior visible build `v0.2.1+01ad1e9`, to be rechecked if the shell exposes it
- Why this round is next: Live is the untested half of the core Option Trades workstation. The current pre-market state permits a bounded test of whether an entitled first-time trader receives a useful latest-session snapshot, understands that it is not streaming, and can move between research modes without a hidden reload or loss of place.
- User job: Use the most recent options tape before the market opens, know exactly which session the rows represent and whether updates are live, then move to Historical and back without changing the evidence set or waiting for another fetch.
- Surface and entry point: Continue from the signed-in active-user Historical handoff at `/app/option-trades/historical`, then use only visible Option Trades mode and global navigation controls.
- Persona/account proof: Existing signed-in test user `active+clerk_test@example.com`; re-prove entitlement through the visible account control and settled paid Live snapshot rows rather than assuming the prior session survived.
- Viewport and state(s): Desktop at approximately `1280 × 720`; pre-market/market-closed Live success state, disabled non-streaming controls, Live → Historical → Live handoff, route-away to Home, and fresh return to Live.
- Greenfield first-use hypothesis: An off-hours Live surface should feel like an honest latest-tape reader, not a broken real-time screen: name the exact session and snapshot freshness, state why streaming is unavailable and when it resumes, keep all controls truthful, and preserve the current evidence set through ordinary mode changes.
- Novice expectation: Immediately know that the market is closed, that the rows are a static latest-session snapshot, the exact date and ordering represented, whether any control can start updates now, and whether changing tabs changes or reloads the data.
- Journeys and safe actions:
  1. Switch from Historical to Live, wait for the settled paid snapshot, and inventory heading, market state, exact date/freshness, active filter/scope, ordering, row count, and Start/alert states. Do not activate streaming or alerts.
  2. Inspect one visible row and the ordinary Side/help affordance for execution-evidence and inference language. If the same root causes as `CM-UX-004` or `CM-UX-006` recur, strengthen those findings instead of creating duplicates.
  3. Switch Live → Historical → Live without changing filters or scope and compare route, loading state, row identity, date, and totals before/after. Then leave Option Trades for Home and return to Live to test a fresh-mount snapshot lifecycle; do not infer stream cleanup because no stream is active off-hours.
- Domain sources read by the operator: `AGENTS.md`; `knowledge/basic_concepts.md`; `doc/domain-knowledge/option-trades/domain-invariants.md`; `doc/domain-knowledge/option-trades/functionality.md`; current runbook-maintainer, greenfield, and in-app Browser skills.
- Evidence to collect: Signed-in and entitlement proof; settled URLs; visible build if present; market-state copy and accessible control states; exact snapshot date/freshness and ordering; settled row count and first-row identity; Side/help evidence; before/after mode-switch state; any loading/refetch indicator; route-away/return loading and settled state; screenshot labels only if capture succeeds; console only as corroboration.
- Explicit non-goals: No Start/Pause/Resume/Reconnect action, no notification permission or alert action, no filter/date/time/scope/Saved Filter Set/column/sort/watchlist/export mutation, no market-hours streaming claim, no mobile or production claim, no repository Playwright execution, and no application-code or product-doc change.

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Enter entitled Live during off-hours | Signed-in entitled Historical latest-day view with `Default` Filter Set and rows; expected Live to disclose a static prior-session snapshot rather than look disconnected or empty. | Activated the visible `Live` tab and inspected the settled toolbar, snapshot rows, current-time footer, disabled controls, and viewport. | `/app/option-trades/live` settled with `User menu`, `Live Option Trades`, `Market closed`, disabled `Start`, disabled desktop alerts, `Default`, and `Latest trading day · Time descending · Shared filters with Historical`. The visible/virtualized DOM rendered 22 rows; the first was `SPXW 08-07 16:59:59 ... PUT Mid`. Historical composition cards were absent as intended. The page never displayed the full session date `2026-08-07` or a snapshot as-of time, while the footer displayed current NY time on `2026-08-10`. A full-width gray band with a broken-image icon sat above the workbench. | `R003-S1`: 1280 × 720 settled Live screenshot. `R003-D1`: route, user control, toolbar/status accessible names, disabled states, first row, rendered-row count, zero exact `2026-08-07` matches, and build `v0.2.1+01ad1e9`. | Good off-hours boundary plus findings: `CM-UX-007`, `CM-UX-008` |
| Interpret one Live row and its help | Settled off-hours snapshot; expected observed quote facts, inferred direction, and the means to inspect logic to remain distinguishable and keyboard reachable. | Opened `About Side`, `About Sentiment`, and `About Date Time`; inspected row-cell roles without activating any row/watchlist action. | Side help said ASK is “buyer aggressive,” BID is “seller aggressive,” MID is midpoint, then directed the user to hover a row value for bid/ask detail. Sentiment was a Bullish/Bearish/Neutral classification from option type and Side and directed the user to hover a row badge for logic. The corresponding cells and badges remained generic non-focusable content with no keyboard-operable detail action. Date Time clarified Eastern Time and newest-first sorting but did not supply the snapshot's full session date or as-of state. | `R003-D2`: expanded Side, Sentiment, and Date Time help; row roles and exact labels including visible `BULLISH`, `BEARISH`, and `NEUTRAL` badges. | Strengthened: `CM-UX-004`, `CM-UX-006`, `CM-UX-007` |
| Preserve evidence across mode and route changes | Settled Live first row and `Default` filters; expected ordinary tab changes to be presentational and route return to remount an honest latest snapshot without durable mutation. | Switched Live → Historical → Live, then navigated to Home and returned through the primary `Option Trades` control. | Historical returned with the same first `SPXW 08-07 16:59:59` row, six metrics, `7,497,850 total records`, and no visible loading message. Live returned with the same first row, 22 rendered rows, `Market closed`, and no visible loading message. Home had no broken ticker band; returning through `Option Trades` settled directly on Live with the same snapshot row, disabled Start, visible user control, and no loading message. The failed 1328 × 72 TradingView ticker-tape iframe reappeared on each Option Trades return; the Browser console exposed no corresponding application error, so the transport root cause is not assigned. | `R003-S2`: mode-return viewport. `R003-S3`: signed-in Home without the band. `R003-S4`: fresh Live return with the band. `R003-D3`: before/after routes, row identity, rendered counts, filters, totals, and loading-text counts. | Good continuity plus finding: `CM-UX-008` |

#### What is good

- The off-hours boundary was unusually honest: Live showed real entitled snapshot rows, said `Market closed`, disabled `Start`, and explained that streaming is unavailable outside market hours rather than presenting a disconnected or retry state.
- Live used a concise contract strip—latest trading day, time descending, shared filters—and correctly removed Historical's composition cards. Disabled sort headers explicitly explained that Live locks time newest-first and shares filters with Historical.
- Ordinary Live/Historical switches preserved the same first trade and `Default` filter context with no visible loading state. Historical immediately restored its metrics, full date control, total, and pagination; Live immediately restored the static snapshot.
- Leaving for signed-in Home and returning through primary navigation remounted Live with the same latest row and truthful market-closed controls. No configuration, watchlist, alert, filter, or saved state was changed.
- Side, Sentiment, and Date Time explanations were available from keyboard-operable header help buttons even though the row-level evidence paths remain inaccessible.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-004 · Critical · Live repeats the same unqualified directional interpretation**
> Live visibly classified rows as `BULLISH`, `BEARISH`, or `NEUTRAL` from option type and Side, while Side help stated that ASK is “buyer aggressive” and BID is “seller aggressive.” That is a disclosed rule, but neither the cell nor the help marks the directional result as an inference or reminds the trader that the tape cannot determine opening versus closing, multi-leg context, hedging, or ultimate intent. This extends the Round 002 decision-safety problem into the supposedly current tape: a novice can read a colored `BULLISH` badge as an observed bullish position. The greenfield target remains quote-relative evidence first, a visibly qualified heuristic second, and one contextual caveat wherever the badge is interpreted. Acceptance signal: every Live directional badge is named and styled as inferred, exposes the exact rule without asserting intent, and links to the same uncertainty and corroboration guidance as Historical.

> [!IMPORTANT]
> **CM-UX-006 · Medium · Live repeats pointer-only row evidence for both Side and Sentiment**
> Side help explicitly said to hover a row value for bid/ask detail, and Sentiment help said to hover a row badge for its logic. In the settled accessibility tree, the Side values and sentiment badges were generic, non-focusable content; there was no row-detail or cell-detail control. The header explanations are keyboard reachable, but the actual evidence for a particular trade is not. This broadens the Round 002 accessibility failure from Side to the interpretation badge itself. A greenfield table would use the same focusable, clickable/tappable detail trigger for Side and Sentiment on every row. Acceptance signal: keyboard, pointer, and touch all reveal the identical quote facts and classification rule for the chosen row, with a persistent detail surface and predictable dismissal.

> [!IMPORTANT]
> **CM-UX-007 · Medium · Off-hours Live never names the snapshot session or as-of boundary**
> At 06:03–06:07 ET on Monday `2026-08-10`, Live said only `Latest trading day`; its rows used the compact value `08-07 16:59:59`, the footer showed the current `2026-08-10` clock, and no visible element contained the full snapshot date `2026-08-07` or an as-of/load timestamp. A trader must infer that Friday is the intended prior session and cannot distinguish a correct holiday/weekend fallback from delayed or stale data. This weakens trust precisely when the screen is static. A greenfield off-hours banner would say, for example, `Snapshot: Fri Aug 7, 2026 · through 5:00 PM ET`, add an as-of/loaded state, and visibly warn when the expected latest session is unavailable. Acceptance signal: before reading a row, the user can identify the exact represented session, timezone, coverage cutoff, and whether freshness checks passed.

> [!IMPORTANT]
> **CM-UX-008 · Medium · Ticker-tape failure degrades into an unlabeled broken band**
> Every Option Trades viewport showed a 72-pixel full-width gray strip with a centered broken-image icon between primary navigation and the workbench. Read-only DOM inspection identified the region as the TradingView ticker-tape iframe; the strip persisted across Live/Historical switching and a fresh Home → Option Trades return, while Home itself did not show it. The underlying transport failure was not proven and may be environment-specific, so this finding is about the user-visible fallback, not ownership of the outage. A third-party market widget should not reserve prominent blank space or expose browser failure chrome when unavailable. A greenfield shell would collapse the optional region or replace it with a named, compact fallback and retry state. Acceptance signal: blocking the widget host produces no broken icon or anonymous blank band, core content moves up, and any retained fallback clearly says what is unavailable.

#### Round Conclusion

- Greenfield verdict: The off-hours Live skeleton is coherent and resilient enough to deliver current value: paid rows appear, streaming is truthfully unavailable, and mode/route continuity is strong. It is not yet a fully trustworthy evidence surface because the snapshot's exact session is implicit, the same directional heuristic looks factual, row-level reasoning remains pointer-only, and an optional third-party failure has no graceful fallback.
- Findings added or strengthened: Strengthened `CM-UX-004` (Critical) and `CM-UX-006` (Medium); added `CM-UX-007` (Medium) and `CM-UX-008` (Medium).
- Coverage rows updated: Active desktop Option Trades Live market-closed snapshot and controls now have `findings`; active desktop Option Trades mode and Home-return continuity have `good` evidence.
- What remains unknown: Market-hours `Connected` / `Pause`, live row arrival and reading pause, reconnect/failure/retry, stream cleanup after leaving the screen, stale-snapshot behavior, alert enablement, mobile Live, guest/unpaid Live gates, the ticker-tape transport root cause, and production parity.
- Next recommended round: Round 004 — test the active desktop Rank Contracts first-research loop: discover the ranked evidence, interpret freshness and metric uncertainty, inspect one contract drawer, follow the offered Option Trades handoff, and verify the settled destination preserves the intended contract/symbol context without changing saved state.
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change. Round planning, Browser evidence types, deduplication, environment-scoped degraded-state handling, and the completion gate remained clear.

### Round 004 — Active desktop Rank Contracts first-research loop and exact-contract handoff

#### Round Test Plan

- Date/time and timezone: 2026-08-10 06:11:54 EDT (UTC-04:00)
- Environment and build/version if visible: `https://testapp.tradingflow.com`; prior visible build `v0.2.1+01ad1e9`, to be rechecked if visible
- Why this round is next: Rank Contracts is an uncovered core discovery job and the report's named next round. It is also the first tested cross-product journey where the user must understand why a contract is ranked, inspect its mixed-horizon evidence, and trust that Option Trades receives the exact contract rather than a loose symbol guess.
- User job: Find one noteworthy option contract from the latest completed session, understand why it ranks and what its evidence cannot prove, inspect its structural details, then validate that exact contract in Option Trades without manually rebuilding filters.
- Surface and entry point: Continue from the signed-in active-user Option Trades Live handoff, enter Rank through visible primary navigation, and use the Contracts leaf reached by the product rather than starting from a hidden deep link.
- Persona/account proof: Existing test user `active+clerk_test@example.com`; prove the session through `User menu` plus rendered paid Rank rows/drawer and the entitled Option Trades destination, not from prior-round memory alone.
- Viewport and state(s): Desktop at approximately `1280 × 720`; pre-market latest-session Contracts success state, visible ranking/help state, one contract drawer, exact-contract Option Trades handoff, and browser-return context.
- Greenfield first-use hypothesis: Contract discovery should form one auditable chain—name the session and scope, explain the ranking metric and liquidity boundary, expose observed flow separately from settled structure, let the trader inspect one contract, and hand the exact identity to tape validation without suggesting a forecast or dealer intent.
- Novice expectation: Know the represented session and freshness, what made the first contract noteworthy, whether direction and impact are observations or heuristics, which data is intraday versus structural/T+1, what one drawer tab is for, and whether the downstream rows match the chosen symbol, date, put/call, expiration, and strike.
- Journeys and safe actions:
  1. Enter Rank from primary navigation, wait for the paid Contracts list to settle, and inventory page identity, latest session/freshness, off-hours status, active Saved View, scope, effective filters, Contract Opportunity Brief, table order, row count, and metric explanations. Open only read-only help controls.
  2. Open the first visible contract through its ordinary row/Inspect affordance, record the selected contract identity, drawer default tab and available tabs, structure snapshot date/provenance, metric explanations, and the visible path to Option Trades. Close or return only if required to restore context.
  3. Activate the drawer's `Open in Option Trades` action, wait for the destination to settle, and verify the route, committed date, symbol, put/call, expiration, strike, and matching rows. Use browser back once to judge whether Rank returns to the same session/list/drawer context.
- Domain sources read by the operator: `AGENTS.md`; `knowledge/basic_concepts.md`; `doc/domain-knowledge/rank/domain-invariants.md`; `doc/domain-knowledge/rank/functionality.md`; the chaos-monkey runbook; companion Browser setup/safety guidance; current runbook-maintainer, greenfield, and in-app Browser skills.
- Evidence to collect: Host and signed-in proof; visible build; settled Rank route; session, countdown/freshness, Saved View, scope/filter, KPI/card, total/page, and first-row text; exact help copy; viewport screenshots for hierarchy/density; drawer URL/identity/tab/provenance and screenshot; destination route and committed filter chips/rows; back-navigation state; loading/empty/error copy encountered naturally; console only as corroboration.
- Explicit non-goals: No filter/date/scope/Saved View/column/sort/watchlist/export mutation, no AI or element-picker action, no Flow consent/load unless the exact-contract default journey requires it, no notification/billing/account mutation, no mobile/guest/unpaid/production claim, no repository Playwright execution, and no application-code or product-doc change.

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Enter Rank and understand the default ranked universe | Signed-in entitled Option Trades Live with `User menu`; expected primary navigation to reach a clearly dated, bounded contract-discovery surface without changing saved state. | Activated the visible primary `Rank New` control, waited through the shell-only load, then read the settled page and opened only calculation/header help. | `/app/rank/contracts` settled with `User menu`, build `v0.2.1+01ad1e9`, `Session 2026-08-07`, `Last trade 3d ago`, exact last-trade timestamp, market-open countdown, `Default · 0`, disabled `Clear filters`, `378145 ranked contracts`, 50 visible rows, and `Page 1 of 7563`. The page explicitly said it mixes intraday delayed flow with prior-session OI and daily volume context. Opportunity cards disclosed eligible, thin-excluded, and unknown counts, while calculation controls explained the formulas and liquidity floor. The table's `GEX Sentiment` values included `Resistance` and `Support`; its help explicitly defined POSITIVE-regime OTM calls/puts as `Resistance`/`Support (walls)` and NEGATIVE-regime OTM calls/puts as `Bullish Target`/`Bearish Target (acceleration targets)`, even though the regime is symbol-level and same-side OTM contracts share a label. | `R004-D1`: route, user proof, session/freshness text, saved-view/filter state, card values/help, record/page counts, first rows, and exact GEX Sentiment help. Two viewport screenshot attempts timed out, so no visual density or clipping conclusion is made. | Finding: `CM-UX-009` |
| Inspect one ranked contract and separate flow from structure | Settled default Contracts list; expected a normal row action to preserve exact identity, default to Tradeability, and expose structural provenance rather than blending it into the ranking signal. | Opened the first visible contract through a non-action row cell, then inspected the drawer identity, selected tab, caveat, snapshot label, and available handoff without activating AI, selection, history load, or watchlist controls. | The drawer URL encoded `selectedOptionSymbol=GTIM261218C00002500&drawerTab=tradeability`; its header showed `GTIM $2.5 Call · 2026-12-18 (133d)`, `STOCK`, `OTM`, latest session `2026-08-07`, and refresh time. `Tradeability` was selected by default beside `Flow` and `Positioning`. It labeled `Latest structure snapshot · 2026-08-07` and warned that OI, quotes, and greeks were the most recent session snapshot, not the intraday flow that ranked the contract. | `R004-D2`: drawer URL, exact OCC identity, selected-tab state, caveat, structural snapshot copy, metrics, and available `Open Option Trades` link. | Good design |
| Validate exact identity in Option Trades and return | GTIM 2026-12-18 CALL $2.5 Tradeability drawer; expected the offered handoff to commit symbol, Rank session, put/call, expiry, and strike—but not moneyness—and Back to restore the inspected context. | Activated `Open Option Trades`, waited for Historical to finish loading, compared the applied summary and rows with the drawer identity, then used Browser Back once. | Historical settled on date `2026-08-07` with ticker `GTIM` and Applied Filters `Expiry: 2026-12-18`, `Type: CALL`, and `Strike Price: 2.5 to 2.5`; no moneyness filter was applied. It rendered 46 records, and the observed rows matched GTIM, CALL, 2026-12-18, and $2.5. Back restored the Rank query, same GTIM drawer, selected Tradeability tab, session/list content, and 51 table rows including the header. The destination address remained the generic `/app/option-trades/historical`, so refresh/share durability was not inferred. | `R004-D3`: before/destination/return routes; settled date, ticker, applied-filter text, total and row identities; restored drawer text, selected tab, and row count. | Good design; refresh/share persistence untested |

#### What is good

- Keep the top-level provenance chain. Rank names the completed session, last-trade age and timestamp, market countdown, mixed-horizon caveat, eligible/excluded counts, and formula definitions before the user opens a contract.
- Keep Tradeability as the ordinary row-click default and retain the drawer's stronger structural warning: it gives the exact contract identity, snapshot date, and a plain statement that OI, quotes, and greeks are not the intraday flow that produced the rank.
- Keep the exact-contract handoff behavior. It committed symbol, date, call/put, expiry, and strike without leaking moneyness, returned 46 matching tape rows, and Browser Back restored the inspected Rank context.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-009 · Critical · Rank turns a contextual GEX regime into support, resistance, and price targets**
> The default table already labels OTM contracts `Support` or `Resistance`. Its own visible help says a symbol-level POSITIVE regime makes OTM calls `Resistance` and OTM puts `Support (walls)`, while a NEGATIVE regime makes them `Bullish Target` or `Bearish Target (acceleration targets)`; it also admits that every same-side OTM contract for a symbol shares the label. This is unreasonable for a novice because a mechanical regime-plus-moneyness mapping is presented as an actionable level and directional destination, encouraging the trader to infer dealer intent, causality, or a forecast that the evidence does not establish. Greenfield target: describe only the observed structural regime and the contract's relative location, with an explicit non-forecast boundary. Acceptance signal: no Rank UI, table value, or help copy derives `support`, `resistance`, `bullish`, `bearish`, `target`, `wall`, or equivalent prediction language from this mapping; the explanation states what is measured, its date, and what cannot be inferred.

#### Round Conclusion

- Greenfield verdict: The session/provenance design, drawer boundary, and exact-contract handoff form a strong auditable research chain, but the semantic layer fails the safety bar by converting contextual GEX structure into forecast-like walls and targets. Preserve the evidence plumbing and redesign that interpretation before treating Rank Contracts as safe first-use guidance.
- Findings added or strengthened: Added `CM-UX-009` (Critical).
- Coverage rows updated: Rank Contracts active desktop success path is now `findings`; Rank Contracts → Option Trades exact-contract continuity is `good`. Mobile, access gates, state mutation, refresh/share persistence, and error/degraded paths remain untested.
- What remains unknown: Whether the exact filters survive a destination reload or copied generic URL; Rank Contracts mobile and guest/unpaid gates; Saved Views, filter/scope changes, columns, sorting, pagination, export, alternate sessions, negative-regime target rows in context, and natural empty/error/degraded states.
- Next recommended round: Round 005 — test the active desktop Rank Symbols first-research loop across GEX, volatility, and chain context, including freshness/non-forecast explanations and any offered Option Trades handoff, without changing saved or durable state.
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change. The plan-before-Browser gate, evidence ladder, highlighted-finding format, deduplication rule, and completion criteria remained clear during execution.

### Round 005 — Active desktop Rank Symbols first-research loop and symbol-only handoff

#### Round Test Plan

- Date/time and timezone: 2026-08-10 06:23:24 EDT (UTC-04:00)
- Environment and build/version if visible: `https://testapp.tradingflow.com`; prior visible build `v0.2.1+01ad1e9`, to be rechecked from the product shell
- Why this round is next: Rank Symbols is the remaining uncovered half of the core Rank research job and the report's named next round. It asks a novice to connect a separately sourced full-chain catalog, a lightweight flow overlay, multiple structural horizons, and an identity-only Option Trades handoff without mistaking any one layer for a prediction.
- User job: Discover one noteworthy underlying symbol, understand why it appears in the leaderboard and how fresh each evidence layer is, inspect its GEX, volatility, and chain context, then validate the symbol in Option Trades without manually rebuilding identity.
- Surface and entry point: Continue from the signed-in active-user Rank Contracts drawer left by Round 004, close it only if necessary, and enter Symbols through the visible Rank workbench control rather than a hidden deep link.
- Persona/account proof: Existing active test user `active+clerk_test@example.com`; prove entitlement through `User menu`, settled paid Symbols rows, structural drawer tabs, and the entitled Option Trades destination rather than relying on prior-round session memory.
- Viewport and state(s): Desktop at approximately `1280 × 720`; pre-market latest-completed-session Symbols success state, one symbol drawer across Overview/GEX/Vol/Chain, symbol-only handoff, and Browser Back restoration.
- Greenfield first-use hypothesis: Symbol discovery should be one source-honest chain—name the catalog session, distinguish full-chain structure from the separately timed flow overlay, lead with a comprehensible ranking reason, progressively disclose GEX/volatility/chain evidence with horizon and uncertainty at the point of use, and pass only symbol identity into tape research.
- Novice expectation: Understand the represented session, why the first symbol is noteworthy, which values are flow versus full-chain structure, whether GEX language is descriptive rather than predictive, how IV/RV and surface coverage differ, what the Chain tab represents, and whether the downstream tape matches the selected symbol and session.
- Journeys and safe actions:
  1. Switch from Contracts to Symbols through the visible workbench control, wait for the canonical leaderboard to settle, and inventory page identity, catalog/flow provenance, off-hours status, active Saved View, scope/filter state, column hierarchy, first row, total/page counts, and accessible metric explanations.
  2. Open the first visible symbol through the ordinary row affordance, verify Overview is the default, record exact symbol/session/source identity and available tabs, then inspect GEX through its visible tab or direct shortcut. Read the default scope, regime, Level Map, provenance, uncertainty copy, and naturally visible loading/empty/degraded states without changing scope or expanding evidence libraries.
  3. Inspect Vol and Chain through their drawer tabs, recording horizon/source/coverage and quote/structure boundaries. Do not consent to Flow. Activate `Open in Option Trades`, verify the destination's committed symbol/date and matching rows, then use Browser Back once to judge whether the same symbol, tab, session, and list context return.
- Domain sources read by the operator: `AGENTS.md`; `knowledge/basic_concepts.md`; `doc/domain-knowledge/rank/domain-invariants.md`; `doc/domain-knowledge/rank/functionality.md`; the chaos-monkey runbook; companion Browser setup/safety guidance; current runbook-maintainer, greenfield, and in-app Browser skills.
- Evidence to collect: Host and signed-in proof; visible build; settled Symbols route; catalog session and source/freshness text; Saved View/scope/filter state; table headers, help, total/page, and first-row identity; drawer URL/default tab/tabs/source copy; GEX default scope, Level Map, provenance and no-forecast language; Vol horizons, support/coverage and missing-value behavior; Chain structure/quote state; destination route, date, symbol and matching rows; Back state; screenshots only for claims about hierarchy, clipping, charts, or layout; console/network only as corroboration.
- Explicit non-goals: No filter/date/scope/Saved View/column/sort/watchlist/export mutation, no AI or element-picker action, no `Load flow evidence`, no GEX scope change, no 3D expansion, screenshot export, external TradingView link, notification/billing/account mutation, mobile/guest/unpaid/production claim, repository Playwright execution, or application-code/product-doc change.

#### Browser Execution

| Journey | Starting state and expectation | Browser action | Settled visible result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Enter Symbols and understand its canonical universe | Signed-in GTIM contract drawer from Round 004; expected the visible Symbols tab to atomically replace Contract-specific summary/provenance with the independent full-chain symbol catalog. | Closed the contract drawer, activated the visible `Symbols` workbench tab, waited for `/app/rank/symbols` to settle, then read the toolbar, help, table, first rows, and pagination without changing any view state. | `User menu` and build `v0.2.1+01ad1e9` proved the entitled test session. The heading changed to `Symbol-level analysis`, and the table correctly said `6,094 symbols from the full option-chain snapshot`, rendered 25 rows plus its header, and showed `Page 1 of 244`, `Default · 0`, disabled `Clear filters`, and the flow/GEX/volatility/reference columns. However, the hero immediately underneath still said `Contract-level analysis mixes intraday delayed option flow with prior-session open interest and daily volume context`, retained all four Contract Opportunity Brief cards and exact contract leaders, reused `Last trade Aug 7, 4:59:59 PM EDT`, and gave Refresh the title `Refresh ranked contract data`. `About GEX Env` described an intraday-overlay/structural-fallback choice, but each row badge exposed only `Positive` or `Negative` with no source or as-of label; moving to the GTIM badge produced no source tooltip. | `R005-D1`: route, user/build proof, heading/caveat/cards, toolbar titles, table identity/count/page, first three rows, metric-help text, badge name, and missing tooltip. One viewport screenshot attempt timed out, so no visual hierarchy, clipping, or density conclusion is made. | Finding: `CM-UX-010` |
| Inspect GTIM Overview and Gamma Exposure | Settled first-page Symbols table; expected one-click structural inspection, Overview by default, source/session identity, descriptive GEX, and a visible symbol-only path to tape research. | Activated `Open symbol drawer for GTIM`, inspected the default tab and header actions, then closed/reopened through the first row's direct `Open Gamma Exposure for GTIM` shortcut and let the default GEX chart settle. | The drawer deep-linked to `selectedSymbol=GTIM&drawerTab=overview`, selected Overview by default, and offered Overview, Flow, Positioning, Gamma Exposure, Vol, and Chain. Overview named `Session Aug 7, 2026`, exposed the flow/OI/volatility cards, and labeled its GEX summary `Intraday · all expiry`. The direct GEX shortcut reached `drawerTab=gex` in one action. GEX defaulted to All expirations and disclosed horizon shares (All 100.0%, 0DTE 0.0%, Weekly 0.0%, Monthly 0.5%), repeatedly said structure is not a directional or price forecast, bounded daily candles to the session, identified prior-close T+1 GEX, and named `Structure built 5:41 PM EDT`. Across Overview, GEX, Vol, Chain, and the settled Flow consent shell, the header actions were only Change, Ask AI, Select, and Close; there was no `Open in Option Trades` text, button, or link anywhere in the drawer or page. | `R005-D2`: Overview/GEX routes, selected-tab states, exact session/source/scope/caveat/provenance copy, settled price-bar text, complete drawer action inventories, and zero handoff-control matches. | Good structural disclosure plus finding: `CM-UX-012` |
| Compare Vol, Chain, consent, and the promised handoff | GTIM GEX drawer; expected volatility and chain views to preserve exact prices, disclose measurement support and horizons, keep Flow behind consent, and offer the documented symbol-only handoff. | Switched to Vol and Chain, inspected the settled evidence, switched to Flow without activating `Load flow evidence`, then returned directly to GEX. The handoff could not be activated because its control was absent, so no Option Trades destination or Browser Back result was claimed. | Vol clearly labeled IV30's `Vol snapshot 2026-08-07`, RV20/RV30 `Through 2026-08-07`, the forward-versus-trailing boundary, one-year context, and a traded-session surface with 1 measured cell, 0 interpolated cells, 100% measured coverage, explicit unsupported rules, and `not a full quoted option chain`. But its 3D context displayed `Strike range $3 - $3`, and its flat grid column was `$3`, while the same tab's measured smile and the Chain table both showed the sole strike as `$2.5`. The Symbols row likewise showed GTIM Spot as `$1` with no exact-value tooltip, while Overview showed `S $1.47` and GEX price evidence showed $1.40–$1.50. Chain honestly labeled `Traded chain · 1 expiry`, `2026-12-18`, `133DTE · 1 strike`, and exact bid/ask/last fields. After settling, Flow contained only `Load flow evidence` and `Runs one server query`; it was not activated. | `R005-D3`: Vol/Chain/Flow routes and selected tabs; exact horizon, coverage, provenance, spot/strike, surface, Chain, and consent-shell text. Read-only source inspection corroborated that the affected presentation paths use whole-dollar formatters; this was classification support, not Browser evidence. | Good source honesty plus findings: `CM-UX-011`, `CM-UX-012` |

#### What is good

- Keep the direct structural inspection model. A row opens Overview by default, and both the fixed Inspect shortcut and populated GEX badge provide one-action entry to a stable `selectedSymbol` plus `drawerTab=gex` deep link.
- Keep the GEX tab's scope and uncertainty contract. It names the session and build time, discloses horizon shares, distinguishes daily price bars from prior-close T+1 structure, and repeats that modeled hedging context is not a directional or price forecast.
- Keep Vol's evidence boundary: actual dates, forward-versus-trailing horizons, measured/interpolated/unsupported counts, explicit coverage, point-only behavior, and the statement that traded-session observations are not a full quoted chain are exactly the progressive disclosure a novice needs.
- Keep the Chain and Flow access boundaries. Chain identifies a traded chain, expiry, DTE, exact strike, and quote fields; Flow settles to a minimal one-query consent shell and did not load before consent.

#### Bad — highlighted findings

> [!IMPORTANT]
> **CM-UX-010 · Critical · The Symbols leaf presents Contract Rank's universe and freshness as its own header**
> On `/app/rank/symbols`, the heading says `Symbol-level analysis`, but the next sentence is the Contract-level mixed-horizon caveat and the entire Contract Opportunity Brief remains above the independent 6,094-symbol catalog, including exact contracts, contract eligibility counts, the Contract last-trade timestamp, and a Refresh title that says `ranked contract data`. At row level, GEX badges say only `Positive`/`Negative`; help admits each may use either an intraday overlay or structural fallback, but the row does not identify which one or when. This is unreasonable because the Symbols universe is separately built and separately refreshed: a novice can attribute contract-tape leaders and Contract freshness to full-chain symbol structure, then treat a mixed-source row as one coherent live observation. Greenfield target: the active leaf owns one unmistakable source/provenance story and only summaries computed for its canonical universe. Acceptance signal: switching to Symbols removes or explicitly separates all Contract-only cards/copy/timestamps, Refresh names the active source, and every GEX summary identifies its actual source and applicable as-of boundary.

> [!IMPORTANT]
> **CM-UX-011 · Critical · Whole-dollar formatting changes a real option strike into a different strike**
> GTIM's Vol tab displayed its sole strike as `Strike range $3 - $3` and labeled the flat grid `$3`, while its measured smile and the adjacent Chain tab showed the actual contract strike as `$2.5`. The leaderboard also reduced GTIM Spot to `$1` with no exact-value tooltip while Overview showed `$1.47` and the selected-session price evidence was $1.40–$1.50. This is not cosmetic precision: strike and spot define contract identity, moneyness, distance, and execution context, so rounding $2.50 to $3.00 can lead a trader to research or trade the wrong instrument. Greenfield target: price formatting is instrument- and tick-aware, with exact semantic values preserved everywhere. Acceptance signal: a $2.50 strike always renders as $2.50 (or an equally exact representation), low-priced spot retains meaningful cents, chart/grid/tooltip/accessible text agree, and no formatter maps one exercise price to another.

> [!IMPORTANT]
> **CM-UX-012 · High · The documented Symbols-to-Option-Trades continuation does not exist in the drawer**
> The settled GTIM drawer exposed only Change, Ask AI, Select, and Close across Overview, GEX, Vol, Chain, and the Flow consent shell. There was no visible text, button, link, or accessible name matching `Open in Option Trades`, so the round could not test the symbol-only destination or Browser Back restoration. This breaks the core discovery-to-validation job and forces the trader to leave Rank and manually re-enter identity, risking context loss. Greenfield target: the next validation step is a stable primary/secondary action in the drawer header, independent of the selected evidence tab. Acceptance signal: every symbol drawer tab exposes one keyboard-accessible `Open in Option Trades` action, the settled destination contains only the selected symbol plus the appropriate session/mode, and Back restores the same symbol, tab, session, and list context.

#### Round Conclusion

- Greenfield verdict: The drawer's progressive evidence model is close to a strong greenfield design—especially GEX provenance, Vol support disclosure, exact Chain evidence, direct tab links, and Flow consent—but the entry surface collapses two canonical universes, exact price identity is rounded incorrectly, and the promised tape-validation exit is absent. Those failures make the otherwise strong research chain unsafe and incomplete for first use.
- Findings added or strengthened: Added `CM-UX-010` (Critical), `CM-UX-011` (Critical), and `CM-UX-012` (High).
- Coverage rows updated: Rank Symbols active desktop success path is now `findings`; Rank Symbols → Option Trades symbol-only continuity is `findings` because the source control was absent and its destination/Back behavior remains untestable.
- What remains unknown: Symbol handoff destination and Back restoration; mobile and guest/unpaid access; alternate symbols and missing-source states; GEX scope changes, evidence-library expansions, intraday intervals, expanded 3D interaction, visual chart/layout quality, Saved Views, Vol preset persistence, filters/scope, export, and natural empty/error/degraded recovery.
- Next recommended round: Round 006 — test the active desktop Market Recap first-research loop: discover the represented recap session and provenance, understand one summary without internal terminology, follow one offered cross-route action, and verify the settled destination preserves the recap's symbol/date intent without mutating product state.
- Repository Playwright E2E scripts were not run.
- Runbook maintenance: no change. The round-selection, plan-before-Browser, evidence, deduplication, blocked-journey, and self-maintenance rules remained clear. The companion's optional auth-document path was absent, but the authoritative seeded-account fixture remained available and unchanged.
