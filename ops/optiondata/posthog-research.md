---
name: optiondata-posthog-research
description: Browser-first, read-only research runbook for OptionData traffic, acquisition, user behavior, conversion, retention, session replay, heatmaps, tracking health, and PostHog dashboard quality in project 90561.
disable-model-invocation: true
---

# OptionData PostHog Traffic And User Behavior Research

Use this runbook to research live traffic and user behavior for the OptionData portal in PostHog project `90561`.

This is a research workflow, not a dashboard-editing or instrumentation task. The normal deliverable is an evidence-backed report that separates:

- Acquisition and content traffic.
- Product usage and conversion behavior.
- Retention and repeat usage.
- Friction visible in recordings, heatmaps, errors, and web performance.
- Tracking and dashboard gaps that limit confidence.

## Recommended Invocation

Use `/goal` for a complete research pass.

Recommended objective:

> Research OptionData traffic and user behavior in PostHog project 90561 using ego-browser. Compare the requested period with a useful prior period, separate public content traffic from product behavior, inspect conversion, retention, replays, heatmaps, web performance, tracking health, and existing dashboards, then produce an aggregate evidence-backed report without exposing PII or changing PostHog objects. Update this runbook only when the live workflow reveals a reusable improvement or stale assumption.

Success criteria:

- The visible PostHog project is confirmed as `optiondata`, project id `90561`.
- The exact analysis period, comparison period, project timezone, domains, and test-user filters are recorded.
- Traffic, acquisition, product-route usage, activation/conversion, retention, and friction are each answered or explicitly marked `blocked`.
- Public blog traffic and logged-in/product traffic are analyzed separately.
- Existing dashboard `1280223` and relevant Product Analytics insights are reviewed before proposing new ones.
- Session replay is sampled across multiple relevant sessions when available.
- Saved heatmap coverage is inspected; missing coverage is reported rather than silently replaced with invented evidence.
- Installation Health and event/data quality are checked before interpreting an unexpected zero or sharp change.
- The final report contains aggregate evidence only and exposes no raw identities, secrets, or full replay links.
- No PostHog object is created, edited, archived, deleted, subscribed, or shared without explicit authorization.
- Runbook maintenance is considered before handoff.

Stop condition:

- Stop when the report and watchlist follow-up are complete, access is blocked with the exact blocker recorded, or the user changes the scope.

## Agent Handoff

Last updated: 2026-07-25

### Look First

- [ ] Confirm project `90561` still displays as `optiondata`; never substitute another TradingFlow PostHog project.
- [ ] Revalidate traffic quality before reporting growth. Project test-traffic filters now exclude localhost and a suspicious one-page browser signature observed on 2026-07-25, but that signature can drift. Report both raw and test-filtered baselines, and confirm the filter still removes automation without suppressing legitimate traffic.
- [ ] Recheck `subscription_checkout`, `demo_run`, `$dead_click`, and `$web_vitals`. Source now sends normalized demo outcomes, beacon checkout-session creation, and a deduplicated `returned_success` browser estimate after Stripe returns to billing, but these changes require deployment and fresh production events before the signals can be called healthy.
- [ ] Audit `OptionData conversion & behavior` (`1280223`), which is now the primary pinned dashboard. The three added insights — `OptionData estimated demo-to-checkout return funnel` (`FInZ59hD`), `OptionData estimated successful checkout returns` (`OOOIZUzd`), and `OptionData demo outcomes by surface` (`cjC0sDOD`) — have `Filter test accounts` enabled as of 2026-07-25. Confirm they render and receive fresh events after deployment. Generic dashboard `225257` is unpinned.
- [ ] Recheck saved heatmaps and replay coverage. Screenshot heatmaps now exist for homepage, survey, realtime data, historical data, and billing, with internal/test-user filtering enabled. Replays can expose identity and typed-content fields, which must remain out of reports.
- [ ] Recheck Installation Health. Authorized URLs now include `www.optiondata.io`, `optiondata.io`, and `portal.optiondata.io`; reverse proxying remains unconfigured, and `$web_vitals` cannot pass until the source change is deployed and production events arrive.
- [ ] When using PostHog's read-only APIs for aggregate analysis, return only explicitly allowlisted fields. Never log raw project, person, session, replay, cookie, or token payloads.
- [ ] PostHog pages can transiently render a blank shell or buffer a replay. Wait for the expected title and populated surface before concluding data is unavailable.

