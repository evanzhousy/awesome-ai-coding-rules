# Chaos Monkey Report

This is the one living report for [`chaos-monkey-ux-review.md`](./chaos-monkey-ux-review.md). It records round-based, Browser-observed TradingFlow UX evidence from the perspective of a first-time novice trader with experienced product-manager judgment.

Preserve completed round narratives. Update the status, coverage ledger, and finding register as each new round is appended.

## Report Status

- Last updated: 2026-08-10 05:30 EDT (UTC-04:00)
- Last completed round: Round 001
- Environment: `https://testapp.tradingflow.com`; visible build `v0.2.1+01ad1e9`
- Overall state: Round 001 complete; planned coverage remains in progress
- Next recommended round: Round 002 — entitled desktop Option Trades Historical first-research loop
- Residual unknowns: Signed-in behavior, post-auth intent restoration, mobile entry, all core research workbenches, secondary surfaces, and naturally reachable loading/empty/error/degraded states remain untested

## Coverage Ledger

`untested` is not a pass. Split or add rows when a persona, viewport, state, or newly visible surface creates a materially different user job.

| Area / user job | Persona | Viewport | State or boundary | Status | Round / evidence |
| --- | --- | --- | --- | --- | --- |
| Entry, product comprehension, and first useful value | Guest | Desktop | First visit / public Home / guided workflow | `findings` | Round 001; `CM-UX-001`, `CM-UX-002` |
| Entry, navigation, and first useful value | Guest | Mobile | First visit / responsive shell | `untested` | — |
| Auth and premium-gate intent recovery | Guest | Desktop | Signed out / gated destination / dismiss and return | `findings` | Round 001; `CM-UX-001`, `CM-UX-003` |
| Account, billing, and access recovery | Active / unpaid or canceled / trial when relevant | Desktop / mobile as materially different | Entitled, gated, account, billing, return path | `untested` | — |
| Home and path to a research decision | Active | Desktop / mobile as materially different | Initial load, success, empty/degraded when reachable | `untested` | — |
| Global ticker search, Watchlists, navigation, and announcements | Guest / active | Desktop / mobile as materially different | Discover, switch context, return | `untested` | — |
| Option Trades Historical | Active plus guest/unpaid gate where relevant | Desktop / mobile | Load, interpret, filter, no-result/error, restore context | `untested` | — |
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
