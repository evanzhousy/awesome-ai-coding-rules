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

Last updated: 2026-10-09. Executed the fixed rolling **24-hour** window **2026-10-08T15:12:48Z → 2026-10-09T15:12:48Z**; investigation finished **2026-10-09T15:22:45Z**. PostHog project `300646` (`TradingFlow Web — Production`) was rebound before list/detail, replay, and SQL batches. Six active issues were returned: five app issues and one landing-only issue. Better Stack Errors/Info were **blocked** because the live tool inventory exposed no Better Stack tools; no fresh IDs or counts were obtained. Public `version.json` returned production **`0.29.7+c5ddbb9`**, built **2026-10-08T16:49:01Z**. No application code, issue state, observability setting, or deployment changed.

### Look First

- [ ] **Investigate repeated Live transport failures first.** PH `01a0203b-df75-7201-b0d8-bbf206799c52` = **118** occurrences / 3 users / 6 browser sessions, all Chrome on Windows. SQL confirms 118 distinct `liveSessionId` values and 118 distinct correlation IDs; every report has `terminalReason=connect_or_reconnect`, retry attempt 3, and stream host `ws.optiondata.io`. This is an SSE/fetch transport despite the host name. Restore Better Stack query access, then inspect the originating connect/close failure and why fresh lifecycles repeatedly start in `useLiveMode` / `useLiveSessionReconciler`; do not raise the retry budget without that evidence. All six sessions also recorded connected states and displayed stream data, but only one had a later connected transition after its final error; missing lifecycle IDs on those product events prevent declaring the failed lifecycle recovered.
- [ ] **Repair stale Saved Filter Set selection and duplicate outcome reporting.** PH backend `01a06fff-6573-7b71-93ca-33c9e322c76f` and frontend `01a06ffd-cd96-7262-8a63-c7a9e06c828f` each have **1** `Saved Filter Set not found` occurrence, 261 ms apart. Stacks identify `selectOptionTradesSavedFilterSetByUserId` and `selectSavedFilterSetMutation`; treat this as one likely failed selection, not two customer incidents. Neither report has a correlation ID. Refresh the authoritative preference list on missing selection while preserving recoverable work, and keep final error ownership in the layer that knows the user outcome.
- [ ] **Keep the isolated row timeout separate from a database diagnosis.** PH `01a11d35-bae9-7641-b84f-e89e553c09e9` = **1** 22-second rows timeout, with `navigatorOnline=false`, `documentHidden=false`, elapsed 22,009 ms, and 9 ms timer drift. PH `019fa938-4799-7652-b029-8b5f4f4cbfa4` = **1** version-fetch failure in the same browser session 313 ms later. Inspect connectivity/cancellation first; optional version polling should follow the bounded info diagnostic contract. The current evidence does not justify increasing row-query deadlines.

### Blocked / Needs Decision

- [ ] Re-enable callable Better Stack application/source/error/query tools before the next run; both operational channels and cross-sink cause/recovery correlation remain unverified. Old source IDs and pattern counts must not be presented as current evidence.
- [ ] One recording was returned for seven affected session IDs, and only recording metadata was inspected. It was mostly inactive (~108 active seconds in a >100-minute ongoing recording); this is not an outage-duration measurement. Replay analysis tools require the missing `replay_scanner:read` scope, and no rendered replay impact was verified.
- [ ] Deployment split: **34** Live reports before the build and **84** after it (22h 23m post-build slice); 20 post-build reports still used `0.29.6`. Live/reconnect/transport paths are unchanged between `0.29.6` and `0.29.7`, so release causation is unproven. The previous watchlist-cache fix is present in the deployed source, and its issue did not appear in this active-issue window; do not infer watchlist health without read/fallback exposure. Exclude the three landing-only Netlify RUM exceptions in PH `01a05735-8b62-7431-8c6d-d3336268228a`.

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

An app-owned frontend `Failed to fetch` can appear in PostHog without a Better Stack counterpart when the browser transport itself is impaired: the Better Stack client relay also uses a same-origin fetch. Treat this as a sink-coverage gap, not proof that the structured `reportError` path did not run or that Better Stack observed zero impact.

For reconnecting or retrying lifecycles, aggregate success/error totals are not recovery proof. Group by the owned session/request ID and check whether a success transition occurs after that session's final error. A session that ends without a later success is unknown, not recovered and not automatically a terminal outage.

For a burst of terminal reconnect reports, compare distinct `liveSessionId`, `correlationId`, browser session, and window IDs before calling it duplicate logging or one prolonged outage. Product connection/data-ready events without the owned lifecycle ID can establish intermittent delivery in the browser session, but cannot prove recovery of the particular failed lifecycle. Mostly inactive replay duration is not an outage-duration measurement. Determine the stream protocol from the transport and stack; a `ws.*` host name alone does not prove WebSocket use.

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
7. **Fix plan** — ordered, smallest safe change first; files/areas to inspect (not edits)
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
