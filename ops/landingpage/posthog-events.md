## PostHog Events & Funnels – TradingFlow Landing

This file owns the landing telemetry taxonomy and source-emitter contract. For
live traffic and user-behavior summaries, use
[`posthog-research.md`](./posthog-research.md).

## Shared production project

New landing events target the canonical TradingFlow PostHog production project
`300646`, shared with the app. Historical landing events remain in project
`344580` and must not be mixed into current shared-project baselines. Every new
landing event carries `product_surface=landing`; app browser and backend events
carry `product_surface=app`. Use this property to split the shared conversion
funnel without changing the event names below.

## Recommended Invocation

Use `/goal` when auditing or extending landing analytics:

- Objective: verify the landing-site PostHog taxonomy, event emitters, funnel definitions, and dashboard assumptions remain aligned with the current marketing site.
- Success criteria: code emitters are checked against the taxonomy, PostHog dashboard/insight references are confirmed or marked stale, and any new event/property is documented here with governance notes.
- Stop condition: taxonomy and dashboards are confirmed, or the blocker names the missing PostHog access/tooling.

## Agent Handoff

Last updated: 2026-07-26

### Look First

- [ ] After the next landing deployment, verify that each consented route
  transition emits one `$pageview` and one `page_viewed`, and that PostHog Web
  Analytics resumes without duplicate page views. Source intentionally keeps
  `capture_pageview: false`; `RouteAnalytics` owns both manual emissions.
- [ ] Verify the new `cta_viewed`, `site_search_performed`, and
  `site_search_result_clicked` events in the live schema. CTA impressions
  require at least 50% visibility for one second and dedupe by route, CTA id,
  variant, and browser session. Search events must never contain the query.
- [ ] Verify attributed app links reach `app.tradingflow.com`, the app emits
  `marketing_handoff_landed` in project `300646`, and the marketing query
  parameters are removed after capture. Then verify a genuinely new,
  Clerk-authenticated account emits one backend
  `account_registration_completed`; a returning login must emit none.
- [ ] After those events have live volume, add dashboard `1365389` tiles for
  CTA view-to-click rate, search zero-result rate, and search result-click
  rate. Do not create blank tiles against event names that have not ingested.
- [ ] Reconcile route families by normalized `path`, not only `page_type`.
  The 2026-07-25 behavior run found the same route carrying different
  `page_type` values across the comparison window.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether analytics audit work exposed a reusable lesson for this taxonomy.
2. Promote durable lessons into event definitions, property contracts, funnel/dashboard references, environment rules, or naming conventions.
3. Keep transient next-run state in `Agent Handoff`; keep one-off PostHog counts and dashboard observations in the final report.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when event names/properties, emitters, dashboard/insight links, production gating, or governance rules drift. Do not update it for one-off traffic counts, temporary campaign observations, raw query output, or completed audit progress.

### Event Taxonomy

- **page_viewed**
  - **Description**: Page view on the marketing/knowledge site.
  - **Properties**:
    - `path` (string) – URL path (e.g. `/`, `/blogs/...`).
    - `locale` (string) – locale code (e.g. `en`, `zh`).
    - `page_type` (string) – one of:
      - `home`
      - `blog_index`
      - `blog_post`
      - `series_index`
      - `series_detail`
      - `changelog`
      - `roadmap`
      - `pricing`
      - `static_page`
  - **Emitted from**:
    - `RouteAnalytics` in `src/components/RouteAnalytics.tsx` (hooked into `RootLayout`).
  - **Ownership**:
    - `RouteAnalytics` is the single route-view owner. It emits this semantic
      event and one manual PostHog `$pageview` from the same call.
    - Use normalized `path` for durable route grouping. Treat `page_type` as a
      versioned annotation and segment comparisons when a route changes type.

- **$pageview**
  - **Description**: PostHog system page-view event for Web Analytics.
  - **Properties**:
    - Shares `path`, `locale`, and `page_type` with `page_viewed`, plus the
      base URL/referrer/UTM properties added by the analytics adapter.
  - **Emitted from**:
    - `trackPageView` in `src/lib/analytics.ts`, called only by
      `RouteAnalytics`.
  - **Ownership**:
    - Manual by design. Keep SDK `capture_pageview: false` to prevent a second
      automatic owner.

- **cta_clicked**
  - **Description**: Click on a key CTA that forwards users to the TradingFlow app or important flows.
  - **Properties**:
    - `cta_location` (string) – where the CTA appears:
      - `navbar_desktop`
      - `navbar_mobile`
      - `hero_secondary`
      - `pricing_table`
      - `landing_nav`
      - `landing_mobile_menu`
      - `hero_primary`
      - `closing_cta`
      - `pseo_content`
    - `cta_label` (string) – rendered label text.
    - `cta_id` (string) – stable control id; defaults to `cta_location`.
    - `destination_url` (string) – target URL (e.g. app URL).
  - **Emitted from**:
    - Navbar “Get started” button (`navbar_desktop` / `navbar_mobile`).
    - `LandingHero` primary CTA (`hero_primary`).
    - `LandingClosingCTA` primary CTA (`closing_cta`).
    - pSEO launch-app CTA (`pseo_content`).

