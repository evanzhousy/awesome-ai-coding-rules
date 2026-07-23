---
name: update-blog-posts-and-changelog
description: Maintains TradingFlow landing-page blog posts (MDX under content/posts with covers, screenshots via capture-blog-ui), the public Product Changelog (src/lib/productChangelog.ts release cards), and signed-in Featurebase Product Updates. Covers UI capture workflow, ROUTE_PLAN + retired-post sync, EN/zh parity, changelog card shape/tests, glossary alignment, and cross-sync between blog ships, changelog cards, and Featurebase Updates. Use when editing blog posts, refreshing data-app screenshots, adding/editing changelog releases, shipping user-visible product notes, or coordinating Featurebase Updates after product updates.
---

# Update Blog Posts, Product Changelog, and Featurebase Updates (TradingFlow landing)

This combined skill covers maintenance of three closely related release surfaces: bilingual landing blog posts, the public Product Changelog, and signed-in Featurebase Product Updates. They frequently intersect during product ships (blog post + changelog card + Featurebase Update).

## Recommended Invocation

Use `/goal` for product-ship or content-refresh runs:

- Objective: update the requested blog posts, screenshots, changelog releases, and Featurebase Updates sync without drifting from the current product contract.
- Success criteria: involved worktrees are checked before edits, screenshots/covers/changelog cards are verified with the documented commands, sibling webapp Featurebase Product Updates sync is handled or explicitly deferred, and this runbook is updated for reusable drift.
- Stop condition: all requested content artifacts pass verification, or a blocker identifies the exact missing repo access, login, screenshot, locale, or test condition.

## Agent Handoff

Last updated: 2026-07-20

### Look First

- [ ] Re-verify the signed-in Featurebase **Updates** dropdown from the live app footer when an authenticated browser session is available. Latest run published Featurebase changelog `6a5dde46d23ee72bbc2bef6c` (`rank-saved-views-and-steadier-previews`) and verified API/public URL state, but ego-browser inherited a guest session so the footer dropdown/read-state click could not be completed.

## When to use

Use this skill when:
- Changing `content/posts/**` (copy, screenshots, covers, cross-links, or verifying no loading spinners / bad images).
- Adding, editing, or reordering release cards in the public changelog.
- The user mentions `/changelog`, `tradingflow.com/changelog`, `PRODUCT_CHANGELOG_RELEASES`, product release notes, or blog UI captures.
- You need to keep blog screenshots, public changelog cards, and Featurebase Updates in sync after a product ship.

## Repo map

### Blog posts (target repo)
- Target checkout: `../tradingflow-web-landingpage` when this runbook is opened from `awesome-ai-coding-rules`.
- Posts: `content/posts/<slug>/` with `index.mdx`, `index.zh.mdx`, and `images/` (including `cover.png`).
- Build/assets: `bun run build:dev` → `scripts/copy-assets.ts` copies non-MDX assets to `public/<postsBasePath>/` (see `site.config.ts` `posts.basePath`, often `blogs`).
- Capture script: `scripts/capture-blog-ui-screenshots.ts` (uses Playwright against sibling webapp dev server).

