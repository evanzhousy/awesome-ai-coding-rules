---
name: update-tutorial-series
description: Creates and updates the bilingual TradingFlow tutorial SERIES under content/series/tradingflow-docs (page-based how-to chapters for non-technical webapp users, with annotated screenshots, Mermaid diagrams, cross-links, AND branded tutorial videos). Covers series structure (flat clean-slug .mdx + .zh.mdx + index posts array), the critical series image-path rule, screenshot reuse/annotation, content sourcing from this ops repo's knowledge docs plus the webapp domain-knowledge docs, financial-university-teacher review for freshman/newbie readers, build/image verification, deploy, AND the video pipeline: HyperFrames compositions with the TradingFlow logo, local Kokoro voiceover, burned-in bilingual (EN+中文) subtitles, embedding videos in posts, and hosting them on Cloudflare R2. Use when reorganizing or adding tutorial chapters, wiring screenshots/diagrams/videos into the series, fixing broken series images, or producing/uploading tutorial videos. NOT for content/posts/** blog posts or the changelog — use update-blog-posts-and-changelog.md for those.
---

# Update the TradingFlow Tutorial Series (landing)

This runbook maintains the **tutorial series** at `content/series/tradingflow-docs/` in `tradingflow-web-landingpage`. The series is page-based, task-oriented documentation for a **webapp end user (a trader) who does not know engineering** — distinct from the marketing blog posts (`content/posts/**`, owned by [`update-blog-posts-and-changelog.md`](./update-blog-posts-and-changelog.md)). It shares that runbook's screenshot capture/annotation pipeline but differs in structure and, critically, in how image paths must be written.

**Public URLs:** chapters are served at **`/learn/<topic>`** (clean slug, no `NN-` prefix) — e.g. `/learn/option-trades`. Content still lives in `content/series/tradingflow-docs/` and images still live under `/blogs/tradingflow-docs/`; only the *page URL* changed (via `series.routeBases`). See **URL scheme & routing** below.

## Recommended Invocation

Use `/goal` for create/reorganize/refresh runs:

- Objective: produce or update the requested tutorial chapter(s) — bilingual (EN + zh), with annotated screenshots, Mermaid diagrams, and cross-links — matching the current webapp surfaces and teaching TradingFlow functionality plus TradingFlow methodology for freshman/newbie finance readers.
- Success criteria: worktrees checked before edits; `knowledge/*.md` and relevant webapp `doc/domain-knowledge/**` files read; chapters use the **absolute** series image path rule; `index.mdx`/`index.zh.mdx` `posts:` order is correct; EN/zh parity holds; cross-links resolve to real slugs; the **Financial University Teacher Review** checklist passes; a **full** `bun run build` confirms every chapter image resolves to a file that exists in `out/`.
- Stop condition: all requested chapters pass verification, or a blocker names the exact missing repo access, login, screenshot, locale, or build failure.

Keep the run read-only with respect to production: do **not** run `bun run deploy` unless the user explicitly authorizes the publish.

## Agent Handoff

Last updated: 2026-06-22

The series is **10 page-based chapters** (Getting Started, Why TradingFlow, The Data Feed, Option Trades, Rank: Contracts, Rank: Symbols, Watchlists & Filters, then concept chapters Options & Flow / Greeks & GEX / Option Chain & OI). EN + zh each, plus bilingual `index`. **Served at `/learn/<slug>`** (clean slugs; content dir still `content/series/tradingflow-docs/`).

Durable lessons encoded below:
- **URL scheme `/learn`** — chapters moved off `/series/tradingflow-docs/NN-slug` to `/learn/<slug>` via `series.routeBases` + dedicated `src/app/learn/*` routes; old paths 301 in `nginx.conf.example` + `netlify.toml`. See **URL scheme & routing**.
- **Relative `./images/...` does NOT work in flat series chapters** — they 404 in production. Use the absolute `/blogs/tradingflow-docs/images/<file>.png` form. Annotation script: `scripts/annotate-series-screenshots.ts` (idempotent).
- **Pedagogy/source pass** — when refreshing tutorial copy, read this ops repo's `knowledge/*.md` first for product-facing concepts/data vocabulary, then the sibling webapp `doc/domain-knowledge/**` files for current UI contracts. Review like a financial-university teacher writing for freshman/newbie students: define terms before use, avoid assumed market knowledge, separate evidence from interpretation, and teach a repeatable discover → inspect → validate → freshness-check research method.
- **Tutorial videos** — all 11 (overview + 10 chapters) carry TradingFlow logo + English voiceover + burned-in **bilingual (EN+中文) subtitles**, show the `/learn` URL in the CTA, are embedded in every post (`<video>` → `/videos/tutorials/<NN-slug>.mp4`), and are uploaded to R2 bucket `tradingflow-media`. See **Tutorial videos** + **Cloudflare R2**.

