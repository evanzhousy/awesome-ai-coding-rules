---
name: landingpage-browser-e2e
description: Browser-driven end-to-end test runbook for the TradingFlow marketing + docs landing site (tradingflow-web-landingpage). Uses browser automation to walk real visitor journeys and verify rendering, navigation, bilingual i18n, image/video integrity, internal/external links, search, SEO artifacts, redirects, and responsive layout — plus a visitor/SEO UX review. No auth, billing, or premium flows (this is a static Next export, not the webapp).
disable-model-invocation: true
---

# Browser E2E Test (Landing Site)

Use this runbook when an AI agent is asked to walk the **TradingFlow landing site** (`tradingflow-web-landingpage`) in a real browser like a visitor and a search engine, find defects, and judge marketing/docs UX. This is the public site at `tradingflow.com` — a **static Next.js export** (marketing blog, `/learn` tutorial docs, pricing, changelog/roadmap/about, RSS, sitemap, Pagefind search), bilingual **EN + 中文**. It has **no auth, no billing, no Stripe, no premium guards** — for those, use the webapp runbook ([`../webappp-fullstack/browser-e2e-product-review.md`](../webappp-fullstack/browser-e2e-product-review.md)).

This runbook is **browser-first**. A green `bun run build` / `bun run lint` is a *precondition*, not the test — a build can succeed while pages render broken, images 404, the language switch fails, or a video won't play. Exercise the rendered site interactively.

## Recommended Invocation

Use `/goal` for a full run:

- Objective: run a browser-driven E2E walkthrough of the requested landing-site surface(s), verifying that pages render, navigation/i18n/search work, images and videos load and play, internal/external links resolve, SEO artifacts are correct, old URLs redirect, and the visitor/SEO UX is sound.
- Success criteria: browser automation is used for the walkthrough; the dev server (or built `out/`) is running; scoped routes are exercised in **EN and 中文** and on **desktop + mobile**; every embedded image and tutorial video is confirmed to load/play (no 404s, no broken `<img>`, poster + playback verified); internal links resolve with no 404s and external app links point to the right host; SEO artifacts (canonical, hreflang, JSON-LD, OpenGraph, `sitemap.xml`, configured feed endpoint(s), single semantic H1, no stray `noindex`) are verified from the DOM/network; `/series/*` → `/learn/*` redirects are checked (server-level — see notes); console/network is clean of errors and asset failures; findings use the required tables; and this runbook is maintained if reusable friction is found.
- Stop condition: scoped routes are complete in both locales and both viewports, a real blocker is documented with evidence, or the user redirects scope.

Pasteable objective:

```text
Use ops/landingpage/browser-e2e-test.md as the runbook. Use the browser automation tools to walk the requested
tradingflow-web-landingpage routes like a visitor and a crawler. Do NOT treat a successful build/lint as the test.
Start the dev server (bun run dev) or serve the built out/ dir. For each scoped route, verify in EN and 中文 and on
desktop + mobile: the page renders without error; nav + language switch + search work; every image loads (no 404 /
broken img); every tutorial video shows its poster and plays with audio; internal links resolve (no 404) and external
app links use https://app.tradingflow.com; SEO artifacts are correct (canonical, hreflang en/zh/x-default, JSON-LD,
OpenGraph, sitemap.xml, the feed endpoint(s) configured in site.config.ts, one semantic H1, no stray noindex); old /series/* paths 301 to /learn/*
(server-level — verify on the deployed/preview site or note as not-testable on next dev). Capture console + network
errors. Produce RouteCoverage, I18nMatrix, MediaIntegrityMatrix, LinkIntegrityMatrix, SeoArtifactMatrix,
VisitorReviewFinding rows, ElementActionMatrix, VisitorScorecard, evidence index, blockers, and a runbook
maintenance note. State explicitly that no findings/screenshots were committed.
```

## Agent Handoff

Last updated: 2026-06-21

