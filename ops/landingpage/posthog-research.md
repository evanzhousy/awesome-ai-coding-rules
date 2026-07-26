---
name: landingpage-posthog-research
description: Read-only PostHog research runbook for summarizing TradingFlow landing-page traffic, acquisition, content engagement, CTA intent, repeat behavior, replay, heatmaps, performance, errors, and tracking quality in project 344580.
disable-model-invocation: true
---

# TradingFlow Landing Page PostHog User Behavior Summary

Use this runbook to summarize live user behavior for
`/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage` from
PostHog project `344580`.

This is a read-only analytics workflow. Its normal deliverable is an
aggregate, evidence-backed report covering:

- Traffic and acquisition.
- Content discovery and engagement.
- Marketing CTA and outbound-app intent.
- Repeat visits and returning-audience behavior.
- Friction visible in paths, replays, heatmaps, errors, and web vitals.
- Tracking and dashboard gaps that limit confidence.

For the canonical landing event/property definitions and source emitters, use
[`posthog-events.md`](./posthog-events.md). This runbook owns live behavior
research; `posthog-events.md` owns telemetry taxonomy and governance.

## Recommended Invocation

Use `/goal` for a complete behavior-summary pass.

Recommended objective:

> Summarize TradingFlow landing-page user behavior in PostHog project 344580 using the connected PostHog plugin/MCP. Compare the requested period with a useful prior period, separate content discovery from conversion surfaces, inspect acquisition, engagement, CTA intent, retention, paths, replays, heatmaps, performance, errors, event health, and existing dashboards, then produce an aggregate report without exposing PII or changing PostHog objects. Update this runbook only when the live workflow reveals a reusable improvement or stale assumption.

Success criteria:

- The active PostHog project is confirmed as
  `www.tradingflow.com(landingpage)`, id `344580`.
- Exact analysis and comparison dates, UTC project timezone, production
  domains, consent limitations, path cleaning, and test filters are recorded.
- Traffic, acquisition, route/content behavior, CTA intent, repeat behavior,
  friction, performance, and tracking health are answered or marked
  `blocked`.
- Content and learning traffic is separated from homepage, pricing, product
  proof, and outbound-app intent.
- Dashboard `1365389` and relevant saved insights are reviewed before new
  analysis is proposed.
- `free_trial_started` is reported as landing-site trial intent, never as
  confirmed signup, subscription, or revenue.
- Replays and heatmaps are reviewed when the connected read-only tools expose
  them; missing tool or data coverage is reported explicitly.
- The final report contains aggregate evidence only and exposes no raw
  identities, secrets, session ids, or full replay links.
- No PostHog object is created, edited, archived, deleted, subscribed, or
  shared without explicit authorization.
- Runbook maintenance is considered before handoff.

Stop condition:

- Stop when the behavior summary and watchlist follow-up are complete, access
  is blocked with the exact blocker recorded, or the user changes the scope.

## Agent Handoff

Last updated: 2026-07-26

The full read-only behavior-summary workflow was executed on 2026-07-25 for
the 30 complete UTC days from 2026-06-25 through 2026-07-24, compared with
2026-05-26 through 2026-06-24. A follow-up authorized repair pass on
2026-07-25 updated the landing telemetry adapter and existing PostHog
dashboards/insights, authorized `https://tradingflow.com` for Web Analytics,
and made dashboard `1365389` primary without deleting analytics history.
On 2026-07-26, live schema and path values confirmed that `/learn/`,
`/learn/.../`, `/blogs/`, and `/blogs/.../` already emit `page_viewed`; the
`Learn & Blogs views` insight was added to the primary dashboard for direct
visibility. A source implementation later that day added consented CTA
impressions, privacy-safe site-search outcomes, and a bounded landing-to-app
attribution handoff. These source expectations are not live evidence until the
landing and app deployments are verified. A post-implementation live schema
check still found none of `cta_viewed`, `site_search_performed`,
`site_search_result_clicked`, `marketing_handoff_landed`, or
`account_registration_completed`, so no empty dashboard tiles were created.

### Look First

- [ ] After the next landing deployment, confirm the single-owner page-view
  adapter emits exactly one `$pageview` and one `page_viewed` per consented
  route transition. Until that live check passes, continue using
  `page_viewed` for traffic and treat Web Analytics visitor/session/bounce/
  duration comparisons as unsupported.
- [ ] Segment comparisons by tracking version. `outbound_app_clicked` and
  `cta_location` coverage changed within the comparison horizon, and the same
  normalized route appeared with multiple `page_type` values. Use normalized
  `path` for route families and treat `page_type` as advisory.
- [ ] Recheck installation health after the next landing deployment. Source
  now targets PostHog JS `1.407.2`, but the live site still served `1.360.2`
  during verification.
- [ ] Re-baseline `/learn/` and the flagged detail routes after deployment.
  A live browser trace on 2026-07-25 measured `/learn/` H1 LCP near 1.96s and
  negligible CLS, so the earlier 27.7s aggregate was not reproducible and no
  speculative layout change was made. Escalate only if fresh samples remain
  slow or replay/segment evidence identifies a concrete cause.