### Live Surfaces Confirmed On 2026-07-25

These are navigation expectations, not permanent claims about current data:

| Surface | URL | Expected purpose |
| --- | --- | --- |
| Project home | `https://us.posthog.com/project/90561/home` | Confirm project and pinned dashboards. |
| Web Analytics | `https://us.posthog.com/project/90561/web` | Traffic, paths, acquisition channels, devices, geography, retention, active hours, goals, recordings, errors, and frustrating pages. |
| Web vitals | `https://us.posthog.com/project/90561/web/web-vitals` | Page performance distributions and path breakdowns. |
| Page reports | `https://us.posthog.com/project/90561/web/page-reports` | Route-specific traffic and performance analysis. |
| Live traffic | `https://us.posthog.com/project/90561/web/live` | Short recency/ingestion sanity check. |
| Installation Health | `https://us.posthog.com/project/90561/web/health` | Data-quality checks for page views, page leave, scroll depth, URLs, proxying, and web vitals. |
| Main behavior dashboard | `https://us.posthog.com/project/90561/dashboard/1280223` | OptionData conversion and product-behavior insights. |
| Product Analytics | `https://us.posthog.com/project/90561/insights` | Trends, funnels, retention, paths, lifecycle, and saved insights. |
| Session replay | `https://us.posthog.com/project/90561/replay/home` | Qualitative review of journeys and friction. |
| Heatmaps | `https://us.posthog.com/project/90561/heatmaps` | Saved click/scroll heatmaps when present. |
| Marketing analytics | `https://us.posthog.com/project/90561/marketing` | Campaign integrations, spend, conversions, and ROAS when configured. |
| Event definitions | `https://us.posthog.com/project/90561/data-management/events` | Verify event names and recency. |
| Persons | `https://us.posthog.com/project/90561/persons` | Identity and person-property checks; handle as sensitive. |
| Cohorts | `https://us.posthog.com/project/90561/cohorts` | Reusable internal/test or behavioral segments when configured. |

## Goal

Answer these questions with live PostHog evidence:

1. How much traffic reached OptionData, how did it change, and where did it come from?
2. Which public content and product routes attract meaningful users rather than only page views?
3. Which journeys lead from discovery to activation, checkout, API-key use, realtime use, historical queries, and option-chain queries?
4. Where do users abandon, bounce, loop, encounter slow pages, rage click, dead click, or generate errors?
5. Which behaviors repeat and retain users?
6. Does the current event, identity, replay, and dashboard setup support confident decisions?

## Scope And Guardrails

- Default to read-only work.
- Use live PostHog as the primary source for traffic and behavior claims.
- Repository code may explain expected telemetry, but it cannot prove live event volume, conversion, or user behavior.
- Do not create or edit dashboards, insights, cohorts, actions, heatmaps, replay collections, surveys, feature flags, annotations, alerts, subscriptions, or project settings unless the user explicitly asks.
- Do not click `Subscribe`, `Share`, `Edit layout`, `Add`, `New heatmap`, or other mutating controls during research.
- Use aggregate evidence. Do not include raw emails, names, IP addresses, full Clerk ids, full Stripe customer ids, API keys, session ids, distinct ids, or full recording links in the final report.
- Do not open a named person's history merely because the identity is visible. Prefer route/event filters and aggregate cohorts.
- Treat replay as qualitative evidence. Do not generalize from a single recording unless it reproduces a clear defect.
- Keep content/SEO traffic separate from authenticated or product-route behavior. A traffic spike on `/blog/*` is not evidence of product activation.
- Record whether `Filter test accounts`, path cleaning, domain filters, and any person/cohort filters were enabled. Never assume their current state.
- If production browser events and backend events are mixed, do not apply `$host` or browser-only filters to backend events without first checking their properties.
- Do not treat a PostHog loading shell, blank chart, or zero result as proof of no data until Installation Health, event definitions, date range, filters, and page loading are checked.