Open handoff items: (1) **Deploy:** `bun run deploy` (operator) — and apply the `nginx.conf.example` 301s to the LIVE server in the same deploy, or old `/series/*` URLs 404. (2) **R2 public access** NOT yet enabled — when the owner flips it on and gives a base URL, rewrite post `<video src>`/`poster` to `https://<base>/videos/tutorials/...` and delete `public/videos/`.

## When to use

- Creating, reorganizing, renumbering, or refreshing chapters under `content/series/tradingflow-docs/**`.
- Wiring screenshots, annotations, or Mermaid diagrams into series chapters.
- Fixing broken/404 images on `tradingflow.com/learn/...`.
- Keeping the series aligned with current webapp surfaces (Option Trades, Rank Contracts/Symbols).
- Producing or updating **tutorial videos** (HyperFrames composition, logo, voiceover, bilingual subtitles), embedding them in posts, or hosting them on **Cloudflare R2**.

Do **not** use for `content/posts/**` blogs, `src/lib/productChangelog.ts`, or What's New — those are the blog/changelog runbook.

## Repo map

Target checkout: `../tradingflow-web-landingpage` when opened from `awesome-ai-coding-rules`.

- **Series dir:** `content/series/tradingflow-docs/`
  - `index.mdx` + `index.zh.mdx` — series metadata. `posts: [...]` (with `sort: "manual"`) controls **chapter order**; it is the list of chapter slugs.
  - Chapters are **flat files**: `slug.mdx` and `slug.zh.mdx` (e.g. `option-trades.mdx`). The slug is clean (no `NN-` prefix) and **is** the URL: `/learn/<slug>`. Order comes from the `posts:` array, not the filename.
  - `images/` — one shared image folder at the series level (co-located assets).
- **Rendering:** `react-markdown` in `src/components/MarkdownRenderer.tsx`; images go through `next-image-export-optimizer` (`<ExportedImage>`) and `src/lib/rehype-image-metadata.ts` (rewrites image `src`, adds dimensions). External (`http`/`//`) and absolute (`/...`) srcs are passed through; only `./` and bare-relative srcs are rewritten against the page slug.
- **Asset copy:** `scripts/copy-assets.ts` `processSeries()` copies the shared `images/` folder to `public/<postsBasePath>/<chapter-slug>/images/` for every chapter file **and** to `public/<postsBasePath>/<series-slug>/images/` for `index.*`. `postsBasePath` = `site.config.ts` `posts.basePath` (currently `blogs`); series slug = `tradingflow-docs`.
- **Screenshot capture:** `scripts/capture-blog-ui-screenshots.ts` (Playwright vs the sibling webapp dev server) — writes into `content/posts/<feature>/images/`. See the blog runbook for the full capture workflow, login fixtures, readiness gates, and crop/clip rules. Current routes captured: `/app/option-trades`, `/app/rank/contracts`, `/app/rank/symbols`.
- **Series annotation:** `scripts/annotate-series-screenshots.ts` — bakes numbered callouts onto series images (see Annotation below).
- **Content source of truth:** start with this ops repo's `knowledge/*.md` for product-facing concepts, metric definitions, data freshness, schema vocabulary, and methodology vocabulary. Then read `tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/functionality.md` (what each surface does) and `.../domain-invariants.md` (the rules, e.g. freemium boundaries) for `option-trades`, `rank`, `shared`; plus `doc/knowledge/glossary.md` if present for canonical names. These sources are already at useful altitude — quote/condense them; do not paste engineering internals.

### Financial University Teacher Review

Before finalizing tutorial copy, review it as if you are a finance professor preparing a first lab for freshman students who know little or nothing about options flow:

- **No assumed basics:** define calls, puts, bid, ask, side, sentiment, OI, IV, Delta, DEX, DEI, GEX, and Vol/OI before relying on them, or link directly to the concept chapter before using the term.
- **Functionality plus methodology:** every page tutorial should teach both where the UI control lives and why a trader would use it in the TradingFlow research workflow.
- **Evidence vs interpretation:** distinguish what the platform observes (prints, side, premium, OI, IV, rank) from what a trader may infer (possible bullishness, hedging, opening, conviction).
- **Freshness discipline:** call out when data is live flow, latest snapshot, or next-day confirmation; do not imply OI, GEX, IV, or structure fields are tick-by-tick trade facts.
- **Intuitive and comprehensive:** prefer short definitions, simple examples, tables, checklists, and Mermaid flows over dense prose; include caveats where a beginner might overread one metric.
- **Bilingual parity:** the zh version must teach the same concept, caution, workflow step, and link target as the English version; do not make zh a looser summary.