- [ ] No saved heatmaps existed. Aggregate heatmap reads were available, but
  AI replay summarization was blocked because it would send individual replay
  contents to an unspecified model without separate authorization. Keep
  replay conclusions blocked unless the user explicitly approves that risk or
  a safer first-party review path is available.
- [ ] Preserve the project and privacy boundary: confirm project `344580`,
  consent/DNT coverage, and the live schema every run; never substitute
  project `300646`, expose project/person/session payloads, or claim downstream
  signup, subscription, or product activation from landing events alone.
- [ ] After deployment, verify `cta_viewed`, `site_search_performed`, and
  `site_search_result_clicked` in project `344580`. Confirm CTA exposure uses
  the 50%-for-one-second rule and search properties contain no raw query,
  title, excerpt, or full result URL.
- [ ] Verify the cross-project acquisition chain in project `300646`:
  `marketing_handoff_landed` → `account_registration_completed` → existing
  billing lifecycle events. Registration is backend-authoritative and must
  appear only for a newly created account with a verified Clerk identity.
  Report the two projects separately; the bounded handoff is attribution
  context, not shared cross-project identity.
- [ ] Once the new landing events are observed, add and verify dashboard
  `1365389` tiles for CTA exposure-to-click rate, search zero-result rate, and
  search result-click rate.

### Live Surfaces Confirmed On 2026-07-25

These are navigation expectations, not permanent claims about current data:

| Surface | URL | Expected purpose |
| --- | --- | --- |
| Project home | `https://us.posthog.com/project/344580/home` | Confirm project identity and pinned surfaces. |
| Web Analytics | `https://us.posthog.com/project/344580/web` | Traffic, acquisition, paths, devices, geography, retention, recordings, errors, and frustrating pages. |
| Web vitals | `https://us.posthog.com/project/344580/web/web-vitals` | LCP, INP, CLS, and route/device breakdowns. |
| Page reports | `https://us.posthog.com/project/344580/web/page-reports` | Route-specific traffic and performance. |
| Live traffic | `https://us.posthog.com/project/344580/web/live` | Short-recency ingestion check. |
| Installation Health | `https://us.posthog.com/project/344580/web/health` | Page-view, page-leave, scroll, URL, proxy, and web-vitals health. |
| Main conversion dashboard | `https://us.posthog.com/project/344580/dashboard/1365389` | Project primary dashboard for saved landing, content, CTA, and trial-intent insights. |
| Product Analytics | `https://us.posthog.com/project/344580/insights` | Trends, funnels, retention, paths, lifecycle, and saved insights. |
| Session replay | `https://us.posthog.com/project/344580/replay/home` | Qualitative journey and friction review. |
| Heatmaps | `https://us.posthog.com/project/344580/heatmaps` | Saved click/scroll heatmaps when present. |
| Error Tracking | `https://us.posthog.com/project/344580/error_tracking` | Current exception groups and affected sessions/users. |
| Event definitions | `https://us.posthog.com/project/344580/data-management/events` | Event existence, properties, and recency. |

## Goal

Answer these questions with live PostHog evidence:

1. How much tracked traffic reached the landing site, how did it change, and
   where did it come from?
2. Which content, learning, product-proof, comparison, and conversion pages
   attract meaningful visitors rather than only page views?
3. Which pages and sources lead to content engagement, CTA clicks, and
   outbound-app intent?
4. Where do tracked visitors bounce, loop, stop scrolling, rage click, dead
   click, encounter errors, or experience slow pages?
5. Which audiences return, and which content or marketing surfaces bring them
   back?
6. Does the current event, consent, identity, replay, heatmap, and dashboard
   setup support confident marketing decisions?

## Scope And Guardrails

- Default to read-only work.
- Use live PostHog as the primary source for traffic and behavior claims.
- Repository code explains expected telemetry but cannot prove live volume,
  conversion, retention, or user behavior.
- Use the connected PostHog plugin/MCP by default. Do not silently replace it
  with browser scraping or CLI access.
- If replay, heatmap, or Web Analytics tools are absent, mark that evidence
  `blocked`. Ask before using an authenticated browser as a fallback.
- Do not create or edit dashboards, insights, cohorts, actions, heatmaps,
  playlists, surveys, flags, annotations, alerts, subscriptions, or project
  settings unless the user explicitly asks.
- Use aggregate evidence. Do not include raw names, emails, IP addresses,
  distinct ids, person ids, session ids, cookies, ingestion keys, or full
  replay links.
- Prefer safe project resolution through an organization/project listing that
  does not return tokens. If the available project-list or switch-project tool
  returns a token, do not log or repeat the raw response.
- Treat replay as qualitative evidence. Do not generalize from one recording
  unless it reproduces a clear defect.
- Treat all PostHog traffic totals as tracked, consented traffic. Do not claim
  they equal server requests, total users, or Search Console traffic.
- Keep content/SEO traffic separate from conversion behavior. A spike on
  `/blogs/*`, `/learn/*`, or `/glossary/*` is not evidence of trial intent.