## Default Scope

Unless the user overrides:

| Dimension | Default |
| --- | --- |
| Product | OptionData portal |
| App repo | `/Users/evansmacbookpro/Desktop/Projects/optiondata-portal` |
| PostHog project | Expected name `optiondata`, project id `90561`; confirm visibly every run |
| PostHog host | `https://us.posthog.com` |
| Analysis period | Last 30 complete days |
| Comparison | Previous 30 complete days |
| Recency check | Last 7 days and Live traffic for ingestion/regression sanity |
| Production domains | `www.optiondata.io`, `optiondata.io`, and `portal.optiondata.io` when present |
| Primary segments | Public content vs product routes; anonymous vs identified; new vs returning; source/channel; device; geography |
| Exclusions | Internal/test accounts, localhost/dev/staging hosts, QA traffic, and known bots when safely identifiable |
| Access mode | `ego-browser` unless the user explicitly requests another connected PostHog access path |

Use explicit calendar dates in the report, not only relative labels such as `Last 30 days`. Record the project timezone shown by PostHog.

## Long-Term Research Watchlist

Every complete run must revisit each active item and label it `worse`, `unchanged`, `improved`, `resolved`, or `blocked`.

| ID | Area | What to check |
| --- | --- | --- |
| OD-PH-W1 | Acquisition quality | Separate content/SEO traffic from direct product traffic; compare channel quality, bounce, next actions, and product-route entry. |
| OD-PH-W2 | Activation and conversion | Verify the CTA, getting-started, survey, checkout, API-key, realtime, historical-query, and option-chain journey remains measurable and identify the largest drop-off. |
| OD-PH-W3 | Engagement and retention | Measure repeat core-product behavior, not only repeat `$pageview`; compare new, returning, resurrected, and dormant users where available. |
| OD-PH-W4 | Replay and heatmap coverage | Check whether saved heatmaps now exist for high-traffic and high-friction routes; sample replays across the routes that drive the strongest funnel or frustration signals. |
| OD-PH-W5 | Installation and event health | Recheck Installation Health, event definitions, last-seen timestamps, SPA page-view behavior, web vitals, and any unexplained ingestion gap. |
| OD-PH-W6 | Internal filtering and privacy | Verify test-account filtering/cohorts, avoid PII in reports, and check whether identity stitching supports anonymous-to-known journey analysis without double-counting. |
| OD-PH-W7 | Dashboard quality | Audit dashboard `1280223`, generic dashboard `225257` if still present, and saved insights for stale events, broken tiles, inconsistent windows, duplicate purpose, or event-count bias. |

Add a watchlist item only for a recurring question that future runs should compare. Keep one-off traffic numbers and incident findings in the run report.

## Access Workflow: ego-browser

The browser is the default access path for this runbook because it reuses the user's authenticated PostHog session.

1. Read the current `ego-browser` skill before operating the site.
2. Create or reuse one task space for the entire research task.
3. Open the project home and verify the visible project name and URL.
4. Reuse the same task space across Web Analytics, dashboards, insights, replay, heatmaps, and data-quality checks.
5. Prefer semantic snapshots for normal PostHog controls and tables.
6. Use compact DOM extraction only to summarize headings, table headers, links, and aggregate values. Never extract or log identity-heavy tables unnecessarily.
   - If a read-only PostHog API is needed for aggregate analysis, construct an explicit allowlist for the result before logging it.
   - Never print raw project, person, session, replay, cookie, CSRF, or token payloads. Project and replay responses can contain secrets or PII even when the endpoint itself is read-only.
7. After meaningful navigation or filtering, verify the title, URL, selected range, filters, and resulting content before recording evidence.
8. If the page is blank or still titled only `PostHog`, wait and recheck before declaring a blocker.
9. If PostHog asks for login, CAPTCHA, or another manual action, hand the task space to the user and wait for explicit confirmation before taking control back.
10. Close the task space with `completeTaskSpace(..., { keep: false })` only after the research and runbook maintenance checks are complete.