### Product Changelog (target repo)
- Release data: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`, `PRODUCT_CHANGELOG_AREAS`, helpers).
- Tests: `src/lib/productChangelog.test.ts`.
- Page UI: `src/components/ProductChangelog.tsx`.
- Route + SEO: `src/app/changelog/page.tsx`.
- i18n chrome: `src/i18n/translations.ts`.
- Feature gate: `site.config.ts` `features.changelog.enabled`.

**Important invariant:** The single source of truth for public release data is **the landing repo** (`tradingflow-web-landingpage`). Signed-in Product Updates are published/read through Featurebase. The webapp (`tradingflow-webapp-fullstack`) links to `${MARKETING_SITE_URL}/changelog` for the public changelog and must not duplicate `PRODUCT_CHANGELOG_RELEASES`.

### Current app route topology
- **Rank workbench:** `/app/rank` opens the product-level Rank surface with Contracts as the default view.
- **Contract-level analysis:** use the explicit tab route `/app/rank/contracts` for screenshot capture and deep links; legacy `/app/contract-rank` redirects here.
- **Symbol-level analysis:** use the explicit tab route `/app/rank/symbols`; legacy `/app/market-rank` and `/app/symbol-level` redirect here.
- **Option Chain Analysis:** no standalone route; GEX / Vol / Positioning / Chain capabilities live in Rank Symbols and the symbol inspection drawer. Legacy `/app/option-chain-analysis` should land on Rank Symbols.

### Preflight safety
Before touching files, check all involved worktrees:

```bash
git -C ../tradingflow-web-landingpage status --short
git -C ../tradingflow-webapp-fullstack status --short
git status --short
```

- Treat unrelated modified/deleted/untracked files as user or external work. Do not revert them.
- If a sibling dev server is already running, reuse the active port after confirming it serves the webapp.
- Keep intended edits scoped to the landing repo, Featurebase Update publication/verification, and this runbook unless the product/docs contract requires webapp integration changes.

## Blog Posts Maintenance

### Audit checklist
1. **Enough screenshots** — Grep `content/posts/**/index*.mdx` for `![`. Retired/merged-route posts must pull figures from the **live** replacement surface (e.g. Option Chain Analysis) with accurate captions.
2. **No loading frames** — Re-capture if PNGs show spinners, skeletons, or “Loading …” (extend `capture-blog-ui-screenshots.ts` readiness gates as needed).
3. **No huge blank/black bands** — Caused by full-element table screenshots or full-viewport drawer shots with dimmed backdrop. Fix with `page.screenshot({ clip })` on the first table or `[data-slot="sheet-content"]` (respect `TABLE_SCREENSHOT_MAX_HEIGHT_PX` / `DRAWER_SCREENSHOT_MAX_HEIGHT_PX`).

### Cover images
- Set `coverImage: "./images/cover.png"` in both `index.mdx` and `index.zh.mdx` for card display.
- Place at `content/posts/<slug>/images/cover.png`.
- Cover copy is part of the artifact, but keep it extremely sparse and content-led. Do not put the blog title or `TradingFlow` brand text on the cover. When the post story, product positioning, or retired-route messaging changes, update the visible short content cue too; do not leave obsolete names embedded in the image.
- Regenerate deterministic cover lettering with `bun run letter-blog-covers` (landing repo). The script writes `content/posts/<slug>/images/cover.png` for the current product post set.
- Cover visual style should follow the landing repo's shadcn setup. Check `bunx --bun shadcn@latest info --json` when the project style may have changed; as of this run the project uses `base-mira`, neutral base color, blue theme/chart accents, Inter, small radius, subtle menu accent, and installed `card` / `badge` / `button` primitives.
- The generated cover should feel like a quiet shadcn product surface: neutral page background, `bg-card`-like white surfaces, subtle border/ring/shadow, compact badge/button shapes, restrained blue chart accents, and one post-specific UI motif from the blog content. Do not use Apple logos, Apple brand assets, decorative Bauhaus-only compositions, or busy dashboard/card collages.
- Active data-app posts: the short phrase should describe the workflow or user story from the post, not simply repeat the surface name.
- Retired / merged posts: use a short phrase that points to where the capability lives now (for example `GEX in Symbols`, `OI in Positioning`, `Vol in Symbols`) while prose explains replacement or retired status.
- Visual check: inspect at least the changed covers after generation for readable minimal text, post-specific meaning, shadcn-style neutral/blue card-badge treatment, no overlap, and current product naming.
- After changes: `bun run build:dev` (local) or `bun run build` (production image optimizer hashes).

### Webapp login (required for screenshots)
1. Start sibling app: `cd ../tradingflow-webapp-fullstack && pnpm dev`. Use the Local URL (often `http://localhost:8000`; 8001 if busy).
2. Capture only against local dev server with Clerk **development** keys (not production).
3. Defaults (override via env):
   - Email: `active+clerk_test@example.com` (`E2E_LOGIN_EMAIL`, `E2E_LOGIN_EMAIL_ACTIVE`)
   - OTP: `424242` (`E2E_VERIFICATION_CODE`)
4. References: webapp `tests/e2e/fixtures/auth.ts`, sibling `awesome-ai-coding-rules/ops/webappp-fullstack/browser-e2e-product-review.md`, and landing `AGENTS.md`.

The capture script (`scripts/capture-blog-ui-screenshots.ts`) calls `ensureLoggedIn`. If you are capturing an old branch that still mounts the retired custom What's New modal, keep its dismissal key in sync with that branch's campaign. Current production Product Updates are Featurebase-owned and do not use the legacy sessionStorage campaign key.

**Troubleshooting:** wrong `BLOG_UI_CAPTURE_BASE_URL` port, mismatched Clerk keys, stale OTP env — fix before re-running.

### Automated capture command
```bash
BLOG_UI_CAPTURE_BASE_URL=http://localhost:8000 bun run capture-blog-ui
```
(Defined in `package.json` → `capture-blog-ui` script.)

Constants: `VIEWPORT` 1600×900, `TABLE_SCREENSHOT_MAX_HEIGHT_PX` (960), `DRAWER_SCREENSHOT_MAX_HEIGHT_PX` (1700), contract drawer env vars for option symbol / underlying (default TSLA).

### Capture output triage
- A missing Rank Symbols Filters button can be an expected warning when that toolbar state does not expose filters; the optional crop should warn and continue.
- If Contract Rank cannot find the default TSLA rows, either set `BLOG_UI_CAPTURE_CONTRACT_UNDERLYING_SYMBOL` to a visible ticker or accept the heuristic fallback only after visually checking the saved drawer.
- If a saved table PNG is very short, mostly blank, or much smaller than prior captures, inspect it immediately and strengthen the route readiness or crop logic before continuing.
- Do not rely on dimensions alone: a 1600px-wide image can still be a spinner frame.
- Always inspect raw screenshots for loading copy, skeletons, progress bars, and spinners before annotating or building. If a screenshot is still loading, fix the capture readiness gate and recapture instead of documenting around it.

### `ROUTE_PLAN` and retired-post sync
`ROUTE_PLAN` in the capture script lists every `/app/...` route and the relative PNG paths (viewport, table, drawer, optional filters).

- Rank Contracts outputs source the Contract-level blog images.
- Rank Symbols outputs source the Symbol-level blog images and the Option Chain Analysis feature-set images.
- Option Chain Analysis-named outputs are duplicated into legacy `gex-screener` paths in the same pass.
- After the loop, `syncRetiredPostScreenshotsFromOptionChainAnalysis()` copies from `option-chain-analysis/images/` into `oi-change-rank` and `volatility-desk` (including `cover.png`).
- If cover copy differs by retired post, run `bun run letter-blog-covers` **after** capture/sync so `oi-change-rank` and `volatility-desk` do not inherit the generic Option Chain Analysis cover.

### Avoid screenshots while loading
Use deterministic waits:
- Session: `waitForAppReady`
- Shell: `waitForDataAppShellIdle`
- Route surface: `waitForRouteSurfaceReady` (first table, specific testids, charts)
- Drawers: hide loading text / aria-busy cycles, fall back to documented no-data/error text or the current deferred-load panel when the product intentionally asks the user to load premium detail.

Current drawer openers:
- Rank Contracts: `contract-flow-drawer-shortcut-flow-*` opens the Flow tab. If no preferred `BLOG_UI_CAPTURE_CONTRACT_UNDERLYING_SYMBOL` rows are visible, the capture script falls back to heuristic rows and may keep the first visible deferred-load drawer.
- Rank Symbols: click the symbol chip button whose aria label starts with `Open symbol drawer`.
- Rank Symbols may not expose a Filters button in every state; missing optional filter crops should warn and continue, not fail the full capture.
- Option Trades readiness must wait for `[data-agent-id="option-trades-filter-view-trigger"]`, `table tbody`, at least one visible `tr td`, and the `Loading table data` overlay to clear before writing table PNGs.

Re-open drawers and re-capture if a saved PNG still shows loading UI.

### Remove blank space
- Tables: `page.screenshot({ fullPage: false, clip: firstTable.boundingBox() })` clamped to max height. Never use `locator.screenshot()` on `<table>` (captures full DOM height → thousands of px).
- If a virtualized table reports only a shallow height (for example just header / rendered window), expand the crop to a useful viewport slice before saving so the PNG includes real rows.
- Drawers: clip `[data-slot="sheet-content"]` (capped height, no full dimmed backdrop).
- After manual `sips` crop/resize, re-run `bun run build:dev`.

### Image quality checks
- No spinner/skeleton text or progress overlays.
- No route-level loading copy such as `Loading Contract-level analysis...`, `Loading ranked contracts...`, or `Loading table data`.
- Drawer images show panel content only.
- Table images are useful top crops (not full scroll).
- Spot-check dimensions with `sips -g pixelWidth -g pixelHeight`.
- Visually inspect at least one representative table and drawer after every capture run, including `option-trades-table-ui.png`, `contract-rank-drawer-ui.png`, and `option-chain-analysis-drawer-ui.png` when those files are regenerated.

### Screenshot annotations
Use annotations when a dense product screenshot needs help explaining the workflow. Keep them instructional, not decorative.

- Annotate only after the raw capture has passed the loading-state check.
- Keep labels short and tied to user-visible product concepts, such as `Session freshness`, `Filters and refresh`, `Ranked contract grid`, or `Option Trades handoff`.
- Do not cover the data the label is explaining. Prefer callout boxes, thin outlines, and leader lines placed over low-information areas.
- If an annotation obscures core table rows, titles, or controls, adjust the callout and regenerate from a clean capture.
- Use `bun run annotate-blog-ui contract-rank` for the current Contract-level analysis callouts after `bun run capture-blog-ui`.
- After annotation, visually inspect the annotated PNGs again and run the normal build verification.

### Content rules
- **EN + zh:** Keep `index.mdx` and `index.zh.mdx` in sync (structure, images, adapted captions).
- **Domain truth:** For product routes, params, and UI naming, read sibling `tradingflow-webapp-fullstack/doc/domain-knowledge/`, plus current route/menu copy in `src/utils/constants.ts`, `src/layouts/mainNav.ts`, and locale strings. Use `awesome-ai-coding-rules/knowledge/basic_concepts.md` and `knowledge/data_schema.md` as shared data-concept references when relevant, but do not treat them as the webapp UI naming authority. If a referenced knowledge path is absent in a checkout, do not fail the run; fall back to the module-specific webapp docs.
- **Links:** Follow static-export rules in `AGENTS.md` (real slugs, no placeholders).

### Featurebase Updates alignment (sibling webapp)
Blog work for a product ship should be coordinated with public changelog and signed-in Featurebase Updates (see below).

After capture/MDX edits:
- For every user-visible release card or product walkthrough refresh, decide whether a matching **Featurebase Update** should be created or refreshed. Featurebase is the signed-in Product Updates source of truth; the landing changelog remains the public source of truth.
- Keep Featurebase Update copy simple and story-level. Do not mirror detailed changelog bullets or explain implementation internals.
- Current webapp contract: `FeaturebaseAppProvider` mounts once at the app root; `FeaturebaseSurfaces` owns the Updates dropdown and unread card; the footer trigger is `data-featurebase-changelog`; Product feedback lives at `/user/product-feedback`; legacy `/app/portal` redirects there.
- Read webapp `doc/domain-knowledge/shared/domain-invariants.md` and `doc/domain-knowledge/shared/functionality.md` under **Product Updates ("What's New")** before changing Product Updates behavior or link policy.
- Read these code surfaces when verifying integration drift: `src/components/Featurebase/FeaturebaseAppProvider.tsx`, `src/components/Featurebase/FeaturebaseSurfaces.tsx`, `src/components/FooterToolbar/index.tsx`, `src/components/GlobalHeader/AvatarDropdown.tsx`, `src/components/Featurebase/FeaturebaseProductFeedbackPage.tsx`, `src/human/appConfigs.ts`, and `src/human/featureFlags.ts`.
- Do **not** add or update `src/config/featureAnnouncement.config.ts`, `src/config/featureAnnouncement.test.ts`, or `public/feature-announcement/*.svg` for current production Product Updates; those belong only to retired/legacy branches that still mount the custom modal.
- Featurebase workspace evidence: current app id is in webapp `APP_CONFIGS.FEATUREBASE_APP_ID`, and the live workspace is documented in `src/human/appConfigs.ts` as `https://tradingflowcom.featurebase.app`.
- If publishing through Featurebase dashboard/API, verify the Update appears from the signed-in app footer **Updates** control and that Featurebase owns unread/read state. Do not add a competing app-side dismissal store.

### Verification (blog)
```bash
bun run letter-blog-covers   # when cover copy/assets changed
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

### How to load this runbook
This lives in `awesome-ai-coding-rules/ops/landingpage/update-blog-posts-and-changelog.md`; when working in the landing repo, reference it as the sibling `../awesome-ai-coding-rules/...` runbook.

### Greenfield invariant
**Exactly one** public changelog source of truth: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`) in the **landing repo**. Signed-in Product Updates are Featurebase-owned. The webapp links to the marketing page for public release notes; it does not own public changelog data.

