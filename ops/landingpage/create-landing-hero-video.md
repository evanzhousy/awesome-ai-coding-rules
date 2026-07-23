---
name: create-landing-hero-video
description: Creates or refreshes the TradingFlow landing homepage hero product video from real local webapp screenshots, using HyperFrames for motion design and WebM-first delivery with MP4 fallback.
disable-model-invocation: true
---

# Create Landing Hero Video

Use this runbook when an AI agent needs to create or refresh the TradingFlow landing page hero video in `tradingflow-web-landingpage`. The output is a short, silent, autoplaying product-proof video for the homepage hero, built from real screenshots of the local TradingFlow webapp after login, not mockups or production screenshots.

This runbook is narrower than the tutorial-video workflow in [`update-tutorial-series.md`](./update-tutorial-series.md). It does not create narrated chapter videos. It creates the homepage product demo asset and wires it into the landing hero UI.

## Recommended Invocation

Use `/goal` for a full hero-video refresh:

- Objective: capture real local TradingFlow webapp screens, design a polished homepage hero product video, render it with HyperFrames, deliver WebM first with MP4 fallback, wire the landing hero component, and verify autoplay, reduced-motion fallback, layout, and build health.
- Success criteria: relevant worktrees are checked; HyperFrames instructions are read; the sibling webapp is opened at the actual local port and logged in with the documented test account; screenshots show stable loaded product UI; the video uses real TradingFlow UI and logo, no mismatched highlight boxes, no unwanted video border, and appropriately paced zooms; English and Chinese files exist at `public/videos/tradingflow-landing-hero.{en,zh}.webm`, `.{en,zh}.mp4`, and `.{en,zh}-poster.jpg`; the landing component serves WebM before MP4 and selects the asset from the active i18n language; browser verification proves English and Chinese selected sources, autoplay, muted inline playback, and reduced-motion poster behavior; `git diff --check`, `bun run lint`, and `bun run build:dev` are run or exact blockers are reported.
- Stop condition: the hero video is rendered, wired, and verified; or a blocker identifies the exact missing webapp server, login path, HyperFrames tool, encoder, local disk, or build/runtime issue.

Pasteable objective:

```text
Use ops/landingpage/create-landing-hero-video.md as the runbook. In tradingflow-web-landingpage, create or refresh the homepage hero product video from real local TradingFlow webapp screenshots. Start the sibling webapp, log in against the local Clerk development instance, capture stable loaded UI at localhost:8000 or the printed local port, build the HyperFrames composition with TradingFlow branding and product-focused motion, render English and Chinese MP4 variants with locale variables, encode WebM first for both locales, generate both posters, wire LandingHeroVideo so WebM is tried before MP4 with MP4 fallback and the active i18n language selects the asset, and verify autoplay/muted/playsInline/loop, reduced-motion poster fallback, no video border, English and Chinese selected WebM sources, lint, build:dev, and git diff checks. Keep findings and reusable drift in this runbook.
```

## Agent Handoff

Last updated: 2026-07-04

No open handoff items. The latest local pass added bilingual hero-video delivery, rendered/refreshed the Chinese variant, and updated `LandingHeroVideo.tsx` to select English or Chinese assets from the active site language. No production deploy was performed.

Current known artifact layout from the latest local hero-video work:

- Capture helper: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/video/landing-hero/capture-assets.mjs`
- Captured screenshots: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/video/landing-hero/capture/`
- HyperFrames project: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/video/landing-hero-video/`
- Landing assets: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/public/videos/tradingflow-landing-hero.{en,zh}.webm`, `.{en,zh}.mp4`, and `.{en,zh}-poster.jpg`
- Landing component: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/src/components/landing/LandingHeroVideo.tsx`

## When To Use

Use this runbook for:

- Homepage hero video creation or refresh.
- Re-capturing the product screens used inside the hero video.
- HyperFrames edits to the landing hero composition.
- Changing the hero video delivery format, poster, autoplay behavior, or visual framing.

Do not use this runbook for:

- Blog post UI screenshots or changelog assets. Use [`update-blog-posts-and-changelog.md`](./update-blog-posts-and-changelog.md).
- Tutorial-series videos with narration or bilingual burned captions. Use [`update-tutorial-series.md`](./update-tutorial-series.md).
- Webapp product review findings. Use [`../webappp-fullstack/browser-e2e-product-review.md`](../webappp-fullstack/browser-e2e-product-review.md).

## Design Contract

The hero video must feel like a product designer made it, not like a raw screen recording.

- Use real loaded product UI from the local webapp after login. Do not use generic mockups or stale production screenshots.
- Show the product value quickly: Option Trades, Rank Contracts, and Rank Symbols or a symbol drawer are good default beats.
- Keep the video short, usually 12-18 seconds, silent, 16:9, and loop-friendly.
- Use the real TradingFlow mark or lockup. Do not rely on tiny nav text as the only brand signal.
- Keep camera moves deliberate and quick. If a zoom-in or zoom-out feels slow in review, shorten it before accepting the render.
- Avoid highlight boxes unless their coordinates exactly match the UI element. A bad highlight box is worse than no highlight. Prefer crop, scale, focus, surface bloom, or UI-state timing when alignment is uncertain.
- Do not add a visible border or inset ring around the hero video unless explicitly requested. A shadow is acceptable if it supports the page design.
- Keep text minimal. Let the actual product surfaces carry the proof.
- Support i18n. If the composition burns in marketing copy, render separate English and Chinese variants from the same source with a locale variable. Do not ship one language's burned-in copy for both site locales.
- Review Chinese frames separately. Chinese copy usually needs shorter strings, slightly smaller display type, and wider/cleaner text placement than the English version.
- Respect reduced motion in the landing page by showing the poster instead of autoplaying video.

## Required Context

Read or inspect these before editing:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
git status --short
git -C /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack status --short
```

Then read the relevant local docs:

1. HyperFrames entry skill: `.agents/skills/hyperframes/SKILL.md` when present in the landing repo, otherwise the installed `hyperframes` skill.
2. HyperFrames project-local guidance: `video/landing-hero-video/AGENTS.md`.
3. Webapp login reference: `/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules/ops/webappp-fullstack/browser-e2e-product-review.md`.
4. Landing component: `src/components/landing/LandingHero.tsx` and `src/components/landing/LandingHeroVideo.tsx`.
5. Capture helper: `video/landing-hero/capture-assets.mjs`.

Preserve unrelated modified or untracked files. Do not revert user work.

## Workflow

### 1. Start the local webapp and confirm the port

The hero video must be based on the local webapp, not production.

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
pnpm dev
```

Use the printed local URL. The expected default is `http://localhost:8000`, but Vite may use `8001` if `8000` is busy.

Default local test login, only for a Clerk development instance:

- Email: `active+clerk_test@example.com`
- OTP: `424242`

If these drift, check:

- `tradingflow-webapp-fullstack/tests/e2e/fixtures/auth.ts`
- `awesome-ai-coding-rules/ops/webappp-fullstack/browser-e2e-product-review.md`

### 2. Capture stable product screenshots

Run the capture helper from the landing repo and set the base URL to the actual webapp port:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
BLOG_UI_CAPTURE_BASE_URL=http://localhost:8000 node video/landing-hero/capture-assets.mjs
```

Useful environment overrides:

```bash
LANDING_HERO_CAPTURE_WIDTH=2400
LANDING_HERO_CAPTURE_HEIGHT=1350
LANDING_HERO_CAPTURE_MODE=core
E2E_LOGIN_EMAIL=active+clerk_test@example.com
E2E_VERIFICATION_CODE=424242
BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID=2026-06-late-recap-cookbooks-flow
```

Inspect every captured PNG before using it:

- No skeletons, spinners, loading copy, or progress bars.
- No feature-announcement dialog covering the UI.
- Tables and drawers contain real data or a deliberately useful stable state.
- Screenshots are high-resolution enough for zooming inside a 1600x900 render.
- The chosen surfaces tell a coherent product story in 12-18 seconds.

If a capture is loading or blank, fix the readiness gate in `capture-assets.mjs` and recapture. Do not design around a bad screenshot.

### 3. Edit the HyperFrames composition

Composition directory:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/video/landing-hero-video
```

Default files:

- `index.html` owns the composition.
- `assets/` should contain copied screenshots and logo assets used by the composition.
- `package.json` pins the HyperFrames CLI used by this project.

Use actual assets from the landing repo, especially the real logo. Prefer `public/logo.png` when a white wordmark is needed on dark surfaces. Avoid `logo-white.png` if it renders dark text on a dark background.

For bilingual output, define a HyperFrames render variable such as:

```html
<html data-composition-variables='[{"id":"locale","label":"Locale","type":"enum","default":"en","options":[{"label":"English","value":"en"},{"label":"Chinese","value":"zh"}]}]'>
```