Illustrative start:

```bash
ego-browser nodejs <<'EOF'
const task = await useOrCreateTaskSpace('optiondata posthog research')
cliLog('task space id: ' + task.id)

await openOrReuseTab('https://us.posthog.com/project/90561/home', {
  wait: true,
  timeout: 30,
})

cliLog(JSON.stringify(await pageInfo(), null, 2))
cliLog(await snapshotText())
EOF
```

Do not reuse snapshot reference numbers across snapshots or hardcode them in this runbook. Prefer stable URLs, accessible names, and text labels.

## Criteria For Success

The review is complete only when all applicable criteria are answered:

1. **Target confirmed** — project name, id, host, timezone, date range, comparison range, domains, and filters are recorded.
2. **Traffic baseline reviewed** — visitors, page views, sessions, session duration, bounce rate, and trend deltas are summarized.
3. **Acquisition reviewed** — channels, sources/referrers or UTM evidence, landing paths, geography, devices, and content-vs-product mix are summarized.
4. **Product behavior reviewed** — top product routes, journey paths, conversion/activation, repeated use, and product-area outcomes are summarized.
5. **Retention reviewed** — retention or lifecycle is anchored to a meaningful product action when tracking supports it.
6. **Friction reviewed** — frustrating pages, rage/dead clicks, errors, representative replays, heatmap coverage, and web vitals are reviewed or blocked.
7. **Tracking health reviewed** — Installation Health, event definitions, last-seen recency, SPA tracking, identity/test filters, and major expected events are checked.
8. **Dashboards reviewed** — dashboard `1280223` and relevant saved insights are checked for purpose, freshness, filters, data, and gaps.
9. **Evidence is safe** — the report uses aggregate values and redacted examples without raw PII, secrets, or full replay links.
10. **Recommendations are prioritized** — distinguish `P0 data correctness`, `P1 product decision`, and `P2 cleanup`.
11. **Watchlist and maintenance completed** — every watchlist item is updated in the report and this runbook is changed only for reusable improvements.

## Required Workflow

### 0. Confirm The Research Contract

Record:

| Field | Required note |
| --- | --- |
| User question | Traffic, acquisition, conversion, retention, feature behavior, friction, or full review |
| Project | Must visibly be `optiondata` / `90561` |
| Analysis period | Exact start and end dates |
| Comparison period | Exact start and end dates |
| Timezone | Read from live project/settings or state `not verified` |
| Domains | All domains or named production domains |
| Test filtering | On/off and any cohort/person filters |
| Path cleaning | On/off |
| Access | ego-browser or explicitly requested alternative |

If the project is wrong or inaccessible, stop. Do not substitute project `300646` or any other TradingFlow project.

### 1. Verify Live Ingestion And Data Quality

Before interpreting a zero, decline, or missing journey:

1. Open Live traffic and confirm whether recent events appear.
2. Open Installation Health and inspect:
   - `$pageview`
   - `$pageleave`
   - Scroll depth
   - Authorized URLs
   - Reverse proxy
   - `$web_vitals`
3. Open Event definitions and verify relevant events exist and have recent `last seen` timestamps.
4. Confirm the chosen date range, domain, test-account filter, and path cleaning.
5. If data still appears absent, compare a short recent window with a wider window.

Classify the result:

- `healthy`: relevant events are current and health checks support interpretation.
- `partial`: traffic is present but one or more required signals are missing.
- `stale`: expected events exist but have not appeared recently.
- `blocked`: the page or evidence cannot be read.

### 2. Establish The Traffic Baseline

Open Web Analytics and set the analysis and comparison periods.

Capture:

- Visitors.
- Page views.
- Sessions.
- Session duration.
- Bounce rate.
- Trend delta versus the comparison period.
- Daily/weekly shape and material spikes or drops.
- Whether the incomplete current day is included.

Do not compare partial current-day data with a complete prior day without a caveat.

Then inspect:

- **Paths** — visitors, views, bounce, and recording/heatmap/error entry points.
- **Sources by Channel** — organic, direct, referral, paid, social, email, or other values present.
- **Devices** — desktop, mobile, tablet, and any material device/browser differences.
- **Geography** — country/region mix and suspicious concentration.
- **Active hours** — usage by weekday/hour in the project timezone.
- **Retention** — initial repeat-visit signal, with the limitations of pageview-based retention stated.

### 3. Separate Content Acquisition From Product Usage

At minimum, report these route groups separately:

| Group | Example route patterns | Interpretation |
| --- | --- | --- |
| Content acquisition | `/blog/*`, documentation or comparison pages | Discovery/SEO traffic; evaluate landing quality and next action. |
| Marketing and activation | `/`, `/survey`, pricing or signup surfaces | CTA, onboarding, and account-start behavior. |
| Product use | `/home`, `/realtime_data`, `/historical_data`, `/option_chain` | Core data-product engagement. |
| Monetization and account | `/billing`, API-key/account surfaces | Checkout, subscription, and account maintenance. |
| Support/error | `/support`, error/empty-state routes | Friction or help-seeking behavior. |

For each material group, capture:

- Visitors, sessions, and views.
- Bounce or next-step behavior.
- New vs returning or anonymous vs identified when supported.
- Channel/source mix.
- Device mix.
- Representative conversion or product events.
- Whether route aliases, trailing slashes, query strings, or path cleaning split the same surface.

Do not report a blog-driven visitor increase as product growth unless users subsequently reach a meaningful activation or product event.

### 4. Review The Existing Conversion And Behavior Dashboard

Open dashboard `1280223` and verify its live title and description.

The 2026-07-25 inspection found these expected tiles:

- `OptionData demo outcomes by surface`
- `OptionData estimated successful checkout returns`
- `OptionData estimated demo-to-checkout return funnel`
- `OptionData custom event volume`
- `OptionData activation funnel with checkout`
- `OptionData browser error signals`
- `OptionData subscription checkout outcomes`
- `OptionData data playground outcomes`
- `OptionData conversion funnel`
- `Getting started step flow`

For every live tile:

- Record insight name and URL.
- Record date range and filters.
- Confirm it loads and returns current data.
- Identify whether the metric counts events, users, persons, or sessions.
- Inspect event names and required properties.
- Check test-account, host/domain, and environment filtering.
- Check whether its purpose overlaps another tile.
- Mark missing volume as `no observed data`, `stale definition`, `filter problem`, or `blocked`; do not guess.

Also inspect `My App Dashboard` / dashboard `225257` if it still exists. Decide whether it adds unique operational value or is generic/stale. Do not delete it during research.

### 5. Review Product Behavior And Funnels

Start from existing insights before creating temporary analysis.

Expected OptionData event families include:

- `cta_click`
- `getting_started_step_click`
- `dashboard_section_viewed`
- `billing_action`
- `api_key_action`
- `survey_completed`
- `subscription_checkout`
- `demo_run`
- `realtime_connection`
- `historical_query_executed`
- `option_chain_query_executed`
- `$pageview`
- `$pageleave`
- `$exception`
- `$dead_click`
- `$rageclick`

Verify every event against live Event definitions and recent data. Treat this list as an expected contract, not proof of current ingestion.

Analyze the strongest measurable journeys:

1. Public landing/content entry.
2. CTA or getting-started action.
3. Survey or account activation.
4. Normalized successful demo (`demo_run`, `status = succeeded`).
5. Checkout start, session creation, and successful browser return.
6. API-key action.
7. Realtime connection.
8. Historical or option-chain query.
9. Repeat core action in a later session/day/week.

For each funnel:

- State whether steps are sequential or unordered.
- State the conversion window.
- Prefer unique users/persons for conversion; use events only when repeat actions are the question.
- Report step counts, conversion percentage, median time to convert when available, and the largest drop-off.
- Break down only by a decision-useful property such as source, device, plan, product, or outcome.
- Keep browser-only and backend-only events visible by using event-appropriate filters.
- Note any step that is unmeasurable because the event/property contract is missing.

For monetization analysis:

- Treat `subscription_checkout` statuses `started` and `session_created` as intent and redirect health.
- Treat `subscription_checkout` status `returned_success` with `estimate = true` as a browser-observed checkout-return estimate only.
- Do not call `returned_success` payment confirmation, subscription activation, recognized revenue, or MRR. Use Stripe reporting when financial truth is required.
- A missing `returned_success` can mean abandonment, a closed tab, blocked analytics, or a return that never rendered; a present event can be replayed despite client-side deduplication.
- Use `demo_run` for cross-surface comparison. Break down by `surface`, `mode`, and `status`; use the older surface-specific events only for detailed diagnostics.

### 6. Review Engagement, Lifecycle, And Retention

Use a meaningful core action as the return event when available:

- Successful realtime connection.
- Successful historical query.
- Successful option-chain query.
- API-key use or another verified recurring value event.

Do not use `$pageview` as the only retention definition if product events are available.

Review:

- Daily, weekly, and monthly active users for a core action.
- Repeat product use by week.
- New, returning, resurrected, and dormant users where Lifecycle is available.
- Retention by first meaningful product use.
- Stickiness or frequency distribution for core actions.
- Differences by acquisition source, route group, plan, or device when sample size supports it.

State when identity stitching or low volume makes user-level retention unreliable.

### 7. Review Session Replay

Use route, event, frustration, and duration filters rather than named identities.

Sample across:

- A top content landing route.
- The top product route.
- The largest funnel drop-off.
- A high-bounce product route.
- A route with rage/dead clicks or errors.
- A slow or poor-web-vitals route.

When volume permits, review at least three recordings for each claimed pattern. Avoid spending the review on one unusually long session.

For each pattern, capture only:

- Route and journey stage.
- Anonymous/identified status without identity value.
- Device/browser category.
- Approximate duration.
- Key actions and navigation loop.
- Error, rage/dead click, console, or performance signals.
- Whether the pattern supports, contradicts, or cannot explain aggregate metrics.

Never paste a person's email, id, full recording URL, typed content, or sensitive account/data values into the report.

### 8. Review Heatmaps And Page Reports

Open the saved Heatmaps page first.

If saved heatmaps exist, inspect at least:

- Highest-traffic content route.
- Homepage or activation route.
- Highest-traffic product route.
- Largest funnel-drop route.
- Highest-friction route.

Record:

- Heatmap name or id.
- Route/URL rule.
- Date range.
- Data URL or snapshot count when visible.
- Click concentration.
- Dead/non-interactive click areas.
- Scroll or attention drop-off.
- Primary CTA/control visibility and interaction.
- Agreement or disagreement with replay and funnel evidence.

If no saved heatmaps exist:

- Report `Saved heatmap coverage: none observed`.
- Use the route's `View heatmap` entry point or a replay's `View heatmap` surface only for read-only inspection when it already renders data.
- Use replay, Frustrating Pages, errors, and Page Reports as fallback evidence.
- Do not click `New heatmap` or save a heatmap without explicit authorization.

Use Page Reports for route-specific analysis and Web Vitals for performance distributions. Check at least:

- LCP.
- INP.
- CLS.
- The percentile selected, such as P75.
- Path/device/browser breakdown when a metric is poor.

Do not claim performance caused behavior merely because the same route is slow. Use replay or a consistent segmented relationship to support causality.

### 9. Review Friction And Error Signals

Use Web Analytics `Frustrating Pages`, Error Tracking summaries, and relevant replays.

Capture:

- Rage clicks.
- Dead clicks.
- Error occurrences and affected-user counts.
- Routes with repeated friction.
- Whether problems affect activation, checkout, API-key, realtime, historical, or option-chain journeys.
- Whether the issue is current in the recency window.

This runbook is not the full error-triage procedure. For issue-level error investigation, use:

- `ops/optiondata/posthog-errors-and-user-insights.md`

Cross-reference the error runbook rather than duplicating deep issue triage here.

### 10. Audit Tracking And Identity Quality

Compare live Event definitions and observed properties with the application code only when needed.

