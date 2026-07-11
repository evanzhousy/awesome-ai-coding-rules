# UI style harness

This document is the **UI/style harness** for TradingFlow: semantic tokens, shadcn primitives, the canonical preset, and project-specific patterns. It complements—not replaces—domain docs and agent contracts.

## Purpose and precedence

When sources disagree, use this order:

1. **`doc/knowledge/glossary.md`** and task-relevant docs under **`doc/domain-knowledge/`** (invariants and feature behavior).
2. **[`AGENTS.md`](../../AGENTS.md)** (mandatory UI rules, package commands, wiki maintenance triggers).
3. **This harness** (preset, tokens, composition habits).
4. **Current code** — do not treat implementation as permission to violate documented product or UI contracts.

## Greenfield-aligned principles for UI work

These mirror the architectural bar in [`.cursor/skills/greenfield/SKILL.md`](../../.cursor/skills/greenfield/SKILL.md); apply them to UI refactors and new surfaces.

- **Domain before chrome:** Styling and layout tasks must not change persistence, entitlements, analytics contracts, or documented behavior unless the task explicitly requires it.
- **Design before diff:** Name the surface and owning primitives (e.g. dialog rail + detail panel, popover + command list) before adding one-off styled wrappers.
- **Duplication is a decision:** When two features share a visual shape, record whether that is **one invariant** (extract a shared primitive) vs **cousins that will diverge** (keep local; avoid mode-heavy mega-abstractions).
- **Registry primitives first:** Prefer existing **`src/components/ui/*`** and documented shadcn patterns over bespoke shells.

## Preset-default over custom chrome

