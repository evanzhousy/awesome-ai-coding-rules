---
name: webapp-check-error
description: Check production errors from the last 24 hours across PostHog Error Tracking and Better Stack (all error channels). Cluster findings, separate noise, state likely root causes, and propose a fix plan. Do not implement fixes unless the user asks.
disable-model-invocation: true
---

# Webapp production error check (last 24h)

Pull **past 24 hours** of production errors from every error channel, cluster them, and report what to fix. Investigate only — do not implement code, change observability routing, or resolve/suppress issues unless the user explicitly asks after the report.

## Recommended Invocation

Use `/goal` for a complete run with this objective: collect the rolling 24-hour PostHog and Better Stack evidence, correlate clusters, separate noise, and stop at an evidence-backed fix plan. Success means fresh source IDs, a project-bound PostHog result, top patterns from both Better Stack channels, explicit confidence per cluster, and no implementation or issue-state mutation.

## Agent Handoff

Last updated: 2026-10-24. Executed **2026-10-22T16:57:42Z → 2026-10-23T16:57:42Z** (**2026-10-22 23:57:42 → 2026-10-23 23:57:42 Bangkok**). PostHog was explicitly bound to production project `300646`; Better Stack resolved fresh to Errors application `2412994` and Info source `2357910`. PostHog returned **85 app exceptions across 12 issues** plus **1 landing-only event**, excluded from app impact. Better Stack Errors returned **13 patterns / 21 exceptions**; Info returned **85 error-level rows**. These are overlapping sinks with different coverage and filters, not additive incident counts.

Public `version.json` was **0.35.0 / 0cc0d3f82a1117c1164528673bcacfa6b5905c71**, built **2026-10-21T19:07:59.086Z**. No deployment boundary occurred inside the review window. PostHog's backend (`posthog-node`) issues have **0 browser sessions**; do not present their user counts as browser-session counts. Five sampled error sessions had no matching recordings, so rendered recovery remains unverified.

### Look First

- [ ] **Repair the stale Saved View target contract.** PostHog `01a14e51-b0e8-7eb3-b7e1-af49c14b0d46` and Better Stack pattern `aca7854151008c15beb2bfb7449a02ae91596c42dee12cd721fa9e7af3041d2f` each have one `Saved Filter Set not found` event. `selectOptionTradesSavedFilterSetByUserId` throws a generic `Error`, which `handlePreferencesError` returns as `INTERNAL_SERVER_ERROR`; the client therefore misses `OPTION_TRADES_PREFERENCE_CONFLICT` and the page's explicit Retry branch. The active view is not committed before selection succeeds, but the expected conflict lacks the recoverable Retry experience. Greenfield boundary: the preference repository owns “target deleted” as a typed 409 conflict; the client preserves the current work, refreshes metadata, and retries only on explicit user action. Browser verification: two signed-in sessions, delete in one, select the stale target in the other; confirm the prior view/rows remain, a Retry action appears, and only the refreshed selection applies.
- [ ] **Find the originating Live SSE failure before changing retry policy.** PostHog `01a0203b-df75-7201-b0d8-bbf206799c52` has **63** terminal reports / 2 users / 3 browser sessions. Better Stack Info pattern `0a8a47a22b4a15da526b7baad22fa991` has **63** reports, each with a distinct `liveSessionId` and `correlationId`; 62 end as `server_error`, one as `stream_close`, all at attempt 3. No same-ID healthy recovery follows any of the 63 terminal outcomes in the window. The lifecycle is bounded, but the cause is not: inspect typed transport/status/error detail at `src/platform/sse-stream` and `useLiveMode`; preserve the existing 3-retry policy until a real source failure is reproduced. Browser verification should confirm one terminal notification, current Live data behavior, and explicit Retry without widening filters or changing tabs.
- [ ] **Separate slow Historical reads from UI query churn.** PostHog has **5 stats** (`019ff76b-5790-7fd0-b0ca-a363de3832e5`) and **6 row** timeouts across three issues (`019ff375-63ae-7fa3-bd04-3da12fa733b3`, `01a0b848-c5d5-7280-855b-069fd512ba6c`, `01a07a65-25b3-77e1-9550-2319a8fbdf70`). Better Stack Info shows five Historical row and five stats timeout logs plus one Live row timeout; sampled elapsed times reach **26–54s** against 22–25s client deadlines, with up to **31.6s** timeout drift and **2.3–6.4s** stats queue delay. Most samples were visible and online; two row samples were hidden. `statsSerializedBehindRows=true` is intentional, not proof of a rendering loop. Trace query generation/cancellation and server query timing, then Browser-reproduce changed filters, hide/resume, and supersession; preserve selected scope/date and do not simply lengthen deadlines.
- [ ] **Keep Rank live reads on the published service artifact and diagnose its two failure stages.** PostHog backend issues `01a169a4-99bb-7be1-9b16-7d7dd8910678` (3) and `01a16528-61df-7963-812d-2109d1a78efe` (2) are `posthog-node`, with 0 browser sessions. Info confirms three `snapshot` reads ended in `AbortError` at the 15s client deadline and two `meta` reads returned HTTP 500; correlation IDs are absent. Check the CF Live Contracts service by route, timing, session, and published version. The product contract forbids rebuilding Latest from ClickHouse when the published file is unavailable.
- [ ] **Fix MCP SQL error ownership separately from Rank UI.** PostHog `019f90d5-681c-7fc1-b926-b93f15580819` has two backend events / 1 user / 0 sessions: one compares `DateTime` to a concatenated `String`; the other compares `AggregateFunction(any, String)` to `String` while reading `mv_contract_rank_flow`. Better Stack emits both under one metrics pattern, so inspect each raw cause rather than assuming one root cause. The SQL text and `mcp.rpc` tag point to caller-authored MCP SQL rather than the Rank page; confirm the exact tool from request context. At the shared read-only SQL boundary, return safe 4xx guidance for supported caller type mistakes instead of `mcp.rpc` `error.P1`; keep database read-only access and the Rank API's published-file source intact. Per ClickHouse `schema-types-native-types`, date/time comparisons must remain typed.

