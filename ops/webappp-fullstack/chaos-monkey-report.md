# Chaos Monkey Report

This is the one living report for [`chaos-monkey-ux-review.md`](./chaos-monkey-ux-review.md). It records round-based, Browser-observed TradingFlow UX evidence from the perspective of a first-time novice trader with experienced product-manager judgment.

Preserve completed round narratives. Update the status, coverage ledger, and finding register as each new round is appended.

## Report Status

- Last updated: 2026-08-10
- Last completed round: None
- Environment: Default is `https://testapp.tradingflow.com`; no environment has been tested yet
- Overall state: Not started
- Next recommended round: `Round 001` — guest first entry, product comprehension, and path to first useful value on desktop
- Residual unknowns: All product surfaces, personas, viewports, and runtime states remain untested

## Coverage Ledger

`untested` is not a pass. Split or add rows when a persona, viewport, state, or newly visible surface creates a materially different user job.

| Area / user job | Persona | Viewport | State or boundary | Status | Round / evidence |
| --- | --- | --- | --- | --- | --- |
| Entry, product comprehension, and first useful value | Guest | Desktop | First visit / success path | `untested` | — |
| Entry, navigation, and first useful value | Guest | Mobile | First visit / responsive shell | `untested` | — |
| Auth, access gate, intent recovery, account, and billing | Guest / active / unpaid or canceled / trial when relevant | Desktop / mobile as materially different | Signed out, entitled, gated, return path | `untested` | — |
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
| Cross-surface continuity and recovery | Relevant persona | Desktop / mobile as materially different | Back, reload, drawer/tab/route handoff, interrupted flow | `untested` | — |
| Final holistic free-exploration sweep | Mixed, within safe read-only boundary | Desktop and mobile | Unscripted but hypothesis-led | `untested` | — |

## Finding Register

No findings have been recorded. New findings use stable IDs in the form `CM-UX-NNN`; repeated evidence updates the existing row instead of creating a duplicate.

| ID | Severity | Status | User job / surface | First round | Last round | Evidence summary |
| --- | --- | --- | --- | --- | --- | --- |

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

No rounds have been completed.
