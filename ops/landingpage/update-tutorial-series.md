---
name: update-tutorial-series
description: Creates and updates the bilingual TradingFlow tutorial SERIES under content/series/tradingflow-docs (page-based how-to chapters for non-technical webapp users, with annotated screenshots, Mermaid diagrams, and cross-links). Covers series structure (flat NN-slug.mdx + .zh.mdx + index posts array), the critical series image-path rule, screenshot reuse/annotation, content sourcing from the webapp domain-knowledge docs, build/image verification, and deploy. Use when reorganizing or adding tutorial chapters, wiring screenshots/diagrams into the series, or fixing broken series images. NOT for content/posts/** blog posts or the changelog — use update-blog-posts-and-changelog.md for those.
---

# Update the TradingFlow Tutorial Series (landing)

This runbook maintains the **tutorial series** at `content/series/tradingflow-docs/` in `tradingflow-web-landingpage`. The series is page-based, task-oriented documentation for a **webapp end user (a trader) who does not know engineering** — distinct from the marketing blog posts (`content/posts/**`, owned by [`update-blog-posts-and-changelog.md`](./update-blog-posts-and-changelog.md)). It shares that runbook's screenshot capture/annotation pipeline but differs in structure and, critically, in how image paths must be written.

## Recommended Invocation

Use `/goal` for create/reorganize/refresh runs:

- Objective: produce or update the requested tutorial chapter(s) — bilingual (EN + zh), with annotated screenshots, Mermaid diagrams, and cross-links — matching the current webapp surfaces.
- Success criteria: worktrees checked before edits; chapters use the **absolute** series image path rule; `index.mdx`/`index.zh.mdx` `posts:` order is correct; EN/zh parity holds; cross-links resolve to real slugs; a **full** `bun run build` confirms every chapter image resolves to a file that exists in `out/`.
- Stop condition: all requested chapters pass verification, or a blocker names the exact missing repo access, login, screenshot, locale, or build failure.

Keep the run read-only with respect to production: do **not** run `bun run deploy` unless the user explicitly authorizes the publish.

## Agent Handoff

Last updated: 2026-06-19

The series was reorganized from the old concept-only chapters into **page-based chapters `00`–`09`** (Getting Started, Why TradingFlow, The Data Feed, Option Trades, Rank: Contracts, Rank: Symbols, Watchlists & Filters, then concept chapters Options & Flow / Greeks & GEX / Option Chain & OI). EN + zh for each, plus bilingual `index`. Old-slug chapters were deleted in the same change.

Key durable lesson from that run, now encoded below: **relative `./images/...` does NOT work in flat series chapters** — they 404 in production. Use the absolute `/blogs/tradingflow-docs/images/<file>.png` form. A reusable annotation script `scripts/annotate-series-screenshots.ts` was added (idempotent). No open handoff items; if production still shows old content/broken images, the remaining action is `bun run deploy` (operator-authorized).

## When to use

- Creating, reorganizing, renumbering, or refreshing chapters under `content/series/tradingflow-docs/**`.
- Wiring screenshots, annotations, or Mermaid diagrams into series chapters.
- Fixing broken/404 images on `tradingflow.com/series/tradingflow-docs/...`.
- Keeping the series aligned with current webapp surfaces (Option Trades, Rank Contracts/Symbols).

Do **not** use for `content/posts/**` blogs, `src/lib/productChangelog.ts`, or What's New — those are the blog/changelog runbook.

## Repo map

Target checkout: `../tradingflow-web-landingpage` when opened from `awesome-ai-coding-rules`.

- **Series dir:** `content/series/tradingflow-docs/`
  - `index.mdx` + `index.zh.mdx` — series metadata. `posts: [...]` (with `sort: "manual"`) controls **chapter order**; it is the list of chapter slugs.
  - Chapters are **flat files**: `NN-slug.mdx` and `NN-slug.zh.mdx` (e.g. `03-option-trades.mdx`).
  - `images/` — one shared image folder at the series level (co-located assets).
- **Rendering:** `react-markdown` in `src/components/MarkdownRenderer.tsx`; images go through `next-image-export-optimizer` (`<ExportedImage>`) and `src/lib/rehype-image-metadata.ts` (rewrites image `src`, adds dimensions). External (`http`/`//`) and absolute (`/...`) srcs are passed through; only `./` and bare-relative srcs are rewritten against the page slug.
- **Asset copy:** `scripts/copy-assets.ts` `processSeries()` copies the shared `images/` folder to `public/<postsBasePath>/<chapter-slug>/images/` for every chapter file **and** to `public/<postsBasePath>/<series-slug>/images/` for `index.*`. `postsBasePath` = `site.config.ts` `posts.basePath` (currently `blogs`); series slug = `tradingflow-docs`.
- **Screenshot capture:** `scripts/capture-blog-ui-screenshots.ts` (Playwright vs the sibling webapp dev server) — writes into `content/posts/<feature>/images/`. See the blog runbook for the full capture workflow, login fixtures, readiness gates, and crop/clip rules. Current routes captured: `/app/option-trades`, `/app/rank/contracts`, `/app/rank/symbols`.
- **Series annotation:** `scripts/annotate-series-screenshots.ts` — bakes numbered callouts onto series images (see Annotation below).
- **Content source of truth (sibling webapp):** `tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/functionality.md` (what each surface does) and `.../domain-invariants.md` (the rules, e.g. freemium boundaries) for `option-trades`, `rank`, `shared`; plus `doc/knowledge/glossary.md` for canonical names. These are already at non-technical altitude — quote/condense them; do not paste engineering internals.

### Current webapp surfaces the series covers
- **Option Trades:** `https://app.tradingflow.com/app/option-trades` (Live + Historical tabs).
- **Rank workbench:** `/app/rank/contracts` and `/app/rank/symbols`. The retired standalone tools (Option Chain Analysis, Market Rank, Contract Rank, GEX Screener, OI Change Rank, Volatility Desk) are **consolidated into Rank** — do not document them as separate pages.

### Preflight safety
```bash
git -C ../tradingflow-web-landingpage status --short
git -C ../tradingflow-webapp-fullstack status --short
```
Treat unrelated modified/deleted/untracked files as user work; do not revert. Scope edits to the series, its images, the annotation script, and this runbook.

## CRITICAL: series image paths (read before embedding any image)

**Rule: in series chapter MDX, reference images with the ABSOLUTE path**
```md
![alt text](/blogs/tradingflow-docs/images/<file>.png)
```
**NOT** the relative `![alt](./images/<file>.png)` form that posts use.

**Why:** A series chapter page renders at the route `/series/tradingflow-docs/<chapter>/`, so the renderer rewrites a relative `./images/x.png` to `/series/tradingflow-docs/<chapter>/images/x.png`. But `copy-assets.ts` stores series assets (and the image optimizer generates the `.WEBP` variants) under `/<postsBasePath>/...` = `/blogs/...`. For nested **posts** these align (post route base is `/blogs/<slug>`), so relative paths work there. For **flat series chapters** they diverge, and every relative image 404s in production. The absolute `/blogs/tradingflow-docs/images/<file>.png` path is uniform across all chapters (it is the `index`-derived shared copy), passes through the rehype rewrite untouched, and is where the optimizer emits variants.

If you ever see broken series images, this mismatch is the first thing to check (`grep -rn '](\./images/' content/series/tradingflow-docs/*.mdx`). Fix:
```bash
perl -pi -e 's{\]\(\./images/}{](/blogs/tradingflow-docs/images/}g' content/series/tradingflow-docs/*.mdx
```
(If `posts.basePath` or the series slug ever change, update the absolute prefix accordingly.)

## Workflow

1. **Preflight** — run the worktree status checks above; read the webapp `doc/domain-knowledge` + glossary for the surfaces in scope.
2. **Plan structure** — decide the chapter set and order. Keep page tutorials and concept chapters separate; have page chapters **link** to concept chapters instead of redefining DEX/GEX/OI/Greeks/sentiment. Update `index.mdx` + `index.zh.mdx` `posts: [...]` to the exact slug order. Categories used: `Getting Started`, `Using TradingFlow`, `Concepts` (localize in the `.zh` file).
3. **Screenshots** — prefer **reusing** current screenshots already produced by the capture script under `content/posts/<feature>/images/` (option-trades, contract-rank = Rank Contracts, market-rank = Rank Symbols). Copy the ones you need into `content/series/tradingflow-docs/images/` with clean names. Re-capture only if images are stale or show loading frames — that requires the local webapp + the capture pipeline in the blog runbook (browser MCP cannot write files into the repo; `chrome-devtools` needs Chrome started with remote-debugging, so the Playwright `capture-blog-ui` script is the reliable path). Verify currency by spot-checking a screenshot against the live app.
4. **Annotate** — bake numbered callouts with `scripts/annotate-series-screenshots.ts`. It is **idempotent**: each entry re-copies its raw `src` then composites an SVG overlay, so you can re-run after tweaking coordinates without double-annotating. Each callout is `{ label, labelBox{x,y,w,h}, target{x,y,w,h} }` in image pixels (heroes are 1600×900). Run `bun scripts/annotate-series-screenshots.ts`, then **view each output** and adjust coordinates. The numbered legend you write in the MDX **must match the baked callout order** top-to-bottom; if you reorder one, reorder the other.
5. **Write chapters (bilingual)** — for each chapter write `NN-slug.mdx` and `NN-slug.zh.mdx`:
   - Frontmatter: `title`, `date` (today), `excerpt`, `category`, `tags`, `authors: ["TradingFlow Team"]` (localize title/excerpt/category in `.zh`).
   - Non-technical voice; embed annotated screenshots (absolute path rule) each with an italic caption and, for annotated images, a numbered legend.
   - Add Mermaid diagrams as fenced ```mermaid blocks (decision trees like "which tool/mode when", row anatomy, discovery→inspect→handoff journeys). Prefer a diagram over a wall of text.
   - Cross-link siblings as `/series/tradingflow-docs/<slug>`; link the live app as full `https://app.tradingflow.com/app/...`. State freemium boundaries plainly ("this is a paid feature").
   - Keep `.zh` a faithful translation mirroring structure, images, links, and diagrams.
6. **Clean up** — when renumbering/replacing, delete superseded old-slug files (EN + zh) in the same change; confirm no content was silently lost.
7. **Verify** (next section).
8. **Deploy** — only on explicit authorization (see Deploy).

## Verification

```bash
cd ../tradingflow-web-landingpage
bun run lint
bun run build:dev          # validates frontmatter (Zod) + MDX parse; FAST but SKIPS image optimization
bun run build              # FULL build: runs copy-assets + image optimizer — REQUIRED to verify images
```

`build:dev` alone is **not enough** to catch broken images: it skips optimization, so the `.WEBP` variants the HTML references are never generated. You must run the full `bun run build` and then confirm the rendered `src` matches a file that exists:

```bash
# 1) what src does a chapter request?
grep -oE 'src="[^"]*ot-live[^"]*"' out/series/tradingflow-docs/03-option-trades/index.html | head -1
#    expect: /blogs/tradingflow-docs/images/nextImageExportOptimizer/ot-live-opt-3840.WEBP

# 2) does that file (and the PNG fallback) exist?
ls out/blogs/tradingflow-docs/images/nextImageExportOptimizer/ot-live-opt-3840.WEBP
ls out/blogs/tradingflow-docs/images/ot-live.png
```

Also confirm: every `![](...)` in the chapters resolves (no remaining `./images/`); each EN chapter has a `.zh` sibling; cross-links use real slugs from the `posts:` array; Mermaid blocks are well-formed (they render client-side, so the build won't catch syntax errors — eyeball them). The zh content reuses the same absolute image paths, so it resolves once EN does.

## Deploy

Production (`tradingflow.com`) is a static export served via rsync. A local build does **not** update production. To publish:
```bash
bun run deploy            # rsync out/ to the server using .env creds — OPERATOR-AUTHORIZED ONLY
```
Do not run this on your own. Either ask the user to confirm, or have them run `!bun run deploy`. If they report production still shows old content/broken images after a fix, a stale deploy is the likely cause.

## Troubleshooting

- **Images broken / 404 in production** → the relative-vs-absolute path mismatch above. Grep for `](./images/` in the series and convert to `/blogs/tradingflow-docs/images/...`; full-build-verify; redeploy.
- **Image referenced but `nextImageExportOptimizer/...WEBP` missing in `out/`** → you only ran `build:dev` (no optimization) or the PNG isn't under `public/blogs/tradingflow-docs/images/`. Run full `bun run build`; confirm `copy-assets` ran and the source PNG exists.
- **Screenshot shows a spinner/skeleton/"Loading…"** → do not ship it; fix the capture readiness gate and recapture per the blog runbook, then re-copy + re-annotate.
- **Annotation legend numbers don't match the image** → the MDX legend order disagrees with the baked callout order; align one to the other and re-run `annotate-series-screenshots.ts`.
- **Chapter doesn't appear / wrong order** → check it's listed in `index.mdx`/`index.zh.mdx` `posts:` and the slug matches the filename.

## Anti-patterns

- Relative `./images/...` in a series chapter (works for posts, breaks the series).
- Verifying images with `build:dev` only (skips optimization — false green).
- Deploying without explicit authorization.
- Re-explaining DEX/GEX/OI/Greeks in every chapter instead of linking the concept chapter.
- Engineering detail (file paths, code, SQL, internals) in user-facing tutorials.
- EN updated without the matching `.zh` (or vice versa).
- Documenting retired standalone tools as if they were still separate pages.
- Annotations that cover the data they describe, or a legend whose numbers don't match the baked callouts.

## Runbook self-maintenance

This runbook is part of the workflow; update it in the same pass when a real run finds drift.

- Promote durable lessons (path rules, commands, verification, anti-patterns) into the relevant section; keep transient next-run state in `Agent Handoff` and one-off decisions in the final report.
- Update the image-path rule if `posts.basePath`, the series slug, or the renderer/copy-assets behavior changes.
- Keep the screenshot capture/login details in the blog runbook and reference them here; do not fork a second copy.
- Prune completed handoff items in the edit that confirms they're done. If nothing durable changed, state `Runbook maintenance: no change` in the final report.

## Pasteable agent instruction
```text
You are creating/updating TradingFlow's tutorial SERIES at content/series/tradingflow-docs/
(audience: non-technical webapp traders). Follow ops/landingpage/update-tutorial-series.md.

Before editing:
- git status the landing + webapp worktrees; don't revert unrelated changes.
- Read the source of truth in tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/
  functionality.md + domain-invariants.md (option-trades, rank, shared) and doc/knowledge/glossary.md.

Structure:
- Flat chapters NN-slug.mdx + NN-slug.zh.mdx; order via index.mdx/index.zh.mdx `posts: [...]`.
- Page tutorials link to concept chapters; don't redefine DEX/GEX/OI/Greeks/sentiment.

CRITICAL image rule: in series chapters embed images as ABSOLUTE
  ![alt](/blogs/tradingflow-docs/images/<file>.png)
NEVER relative ./images/... (flat series pages render at /series/... but assets live at /blogs/... → 404).

Screenshots: reuse current ones from content/posts/<feature>/images (option-trades, contract-rank,
market-rank), copy into content/series/tradingflow-docs/images/. Recapture only via the
capture-blog-ui pipeline (blog runbook) if stale/loading. Annotate with
`bun scripts/annotate-series-screenshots.ts` (idempotent); view outputs; make the MDX numbered
legend match the baked callout order.

Content: bilingual EN+zh parity; Mermaid fenced blocks; cross-link siblings as
/series/tradingflow-docs/<slug> and the app as https://app.tradingflow.com/app/...; state paid
boundaries plainly; no engineering internals. Delete superseded old-slug files when renumbering.

Verify: bun run lint && bun run build:dev (frontmatter/MDX) THEN bun run build (full, for images).
Confirm a chapter's <img> src points to /blogs/tradingflow-docs/images/nextImageExportOptimizer/*.WEBP
AND that file + the .png fallback exist in out/. No remaining ./images/ refs.

Deploy: bun run deploy ONLY if the user authorizes it (production is a static rsync; local build
doesn't update prod).

If the run reveals drift, update this runbook in the same pass with the exact command/path/check.
```
