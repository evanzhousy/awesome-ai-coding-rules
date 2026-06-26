---
name: optiondata-posthog-errors-and-user-insights
description: PostHog runbook for OptionData portal agents to inspect browser errors, error-tracking issues, frustration signals, and product/user insights using the PostHog MCP/plugin or an approved Chrome dashboard fallback, then produce a concise evidence-backed summary without exposing PII.
disable-model-invocation: true
---

# OptionData PostHog Errors And User Insights Runbook

## Recommended Invocation

Use `/goal` when the user asks for a complete PostHog error check, weekly analytics summary, product-insight readout, or dashboard audit.

Recommended objective:

> Check the OptionData PostHog project for current error health and user/product insights. Confirm the active PostHog project is OptionData project 90561, inspect error tracking and relevant product events for the requested time window, summarize evidence-backed findings and gaps without exposing PII, and update this runbook if the live workflow or telemetry contract has drifted.

Success criteria:

- The active PostHog project is verified as OptionData project `90561` before any reads.
- The access path is recorded: PostHog MCP/plugin, Chrome dashboard fallback, or explicit blocker.
- Error tracking is checked through issue data and/or `$exception` events.
- User insights are checked through dashboard tiles, HogQL, insight reads, or event schema reads.
- The report separates confirmed findings, empty-result caveats, and tracking gaps.
- Raw PII, full API keys, full customer ids, and full session replay URLs are not included in the final answer.
- The runbook maintenance section is considered before handoff.

Stop condition:

- Stop only after the report is complete, the blocker is explicit, or the user narrows the task.

## Agent Handoff

Last updated: 2026-06-24

### Look First

- [ ] Latest run verified project `90561` but found no PostHog events in the default windows and no ingestion after `2026-02-13T11:40:44Z` in a 365-day lookback. If the user asks for remediation, verify the current production deployment env/build path before changing dashboards: `NEXT_PUBLIC_POSTHOG_KEY` or `VITE_POSTHOG_KEY`, production hostnames, and whether the deployed bundle initializes PostHog on `optiondata.io`, `www.optiondata.io`, and `portal.optiondata.io`.

### Latest Run Note

Executed live with PostHog MCP on 2026-06-24. Dashboard `1280223`, expected actions, project settings, error-tracking settings, event schema, and HogQL checks were read-only. No durable procedure change was required.

## Goal

Teach an AI agent how to use PostHog to answer:

- Are OptionData users hitting client-side errors or unresolved error-tracking issues?
- Which routes, products, devices, browsers, or sessions are affected?
- What do current users appear to be doing in the portal?
- Are the activation, checkout, API-key, realtime, historical SQL, and option-chain flows producing useful telemetry?
- Which insights are actionable, and which require instrumentation or data-quality follow-up?

## Scope And Guardrails

Default to read-only PostHog work. Do not create, update, delete, archive, assign, suppress, merge, or alert on PostHog objects unless the user explicitly asks for those changes.

Use aggregate evidence by default. Do not paste raw emails, full Clerk user ids, full Stripe customer ids, full API keys, full IP addresses, or complete session replay URLs into the final report. If a concrete example is necessary, redact it.

Do not infer live product behavior from repository code alone. Code inspection can explain expected telemetry, but the final report must distinguish live PostHog evidence from instrumentation assumptions.

Chrome dashboard work is acceptable when the user requests it or when MCP/plugin access is blocked. Prefer PostHog MCP/plugin for repeatable reads and queries.

Be careful with project context. PostHog tools can retain an active project from previous tasks. Always switch to and verify project `90561` before reading dashboards, insights, events, or error tracking.

Host filters are useful for browser events, but they can hide server/backend events if applied too broadly. When checking mixed client/server telemetry, state exactly which host or URL filters were used.

## OptionData Context

- Product: OptionData portal.
- App repo: `/Users/evansmacbookpro/Desktop/Projects/optiondata-portal`.
- PostHog project home: `https://us.posthog.com/project/90561/home`.
- Expected project: `optiondata`, project id `90561`, organization `TradingFlow`.
- Expected timezone: UTC unless the live project says otherwise.
- Default error window: last 7 days.
- Default user-insight window: last 30 days.
- Production hosts to consider: `optiondata.io`, `www.optiondata.io`, `portal.optiondata.io`.
- Main behavior dashboard: `https://us.posthog.com/project/90561/dashboard/1280223`.
- Error tracking page: `https://us.posthog.com/project/90561/error_tracking`.

Expected portal event contract:

- `cta_click`
- `getting_started_step_click`
- `dashboard_section_viewed`
- `billing_action`
- `api_key_action`
- `survey_completed`
- `subscription_checkout`
- `realtime_connection`
- `historical_query_executed`
- `option_chain_query_executed`
- `$exception`
- `$dead_click`
- `$rageclick`

Expected OptionData PostHog actions, if still present:

| Action | Expected purpose |
| --- | --- |
| `OptionData: CTA clicked` | Key CTA engagement across landing and product pages. |
| `OptionData: Dashboard section viewed` | Dashboard product-section discovery. |
| `OptionData: Subscription checkout` | Checkout start/success/failure/cancel telemetry. |
| `OptionData: Data API playground used` | Historical SQL and option-chain playground usage. |
| `OptionData: Browser exception` | Browser `$exception` grouping for high-level monitoring. |

Expected dashboard tiles, if still present:

| Tile | Expected purpose |
| --- | --- |
| `OptionData custom event volume` | Event volume and instrumentation heartbeat. |
| `OptionData data playground outcomes` | Historical SQL and option-chain playground outcomes. |
| `OptionData subscription checkout outcomes` | Checkout conversion and failure signals. |
| `OptionData browser error signals` | Browser exception, rage click, and dead click signals. |
| `OptionData activation funnel with checkout` | CTA to survey, checkout, and API/data usage funnel. |

## Access Modes

### PostHog MCP Or Plugin

Use this path first when available.

1. Search or load the PostHog tools/skill exposed in the current environment.
2. Switch to project `90561`.
3. Read the active project back and confirm the project id/name in notes before querying.
4. Use native PostHog tools for dashboards, insights, actions, event definitions, error tracking, and HogQL when available.
5. If a tool requires schema discovery before SQL/HogQL, read the schema first.

Useful read-only capability categories:

- Project read/switch.
- Dashboard list/read.
- Insight list/read/run.
- Action list/read.
- Event/schema/property discovery.
- HogQL/SQL execution.
- Error tracking settings, issue list, issue details, and issue events.
- Session replay or person read only when necessary and privacy-safe.

### Chrome Dashboard Fallback

Use Chrome when the user explicitly requests browser/dashboard work or when MCP/plugin access is unavailable.

1. Open `https://us.posthog.com/project/90561/home`.
2. Confirm the visible project is OptionData, not a different TradingFlow project.
3. Open the dashboard at `https://us.posthog.com/project/90561/dashboard/1280223`.
4. Open error tracking at `https://us.posthog.com/project/90561/error_tracking`.
5. Use filters for the requested date range and environment/host.
6. Do not change dashboard tiles, alert settings, grouping rules, assignments, suppression rules, or project settings without explicit user approval.

### CLI Fallback

Use CLI only if it is already configured and can be verified quickly. Previous local environments have had PostHog CLI/token or bundle drift, so do not spend the whole audit debugging CLI if MCP or Chrome works.

Record the exact blocker if CLI is unavailable.

## Workflow

### 1. Confirm Scope And Access

Capture these facts before running analysis:

| Field | Required note |
| --- | --- |
| User request | Error audit, user insight summary, dashboard audit, or all three. |
| Date range | Use the user range, else errors last 7 days and insights last 30 days. |
| Project | Must be project `90561`. |
| Access mode | MCP/plugin, Chrome, CLI, or blocked. |
| Filters | Host, environment, user cohort, test-account exclusion, or none. |

If project access fails, stop and report the blocker. Do not substitute another PostHog project.

### 2. Establish The Live Telemetry Surface

Use PostHog reads to answer:

- Does project `90561` still exist and match `optiondata`?
- Are the expected actions present?
- Does dashboard `1280223` still exist?
- Which relevant events exist in the schema for the requested date range?
- Are `$exception`, `$dead_click`, or `$rageclick` present?
- Are core portal events present, absent, or newly deployed with no volume yet?

When code cross-check is needed, inspect the portal repo:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/optiondata-portal
rg -n "posthog|captureException|capture_exceptions|ANALYTICS_EVENTS|track\\(" src
```

Use code findings only to explain expected instrumentation. Live PostHog reads remain the source of truth for the report.

### 3. Check Error Tracking

Prefer native error-tracking tools if exposed. Read:

- Error tracking settings.
- Open/unresolved issue list.
- Top issue details.
- Recent events for the top issues.
- Affected user count and event count.
- First seen and last seen timestamps.
- Browser, OS, device, route, URL, release, or build properties when present.
- Session replay availability without copying full replay links into the final report.

If native issue tools are unavailable, use HogQL against `$exception`.

Example error issue/event query:

```sql
SELECT
    properties['$exception_type'] AS exception_type,
    properties['$exception_message'] AS exception_message,
    properties['$current_url'] AS current_url,
    properties['$browser'] AS browser,
    properties['$os'] AS os,
    count() AS events,
    uniq(distinct_id) AS affected_users,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event = '$exception'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY
    exception_type,
    exception_message,
    current_url,
    browser,
    os