### Current webapp surfaces the series covers
- **Option Trades:** `https://app.tradingflow.com/app/option-trades` (Live + Historical tabs).
- **Rank workbench:** `/app/rank/contracts` and `/app/rank/symbols`. The retired standalone tools (Option Chain Analysis, Market Rank, Contract Rank, GEX Screener, OI Change Rank, Volatility Desk) are **consolidated into Rank** — do not document them as separate pages.

### Preflight safety
```bash
git -C ../tradingflow-web-landingpage status --short
git -C ../tradingflow-webapp-fullstack status --short
```
Treat unrelated modified/deleted/untracked files as user work; do not revert. Scope edits to the series, its images, the annotation script, and this runbook.

## URL scheme & routing (`/learn`)

The docs series is served as a **first-class `/learn` section**, NOT under the generic `/series/...`. This is the canonical, indexed URL scheme (SEO IA migration, 2026-06-20).

- **Mechanism:** `site.config.ts` → `series.routeBases = { 'tradingflow-docs': 'learn' }`. `src/lib/urls.ts` (`getSeriesUrl` / `getSeriesEntryUrl` / `getSeriesPageUrl`) honor it, so every internal link, canonical, breadcrumb, and the sitemap emit `/learn` automatically.
- **Routes:** `src/app/learn/page.tsx` (hub) + `src/app/learn/[slug]/page.tsx` (chapter). The docs series is **excluded** from the generic `src/app/series/[slug]*` routes + `/series` listing + sitemap (so no duplicate `/series/tradingflow-docs/*` is generated).
- **Content location is unchanged:** chapters still live in `content/series/tradingflow-docs/` (read as a "series folder"); only the public URL differs. Likewise images stay under `/blogs/tradingflow-docs/` — so the image-path rule below is unchanged.
- **Menu:** a single nav item **Learn → `/learn`** (no `/series`, no dropdown).
- **Redirects:** old paths 301 to `/learn` — `nginx.conf.example` (regex `/series/tradingflow-docs/NN-slug → /learn/<slug>`, plus `/series/tradingflow-docs` and `/series` → `/learn`) and a `netlify.toml` mirror. **These must be live on the server when the new export deploys**, or old indexed URLs 404 (the static pages no longer exist).
- **Adding another `/learn`-style section:** add a `routeBases` entry; the `/learn` routes are currently hardcoded to the single docs series (cousins of the `/series` routes). A second route-base series is the moment to extract a shared `SeriesEntryView`.

## CRITICAL: series image paths (read before embedding any image)

**Rule: in series chapter MDX, reference images with the ABSOLUTE path**
```md
![alt text](/blogs/tradingflow-docs/images/<file>.png)
```
**NOT** the relative `![alt](./images/<file>.png)` form that posts use.

**Why:** A series chapter page renders at the route `/learn/<chapter>/`, so the renderer rewrites a relative `./images/x.png` to `/learn/<chapter>/images/x.png`. But `copy-assets.ts` stores series assets (and the image optimizer generates the `.WEBP` variants) under `/<postsBasePath>/...` = `/blogs/...`. For nested **posts** these align (post route base is `/blogs/<slug>`), so relative paths work there. For **flat series chapters** they diverge, and every relative image 404s in production. The absolute `/blogs/tradingflow-docs/images/<file>.png` path is uniform across all chapters (it is the `index`-derived shared copy), passes through the rehype rewrite untouched, and is where the optimizer emits variants.

If you ever see broken series images, this mismatch is the first thing to check (`grep -rn '](\./images/' content/series/tradingflow-docs/*.mdx`). Fix:
```bash
perl -pi -e 's{\]\(\./images/}{](/blogs/tradingflow-docs/images/}g' content/series/tradingflow-docs/*.mdx
```
(If `posts.basePath` or the series slug ever change, update the absolute prefix accordingly.)

## Workflow