Then apply locale-specific copy and typography in the composition. Use the same screenshots and timing unless a locale-specific copy layout needs a small placement adjustment.

Motion guidelines:

- Use 30 fps and 16:9.
- Keep scene holds short enough that the video feels active: roughly 1.2-2.5 seconds per product beat.
- Keep zooms/pans responsive: roughly 0.4-0.9 seconds for a punch-in or pull-back unless the movement is intentionally calm.
- Use easing to settle movement, but do not let the camera drift slowly without revealing information.
- If highlighting, align boxes from measured screenshot coordinates. If alignment cannot be made exact, remove the box and use motion/focus instead.
- Prefer visual continuity over feature dumping: the viewer should understand "this is a real trading workflow" in one glance.

### 4. Validate and render HyperFrames

Run checks before rendering:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/video/landing-hero-video
npx --yes hyperframes@0.7.31 lint
npx --yes hyperframes@0.7.31 validate
npx --yes hyperframes@0.7.31 inspect
```

Render both MP4 locale variants:

```bash
for locale in en zh; do
  npx --yes hyperframes@0.7.31 render \
    --strict \
    --strict-variables \
    --variables "{\"locale\":\"${locale}\"}" \
    --output "../../public/videos/tradingflow-landing-hero.${locale}.mp4"
done
```

If render fails because of disk space, clear only regenerable caches and re-check free space:

```bash
df -h /
npm cache clean --force
pip cache purge
```

### 5. Generate posters and WebM delivery assets

Optimize each rendered MP4 for page delivery, then generate the matching WebM and poster. Keep the locale suffixes; the component depends on them.

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
for locale in en zh; do
  ffmpeg -y -hide_banner -i "public/videos/tradingflow-landing-hero.${locale}.mp4" \
    -vf scale=1600:900 \
    -an \
    -c:v libx264 \
    -pix_fmt yuv420p \
    -preset slow \
    -crf 24 \
    -movflags +faststart \
    "public/videos/tradingflow-landing-hero.${locale}.optimized.mp4"

  mv "public/videos/tradingflow-landing-hero.${locale}.optimized.mp4" \
    "public/videos/tradingflow-landing-hero.${locale}.mp4"

  ffmpeg -y -hide_banner -i "public/videos/tradingflow-landing-hero.${locale}.mp4" \
    -an \
    -c:v libvpx-vp9 \
    -pix_fmt yuv420p \
    -b:v 0 \
    -crf 32 \
    -row-mt 1 \
    -deadline good \
    -cpu-used 2 \
    "public/videos/tradingflow-landing-hero.${locale}.webm"

  ffmpeg -y -hide_banner -ss 1 -i "public/videos/tradingflow-landing-hero.${locale}.mp4" \
    -frames:v 1 \
    -q:v 3 \
    -update 1 \
    "public/videos/tradingflow-landing-hero.${locale}-poster.jpg"
done
```

Inspect metadata:

```bash
for file in public/videos/tradingflow-landing-hero.{en,zh}.{webm,mp4}; do
  echo "$file"
  ffprobe -v error \
    -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate,pix_fmt \
    -of json "$file"
done
ls -lh public/videos/tradingflow-landing-hero.*
```

Expected shape for the current hero asset: 1600x900, 30 fps, about 14-18 seconds, silent video-only stream.

Do not convert this asset to GIF or SVG. GIF is usually larger and lower quality for UI motion. SVG is for vector animation, not raster product-screen footage.

### 6. Wire the landing component

The landing component should select assets from the active i18n language and try WebM first and MP4 second:

```tsx
const HERO_VIDEO_SOURCES = {
  en: {
    mp4: '/videos/tradingflow-landing-hero.en.mp4',
    poster: '/videos/tradingflow-landing-hero.en-poster.jpg',
    webm: '/videos/tradingflow-landing-hero.en.webm',
  },
  zh: {
    mp4: '/videos/tradingflow-landing-hero.zh.mp4',
    poster: '/videos/tradingflow-landing-hero.zh-poster.jpg',
    webm: '/videos/tradingflow-landing-hero.zh.webm',
  },
} as const;

const { language, t } = useLanguage();
const heroVideo = HERO_VIDEO_SOURCES[language] ?? HERO_VIDEO_SOURCES.en;

<video autoPlay loop muted playsInline preload="auto" poster={heroVideo.poster} aria-label={t('landing_hero_sr_title')}>
  <source src={heroVideo.webm} type="video/webm" />
  <source src={heroVideo.mp4} type="video/mp4" />
</video>
```