ORDER BY events DESC
LIMIT 20
```

Example browser-host filter:

```sql
AND (
    properties['$host'] IN ('optiondata.io', 'www.optiondata.io', 'portal.optiondata.io')
    OR properties['$current_url'] LIKE '%optiondata.io%'
)
```

Check frustration signals separately:

```sql
SELECT
    event,
    properties['$pathname'] AS pathname,
    properties['$current_url'] AS current_url,
    count() AS events,
    uniq(distinct_id) AS users,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event IN ('$dead_click', '$rageclick')
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY event, pathname, current_url
ORDER BY events DESC
LIMIT 25
```

If there are no errors:

- Confirm the project has browser error capture enabled in the SDK or project settings.
- Confirm `$exception` appears in event definitions or explain that it has not been seen.
- Check whether traffic volume is non-zero.
- State "no observed errors in the checked source/window", not "no errors exist".

### 4. Summarize User Insights

Use the dashboard and/or HogQL to summarize product usage.

Start with the expected dashboard:

- `OptionData custom event volume`
- `OptionData data playground outcomes`
- `OptionData subscription checkout outcomes`
- `OptionData browser error signals`
- `OptionData activation funnel with checkout`

If dashboard reads are unavailable, query the same underlying events.

Event-volume heartbeat:

```sql
SELECT
    event,
    count() AS events,
    uniq(distinct_id) AS users,
    min(timestamp) AS first_seen,
    max(timestamp) AS last_seen
FROM events
WHERE event IN (
    'cta_click',
    'getting_started_step_click',
    'dashboard_section_viewed',
    'billing_action',
    'api_key_action',
    'survey_completed',
    'subscription_checkout',
    'realtime_connection',
    'historical_query_executed',
    'option_chain_query_executed',
    '$exception',
    '$dead_click',
    '$rageclick'
)
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY event
ORDER BY events DESC
```

Product-section interest:

```sql
SELECT
    properties['section'] AS section,
    properties['source'] AS source,
    count() AS events,
    uniq(distinct_id) AS users
FROM events
WHERE event = 'dashboard_section_viewed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY section, source
ORDER BY events DESC
```

Checkout outcomes:

```sql
SELECT
    properties['status'] AS status,
    properties['source'] AS source,
    count() AS events,
    uniq(distinct_id) AS users
FROM events
WHERE event = 'subscription_checkout'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY status, source
ORDER BY events DESC
```

Data playground outcomes:

```sql
SELECT
    event,
    properties['status'] AS status,
    properties['test_mode'] AS test_mode,
    properties['is_trial'] AS is_trial,
    count() AS events,
    uniq(distinct_id) AS users
FROM events
WHERE event IN ('historical_query_executed', 'option_chain_query_executed')
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY event, status, test_mode, is_trial
ORDER BY events DESC
```

Realtime usage:

```sql
SELECT
    properties['status'] AS status,
    properties['mode'] AS mode,
    count() AS events,
    uniq(distinct_id) AS users
FROM events
WHERE event = 'realtime_connection'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY status, mode
ORDER BY events DESC
```

API key behavior:

```sql
SELECT
    properties['action'] AS action,
    properties['status'] AS status,
    count() AS events,
    uniq(distinct_id) AS users