1. **Preflight** — run the worktree status checks above; read this ops repo's `knowledge/*.md`, then the webapp `doc/domain-knowledge` + glossary for the surfaces in scope. Keep the **Financial University Teacher Review** checklist open before writing.
2. **Plan structure** — decide the chapter set and order. Keep page tutorials and concept chapters separate; have page chapters **link** to concept chapters instead of redefining DEX/GEX/OI/Greeks/sentiment. Update `index.mdx` + `index.zh.mdx` `posts: [...]` to the exact slug order. Categories used: `Getting Started`, `Using TradingFlow`, `Concepts` (localize in the `.zh` file).
3. **Screenshots** — prefer **reusing** current screenshots already produced by the capture script under `content/posts/<feature>/images/` (option-trades, contract-rank = Rank Contracts, market-rank = Rank Symbols). Copy the ones you need into `content/series/tradingflow-docs/images/` with clean names. Re-capture only if images are stale or show loading frames — that requires the local webapp + the capture pipeline in the blog runbook (browser MCP cannot write files into the repo; `chrome-devtools` needs Chrome started with remote-debugging, so the Playwright `capture-blog-ui` script is the reliable path). Verify currency by spot-checking a screenshot against the live app.
4. **Annotate** — bake numbered callouts with `scripts/annotate-series-screenshots.ts`. It is **idempotent**: each entry re-copies its raw `src` then composites an SVG overlay, so you can re-run after tweaking coordinates without double-annotating. Each callout is `{ label, labelBox{x,y,w,h}, target{x,y,w,h} }` in image pixels (heroes are 1600×900). Run `bun scripts/annotate-series-screenshots.ts`, then **view each output** and adjust coordinates. The numbered legend you write in the MDX **must match the baked callout order** top-to-bottom; if you reorder one, reorder the other.
5. **Write chapters (bilingual)** — for each chapter write clean-slug files `slug.mdx` and `slug.zh.mdx` (for example, `option-trades.mdx`; order comes from `posts: [...]`, not filename prefixes):
   - Frontmatter: `title`, `date` (today), `excerpt`, `category`, `tags`, `authors: ["TradingFlow Team"]` (localize title/excerpt/category in `.zh`).
   - Non-technical teaching voice for new traders/freshman students; apply the **Financial University Teacher Review** checklist, define terms before use, distinguish evidence from interpretation, and include practical research checklists where helpful.
   - Embed annotated screenshots (absolute path rule) each with an italic caption and, for annotated images, a numbered legend.
   - Add Mermaid diagrams as fenced ```mermaid blocks (decision trees like "which tool/mode when", row anatomy, discovery→inspect→handoff journeys). Prefer a diagram over a wall of text.
   - Cross-link siblings as `/learn/<slug>`; link the live app as full `https://app.tradingflow.com/app/...`. State freemium boundaries plainly ("this is a paid feature").
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
# 1) what src does a chapter request? (chapters export to out/learn/<slug>/)
grep -oE 'src="[^"]*ot-live[^"]*"' out/learn/option-trades/index.html | head -1
#    expect: /blogs/tradingflow-docs/images/nextImageExportOptimizer/ot-live-opt-3840.WEBP