Other low-volume signals: one Rank-page dynamic import failed for `betterstack.browser` (telemetry chunk; impact unverified); one Rank snapshot `Load failed` is paired at the same time with `contractRank.snapshot` telemetry, but no recording proves what the user saw; one landing-only event is excluded. A backend `Timeout error.` and a separate watchlist `Load failed` remain low-confidence. This run changed only this handoff/procedure and its mirror; no application code, production state, deployment, or issue status was changed.

## Channels to check

| Channel                            | Role                                  | What to query                                                                                                              |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **PostHog Error Tracking**         | Browser + backend `$exception` issues | Project **300646**; retain app backend operations and frontend `app.tradingflow.com`, exclude landing-only frontend events |
| **Better Stack Errors**            | Durable error patterns / stacks       | `WebFullStack-Errors` application — top patterns for the same window                                                       |
| **Better Stack Info** (optional)   | Diagnosis context around errors       | `WebFullStack-Info` logs — `correlationId`, `scope`, `operation`, `requestUrl` when a cluster needs more context           |
| **Better Stack incidents / Slack** | Human alert feed                      | Glance only when PostHog/Better Stack need a quick cross-check of recent escalations; not a primary query source           |

Policy detail: [`ops/harness/observability-rules.md`](../harness/observability-rules.md). Explicit trusted backend `error.P0` routes to PostHog + Better Stack and Better Stack owns immediate incident creation. Individual `error.P1` routes to PostHog + Better Stack; Better Stack creates a Slack-visible incident only after the configured threshold monitor fires. Browser-relayed telemetry is server-clamped to P1. Split PostHog issues by `channel` = `frontend` | `backend` when ranking blast radius.

## When to use

- “What broke in prod in the last 24 hours?”
- Daily / ad-hoc error health across PostHog + Better Stack
- Need clusters, confidence, and a smallest safe fix plan before coding

## When not to use

- Product analytics, funnels, retention → PostHog product analytics runbooks
- One local stack with no production correlation → debug that path directly
- “Just fix it” with no evidence → confirm the production signal first, or get explicit approval to skip triage

## Workflow

Default window: **last 24 hours**. Override only if the user names a different range.

### 1. Resolve Better Stack IDs

Call live Better Stack tools first (do not hardcode stale IDs):