FROM events
WHERE event = 'api_key_action'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY action, status
ORDER BY events DESC
```

When summarizing behavior, call out:

- Top visited product areas.
- Where users appear to drop off.
- Whether checkout starts, succeeds, fails, or cancels.
- Whether API-key generation/copy/usage actions are happening.
- Whether data APIs are being tried successfully or failing.
- Whether errors/friction cluster around a specific product page.
- Whether sample size is too small for confidence.

### 5. Audit Dashboard And Tracking Health

Read dashboard `1280223` if available and check:

- Does each tile load without an error?
- Does each tile use the expected time range?
- Are test accounts filtered as expected?
- Do key tiles have enough data to be useful?
- Are important events missing from the dashboard?
- Do action definitions still match current event/property names?

Use this matrix in the report:

| Surface | Status | Evidence | Action needed |
| --- | --- | --- | --- |
| Dashboard `1280223` | Present / missing / blocked | Tile names or blocker | Next step |
| Error tracking | Healthy / noisy / silent / blocked | Issue and event counts | Next step |
| Event schema | Complete / partial / stale | Event names seen/missing | Next step |
| Actions | Present / missing / stale | Action names and ids if needed | Next step |
| Product funnels | Useful / insufficient data / broken | Conversion or volume summary | Next step |

### 6. Optional Code Cross-Check

Use this when live PostHog data is confusing, empty, or appears stale.

In `/Users/evansmacbookpro/Desktop/Projects/optiondata-portal`, inspect:

- PostHog provider initialization.
- SDK options such as `capture_exceptions`.
- Event constants.
- Tracking helpers.
- API playground instrumentation.
- Checkout/subscription instrumentation.
- Error-boundary or exception capture code.

Report code cross-check findings separately:

| Expected from code | Seen in PostHog | Interpretation |
| --- | --- | --- |
| Event/helper/property | Yes / no / blocked | Deployed, not deployed, no traffic, or possible bug |

Do not patch app code during this runbook unless the user explicitly asks for implementation.

## Report Template

Use this shape for the final response:

```markdown
**PostHog Scope**
- Project: optiondata / 90561
- Window: <range>
- Access: <MCP/plugin/Chrome/CLI>
- Filters: <host/env/cohort/test-account filters>
- Caveats: <sampling, empty data, blocked tools>

**Error Health**
| Severity | Error/Issue | Events | Users | First/Last Seen | Evidence | Recommendation |
| --- | --- | ---: | ---: | --- | --- | --- |

**Friction Signals**
| Signal | Route/URL | Events | Users | Evidence | Recommendation |
| --- | --- | ---: | ---: | --- | --- |

**User Insights**
| Insight | Evidence | Confidence | Recommendation |
| --- | --- | --- | --- |

**Tracking Coverage**
| Surface | Status | Evidence | Next Step |
| --- | --- | --- | --- |

**Open Questions**
- <Only questions that block a stronger conclusion.>
```

Prioritize findings in this order:

1. Errors that block signup, survey completion, checkout, API-key generation, or data API usage.
2. Silent or broken instrumentation that prevents product decisions.
3. Conversion or usage insights with enough sample size to act on.
4. Low-sample observations and product hypotheses.

## Verification Gates

Before completing the task, verify:

- Project `90561` was explicitly confirmed.
- At least one error-tracking source was checked, or the blocker is documented.
- At least one user-insight source was checked, or the blocker is documented.
- Dashboard `1280223` was checked, searched for, or marked blocked.
- Query/tool names and date windows are included in notes.
- Empty results are backed by schema/settings/traffic checks where possible.
- The final report does not expose raw PII or secrets.
- Any discovered runbook drift is patched or listed as a follow-up.
- If this runbook was edited, `git diff --check` passes.

## Troubleshooting

| Problem | Likely cause | Response |
| --- | --- | --- |
| PostHog data looks like another product | Active MCP/project context is wrong | Switch to project `90561`, read the project back, then rerun reads. |
| `$exception` has zero events | No errors, SDK capture not deployed, setting disabled, or no traffic | Check settings/schema/traffic and report as "no observed errors" with caveat. |
| Dashboard tile is blank | No volume, stale event name, wrong filter, or tile error | Inspect the tile query or run equivalent HogQL. |
| Chrome shows different results than MCP | Date range, timezone, or filters differ | Align the exact window and filters; state which source is authoritative. |
| CLI cannot authenticate | Local token/scope/tooling drift | Prefer MCP or Chrome; report the CLI blocker without derailing the audit. |
| Host filter removes relevant events | Backend/server events lack browser host props | Run separate unfiltered or event-specific checks and label the difference. |
| Person/session details expose PII | Raw identity fields copied into report | Redact identities and report aggregate counts instead. |

## Runbook Self-Maintenance

When live evidence contradicts this runbook, update the runbook in the same pass unless the user explicitly asked for analysis only.

Maintenance checklist:

- Update project ids, dashboard ids, action names, tile names, and URLs when they drift.
- Add new core events to the expected event contract.
- Remove obsolete events only after verifying they are no longer emitted or intentionally deprecated.
- Update access-mode guidance if the PostHog MCP/plugin or CLI changes.
- Keep the handoff timestamp current when materially editing this runbook.
- Re-read the edited sections and run `git diff --check` before final handoff.