# 2) does that file (and the PNG fallback) exist?
ls out/blogs/tradingflow-docs/images/nextImageExportOptimizer/ot-live-opt-3840.WEBP
ls out/blogs/tradingflow-docs/images/ot-live.png
```

Also confirm: every `![](...)` in the chapters resolves (no remaining `./images/`); each EN chapter has a `.zh` sibling; cross-links use real slugs from the `posts:` array; Mermaid blocks are well-formed (they render client-side, so the build won't catch syntax errors — eyeball them). The zh content reuses the same absolute image paths, so it resolves once EN does.

Content verification is part of verification: spot-check the changed chapters against **Financial University Teacher Review**. If a changed chapter introduces a term before defining/linking it, presents a metric as a signal without caveat, or teaches UI functionality without the TradingFlow methodology behind it, keep editing before calling the run complete.

## Deploy

Production (`tradingflow.com`) is a static export served via rsync. A local build does **not** update production. To publish:
```bash
bun run deploy            # rsync out/ to the server using .env creds — OPERATOR-AUTHORIZED ONLY
```
Do not run this on your own. Either ask the user to confirm, or have them run `!bun run deploy`. If they report production still shows old content/broken images after a fix, a stale deploy is the likely cause.

## Tutorial videos: voiceover + bilingual subtitles (HyperFrames)

Each chapter (and the series overview) can carry a short branded video — **TradingFlow logo + English voiceover + burned-in bilingual (English + 中文) subtitles**. Videos are authored as HyperFrames compositions (HTML + GSAP), narrated with local TTS, and rendered to MP4. **One video per chapter** (English VO + bilingual captions) serves BOTH the EN and zh posts — there is no per-language video.

> The HyperFrames skills (`hyperframes`, `hyperframes-media`) provide the renderer and TTS. This section captures the TradingFlow-specific wiring and the pitfalls hit while building the set.

### Assets (landing repo, under `video/`)
- `video/series-overview/` — 57s overview composition (`index.html`, `design.md`, `overview.wav`, `logo.png`).
- `video/chapter-build/` — per-chapter builder: `template.tpl` (composition template — kept as `.tpl`, **not** `.html`, see pitfalls), `build_one.py` (fills the template, synthesizes narration, writes `index.html` + `<slug>.wav`), `logo.png`.
- `video/chapter-cards/renders/vars/<slug>.json` — per-chapter content (num / kicker / title / subtitle / points / url).
- `video/tts_bilingual.py`, `video/tts_caption.py`, `video/zh_tts.py` — TTS helpers (narration wav + caption timings).
- `video/upload-to-r2.sh` — R2 upload loop.
- Output → `public/videos/tutorials/<slug>.mp4` + `public/videos/tutorials/posters/<slug>.jpg`.

### Local TTS setup (free, no API key)
`hyperframes tts` synthesizes locally with **Kokoro** (no key). Two gotchas:
- It uses the **`python3`/`python` it finds on PATH** and needs `kokoro-onnx` + `soundfile` importable there. On this machine the PATH `python3` was a venv without `pip`, so a dedicated venv was made from Homebrew Python:
  ```bash
  /opt/homebrew/bin/python3 -m venv ~/.tts-venv
  ~/.tts-venv/bin/python -m pip install kokoro-onnx soundfile
  brew install espeak-ng                      # required for non-English (Mandarin) phonemization
  ```
  Run TTS with that venv first on PATH: `PATH="$HOME/.tts-venv/bin:$PATH" npx hyperframes tts ...`. The Kokoro model (~310 MB) auto-downloads once to `~/.cache/hyperframes/tts/`.

### Narration (English) + the Mandarin caveat
- **English (shipped):** `PATH="$HOME/.tts-venv/bin:$PATH" npx hyperframes tts script.txt --provider kokoro --voice am_adam --speed 1.05 -o out.wav` (`am_adam` = warm tutorial male). ~2.3 words/s → budget ~125 words for ~55s, ~25 words for a 12s chapter.
- **Mandarin VO is NOT shipped.** The CLI rejects `--lang cmn`, and its `zh` mapping crashes (`language "zh" is not supported by the espeak backend`). It only works via a **direct `kokoro_onnx` call with `lang="cmn"`** (see `video/zh_tts.py`), and quality is rough (espeak-level). **Decision: English voice only + bilingual subtitles.** Natural Mandarin VO would need a HeyGen/ElevenLabs key (none set).

### Why captions are burned via HyperFrames (not ffmpeg / soft subs)
- The site's `MarkdownRenderer` `video:` component renders `<video {...rest} controls />` and **drops child elements** → a soft `<track>` subtitle will NOT show.
- The local `ffmpeg` is a **minimal build with no `libass`/`drawtext`** → it cannot burn subtitles (`-vf subtitles=...` errors). Do not rely on ffmpeg for captions here.
- **Solution:** put the narration as an `<audio>` clip and a timed caption overlay INSIDE the composition, then `hyperframes render`. Chromium renders captions (CJK via system font fallback — no special font needed) and the render muxes the audio. This is the reliable path.

### Build a chapter video
```bash
cd ../tradingflow-web-landingpage/video
~/.tts-venv/bin/python chapter-build/build_one.py 03-option-trades        # synth EN narration + caption timings + fill template
( cd chapter-build && npx hyperframes render --output ../../public/videos/tutorials/03-option-trades.mp4 )
ffmpeg -y -ss 3 -i ../public/videos/tutorials/03-option-trades.mp4 -frames:v 1 -q:v 3 \
  ../public/videos/tutorials/posters/03-option-trades.jpg
```
Bilingual narration (`English`, `中文`) per chapter lives in `build_one.py` — edit it to change copy. The clip is 15s; keep narration ≤ ~12s so it ends before the content fade at 13.9s. The overview is built/edited directly in `video/series-overview/index.html` (audio `<audio src="overview.wav">` + a `#cap-layer` of timed caption divs).

### Logo
Use **`public/logo.png`** (white "TradingFlow" wordmark + blue mark) on the dark video. Do **NOT** use `logo-white.png` — despite the name it is **black** text (for white backgrounds) and is invisible on dark. Copy the logo into the composition dir; lint requires referenced images to live in the project dir.