Repository starting point:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/optiondata-portal
rg -n "posthog|capture\\(|captureException|identify\\(|alias\\(|reset\\(|PostHogProvider|posthog-js|ANALYTICS_EVENTS|track\\(|\\$pageview" src
```

Check:

- PostHog provider initialization and production host/environment gating.
- SPA route/page-view capture and duplicate risk.
- `$pageleave`, scroll-depth, replay, exception, and web-vitals configuration.
- Stable event naming.
- Required route, source, product, status, outcome, plan, and error properties.
- Anonymous-to-known identify/alias behavior.
- Logout/reset behavior.
- Internal/test tagging or cohorts.
- PII and sensitive account/data leakage.
- Browser-versus-backend event properties and filters.
- First/last seen timestamps for expected product events.

Use this comparison:

| Expected from code | Seen live | Interpretation |
| --- | --- | --- |
| Event/property/identity behavior | yes / no / stale / blocked | deployed, no traffic, filtered, stale build, or possible tracking defect |

Do not patch the portal repository during this research run unless the user explicitly asks for implementation.

### 11. Judge Dashboard And Research Readiness

Rate the setup:

- `reasonable`: current surfaces answer traffic, acquisition, activation, engagement, retention, monetization, and friction questions with consistent filters.
- `partial`: useful data exists, but one or more decisions require manual reconstruction or missing tracking.
- `unreliable`: broken/stale definitions, identity/filter problems, or ingestion gaps make key conclusions unsafe.
- `blocked`: access or live data cannot be read.

Dashboard checks:

- Purpose and owner are clear.
- Tiles load and are fresh.
- Date ranges and comparison periods align.
- Production/test/internal filters are explicit.
- Product events are not hidden by browser-only filters.
- User/session/person counts match the question.
- Empty and missing states are visible.
- Content traffic does not dominate product KPIs.
- Retention uses a meaningful action.
- Friction and performance have direct drill-down paths.
- Generic or duplicate dashboards are identified.

Do not recommend a new dashboard until existing dashboard `1280223` and saved insights have been audited.

## Evidence Rules

- Prefer exact counts, percentages, deltas, and date ranges over vague statements.
- Label PostHog UI evidence separately from repository/code expectations.
- Name the surface used: Web Analytics, Page Reports, dashboard/insight, Event definitions, Session Replay, Heatmaps, Installation Health, or Marketing Analytics.
- Include dashboard or insight URLs when safe.
- Do not include full recording URLs or identity-bearing URLs.
- A pattern from replays requires multiple representative recordings when volume permits.
- A zero requires a data-quality and filter check.
- A funnel requires explicit step order, window, unit, and filters.
- A retention claim requires an explicit start and return event.
- A content-traffic claim must not be presented as product activation.
- Mark missing evidence as `unknown` or `blocked`.
- Keep sampling, incomplete-day, timezone, bot, and identity caveats close to the affected conclusion.

## Report Template

```markdown
# OptionData PostHog Traffic And Behavior Report

## Scope
- Project:
- Analysis period:
- Comparison period:
- Timezone:
- Domains:
- Filters and path cleaning:
- Access:
- Surfaces reviewed:
- Caveats:

## Executive Summary
- Overall read:
- Biggest highlights:
- Biggest bads:
- Most important unknowns:

## Traffic And Acquisition
| Metric | Current | Comparison | Change | Evidence |
| --- | ---: | ---: | ---: | --- |

- Content vs product traffic:
- Top paths and landing paths:
- Channels/sources:
- Device/browser:
- Geography:
- Active hours:

## Product Behavior
| Journey or feature | Users | Conversion/outcome | Drop-off | Evidence |
| --- | ---: | --- | --- | --- |

- Main paths:
- Activation:
- Checkout:
- API key:
- Realtime:
- Historical data:
- Option chain:

## Engagement And Retention
- Core action:
- Active users:
- Repeat use:
- Retention/lifecycle:
- Identity or sample caveats:

## Friction And Performance
| Route | Signal | Users/sessions | Evidence | Interpretation |
| --- | --- | ---: | --- | --- |

- Replay patterns:
- Heatmap coverage/findings:
- Web vitals:
- Errors/rage/dead clicks:

