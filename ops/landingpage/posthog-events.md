## PostHog Events & Funnels – TradingFlow Landing

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
      - `static_page`
  - **Emitted from**:
    - `RouteAnalytics` in `src/components/RouteAnalytics.tsx` (hooked into `RootLayout`).

- **cta_clicked**
  - **Description**: Click on a key CTA that forwards users to the TradingFlow app or important flows.
  - **Properties**:
    - `cta_location` (string) – where the CTA appears:
      - `navbar_desktop`
      - `navbar_mobile`
      - `hero_primary`
      - `closing_cta`
    - `cta_label` (string) – rendered label text.
    - `destination_url` (string) – target URL (e.g. app URL).
  - **Emitted from**:
    - Navbar “Get started” button (`navbar_desktop` / `navbar_mobile`).
    - `LandingHero` primary CTA (`hero_primary`).
    - `LandingClosingCTA` primary CTA (`closing_cta`).

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
      - `roadmap` – static roadmap page rendered with `PostLayout` comment category.
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
    - Navbar “Get started” buttons.

### Funnels & Dashboards (PostHog MCP)

- **Dashboard**: `Landing & Docs Funnels`
  - **URL**: see PostHog: `https://us.posthog.com/project/344580/dashboard/1365389`
  - **Purpose**: Central place for key landing/doc funnels and event streams.

- **Insight**: `Landing → Free Trial Start Funnel`
  - **URL**: `https://us.posthog.com/project/344580/insights/3nlfgFzz`
  - **Type**: Funnels (ordered, 14-day window, last 30 days, test accounts filtered out).
  - **Steps**:
    1. `page_viewed` where `page_type = 'home'` → “Landing page view”.
    2. `cta_clicked` where `cta_location = 'hero_primary'` → “Landing hero CTA click”.
    3. `free_trial_started` → “Free trial started”.
  - **Usage**: Measures conversion from home page views through hero CTA to app/free-trial click.

### Environment & Governance

- **Client initialization**
  - Implemented in `src/instrumentation-client.ts`.
  - Only initializes PostHog when:
    - `typeof window !== "undefined"`.
    - `NODE_ENV === "production"`.
    - `NEXT_PUBLIC_POSTHOG_KEY` is defined.
  - Respects browser Do Not Track and opts such users out of capturing.

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