### Mandatory reads (sibling webapp)
1. Canonical names — Read the relevant webapp `doc/domain-knowledge/<module>/domain-invariants.md` and `functionality.md`, plus `src/utils/constants.ts`, `src/layouts/mainNav.ts`, and current locale/menu strings. Use sibling `awesome-ai-coding-rules/knowledge/basic_concepts.md` and `knowledge/data_schema.md` only as shared data-concept references when needed; they are not the authority for current webapp UI names.
2. `doc/domain-knowledge/shared/domain-invariants.md` and `doc/domain-knowledge/shared/functionality.md` — Only if touching Product Updates, Featurebase, footer update controls, feedback routing, link policy, or URL/new-tab contract.

### Repo map (landing repo)
- Release data: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`, `PRODUCT_CHANGELOG_AREAS`, `PRODUCT_CHANGELOG_SECTION_ORDER`, `Localized<T>`, pick helpers).
- Invariant tests: `src/lib/productChangelog.test.ts`.
- Page UI: `src/components/ProductChangelog.tsx`.
- Route + SEO: `src/app/changelog/page.tsx`.
- UI chrome copy: `src/i18n/translations.ts`.
- Feature gate: `site.config.ts` `features.changelog.enabled`.

Changing only release copy or adding cards usually touches **only** `productChangelog.ts`. Touch UI or `translations.ts` only for presentation/chrome changes.

### Public URL, Featurebase, and webapp links
- Canonical: `https://tradingflow.com/changelog` (static export, trailing slash per site config).
- Webapp public changelog links: `MARKETING_SITE_URL + /changelog` from app surfaces that need the public release ledger. Do **not** reintroduce an in-app `/changelog` route or duplicate the data.
- Signed-in Product Updates: Featurebase Updates dropdown from the fixed footer **Updates** control. Featurebase owns update content, ordering, unread/read state, destination behavior, and the optional non-blocking unread card.
- Product feedback: avatar menu **Product feedback** opens `/user/product-feedback`; legacy `/app/portal` redirects there.

