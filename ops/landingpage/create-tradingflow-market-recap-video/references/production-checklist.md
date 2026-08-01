# Production and delivery checklist

Run commands from the HyperFrames project directory and use its package
scripts or pinned CLI wrapper.

## Before final preview

- Confirm the recap URL and date.
- Confirm every claim against the published article.
- Confirm additional OHLC data against the approved data artifact.
- Confirm the final duration, scene timings, and narration.
- Confirm the official TradingFlow logo appears throughout.
- Confirm each named company includes its ticker and entity mark.
- Confirm the bottom subtitle rail is reserved and captions do not overlap art.
- Confirm every chart has units, period, scale, and persistent labels.
- Confirm all required fonts, images, audio, and libraries are local.

Run a focused gate at scene midpoints:

```bash
npx hyperframes check --at <scene-midpoints> --snapshots
```

Inspect every PNG and the contact sheet. Then run the final gate:

```bash
npx hyperframes check --samples 18 --strict
```

Open the live Studio URL:

```text
http://localhost:<actual-port>/#project/<project-name>
```

Inspect the opening, each analytical chart, the subtitle rail, and the closing
disclosure. Check browser warning/error logs. Wait for explicit user approval.

## CLI version gate

Probe the pinned version before the first render-affecting command:

```bash
npx hyperframes@latest upgrade --project . --check --json
```

If the project is behind, apply the upgrade and rerun the strict check:

```bash
npx hyperframes@latest upgrade --project .
npx hyperframes check --samples 18 --strict
```

If the upgraded check fails, restore the previous pin, continue with that
version, and report why. If `npx` installation stalls, use an already-installed
matching version or the project's working wrapper; never silently fall back to
an older CLI.

## Final render

Use a stable output name:

```bash
npx hyperframes render \
  --quality high \
  --output renders/tradingflow-market-recap-YYYY-MM-DD.mp4
```

Verify the artifact:

```bash
test -s renders/tradingflow-market-recap-YYYY-MM-DD.mp4
ffprobe -v error \
  -show_entries \
  format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels \
  -of json \
  renders/tradingflow-market-recap-YYYY-MM-DD.mp4
shasum -a 256 renders/tradingflow-market-recap-YYYY-MM-DD.mp4
```

Expect the authored duration, 1920×1080, 30fps, H.264 video, and an AAC audio
stream unless the brief explicitly chooses another format.

## Distribution handoff

Before an external upload, confirm or state:

- destination channel/account;
- title and description;
- audience setting;
- visibility;
- thumbnail;
- whether the user wants publishing now or a draft.

Never infer `Public` from “upload.” If visibility is omitted, state that the
safer default is `Unlisted` before uploading.

For an accompanying X post, keep the standard post within 280 characters:

- open with the market thesis;
- include two or three exact facts;
- end with a short watch/read call to action;
- include `NFA` or the appropriate disclaimer;
- avoid hashtags that consume space without adding discoverability.