1. List applications → pick **`WebFullStack-Errors`** → record `application_id`
2. List sources → pick **`WebFullStack-Info`** → record `source_id`
3. Call errors query help / instructions for that `application_id` before writing SQL

Last observed (may be stale): Errors `2412994`, Info `2357910`. Always resolve fresh.

Live Cursor tool names on `user-betterstack` are typically: `applications`, `sources`, `errors`, `error`, `query`, `errors_query_help`, `query_help`. Older docs may say `telemetry_*` — map to the live names.

### 2. PostHog — list active issues

1. Confirm project **300646** / **TradingFlow Web — Production**. This project now contains both landing and app traffic: retain recognized webapp backend operation issues even when they have no browser URL; for frontend issues include `app.tradingflow.com` (or `app_namespace=tradingflow-webapp`) and exclude landing-only `tradingflow.com` events unless they correlate to an app handoff. Project selection is not durable across every connector call: explicitly re-select it before each list/detail batch and verify returned `_posthogUrl` values contain `/project/300646/`. A 404 or URL for another project means the connector reset; re-select and rerun rather than reporting zero.
2. If the bundled connector exposes a single PostHog command wrapper, follow its advertised protocol: use `tools` / `search` for discovery, `info <tool>` once for the schema, then `call --json <tool> <input>`. When `learn -s` works, load a selected skill using its exact qualified name, for example `learn posthog:triaging-error-issues`. Load the installed PostHog skill as the local fallback if that handshake is unavailable; record the failure as connector drift, but do not call PostHog unavailable when the advertised read tools still work.
3. Prefer Error Tracking list tools (`query-error-tracking-issues-list` or whatever the live schema exposes).
4. Defaults: `status=active`, `date_from=-24h`, order by `occurrences` DESC, limit ~25–50.
5. For top issues, pull detail / sampled events for `channel`, `scope`, `$pathname` / `$current_url`, stack, users/sessions.
6. Generic `TypeError`, `Failed to fetch`, and dynamic-import issues may combine unrelated failures under one fingerprint. Paginate their sampled events and group exact exception values plus current URLs before assigning ownership or root cause. If a sampled event is app-scoped but the typed detail omits its structured owner, perform PostHog schema discovery and query only that exact event UUID for bounded fields such as `scope`, `operation`, `requestStage`, `failureKind`, `serverModule`, `serverExport`, `route`, and `correlationId`.
7. For `posthog-node` / backend issues, do not treat `users` or zero `sessions` as customer impact. Backend `distinct_id` may represent an operation identity; use correlation IDs, frontend events, or authenticated browser evidence for blast radius.
8. When a browser issue has session IDs, sample available recordings across both active and inactive sessions. Compare recording duration with active time and verify the rendered product state. A late or missing initial replay snapshot is an evidence blocker for the omitted interval; do not infer that the visible frame caused earlier telemetry or count each event as a user-visible outage.

**HogQL fallback** when only query access exists:

```sql
SELECT
  timestamp,
  properties.$exception_type AS exception_type,
  properties.$exception_message AS exception_message,
  properties.$exception_issue_id AS issue_id,
  properties.$current_url AS current_url,
  properties.$pathname AS pathname,
  properties.channel AS channel,
  properties.scope AS scope,
  properties.$session_id AS session_id
FROM events
WHERE event = '$exception'
  AND timestamp >= now() - INTERVAL 24 HOUR
ORDER BY timestamp DESC
LIMIT 100
```

If PostHog tools are unavailable, say so explicitly — **blocked ≠ zero**. Do not fall back to browser UI unless the user asks.

### 3. Better Stack — top error patterns

1. Use the SQL rules from step 1 (collection names change; do not copy old SQL blindly).
2. Substitute a 24h window, e.g. `dt BETWEEN now() - INTERVAL 24 HOUR AND now()`, and `environment = 'production'` when the column exists.
3. Rank by pattern count / last seen (LIMIT ~50).
4. Drill top patterns with `error` detail or exceptions SQL for stacks and structured fields (`surface`, `operation`, `correlationId`, `requestUrl`).

### 4. Correlate and cluster