- **`/learn` URL migration (2026-06-20):** tutorials moved from `/series/tradingflow-docs/NN-slug` to **`/learn/<slug>`** (clean slugs). Old paths 301 to `/learn` via `nginx.conf.example` + `netlify.toml`. These redirects are **server-level**: on `next dev` and on a plain static server, `/series/tradingflow-docs/*` may 404 or throw a Next `output: export` static-param 500 instead of redirecting — that is not proof of a production redirect failure; verify redirects only on the deployed/preview site or behind nginx. The nav now has a single **Learn → /learn** item (no `/series`, no dropdown).
- **Tutorial videos:** each `/learn` chapter and the `/learn` hub embed a `<video>` (`/videos/tutorials/<NN-slug>.mp4` + poster). Files keep the `NN-` prefix even though the page slug dropped it. One bilingual (EN VO + EN/中文 burned subtitles) video serves both locales. R2 public hosting is pending — currently served from `public/videos/`.
- **Known recurring defect — tutorial images:** series/tutorial images must use the absolute `/blogs/tradingflow-docs/images/<file>.png` path; relative `./images/...` 404s in production. Broken tutorial images have happened before — always spot-check images on `/learn/*`.
- No open blockers. If production shows old `/series` content or broken images after a fix, the cause is almost always a stale deploy (operator-authorized `bun run deploy`) or missing live nginx redirects.

## Goal

Produce an evidence-backed browser walkthrough report that answers:

1. Does each scoped route render correctly and completely for a real visitor, in **both EN and 中文**, on **desktop and mobile**?
2. What visible defects did the walkthrough expose — broken/blank renders, 404 images, unplayable videos, dead links, broken nav/search, layout/overflow, console/network errors?
3. Do **internal links** resolve (no 404s) and do **external links** point at the correct hosts (e.g. `app.tradingflow.com`, not a dead/old URL)?
4. Are **SEO artifacts** correct and crawlable — canonical, hreflang, JSON-LD, OpenGraph/Twitter, `sitemap.xml`, the RSS/Atom endpoint(s) enabled by `siteConfig.feed.format`, one semantic H1, no stray `noindex`, descriptive titles/descriptions?
5. Do **old URLs redirect** to their new homes (`/series/* → /learn/*`)?
6. Is the marketing/docs **UX** clear, fast, scannable, and trustworthy for a prospective user — and does the path to the app/tutorials convert cleanly?
7. Which UI/content elements should be added, deleted, merged, updated, or kept?

## Non-Negotiables