### Scope (what belongs in the changelog)
Only behavior that **shipped** to real users in production (or the intended hosted product).

**Exclude:**
- Local-only routes, dev-only features, CI-only work, pure internal refactors (no user-visible outcome).
- Bullets that read like commit subjects or ticket dumps.
- Docs-only, E2E harness-only, `.cursor`/skills-only, pure `chore:` bumps with no UX change.
- Internal observability renames or doc moves (unless user-visible, e.g. clearer error UI).
- Notebook/wiki-only, SQL/metadata tweaks with no clear user-visible outcome.
- Commit hashes, ticket IDs, branch names, subsystem codenames.

**Prefer to include:** glossary-named surfaces, localization users see, filters/tables/live mode, ranking/lookup behavior, Product Updates / footer UX, real user-visible **Fixed** items.

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
| Product / data-app releases (Option Trades, Option Chain Analysis, Contract-level analysis, Symbol-level analysis, Product Updates / Featurebase, etc.) | `tradingflow-webapp-fullstack` — `origin/main` (or `main`) | Run dated log: `git fetch origin main && git log origin/main --format='%h %ad %s' --date=short -80 --since=YYYY-MM-DD`. |
| Marketing site only (new landing sections, pricing table, SEO, static pages) | `tradingflow-web-landingpage` — `origin/main` | Use when user explicitly wants landing ships or no app change but public site changed materially. |