If the active production build changed inside the 24-hour window, read public `version.json`, record its `builtAt`, and split evidence into pre-/post-build slices. State the post-build slice duration; silence in a short slice is not proof that an unchanged path is fixed.

A release boundary is correlation, not causation. Diff the deployed commit against the prior deployed source (or nearest source parent) and inspect blame before calling a recent deployment a regression; documentation-only redeploys and bundle rotations can create new fingerprints without changing the failing code.

Align PostHog issues with Better Stack patterns using, in order:

1. Same time slice
2. `correlationId`
3. `scope` + `operation`
4. `requestUrl` / route / `$pathname`
5. Stack top frames
6. `channel` (`frontend` vs `backend`)

Better Stack Errors and Better Stack Telemetry are two sinks, not two independent incidents. Never add their counts. Collapse duplicate reports by `correlationId`; when an ID is absent, compare operation, request stage, route/scope, and sub-second timestamps, and report the missing-ID limitation explicitly. A client wrapper, `serverFn.uncaught`, authored server error, and query-layer error can all describe one failed request.

An Error Tracking `pattern` ID is not a root-cause guarantee: Better Stack may group distinct ClickHouse type errors in one pattern. Inspect sampled/raw exception text and structured `cause`/type before clustering; compare the failing columns' native types. Likewise, PostHog `posthog-node` issues with zero browser sessions are backend operations, not browser-session evidence.

An app-owned frontend `Failed to fetch` can appear in PostHog without a Better Stack counterpart when the browser transport itself is impaired: the Better Stack client relay also uses a same-origin fetch. Treat this as a sink-coverage gap, not proof that the structured `reportError` path did not run or that Better Stack observed zero impact.

A recovery summary's emission time is not necessarily its observation time. Check `reportReason` and the summary's recorded transitions: a terminal-stop or unmount flush can publish an earlier healthy-window recovery. Do not count that flush as recovery after the terminal failure. Likewise, inspect structured wrapper errors and their preserved causes before accepting message-derived business/transient classification; that classification can control whether an owned cached snapshot is retained.

For reconnecting or retrying lifecycles, aggregate success/error totals are not recovery proof. Group by the owned session/request ID and check whether a success transition occurs after that session's final error. A session that ends without a later success is unknown, not recovered and not automatically a terminal outage.

For a burst of terminal reconnect reports, compare distinct `liveSessionId`, `correlationId`, browser session, and window IDs before calling it duplicate logging or one prolonged outage. Product connection/data-ready events without the owned lifecycle ID can establish intermittent delivery in the browser session, but cannot prove recovery of the particular failed lifecycle. Mostly inactive replay duration is not an outage-duration measurement. Determine the stream protocol from the transport and stack; a `ws.*` host name alone does not prove WebSocket use.

For legacy logging chains, inspect actual event tags and helper routing: a method named `handledError` may still emit `error.P1`, and an "after retries" message does not prove retries were attempted. Correlate attempt, repository, and final-outcome reports by their cause, actor, operation, time, and available correlation IDs before counting incidents. An expected revision conflict must be distinguished from a permanent service failure. For Saved Views, inspect both revision conflicts and a deleted/missing target: a generic repository `Error` can become `INTERNAL_SERVER_ERROR`, bypassing the client's conflict recovery even when the UI preserves the current view.

Pull Better Stack Info logs only when Errors + PostHog are not enough to explain a cluster.

### 5. Separate noise

Call these out; do **not** treat as P0 product bugs by default:

- `SecurityError` + `posthog-recorder.js` / rrweb — session replay vs cross-origin iframes
- Bare `Script error.` — often WebKit / third-party CORS
- TradingView `[tv]` `no_such_symbol` / `Permission denied` / invalid symbol — widget lifecycle unless tied to bad app inputs
- Dynamic import / `Failed to fetch` / `Load failed` — often deploy skew, cache, or transport; note `app` vs `testapp` from URLs

### 6. Report (no implementation)

Use the template below. Every generated report must begin with **Highlights**, with **Doing well** followed by **Doing badly**, before window/source metadata. Keep both evidence-backed: do not infer health from a blocked source or short silence, and state when the available evidence is insufficient to claim a positive. Put user-impacting defects, regressions, operational risks, and material coverage gaps under **Doing badly**. Name likely files/areas and the exact PostHog issue / Better Stack pattern signals that should drop after a fix. Stop there unless the user asks to implement.

