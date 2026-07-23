---
name: posthog-research
description: Reviews TradingFlow web traffic, user behavior, event instrumentation, and PostHog dashboard setup using the PostHog MCP/plugin. Produces an evidence-backed report and recommendations without changing tracking or dashboards unless explicitly asked.
disable-model-invocation: true
---

# PostHog research (webapp fullstack)

Agent runbook for using **PostHog live access** to review web traffic, user behavior, event tracking quality, and dashboard setup for the TradingFlow webapp. The preferred access path is the one requested by the user for the run: PostHog MCP/plugin when requested, or `posthog-cli` when CLI-only evidence is requested. The default output is a research report, not code changes.

## Recommended Invocation

Use `/goal` for each analytics review:

- Objective: produce an evidence-backed PostHog review of traffic, behavior, tracking quality, dashboards, and long-term watchlist status.
- Success criteria: access mode is confirmed, the live project/date range/filters are named, each criteria-for-success item is answered or blocked, and the long-term watchlist plus this runbook are pruned/updated when reusable findings change.
- Stop condition: the report is complete, PostHog access is blocked with the exact attempted path, or the user expands scope to dashboard/tracking changes.

## Agent Handoff

Last updated: 2026-07-21

### Look First

- [ ] Revisit every active item in [Long-Term Issue Watchlist](#long-term-issue-watchlist) before broad exploration; mark each `worse`, `unchanged`, `improved`, `resolved`, or `blocked`, and prune/revise only with current evidence.
- [ ] Start PH-W1 with active `$exception` issue classes around dynamic import/load failures, snapshot timeout errors, fetch/load failures, missing server secrets, and recent console-error-heavy recordings.
- [ ] Start PH-W3 by checking Product health dashboard SQL/user-count hygiene. The `2026-07-21` run found at least one SQL tile using `uniq(distinct_id)` despite person-on-events being enabled, plus dashboard references to retired or not-yet-observed events.
- [ ] Start PH-W4 with the paywall/billing return boundary: current tracking reaches paywall actions, checkout-session creation, portal-session creation, and source-code return handlers, but next runs must verify live `billing_checkout_returned_success`, `billing_checkout_returned_cancel`, and `billing_subscription_activated` events.
- [ ] Start PH-W7/PH-W8 by checking for active internal/test cohorts and local tracking taxonomy docs. This runbook exists in this repo now, but reusable PostHog taxonomy docs and standard filter cohorts still need live verification.
- [ ] Before applying bot or acquisition filters, verify the live property names with `read-data-schema` and run a small with/without-filter baseline. The `2026-07-21` run saw `$virt_traffic_type` / `$virt_is_bot` values in schema, but SQL still emitted taxonomy warnings for `$virt_traffic_type`; use `utm_source` / login `initial_utm_source` where present.

## Goal

Produce an evidence-backed product analytics review that answers three questions:

1. What are the traffic and user-behavior highlights, risks, and bad signals?
2. Is the current event tracking setup reasonable for understanding the product?
3. Are the current PostHog dashboards and insights set up reasonably?

## Boundaries

- Use PostHog as the primary evidence source. Do not infer traffic or behavior from code alone.
- Do not create, edit, archive, or delete dashboards, insights, events, cohorts, feature flags, or surveys unless the user explicitly asks after the review.
- Do not expose raw user PII in the final report. Aggregate by counts, sessions, routes, cohorts, and anonymized examples.
- Do not repeat secrets returned by tools, including PostHog project API tokens or ingestion keys that can appear in project-context responses.
- Do not silently fall back to browser UI scraping when the PostHog plugin is unavailable. State the blocker and ask the user to connect or re-auth the PostHog plugin.
- Treat any hardcoded project IDs in this file as expected defaults, not truth. Report the actual organization/project returned by the plugin.
- After running this runbook, the AI agent may update this runbook when the run exposes a better query, missing checklist item, stale assumption, recurring blocker, or stronger report structure that would make the next run more accurate or faster. Keep those edits scoped to runbook quality; do not encode one-off findings as permanent rules unless they are reusable.

## Default Scope

Unless the user overrides:

| Dimension | Default |
| --- | --- |
| Product | TradingFlow webapp / `app.tradingflow.com` |
| App repo | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack` |
| PostHog project | Expected production project id `300646`; confirm with the connected plugin before querying |
| Time window | Last 30 days, compared with the previous 30 days where useful |
| Recency check | Last 7 days for regressions, fresh drops, or spikes |
| Segments | Anonymous vs logged-in if available; new vs returning; top routes; device/browser; country/region; referrer/source |
| Exclusions | Internal/test users, localhost/dev hosts, staging hosts, known QA accounts, and bot traffic when identifiable |

Filtering note: use production host and verified bot exclusions for browser traffic, but do not apply those filters blindly to backend/server product events. Backend conversion events can have no `$host` and may be classified as bots; query them with explicit `channel`, `runtime`, or equivalent properties so billing/provisioning steps are not hidden. Do not assume default property names such as `$virt_is_bot` or `$utm_source`; confirm current taxonomy first. For user-level metrics in HogQL, prefer `uniq(person_id)` or `count(DISTINCT person_id)` over `uniq(distinct_id)` because this project has person-on-events enabled; dashboard tiles using `distinct_id` can overcount after auth identity changes.

## Long-Term Issue Watchlist

Future runs must revisit the active watchlist before treating the review as complete. For each item, report whether it is `worse`, `unchanged`, `improved`, `resolved`, or `blocked`, with the current evidence and the prior-run baseline used for comparison. Keep items on this list until they are clearly resolved or intentionally accepted; do not remove an item just because it is old.

Seeded from the `2026-06-16` PostHog MCP run:

| ID | Area | What to check in the next run | Prior baseline / evidence to compare |
| --- | --- | --- | --- |
| PH-W1 | Exception volume and top issues | Check whether `$exception` is still one of the highest-volume event families, whether active error-tracking issues declined, and whether the same top issue classes remain. | `2026-07-21` run: last 7d still had ~1,400 exception events. Top active issues included a dynamic import failure for a gamma-exposure chunk, DirectSnapshotFetchError snapshot timeouts, missing `FEATUREBASE_JWT_SECRET`, and fetch/load failures. Replay samples with console errors showed hundreds to 1,748 console errors in single sessions. |
| PH-W2 | Backend conversion visibility | Verify backend conversion events are included in monetization reports with channel-aware filters and are not hidden by `$host` or generic bot exclusions. | `2026-07-21` run: `billing_checkout_session_created` and `billing_customer_portal_session_created` remained visible when queried without web-only `$host` filters. App code still sends backend events through `captureBackendPostHogEvent` with checkout and portal context. |
| PH-W3 | Dashboard staleness | Re-check whether old dashboards still query retired events/properties and whether Product health became the canonical dashboard. | `2026-07-21` run: Product health was useful but still had dashboard drift: one SQL tile used `uniq(distinct_id)`, and some tiles referenced retired or not-yet-observed events such as `routine_action_clicked`, `notebooks_run_open_clicked`, `billing_upgrade_cta_clicked`, and missing Market/GEX dashboard events. |
| PH-W4 | Monetization and paywall funnel | Track whether paywall-to-CTA-to-checkout volume improves and whether checkout events are visible in the same funnel as frontend paywall actions. | `2026-07-21` run: last 30d showed `170` premium-gate users -> `21` paywall-shown users -> `1` paywall CTA/checkout user. `paywall_suppressed`, `paywall_plan_selected`, `billing_checkout_redirect_started`, and attempt/context properties were live; `billing_checkout_returned_success`, `billing_checkout_returned_cancel`, and `billing_subscription_activated` were not observed in taxonomy/results. |
| PH-W5 | Acquisition attribution quality | Check whether source, referrer, and UTM coverage improved beyond direct and same-site attribution. | `2026-07-21` run: attribution was still dominated by direct and same-site traffic. External sources were tiny compared with `$direct`, and Google/account referrers represented small user counts. |
| PH-W6 | Mobile and product-friction paths | Re-check mobile share, dead clicks, rageclicks, console errors, and route-specific friction for top product paths. | `2026-07-21` run: mobile remained material, and dead/rage clicks still clustered around `/app/option-trades/live`, `/app/option-trades/historical`, `/app/rank/contracts`, and `/app/rank/symbols`; recent replay samples confirmed console-error-heavy sessions on `/app/option-trades/live` and `/app/home`. |
| PH-W7 | Test/internal filtering | Check whether reusable internal/test cohorts or documented standard filters now exist, and whether key dashboards consistently use them. | `2026-07-21` run: `system.cohorts` returned no active cohorts. Filtering still depends on project settings and per-insight `filterTestAccounts`; Market Recap dashboard included low-volume tiles with `filterTestAccounts=false`, which may be intentional but should be rechecked. |
| PH-W8 | Tracking docs and taxonomy | Check whether missing or stale local PostHog automation/taxonomy docs were restored or removed. | `2026-07-21` run: this runbook exists at `ops/webappp-fullstack/posthog-research.md`, but local app-repo taxonomy docs and dashboard-event contracts still need verification because dashboard queries are ahead of some observed events. |

When a new run finds a recurring issue that needs follow-up, add it to this table with a stable ID and concise baseline. When an item is resolved, mark it in the run report and either keep one final resolved note or remove it only if it no longer needs tracking.

## Access Modes

### PostHog CLI-only mode

Use this mode when the user asks for `posthog-cli`, or explicitly says not to use the PostHog MCP/plugin.

Prerequisites:

- Install/run the official CLI: `npx -y @posthog/cli --help`.
- Authenticate to the production project with a personal API token that includes **`query:read`** for HogQL reads.
- Set or confirm project id `300646`: `POSTHOG_CLI_PROJECT_ID=300646`.
- Use the app/API host, not the ingestion host: `POSTHOG_CLI_HOST=https://us.posthog.com`.

Important CLI auth note:

- The app env files usually contain `POSTHOG_KEY` / `VITE_POSTHOG_KEY` values that start with `phc_`; those are project ingestion keys and cannot run read queries.
- `posthog-cli exp query run` requires a personal API token that starts with `phx_` and has `query:read`.
- The interactive `posthog-cli login` flow may authenticate successfully but still return a token missing `query:read`; if HogQL fails with `API key missing required scope 'query:read'`, stop and ask for a suitable personal API token or re-auth flow.
- The official `posthog-cli api ...` proxy may fail with `Could not find the PostHog API CLI bundle`; use `posthog-cli exp query run` for read-only HogQL when available.

Useful CLI checks:

```bash
npx -y @posthog/cli exp schema status
npx -y @posthog/cli exp endpoints list
npx -y @posthog/cli exp query run "SELECT count() AS events FROM events WHERE timestamp >= now() - INTERVAL 1 DAY"
```

If CLI query access is blocked, still report any CLI-backed partial evidence, such as project authentication status, endpoint list, or schema sync result, but mark traffic, behavior, and dashboard conclusions as blocked.

### PostHog MCP/plugin mode

Use this mode when the user asks for the PostHog MCP/plugin or `@posthog`.

Follow the connected PostHog app's live tool discovery. If no tools are exposed, state the blocker and ask the user to connect or re-auth the plugin. Do not silently replace this with browser scraping.

Current MCP notes:

- Always run `search` or `tools` first, then `info <tool_name>` before each `call <tool_name> ...`. Some MCP wrappers reject or mislead when schemas are assumed.
- `switch-project` responses can include project tokens. Use the project id/name/timezone in the report, but do not paste the token.
- Explicitly `switch-project` to project `300646` after resolving projects with `projects-get`, even if earlier calls appeared to use the right project. Silent active-project drift can make exact event queries look empty.
- Discover live table/column shape through `execute-sql` against `system.information_schema.*`; treat older helpers such as `read-data-warehouse-schema` as optional/legacy if they are not exposed.
- Use `read-data-schema` for event/property verification before analytics queries, then query with confirmed event names and properties.

## Criteria For Success

The review is complete only when all applicable checks pass:

1. **Project confirmed** - The report names the PostHog organization/project, host, date range, timezone, and filters actually used.
2. **Traffic reviewed** - Page views, unique users, sessions, top entry pages, top routes, referrers/sources, device/browser mix, and trend versus comparison period are summarized.
3. **Behavior reviewed** - Activation/conversion paths, drop-offs, retention or returning behavior, high-friction routes, rage/dead clicks if available, and representative session replay findings are summarized.
4. **Event inventory checked** - High-volume and product-specific events are listed with counts, users, first/last seen, and obvious gaps or duplicates.
5. **Repo tracking inspected** - The webapp tracking code is searched for PostHog initialization, `capture`, `identify`, `alias`, `reset`, route tracking, production gating, and event property conventions.
6. **Tracking reasonableness judged** - The report states whether events cover acquisition, activation, engagement, monetization, retention, and error/product friction. It also flags naming, property, PII, environment, or dedupe problems.
7. **Dashboards audited** - Existing dashboards and key insights are reviewed for owner/purpose, freshness, broken queries, filters, date ranges, test-user exclusion, and coverage of the questions operators actually need answered.
8. **Evidence cited** - Findings include concrete counts, percentages, dashboard/insight links where available, query/tool names used, and caveats.
9. **Recommendations prioritized** - The report separates `P0 data correctness`, `P1 decision quality`, and `P2 cleanup/nice-to-have` recommendations.
10. **Long-term watchlist updated** - The report revisits every active item in [Long-Term Issue Watchlist](#long-term-issue-watchlist), states current status, and updates this file if an item should be added, revised, resolved, or removed.
11. **Runbook maintenance considered** - The agent states whether this file should be updated based on the run, and applies small improvements when they are clearly reusable.

## Required Workflow

### 0. Confirm access and target

1. Confirm the requested access mode: CLI-only, MCP/plugin, or user-approved fallback.
2. For CLI-only mode, run the CLI checks in [PostHog CLI-only mode](#posthog-cli-only-mode), then confirm project id, host, token scope, and date window.
3. For MCP/plugin mode, read the PostHog plugin skill for the current session and follow its workflow.
4. Discover the live PostHog tools exposed in the session when using MCP/plugin mode. Tool names can change; do not assume stale MCP names.
5. Confirm the target organization/project, project timezone, and date window with either the user, CLI status, or plugin metadata.
6. In MCP/plugin mode, explicitly switch to the confirmed target project before running event queries, then state the active project in the report.
7. If no PostHog tools are exposed or CLI auth is insufficient, stop the affected PostHog portion and report:
   - `PostHog blocker: plugin tools unavailable or unauthenticated`
   - or `PostHog CLI blocker: token missing query:read`
   - exact discovery step attempted
   - what the user needs to connect or re-auth

Use the requested access mode before browser UI. Browser/Chrome is only a fallback when the user explicitly asks for it or approves it.

### 0.5. Revisit the long-term watchlist

Before broad exploration, read [Long-Term Issue Watchlist](#long-term-issue-watchlist) and create a follow-up checklist for the current run. Each watchlist item should have:

- A current metric, dashboard check, code check, or blocker.
- A comparison to the prior baseline in the watchlist.
- A status: `worse`, `unchanged`, `improved`, `resolved`, or `blocked`.
- A short recommendation if the issue is still active.

Include a `Long-Term Watchlist Follow-up` section in the final report. If the run discovers a new recurring issue or proves an existing item is resolved, update the watchlist table in this file during runbook maintenance.

### 1. Inventory available analytics surfaces

Use the plugin to discover what is available:

- Dashboards and dashboard IDs.
- Insights and insight IDs.
- Event names and event definitions if the plugin exposes them.
- Cohorts and groups relevant to internal/test filtering.
- Session replay availability.
- Data management or schema views for event/property definitions.

Record the exact tool names used in the final report.

### 2. Review traffic

Gather a compact traffic baseline for the default window and comparison period:

- Daily page views, unique users, and sessions.
- Top landing pages and top visited routes.
- Traffic by referrer/source/UTM when available.
- Device, browser, OS, and country/region mix.
- New vs returning users if available.
- Logged-in vs anonymous traffic if identify/person properties support it.
- Large spikes, drops, or route-level anomalies.

Suggested HogQL shapes, adapted to the live schema and tool syntax:

```sql
SELECT
  toStartOfDay(timestamp) AS day,
  count() AS pageviews,
  uniq(distinct_id) AS users,
  uniq(properties.$session_id) AS sessions
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY day
ORDER BY day
```

```sql
SELECT
  properties.$pathname AS path,
  count() AS pageviews,
  uniq(distinct_id) AS users,
  uniq(properties.$session_id) AS sessions
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY path
ORDER BY pageviews DESC
LIMIT 25
```

Do not paste raw query output. Summarize the top movers and suspicious gaps.

### 3. Review user behavior

Use a mix of aggregated PostHog queries and, where available, session replays:

- Main paths users take after landing or login.
- Conversion or activation funnels for key product actions.
- Drop-off points in signup, login, paywall/subscription, dashboard loading, scanner usage, watchlist, alerts, or other high-value flows present in the app.
- Retention/stickiness for core product actions, not only `$pageview`.
- Repeated visits to error, empty-state, billing, or auth pages.
- Rage clicks, dead clicks, console errors, slow page loads, and replay-visible friction if PostHog exposes them.

If funnels already exist, inspect them first. If not, build temporary read-only queries or propose the missing funnel definitions in the report.

Behavior findings should distinguish:

- **Highlights** - clear growth, strong conversion, high engagement, sticky routes, or useful repeat behavior.
- **Bads** - drop-offs, confusing loops, low activation, high bounce, broken paths, high rage/dead clicks, or users repeatedly returning to error/empty states.
- **Unknowns** - questions that cannot be answered because tracking is missing or dashboards are not configured.

### 4. Audit event tracking setup

Review both PostHog data and the app code.

In the app repo, start with:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
rg -n "posthog|capture\\(|identify\\(|alias\\(|reset\\(|PostHogProvider|posthog-js|NEXT_PUBLIC_POSTHOG|\\$pageview" .
```

Then compare code against observed events:

- Are event names stable, lower snake_case or otherwise consistently named?
- Do event properties include route/surface, action origin, entity IDs where safe, plan/status, result/error state, and experiment/feature-flag context when relevant?
- Are product events specific enough to answer "what did the user do?" without overcounting generic clicks?
- Are key lifecycle points tracked: signup, login, onboarding/activation, subscription/billing, core feature usage, exports/downloads, alert/watchlist actions, retention hooks, and support/error states?
- Are `$pageview` and route changes captured once per route change, without duplicate page views from nested providers or client/server double capture?
- Are `identify`, `alias`, and `reset` used correctly across auth login/logout so anonymous and known-user histories are not corrupted?
- Is tracking gated to the right environments and hosts?
- Are backend/server events queryable without relying on browser-only fields like `$host`, and are they kept visible when bot filters are used for web traffic?
- Are internal/test users filtered or taggable?
- Are PII and sensitive trading/account data avoided in event properties?
- Are event names and required properties documented near the code or in an ops taxonomy?

Useful inventory query shape:

```sql
SELECT
  event,
  count() AS events,
  uniq(distinct_id) AS users,
  min(timestamp) AS first_seen,
  max(timestamp) AS last_seen
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY event
ORDER BY events DESC
LIMIT 100
```

Flag event tracking as **reasonable** only if the current setup can support the traffic/behavior questions in this runbook without excessive manual reconstruction.

### 5. Audit dashboards and insights

Use PostHog dashboard/insight tools when available. For each dashboard that appears relevant, record:

- Dashboard name, ID, URL, owner if visible, and purpose.
- Last modified or freshness signal if available.
- Included insights and whether each still returns data.
- Date ranges and whether they are appropriate for operating the app.
- Filters for production host, internal/test users, bots, staging/dev, and QA.
- Separate browser-traffic filters from backend conversion-event filters. Dashboards should not drop `channel=backend` billing, provisioning, or portal events just because they have no `$host` or are bot-classified.
- Whether insights are event-count biased when user/session-based metrics would be more useful.
- Whether the dashboard answers acquisition, activation, engagement, retention, monetization, and product-friction questions.
- Whether there are duplicate, stale, or misleading dashboards.

Dashboard setup is **reasonable** when:

- Operators can see top-line traffic and active usage quickly.
- Product owners can inspect funnels and drop-offs without rewriting queries.
- Tracking gaps are visible rather than hidden.
- Internal/test noise is filtered consistently.
- Every important chart has a clear title, time range, filters, and stable event/property assumptions.

If dashboards are not reasonable, recommend the smallest useful dashboard set:

1. **Executive traffic** - users, sessions, page views, top routes, sources, device mix.
2. **Activation and conversion** - landing/signup/login/onboarding/core action/billing funnel.
3. **Engagement and retention** - weekly active users, repeat core actions, retention by signup cohort.
4. **Product friction** - errors, rage/dead clicks, empty states, slow pages, replay links.
5. **Event quality** - event volume by event, missing required properties, unknown hosts, internal traffic.

### 6. Deliver the report

Use this structure:

```markdown
# PostHog Webapp Research Report

## Scope
- Project:
- Date range:
- Comparison range:
- Filters:
- Tools used:
- Caveats:

## Executive Summary
- Overall read:
- Biggest highlights:
- Biggest bads:
- Most important unknowns:

## Traffic
- Users / sessions / page views:
- Trend vs comparison:
- Top routes:
- Top sources/referrers:
- Device/browser/geo notes:

## User Behavior
- Main paths:
- Conversion or activation:
- Retention / repeat usage:
- Friction from replay or behavior signals:

## Event Tracking Review
- Reasonableness verdict:
- Events observed:
- Code paths inspected:
- Gaps:
- Duplicates/noise:
- PII/environment/filtering risks:

## Dashboard Review
- Reasonableness verdict:
- Dashboards inspected:
- Useful charts:
- Broken/stale/misleading charts:
- Missing dashboards or insights:

## Recommendations
- P0 data correctness:
- P1 decision quality:
- P2 cleanup:

## Follow-up Queries
- Query or insight to add:
- Why it matters:
- Event/property dependency:

## Long-Term Watchlist Follow-up
- PH-W1:
- PH-W2:
- PH-W3:
- PH-W4:
- PH-W5:
- PH-W6:
- PH-W7:
- PH-W8:
- New watchlist items:
- Resolved watchlist items:
```

## Evidence Rules

- Prefer counts, percentages, and trend deltas over vague language.
- Include links to PostHog dashboards, insights, recordings, or queries when the plugin returns URLs.
- Cite the event names and properties used for each conclusion.
- When using session replay, summarize patterns across several recordings; do not overgeneralize from one replay unless it is clearly a defect.
- Mark any answer as `blocked` when the necessary event/property/dashboard data does not exist.
- In CLI-only mode, cite the exact `posthog-cli` command category used (`exp query`, `exp schema`, `exp endpoints`) and separate hard query results from schema/metadata-only evidence.

## Runbook Maintenance

At the end of each run, decide whether the runbook itself should change.

Use this self-maintenance rule:

1. Promote durable lessons into access mode, workflow, query examples, dashboard checks, evidence rules, watchlist handling, or report structure.
2. Keep transient state in `Agent Handoff`, [Long-Term Issue Watchlist](#long-term-issue-watchlist), or the run report only.
3. Prune completed or obsolete handoff/watchlist items before adding new ones.
4. If no durable rule changed, state `Runbook maintenance: no change` in the report.

Update this file in the same session when the run reveals a reusable improvement, such as:

- A PostHog tool discovery pattern that worked or failed repeatedly.
- A query that produced cleaner traffic, behavior, event-quality, or dashboard evidence.
- A missing filter, property, dashboard check, or session-replay check that should always be part of future reviews.
- A new recurring issue that should be added to the long-term watchlist, or an existing watchlist item that should be revised or removed.
- A stale project ID, repo path, event convention, or dashboard assumption.
- A reporting section that should be added so future runs do not bury important blockers.

Do not update this file for one-off product conclusions, temporary incident findings, raw traffic numbers, raw query output, dashboard recommendations that belong only in that run's report, or completed progress.

When maintenance is performed, include a short `Runbook maintenance` note in the report that says what changed and why.

## Common Failure Modes To Watch

- `$pageview` exists but core product actions are missing, making behavior impossible to explain.
- Dashboards count events instead of users or sessions, overstating engagement.
- Internal/test users dominate low-volume funnels.
- Route tracking misses SPA navigation or double-counts it.
- Auth identity handling merges unrelated users or loses anonymous pre-login behavior.
- Event names encode volatile UI copy instead of stable product actions.
- Properties contain PII or sensitive financial/account data.
- Charts use inconsistent time windows or filters, so dashboard tiles disagree.
- Old dashboards still point at renamed events or deprecated properties.
- Backend/server conversion events are hidden by web-only `$host` filters or generic bot exclusions.
- MCP active-project context drifts between calls, producing false empty taxonomy/event results until `switch-project` is rerun.
- Query examples or dashboards assume stale properties such as `$virt_is_bot`, `$virt_traffic_type`, or `$utm_source`, causing warnings or misleading source/bot splits.
- Dashboard SQL uses `distinct_id` for users in a person-on-events project; prefer `person_id` for user counts unless distinct browser/device identities are explicitly intended.