- **cta_viewed**
  - **Description**: A key CTA remained at least 50% visible for one second.
  - **Properties**:
    - `cta_location` (string) – the same stable location taxonomy as
      `cta_clicked`.
    - `cta_id` (string) – stable control id; defaults to `cta_location`.
    - `cta_variant` (string, optional) – bounded source-defined variant such
      as the pricing interval or pSEO surface.
    - `page_type` (string) – route annotation from `RouteAnalytics`.
  - **Emitted from**:
    - `CtaImpressionAnalytics`, which observes source-marked CTA elements.
  - **Ownership**:
    - Deduped by normalized route, CTA id, CTA variant, and browser session.
      Use it as the denominator for CTA exposure-to-click rate.

- **nav_item_clicked**
  - **Description**: Navigation item click in the main header nav (including dropdown children).
  - **Properties**:
    - `item_name` (string) – display label used in the nav.
    - `item_url` (string) – href of the nav item.
    - `position` (number) – zero-based index in the nav array.
  - **Emitted from**:
    - `Navbar` in `src/components/Navbar.tsx`.

- **content_engaged**
  - **Description**: Scroll-depth milestones on long-form content.
  - **Properties**:
    - `content_type` (string) – currently:
      - `blog` – blog posts rendered via `PostLayout`.
      - `series`
      - `changelog`
      - `roadmap`
    - `slug` (string) – post slug.
    - `depth_percent` (number) – one of `25`, `50`, `75`, `90`.
  - **Emitted from**:
    - `useScrollDepth` hook in `src/hooks/useScrollDepth.ts` as used by `PostLayout`.

- **free_trial_started**
  - **Description**: User clicks through from the landing/docs site to start a free trial or open the TradingFlow app.
  - **Properties**:
    - `entry_page` (string) – current pathname when the CTA is clicked (for now `/` for hero/closing CTAs).
    - `funnel_variant` (string) – distinguishes CTA origin:
      - `hero_primary`
      - `closing_cta`
      - `navbar_desktop`
      - `navbar_mobile`
  - **Emitted from**:
    - `LandingHero` primary CTA.
    - `LandingClosingCTA` primary CTA.
    - Navbar, landing-nav, mobile-menu, and pricing launch-app buttons.

- **outbound_app_clicked**
  - **Description**: User clicks from the public site to
    `app.tradingflow.com`.
  - **Properties**:
    - `cta_location` (string) – stable location id.
    - `cta_label` (string) – rendered label.
    - `destination_url` (string) – outbound app URL.
  - **Emitted from**:
    - `trackLaunchAppCta` alongside `cta_clicked` and
      `free_trial_started`.
  - **Interpretation**:
    - This proves landing-site outbound intent, not destination load, signup,
      subscription, or product use.

- **site_search_performed**
  - **Description**: A debounced Pagefind search completed.
  - **Properties**:
    - `query_length_bucket` – `1_3`, `4_10`, `11_30`, or `31_plus`.
    - `result_count` (number).
    - `has_results` (boolean).
    - `active_filter` – `all`, `post`, `tutorial`, `flow`, `book`, or `note`.
  - **Privacy boundary**:
    - Never send the raw query, result title, or excerpt.

- **site_search_result_clicked**
  - **Description**: A user opened one result from site search.
  - **Properties**:
    - `query_length_bucket` – same bounded bucket as the search event.
    - `result_type` – `post`, `tutorial`, `flow`, `book`, or `note`.
    - `result_position` (one-based number).
    - `result_path_family` – normalized route family, never the raw result URL.
    - `active_filter` – selected bounded filter.
  - **Privacy boundary**:
    - Never send the raw query, title, excerpt, or complete result URL.

### Landing-To-App Attribution Contract

Launch-app links carry only bounded, non-PII dimensions:

| URL parameter | Allowed meaning |
| --- | --- |
| `utm_source` | Fixed `tradingflow_web` |
| `utm_medium` | Fixed `cta` |
| `utm_campaign` | `landing_handoff` or `pseo` |
| `utm_content` / `tf_cta` | Stable CTA location |
| `tf_entry` | `home`, `pricing`, `learn`, `blogs`, `glossary`, `pseo`, `product_proof`, `company`, or `other` |
| `tf_content_type` | `home`, `pricing`, `tutorial`, `blog`, `glossary`, `pseo`, `product_proof`, or `other` |

