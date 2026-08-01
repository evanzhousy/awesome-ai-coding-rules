# Chart selection for TradingFlow recaps

Choose the chart from the analytical question. Do not add chart types merely
for variety.

| Question | Typical metric | Use | Required treatment | Avoid |
| --- | --- | --- | --- | --- |
| Where is a signed value relative to zero? | GEX, signed net DEX | Diverging or horizontal signed bar | Explicit zero axis; negative left, positive right; visible unit | Unsigned ranking bars or directionless area |
| How did two signed observations change? | Thursday vs Friday GEX | Grouped horizontal bars on one signed scale | Same axis and period labels; state “more” or “less negative” | Separate auto-scales |
| Who ranks highest by magnitude? | DEI magnitude, symbol premium | Horizontal bars from zero | Common scale, descending order, persistent values | Bullish/bearish arrows for a non-directional metric |
| How does a documented whole divide? | Sector premium | Donut only when the parts reconcile to 100% | Include the remainder; label every part with percent and amount | Pie for ranking, signed values, or trends |
| How did a metric move from prior to current? | Total premium, call share | Line/area chart with square points | Own scale, prior/current labels, benchmark line when applicable | Multi-axis overlays |
| What was the underlying price context? | SPX, TSLA, NVDA OHLC | TradingView Lightweight Charts candlesticks | Verified OHLC, session labels, independent price autoscale, attribution | Handmade decorative candles or an exposure overlay on the price axis |
| What happens next on the calendar? | Fed, earnings | Timeline or editorial columns | Date, event, and company ticker | A quantitative chart without a quantitative measure |

## Metric boundaries

- Treat GEX as modeled structural exposure.
- Treat DEI as non-directional magnitude. Never encode it as bullish or
  bearish.
- Treat signed net DEX as directional session flow.
- Keep underlying price on a separate panel and axis from all exposure metrics.
- Describe observed structure and flow; do not convert them into probabilities
  or price targets.

## Video chart grammar

- Make the chart's conclusion readable within about three seconds.
- Show units, scale, session, and benchmark in the frame.
- Use persistent labels; hover-only meaning does not render to video.
- Use no more axes than the viewer can parse at playback speed. Prefer one
  measure per panel.
- Keep the source values exact. Round only when the narration and on-screen
  unit make the rounding explicit.
- Keep chart marks in one hue family with lightness variation. Keep text solid.
- Pair every listed company with its ticker and compact official-color mark.

## Deterministic implementation

- Use locally vendored Lightweight Charts for candlesticks.
- Use shadcn/Recharts examples to choose the visual grammar, not as a reason to
  introduce render-time React or network dependencies into an HTML
  composition.
- Prefer authored SVG/CSS with explicit scales for simple bar, donut, and line
  charts.
- Animate bar reveals with `scaleX`, vertical bars with `scaleY`, and chart
  entrances with transforms/opacity. Do not tween layout width or height.
- For a donut, author exact percentages that sum to 100 and use square/butt
  segment ends unless the design spec says otherwise.