Autoplay reliability requirements:

- `autoPlay`
- `muted`
- `playsInline`
- `loop`
- `preload="auto"` for this small hero asset
- client-side `video.play().catch(() => {})` nudge after mount
- `video.muted = true` and `video.defaultMuted = true` before calling `play()`
- poster fallback when autoplay is blocked
- poster-only branch for `prefers-reduced-motion: reduce`

Keep the hero frame clean:

- No default `border` on the video wrapper.
- No inset `ring` overlay unless the design explicitly asks for it.
- Use responsive `aspect-video`, stable max width, and `overflow-hidden`.
- Verify text and nearby hero controls do not overlap the video on mobile.

### 7. Browser verification

Start or reuse the landing dev server:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage
bun dev
```

If `bun run build:dev` needs to run, stop `next dev` first. Next cannot acquire `.next/lock` while `next dev` is running. Restart `bun dev` after the build so the in-app browser URL works again.

Check selected source and autoplay for both languages:

```bash
bun -e "const { chromium } = await import('playwright'); const browser = await chromium.launch({ headless: true }); for (const locale of ['en', 'zh']) { const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); const errors = []; page.on('pageerror', e => errors.push(e.message)); await page.addInitScript(locale => localStorage.setItem('tradingflow-language', locale), locale); await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }); const result = await page.locator('video').first().evaluate(v => ({ ariaLabel: v.getAttribute('aria-label'), currentSrc: v.currentSrc, paused: v.paused, muted: v.muted, defaultMuted: v.defaultMuted, autoplay: v.autoplay, loop: v.loop, playsInline: v.playsInline, readyState: v.readyState, currentTime: Number(v.currentTime.toFixed(2)), width: v.videoWidth, height: v.videoHeight })); console.log(JSON.stringify({ locale, result, errors }, null, 2)); await page.close(); } await browser.close();"
```

Expected:

- For `en`, `currentSrc` ends in `/videos/tradingflow-landing-hero.en.webm` in Chromium.
- For `zh`, `currentSrc` ends in `/videos/tradingflow-landing-hero.zh.webm` in Chromium.
- `paused: false`.
- `muted: true` and `defaultMuted: true`.
- `autoplay: true`, `loop: true`, `playsInline: true`.
- `readyState` is enough to play, ideally `4`.
- `width` and `height` match the encoded asset.

Check reduced-motion behavior:

```bash
bun -e "const { chromium } = await import('playwright'); const browser = await chromium.launch({ headless: true }); for (const locale of ['en', 'zh']) { const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 900 } }); await context.addInitScript(locale => localStorage.setItem('tradingflow-language', locale), locale); const page = await context.newPage(); await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }); const result = await page.evaluate(() => ({ hasVideo: Boolean(document.querySelector('video')), posterSrc: document.querySelector('img[alt]')?.getAttribute('src') || null, posterAlt: document.querySelector('img[alt]')?.getAttribute('alt') || null })); console.log(JSON.stringify({ locale, result }, null, 2)); await context.close(); } await browser.close();"
```

Expected: `hasVideo: false`, and `posterSrc` contains `tradingflow-landing-hero.en-poster` or `tradingflow-landing-hero.zh-poster` for the matching locale.

Check wrapper border/ring when no border is desired:

```bash
bun -e "const { chromium } = await import('playwright'); const browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }); const result = await page.locator('video').first().evaluate(v => { const c = v.parentElement; const s = getComputedStyle(c); return { borderTopWidth: s.borderTopWidth, hasRingOverlay: Boolean(c.querySelector('.ring-1')) }; }); console.log(JSON.stringify(result, null, 2)); await browser.close();"
```

Expected: `borderTopWidth: "0px"` and `hasRingOverlay: false`.

### 8. Build and repo checks

Run these after wiring:

```bash
git diff --check
bun run lint
bun run build:dev
```

Known unrelated baseline warnings may exist. Report warnings exactly enough to distinguish them from hero-video regressions.

If `build:dev` fails on `.next/lock`, inspect the running `next dev` process, stop it cleanly, rerun the build, then restart `bun dev`.

## Output Report

When the run is complete, report:

- Source webapp URL used for capture.
- Screenshot surfaces captured.
- HyperFrames project path.
- Output video paths and sizes for both English and Chinese.
- Delivery order: WebM first, MP4 fallback.
- Browser verification summary for English, Chinese, and reduced motion.
- Build/lint/diff-check result.
- Whether the landing dev server is running and at what URL.
- Runbook maintenance note.

Use compact tables when useful:

| Artifact | Path | Status |
| --- | --- | --- |
| English WebM | `public/videos/tradingflow-landing-hero.en.webm` | present / selected by browser when `language=en` |
| English MP4 | `public/videos/tradingflow-landing-hero.en.mp4` | fallback present |
| English poster | `public/videos/tradingflow-landing-hero.en-poster.jpg` | reduced-motion fallback present |
| Chinese WebM | `public/videos/tradingflow-landing-hero.zh.webm` | present / selected by browser when `language=zh` |
| Chinese MP4 | `public/videos/tradingflow-landing-hero.zh.mp4` | fallback present |
| Chinese poster | `public/videos/tradingflow-landing-hero.zh-poster.jpg` | reduced-motion fallback present |
| Component | `src/components/landing/LandingHeroVideo.tsx` | wired |

| Design Check | Pass Criteria | Result |
| --- | --- | --- |
| Real UI | Captured after local login, stable loaded screens | pass/fail |
| Motion pace | Zooms/pans feel responsive, not slow | pass/fail |
| Highlights | Exact alignment or omitted | pass/fail |
| Border | No border/ring unless requested | pass/fail |
| i18n | English and Chinese videos selected by the active site language | pass/fail |
| Autoplay | Muted inline WebM plays automatically | pass/fail |
| Reduced motion | Poster replaces video | pass/fail |

## Troubleshooting

- Webapp is not at `localhost:8000`: use the port printed by `pnpm dev`, often `8001` if `8000` is busy.
- Login fails with `424242`: confirm the webapp is using Clerk development keys and read the fixture paths named above.
- What's New modal blocks captures: seed `tf_feature_announcement_dismissed_<campaignId>` in `sessionStorage` or use the capture helper's `BLOG_UI_FEATURE_ANNOUNCEMENT_CAMPAIGN_ID`.
- Screenshot shows loading UI: strengthen the route-specific wait in `capture-assets.mjs`; recapture before editing the video.
- Highlight boxes do not match UI: remove them or compute exact positions from the screenshot. Do not ship approximate boxes.
- Zoom feels too slow: shorten the camera segment and re-render. Product hero videos should reveal value quickly.
- Chinese copy overlaps or feels cramped: shorten the Chinese string first, then reduce Chinese-only display/body type or adjust the Chinese-only copy block width. Re-sample the affected frames before accepting the render.
- Autoplay is blocked: verify muted/defaultMuted, `playsInline`, the client-side `play()` nudge, and that reduced-motion mode is not active.
- Browser selects MP4 instead of WebM: confirm the WebM `<source>` appears before MP4 and the file is served from `public/videos/`.
- Wrong language video is selected: confirm `LandingHeroVideo.tsx` reads `useLanguage()`, `LanguageProvider` persists `tradingflow-language`, and the source map uses `.en` and `.zh` suffixed files.
- `ffmpeg` lacks VP9: check `ffmpeg -hide_banner -encoders | rg 'libvpx|vp9'`; install or use a host with `libvpx-vp9`.
- Next build lock: stop `bun dev` or stray `next build` processes before `bun run build:dev`, then restart `bun dev`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the run revealed a reusable lesson about capture, login, HyperFrames, render, encoding, wiring, autoplay, or verification.
2. Promote durable lessons into the procedure, design contract, verification, or troubleshooting sections.
3. Keep transient state in `Agent Handoff` only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Webapp login selectors, default test credentials, OTP behavior, route paths, or capture readiness gates drift.
- HyperFrames project paths, CLI version, render commands, asset constraints, or lint/validate behavior drift.
- Landing hero component expectations change, especially video source order, autoplay behavior, reduced-motion behavior, border/framing, or poster handling.
- A repeated design issue needs a standard rule, such as slow zooms, mismatched highlight boxes, or missing brand signal.
- Verification gates were too weak, too broad, or missing.
- This runbook is added, renamed, moved, or replaced and the canonical ops routing table needs updating.

Do not update this runbook for:

- One-off screenshots, temporary local data gaps, raw render logs, or current-run-only measurements.
- Completed progress that belongs only in the final report.
- Speculative format or animation preferences that were not supported by an actual run.