The app validates these values, stores them for the browser session, emits
`marketing_handoff_landed` once in PostHog project `300646`, and removes the
parameters from the URL. Login and billing-return events inherit the same
context. The backend emits `account_registration_completed` only when a
verified Clerk identity creates a new account record. This connects
acquisition intent to registration and revenue without sending raw paths,
search queries, emails, or arbitrary labels across the shared project.

### Funnels & Dashboards (PostHog MCP)

The dashboard and insight links below point to historical landing project
`344580` and remain baseline references only. Do not combine their historical
counts with current shared-project `300646` metrics; create shared-project
equivalents only after migrated events have live volume.

- **Dashboard**: `Landing & Docs Conversion`
  - **URL**: historical PostHog dashboard: `https://us.posthog.com/project/344580/dashboard/1365389`
  - **Purpose**: Central place for key landing/doc funnels and event streams.
  - **Project status**: Historical landing dashboard. Create or update the shared-project conversion dashboard only after migrated events have live volume.

- **Insight**: `Learn & Blogs views`
  - **URL**: `https://us.posthog.com/project/344580/insights/MEsOBYzH`
  - **Type**: Daily trends, last 30 days, test accounts filtered out.
  - **Series**:
    1. `page_viewed` where normalized `path` matches `^/learn(?:/|$)`.
    2. `page_viewed` where normalized `path` matches `^/blogs(?:/|$)`.
  - **Usage**: Compares total tracked views for the canonical Learn and Blogs
    route families without creating duplicate route-view events.
- **Insight**: `Home → Hero CTA`
  - **URL**: `https://us.posthog.com/project/344580/insights/37Uh3Khp`
  - **Steps**:
    1. `page_viewed` where `page_type = 'home'`.
    2. `cta_clicked` where `cta_location = 'hero_primary'`.
- **Insight**: `Any page → Any CTA`
  - **URL**: `https://us.posthog.com/project/344580/insights/6hEEGaVJ`
  - **Steps**: `page_viewed` → `cta_clicked`.
- **Insight**: `Series detail → Outbound app intent`
  - **URL**: `https://us.posthog.com/project/344580/insights/K8G8Hysm`
  - **Steps**: `series_detail` `page_viewed` → `outbound_app_clicked`.
- **Insight**: `Learning → Pricing → Outbound app intent`
  - **URL**: `https://us.posthog.com/project/344580/insights/3nlfgFzz`
  - **Type**: Funnels (ordered, 14-day window, last 30 days, test accounts filtered out).
  - **Steps**:
    1. `page_viewed` where `page_type` is `series_index` or `series_detail`.
    2. `page_viewed` where `page_type = 'pricing'`.
    3. `outbound_app_clicked`.
  - **Usage**:
    - Measures a three-stage learning-to-pricing-to-app journey with
      independently occurring events.

All four definitions were repaired in place on 2026-07-25. Their existing
insight IDs and history were preserved.

### Environment & Governance

- **Client initialization**
  - `src/instrumentation-client.ts` defers to the lazy loader in
    `src/lib/posthog-client.ts`.
  - Only initializes PostHog when:
    - `typeof window !== "undefined"`.
    - `NODE_ENV === "production"`.
    - `NEXT_PUBLIC_POSTHOG_KEY` is defined.
    - Analytics consent is granted.
  - Uses `autocapture: true`, `capture_pageview: false`,
    `capture_pageleave: true`, and `person_profiles: 'always'`.
  - `capture_pageview: false` is intentional: `RouteAnalytics` manually emits
    exactly one `$pageview` and one `page_viewed` per route transition.
  - Respects browser Do Not Track and opts such users out of capturing.
  - Applies UTM/referrer properties after consent.
  - Because tracking is consent gated, PostHog counts represent consenting
    tracked traffic rather than all landing-site traffic.

- **Environments**
  - Recommended:
    - Use a dedicated PostHog project or environment for staging/dev.
    - Keep production keys (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) separate from any dev/test keys.
  - In non-production:
    - Leave PostHog uninitialized by default to avoid polluting production funnels.
    - Optionally introduce `NEXT_PUBLIC_POSTHOG_DEBUG` later if verbose console logging is desired.

- **Naming conventions**
  - Event names and property keys use `snake_case`.
  - Reuse the same property sets when adding new insights or funnels in PostHog so definitions stay stable over time.
  - `trackLaunchAppCta` emits `cta_clicked`, `outbound_app_clicked`, and
    `free_trial_started` from the same click. Do not present those events as
    three independent conversion stages.
  - Create CTA/search dashboard tiles only after the new event names have
    appeared in the live schema. Recommended definitions are:
    - CTA exposure-to-click rate by `cta_location`: unique users who emitted
      `cta_clicked` divided by unique users who emitted `cta_viewed`.
    - Search zero-result rate: `site_search_performed` split by `has_results`.
    - Search result-click rate: users with `site_search_performed` followed by
      `site_search_result_clicked` in the same session.