**Grouping:** Merge commits into one card per ship moment. Pick `publishedAt` as the calendar date of the latest user-visible ship in the cluster.

### Workflow
1. **Gather** — App-facing: dated `git log` on `tradingflow-webapp-fullstack origin/main`. Landing-only: same on `tradingflow-web-landingpage`. Map to glossary surface names.
2. **Flag / rollout check** — Before drafting each candidate bullet, verify it is enabled for the intended production audience, not merely implemented or merged. Check `src/human/featureFlags.ts`, module config helpers, per-user rollout gates such as PostHog flags, and route/access guards. If a feature is off, internal-only, or gated to a narrow rollout, omit it or scope the copy to the enabled audience.
3. **Filter** — Drop non-shipped, non-user-visible noise (see Scope + Git history) and any feature that is implemented but not enabled.
4. **Draft** — Edit `src/lib/productChangelog.ts`: prepend at top of `PRODUCT_CHANGELOG_RELEASES`; keep `id` / `publishedAt` / sort valid. Add both locales when possible.
5. **Featurebase Updates** — After new/updated cards, create or refresh the matching signed-in Featurebase Update unless explicitly deferred with a reason (see “Featurebase Updates sync” below). Do **not** duplicate the releases array into the webapp.
6. **Verify** — `bun test src/lib/productChangelog.test.ts`. After UI/i18n changes also `bun run lint && bun run build:dev`.
7. **Wiki (webapp)** — If you change business-visible policy (page promises, link policy, URL behavior), update the sibling `doc/domain-knowledge/shared/domain-invariants.md` and `doc/domain-knowledge/shared/functionality.md` as applicable (per its `AGENTS.md`).
8. **Webapp locales** — If changing in-app strings that link to changelog, edit webapp `src/locales/*.ts` and run its locale parity checker.