- Keep landing intent separate from webapp outcomes. `free_trial_started`
  means the marketing-site click path fired; it does not confirm signup,
  checkout, payment, subscription, or product use.
- Record `Filter test accounts`, domain/host filters, person/cohort filters,
  path cleaning, and bot exclusions. Never assume their current state.
- Do not treat a loading shell, a blank chart, or zero as proof of no data
  until project, ingestion, event recency, date range, and filters are checked.

## Default Scope

Unless the user overrides:

| Dimension | Default |
| --- | --- |
| Product | TradingFlow public landing, content, and learning site |
| App repo | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage` |
| PostHog project | Expected name `www.tradingflow.com(landingpage)`, id `344580`; confirm every run |
| PostHog host | `https://us.posthog.com` |
| Analysis period | Last 30 complete days |
| Comparison | Previous 30 complete days |
| Recency check | Last 7 complete days plus a live-ingestion sanity check |
| Project timezone | Expected UTC; confirm every run |
| Production domains | `www.tradingflow.com` and `tradingflow.com` when observed; record every included host |
| Primary segments | Route group, new vs returning, source/channel, device/browser, geography, CTA location, content type, and scroll depth |
| Exclusions | Internal/test traffic, localhost/dev/preview hosts, QA traffic, and known bots when safely identifiable |
| Access mode | Connected PostHog plugin/MCP |

Use explicit calendar dates in the report. Exclude the incomplete current day
from period comparisons unless the question is specifically about today.

## Route Groups

Normalize trailing slashes, query strings, and locale/campaign parameters before
comparing route families.

| Group | Example route patterns | Interpretation |
| --- | --- | --- |
| Homepage and conversion | `/`, `/pricing`, `/for/*`, `/compare/*` | Positioning, CTA discovery, and outbound-app intent. |
| Learning and documentation | `/learn/*`, `/series/*`, `/guides`, `/glossary/*`, `/books/*` | Education and high-intent research behavior. |
| Editorial content | `/blogs/*`, `/notes/*`, `/flow`, `/archive`, `/tags/*`, `/authors/*` | SEO, discovery, and recurring-reader behavior. |
| Product proof and updates | `/market-recap`, `/changelog`, `/roadmap`, `/graph` | Product evidence, recency, and roadmap interest. |
| Company and legal | `/investors`, `/privacy`, `/terms` | Company research or compliance traffic; normally exclude from conversion KPIs. |

Rebuild this table from current routes when the app structure changes.

Use normalized `path` as the primary route-family key. Treat `page_type` as a
versioned annotation, not a durable route identity: deployments can change its
value, and one path can therefore appear under multiple types inside a
comparison window. Record the mapping conflict and segment by deployment or
event first-seen time before comparing affected types.

## Expected Event Contract

Treat this as a source expectation, not proof of live ingestion:

| Event | Meaning | Important properties | Interpretation boundary |
| --- | --- | --- | --- |
| `page_viewed` | Explicit route view | `path`, `locale`, `page_type` | Canonical semantic navigation signal; emitted once per route transition by `RouteAnalytics`. |
| `$pageview` | PostHog Web Analytics page view | Shared route/base URL properties | Emitted manually beside `page_viewed`; SDK automatic capture stays disabled to prevent duplicates. |
| `cta_clicked` | CTA click | `cta_location`, `cta_label`, `cta_id`, `destination_url` | Click intent, not signup. |
| `cta_viewed` | CTA visible for at least one second at 50% or more | `cta_location`, `cta_id`, optional `cta_variant`, `page_type` | Session-deduped exposure denominator, not a click. |
| `outbound_app_clicked` | Click to `app.tradingflow.com` | `cta_location`, `cta_label`, `destination_url` | Outbound intent, not proof the destination loaded. |
| `free_trial_started` | Landing trial-intent marker | `entry_page`, `funnel_variant`, `cta_location` | Emitted by the same launch-app click; not a completed trial. |
| `site_search_performed` | Debounced Pagefind search completed | `query_length_bucket`, `result_count`, `has_results`, `active_filter` | Never includes the raw query. |
| `site_search_result_clicked` | Search result opened | `query_length_bucket`, `result_type`, `result_position`, `result_path_family`, `active_filter` | Never includes the query, title, excerpt, or full URL. |
| `nav_item_clicked` | Header navigation click | `item_name`, `item_url`, `position` | Navigation preference, not page arrival. |
| `content_engaged` | Scroll threshold reached | `content_type`, `slug`, `depth_percent` | One reader may emit 25, 50, 75, and 90; totals are not readers. |
| `$exception` | Browser exception | PostHog system properties | Error signal; inspect issue grouping and affected users/sessions. |
| `$rageclick` / `$dead_click` | Frustration signal | PostHog system properties | Candidate friction; validate with route and replay evidence. |
| `$web_vitals` | Browser performance | PostHog system properties | Confirm current property names before querying. |

## Long-Term Research Watchlist

Every complete run must revisit each item and label it `worse`, `unchanged`,
`improved`, `resolved`, or `blocked`.

