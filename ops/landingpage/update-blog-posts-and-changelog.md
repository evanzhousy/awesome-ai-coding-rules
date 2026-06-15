---
name: update-blog-posts-and-changelog
description: Maintains TradingFlow landing-page blog posts (MDX under content/posts with covers, screenshots via capture-blog-ui) and the Product Changelog (src/lib/productChangelog.ts release cards, What's New sync). Covers UI capture workflow, ROUTE_PLAN + retired-post sync, EN/zh parity, changelog card shape/tests, glossary alignment, and cross-sync between blog ships and in-app carousel. Use when editing blog posts, refreshing data-app screenshots, adding/editing changelog releases, shipping user-visible product notes, or coordinating What's New after product updates.
---

# Update Blog Posts and Product Changelog (TradingFlow landing)

This combined skill covers maintenance of two closely related areas on the marketing site: the bilingual blog posts and the public Product Changelog. They frequently intersect during product ships (blog post + changelog card + What's New carousel slide).

## When to use

Use this skill when:
- Changing `content/posts/**` (copy, screenshots, covers, cross-links, or verifying no loading spinners / bad images).
- Adding, editing, or reordering release cards in the public changelog.
- The user mentions `/changelog`, `tradingflow.com/changelog`, `PRODUCT_CHANGELOG_RELEASES`, product release notes, or blog UI captures.
- You need to keep blog screenshots and changelog / What's New in sync after a product ship.

## Repo map

### Blog posts (this repo)
- Posts: `content/posts/<slug>/` with `index.mdx`, `index.zh.mdx`, and `images/` (including `cover.png`).
- Build/assets: `bun run build:dev` → `scripts/copy-assets.ts` copies non-MDX assets to `public/<postsBasePath>/` (see `site.config.ts` `posts.basePath`, often `blogs`).
- Capture script: `scripts/capture-blog-ui-screenshots.ts` (uses Playwright against sibling webapp dev server).

### Product Changelog (this repo)
- Release data: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`, `PRODUCT_CHANGELOG_AREAS`, helpers).
- Tests: `src/lib/productChangelog.test.ts`.
- Page UI: `src/components/ProductChangelog.tsx`.
- Route + SEO: `src/app/changelog/page.tsx`.
- i18n chrome: `src/i18n/translations.ts`.
- Feature gate: `site.config.ts` `features.changelog.enabled`.

**Important invariant:** The single source of truth for release data is **this repo** (`tradingflow-web-landingpage`). The webapp (`tradingflow-webapp-fullstack`) only links to `${MARKETING_SITE_URL}/changelog` and does not duplicate `PRODUCT_CHANGELOG_RELEASES`.

## Blog Posts Maintenance

### Audit checklist
1. **Enough screenshots** — Grep `content/posts/**/index*.mdx` for `![`. Retired/merged-route posts must pull figures from the **live** replacement surface (e.g. Option Chain Analysis) with accurate captions.
2. **No loading frames** — Re-capture if PNGs show spinners, skeletons, or “Loading …” (extend `capture-blog-ui-screenshots.ts` readiness gates as needed).
3. **No huge blank/black bands** — Caused by full-element table screenshots or full-viewport drawer shots with dimmed backdrop. Fix with `page.screenshot({ clip })` on the first table or `[data-slot="sheet-content"]` (respect `TABLE_SCREENSHOT_MAX_HEIGHT_PX` / `DRAWER_SCREENSHOT_MAX_HEIGHT_PX`).

### Cover images
- Set `coverImage: "./images/cover.png"` in both `index.mdx` and `index.zh.mdx` for card display.
- Place at `content/posts/<slug>/images/cover.png`.
- Active data-app posts: prefer current hero from the route (or the viewport PNG written by the capture script).
- Retired / merged posts: reuse the live replacement app’s cover and note in prose that the image is from the current surface.
- After changes: `bun run build:dev` (local) or `bun run build` (production image optimizer hashes).

### Webapp login (required for screenshots)
1. Start sibling app: `cd ../tradingflow-webapp-fullstack && pnpm dev`. Use the Local URL (often `http://localhost:8000`; 8001 if busy).
2. Capture only against local dev server with Clerk **development** keys (not production).
3. Defaults (override via env):
   - Email: `active+clerk_test@example.com` (`E2E_LOGIN_EMAIL`, `E2E_LOGIN_EMAIL_ACTIVE`)
   - OTP: `424242` (`E2E_VERIFICATION_CODE`)
4. References: webapp `tests/e2e/fixtures/auth.ts`, its `doc/automation/e2e-test/README.md`, and landing `AGENTS.md`.

The capture script (`scripts/capture-blog-ui-screenshots.ts`) calls `ensureLoggedIn`, seeds `sessionStorage` for feature announcements (default campaign `2026-05-product-ships`, overridable via `BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID`), and handles What's New dismissal.

**Troubleshooting:** wrong `BLOG_UI_CAPTURE_BASE_URL` port, mismatched Clerk keys, stale OTP env — fix before re-running.

### Automated capture command
```bash
BLOG_UI_CAPTURE_BASE_URL=http://localhost:8000 bun run capture-blog-ui
```
(Defined in `package.json` → `capture-blog-ui` script.)

Constants: `VIEWPORT` 1600×900, `TABLE_SCREENSHOT_MAX_HEIGHT_PX` (960), `DRAWER_SCREENSHOT_MAX_HEIGHT_PX` (1700), contract drawer env vars for option symbol / underlying (default TSLA).

### `ROUTE_PLAN` and retired-post sync
`ROUTE_PLAN` in the capture script lists every `/app/...` route and the relative PNG paths (viewport, table, drawer, optional filters).

- Option Chain Analysis outputs are duplicated into legacy `gex-screener` paths in the same pass.
- After the loop, `syncRetiredPostScreenshotsFromOptionChainAnalysis()` copies from `option-chain-analysis/images/` into `oi-change-rank` and `volatility-desk` (including `cover.png`).

### Avoid screenshots while loading
Use deterministic waits:
- Session: `waitForAppReady`
- Shell: `waitForDataAppShellIdle`
- Route surface: `waitForRouteSurfaceReady` (first table, specific testids, charts)
- Drawers: hide loading text / aria-busy cycles, fall back to documented no-data/error text.

Re-open drawers and re-capture if a saved PNG still shows loading UI.

### Remove blank space
- Tables: `page.screenshot({ fullPage: false, clip: firstTable.boundingBox() })` clamped to max height. Never use `locator.screenshot()` on `<table>` (captures full DOM height → thousands of px).
- Drawers: clip `[data-slot="sheet-content"]` (capped height, no full dimmed backdrop).
- After manual `sips` crop/resize, re-run `bun run build:dev`.

### Image quality checks
- No spinner/skeleton text or progress overlays.
- Drawer images show panel content only.
- Table images are useful top crops (not full scroll).
- Spot-check dimensions with `sips -g pixelWidth -g pixelHeight`.

### Content rules
- **EN + zh:** Keep `index.mdx` and `index.zh.mdx` in sync (structure, images, adapted captions).
- **Domain truth:** For product routes/params/naming, read sibling `tradingflow-webapp-fullstack/doc/domain-knowledge/` and glossary first.
- **Links:** Follow static-export rules in `AGENTS.md` (real slugs, no placeholders).

### What's New alignment (sibling webapp)
Blog work for a product ship should be coordinated with changelog / What's New updates (see below).

After capture/MDX edits:
- If a post slug is in an active slide’s `postPath`, refresh the slide’s `body` and confirm `postPath`.
- If cover art under `public/feature-announcement/` changed, bump cache-bust in webapp `src/components/FeatureAnnouncement/coverRegistry.tsx`.
- Per-slide expiry and mapping rules live in webapp `doc/domain-knowledge/domain-invariants/feature/new-feature-modal.md` (Invariant 11) and the changelog skill’s “What's New sync” section.
- If `FEATURE_ANNOUNCEMENT.campaignId` changes, update the capture script default and `AGENTS.md`.

### Verification (blog)
```bash
bun run lint
bun run build:dev
```
Use `bun run build` when you need production image optimizer hash refresh (see `AGENTS.md`).

---

## Product Changelog Maintenance

### When to use
- Adding, editing, or reordering release cards for the public changelog.
- User mentions `/changelog`, `tradingflow.com/changelog`, `PRODUCT_CHANGELOG_RELEASES`, or customer-facing product release notes.
- Copy must align with canonical product names from the webapp glossary.

**Do not** use for raw git history, engineering-only logs, or duplicate ledgers in the webapp.

### How to load this skill
This lives under `docs/skills/` (not auto-discovered by Cursor). Reference explicitly with `@...` or add a pointer in `AGENTS.md`.

### Greenfield invariant
**Exactly one** changelog source of truth: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`) in **this repo**. The webapp links to the marketing page; it does not own the data.

### Mandatory reads (sibling webapp)
1. `doc/knowledge/glossary.md` — Use canonical surface names (Option Trades, Contract-level analysis, Option Chain Analysis, etc.). Do not invent alternate labels.
2. `doc/domain-knowledge/domain-invariants/feature/new-feature-modal.md` — Only if touching What’s New behavior, footer/modal link policy, or URL/new-tab contract.

### Repo map (this repo)
- Release data: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`, `PRODUCT_CHANGELOG_AREAS`, `PRODUCT_CHANGELOG_SECTION_ORDER`, `Localized<T>`, pick helpers).
- Invariant tests: `src/lib/productChangelog.test.ts`.
- Page UI: `src/components/ProductChangelog.tsx`.
- Route + SEO: `src/app/changelog/page.tsx`.
- UI chrome copy: `src/i18n/translations.ts`.
- Feature gate: `site.config.ts` `features.changelog.enabled`.

Changing only release copy or adding cards usually touches **only** `productChangelog.ts`. Touch UI or `translations.ts` only for presentation/chrome changes.

### Public URL and webapp links
- Canonical: `https://tradingflow.com/changelog` (static export, trailing slash per site config).
- Webapp: `MARKETING_SITE_URL + /changelog` (new tab from Option Trades footer, What’s New, etc.). Do **not** reintroduce an in-app `/changelog` route or duplicate the data.

### Scope (what belongs in the changelog)
Only behavior that **shipped** to real users in production (or the intended hosted product).

**Exclude:**
- Local-only routes, dev-only features, CI-only work, pure internal refactors (no user-visible outcome).
- Bullets that read like commit subjects or ticket dumps.
- Docs-only, E2E harness-only, `.cursor`/skills-only, pure `chore:` bumps with no UX change.
- Internal observability renames or doc moves (unless user-visible, e.g. clearer error UI).
- Notebook/wiki-only, SQL/metadata tweaks with no clear user-visible outcome.
- Commit hashes, ticket IDs, branch names, subsystem codenames.

**Prefer to include:** glossary-named surfaces, localization users see, filters/tables/live mode, ranking/lookup behavior, What’s New / footer UX, real user-visible **Fixed** items.

**Locales:** New cards should ship with both `en` and `zh` (`title`, `summary`, parallel bullet arrays) unless explicitly backfilling English only (add `zh` later).

### `ProductChangelogRelease` shape
Each entry must pass `productChangelog.test.ts`:

| Field | Rule |
| --- | --- |
| `id` | Unique string; stable slug; **never reuse** after publish. |
| `publishedAt` | `YYYY-MM-DD`; strictly newest-first (descending). |
| `title`, `summary` | `Localized<string>` — non-empty customer-facing `en` and `zh` when possible (empty `zh` may fall back in UI). |
| `area` | Optional; one of `PRODUCT_CHANGELOG_AREAS` (`option-trades`, `symbol-level-analysis`, `contract-level-analysis`, `option-chain-analysis`, `account`, `platform`). |
| `sections` | Only `new`, `improved`, `fixed`. Omit empty keys. Values are `Localized<string[]>` with **parallel** bullets per locale. |
| Bullets | At least **one** non-empty bullet **across all sections** per release. **No `http://` or `https://`** in any bullet (self-contained narrative; no “read more at …” links). |

**Section semantics**
- **New** — First-time or materially new capability the user can try.
- **Improved** — Clearer UX, performance, localization, or reliability of existing behavior.
- **Fixed** — User-visible bug or regression resolved.

Group into **one card per meaningful ship moment** (often a few days to a week), not one card per commit. Keep `PRODUCT_CHANGELOG_RELEASES` strictly newest-first.

### Git history for product drafts
Use `git` as a hint, not copy-paste. Default evidence is the **hosted app**:

| Intent | Repo / ref | Notes |
| --- | --- | --- |
| Product / data-app releases (Option Trades, Option Chain Analysis, Contract-level analysis, Symbol-level analysis, What’s New, etc.) | `tradingflow-webapp-fullstack` — `origin/main` (or `main`) | Run dated log: `git fetch origin main && git log origin/main --format='%h %ad %s' --date=short -80 --since=YYYY-MM-DD`. |
| Marketing site only (new landing sections, pricing table, SEO, static pages) | `tradingflow-web-landingpage` — `origin/main` | Use when user explicitly wants landing ships or no app change but public site changed materially. |

**Grouping:** Merge commits into one card per ship moment. Pick `publishedAt` as the calendar date of the latest user-visible ship in the cluster.

### Workflow
1. **Gather** — App-facing: dated `git log` on `tradingflow-webapp-fullstack origin/main`. Landing-only: same on this repo. Map to glossary surface names.
2. **Filter** — Drop non-shipped, non-user-visible noise (see Scope + Git history).
3. **Draft** — Edit `src/lib/productChangelog.ts`: prepend at top of `PRODUCT_CHANGELOG_RELEASES`; keep `id` / `publishedAt` / sort valid. Add both locales when possible.
4. **What's New (webapp)** — After new/updated cards, sync the in-app carousel (see “What's New sync” below). Do **not** duplicate the releases array into the webapp.
5. **Verify** — `bun test src/lib/productChangelog.test.ts`. After UI/i18n changes also `bun run lint && bun run build:dev`.
6. **Wiki (webapp)** — If you change business-visible policy (page promises, link policy, URL behavior), update the sibling `doc/domain-knowledge/domain-invariants/feature/new-feature-modal.md` (per its `AGENTS.md`).
7. **Webapp locales** — If changing in-app strings that link to changelog, edit webapp `src/locales/*.ts` and run its locale parity checker.

### What's New sync (sibling webapp)
After editing `productChangelog.ts`, keep the in-app carousel aligned:

1. Read webapp `doc/domain-knowledge/domain-invariants/feature/new-feature-modal.md` (Invariant 11).
2. Edit `src/config/featureAnnouncement.config.ts` — for each new/materially updated release in the top ~30 days, add/update a slide:
   - `publishedAt` = changelog `publishedAt`
   - `activeUntilIso` = `buildSlideActiveUntilIso(publishedAt)` (45-day TTL)
   - `title` / `body` = short carousel copy from `summary` + top 1–2 bullets (English); use glossary names.
   - `coverId`, `linkHref`, optional `postPath` / `postLabel` from the mapping table (see original skill for details; areas map to specific covers and routes).
3. Delete slide rows whose `activeUntilIso` is in the past.
4. Bump `campaignId` when the active slide set changes; extend `showUntilIso`.
5. Verify: `pnpm exec vitest run src/config/featureAnnouncement.test.ts` (in webapp).
6. If `campaignId` changed, update landing `scripts/capture-blog-ui-screenshots.ts` default `BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID` and [AGENTS.md].

### Anti-patterns
- Pasting commit subjects as bullets.
- One noisy release per day.
- Raw URLs or “read the docs at …” in bullets (forbidden by tests).
- Duplicate `publishedAt`, wrong sort order, reused `id`.
- Shipping local-only or unreleased features.
- Duplicating `PRODUCT_CHANGELOG_RELEASES` in the webapp (forbidden).
- Adding What's New slides without proper `activeUntilIso` or leaving stale expired rows.
- Forgetting to bump `campaignId`.
- Treating landing `git` history as default for in-app product bullets (it's mostly marketing/SEO).

### Pasteable agent instruction (combined for blog + changelog)
```text
You are updating TradingFlow’s public blog posts and Product Changelog.

Before editing blog posts (content/posts/**):
- Read the combined skill for audit rules (screenshots, covers, no loading UI, crop/clip rules, retired-post sync via ROUTE_PLAN, EN/zh parity).
- Use `tradingflow-webapp-fullstack` dev server + Clerk dev keys for captures.
- Coordinate with changelog / What's New when the post accompanies a product ship.

Before editing the changelog:
1. Read tradingflow-webapp-fullstack/doc/knowledge/glossary.md for canonical surface names.
2. Follow the combined update-blog-posts-and-changelog skill (release card shape, scope, Git history guidance for which repo to mine, What's New sync).
3. If the task touches What’s New or link policy, read tradingflow-webapp-fullstack/doc/domain-knowledge/domain-invariants/feature/new-feature-modal.md.

Implementation:
- Blog: edit MDX + images under content/posts; run capture-blog-ui when needed; keep covers in images/cover.png; sync retired posts from Option Chain Analysis when appropriate.
- Changelog: edit ONLY src/lib/productChangelog.ts (prepend to PRODUCT_CHANGELOG_RELEASES). Use newest-first, unique id, YYYY-MM-DD publishedAt, optional area, sections new|improved|fixed as Localized<string[]>, at least one bullet total, no http(s) in bullets, omit empty sections.
- For “update from main”: default to git log on tradingflow-webapp-fullstack origin/main for product ships; use landing main only for pure marketing ships. Cluster into meaningful cards.
- After new release cards or blog ships that affect What's New: sync slides in webapp featureAnnouncement.config.ts, bump campaignId, update capture script default if needed.
- After blog MDX/image changes: bun run lint && bun run build:dev (or build for prod hashes).
- After changelog changes: cd tradingflow-web-landingpage && bun test src/lib/productChangelog.test.ts; then in webapp run the featureAnnouncement test.

Verify both:
- Blog: lint + build:dev (plus build when hashes matter).
- Changelog: the productChangelog test + webapp featureAnnouncement test.
```