- Use the available **browser automation** for the walkthrough. In Claude Code that is the `claude-in-chrome` MCP tools (`mcp__claude-in-chrome__*`); the `chrome-devtools` MCP (`mcp__chrome-devtools__*`) is preferred for Lighthouse/performance/network audits when connected. In Codex, use `@Browser` (`plugin://browser@openai-bundled`). Pick one and say which in the report.
- Do **not** treat `bun run build`, `bun run lint`, or any repo script as the test. They are preconditions / data sources only. The review is the interactive browser walkthrough.
- Do **not** edit content, components, routes, config, or docs unless the user explicitly expands scope beyond review.
- Do **not** commit `FINDINGS.md`, screenshots, or any review artifact. Findings stay in session output unless the user asks for a persistent file.
- Do **not** run `bun run deploy` (production is a static rsync to nginx; operator-authorized only).
- Domain/content truth wins over current code. If a page contradicts the source docs (`tradingflow-webapp-fullstack/doc/domain-knowledge/...`, the glossary, or the landing's own content), report the mismatch.
- **Forms & outbound actions need permission.** Do not submit a newsletter/contact/subscribe form, post comments, or trigger any "send"/external action without explicit user approval — submitting publishes/sends. Verifying the form renders and validates is fine; submitting is not.
- **Privacy:** if a cookie/consent banner appears, choose the most privacy-preserving option (decline non-essential) unless told otherwise.
- A screenshot alone is not proof of a working state. Pair it with a DOM/state signal, a network result (200 vs 404), or console evidence.

## What "Browser-First" Means Here

Allowed:

- Start or reuse the local dev server; or build and serve `out/`.
- Read content, components, config, and the project's own ops runbooks for context (read-only).
- Use browser interactions: navigate, click, type, inspect DOM, read console/network, take screenshots, switch viewport/locale, run a Lighthouse/perf audit.
- `curl`/`grep` against the running server or built `out/` to confirm an asset's HTTP status, a canonical tag, a sitemap entry, or a redirect — as *support* for what the browser shows.

Forbidden unless the user changes scope:

- Calling a green `next build` / `pagefind` / `lint` the E2E result.
- Editing content or code to make the walkthrough pass.
- Submitting forms or triggering outbound sends.
- `bun run deploy`.

## Required Context

Set the landing repo first:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
git status --short   # treat unrelated modified/untracked files as user work; do not revert
```

Read for context (read-only), as scope requires:

1. `site.config.ts` — nav, locales (`i18n.defaultLocale`), `posts.basePath` (`blogs`), `series.routeBases` (`tradingflow-docs → learn`), social, feed, SEO defaults, base URL.
2. `next.config.ts` — `output: "export"`, `trailingSlash: true`, image optimizer config.
3. The two sibling ops runbooks for this site (same folder):
   - [`update-tutorial-series.md`](./update-tutorial-series.md) — `/learn` IA, the image-path rule, the video pipeline, redirects.
   - `update-blog-posts-and-changelog.md` — blog/changelog structure.
4. Content source of truth for accuracy spot-checks (sibling webapp): `tradingflow-webapp-fullstack/doc/domain-knowledge/{shared,option-trades,rank}/functionality.md` + the glossary.
5. SEO/structured-data helpers: `src/lib/seo.ts`, `src/lib/json-ld.ts`, `src/app/sitemap.ts`, the feed route(s).

## Route Map

| Surface | Routes | What to verify | Notes |
| --- | --- | --- | --- |
| Home | `/` | Hero, primary CTAs (app + tutorials), featured posts/series, nav, footer | Entry for most visitors |
| Blog | `/blogs`, `/blogs/<slug>`, `/blogs/page/<n>` | Listing, pagination, a post render (MDX, images, code, TOC), author/tag links, share | `posts.basePath = blogs` |
| Tutorials (Learn) | `/learn`, `/learn/<slug>` | Hub catalog → all chapters; chapter render: images (the recurring 404 risk), **video** play, cross-links to siblings, breadcrumb, EN/中文 | Migrated from `/series` |
| Pricing | `/pricing` | Plan cards, CTAs, copy vs the webapp's freemium invariants | CTAs go to `app.tradingflow.com` |
| Changelog / Roadmap | `/changelog`, `/roadmap` | Entries render, dates, ordering | |
| Static pages | `/about` (content `[slug]`), `/privacy`, `/terms` (coded routes) | Render, links | |
| Taxonomy | `/tags`, `/tags/<tag>`, `/authors/<author>`, `/archive` | Listing pages resolve, counts, links back to posts | |
| Search | search box (Pagefind) | Query returns results that navigate correctly | **Needs a build** — see Runtime |
| Knowledge graph / notes / books / flows | `/graph`, `/notes`, `/books`, `/flow`, `/flows` | Render if enabled (some are feature-gated in `site.config`) | Check `features` flags first |
| Machine endpoints | `/sitemap.xml`, `/feed.xml` and `/feed.atom` according to `siteConfig.feed.format`, `/search.json`, `/robots.txt` | Valid XML/JSON, correct URLs (now `/learn`, not `/series`), no stale entries | Crawler-facing |

## Runtime Setup

**Option A — interactive dev (default for the walkthrough):**

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
bun run dev          # next dev
```

Default URL: `http://localhost:3000` (Next default; confirm the port printed in the terminal).

Caveats of `next dev`:
- **Search (Pagefind) needs a build first** — the index is generated into `public/pagefind` by `bun run build:dev`. Run that once if search is in scope, then `bun run dev`.
- `next dev` does **not** apply `output: export` exactly and does **not** run nginx/Netlify redirects → `/series/*` may 404 or show a static-param 500 locally. That is expected for redirect testing; verify redirects on the deployed/preview site.

**Option B — static-export fidelity (closest to production, minus nginx):**

```bash
bun run build:dev    # copy-assets + graph + next build + pagefind → out/
bunx serve out       # or: npx serve out   (static server on a printed port)
```

This serves the real exported HTML/assets (images optimized, pagefind present). It still won't do nginx redirects or trailing-slash rewriting the way nginx does — note that distinction when judging `/series → /learn` and trailing-slash behavior.

**Redirect verification (server-level):** to actually test `/series/tradingflow-docs/03-option-trades → /learn/option-trades`, hit the **deployed/preview** site (nginx) or replicate `nginx.conf.example`. On local servers, record redirects as `not-testable-locally` rather than `fail`; with `output: "export"`, `next dev` can show a static-param 500 for old `/series/*` paths that production redirects before Next handles them.

## Personas & Matrix

Landing-site personas (no accounts — this is a public site):

| Persona | What they care about |
| --- | --- |
| First-time visitor (EN) | Understands what TradingFlow is, finds the app/tutorials, trusts it |
| Chinese visitor (中文) | Same, in 中文 — language switch works, content is fully localized |
| Tutorial reader | `/learn` hub → chapters; images + videos work; cross-links flow |
| Mobile visitor | Hamburger nav, readable layout, tappable controls, video fits |
| Search engine / crawler | Canonical, hreflang, JSON-LD, sitemap, RSS, indexable, fast |

Minimum cross-cut for any scoped route: **EN + 中文 × desktop + mobile**, plus the crawler/SEO checks once per route.

## Browser Procedure

1. **Start the browser session correctly.** With `claude-in-chrome`, call `tabs_context_mcp` first, then `tabs_create_mcp` a fresh tab — do not reuse another session's tab IDs. (Load the tools in one `ToolSearch` call: `tabs_context_mcp, navigate, computer, read_page, read_console_messages, read_network_requests, tabs_create_mcp`.) For Lighthouse/perf/network depth, use the `chrome-devtools` MCP if connected.
2. **Know the visible state before and after every action.** After each navigate/click/type/locale-switch/viewport-change, collect the cheapest signal: a DOM/state read for labels/links/headings; a screenshot only when layout/overlap/chart/video framing matters; console + network when a blank/broken/dead state is suspected.
3. **Check console + network on every route.** Flag JS errors, failed asset loads (404/500), mixed content, and CORS failures. For images/videos specifically, confirm the network request is **200**, not a 404 swallowed by a broken-image icon.
4. **Use a fresh/clean context for first-impression checks** (no stale localStorage locale/theme).
5. **Avoid dialogs.** Do not trigger `alert`/`confirm`/`beforeunload`; do not click destructive/outbound actions (form submit, external "buy"/"contact send") without approval.
6. Reload after a build only if implementation scope was added; review-only sessions do not modify code.

## Workflow

### 0. Scope the run

Write a short scope block before opening the browser:
- Routes/surfaces in scope.
- Locales (EN, 中文, or both) and viewports (desktop, mobile, or both).
- Whether search, redirects, SEO artifacts, and media (video) are in scope.
- Explicit non-goals.
- Review-only, or user-approved implementation follow-up.

### 1. Build the journey map

Turn the Route Map + the site's own nav into visitor journeys (user-outcome phrasing, not selector tasks). Example journeys:
- "EN visitor lands on `/`, understands the product in one scroll, clicks to the tutorials, reads a chapter with a working video."
- "中文 visitor switches language on `/learn`, every chapter title/body/CTA is localized, images/video still render."
- "Crawler fetches `/sitemap.xml`, follows a `/learn/*` URL, finds canonical + JSON-LD + hreflang."
Merge into a compact `RouteCoverage` checklist; add exploratory checks scripts miss (overflow, empty/loading states, mobile fit, copy clarity, cross-link continuity).

### 2. Pass 0: Greenfield model

Before opening a route, state: the visitor's primary job, the ideal first-screen for that job, the one-sentence product promise, and the clearest path to the app or tutorials. This prevents "the page works as built" from becoming the default verdict.

### 3. Browser walkthrough (per route × locale × viewport)

1. Navigate the way a real visitor would (from `/` or nav, not only deep links).
2. Verify initial state: title, nav location, content present (not blank/spinner), no error boundary.
3. Exercise the route's controls (see 3A).
4. **Locale pass:** toggle the language switch; verify the **whole page** localizes (nav, headings, body, CTAs, dates, footer) and that images/videos still render. Reload and confirm the locale persists if the site claims it does. Note: this theme renders both locales in the DOM (`data-locale`) and toggles visibility client-side — confirm the *hidden* locale isn't shown and the active one is complete.
5. **Media pass:** for every `<img>`, confirm a 200 and a non-zero rendered box (no broken-image glyph); for every `<video>`, confirm the poster shows, then play and confirm it advances with audio and controls work. Tutorial images on `/learn/*` are the known 404 risk — check each.
6. **Mobile pass:** switch to a mobile viewport; verify hamburger nav opens/closes, no overflow/clipping/scroll-trap, tables/code/video fit, tap targets usable, language switch reachable.

### 3A. Control / element matrix

Build and execute an `ElementActionMatrix` for the interactive elements in scope — don't assume a control works because it renders:
- Navbar links + dropdowns (`More`), logo→home, language switch, theme toggle (if present), search box, footer links, social links.
- Listing controls: pagination, tag/author filters, "load more".
- Post/chapter controls: TOC links, in-page anchors, prev/next chapter nav, breadcrumb, share buttons (verify the share URL is correct; do **not** post), cross-links to sibling chapters and to `app.tradingflow.com`.
- Video player controls (play/pause/seek/mute/fullscreen).
Exercise each at least once; record the settled visible result and whether it matches intent. Record disabled/missing controls too.

### 3B. Link integrity sweep

For each scoped page, enumerate links and verify destinations resolve:
- **Internal links** → 200 and the expected page (no 404, no redirect loop). Pay special attention to `/learn/*` cross-links (post-migration) and any lingering `/series/*` links in content (should be none).
- **External links** → correct host (e.g. `https://app.tradingflow.com/app/...`), open without error; check `target=_blank` uses `rel="noopener"`.
- **Machine endpoints** → `/sitemap.xml`, the configured feed endpoint(s) (`/feed.xml` for `rss`, `/feed.atom` for `atom`, both for `both`), and `/search.json` are valid and contain current URLs; `/robots.txt` allows indexing and points to the sitemap.
Support tools allowed: `curl -sI <url>` for status, `curl -s <url> | grep` for sitemap/canonical content — as backup to the browser.

### 3C. SEO artifact verification

For representative pages (home, a blog post, a `/learn` chapter, the `/learn` hub), verify from the DOM/network:
- Exactly **one semantic `<h1>`** per logical page. Nuance: this theme renders both locales in the DOM, so a page may legitimately contain an EN `<h1>` and a 中文 `<h1>` (one hidden). Two H1s *for the same locale* is a defect; one-per-locale is by design — state which you saw.
- `<link rel="canonical">` present, absolute, self-referential, and using the **current** URL (`/learn/...`, trailing slash per `trailingSlash: true`).
- `hreflang` alternates for `en`, `zh`, and `x-default`.
- JSON-LD present and valid for the page type (`BlogPosting` on posts, `BreadcrumbList` + `CollectionPage`/`ItemList` on `/learn`, `Organization`/`WebSite` sitewide). Validate via `chrome-devtools` or by eye.
- OpenGraph + Twitter card tags with a resolvable image.
- No stray `noindex`/`nofollow` on pages that should be indexed.
- Title + meta description are present, unique, and descriptive.

### 3D. Redirect verification (server-level)

If redirects are in scope and you can reach the deployed/preview site or nginx:
- `/series` → `/learn` (301).
- `/series/tradingflow-docs` → `/learn` (301).
- `/series/tradingflow-docs/03-option-trades` → `/learn/option-trades` (301, NN- dropped).
On `next dev`/`serve out`, these 404 — record as `not-testable-locally`, not `fail`.

### 4. Defect sweep

Look specifically for:
- Blank route, error boundary, hydration error, infinite spinner, or blank chart/diagram/video.
- 404 image (broken-image glyph), unplayable/missing video, missing poster.
- Dead link/click, broken nav dropdown, language switch that only partially localizes, search that returns nothing or wrong results.
- Layout: text overflow, clipped labels, overlapping sticky header, horizontal scroll hiding content, unusable mobile tap targets, code blocks/tables/videos overflowing on mobile.
- Stale/wrong copy: old `/series` naming, retired product names, implementation jargon, copy contradicting the glossary or the webapp's freemium reality.
- Broken route state on reload; trailing-slash inconsistency; query-param leakage.
- Console errors correlated with visible breakage; network 404/500 for assets or data.
- Mermaid/diagram blocks that fail to render (they render client-side — the build won't catch syntax errors).

### 5. Visitor & SEO review

Judge each surface on:

| Dimension | What to ask |
| --- | --- |
| `clarity` | Does a first-time visitor understand what TradingFlow is and who it's for, fast? |
| `scanability` | Can they skim headings, cards, and CTAs without friction? |
| `conversion` | Is the path to the app / tutorials obvious and low-friction? |
| `contentTrust` | Is the copy accurate vs the product, current, and free of dead/old references? |
| `i18nParity` | Is 中文 a complete, faithful mirror (nav, body, CTAs, dates, media)? |
| `mediaQuality` | Do images/diagrams/videos load fast, look right, and add value? |
| `seoHealth` | Canonical/hreflang/JSON-LD/sitemap/feed correct; titles/descriptions strong; indexable; fast (LCP/CLS). |
| `responsive` | Is the mobile experience first-class for nav, reading, and media? |
| `accessibility` | Alt text, heading order, focus states, contrast, keyboard nav, reduced-motion. |

### 6. Synthesize findings

A finding is real when it has: persona, route + locale + viewport, visible evidence (URL, copy, screenshot label, console/network note), expected behavior (from docs/contract or a clear visitor job), consequence, and an acceptance signal for a future review. Deduplicate as you go. Do not file a bug for local-only artifacts (e.g. `/series` 404 on `next dev`, a TradingView widget blanked by local proxy, search empty because pagefind wasn't built) unless the deployed site reproduces it.

## Required Output

### RouteCoverage

| Field | Meaning |
| --- | --- |
| `routeId` | Stable id, e.g. `LEARN-CHAPTER-001`, `BLOG-POST-001`, `HOME-001` |
| `route` | URL path |
| `locale` | `en`, `zh`, or `both` |
| `viewport` | `desktop`, `mobile`, or size |
| `journey` | Visitor-outcome phrasing |
| `status` | `pass`, `fail`, `blocked`, `not-in-scope` |
| `evidence` | URL, observed state/copy, screenshot label, console/network note |

### I18nMatrix

Required when i18n / the language switch is in scope.

| Field | Meaning |
| --- | --- |
| `route` | URL |
| `switchAction` | How the locale was toggled |
| `enState` | Key EN content observed (title/CTA/nav sample) |
| `zhState` | Matching 中文 content observed |
| `parity` | `complete`, `partial`, `missing` — note any untranslated/leaking strings |
| `persistence` | Does the locale survive reload/navigation as claimed? |
| `status` | `pass`, `fail`, `blocked`, `not-in-scope` |
| `evidence` | URLs, visible copy, screenshot label |

### MediaIntegrityMatrix

Required whenever images or videos are in scope (always for `/learn` and blog posts).

| Field | Meaning |
| --- | --- |
| `asset` | Image/video, with its `src` |
| `route` | Where it appears |
| `httpStatus` | Network result (expect 200) |
| `rendered` | `ok`, `broken-img`, `blank`, `no-poster` |
| `playback` | For video: `plays+audio`, `plays-no-audio`, `no-play`, `n/a` |
| `status` | `pass`, `fail`, `blocked`, `not-in-scope` |
| `evidence` | Network note, screenshot label, console error |

### LinkIntegrityMatrix

| Field | Meaning |
| --- | --- |
| `link` | Link text + href |
| `route` | Source page |
| `kind` | `internal`, `external`, `anchor`, `machine` (sitemap/feed/robots) |
| `destinationStatus` | 200 / 301 / 404 / error, and where it landed |
| `status` | `pass`, `fail`, `blocked`, `not-in-scope` |
| `evidence` | curl/network result, observed destination |

### SeoArtifactMatrix

Required when SEO/crawlability is in scope.

| Field | Meaning |
| --- | --- |
| `route` | URL |
| `canonical` | Value + self-referential? trailing slash? `/learn` (not `/series`)? |
| `hreflang` | `en`/`zh`/`x-default` present? |
| `jsonLd` | Types present + valid? |
| `og` | OpenGraph/Twitter present + image resolves? |
| `h1` | Count + locale note (one-per-locale is OK) |
| `indexable` | No stray `noindex`; in `sitemap.xml` |
| `status` | `pass`, `fail`, `blocked`, `not-in-scope` |
| `evidence` | DOM snippet, sitemap/feed note |

### VisitorReviewFinding

| Field | Meaning |
| --- | --- |
| `id` | Stable id, e.g. `LEARN-UX-001`, `SEO-001`, `HOME-UX-001` |
| `severity` | `Critical`, `High`, `Medium`, `Low` |
| `action` | `add`, `delete`, `merge`, `update`, `keep` |
| `surface` | Route, section, component, asset |
| `personaJob` | Visitor/crawler job blocked or improved |
| `observedFriction` | What was visible in the browser |
| `consequence` | Why it matters for clarity, trust, conversion, or SEO |
| `greenfieldTarget` | Cleaner shape from Pass 0 |
| `recommendation` | PM-level recommendation, not implementation steps |
| `evidence` | URLs, copy, state, screenshot label, console/network |
| `acceptanceSignal` | What a future review would see to call it resolved |

### ElementActionMatrix

| Field | Meaning |
| --- | --- |
| `elementControl` | Nav item, dropdown, language switch, search, pagination, TOC, share, video control, footer/social link |
| `currentRole` | What it appears to do |
| `action` | `add`, `delete`, `merge`, `update`, `keep` |
| `rationale` | Why, from the visitor job |
| `expectedImpact` | Expected improvement |
| `riskTradeoff` | What could get worse / needs a product decision |

### VisitorScorecard

Concise ratings/notes for: `clarity`, `scanability`, `conversion`, `contentTrust`, `i18nParity`, `mediaQuality`, `seoHealth`, `responsive`, `accessibility`.

### Final Report Shape

1. Scope and environment (server used: `next dev` vs `serve out` vs deployed; locales; viewports; which browser tool).
2. Browser procedure summary.
3. RouteCoverage table.
4. I18nMatrix (when i18n in scope).
5. MediaIntegrityMatrix.
6. LinkIntegrityMatrix.
7. SeoArtifactMatrix (when SEO in scope).
8. Ranked VisitorReviewFinding table.
9. ElementActionMatrix.
10. VisitorScorecard.
11. Evidence index: screenshot labels, URLs, notable console/network observations.
12. Blockers and uncertainty (mark server-level redirects `not-testable-locally` if applicable).
13. Runbook maintenance suggestion.
14. Explicit statement: `No findings, screenshots, or artifacts were committed; no deploy was run.`

## Severity Guide

| Severity | Use when |
| --- | --- |
| `Critical` | Core route blank/broken, site-wide nav/i18n/search broken, home or pricing unusable, mass 404s, or SEO regression that de-indexes pages (bad canonical/noindex/sitemap). |
| `High` | A key page or tutorial broken, video unplayable, broken images across `/learn`, dead primary CTA, broken language switch, mobile core flow unusable, or stale/incorrect product copy that misleads. |
| `Medium` | Meaningful friction: confusing copy, weak empty/loading state, partial i18n, awkward control, a single broken link, or a scanability/responsive issue. |
| `Low` | Polish: minor copy/layout, alt-text gaps, small a11y/contrast issues, non-blocking coverage gaps. |

## Troubleshooting

- **Search returns nothing** → Pagefind index missing. Run `bun run build:dev` (outputs `public/pagefind`), then re-test; on `next dev` without a build, mark search `blocked`.
- **`/series/*` 404 or 500 locally** → expected on `next dev`/`serve out` when redirects are nginx/Netlify-owned. Next dev may throw `missing param ... generateStaticParams()` for old export-only paths. Verify on the deployed/preview site; record `not-testable-locally`.
- **Tag/author paths 500 only on `next dev`** → with `output: "export"`, dynamic routes that exist in `out/` or production can still throw static-param 500s in dev when the encoded slug is not in `generateStaticParams()`. Re-check with `bunx serve out` or the deployed site before filing a public dead-link defect.
- **Broken tutorial image** → almost always the relative-vs-absolute path bug. Confirm the `<img src>` resolves to `/blogs/tradingflow-docs/images/.../*.WEBP` (200) and that the source used the absolute path; see [`update-tutorial-series.md`](./update-tutorial-series.md). On `next dev`, optimized `.WEBP` variants may differ from `out/` — re-check against `serve out` before filing.
- **Video won't play / no poster** → check the network request for `/videos/tutorials/<NN-slug>.mp4` (200, `video/mp4`) and the poster `.jpg`; confirm the file exists in `public/videos/tutorials/`. If R2 hosting has been switched on, the `src` may be `https://<base>/videos/...` — verify that host returns 200 + range support.
- **Blank TradingView/embedded widget on this Mac only** → check local proxy/Shadowrocket routing before filing a product bug.
- **Locale won't switch / shows both** → inspect `data-locale` visibility toggling and `LanguageProvider`; confirm it's not a stale localStorage value (clear context and retry).
- **Hydration/console errors** → capture the exact message + the route; correlate with visible breakage before filing.
- **Dev server not running** → `bun run dev` (port printed; default 3000). For static fidelity, `bun run build:dev && bunx serve out`.
- **A page that should exist 404s** → check `site.config.ts` `features` flags (notes/books/flow can be gated) and whether it's `not-in-scope` vs a real defect.

## When To Switch Runbooks

- Creating/fixing tutorial chapters, images, diagrams, or videos: [`update-tutorial-series.md`](./update-tutorial-series.md).
- Blog posts / changelog content: `update-blog-posts-and-changelog.md`.
- Testing the **webapp** (auth, billing, premium, trading surfaces): [`../webappp-fullstack/browser-e2e-product-review.md`](../webappp-fullstack/browser-e2e-product-review.md).
- Production error correlation / analytics: the webapp `ops/webappp-fullstack/error-investigate.md` / `posthog-research.md`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the walkthrough revealed a reusable lesson (a recurring defect, a new route, a missing verification gate, a tooling quirk).
2. Promote durable lessons into Route Map, Browser Procedure, Workflow, Troubleshooting, or the output templates.
3. Keep transient state in Agent Handoff only; prune completed handoff items before adding new ones.
4. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Routes, nav, locales, `routeBases`, the video/image pipeline, search, or SEO output drift.
- A repeated walkthrough blocker needs a standard recovery step.
- A verification gate was too weak, too broad, or missing.

Do not update it for one-off findings, raw screenshot lists, temporary local data gaps, or completed review progress.