### Render pitfalls (all hit on the first build)
- **`audio_src_not_found` lint error** → the `<audio src>` must be a file INSIDE the composition dir; `../` paths fail. Keep `<slug>.wav` next to `index.html`.
- **`multiple_root_compositions` lint error** → any `*.html` in the render dir with `data-composition-id` is discovered as a root. Keep templates as `.tpl` (not `.html`) or outside the render cwd.
- **Render aborts at low disk** ("0.x GB free") → renders write thousands of temp PNGs. Free space first: `npm cache clean --force` + `pip cache purge` (regenerable; freed ~17 GB here). Check `df -h /`.
- The `gsap_studio_edit_blocked` lint **warning** is expected for these GSAP-owned compositions — not an error.

### Embed video in a post (one file, both languages)
The renderer's `video:` component is first-class (forces `controls`, responsive; passes `src`/`poster`/`preload`). Insert right after the frontmatter, in BOTH `<slug>.mdx` and `<slug>.zh.mdx` (same file), and the overview into `index.mdx`/`index.zh.mdx`:
```html
<video src="/videos/tutorials/03-option-trades.mp4" poster="/videos/tutorials/posters/03-option-trades.jpg" preload="metadata" playsinline aria-label="..."></video>
```
Videos live in `public/videos/tutorials/` and are served at the absolute `/videos/...` path. They are **not** images → the `/blogs/...` image rule does NOT apply and there is no optimizer step; Next copies `public/` into `out/` on build.

> **Filename vs page slug:** video files keep the `NN-` prefix (`03-option-trades.mp4`) even though the page slug dropped it (`/learn/option-trades`). The filename is just an asset key; the `<video src>` references the `NN-` file. Don't "fix" the mismatch — it avoids re-keying R2 and re-editing every `<video src>`.
>
> **On-screen URL inside the video:** the rendered MP4s display the page URL (`tradingflow.com/learn/<slug>` for chapters, `tradingflow.com/learn` for the overview) in the CTA. That text comes from the `url` field in `video/chapter-cards/renders/vars/<NN-slug>.json` (chapters) and `#s6-url` in `video/series-overview/index.html` (overview). If the URL scheme changes, update those and **re-render + re-upload**.

### Verify video
```bash
bun run build:dev
ls out/videos/tutorials/<NN-slug>.mp4 out/videos/tutorials/posters/<NN-slug>.jpg                 # copied to export (files keep NN- prefix)
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 public/videos/tutorials/<NN-slug>.mp4   # expect: video AND audio
grep -o '<video[^>]*src="/videos/tutorials/<NN-slug>.mp4"' out/learn/<slug>/index.html
```
Extract a frame (`ffmpeg -ss N -i ... f.png`) and eyeball the logo, content, and bilingual caption (CJK not tofu).

## Hosting videos on Cloudflare R2 (optional, recommended)

The narrated videos add ~50 MB to `public/` (and the rsync deploy). Hosting them on R2 keeps the repo/deploy lean and gives CDN streaming. **Sequence matters: finalize → upload → make public → link.**

1. **Enable R2** on the Cloudflare account (dashboard, one-time; may require a payment method). `wrangler r2 ...` fails with `code 10042` until enabled — **owner's action**.
2. **Bucket:** `tradingflow-media` (`npx wrangler r2 bucket create tradingflow-media`).
3. **Upload** from any wrangler-authed dir (e.g. the `tradingflow-cfworker-service` repo). Use `video/upload-to-r2.sh`, or per file:
   ```bash
   npx wrangler r2 object put tradingflow-media/videos/tutorials/<slug>.mp4 \
     --file public/videos/tutorials/<slug>.mp4 --content-type video/mp4 \
     --cache-control "public, max-age=31536000, immutable"
   ```
   **Gotcha:** wrangler 3.x `r2 object put` has **no `--remote` flag** (it writes to real R2 by default; `--remote` prints usage and fails). Keys mirror public paths: `videos/tutorials/<slug>.mp4`, `videos/tutorials/posters/<slug>.jpg`.
4. **Immutable cache → upload FINAL content only.** Objects use `max-age=1yr, immutable`; once public + cached, re-uploading the same key serves stale. Upload after all videos are final (re-uploading overwrites earlier/silent versions while still private — fine).
5. **Make the bucket public — OPERATOR ACTION (a sharing-permission change; do NOT do it yourself).** Dashboard → R2 → bucket → Settings → Public access → either a **custom domain** (recommended, e.g. `media.tradingflow.com` → base `https://media.tradingflow.com`) or the **r2.dev** dev URL (`https://pub-<hash>.r2.dev`). Get the base URL from the user.
6. **Link swap (after public + base URL):** rewrite every post `<video src>`/`poster` from `/videos/tutorials/...` → `https://<base>/videos/tutorials/...`, then **delete `public/videos/`** so it is not bundled/deployed. Keep source clips under `video/` for future re-renders/re-uploads.

## Troubleshooting