### Featurebase Updates sync (sibling webapp + Featurebase)
After editing `productChangelog.ts`, keep signed-in Product Updates aligned:

1. Read webapp `doc/domain-knowledge/shared/domain-invariants.md` under **Product Updates ("What's New")** and `doc/domain-knowledge/shared/functionality.md` when feature behavior or user-facing copy changes.
2. Draft the matching **Featurebase Update** from the public changelog story:
   - `title` / short body = story-level, not a dense release-note dump.
   - Link to the most useful app route or public blog/changelog page only when it helps the user act.
   - Keep implementation details, commit IDs, branch names, and raw URLs out of user-facing copy.
3. Publish or update the Featurebase Update through the approved Featurebase dashboard/API path for `https://tradingflowcom.featurebase.app`. If you cannot access Featurebase, explicitly report `Featurebase Update deferred` with the blocker.
   - REST reference: `https://docs.featurebase.app/rest-api/changelogs/createchangelog` (`https://do.featurebase.app/v2/changelogs`, `Featurebase-Version: 2026-01-01.nova`).
   - Before creating, query for likely duplicates with `GET /v2/changelogs?state=all&limit=20&q=<short title phrase>`.
   - Use `FEATUREBASE_API_KEY` only from the local shell or exact variable extraction; do not source a full `.env.local` if unrelated unquoted values make it parse-unsafe.
   - Keep REST-created copy short and story-level. `title`, `markdownContent`, `locale`, and `date` are usually enough.
   - `categories` are optional and must already exist in the workspace. Do not assume `Fixed` exists just because the public changelog has a `fixed` section.
   - Verify the create response. If it returns `state: "draft"`, an empty slug, or `isPublished: false`, call `POST /v2/changelogs/{id}/publish` with `{"sendEmail":false,"locales":["en"]}` before reporting publication complete.
   - After publish/update, verify `state: "live"`, `isPublished: true`, `publishedLocales` includes `en`, `emailSentToSubscribers: false`, and the public URL returns HTTP 200.