## Tracking And Dashboard Readiness
- Installation health:
- Event coverage:
- Identity/test filtering:
- Dashboard `1280223`:
- Other dashboards/insights:
- Readiness verdict:

## Recommendations
- P0 data correctness:
- P1 product decision:
- P2 cleanup:

## Long-Term Watchlist Follow-up
- OD-PH-W1:
- OD-PH-W2:
- OD-PH-W3:
- OD-PH-W4:
- OD-PH-W5:
- OD-PH-W6:
- OD-PH-W7:
- New items:
- Resolved items:

## Runbook Maintenance
- Changed / no change:
- Reason:
```

## Verification Gates

Before completing:

- Project `optiondata` / `90561` was visibly confirmed.
- Exact calendar windows and timezone were recorded.
- Test-account, domain, cohort/person, and path-cleaning filters were recorded.
- Current-day incompleteness was handled.
- Content and product routes were separated.
- Traffic, acquisition, behavior, conversion, retention, replay, heatmaps, performance, and tracking health were checked or marked blocked.
- Dashboard `1280223` was reviewed.
- Every active watchlist item received a status.
- No raw PII, secret, distinct id, session id, or full replay URL appears in the report.
- No PostHog mutations were made without authorization.
- Any runbook edit was re-read and `git diff --check` passes.
- The ego-browser task space is completed in a dedicated final browser command.

## Troubleshooting

| Problem | Likely cause | Response |
| --- | --- | --- |
| PostHog page shows a blank shell or title only says `PostHog` | Heavy page still loading | Wait, then recheck title, URL, and populated main content before concluding no data. |
| Metrics suddenly show zero | Wrong project, window, domain, test filter, path cleaning, or ingestion issue | Reconfirm project and filters, check Live traffic, Installation Health, and Event definitions. |
| Traffic is high but product activity is low | Content/SEO routes dominate | Segment `/blog/*` from activation and product routes; evaluate the next meaningful action. |
| Dashboard tile is blank | No volume, stale event/property, filter mismatch, or tile error | Open the insight, inspect its definition, and compare with Event definitions and raw UI evidence. |
| Funnel counts disagree with Web Analytics | Different unit, window, order, or filters | Align users/persons/sessions, date range, sequence, domains, and test filtering. |
| User counts look inflated | Anonymous and known identities split or events counted as users | Inspect identify/alias behavior and use the correct person/user unit. |
| No saved heatmaps | Heatmaps were never saved or coverage is absent | Report the gap; use read-only per-page heatmap/replay/frustration evidence without creating one. |
| Replays expose customer identities | Session replay person metadata is visible | Do not copy identities; summarize route-level patterns and aggregate counts only. |
| A read-only API response contains tokens or PII | PostHog project, person, session, or replay endpoints return broader payloads than the analysis needs | Stop logging the raw response, discard it from notes, and re-run with an explicit field allowlist that returns aggregate evidence only. |
| Web vitals are absent | SDK configuration or Installation Health issue | Check `$web_vitals`, route coverage, date range, and production domain before interpreting. |
| Browser and another PostHog access path disagree | Project, timezone, range, filter, or query semantics differ | Align all settings and state which source/definition supports the final number. |

## Runbook Self-Maintenance

After every execution, decide whether this file should change.

Update it in the same pass when live work reveals a reusable improvement:

- A project, dashboard, insight, event, route, or URL assumption drifted.
- PostHog navigation or ego-browser loading behavior changed.
- A standard filter or cohort became available.
- A better method for separating content, product, backend, bot, or test traffic was proven.
- A recurring tracking, identity, heatmap, replay, dashboard, or performance issue belongs on the watchlist.
- A report field or verification gate would prevent a repeated analytical mistake.

Keep transient findings in `Agent Handoff`, the watchlist baseline, or the run report. Do not encode one-off traffic numbers, named-user behavior, temporary incidents, or unsupported hypotheses as permanent procedure.

When maintaining:

1. Prune or revise stale handoff and watchlist items.
2. Add the smallest reusable procedure change.
3. Re-read the edited sections.
4. Run `git diff --check`.
5. State `Runbook maintenance: changed` with the reason, or `Runbook maintenance: no change`.