- **Images broken / 404 in production** → the relative-vs-absolute path mismatch above. Grep for `](./images/` in the series and convert to `/blogs/tradingflow-docs/images/...`; full-build-verify; redeploy.
- **Image referenced but `nextImageExportOptimizer/...WEBP` missing in `out/`** → you only ran `build:dev` (no optimization) or the PNG isn't under `public/blogs/tradingflow-docs/images/`. Run full `bun run build`; confirm `copy-assets` ran and the source PNG exists.
- **Screenshot shows a spinner/skeleton/"Loading…"** → do not ship it; fix the capture readiness gate and recapture per the blog runbook, then re-copy + re-annotate.
- **Annotation legend numbers don't match the image** → the MDX legend order disagrees with the baked callout order; align one to the other and re-run `annotate-series-screenshots.ts`.
- **Chapter doesn't appear / wrong order** → check it's listed in `index.mdx`/`index.zh.mdx` `posts:` and the slug matches the filename.
- **Rendered video is silent** → `<audio src>` not found (must be in the composition dir) or no audio clip; check lint for `audio_src_not_found` and `ffprobe` for an audio stream.
- **Captions don't show / soft `<track>` ignored** → expected: the renderer drops `<video>` children and the local ffmpeg lacks libass. Burn captions via the composition (HyperFrames render), not a `<track>` or ffmpeg.
- **TTS: `language "zh" is not supported by the espeak backend`** → the CLI can't do Mandarin; use the direct `kokoro_onnx` `lang="cmn"` path (`video/zh_tts.py`), or ship English VO + bilingual subtitles.
- **`hyperframes tts`: kokoro-onnx not installed** → install into the python on PATH (or prepend `~/.tts-venv/bin` to PATH); see TTS setup.
- **`hyperframes render` aborts / very slow** → low disk; free with `npm cache clean --force` + `pip cache purge`, then check `df -h /`.
- **`wrangler r2` fails `code 10042 / enable R2`** → R2 not enabled on the account (owner enables in dashboard).
- **`wrangler r2 object put` prints usage and fails** → you passed `--remote` (not a flag in 3.x); remove it.
- **R2 shows the old/silent video** → immutable cache; either it wasn't re-uploaded, or a cached object is served (version the key or purge).

## Anti-patterns