4. Verify in the app, not only in the dashboard:
   - Signed-in user sees the footer **Updates** control only after Featurebase identity reaches `identified`.
   - The trigger has `data-featurebase-changelog` and opens the Featurebase Updates dropdown.
   - Featurebase owns unread/read state and any non-blocking unread card.
   - Auth, login modal, paywall, and `/app/billing` flows do not receive intrusive update cards.
   - `/user/product-feedback` loads the Featurebase embed or a clear unavailable/error state; `/app/portal` redirects there.
5. If webapp Featurebase integration code changes, run focused checks from `tradingflow-webapp-fullstack`:
   - `pnpm exec vitest run src/components/Featurebase/featurebaseUpdatesContract.test.ts src/components/Featurebase/FeaturebaseAppProvider.test.ts src/components/Featurebase/FeaturebaseProductFeedbackPage.test.ts src/components/Featurebase/featurebaseJsDependency.test.ts src/server/featurebase.test.ts src/server/core/config.test.ts`
   - `pnpm locale:check`
   - `pnpm validate:routes`
   - `pnpm build:test`
   - Browser smoke on a built preview for `/user/product-feedback`, `/app/portal`, and a signed-in footer **Updates** click.
6. Do not update legacy `featureAnnouncement` config/tests/SVG covers for current production Product Updates. Only touch those files when explicitly maintaining an old branch that still mounts the retired modal.

### Runbook self-maintenance
This runbook is part of the workflow. Update it in the same pass when a real run discovers drift.

- At the end of each run, decide whether the run revealed a reusable lesson for future blog/changelog/Featurebase Updates work.
- Promote durable lessons into the relevant workflow section, pasteable instruction, verification command, or anti-pattern list.
- Keep transient next-run state in `Agent Handoff`; keep one-off content decisions, release candidates, screenshot review notes, and current-run blockers in the final report unless they remain unresolved.
- Prune completed or obsolete handoff items before adding new ones.
- If no durable rule changed, state `Runbook maintenance: no change` in the final report.
- Update selectors, route topology, expected warnings, commands, verification steps, and screenshot/annotation rules when the live repos disagree with this document.
- When adding a new helper script or package script, document the command here and in any pasteable agent instruction.
- When blog cover art or cover copy drifts, document the cover-lettering command and acceptance checks; future agents must be able to regenerate covers without manual image editing, and cover acceptance checks should include the current shadcn project style.
- When Featurebase Updates behavior changes, document the app trigger, provider, identity, route, dashboard/API, and verification expectations so future changelog runs do not publish only one release ledger.
- When changing the Product Updates/Featurebase workflow, update both this runbook and the webapp Featurebase docs/tests so the operational contract is executable.
- Keep guidance concrete: include exact file paths, env vars, and acceptance checks. Remove stale references instead of layering contradictory notes.
- Do not use self-maintenance as a reason for broad cleanup; keep runbook edits tied to lessons from the current run.
- Do not update this runbook for one-off changelog copy choices, raw git logs, temporary screenshot artifacts, or completed progress that belongs only in the final handoff.