| ID | Area | What to check |
| --- | --- | --- |
| LP-PH-W1 | Tracking coverage | Quantify the consent and Do Not Track limitation; verify production domains, event recency, and whether `$pageview` and `page_viewed` disagree. |
| LP-PH-W2 | Acquisition quality | Separate content/learning discovery from homepage/conversion traffic; compare source quality, bounce, engagement, and next action. |
| LP-PH-W3 | CTA and trial intent | Compare CTA locations and entry pages, but keep same-click events separate from independent conversion stages. |
| LP-PH-W4 | Content engagement | Measure readers, maximum scroll depth per session, return visits, and which content leads to a CTA or outbound-app click. |
| LP-PH-W5 | Cross-project boundary | Verify the bounded landing-to-app handoff and the project `300646` chain from `marketing_handoff_landed` to backend-authoritative registration and billing. Keep project metrics separate and never infer registration from a landing click. |
| LP-PH-W6 | Friction and performance | Review replays, heatmaps, dead/rage clicks, exceptions, and web vitals for top traffic and conversion routes. |
| LP-PH-W7 | Dashboard and taxonomy drift | Audit dashboard `1365389`, generic dashboard `1365301`, live event/property schema, and `posthog-events.md` for stale or duplicate definitions. |

Add a watchlist item only for a recurring question that future runs should
compare. Keep one-off numbers and incident findings in the run report.

## Access Workflow: PostHog Plugin/MCP

1. Read the current PostHog skill when available.
2. Discover the connected PostHog tools before calling them.
   - For a CLI-style `posthog:exec` surface, run `search <regex>` or `tools`.
   - Run `info <tool_name>` once before the first call when its schema is not
     already visible.
   - Run `schema <tool_name> <field_path>` for every field with a schema hint.
3. Resolve the accessible projects without printing raw project payloads.
4. Explicitly switch to project `344580`, even if the default appears correct.
   Connector contexts can drift independently, so switch the exact query
   surface that will execute the reads.
5. Retain only the safe active context:
   - Project name.
   - Project id.
   - Project timezone.
   - Host/base URL.
   - Whether person-on-events is enabled.
6. Discover the current read-only equivalents of:
   - `read-data-schema`
   - `query-web-overview` / `query-web-stats`
   - `query-trends`
   - `query-funnel`
   - `query-paths`
   - `query-retention` / `query-lifecycle`
   - `query-web-vitals`
   - `dashboards-get-all` / `dashboard-get` /
     `dashboard-insights-run`
   - `query-session-recordings-list` /
     `session-recording-summarize`
   - `heatmaps-saved-list` / read-only heatmap event queries
   - `query-error-tracking-issues-list`
   - `health-issues-list` or the current installation-health equivalent
7. Verify event and property names with the live schema before using them in a
   filter, breakdown, SQL query, or conclusion.
8. Immediately after switching, require the landing-specific custom events
   (`page_viewed`, `content_engaged`, and `cta_clicked`) to appear in that same
   query surface. If they do not, stop and resolve project context; discard
   any response from the wrong project.
9. Start with narrow aggregate reads, validate definitions, then widen the
   period.
10. Never use write tools such as create, update, delete, archive, regenerate,
   save, playlist creation, or subscription controls during research.

If the plugin is unavailable or the target project is inaccessible, stop and
report the exact connection or permission blocker. Do not silently switch to
another project, CLI token, or browser session.

## Criteria For Success

The summary is complete only when all applicable criteria are answered:

1. **Target confirmed** — project name, id, host, timezone, date ranges,
   domains, and filters are recorded.
2. **Coverage qualified** — consent/DNT bias, current-day completeness,
   bot/test exclusions, path cleaning, and identity limitations are stated.
3. **Traffic reviewed** — tracked visitors, page views, sessions, duration,
   bounce, new/returning mix, and trend deltas are summarized.
4. **Acquisition reviewed** — channels, sources/referrers, UTM evidence,
   landing paths, geography, devices, and route-group mix are summarized.
5. **Content behavior reviewed** — top content, scroll depth, next actions,
   return behavior, and content-to-CTA/outbound intent are summarized.
6. **Conversion intent reviewed** — CTA locations, entry pages, outbound
   clicks, and trial intent are measured without claiming signup or revenue.
7. **Repeat behavior reviewed** — marketing-site retention or lifecycle uses a
   stated start/return event and is not presented as product retention.
8. **Friction reviewed** — paths, replay, heatmaps, rage/dead clicks, errors,
   and web vitals are checked or marked blocked.
9. **Tracking reviewed** — event recency, source/live parity, identity,
   consent, and dashboard quality are checked.
10. **Evidence is safe** — only aggregate values and anonymized patterns
    appear in the report.
11. **Recommendations are prioritized** — distinguish `P0 data correctness`,
    `P1 marketing/product decision`, and `P2 cleanup`.
12. **Watchlist and maintenance completed** — every watchlist item receives a
    status, and this file changes only for reusable improvements.

## Required Workflow

### 0. Confirm The Research Contract

Record:

| Field | Required note |
| --- | --- |
| User question | Full behavior summary or named traffic/content/conversion question |
| Project | Must be `www.tradingflow.com(landingpage)` / `344580` |
| Analysis period | Exact start and end dates |
| Comparison period | Exact start and end dates |
| Timezone | Live project timezone or `not verified` |
| Domains | Every included production host |
| Consent caveat | Analytics-consented tracked traffic only |
| Test/bot filtering | On/off plus cohort, person, host, or bot filters |
| Path cleaning | On/off and normalization rules |
| Access | Connected PostHog plugin/MCP and tool names used |

If the project is wrong or inaccessible, stop. Do not substitute another
TradingFlow project.

### 1. Verify Live Ingestion And Data Quality

Before interpreting a zero, decline, or missing journey:

1. Confirm the active project and UTC timezone.
2. Read the live event schema and recent event definitions.
3. Check live/recent traffic or the current installation-health surface.
4. Verify the chosen date range, domain, test-account filter, bot exclusions,
   and path cleaning.
5. Compare a short recent window with a wider window.
6. Reconcile `page_viewed` and `$pageview` recency and definitions.
7. Confirm whether person-on-events is enabled.

Select one canonical navigation signal before calculating traffic:

- Current source intentionally keeps `capture_pageview: false` while
  `RouteAnalytics` manually emits both `$pageview` and `page_viewed`.
- Use `page_viewed` as the canonical semantic navigation event. Use
  `$pageview` only for PostHog Web Analytics after verifying paired live
  counts and no duplicates on the deployed version.
- Use `person_id` for unique tracked people and `$session_id` for sessions.
- Use Web Analytics visitors, sessions, bounce, and duration only when its
  underlying `$pageview` stream is current and agrees directionally with the
  canonical event.
- If the two signals diverge materially, mark Web Analytics trend metrics
  unsupported, report the tracking break separately, and reconstruct only
  metrics supported by the canonical event. Never average, add, or silently
  substitute the two streams.

Classify the result:

- `healthy`: expected landing events are current and filters support
  interpretation.
- `partial`: tracked traffic exists, but one or more required event families or
  qualitative surfaces are missing.
- `stale`: expected events exist but have not appeared recently.
- `blocked`: access, tools, or live evidence cannot be read.

### 2. Establish The Tracked Traffic Baseline

Capture for the analysis and comparison periods:

- Tracked visitors.
- Page views.
- Sessions.
- Average or median session duration.
- Bounce rate.
- New vs returning visitors.
- Trend delta and material spikes/drops.
- Whether the incomplete current day is included.

Then review:

- Entry and top paths.
- Channel, referrer, and UTM source.
- Device and browser.
- Country/region.
- Active weekday/hour in UTC.
- Route-group mix.

Do not compare partial current-day data with a complete prior day without a
caveat. Do not treat PostHog totals as total server or Search Console traffic.

### 3. Separate Discovery From Conversion Surfaces

For every material route group, report:

- Visitors, sessions, and views.
- Bounce or next-step behavior.
- New vs returning visitors.
- Source/channel mix.
- Device mix.
- Content engagement where relevant.
- CTA or outbound-app intent.
- Whether aliases, query parameters, or trailing slashes fragment the route.

Answer both:

1. Which surfaces attract traffic?
2. Which surfaces lead to a meaningful next action?

A route with high traffic and no measurable CTA may still succeed as
education. State the intended role before calling it underperforming.

### 4. Audit Existing Dashboards And Insights

Open dashboard `1365389` and verify its current title, filters, tiles, and
freshness.

The canonical dashboard tiles are:

- `Learn & Blogs views`
- `Content engagement depth`
- `CTA clicks by location`
- `Trial intent by funnel variant`
- `Conversion KPIs (30d)`
- `Series detail → Outbound app intent`
- `Any page → Any CTA`
- `Home → Hero CTA`
- `Learning → Pricing → Outbound app intent`

After their source events are observed live, the canonical dashboard should
also include:

- `CTA exposure → click rate`
- `Search zero-result rate`
- `Search result-click rate`

For every live tile:

- Record insight name and safe URL.
- Record date range and filters.
- Confirm whether it counts events, unique users/persons, or sessions.
- Verify event names and properties against the live schema.
- Confirm test-account and production-host filtering.
- Check whether the definition matches the decision being made.
- Identify duplicate or overlapping purpose.
- Mark any `cta_clicked → free_trial_started` step as same-emitter
  instrumentation, not an independent conversion stage.
- Mark empty output as `no observed data`, `stale definition`,
  `filter problem`, or `blocked`.

Also inspect generic dashboard `1365301` if it still exists. It was renamed
`Legacy starter dashboard` and unpinned on 2026-07-25 without deleting its
tiles. Do not delete or modify either dashboard during research.

Dashboard date overrides may treat the end date as inclusive and include the
current partial day. Verify the rendered interval, and use the last complete
calendar date or an independently bounded query for completed-period claims.

### 5. Analyze CTA And Outbound-App Intent

Start with the strongest measurable questions:

1. Which route groups and entry pages produce CTA clicks?
2. Which CTA locations are used?
3. Which sources/devices produce outbound-app intent?
4. How long after a page view does the outbound click occur?
5. Which content pages lead to a later app-launch click in the same tracked
   journey?
