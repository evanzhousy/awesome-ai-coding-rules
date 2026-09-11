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

Last updated: 2026-09-11 (window **Thu 11:19 ET – Fri 11:19 ET**, run completed **2026-09-11T15:19Z**). PostHog project `300646` (`TradingFlow Web — Production`) was explicitly rebound before each list/detail batch; fresh results carried `/project/300646/` URLs and returned **31** active `-24h` groups. Better Stack was resolved live: `WebFullStack-Errors` application `2412994` and `WebFullStack-Info` source `2357910`; the Errors list exposed **21 patterns** and metrics totaled **35 exceptions**; Info metrics totaled **1,601 logs / 35 exceptions**. Do not add PostHog and Better Stack counts. Vercel confirms production **`0.17.2`** READY on commit `568095b…` (`dpl_4xw56Kt3eWn6q3BczmAuXu2stcEj`), with public `version.json` **200** and built **2026-09-11T14:57:30.021Z**, ready **15:00:35Z**. Sampled PostHog exceptions are still labeled old `$app_version=08474c4…`; the new build has only a short post-deploy slice, so silence is not a fix proof.

### Look First

- [ ] **Rank/CF request cascade and abort occupancy** — **FAIL/watch, not a cache P0**. PH `019f7c70-7428-7791-a759-f49e140bf7f6`=**9**/4u/6s; sampled values are `AbortError` after the 8s direct-snapshot timeout on `/app/rank/symbols`, all old app `08474c4…`. Neighbor PH `019f8417-7070-7332-9396-f647bd97eaa8`=**4**/1u/4s and `019f8080-b70a-7391-b90e-c1d483f4630c`=**2**/1u/2s. BS `1225cbf42e78e885589ea546014c1ff85e0c3e735a06af6005094f4358161ee0`=**4**, `5d881f32400313cf4833a392a776751599448aabd01394d05e6d862636a9b47d`=**2**, timeout patterns `71fd0997c8b9d6769f42e2f3301240f11b05a0c28961c26f5e23c8fcffbfe978`=**2**, `fff72a8387562542a4f0e11d6a1235a6e068247bfe8ca53a334fc79254f788af`=**2**, and `526359b6431e1ab705b205556b0a296a9c240eee3ca8b52902e04572f937583e`=**1**. Info recorded **7** direct snapshot-metadata errors recovered through server metadata and **2** V2 errors recovered through V1. The 21:16:33–37 ET fan-out also hit rank preferences, symbol daily bars, watchlist, and market structure; collapse it as one likely transport/session cascade until correlation IDs prove otherwise.

- [ ] **Live stream exhaustion** — **FAIL, sparse recurring**. PH `01a0203b-df75-7201-b0d8-bbf206799c52`=**4**/2u/2s across Option Trades Live and Rank; BS `5a6580dcd3ee996608586a7723582978ecce881208d43a7515ea7985c5c95c6a`=**4**. Info recorded `useLiveMode terminal`=**4**, alongside **403** reconnects and **80** stable recoveries. Aggregate recoveries do not prove per-session recovery; the current grouped result lacks a safe session-level join.

- [ ] **Auth/session tail** — **WATCH**. The prior named Option Trades and Rank auth-storm groups are absent from this current 31-group active list, which is a positive signal but not proof of zero. Current Clerk-token groups include PH `01a01b61-c8f6-79e1-9a0c-06bbbf858b97`=**6**/1u/3s plus smaller singleton groups; BS `7e967638c76350800156b8f554e6c7ecf07bd5b5a3a32d036a8ee3dd36086239`=**1**, `d01082b5ff5c24e533ecaaa29aa2b1bcb652a2fb37725c853dd9cec80676992f`=**1**, and token verification timeout `6a4d167c75c131c752f24a7e349d526d4f6d1e49a07a1f88e1ba63139bca0131`=**1**. Keep auth fail-closed and verify session-boundary behavior.

### Look Next

