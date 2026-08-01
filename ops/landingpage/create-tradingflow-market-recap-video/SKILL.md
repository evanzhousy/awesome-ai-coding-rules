---
name: create-tradingflow-market-recap-video
description: Create or revise TradingFlow daily market-recap videos from an authenticated `/app/market-recap/YYYY-MM-DD` article using verified app evidence, options-aware chart semantics, HyperFrames, ChatCut audio, brand-safe captions and logos, Studio review, and final MP4 verification. Use when Codex must turn a TradingFlow daily recap into a 45–90 second narrated video, refresh an existing recap video, or diagnose its content, charts, pacing, subtitles, render, or publishing handoff.
---

# Create a TradingFlow market-recap video

Build a concise editorial video that is traceable to TradingFlow's published
recap, understandable to a new options trader, and deterministic in the final
render.

Use `$hyperframes` as the mandatory video entry point. For a fresh project,
route to the faceless-explainer workflow: the subject is an article and the
visuals are authored rather than captured product footage. Load HyperFrames
domain skills only as the active step requires them.

## 1. Isolate the project

- Create a dedicated HyperFrames project and route, such as
  `videos/market-recap-YYYY-MM-DD`.
- Preserve unrelated landing-page files and dirty-worktree changes.
- Reuse an existing recap project only when the user asks to revise that exact
  edition.
- Open the requested live preview before editing when the user asks for a
  browser-first review.

## 2. Establish the evidence contract

1. Open the exact authenticated recap URL supplied by the user.
2. Treat the published article as the editorial source of truth.
3. Capture at least one app screenshot as evidence when requested.
4. Extract every intended claim into a small source table with:
   - metric and definition;
   - value and unit;
   - symbol;
   - session or comparison period;
   - source location.
5. Store additional approved market data, such as OHLC, in a versioned local
   JSON artifact. Never invent a price path.
6. Remove the app screenshot from the final cut unless the user explicitly
   approves its visual use. Translate its facts into native video primitives.

Do not infer a forecast, probability, support/resistance level, or trade
recommendation from descriptive recap data. Label GEX, DEX, and DEI as modeled
estimates in the closing disclosure.

## 3. Lock the editorial spine

- Default to 60 seconds and six scenes for a normal daily recap.
- Lead with one plain-language thesis, then reveal evidence in this order:
  market structure, cross-benchmark context, premium concentration, activity
  and sentiment, symbol-level exposure, scheduled catalysts.
- Use declarative wire-service language. Avoid hype and prediction.
- Append the ticker whenever visible copy names a listed company, for example
  `Microsoft (MSFT)`.
- Keep narration natural; ticker annotations may remain visual metadata.
- End with TradingFlow.com and a concise modeled-data / not-financial-advice
  disclosure.

Before authoring charts, read
[chart-selection.md](references/chart-selection.md).

## 4. Apply the TradingFlow visual and audio contract

- Use a pure white full-frame background.
- Use solid editorial typography. Never apply a gradient to text.
- Use gradients only inside chart marks, with one hue family and
  lightness-only variation per chart.
- Keep the official full-color TradingFlow logo visible on every frame.
- Add compact official-color entity marks beside every referenced symbol.
- Reserve a separate white bottom rail for black subtitles. For 1920×1080,
  reserve about 180 pixels and keep scene artwork inside the upper 900 pixels.
- Keep captions readable when muted and synchronized to the narration.

When the user requests voice, music, or captions:

- Obtain authorization before sending recap copy to an external generation
  service.
- Use the already confirmed English voice preset without reopening the choice;
  use Frederick when that preset is the confirmed project preference.
- Generate a restrained, non-vocal electronic bed and duck it beneath speech.
- Keep the editable ChatCut project available when ChatCut generates the audio
  or subtitle assets.
- Import the approved mixed audio into HyperFrames as a framework-owned audio
  track.

## 5. Build charts as analysis, not decoration

- Separate price, structural exposure, magnitude, and signed flow.
- Use locally vendored TradingView Lightweight Charts for professional daily
  candlesticks. Do not use a remote iframe or render-time network request.
- Use shadcn/Recharts chart grammar as a semantic reference, then implement the
  render-critical chart with deterministic local SVG/CSS when appropriate.
- Keep units, scale, comparison period, and benchmark visible.
- Keep all meaning persistent; never depend on hover tooltips.
- Reconcile every part-to-whole chart to its stated total, including an
  explicit `OTHER` remainder when needed.

## 6. Preserve HyperFrames determinism

- Register one synchronous paused GSAP timeline per composition.
- Keep every assembled `id` and `data-hf-id` unique.
- Keep required media local.
- Place `<audio>` and `<video>` as direct children of the host composition
  root so HyperFrames owns playback.
- Animate transforms and opacity rather than layout dimensions.
- Keep scene clips and the caption rail on distinct tracks.
- Update `BRIEF.md`, `STORYBOARD.md`, `frame.md`, and data artifacts when the
  implementation changes their contract.

## 7. Review as a new customer

Run the review loop before rendering:

1. Check that the first five seconds state the market thesis.
2. Confirm that every chart answers one sentence without domain guesswork.
3. Confirm that GEX, DEI, and DEX cannot be mistaken for one another.
4. Confirm that subtitles never cover scene content.
5. Confirm that the TradingFlow logo and every named ticker are present.
6. Capture midpoint snapshots for every mounted scene and inspect the contact
   sheet.
7. Run the strict HyperFrames gate.
8. Open the actual Studio project URL, inspect the intended hero frames, and
   verify the browser console has no warnings or errors.

Do not render merely because checks pass. Leave the final Studio preview open
and wait for explicit user approval.

## 8. Render and verify

After approval, follow
[production-checklist.md](references/production-checklist.md).

Do not call the task complete until the high-quality MP4 exists, is non-empty,
and `ffprobe` confirms plausible duration, resolution, video codec, and audio
stream.

## Failure recovery

- If Studio opens an empty project, restart the project-specific preview
  server and reload the full `#project/<name>` URL before rewriting code.
- If a screenshot clashes with the visual system, keep it only as evidence and
  rebuild its information as charts and editorial primitives.
- If candlesticks look amateur, replace handmade candle SVGs with locally
  vendored Lightweight Charts.
- If charts feel arbitrary, reselect them from the analytical question using
  `chart-selection.md`.
- If subtitles overlap content, create a dedicated bottom rail instead of
  nudging captions over scene art.
- If the logo looks monochrome, restore the official full-color asset rather
  than recoloring it with CSS.
- If a render command succeeds without a verified MP4, treat the delivery as
  incomplete.