6. Which CTA locations were actually viewed, and what share of exposed users
   clicked?

Critical interpretation rule:

- `trackLaunchAppCta` emits `cta_clicked`, `outbound_app_clicked`, and
  `free_trial_started` from one click.
- Do not present those three events as independent human steps.
- A funnel from `cta_clicked` to `free_trial_started` primarily validates
  instrumentation consistency, not signup conversion.
- Prefer `page_viewed → cta_clicked` or
  `content_engaged → outbound_app_clicked` for behavior.
- Name `free_trial_started` as `trial intent` in prose.
- Use webapp project `300646`, Clerk, or Stripe evidence only in a separately
  authorized downstream-conversion analysis.

For every funnel, state:

- Step order.
- Conversion window.
- Counting unit.
- Filters.
- Step counts and rates.
- Largest independent drop-off.
- Same-click or same-emitter limitations.

Before comparing event/property breakdowns across periods, inspect first and
last seen times and missing-property buckets. If an event or property was
introduced inside either window, segment the result by tracking version or
label the period-over-period comparison unsupported.

### 6. Analyze Content Engagement

For blogs, learning/series, changelog, and roadmap content:

- Rank by unique tracked visitors and sessions, not only page views.
- Measure maximum `depth_percent` per visitor/session/content item.
- Report the share reaching 25, 50, 75, and 90 percent where supported.
- Compare scroll depth by content type, source, device, and new/returning
  status when volume is sufficient.
- Measure later CTA or outbound-app intent.
- Review return visits to the same or related content.

Do not sum all `content_engaged` events and call the result readers. One reader
can emit up to four threshold events on one page.

If `locale` is used, verify that it represents the visitor's live locale rather
than only the configured default locale.

### 7. Analyze Paths, Repeat Behavior, And Retention

Use path analysis to answer:

- What follows the homepage?
- What follows top blogs, learn pages, glossary pages, and pricing?
- Which routes precede an outbound-app click?
- Where do visitors loop or abandon?

Use a clearly stated marketing-site retention definition, for example:

- Start: first `page_viewed`.
- Return: later `page_viewed` or `content_engaged`.
- Period: daily or weekly.

Do not call this product retention. The signed-in product lives in a separate
project.

For user-level SQL or deduplication:

- Prefer `person_id` over `distinct_id` when person-on-events is enabled.
- Remember that `person.properties.*` on events reflects values at ingestion
  time.
- State when anonymous identity, consent changes, or low volume make
  user-level retention unreliable.

### 8. Review Session Replay

Use route, source, event, frustration, duration, and device filters rather than
named identities.

Sample across:

- Homepage or pricing.
- Top content/learning entry.
- A route with high bounce.
- A content page with poor scroll completion.
- A CTA funnel drop-off.
- A rage/dead-click or error route.
- A slow web-vitals route.

When volume permits, review at least three recordings before claiming a
pattern. Capture only:

- Route group and journey stage.
- Anonymous/identified status without identity value.
- Device/browser category.
- Approximate duration.
- Key navigation and interaction pattern.
- Error, frustration, or performance signals.
- Whether replay supports or contradicts aggregate evidence.

Never paste names, emails, ids, typed content, account data, full recording
URLs, or raw replay payloads into the report.

Listing and aggregate recording metadata are read-only evidence. AI-generated
recording summaries can transmit individual replay contents to another model;
obtain explicit user authorization for that disclosure before calling such a
summarizer. If authorization is absent or the call is blocked, report replay
causality as `blocked` and do not bypass the safeguard with raw replay export.

### 9. Review Heatmaps, Friction, Errors, And Web Vitals

Inspect saved heatmaps first. Prioritize:

- Homepage.
- Pricing.
- Highest-traffic content/learning route.
- Highest outbound-intent route.
- Highest-friction route.

Record route rule, date range, click concentration, non-interactive clicks,
scroll drop-off, CTA visibility, and agreement with replay/funnel evidence.

If no saved heatmap exists, report the gap. Do not create, regenerate, or save
one without authorization.

When an aggregate read-only heatmap query is available, it may still be used
without creating a saved heatmap. Report its route, exact dates, aggregation
unit, below-fold share, and whether any rage-click hotspot repeats across
multiple visitors. Coordinates alone do not identify an element.

Then review:

- Rage clicks and dead clicks.
- Current exception groups, occurrences, affected users, and affected
  sessions.
- Frustrating pages.
- LCP, INP, and CLS, including percentile, path, device, and browser.

Do not claim that performance caused behavior merely because a slow metric and
a high bounce rate share a route. Require replay evidence or a consistent
segment relationship.

### 10. Compare Live Tracking With Source

Use source only to explain or audit expected telemetry:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
rg -n "posthog|capture\\(|identify\\(|reset\\(|ANALYTICS_EVENTS|track[A-Z]|NEXT_PUBLIC_POSTHOG" \
  src package.json netlify.toml
