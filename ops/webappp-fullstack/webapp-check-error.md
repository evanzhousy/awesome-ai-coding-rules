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

Last updated: 2026-09-19 (rolling **-24h**, run completed **2026-09-19T13:44:52Z**). PostHog project `300646` (`TradingFlow Web — Production`) was explicitly rebound before list/detail and SQL batches; returned URLs carried `/project/300646/`. Better Stack resolved live to `WebFullStack-Errors` application `2412994` and `WebFullStack-Info` source `2357910`. Better Stack metrics returned **8 error patterns / 8 exceptions** and Info metrics returned **958 logs / 8 exceptions**; the Info historical drill returned **7 explicit error-level rows**. These are overlapping sinks and must not be added. Browser evidence from `https://app.tradingflow.com/version.json` confirms production **`0.22.0+4dee73f`**, built **2026-09-18T15:51:26Z**; test `0.22.2` is not production.

### Look First

- [ ] **ResizeObserver remains the dominant volume but is not a demonstrated `0.22.0` regression.** PH `019eaf87-6b10-7ec1-9df7-2276cc4665db` = **2,116** / 10 users / 15 sessions, with sampled `/app/rank/symbols` events. The issue is long-lived (`first_seen` 2026-06-09); a release-boundary SQL split found **818 before** versus **1,237 after** the `0.22.0` build, but the observed post-release hourly rate was lower than the short pre-release slice. Treat as high-volume noise with UI impact still unproven; keep the raw-diagnostic filter and use Browser/session evidence before suppressing or fixing UI code.
- [ ] **Option Trades timeout is the clearest current user-affecting defect.** PH `01a0b4b8-6232-79f2-8138-e8f17010ac86` = **1** / 1 user / 1 session; BS `d7a432393f861c7da5c80db94111a2253f2851982d5f9df3490ac23feb1a745c` = **1**, `fetchOptionTradesRows`, 22-second timeout. Correlate with request concurrency and ClickHouse query load before changing the timeout.
- [ ] **Shared access/transport failures are isolated but cross-layer.** PH `01a0b544-6316-7e23-909d-6db2e0c64ad4` = **1** / 1 user / 1 session at `realtime-entitlement/index.ts:133`; BS `17e03c4ddbd40ce90c23b66ddc2236ccb6cf75dcfbe72ab76c35a24fdbef9dbd` = **1** `Failed to fetch` at the Sentry browser asset. Info also has one `INVALID_ACCESS_PROOF` row and one Rank access-recovery row. Treat these as session/access-boundary evidence, not separate feature bugs, unless they recur for the same session or block the page.

### Look Next

- [ ] **Contract Rank direct timeouts are pre-release recovered fallbacks.** PH `019f7c70-7428-7791-a759-f49e140bf7f6` and `01a03e8b-20b9-79c3-858b-74ad5e47c0d9` are one occurrence each; sampled events carry the older `0.21.1` app-version tag and `/app/rank/symbols`. BS patterns `460b86986574ec436863515904be36aca52b212af5f3985be878594f9fd98fff` and `f9b7073c6b4133fe8bc98abd7b2a03f7156b9b6f1cf5743005ee9b0c1669ac39` are one each. Keep as latency watch items; current evidence does not support increasing the 8s/30s budgets.
- [ ] **Dynamic-import failures are deploy/cache-skew candidates.** PH `019d2051-6a33-7b10-bb1e-54fa08bb3be7` = **1** / 1 user / 1 session on `/app/home`; BS patterns `4644a5b4b52c05dbaa5543171d195979da47b1bd02c72184f6b407eb964211ac` and `3f521e2cfab18ec70b9d1dc04a776dda6eef35bb591b1b31c2dd1c0c6facb8a8` are one each. Do not call this a product regression from singleton events; verify chunk-preload recovery and asset-cache behavior after the next deployment.
- [ ] **Backend ClickHouse timeout and cookbook failure need ownership checks.** PH `019f90d5-681c-7fc1-b926-b93f15580819` = **2** posthog-node occurrences / 1 operation identity, and BS `8fdf67a97a3af3f8625ca29253589f20473a3a122886da54f85db713a7e78674` = **1** `TLSSocket.onTimeout`. Info has one `recipes.run` `Failed to run cookbook recipe` row. These need request/correlation detail before assigning a shared database or cookbook root cause.

### Blocked / Needs Decision

- [ ] The current PostHog tool inventory exposes no session-recording query tool, so rendered impact for ResizeObserver and the browser failures remains unverified. The previous `learn -s` handshake is still unavailable (`INVALID_ARGUMENT`), but live `tools`/`info`/`call --json` reads work.
- [ ] Better Stack Info raw logs do not carry a usable environment value (`958` logs aggregate with blank environment; the exception metric rows are production). The seven error-level rows are treated as production only where their app asset URLs/timestamps correlate with production Error Tracking; this is a source-quality limitation.
- [ ] No PostHog issue was resolved, suppressed, merged, or otherwise mutated. No deployment, rollback, observability configuration, or code change was performed.

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
2. If the bundled connector exposes a single PostHog command wrapper, follow its advertised protocol: use `tools` / `search` for discovery, `info <tool>` once for the schema, then `call --json <tool> <input>`. Load the installed PostHog skill as the local fallback if the connector's advertised `learn -s` handshake returns `INVALID_ARGUMENT`; record that handshake failure as connector drift, but do not call PostHog unavailable when the advertised read tools still work.
3. Prefer Error Tracking list tools (`query-error-tracking-issues-list` or whatever the live schema exposes).
4. Defaults: `status=active`, `date_from=-24h`, order by `occurrences` DESC, limit ~25–50.
5. For top issues, pull detail / sampled events for `channel`, `scope`, `$pathname` / `$current_url`, stack, users/sessions.
6. Generic `TypeError`, `Failed to fetch`, and dynamic-import issues may combine unrelated failures under one fingerprint. Paginate their sampled events and group exact exception values plus current URLs before assigning ownership or root cause.
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

For reconnecting or retrying lifecycles, aggregate success/error totals are not recovery proof. Group by the owned session/request ID and check whether a success transition occurs after that session's final error. A session that ends without a later success is unknown, not recovered and not automatically a terminal outage.

Pull Better Stack Info logs only when Errors + PostHog are not enough to explain a cluster.

### 5. Separate noise

Call these out; do **not** treat as P0 product bugs by default:

- `SecurityError` + `posthog-recorder.js` / rrweb — session replay vs cross-origin iframes
- Bare `Script error.` — often WebKit / third-party CORS
- TradingView `[tv]` `no_such_symbol` / `Permission denied` / invalid symbol — widget lifecycle unless tied to bad app inputs
- Dynamic import / `Failed to fetch` / `Load failed` — often deploy skew, cache, or transport; note `app` vs `testapp` from URLs

### 6. Report (no implementation)

Use the template below. Every generated report must begin with **Highlights** before window/source metadata. Name likely files/areas and the exact PostHog issue / Better Stack pattern signals that should drop after a fix. Stop there unless the user asks to implement.

## Deliverable template

1. **Highlights** — 2–4 bullets: overall health, dominant themes, biggest risk, and the first recommended action
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
- App-repo copy: [`tradingflow-webapp-fullstack/ops/webapp-check-error.md`](../../../tradingflow-webapp-fullstack/ops/webapp-check-error.md)
- PostHog product analytics (not this runbook): [`ops/webappp-fullstack/posthog-research.md`](./posthog-research.md)
- Better Stack Cursor skill (if present): `.cursor/skills/betterstack-monitor/SKILL.md`