- [ ] **Asset/chunk recovery cluster** — **WATCH, low-volume user impact**. PH gamma dynamic import `019d2051-6a33-7b10-bb1e-54fa08bb3be7`=**3**/2u/2s; undefined-default `01a08e50-bfd8-7e30-81c1-9ad710c198db`=**1**; billing portal auth `01a08e50-ccdd-7f40-9187-26eaffe8f0d3`=**1. BS dynamic import `86674d36894ab106f106925b4ba54d471b736d5fa48302834c86f97b4bd62f6d`=**1**, undefined-default `61c86185811c4296d63869335f3d41113dce93b2ceff12ddc4de5c8c6a4205b3`=**1**, generic fetch `fc3fdea6f6a7de2dc50d4e2c6da79d7e2f913cd23b83d839043bfdc680a560d6`=**2**, and portal auth `57584608ebfcf49d8ccbbf8f200aaf924055ff51d8657fec037d83d63119323e`=**1**; Info chunk-preload recovery and AppErrorBoundary events co-occurred around 22:34 ET. PH ChunkLoadError `019ed19a-c86b-7d61-bd3c-0701c54450f5`=**7** has issue metadata naming a Clerk chunk but sampled event values naming a Featurebase chunk; use event-level provenance before assigning ownership.

- [ ] **Provider/empty minute-bar result** — **WATCH**. PH `01a08fa8-eca4-7172-9e9b-1d6430d6c88a`=**1** backend user/0 sessions; BS `2d4ac790b9778ac56e35bfb5943632933163cdc638e02ae1a29fd54d70de935f`=**1**. Info `symbolCandles` and `symbolIntradayBars` errors occurred together at **08:46:54Z**; this is currently a provider/symbol-date gap, not product-wide evidence.

- [ ] **ResizeObserver and vendor widget noise** — ResizeObserver PH `019eaf87-6b10-7ec1-9df7-2276cc4665db`=**565**/15u/25s, last **11:15 ET**, sampled on Rank with no app-version tag; keep out of P0 ranking while monitoring UI performance. WDG-065 PH groups `01a01188-be45-7231-abcb-7ae120a6460b`=**19**/2u/2s and `01a08c87-1748-7922-82ae-fb2059c1544b`=**7**/1u/1s remain vendor-shaped bundle noise.

### Monitor / Lower Priority

- [ ] Better Stack Info ingest is active: metrics show **1,601 logs / 35 exceptions**. The raw S3 drill returned **1,275 structured rows / 26 explicit error-level rows**; these are different aggregates and are not additive.
- [ ] The current evidence is overwhelmingly pre-deploy: sampled product exceptions carry old app `08474c4…`, while the production `0.17.2` build became READY at **15:00:35Z**. Recheck after a full observation window before calling the release good or bad.
- [ ] Rank date unavailable PH `019ff0ff-d43b-7f81-b230-2da61b46416b`=**1**, market-structure fetch PH `019facfe-c4fb-7e71-bc86-3274e0e8f55b`=**1**, and isolated login/billing failures remain low-volume.

### Blocked / Needs Decision

- [ ] The in-app Browser could not open `https://app.tradingflow.com/version.json` (`net::ERR_BLOCKED_BY_CLIENT`). Vercel’s authenticated deployment fetch returned HTTP **200** with content matching `0.17.2+568095b`, so deployment truth is verified through Vercel rather than Browser rendering.
- [ ] No session-replay listing tool or safe per-session Better Stack join was exposed; lifecycle recovery and user-visible impact remain unknown.
- [ ] No PostHog issue was resolved, suppressed, merged, or otherwise mutated; no deployment, rollback, or observability configuration change was performed.

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
2. Prefer Error Tracking list tools (`query-error-tracking-issues-list` or whatever the live schema exposes).
3. Defaults: `status=active`, `date_from=-24h`, order by `occurrences` DESC, limit ~25–50.
4. For top issues, pull detail / sampled events for `channel`, `scope`, `$pathname` / `$current_url`, stack, users/sessions.
5. Generic `TypeError`, `Failed to fetch`, and dynamic-import issues may combine unrelated failures under one fingerprint. Paginate their sampled events and group exact exception values plus current URLs before assigning ownership or root cause.
6. For `posthog-node` / backend issues, do not treat `users` or zero `sessions` as customer impact. Backend `distinct_id` may represent an operation identity; use correlation IDs, frontend events, or authenticated browser evidence for blast radius.
7. When a browser issue has session IDs, sample available recordings across both active and inactive sessions. Compare recording duration with active time and verify the rendered product state. A late or missing initial replay snapshot is an evidence blocker for the omitted interval; do not infer that the visible frame caused earlier telemetry or count each event as a user-visible outage.

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
