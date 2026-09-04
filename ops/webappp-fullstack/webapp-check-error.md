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

Last updated: 2026-09-04 (window **2026-09-03 04:49–2026-09-04 04:49 ET**). PostHog project `300646` was verified as **TradingFlow Web — Production** with the production host and test-account filter; its active issue list returned **21 groups**. Better Stack resolved `WebFullStack-Errors` as application `2412994` and `WebFullStack-Info` as source `2357910`: the Errors list and metrics query returned **no current patterns**, and Info returned **0 logs / 0 exception rows**. Treat this as Better Stack source silence/coverage uncertainty, not proof of zero, because PostHog remains non-empty. Vercel confirms production **`0.15.1`** on commit `948a230…`, READY and deployed **2026-09-03 06:36 ET** to `app.tradingflow.com`; direct `version.json` browser verification remains blocked by the client. Local `test` contains the prior remediation, but it is not production proof.

### Look First

- [ ] **Post-deploy authentication denials** — **FAIL↑, user impact unknown**. Option Trades PH `01a06797-ea2a-7fb1-af3a-30195d2e7d0f`=**33** + `01a06797-ea29-7a33-a3bb-94e24badb834`=**5**; Rank PH `01a063fc-ac5f-7672-aa2e-34c26871228b`=**4** + `01a063fc-069e-7b70-a557-bf779193f0ef`=**3**. Samples are handled `posthog-node` `ServerHttpError` events from `requirePremiumPrincipal`, with zero browser sessions; backend operation identities are not human-user counts. First seen ~09:56–10:06 ET, after the 0.15.1 deployment; the release diff did not change `src/server/optionTradesApi.ts` or `src/server/contractFlowRank.ts`. Keep fail-closed and correlate with Better Stack/Clerk before assigning causation.
- [ ] **TradingView vendor bundle errors** — **FAIL/noise**. PH `01a01188-be45-7231-abcb-7ae120a6460b` (`WDG-065`)=**10**/1u/2s, latest **00:58 ET**, source `/w/en/chunks/*`, `/app/option-trades/historical`; PH `01a066be-0345-7681-a58c-442b2d6d5da4` (`Cannot update oldest data…`)=**9**/1u/1s on `/app/rank/symbols`. The bundle provenance is vendor-shaped; do not rank as a product P0 without rendered-impact evidence. Keep filtering narrow and provenance-qualified.
- [ ] **Stale-client dynamic imports** — **WATCH**. Home artwork PH `01a06789-e759-7161-bb24-787c133ac377`=**2** plus dynamic-import PH `019d2051-6a33-7b10-bb1e-54fa08bb3be7`=**1**, same Home session/user and old `$app_version=61ea9e4`; current production is `948a230…`. Treat as deploy/cache skew until a current-version reproduction proves otherwise.

### Look Next

- [ ] **Rank snapshot latency** — **WATCH**. PH 8s `019f7c70-7428-7791-a759-f49e140bf7f6`=**2**/2u/2s, overlay 30s `01a03e8b-20b9-79c3-858b-74ad5e47c0d9`=**2**/2u/2s, and 90s `019fb376-35f2-7ff1-b65e-5236086bc4d7`=**1**/1u/1s, all on `/app/rank/symbols`. Samples pair timeout fingerprints with `AbortError`; without Better Stack lifecycle data, recovery and provider cause remain unknown.
- [ ] **Option Trades persistence/live lifecycle** — **WATCH**. Saved-filter conflict PH `01a03175-0482-7390-ae36-81380d74d7f3`=**3** plus backend duplicate `01a03175-03c9-7d82-94d6-79d1026b2fc5`=**1** are one cross-session incident; preference fetch `019f8673-b978-7300-99d4-dc5bbbeb8e2a`=**1** is current-build `/app/option-trades/live`; live exhaustion `01a00256-a3b5-7cc2-ad90-2fd63cb318ce`=**1**. The prior 22s/25s rows/stats timeout searches have no active match.
- [ ] **ResizeObserver** — **IMPROVED volume, still noisy**. PH `019eaf87-6b10-7ec1-9df7-2276cc4665db`=**181**/14u/19s versus prior **564**/13u/29s; samples span Option Trades Live and Rank Contracts in one session. Keep out of P0 ranking.

### Monitor / Lower Priority

- [ ] Better Stack Errors and Info are quiet for this refreshed window while PostHog still has 21 active groups. The prior `d5ef08…` version-check pattern fell outside the new cutoff; treat the cross-sink gap as an ingestion/coverage check, not recovery, and do not add the old pattern to current counts.
- [ ] No active PostHog issue matched the prior market-structure snapshot, `INVALID_ACCESS_PROOF`, GlobalTickerTape, or “Option Trades timed out” searches. This is an active-list result, not proof of zero traffic or recovery.

### Blocked / Needs Decision

- [ ] Info raw-log queries returned no rows and no session-replay listing tool was exposed; rendered impact for vendor errors and lifecycle recovery for Rank latency remain unknown.
- [ ] Direct production `version.json` access was blocked by the in-app Browser/client, while Vercel deployment metadata proved the production alias and source commit. Recheck the public version endpoint in a session without that blocker before using version-file evidence.

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