## Deliverable template

1. **Highlights**
   - **Doing well** — 1–3 bullets on evidence-backed healthy, recovered, low-volume, or correctly contained behavior; if none is proven, say the evidence is insufficient rather than inventing a positive
   - **Doing badly** — 1–3 bullets on confirmed defects, likely user impact, regressions, operational risk, or material evidence gaps; end with the first recommended action
2. **Window and sources** — `-24h`; PostHog project id; Better Stack Errors `application_id` + Info `source_id` actually used
3. **PostHog — top issues** — title, issue id, counts/users/sessions, `channel` / route / scope
4. **Better Stack — top patterns** — pattern id, message/type, count in window
5. **Clusters** — group duplicates; mark noise vs product defects
6. **Root cause** — per cluster: hypothesis, confidence (high/medium/low), evidence
7. **Fix plan** — ordered, smallest safe change first; files/areas to inspect (not edits). When invoked from greenfield, name the concept, owner, and boundary for each actionable cluster; identify the observed invalid transition or outcome duplication, preserve the product contract, and define the focused Browser verification. Defer broad state-model refactors until an incorrect transition is demonstrated.
8. **Verification signals** — which issue UUIDs / pattern ids should drop after a fix
9. **Blockers** — MCP down, wrong PostHog project, missing logs, etc.

## MCP rules

1. Read live tool schemas before the first call.
2. Never invent counts, stacks, or issue ids — report blockers instead.
3. Summarize; cite PostHog issue UUIDs and Better Stack `pattern` ids.
4. Do not call Better Stack `update_error_state` (resolve/ignore) from this runbook.
5. `codex mcp list` showing Better Stack as enabled does not prove the host exposed callable tools. If the live tool inventory has no Better Stack application/source/error/query tools, report the channel as blocked, do not reuse old IDs or counts, and do not substitute the dashboard UI unless the user requests it.

## Better Stack SQL notes

1. Always refresh errors query instructions for the resolved `application_id` before writing SQL.
2. Prefer **metrics** aggregates for `-24h` ranking; use detail tools for stacks.
3. Cold exceptions S3 (`NAMED_COLLECTION_DOESNT_EXIST`) → prefer metrics + `error` detail; repair the Better Stack Telemetry cloud connection if historical exceptions are required (see observability rules).
4. Auth provisioning tags (e.g. `auth.provisioning.*`) live in the **Errors** application, not Info logs.

## Boundaries

- **Investigate only** unless the user expands scope after reviewing the plan.
- When evidence points at product behavior, follow webapp `AGENTS.md` read order before concluding about domain behavior.
- Do not treat product `frontend_error` events as a substitute for `$exception` / Better Stack operational triage.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the run revealed a reusable lesson about a command, schema, source, verification gate, or diagnosis boundary.
2. Promote durable lessons into the procedure, prerequisites, verification, or troubleshooting sections.
3. Keep transient findings and unresolved decisions in `Agent Handoff`; prune completed or obsolete items before adding new ones.
4. If no durable rule changed, state `Runbook maintenance: no procedure change` in the final report.

Update this runbook when:

- A live connector, tool name, selector, endpoint, schema, credential path, or validation check drifts.
- A repeated blocker or ambiguity slows execution.
- A verification gate is too weak, too broad, or missing.
- A runbook is moved, renamed, duplicated, or aliased and its canonical routing needs correction.

Do not update this runbook for:

- One-off counts, transient incidents, raw logs, or current-run-only findings.
- Completed progress that belongs only in the final report.
- Speculative improvements unsupported by the run.

## Related

- Observability policy: [`ops/harness/observability-rules.md`](../harness/observability-rules.md)
- App-repo copy: [`tradingflow-webapp-fullstack/doc/ops/cursor/webapp-check-error.md`](../../../tradingflow-webapp-fullstack/doc/ops/cursor/webapp-check-error.md)
- PostHog product analytics (not this runbook): [`ops/webappp-fullstack/posthog-research.md`](./posthog-research.md)
- Better Stack Cursor skill (if present): `.cursor/skills/betterstack-monitor/SKILL.md`