- Relative `./images/...` in a series chapter (works for posts, breaks the series).
- Verifying images with `build:dev` only (skips optimization — false green).
- Deploying without explicit authorization.
- Re-explaining DEX/GEX/OI/Greeks in every chapter instead of linking the concept chapter.
- Marketing-only "smart money" copy that does not teach the reader how to classify, validate, and caveat the evidence.
- Engineering detail (file paths, code, SQL, internals) in user-facing tutorials.
- EN updated without the matching `.zh` (or vice versa).
- Documenting retired standalone tools as if they were still separate pages.
- Annotations that cover the data they describe, or a legend whose numbers don't match the baked callouts.
- Using `logo-white.png` on the dark video (it's black text — use `logo.png`).
- Soft `<track>` subtitles or `ffmpeg -vf subtitles=` for captions (neither works here — burn via the composition).
- Passing `--remote` to `wrangler r2 object put`.
- Making the R2 bucket public yourself, or uploading non-final videos before going public (immutable cache).
- Leaving a composition template as `.html` in the render dir (`multiple_root_compositions`).
- Per-language video files — one English-VO + bilingual-subtitle clip serves both EN and zh posts.

## Runbook self-maintenance

This runbook is part of the workflow; update it in the same pass when a real run finds drift.

- Promote durable lessons (path rules, commands, verification, anti-patterns) into the relevant section; keep transient next-run state in `Agent Handoff` and one-off decisions in the final report.
- Update source-material and chapter-naming instructions when the ops `knowledge/` folder, webapp domain docs, route scheme, or clean-slug filename contract changes.
- Update the image-path rule if `posts.basePath`, the series slug, or the renderer/copy-assets behavior changes.
- Keep the screenshot capture/login details in the blog runbook and reference them here; do not fork a second copy.
- Keep the video/TTS/R2 lessons here (logo choice, caption-burn-via-composition, `wrangler` no-`--remote`, immutable cache, disk-before-render, audio/template-in-project). Update them if the HyperFrames TTS/render pipeline, the renderer's `video:` component, or the R2 setup changes. Generic HyperFrames mechanics stay in the `hyperframes`/`hyperframes-media` skills.
- Prune completed handoff items in the edit that confirms they're done. If nothing durable changed, state `Runbook maintenance: no change` in the final report.

## Pasteable agent instruction
```text
You are creating/updating TradingFlow's tutorial SERIES at content/series/tradingflow-docs/
(audience: non-technical webapp traders and freshman finance students). Follow
ops/landingpage/update-tutorial-series.md.

Before editing:
- git status the landing + webapp worktrees; don't revert unrelated changes.
- Read this ops repo's knowledge/*.md for product-facing concepts, metric definitions, and data freshness.
- Then read tradingflow-webapp-fullstack/doc/domain-knowledge/<module>/functionality.md +
  domain-invariants.md (option-trades, rank, shared) and doc/knowledge/glossary.md if present.

Structure:
- Flat clean-slug chapters slug.mdx + slug.zh.mdx; order via index.mdx/index.zh.mdx `posts: [...]`.
- Page tutorials link to concept chapters; don't redefine DEX/GEX/OI/Greeks/sentiment.
- Use a teaching voice: define terms before use, separate evidence from interpretation, and teach
  a repeatable discover -> inspect -> validate -> freshness-check research method.
- Review like a financial-university teacher for freshman/newbie readers: clear, intuitive,
  comprehensive, no assumed options-flow basics, and no metric presented as a standalone trade signal.

CRITICAL image rule: in series chapters embed images as ABSOLUTE
  ![alt](/blogs/tradingflow-docs/images/<file>.png)
NEVER relative ./images/... (chapter pages render at /learn/... but assets live at /blogs/... → 404).

Screenshots: reuse current ones from content/posts/<feature>/images (option-trades, contract-rank,
market-rank), copy into content/series/tradingflow-docs/images/. Recapture only via the
capture-blog-ui pipeline (blog runbook) if stale/loading. Annotate with
`bun scripts/annotate-series-screenshots.ts` (idempotent); view outputs; make the MDX numbered
legend match the baked callout order.

URL scheme: chapters are served at /learn/<slug> (clean slug, no NN-) via site.config series.routeBases;
content stays in content/series/tradingflow-docs/, images stay under /blogs/tradingflow-docs/. Old
/series/* 301s to /learn (nginx.conf.example + netlify.toml) — redirects must be live when you deploy.

Content: bilingual EN+zh parity; Mermaid fenced blocks; cross-link siblings as
/learn/<slug> and the app as https://app.tradingflow.com/app/...; state paid
boundaries plainly; no engineering internals. Delete superseded old-slug files when renumbering.

Verify: bun run lint && bun run build:dev (frontmatter/MDX) THEN bun run build (full, for images).
Confirm a chapter's <img> src points to /blogs/tradingflow-docs/images/nextImageExportOptimizer/*.WEBP
AND that file + the .png fallback exist in out/. No remaining ./images/ refs.

Videos (optional): branded tutorial videos = HyperFrames composition + logo + English voiceover +
burned-in bilingual (EN+中文) subtitles. ONE video per chapter serves both EN and zh posts.
- Local TTS (free): use ~/.tts-venv (kokoro-onnx + soundfile) on PATH; English voice am_adam via
  `hyperframes tts`. Mandarin VO is not shipped (CLI espeak can't do zh) — English VO + bilingual subs.
- Captions: the renderer drops <video> children and ffmpeg lacks libass, so burn captions by adding
  an <audio> track + timed caption overlay INTO the composition and re-rendering (Chromium renders CJK).
- Build: `~/.tts-venv/bin/python video/chapter-build/build_one.py <slug>` then
  `(cd video/chapter-build && npx hyperframes render --output ../../public/videos/tutorials/<slug>.mp4)`.
- Logo: public/logo.png (white wordmark) — NOT logo-white.png (black). Copy into the composition dir.
- Pitfalls: <audio>/images must be IN the composition dir (audio_src_not_found); template must be .tpl
  not .html (multiple_root_compositions); free disk before render (npm cache clean --force).
- Embed in post: <video src="/videos/tutorials/<slug>.mp4" poster="/videos/tutorials/posters/<slug>.jpg"
  preload="metadata" playsinline></video> after the frontmatter in BOTH .mdx and .zh.mdx.

R2 hosting (optional): bucket tradingflow-media. Upload final-only with
`wrangler r2 object put tradingflow-media/videos/tutorials/<slug>.mp4 --file ... --content-type video/mp4
--cache-control "public, max-age=31536000, immutable"` (NO --remote flag). Enabling R2 + making the
bucket public is the owner's action; after they give a base URL, rewrite <video src>/poster to
https://<base>/videos/tutorials/... and delete public/videos/.

Deploy: bun run deploy ONLY if the user authorizes it (production is a static rsync; local build
doesn't update prod).

If the run reveals drift, update this runbook in the same pass with the exact command/path/check.
```