```

Check:

- Consent and production initialization gates.
- Explicit route-view capture and duplicate risk.
- Page-leave, replay, exception, and web-vitals configuration.
- Stable event and property names.
- CTA location and route taxonomy.
- UTM/referrer handling.
- Bounded landing-to-app attribution parameters and app-side URL cleanup.
- Search outcome tracking without raw query, title, excerpt, or result URL.
- Anonymous identity and reset behavior.
- PII or sensitive-data leakage.
- Source-defined events missing from live schema.
- Live events no longer emitted by current source.

Use:

| Expected from source | Seen live | Interpretation |
| --- | --- | --- |
| Event/property/identity behavior | yes / no / stale / blocked | deployed, no traffic, consent-limited, filtered, stale build, or possible tracking defect |

Do not patch the landing repo during research unless the user explicitly asks.

### 11. Judge Analytics Readiness

Rate the setup:

- `reasonable`: current surfaces answer acquisition, content engagement,
  outbound intent, repeat behavior, and friction questions with consistent
  filters.
- `partial`: useful data exists, but one or more decisions require manual
  reconstruction or missing coverage.
- `unreliable`: event, consent, identity, filter, or ingestion problems make
  key conclusions unsafe.
- `blocked`: live project data cannot be read.

Check:

- Dashboard purpose is clear.
- Tiles load and are fresh.
- Date ranges and comparison periods align.
- Production/test/bot filters are explicit.
- Counts use the correct event/user/session unit.
- Same-click events are not presented as sequential conversion.
- Content traffic does not dominate conversion KPIs.
- Retention is labeled as marketing-site repeat behavior.
- Replays, heatmaps, errors, and performance have drill-down paths.
- Generic or duplicate dashboards are identified.

Do not recommend a new dashboard until dashboard `1365389` and existing saved
insights have been audited.

## Evidence Rules

- Prefer exact counts, percentages, deltas, and calendar dates.
- Label PostHog evidence separately from repository/source expectations.
- Name the surface or tool used for every important claim.
- Link dashboards and insights when safe.
- Do not include raw project, person, session, replay, cookie, or token
  payloads.
- A replay pattern requires multiple representative sessions when volume
  permits.
- A zero requires a project, ingestion, schema, date, and filter check.
- A funnel requires explicit order, window, unit, filters, and same-emitter
  caveats.
- A retention claim requires explicit start and return events.
- A content-traffic claim must not be presented as trial or product growth.
- A trial-intent claim must not be presented as signup, subscription, or
  revenue.
- Mark missing evidence `unknown` or `blocked`.
- Keep sampling, consent, incomplete-day, timezone, bot, and identity caveats
  next to the affected conclusion.

## Report Template

```markdown
# TradingFlow Landing Page PostHog User Behavior Summary

## Scope
- Project:
- Analysis period:
- Comparison period:
- Timezone:
- Domains:
- Consent/coverage caveat:
- Filters and path cleaning:
- Access and tools:
- Canonical navigation signal:
- Surfaces reviewed:
- Other caveats:

## Executive Summary
- Overall read:
- Biggest highlights:
- Biggest bad signals:
- Most important unknowns:

## Traffic And Acquisition
| Metric | Current | Comparison | Change | Evidence |
| --- | ---: | ---: | ---: | --- |

- Route-group mix:
- Top paths and landing paths:
- Channels/sources/UTMs:
- Device/browser:
- Geography:
- Active hours:

## Content And Learning Behavior
| Content/route | Visitors | Engagement | Next action | Evidence |
| --- | ---: | --- | --- | --- |

- Scroll-depth patterns:
- New vs returning:
- Content-to-CTA/outbound intent:

## CTA And Outbound-App Intent
| Entry/CTA | Users | Intent rate | Time/drop-off | Evidence |
| --- | ---: | ---: | --- | --- |

- Same-click event caveat:
- Top CTA locations:
- Trial-intent interpretation:
- Downstream conversion boundary:

## Repeat Behavior
- Start event:
- Return event:
- Retention/lifecycle:
- Identity/sample caveats:

## Friction And Performance
| Route | Signal | Users/sessions | Evidence | Interpretation |
| --- | --- | ---: | --- | --- |

- Replay patterns:
- Heatmap coverage/findings:
- Web vitals:
- Errors/rage/dead clicks:

## Tracking And Dashboard Readiness
- Installation/event health:
- Consent and identity:
- Source/live parity:
- Dashboard `1365389`:
- Dashboard `1365301`:
- Readiness verdict:

## Recommendations
- P0 data correctness:
- P1 marketing/product decision:
- P2 cleanup:

## Long-Term Watchlist Follow-up
- LP-PH-W1:
- LP-PH-W2:
- LP-PH-W3:
- LP-PH-W4:
- LP-PH-W5:
- LP-PH-W6:
- LP-PH-W7:
- New items:
- Resolved items:

## Runbook Maintenance
- Changed / no change:
- Reason:
```

## Verification Gates

Before completing:

- Project `www.tradingflow.com(landingpage)` / `344580` was confirmed.
- Exact calendar windows and UTC timezone were recorded.
- Consent/DNT coverage limits were stated.
- Test, bot, domain, person/cohort, and path-cleaning filters were recorded.
- Current-day incompleteness was handled.
- Content/discovery and conversion surfaces were separated.
- Traffic, acquisition, content engagement, CTA intent, repeat behavior,
  paths, replay, heatmaps, friction, performance, and tracking health were
  checked or marked blocked.
- Same-click CTA events were not presented as independent conversion stages.
- `free_trial_started` was not presented as signup, payment, or product use.
- Dashboard `1365389` was reviewed.
- Every active watchlist item received a status.
- No raw PII, secret, distinct id, person id, session id, or full replay URL
  appears in the report.
- No PostHog mutations were made without authorization.
- Any runbook edit was re-read and `git diff --check` passes.

Include:

```text
ToolAccess:
- posthog: connected|blocked; path=<plugin-or-mcp>; project=<id or n/a>; blocker=<none or exact error>
- replay: connected|blocked|skipped; tool=<name or n/a>; blocker=<none or exact error>
- heatmaps: connected|blocked|skipped; tool=<name or n/a>; blocker=<none or exact error>
- source: inspected|skipped; repo=/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
```

## Troubleshooting

| Problem | Likely cause | Response |
| --- | --- | --- |
| Active project is wrong | Connected PostHog context drifted | Resolve accessible projects and explicitly switch to `344580`; do not continue on another project. |
| Project response contains a token or person metadata | Broad project/dashboard response | Do not log the raw payload; retain only safe project context and aggregate fields. |
| Metrics suddenly show zero | Wrong window, host, test filter, consent-limited ingestion, stale event, or project mismatch | Reconfirm project/filters and check event schema, recency, and installation health. |
| `$pageview` and `page_viewed` disagree | Deployment drift, historical configuration, consent timing, or duplicate ownership | Confirm the deployed adapter manually emits the pair and SDK `capture_pageview` remains false. Keep `page_viewed` canonical until counts reconcile. |
| Web Analytics falls while `page_viewed` is healthy | The paired manual `$pageview` stream is stale or the repaired source is not deployed | Do not report the Web Analytics decline as traffic loss. Use bounded `page_viewed` person/session counts and mark bounce/duration unsupported until the paired stream is live and verified. |
| A connector host filter fails with a String/Float type error | Read wrapper compiled the property filter incorrectly | Confirm the project contains only the intended host, then use an unfiltered project query or bounded SQL with the verified host. Do not guess alternate filter shapes repeatedly. |
| One path has multiple `page_type` values | Taxonomy changed during the window | Group by normalized `path`; treat `page_type` as advisory and segment by tracking version before comparing types. |
| Funnel reports near-perfect CTA-to-trial conversion | Same click emits both events | Treat it as instrumentation consistency; measure page/content to CTA or outbound click instead. |
| PostHog traffic is lower than Search Console or server traffic | Consent/DNT and client-blocking coverage | Report tracked consenting traffic; use other sources only in an explicitly scoped comparison. |
| Scroll-depth totals look larger than readers | Each session can emit multiple thresholds | Deduplicate by user/session/content and use maximum reached depth. |
| Dashboard tile is blank | No volume, stale event/property, filter mismatch, or tile error | Open the insight, inspect its definition, and compare it with live schema and recent events. |
| No replay or heatmap tools are exposed | Connected PostHog surface lacks those reads | Mark the section blocked and ask before browser fallback; do not create a playlist or heatmap. |
| Replay summarizer requires model processing | Individual replay contents may leave the first-party read path | Obtain explicit user authorization first; otherwise use aggregate metadata and keep visible-cause claims blocked. |
| User counts look inflated | Events or `distinct_id` counted instead of persons/sessions | Confirm person-on-events and use the unit that matches the question. |
| Landing intent is reported as paid conversion | Cross-project/product boundary was ignored | Rename it trial/outbound intent and scope a separate verified app/Stripe analysis if requested. |

## Runbook Self-Maintenance

After every execution, decide whether this file should change.

Update it in the same pass when live work reveals a reusable improvement:

- Project, dashboard, insight, event, property, route, or URL assumptions
  drifted.
- The PostHog plugin/MCP discovery or query workflow changed.
- A standard domain, test, bot, consent, or path-cleaning filter was proven.
- A better method for content grouping, scroll-depth deduplication, CTA intent,
  replay sampling, heatmap review, or retention was validated.
- A recurring tracking, identity, cross-project, dashboard, or performance
  problem belongs on the watchlist.
- A report field or verification gate would prevent a repeated analytical
  mistake.

Keep transient findings in `Agent Handoff`, the watchlist baseline, or the run
report. Do not encode one-off traffic numbers, named-user behavior, temporary
incidents, raw logs, or unsupported hypotheses as permanent procedure.

When maintaining:

1. Prune or revise stale handoff and watchlist items.
2. Add the smallest reusable procedure change.
3. Keep [`posthog-events.md`](./posthog-events.md) aligned when event/property
   taxonomy or source ownership changes.
4. Update the owning routing table when this runbook is renamed, moved, or
   replaced.
5. Re-read the edited sections and verify referenced paths.
6. Run `git diff --check`.
7. State `Runbook maintenance: changed` with the reason, or
   `Runbook maintenance: no change`.
