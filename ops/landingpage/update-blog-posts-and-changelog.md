---
name: update-blog-posts-and-changelog
description: Maintains TradingFlow landing-page blog posts (MDX under content/posts with covers, screenshots via capture-blog-ui) and the Product Changelog (src/lib/productChangelog.ts release cards, What's New sync). Covers UI capture workflow, ROUTE_PLAN + retired-post sync, EN/zh parity, changelog card shape/tests, glossary alignment, and cross-sync between blog ships and in-app carousel. Use when editing blog posts, refreshing data-app screenshots, adding/editing changelog releases, shipping user-visible product notes, or coordinating What's New after product updates.
---

# Update Blog Posts and Product Changelog (TradingFlow landing)

This combined skill covers maintenance of two closely related areas on the marketing site: the bilingual blog posts and the public Product Changelog. They frequently intersect during product ships (blog post + changelog card + What's New carousel slide).

## Recommended Invocation

Use `/goal` for product-ship or content-refresh runs:

- Objective: update the requested blog posts, screenshots, changelog releases, and What's New sync without drifting from the current product contract.
- Success criteria: involved worktrees are checked before edits, screenshots/covers/changelog cards are verified with the documented commands, sibling webapp What's New sync is handled or explicitly deferred, and this runbook is updated for reusable drift.
- Stop condition: all requested content artifacts pass verification, or a blocker identifies the exact missing repo access, login, screenshot, locale, or test condition.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items after the latest maintenance sweep. This was a documentation normalization only; no blog, changelog, screenshot, or What's New work was executed.

## When to use

Use this skill when:
- Changing `content/posts/**` (copy, screenshots, covers, cross-links, or verifying no loading spinners / bad images).
- Adding, editing, or reordering release cards in the public changelog.
- The user mentions `/changelog`, `tradingflow.com/changelog`, `PRODUCT_CHANGELOG_RELEASES`, product release notes, or blog UI captures.
- You need to keep blog screenshots and changelog / What's New in sync after a product ship.

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

**Important invariant:** The single source of truth for release data is **the landing repo** (`tradingflow-web-landingpage`). The webapp (`tradingflow-webapp-fullstack`) only links to `${MARKETING_SITE_URL}/changelog` and does not duplicate `PRODUCT_CHANGELOG_RELEASES`.

### Current app route topology
- **Rank workbench:** `/app/rank`
- **Contract-level analysis:** `/app/rank/contracts`; legacy `/app/contract-rank` redirects here.
- **Symbol-level analysis:** `/app/rank/symbols`; legacy `/app/market-rank` and `/app/symbol-level` redirect here.
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
- Keep intended edits scoped to the landing repo, the webapp What's New config/tests, and this runbook unless the product/docs contract requires more.

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

The capture script (`scripts/capture-blog-ui-screenshots.ts`) calls `ensureLoggedIn`, seeds `sessionStorage` for feature announcements (default campaign `2026-06-rank-workbench`, overridable via `BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID`), and handles What's New dismissal.

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
- **Domain truth:** For product routes/params/naming, read sibling `tradingflow-webapp-fullstack/doc/domain-knowledge/` and glossary first.
- **Links:** Follow static-export rules in `AGENTS.md` (real slugs, no placeholders).

### What's New alignment (sibling webapp)
Blog work for a product ship should be coordinated with changelog / What's New updates (see below).

After capture/MDX edits:
- If a post slug is in an active slide’s `postPath`, refresh the slide’s `body` and confirm `postPath`.
- For every user-visible release card or product walkthrough refresh, check `tradingflow-webapp-fullstack/src/config/featureAnnouncement.config.ts`. The modal should either be updated or explicitly left unchanged with a reason.
- What's New cards are intentionally non-disruptive: each card expires seven calendar days after `publishedAt`; if all cards are expired, the modal must not pop up.
- Keep modal card copy simple and story-level. Do not mirror detailed changelog bullets or explain implementation internals in the modal.
- If cover art under `public/feature-announcement/` changed, bump cache-bust in webapp `src/components/FeatureAnnouncement/coverRegistry.tsx`.
- Per-slide expiry and mapping rules live in webapp `doc/domain-knowledge/domain-invariants/platform.md` under **Feature Announcements ("What's New")** and the changelog skill’s “What's New sync” section.
- If `FEATURE_ANNOUNCEMENT.campaignId` changes, update the capture script default and `AGENTS.md`.
- Add or update `src/config/featureAnnouncement.test.ts` assertions when the active campaign, route links, post links, expiry, or modal copy contract changes.

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

### How to load this runbook
This lives in `awesome-ai-coding-rules/ops/landingpage/update-blog-posts-and-changelog.md`; when working in the landing repo, reference it as the sibling `../awesome-ai-coding-rules/...` runbook.

### Greenfield invariant
**Exactly one** changelog source of truth: `src/lib/productChangelog.ts` (`PRODUCT_CHANGELOG_RELEASES`) in the **landing repo**. The webapp links to the marketing page; it does not own the data.

### Mandatory reads (sibling webapp)
1. `doc/knowledge/glossary.md` — Use canonical surface names (Option Trades, Contract-level analysis, Option Chain Analysis, etc.). Do not invent alternate labels.
2. `doc/domain-knowledge/domain-invariants/platform.md` — Only if touching What’s New behavior, footer/modal link policy, or URL/new-tab contract.

### Repo map (landing repo)
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
1. **Gather** — App-facing: dated `git log` on `tradingflow-webapp-fullstack origin/main`. Landing-only: same on `tradingflow-web-landingpage`. Map to glossary surface names.
2. **Filter** — Drop non-shipped, non-user-visible noise (see Scope + Git history).
3. **Draft** — Edit `src/lib/productChangelog.ts`: prepend at top of `PRODUCT_CHANGELOG_RELEASES`; keep `id` / `publishedAt` / sort valid. Add both locales when possible.
4. **What's New (webapp)** — After new/updated cards, sync the in-app carousel in `tradingflow-webapp-fullstack/src/config/featureAnnouncement.config.ts` (see “What's New sync” below). Do **not** duplicate the releases array into the webapp.
5. **Verify** — `bun test src/lib/productChangelog.test.ts`. After UI/i18n changes also `bun run lint && bun run build:dev`.
6. **Wiki (webapp)** — If you change business-visible policy (page promises, link policy, URL behavior), update the sibling `doc/domain-knowledge/domain-invariants/platform.md` (per its `AGENTS.md`).
7. **Webapp locales** — If changing in-app strings that link to changelog, edit webapp `src/locales/*.ts` and run its locale parity checker.

### What's New sync (sibling webapp)
After editing `productChangelog.ts`, keep the in-app carousel aligned:

1. Read webapp `doc/domain-knowledge/domain-invariants/platform.md` under **Feature Announcements ("What's New")**.
2. Edit `src/config/featureAnnouncement.config.ts` — for each new/materially updated release still inside the seven-day What's New window, add/update a slide:
   - `publishedAt` = changelog `publishedAt`
   - `activeUntilIso` = `buildSlideActiveUntilIso(publishedAt)` (7-day TTL; exclusive end)
   - `title` / `body` = short, story-level carousel copy. Use glossary names, but do not copy detailed changelog bullets.
   - `coverId`, `linkHref`, optional `postPath` / `postLabel` from the mapping table (see original skill for details; areas map to specific covers and routes).
3. Delete slide rows whose `activeUntilIso` is in the past. If all slides are expired, leave the active slide set empty so the modal does not pop up.
4. Bump `campaignId` when the active slide set changes; extend `showUntilIso` and update any tests that assert the global expiry date.
5. Verify: `pnpm exec vitest run src/config/featureAnnouncement.test.ts` (in webapp).
6. If `campaignId` changed, update landing `scripts/capture-blog-ui-screenshots.ts` default `BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID` and [AGENTS.md].

### Runbook self-maintenance
This runbook is part of the workflow. Update it in the same pass when a real run discovers drift.

- At the end of each run, decide whether the run revealed a reusable lesson for future blog/changelog/What's New work.
- Promote durable lessons into the relevant workflow section, pasteable instruction, verification command, or anti-pattern list.
- Keep transient next-run state in `Agent Handoff`; keep one-off content decisions, release candidates, screenshot review notes, and current-run blockers in the final report unless they remain unresolved.
- Prune completed or obsolete handoff items before adding new ones.
- If no durable rule changed, state `Runbook maintenance: no change` in the final report.
- Update selectors, route topology, expected warnings, commands, verification steps, and screenshot/annotation rules when the live repos disagree with this document.
- When adding a new helper script or package script, document the command here and in any pasteable agent instruction.
- When changing the What's New modal workflow, update both this runbook and the webapp `featureAnnouncement` tests so the operational contract is executable.
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
- Adding What's New slides without proper `activeUntilIso` or leaving stale expired rows.
- Writing What's New cards like detailed changelog entries instead of short story-level announcements.
- Forgetting to bump `campaignId`.
- Treating landing `git` history as default for in-app product bullets (it's mostly marketing/SEO).

### Pasteable agent instruction (combined for blog + changelog)
```text
You are updating TradingFlow’s public blog posts and Product Changelog.

Before editing blog posts (content/posts/**):
- Read the combined skill for audit rules (screenshots, covers, no loading UI, crop/clip rules, retired-post sync via ROUTE_PLAN, EN/zh parity).
- Use `tradingflow-webapp-fullstack` dev server + Clerk dev keys for captures.
- After capture, inspect regenerated screenshots for loading copy/spinners/skeletons before accepting them.
- If using screenshot callouts, annotate only after raw captures are clean and verify the labels do not cover the data.
- Coordinate with changelog / What's New when the post accompanies a product ship.

Before editing the changelog:
1. Read tradingflow-webapp-fullstack/doc/knowledge/glossary.md for canonical surface names.
2. Follow the combined update-blog-posts-and-changelog skill (release card shape, scope, Git history guidance for which repo to mine, What's New sync).
3. If the task touches What’s New or link policy, read tradingflow-webapp-fullstack/doc/domain-knowledge/domain-invariants/platform.md.

Implementation:
- Blog: edit MDX + images under content/posts; run capture-blog-ui when needed; keep covers in images/cover.png; sync retired posts from Option Chain Analysis when appropriate.
- Screenshots: fix readiness gates and recapture if any PNG shows loading; for dense Contract-level analysis screenshots, run `bun run annotate-blog-ui contract-rank` after clean capture.
- Changelog: edit ONLY src/lib/productChangelog.ts (prepend to PRODUCT_CHANGELOG_RELEASES). Use newest-first, unique id, YYYY-MM-DD publishedAt, optional area, sections new|improved|fixed as Localized<string[]>, at least one bullet total, no http(s) in bullets, omit empty sections.
- For “update from main”: default to git log on tradingflow-webapp-fullstack origin/main for product ships; use landing main only for pure marketing ships. Cluster into meaningful cards.
- After new release cards or blog ships that affect What's New: sync slides in webapp featureAnnouncement.config.ts, update featureAnnouncement.test.ts, bump campaignId, update capture script default if needed.
- If the run reveals drift in these instructions, update this runbook in the same pass with the exact selector, command, warning, or acceptance check.
- After blog MDX/image changes: bun run lint && bun run build:dev (or build for prod hashes).
- After changelog changes: cd tradingflow-web-landingpage && bun test src/lib/productChangelog.test.ts; then in webapp run the featureAnnouncement test.

Verify both:
- Blog: lint + build:dev (plus build when hashes matter).
- Changelog: the productChangelog test + webapp featureAnnouncement test.
```