**Default approach:** Use the **canonical shadcn preset** ([`b4rJot2xrU`](#preset-contract-canonical-theme)) as shipped in **`src/components/ui/*`** and **`src/index.css`**. Pick the primitive’s **`variant`** (or its default) and semantic tokens. Add **layout and density only** in feature code (`mb-3`, `max-w-*`, `flex`, `gap-*`, **`toolbarSmButtonTouchClass`**, **`formControlCompactTouchClass`**).

**Do not** re-paint chrome in pages with one-off Tailwind that duplicates or overrides what the primitive already encodes (`border-border bg-background`, `bg-muted/30`, `text-rose-600` for errors, hand-rolled primary blues on buttons, extra `shadow-2xl` on dialogs). Custom classes drift from light/dark tokens, fight preset updates, and make the app look inconsistent surface by surface.

### Where styling lives

| Layer | Owns | Feature / page code |
| --- | --- | --- |
| **Theme** | `--primary`, `--background`, `--popover`, etc. in **`src/index.css`** | Change only with an explicit product decision + harness update |
| **Primitives** | Variants in **`src/components/ui/button.tsx`**, **`alert.tsx`**, **`dialog.tsx`**, **`input.tsx`**, … | Import primitive; pass **`variant`** when not default |
| **Feature UI** | Composition, spacing, responsive width, data-encoding color (documented below) | **`className`** for layout; not for redefining fill/border/hover of a variant |

When reviewing UI, ask: *“Could this be the primitive’s default variant plus layout classes?”* If yes, delete the custom paint.

### Decision guide

```
Need UI chrome?
├─ Standard control (button, alert, dialog, input, badge, select)?
│  └─ Use src/components/ui/* → variant (or omit for default) → layout className only
├─ Semantic state (error, caution, primary CTA)?
│  ├─ Error text / failed load → text-destructive or Alert variant="destructive"
│  ├─ Caution strip → bg-warning/10, text-warning-foreground (see Styling habits)
│  └─ Primary action → Button default (bg-primary), not outline + custom blue
├─ Color carries data meaning (call/put, signed metric, rank medal)?
│  └─ Allowed: Domain-specific visual encoding (documented exception)
└─ Truly new shape not covered by a primitive?
   └─ Design in ui/ or extend variant in primitive — do not fork in a page file
```

### Common anti-patterns → preset fix

| Anti-pattern (custom) | Prefer (preset-default) |
| --- | --- |
| `Button variant="outline"` for Apply / Sign in / Retry / handoff | `variant="default"` or omit `variant` |
| `className="border-border bg-background …"` on `outline` buttons or dialog triggers | `variant` only + `toolbarSmButtonTouchClass`; open state: `open && 'bg-accent text-accent-foreground'` |
| `DialogContent` / `SheetContent` with `bg-background`, `shadow-2xl` | Primitive defaults (`bg-popover`, `shadow-md`); layout: `p-0`, `max-h-*`, width |
| `Alert className="border-border bg-muted/30 text-foreground"` | `<Alert>` or `variant="destructive"`; layout: `className="mb-3"` only |
| `Badge variant="secondary"` + `border border-border bg-background` | `variant="secondary"` alone |
| `SelectContent className="… bg-popover text-popover-foreground"` | `className="max-h-*"` only |
| Boxed select with `border-border bg-background` | `border-input bg-input` + **`formControlCompactTouchClass()`** (match **`Input`**) |
| Error paragraph `text-rose-600` | `text-destructive` |
| Page-level `bg-slate-*` / `text-zinc-*` for chrome | Semantic tokens (`bg-muted`, `text-muted-foreground`, `border-border`) |

### Mechanical checks

**`src/components/ui/shadcnPresetCompliance.test.ts`** (via **`pnpm test:unit`**) scans TSX for drift: `space-*` spacing, `bg-black` scrims, ad hoc slate/zinc chrome, `text-rose-600` outside data-encoding allowlist, `bg-background` on dialog/sheet content, and muted-strip overrides on **`Alert`**. Extend that test when a repeated custom pattern appears in review—do not rely on ad hoc policing alone.

### Per-primitive quick reference

Details for buttons and forms also appear in later sections; this table is the checklist for reviews.

| Primitive | Default / variant | Feature code should add |
| --- | --- | --- |
| **`Button`** | `default` → `bg-primary`; `outline` / `ghost` for triggers | Layout/density only; see [Buttons](#buttons-button-primitive) |
| **`DialogContent`** | `bg-popover`, `text-popover-foreground`, `shadow-md` | Max width, `p-0`, flex/overflow — not `bg-background` or extra shadow |
| **`SheetContent`** | `bg-popover`, `text-popover-foreground` | Width, `p-0`, side sizing — not `bg-background` overrides |
| **`Alert`** | `default` → `bg-card`; `destructive` for failures | Layout (`mb-3`, `mx-4`); caution uses **`warning`** tokens, not `bg-muted/30` re-skin |
| **`Badge`** | `badgeVariants` | Data-encoding only; no extra border/fill on **`secondary`** |
| **`Input` / `Textarea`** | `border-input`, `bg-input`, focus ring on primitive | `h-8`, `w-full`, etc. — not repeated border/fill per screen |
| **`SelectTrigger`** | Underline preset on primitive | Boxed fields: `border-input bg-input` + **`formControlCompactTouchClass()`** |
| **`SelectContent`** | `bg-popover` on primitive | `max-h-*` only |
| **Error copy** | `text-destructive` | Not `text-rose-600` unless [data-encoding](#domain-specific-visual-encoding) |

**Data-encoding color** (call/put, signed metrics, regime chips, rank medals, etc.) is the main exception: hue may encode metric meaning in tables and chips. That exception does **not** apply to generic alerts, toolbars, or load-error paragraphs.

## shadcn as operational guideline

Treat the **shadcn skill** ([`.agents/skills/shadcn/SKILL.md`](../../.agents/skills/shadcn/SKILL.md)) and the **shadcn CLI** as the day-to-day companion to this harness. Authoritative rule tables and examples live there (including linked **`rules/*.md`**); this section only captures high-signal habits for this repo.

### Workflow

- Prefer **`pnpm dlx shadcn@latest`** (see [`package.json`](../../package.json) `packageManager`) for CLI operations; align with **`components.json`** aliases when importing.
- Before guessing APIs or props: **`pnpm dlx shadcn@latest docs <component>`**, **`search`**, or **`view`** for registry items not yet installed.
- After adding third-party registry blocks, verify imports match this project’s UI alias (see shadcn skill).

### Composition (prefer components over custom markup)

- Put menu items inside **`DropdownMenuGroup`** (and analogous **Group** wrappers per primitive).
- Use **`Empty`** for real empty states; use **`Separator`** instead of **`border-t`** / **`<hr>`** for section breaks between regions.
- Use **`Skeleton`** for loading placeholders in lists and content regions—not one-off **`animate-pulse`** blocks.
- Use **`Badge`** (and variants) instead of custom muted label **`span`**s where the UI is clearly a tag/chip.

### Styling habits

- Use **semantic tokens** (`bg-background`, `text-muted-foreground`, `border-border`, etc.), not ad hoc palette utilities for chrome—except where this harness explicitly allows **data-encoding** color (see below).
- For **warning / caution** callouts (banners, inline notices, alert strips), prefer theme **`warning`** utilities (**`bg-warning/10`**, **`text-warning-foreground`**, **`text-warning`** on icons) instead of raw **`amber-*`** chrome. Reserve **`amber-*`** for cases that are explicitly **data-encoding** alongside the option-side / flow rules below.
- Prefer **`flex` + `gap-*`** over **`space-y-*`** / **`space-x-*`**.
- Use **`size-*`** when width and height match.
- Use **`cn()`** for conditional classes.
- Do not assign manual **`z-index`** on overlays—**`Dialog`**, **`Popover`**, **`Sheet`**, etc. own stacking.
- For **icons inside `Button`**, prefer **`data-icon`** (`inline-start` / `inline-end`) when touching those buttons; repo-wide consistency may lag—adopt incrementally.

### Buttons (`Button` primitive)

Primary chrome comes from the shared **`src/components/ui/button.tsx`** primitive and preset tokens (`--primary`, `--primary-foreground` in **`src/index.css`**). Do not hand-roll per-screen blue fills.

| Role | Variant | Examples |
| --- | --- | --- |
| **Primary action** | **`default`** (omit `variant`) | Apply filters, Filter by this watchlist, Sign in / View plans in alerts, Retry in error states, drawer handoffs (Open Option Trades), Unlock, CSV export |
| **Toolbar / popover trigger** | **`outline`** or **`ghost`** | Filters opener, Columns, date/time popover triggers, Refresh in dense toolbars |
| **Secondary in a pair** | **`outline`** or **`ghost`** | Cancel, Reset form, Back, Close, Sign out |
| **Destructive** | **`destructive`** | Irreversible delete when not using a dedicated confirm pattern |

Toggle chips inside filter panels (regime pills, premium quick-picks) may stay **`outline`** with active-state classes; they are not page-level CTAs.

Do **not** re-specify variant paint on **`Button`** (for example `border-border bg-background` on **`outline`**, or `hover:bg-accent` duplicates). Use **`toolbarSmButtonTouchClass`** for density only; expanded filter triggers may add `open && 'bg-accent text-accent-foreground'`. See [Preset-default over custom chrome](#preset-default-over-custom-chrome).

### Forms

Complex forms follow **FieldGroup**, **Field**, **InputGroup**, and related patterns described in the shadcn skill. This harness documents **Input**, **Textarea**, and **InputGroup** behavior below; defer to the skill for anything beyond that.

## Preset contract (canonical theme)

This section is the **theme source** for [Preset-default over custom chrome](#preset-default-over-custom-chrome). Feature code should consume tokens and primitives—not redefine colors here.

This project aligns with the **shadcn/ui** theme created from:

**[New Project — preset `b1aIaoaxs`](https://ui.shadcn.com/create?preset=b1aIaoaxs)**

That preset selects **base-luma**, **Base UI**, **neutral** base + **neutral** primary (near-black CTAs), **Inter** (body + heading), **default** radius (`--radius: 0.625rem`), Lucide icons, and blue chart colors. Use it when regenerating or comparing primitives so tokens and component chrome stay consistent.

**Stack model (do not conflate layers):**

| Layer | Owns | Source |
| --- | --- | --- |
| **Luma primitives** | Geometry, spacing rhythm, soft elevation, component variants | `components.json` `style: base-luma`, `src/components/ui/*` |
| **Apple Design (feel)** | Springs, press feedback, materials, reduced-motion / transparency | `src/lib/motion/springs.ts`, utilities in `src/index.css`, this section |
| **Product density** | Compact tables / toolbars vs breathable settings | Feature layout only; dense data apps stay compact |
| **Data encoding** | Call/put, signed metrics, rank medals | Documented exceptions below |

**Team practice — single preset:** Treat **`b1aIaoaxs`** as the only canonical shadcn preset for this app. Do not switch to another preset URL/code, fork a parallel theme in feature code, or merge primitives from a different preset without an explicit product decision and harness updates. **`components.json`** in the repo root is the checked-in contract (`style`, `baseColor`, `iconLibrary`, registry paths); keep it aligned with this preset when adding or refreshing components. When a control needs different chrome app-wide, **change the primitive variant or CSS variables**—not a one-off override in a page file.

**Local Base UI compatibility:** After any `pnpm dlx shadcn@latest apply …` reinstall, re-verify **`asChild`** / `getRenderAsChildProps` on Button, TooltipTrigger, PopoverTrigger, DropdownMenuTrigger, Sheet, Dialog, Sidebar, etc., plus **`showOverlay`** on Sheet. Upstream Luma sources omit those shims.

To (re)apply the preset via CLI:

```bash
pnpm dlx shadcn@latest apply b1aIaoaxs -y
# Theme/fonts only (safer):
pnpm dlx shadcn@latest apply b1aIaoaxs --only theme,font -y
```

CLI reference: [shadcn/ui CLI](https://ui.shadcn.com/docs/cli).

## Apple Design integration (feel)

Luma is the **visual** baseline (soft, rounded, “Tahoe minus glass”). Apple Design rules own **interaction feel**. Do not treat the preset as a substitute for motion/materials work.

### Springs (`src/lib/motion/springs.ts`)

| Token | Use | Bounce |
| --- | --- | --- |
| **`springs.ui`** | Default UI motion | `0` (critically damped) |
| **`springs.sheet`** | Sheets / drawers settle | `0` unless velocity handoff |
| **`springs.momentum`** | After a flick only | `~0.15` |
| **`springs.popover`** | Menus / popovers | `0` |

Helpers: **`projectMomentum`**, **`rubberband`**. Prefer Motion springs for anything gesture-driven.

**Base UI sheets/dialogs** cannot use Motion springs on enter/exit (they drive motion via `data-starting-style` / `data-ending-style`). Use the CSS approximations:

| Export | Value |
| --- | --- |
| **`cssSpringEase.ui`** | `cubic-bezier(0.32, 0.72, 0, 1)` (no overshoot) |
| **`cssSpringDurationMs.sheet`** | `300` (matches `springs.sheet.duration`) |

`Sheet` applies those on overlay + panel (full-edge travel, soft Luma side radii). `Dialog` uses the same ease/duration on fade/zoom.

### Materials & press

- Sticky toolbars / floating chrome that content scrolls under: **`material-chrome`** or **`material-chrome-heavy`** (`src/index.css`). Opaque surfaces for dense tables.
- Do **not** stack light translucent layers on light translucent layers.
- Instant press feedback: Button uses **`active:scale-[0.97]`**; other interactive chips/rows may use utility **`press-scale`**.
- Scrims: prefer **`bg-foreground/20`** + **`backdrop-blur-*`**, not raw **`bg-black`**.

### Accessibility

- **`prefers-reduced-motion`**: keep feedback, suppress large translate/spring (global CSS short-circuits durations; Motion consumers should also branch).
- **`prefers-reduced-transparency`**: materials fall back to solid **`background`**.
- **`prefers-contrast: more`**: materials gain a defined border and solid fill.

### Density

- **Breathable (Luma default):** settings, auth, empty states, marketing-ish cards.
- **Compact (product rule):** Option Trades / Rank tables, dense toolbars — layout/padding only; do not invent a second component library. Prefer smaller **`size`** variants and **`h-8` / `text-xs`** over re-painting chrome.

## Project tokens and geometry

### Badges and tags (chips)

**Corner radius:** Badges and tags follow **Luma soft geometry** (pill / **`rounded-3xl`** on the shared primitives). Feature code should not add competing **`rounded-*`** on **`Badge`** / **`Tag`** unless a task explicitly diverges.

**Exceptions:** **Tabs**, **avatars**, **progress tracks**, **notification dots**, **live-indicator pings** keep their own geometry. **Data-encoding chips** may still use hue rules below without inventing new corner systems.

### Global corner radius (application chrome)

Rectangular UI surfaces use **soft Luma radius** project-wide:

- **`src/index.css`**: **`--radius: 0.625rem`** drives **`--radius-sm`** … **`--radius-4xl`** in **`@theme inline`**.
- **`tailwind.config.js`**: **`theme.extend.borderRadius`** maps **`rounded-*`** to those CSS variables; **`rounded-full`** stays **`9999px`** for intentional circles.
- Dialogs use **`rounded-4xl`**; buttons often **`rounded-4xl`** (near-pill); cards **`rounded-4xl`** / soft elevation.

Do **not** reintroduce project-wide **`rounded-none`** chrome (legacy Sera). **`rounded-none`** is only for intentional density hacks or calendar range middles where the primitive already encodes it.

### Borderless cards and surfaces

**Preference:** Application **`Card`** components and card-like shells should not show a visible stroke. Treat **no border** as the default.

- In Tailwind, prefer **`border-0`** (and avoid adding **`border`**, **`border-border`**, or decorative **`ring-*`** on cards) unless a task explicitly calls for a visible outline.
- The shared **`src/components/ui/card.tsx`** base styles encode this: soft radius + **`bg-card`** / shadow for separation from the page, not a hard line.
- When composing cards in feature code, do not reintroduce **`border`** or rings “for definition”; that fights the design contract (see **`AGENTS.md`** — shadcn surfaces stay borderless unless required).

**Exceptions:** Only add borders or strong outlines when the product spec or accessibility requires a distinct boundary (e.g. a true focus ring, not card chrome).

## Form controls (`Input`, `Textarea`)

**Single-line fields** use the shared **`src/components/ui/input.tsx`** primitive. **Multi-line fields** use **`src/components/ui/textarea.tsx`**. Both encode the same **filled control** look so text fields read clearly on **`popover`**, **`card`**, and **`background`** surfaces.

For broader form layout and validation patterns, see **`.agents/skills/shadcn/SKILL.md`** (forms rules).

**Default chrome (do not re-copy per screen):**

- **Geometry:** soft Luma radius from the primitive (typically **`rounded-3xl` / radius tokens**) — matches [Global corner radius](#global-corner-radius-application-chrome).
- **Stroke & fill:** semantic **`border-input` / `bg-input`** (or Luma soft muted fills) from **`src/index.css`**, not ad hoc grays.
- **Typography:** **`text-foreground`**; placeholders **`placeholder:text-muted-foreground`** (already on the primitive).
- **Focus:** **`focus-visible:border-ring`**, ring utilities on the primitive — consistent with other focused controls.
- **Invalid:** Set **`aria-invalid={true}`** when validation fails; the primitive applies **`aria-invalid:*`** destructive border and ring. Prefer this over hand-rolled **`border-destructive`** classes on each usage.

**Feature code should:**

- Import **`Input`** / **`Textarea`** and pass only **layout or density** overrides when needed (e.g. **`h-8`**, **`w-24`**, **`text-xs`**, **`text-center`**, extra **`pl-*`** for icons).
- **Avoid** repeating **`border-*`**, **`bg-input`**, **`bg-background`**, or focus-ring utilities on every instance — that drifts from the shared contract.

**Exceptions — composite fields (`InputGroup`):**

- **`src/components/ui/input-group.tsx`** wraps a control + addons (e.g. command palette search). The **wrapper** keeps the **underline** treatment (`border-b-input`); **`InputGroupInput`** intentionally uses **`border-0 bg-transparent`** on the inner **`Input`** so the group reads as one surface. Do not “box” the inner input without revisiting the whole group pattern.

**Native `<input>` / `<select>` outside primitives:**

- Rare controls (e.g. pagination jump fields in **`src/components/ui/data-table.tsx`**) should **mirror the same tokens** (`border-input`, `bg-input`, `rounded-none`, focus-visible ring) so they visually match **`Input`**.

## Charts (shadcn + Recharts)

2D charts in this app use the shared **`ChartContainer`** primitive in **`src/components/ui/chart.tsx`**, which wraps **Recharts** and injects per-series CSS variables from a **`ChartConfig`**. Recharts renders to **SVG** under the hood—that is expected and correct; do not hand-roll SVG or swap libraries for standard time series, bars, or composed charts.

Authoritative upstream docs: [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart). This project’s theme tokens are **full colors** (`oklch(...)` in **`src/index.css`**), not legacy HSL **channels**. That distinction drives most chart visibility bugs.

### When to use which stack

| Need | Use | Do not use |
| --- | --- | --- |
| Time series, bars, area, skew/IV lines, OI history, intraday flow | **`ChartContainer`** + Recharts (`Line`, `Bar`, `ComposedChart`, …) | Three.js, raw SVG paths, Plotly |
| 3D GEX/IV surface, OI Time Machine bar matrix | **`src/lib/threeCharts/runtime`** + scene components (`GexIvThreeSurfaceCanvas`, `OiTimeMachineThreeCanvas`, …) | Recharts (no real 3D) |
| Simple pie without shadcn chrome | Recharts `PieChart` directly (e.g. KPI strip) with **`var(--success)`** / **`var(--destructive)`** fills | `hsl(var(--token))` wrappers |

### Correct implementation pattern

1. **Define `chartConfig`** with human-readable labels and **bare `var(...)` colors** (or literal hex / `hsl(…)` values that are complete colors).
2. **Wrap the Recharts chart** in **`<ChartContainer config={chartConfig} className="… min-h-[VALUE] w-full">`** — height (or `min-h-*` / `aspect-*`) is required so **`ResponsiveContainer`** can measure on first paint.
3. **Reference series colors** via injected keys: **`stroke="var(--color-iv)"`**, **`fill="var(--color-callOi)"`**, etc. (`ChartStyle` maps `chartConfig` keys to `--color-{key}` on the container).
4. **Tooltips / legend** — prefer **`ChartTooltip`** + **`ChartTooltipContent`** and **`ChartLegend`** + **`ChartLegendContent`** from **`@/components/ui/chart`**.
5. **Accessibility** — add **`accessibilityLayer`** on the root Recharts chart (`LineChart`, `BarChart`, `ComposedChart`, …) when adding or touching a chart.

**Example (canonical shape):**

```tsx
const chartConfig = {
  iv: { label: 'IV', color: 'var(--chart-1)' },
  delta: { label: 'Delta', color: 'var(--chart-2)' },
} satisfies ChartConfig;

<ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
  <LineChart accessibilityLayer data={points} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="date" tickLine={false} axisLine={false} />
    <YAxis tickLine={false} axisLine={false} width={48} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line dataKey="iv" type="monotone" stroke="var(--color-iv)" strokeWidth={2} dot={false} connectNulls />
    <Line dataKey="delta" type="monotone" stroke="var(--color-delta)" strokeWidth={2} dot={false} connectNulls />
  </LineChart>
</ChartContainer>
```

**Semantic series (call/put, bull/bear)** — use theme tokens directly in config, same rule (no `hsl()` wrapper). Use explicit semantic keys (`call`, `put`, `bullish`, `bearish`) instead of generic `positive` / `negative` when the data meaning is option side or flow direction:

```tsx
call: { label: 'Call', color: 'var(--success)' },
put: { label: 'Put', color: 'var(--destructive)' },
bullish: { label: 'Bullish', color: 'var(--success)' },
bearish: { label: 'Bearish', color: 'var(--destructive)' },
```

**Data-encoding literals** — allowed when the series is not tied to `--chart-N` (e.g. fixed call/put hues in Market Rank day trend). Use a **complete** color string:

```tsx
color: 'hsl(142, 71%, 45%)',  // OK — literal, not wrapping a CSS variable
```

Shared cookbook fills: **`src/components/cookbooks/cookbookChartColors.ts`** documents the same rule (`var()` only; tokens are full colors).

### Color tokens — critical rule

Theme variables in **`src/index.css`** are already resolved colors:

```css
--chart-1: oklch(0.809 0.105 251.813);
--primary: oklch(0.488 0.243 264.376);
```

| Pattern | Result |
| --- | --- |
| `color: 'var(--chart-1)'` then `stroke="var(--color-iv)"` | **Correct** — lines/bars visible in light and dark |
| `color: 'hsl(var(--chart-1))'` | **Invalid** — browser parses `hsl(oklch(...))`; strokes often **invisible** while tooltip/hover dots still work |
| `stroke="hsl(var(--primary))"` on `ReferenceLine` | **Same bug** — use `stroke="var(--primary)"` |
| `stroke="var(--chart-1)"` without `chartConfig` | **OK** for one-off reference lines if the key is not in config |

**Symptom:** Data and tooltip work; grid and axes show; **series lines/bars do not**. Fix config/reference strokes first before debugging data or Recharts version.

After [Recharts v3 / current shadcn chart docs](https://ui.shadcn.com/docs/components/base/chart), prefer **`var(--chart-1)`** over older examples that used **`hsl(var(--chart-1))`** when variables were HSL components.

### Anti-patterns → fix

| Anti-pattern | Prefer |
| --- | --- |
| `hsl(var(--chart-N))`, `hsl(var(--primary))`, `hsl(var(--success))` in `chartConfig` or `stroke`/`fill` | `var(--chart-N)`, `var(--primary)`, `var(--success)` |
| Chart without `ChartContainer` / `chartConfig` but ad hoc stroke colors per screen | `ChartContainer` + `var(--color-{seriesKey})` |
| `ChartContainer` with no height / `min-h` / `aspect-*` | `className="h-[240px] w-full"` or `min-h-[200px] w-full` |
| Custom SVG chart for standard 2D series | Recharts + shadcn chart primitives |
| Plotly or extra chart lib for 2D app charts | Existing Recharts stack |
| Recharts for 3D strike × expiry × metric surfaces | `threeCharts` scene components |

### Review checklist

- [ ] Every `chartConfig` color is `var(--…)` or a **literal** complete color — never `hsl(var(--…))` on theme tokens.
- [ ] Series use `var(--color-{key})` matching `chartConfig` keys (or documented direct `var(--chart-N)` on reference lines).
- [ ] `ChartContainer` has explicit height or `min-h-*`.
- [ ] Tooltip uses `ChartTooltip` / `ChartTooltipContent` unless there is a strong reason not to.
- [ ] 3D surfaces stay on Three.js; 2D tabs stay on Recharts.

### Reference implementations

| Surface | File |
| --- | --- |
| Contract Greeks / IV trend (line chart) | **`src/pages/contractFlowRank/components/ContractInspectionPanels.tsx`** |
| Intraday flow (composed bars) | **`src/pages/contractFlowRank/components/ContractIntradayChart.tsx`** |
| Vol context (IV vs RV, cone) | **`src/components/vol-context-panel/index.tsx`** |
| GEX ranking / skew / vol explorer | **`src/pages/optionChainAnalysis/components/GexRankingChart.tsx`**, **`GexSkewExplorer.tsx`**, **`GexVolExplorer.tsx`** |
| OI timeline 2D slices | **`src/pages/chainScreener/components/OiTimelineChart.tsx`** |
| 3D surfaces (not Recharts) | **`src/pages/optionChainAnalysis/components/GexIvThreeSurfaceCanvas.tsx`**, **`src/pages/chainScreener/components/OiTimeMachineThreeCanvas.tsx`** |

When adding a repeated chart color mistake in review, consider extending **`src/components/ui/shadcnPresetCompliance.test.ts`** with a scan for `hsl(var(--chart-` / `hsl(var(--primary))` in chart files—same approach as other UI drift checks.

## Domain-specific visual encoding

These are **product / data-encoding** exceptions to “semantic tokens only” for generic chrome. Do not reuse these palettes for unrelated UI.

### Option side and flow direction

When color encodes **contract side** or **bullish vs bearish flow**, use a consistent pair so tables and tags read the same everywhere:

- **CALL** and **bullish** tags / accents / chart series → **green**. Prefer semantic theme tokens in charts (**`var(--success)`** via **`ChartConfig`**) and use filled chips with **`text-white`** on **`bg-green-600`** / darker hover when rendering option-side tags; tune for dark mode where needed.
- **PUT** and **bearish** tags / accents / chart series → **red**. Prefer semantic theme tokens in charts (**`var(--destructive)`** via **`ChartConfig`**) and use filled chips with **`text-white`** on **`bg-red-600`** / darker hover—same visual weight as call chips; avoid destructive-text-only on transparent backgrounds for table type badges.
- For KPI bars where the **value is unsigned** but each row has a contract side (for example Vol/OI leaders), bar hue should encode **CALL green / PUT red** while bar length encodes magnitude.
- For KPI bars where the **value is signed flow** (for example signed Net DEI), bar hue should encode **bullish green / bearish red** while bar length encodes absolute magnitude.

This is intentional **data-encoding** color (see **`AGENTS.md`**: ad hoc greens/reds are allowed when the hue carries semantic meaning for the metric). Do not use the same green/red palette for unrelated UI chrome.

### Table inline progress bars (mini-bars)

Use thin in-cell bars to show **relative magnitude** next to a numeric value. Prefer **gradients** over flat fills so the bar reads as a meter, not a solid block. Tracks and fills use **square corners** (no `rounded-*` on bar chrome).

**Unsigned or “share of whole” metrics** (e.g. total vs column max, or a 0–100% share where sign does not apply):

- Use a **blue** gradient for the filled segment only, for example **`bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400`** on the inner fill; keep the track on **`bg-muted`**.
- Do not use green/red for these unless the column itself encodes call/put or bull/bear **by design** (see Option side above).

**Signed metrics** (values can be meaningfully negative or positive, e.g. net premium, net delta exposure):

- Treat the bar as a **center baseline**: **negative** fills **to the left** of center; **positive** fills **to the right** of center.
- **Negative** segment → **red** gradient (e.g. **`bg-gradient-to-l from-rose-700 via-rose-500 to-rose-400`**).
- **Positive** segment → **green** gradient (e.g. **`bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400`**).
- Layout pattern: two equal halves (`flex` + `flex-1`), first half **`justify-end`** for the red segment anchored at the center, second half **`justify-start`** for the green segment anchored at the center.
- **Geometry:** tracks and fills use **square corners** (`rounded-none` / no `rounded-*` on bar chrome) — consistent with [Global corner radius](#global-corner-radius-application-chrome).

**Reference implementation:** Volume Ranking (`Symbol-level analysis`) table — **`src/pages/marketAnalysis/OptionTradesMarketRank/MarketRankPage.tsx`** (`MARKET_RANK_BAR_GRADIENT`, `MARKET_RANK_SIGNED_*`).

### Brand glyphs (share buttons)

Social-share icon buttons may tint **on hover only** with the network's own brand hue applied to a logo SVG (e.g. `hover:text-[#FF4500]` for Reddit). This is a narrow **brand-identity** exception, not generic chrome: the resting state stays `text-muted-foreground`, the hex appears only on `:hover`, and it must sit on an actual brand glyph — never on app buttons, text, or surfaces. Hoist the hues into a single labeled constant map so the intent reads as deliberate rather than drift.

**Reference implementation:** Market Recap share bar — **`src/pages/marketRecap/RecapShareBar.tsx`** (`BRAND_HOVER`).

## Overlays (modal scrims)

Dialog, alert-dialog, and sheet **overlays** should dim the page using **theme tokens** (for example foreground/background with opacity), not ad hoc palette utilities such as **`bg-black/*`**. That keeps scrims aligned with light/dark CSS variables from the shadcn theme. Shared primitives live under **`src/components/ui/`** (`dialog`, `alert-dialog`, `sheet`).

## Related references

- **[`AGENTS.md`](../../AGENTS.md)** — UI rules, shadcn baseline, observability triggers.
- **[`doc/knowledge/glossary.md`](../knowledge/glossary.md)** — canonical terms.
- **`doc/domain-knowledge/`** — invariants and feature behavior when UI work touches product contracts.
- **[`.agents/skills/shadcn/SKILL.md`](../../.agents/skills/shadcn/SKILL.md)** — full shadcn/ui operational rules for this repo.