### Anti-patterns
- Pasting commit subjects as bullets.
- One noisy release per day.
- Raw URLs or “read the docs at …” in bullets (forbidden by tests).
- Duplicate `publishedAt`, wrong sort order, reused `id`.
- Shipping local-only or unreleased features.
- Duplicating `PRODUCT_CHANGELOG_RELEASES` in the webapp (forbidden).
- Publishing a public changelog card while forgetting the matching Featurebase Update.
- Reintroducing the retired custom What's New modal, campaign dismissal store, `featureAnnouncement` config, or `public/feature-announcement` cover workflow for current production updates.
- Writing Featurebase Updates like detailed changelog entries instead of short story-level announcements.
- Duplicating feedback/portal controls in the footer; Product feedback belongs in the avatar menu and `/user/product-feedback`.
- Assuming a Featurebase dashboard update is enough without verifying the signed-in app footer Updates dropdown.
- Treating landing `git` history as default for in-app product bullets (it's mostly marketing/SEO).
- Updating MDX screenshots while leaving `images/cover.png` with obsolete route names, legacy product positioning, or unreadable cover lettering.

### Pasteable agent instruction (combined for blog + changelog)
```text
You are updating TradingFlow’s public blog posts and Product Changelog.

Before editing blog posts (content/posts/**):
- Read the combined skill for audit rules (screenshots, covers, no loading UI, crop/clip rules, retired-post sync via ROUTE_PLAN, EN/zh parity).
- Use `tradingflow-webapp-fullstack` dev server + Clerk dev keys for captures.
- After capture, inspect regenerated screenshots for loading copy/spinners/skeletons before accepting them.
- If using screenshot callouts, annotate only after raw captures are clean and verify the labels do not cover the data.
- Update `images/cover.png` visible short content cue when the post story, route, or retired/merged status changes; run `bun run letter-blog-covers` and inspect changed covers for no brand/title text, legibility, minimal copy, post-specific meaning, and alignment with the landing repo's current shadcn style.
- Coordinate with the public changelog and Featurebase Updates when the post accompanies a product ship.

Before editing the changelog:
1. Read the relevant tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/domain-invariants.md and functionality.md files, plus current route/menu copy in src/utils/constants.ts, src/layouts/mainNav.ts, and locale strings. Use sibling awesome-ai-coding-rules/knowledge/basic_concepts.md and knowledge/data_schema.md only as data-concept references when relevant.
2. Follow the combined update-blog-posts-and-changelog skill (release card shape, scope, Git history guidance for which repo to mine, Featurebase Updates sync).
3. If the task touches Product Updates, Featurebase, feedback routing, footer controls, or link policy, read tradingflow-webapp-fullstack/doc/domain-knowledge/shared/domain-invariants.md and tradingflow-webapp-fullstack/doc/domain-knowledge/shared/functionality.md.

Implementation:
- Blog: edit MDX + images under content/posts; run capture-blog-ui when needed; keep covers in images/cover.png; sync retired posts from Option Chain Analysis when appropriate, then run letter-blog-covers if cover copy should differ by post.
- Screenshots: fix readiness gates and recapture if any PNG shows loading; for dense Contract-level analysis screenshots, run `bun run annotate-blog-ui contract-rank` after clean capture.
- Changelog: edit ONLY src/lib/productChangelog.ts (prepend to PRODUCT_CHANGELOG_RELEASES). Use newest-first, unique id, YYYY-MM-DD publishedAt, optional area, sections new|improved|fixed as Localized<string[]>, at least one bullet total, no http(s) in bullets, omit empty sections.
- For “update from main”: default to git log on tradingflow-webapp-fullstack origin/main for product ships; use landing main only for pure marketing ships. Cluster into meaningful cards.
- Before announcing a feature, verify it is enabled for the intended production audience via feature flags, PostHog rollout gates, route guards, and access gates; do not announce implemented-but-disabled work.
- After new release cards or blog ships that affect Product Updates: create or refresh the matching Featurebase Update in the TradingFlow Featurebase workspace, or explicitly defer it with the access/blocker. Do not edit retired featureAnnouncement config/tests/SVG covers unless maintaining a legacy branch that still mounts the old modal.
- If the run reveals drift in these instructions, update this runbook in the same pass with the exact selector, command, warning, or acceptance check.
- After blog MDX/image changes: run `bun run letter-blog-covers` when cover copy/assets changed, then `bun run lint && bun run build:dev` (or build for prod hashes).
- After changelog changes: cd tradingflow-web-landingpage && bun test src/lib/productChangelog.test.ts; then verify the signed-in Featurebase Updates dropdown or report why Featurebase publication/verification was deferred.
- If webapp Featurebase integration code changes: from tradingflow-webapp-fullstack run the focused Featurebase vitest set, `pnpm locale:check`, `pnpm validate:routes`, `pnpm build:test`, and browser smoke `/user/product-feedback`, `/app/portal`, and the footer Updates trigger.

Verify both:
- Blog: lint + build:dev (plus build when hashes matter).
- Changelog: the productChangelog test + Featurebase Update publication/verification, or a clear deferred reason.
```
