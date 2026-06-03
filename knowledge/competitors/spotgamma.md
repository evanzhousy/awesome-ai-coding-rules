# SpotGamma — methodology (competitor note)

**Design of this note (greenfield):** This file is the **single competitor-methodology contract** for SpotGamma: **what they teach**, **how procedures stack**, **which product surfaces implement which ideas**, and **where the evidence lives**. *Owner:* strategy / competitive intel readers. *Boundary:* public [blog](https://spotgamma.com/blog/), [case studies](https://spotgamma.com/case-studies/), [Support Center](https://support.spotgamma.com/hc/en-us), and YouTube video metadata, not a substitute for the live product spec.

**North star (one sentence):** SpotGamma's published teaching is **structure-first, flow-confirmed, vol-framed**: use **options positioning (dealer gamma, vanna, charm)** to pre-define **levels at which price is expected to behave mechanically** (Put Wall, Call Wall, Hedge Wall, Volatility Trigger, key gamma strikes, JPM Collar anchors), use **real-time hedging flow** (HIRO) to **time** entries at those levels, and use **cross-sectional vol + skew + term structure** (Compass, Volatility Dashboard, VVIX) to frame **regime** and **direction**.

Public positioning: **options-driven key levels for indices and equities**, with a named proprietary level set and daily commentary. Primary narrative channels: [SpotGamma blog](https://spotgamma.com/blog/), [case studies](https://spotgamma.com/case-studies/) (trade walkthroughs by Doug Pless, Brent Kochuba), [Support Center / Glossary](https://support.spotgamma.com/hc/en-us) (methodology + trading examples), and [YouTube](https://www.youtube.com/c/spotgamma). Dashboard entry: `dashboard.spotgamma.com`.

The **analysis patterns** table is the **canonical lens catalog**. The **sample workflows** are the **ordered procedures** case studies and Founder's Note examples repeatedly follow. **Platform operators** maps **product surface → pattern**—same invariant as the pattern rows, not a parallel ontology.

---

## Analysis patterns (summary)

These are the **recurring analysis patterns** in SpotGamma's published teaching: *what kind of question they ask* and *what lens they apply*. Pair with [Sample analysis workflows](#sample-analysis-workflows-as-their-teaching-stacks-it) for ordering, and with [Reference material](#reference-material) for sources.

| Pattern | Question they foreground | Typical move |
|--------|---------------------------|--------------|
| **Dealer gamma regime** | Is aggregate dealer gamma **positive** (stabilizing, mean-reverting) or **negative** (amplifying, momentum)? | Read [TRACE](https://support.spotgamma.com/hc/en-us/articles/33607907909011) **gamma heatmap** colors (blue = positive, red = negative) and the [Volatility Trigger](https://support.spotgamma.com/hc/en-us/articles/15297954935699-Volatility-Trigger) vs spot. |
| **Structural key levels** | Where do **named levels** predict **support / resistance / pin / repel**? | Put Wall, Call Wall, Hedge Wall, Volatility Trigger, Key Gamma Strike, Zero Gamma, JPM Collar anchors—published with empirical hit rates (e.g. Call Wall held ~83% intraday, ~88% at close). |
| **Real-time hedging flow (HIRO)** | **Right now**, are dealers being forced to buy or sell? | [HIRO](https://support.spotgamma.com/hc/en-us/articles/15169160339475) for call vs put buying/selling and implied **MM stock hedging direction**; HIRO Flow Alerts for inflections. |
| **Compass quadrant (vol × skew)** | Is this name a **directional bias × cheap/expensive vol** combination? | [Compass](https://support.spotgamma.com/hc/en-us/articles/39936536033171) places name in quadrant from **IV Rank** (y) × **Risk Reversal percentile** (x); upper-left = bullish + expensive vol, lower-right = bearish + cheap vol. |
| **Vanna / IV-driven hedging** | Is price moving because **IV is changing** (not because of spot)? | [Vanna](https://support.spotgamma.com/hc/en-us/articles/16876455544851-Vanna) + [SpotGamma Vanna Model](https://support.spotgamma.com/hc/en-us/articles/15350867797267): vol crushes → dealer-short-puts buy back shorts → "mechanical" rally. [SIV model](https://support.spotgamma.com/hc/en-us/articles/15350867797267) projects IV given spot moves. |
| **Charm / time decay pressure** | Does **time itself** force dealers to hedge into the close? | [Charm Pressure Heatmap](https://support.spotgamma.com/hc/en-us/articles/33608198289043); blue = more support into close, red = less; charm "pin" zones especially matter for 0DTE. |
| **0DTE transient stability** | How much of current stability is **short-dated** and **resets overnight**? | Read the [0DTE](https://spotgamma.com/0dte/) share of flow; treat intraday positive gamma built from 0DTE sellers as not persistent to next session. |
| **Skew & tail positioning** | Are traders **paying up** for downside (puts) or upside (calls)? | SPX and single-stock **put skew / call skew percentiles** (e.g. "put skew 99th / call skew 2nd"); `25D Risk Reversal` for asymmetry. |
| **Term structure / forward IV** | Is the **event** being fairly priced? | SPX [term structure](https://support.spotgamma.com/hc/en-us/articles/4413973361427-Term-Structure) (backwardation vs contango) and [Forward-adjusted IV](https://support.spotgamma.com/hc/en-us/articles/15249178424595-Forward-Implied-Volatility) vs spot IV around CPI/NFP/FOMC/OPEX/VIX expiration/earnings. |
| **VVIX (vol of vol) divergence** | Is **institutional** demand for **VIX options** rising before spot VIX moves? | VVIX > ~125 with flat VIX = pre-positioning signal; historically **+70% SPY upside over 10-20d** after closes ≥ 125 and **VIX falls ~80%** of the time (SpotGamma scatter analysis). |
| **Concentrated flow anchors** | Is one **named trade** (JPM Collar, huge VIX call blocks, FlowPatrol-flagged prints) reshaping dealer gamma? | Track [JPM Collar](https://support.spotgamma.com/hc/en-us/articles/12763513348243-JPM-Collar) quarterly strikes and rolls; [FlowPatrol](https://spotgamma.com/flowpatrol/) alerts on outsized volume. |
| **Expiration mechanics** | How will **OPEX / VIX exp / quarter-end** redistribute gamma? | Pre-event: size notional at risk; post-event: "shock absorber loss" narrative when stabilizing positioning rolls off. |
| **Single-stock positioning (Synthetic OI)** | Where is **real single-name positioning**, not just total OI? | [Synthetic OI model](https://support.spotgamma.com/hc/en-us/articles/39946919887891-What-is-the-Equity-Hub-Synthetic-OI-Open-Interest-Model) infers opened vs closed, and composes Put/Call Impact charts for entries and targets. |
| **Realized vs implied vol** | Is the market **underpricing** or **overpricing** future motion? | IV−RV spread; VIX ≈ RV + ~5 pts as baseline; spreads > ~10 pts flagged as unstable (resolves either way). |
| **Dispersion / cross-sectional** | Does **index calm** hide **single-stock chaos**? | Compass + Volatility Dashboard heatmaps: mega-caps can be >20% off highs while SPX is ~1.5% off ATH; reload hypothesis accordingly. |

**How to use this table:** Rows are **patterns**, not a strict pipeline. Case studies typically stack **Compass quadrant + single-stock structural levels + HIRO flow** (intraday single-stock), while weekly blog posts stack **dealer gamma regime + term structure + skew + concentrated flow anchors + expiration mechanics**. The [Reference material](#reference-material) section lists the specific posts, case studies, and KB articles that anchor each pattern.

---

## Sample analysis workflows (as their teaching stacks it)

These are **composite** procedures implied by SpotGamma's **case studies**, **Founder's Note trading examples**, **Support Center trading examples**, and **blog** structure — not a single officially published "SpotGamma playbook," but faithful to how their walkthroughs chain surfaces.

### Workflow A — Intraday single-stock (dominant case-study shape)

Verified across 6 equity case studies (MSTR, TSLA, AAPL, AMZN, PLTR, MSFT, Meta) and the Strategy breakdown, all authored by Doug Pless.

1. **Screen via Compass.** Place the symbol on the quadrant: **IV Rank** × **Risk Reversal percentile**. Upper-left (high IV + bullish skew asymmetry) = *bullish + expensive vol*; lower-right (low IV + bearish RR) = *bearish + cheap vol*. Compass is an **idea filter**, not a trigger. Evidence: [MSTR case](https://spotgamma.com/spotgamma-flags-breakdown-in-strategy-mstr-stock-trade/), [AAPL](https://spotgamma.com/apple-breaks-gamma-support-delivers-18-1-intraday-trade/), [AMZN Compass 900%](https://spotgamma.com/case-study-the-amzn-trade-compass-nailed-for-900-upside/), [PLTR swing](https://spotgamma.com/pltr-swing-trade-max-profit/).
2. **Pull structural levels from Equity Hub.** Note **Hedge Wall** (single-stock analog of Volatility Trigger), **Key Gamma Strike**, **Call Wall**, **Put Wall**, and any **Low Volatility Point** from the Put & Call Impact chart (used explicitly in the [TSLA gamma-pin break](https://spotgamma.com/tesla-breaks-gamma-pin-intraday-short/)).
3. **Wait for price to interact with a named level.** Entries are **above** a Hedge Wall on a reclaim (bullish) or **below** a Call Wall on a break (bearish), or **failure at Key Gamma Strike** for a pin-break trade.
4. **Require HIRO confirmation.** A *HIRO Flow Alert* + real-time direction of call vs put buying/selling, and the **implied MM hedging side** (e.g. "traders buying puts + selling calls → MM sells stock"). Without HIRO confirmation, the thesis is not armed.
5. **Enter just beyond the level.** Stop is typically $0.50–$1 back *inside* the level (all equity case studies show this). Targets are successive **liquidity zones + Hedge Wall / Key Gamma**; not arbitrary R-multiples — they are **named structural zones**.
6. **Scale out at each named target.** Case-study exits consistently: partial at liquidity zone, runner to Hedge Wall / Gamma target, full exit when **HIRO flow flattens / reverses**.
7. **Optionally structure the payoff.** Stock shares for simple directional intraday; **unbalanced call butterfly** for defined-risk swing (PLTR 6-day example); **0DTE iron condor** when thesis is mean-revert-to-pin (see Workflow B).

### Workflow B — Intraday index / SPX (TRACE + HIRO dominant)

Verified across [TRACE Unveils When to Short SPX](https://spotgamma.com/trace-unveils-when-to-short-sp-500/) (Dec 10, 2024) and [This SPX Trade Hit Big With 12:1](https://spotgamma.com/case-study-spx-trade-12-1-reward-risk-payoff/) (Nov 13, 2025).

1. **Regime via TRACE Gamma Heatmap.** Red everywhere = **negative gamma** → expect amplification and potential trend day; blue zones = stabilizing. Note the **Stability Index** value (cited at 31% in the SPX 12:1 case as "low stability = directional potential").
2. **Identify "magnet" strikes.** High-percentile (e.g. 99th) charm/gamma concentrations act as **pin targets** (6035 in the TRACE Dec-10 case, 6770 in the Nov-13 case).
3. **Read Put Wall and Volatility Trigger.** A **falling** Put Wall and Vol Trigger reinforces a bearish setup; Vol Trigger is the **key regime pivot** — below it, realized vol is modeled to expand.
4. **HIRO on SPX for timing.** Flow inflection (e.g. call selling + put buying at a resistance) marks the trigger. The *Delta Pressure* flipping negative is cited as a corroborating signal.
5. **Choose structure for the regime.** Directional **0DTE call/put spread** for a trending move, or **0DTE iron condor** to "sell volatility into the pin" when the thesis is mean-reversion to a magnet strike.
6. **Manage to the pin.** Transition directional → neutral as price approaches the magnet; close on pin-hit or HIRO exhaustion.

### Workflow C — Weekly macro / Sunday-note framing (blog shape)

Verified across 7 blog posts [Vol Crush](https://spotgamma.com/will-the-vol-crush-rally-last/), [0DTE Underbelly](https://spotgamma.com/the-markets-0dte-underbelly-is-exposed/), [New Volatility Regime](https://spotgamma.com/the-new-volatility-regime/), [After OPEX](https://spotgamma.com/after-opex-market-loses-its-shock-absorber/), [March OPEX](https://spotgamma.com/march-opex-tipping-point-or-turning-point/), [Options Market Trapdoor](https://spotgamma.com/the-options-market-trapdoor/), [Right Tail Risk Is Building](https://spotgamma.com/right-tail-risk-is-building-in-the-sp-500/), [How One Key Level Drove the Rally](https://spotgamma.com/how-one-key-level-drove-last-weeks-rally/).

1. **Set the calendar.** Note upcoming OPEX, VIX expiration, FOMC, CPI, NFP, earnings season; size **delta-notional** at risk for expirations (e.g. "March OPEX ~$1.3T delta notional").
2. **Check SPX gamma regime.** TRACE heatmap and whether spot is **above or below the Volatility Trigger**; negative-gamma duration is itself a theme ("weeks of negative gamma" / "negative gamma trapdoor below 6,900").
3. **Inspect term structure and IV−RV.** Contango vs backwardation; forward IV spread at CPI/FOMC/VIX-exp dates; IV−RV flipping sign ("options underpricing motion" vs "priced-in premium").
4. **Read skew and tail positioning.** Put-skew percentile, call-skew percentile, **25D risk reversal** for SPX and sector baskets; extreme put skew with flat tape is flagged as **reversal risk** (right-tail squeeze).
5. **Inspect concentrated flow anchors.** JPM Collar legs and strike, large VIX call blocks (FlowPatrol), major single-stock Synthetic OI clusters.
6. **Cross-sectional dispersion via Compass.** Map mega-caps into quadrants; flag divergence between **flat index + chaotic single stocks**.
7. **State a scenario set with named pivots.** Blog posts conclude with an explicit **Risk Pivot** level and "if we break X we see Y; if we reclaim X we see Z" phrasing, not a single point forecast.
8. **Stay humble about sign direction.** Even a **vanna-driven rally is described as "mechanical, not an all-clear"** — a deliberate epistemic hedge (see [Vol Crush](https://spotgamma.com/will-the-vol-crush-rally-last/)).

### Workflow D — Founder's Note daily trade examples (Support Center)

SpotGamma publishes three **explicit trading-example archetypes** under the [Founder's Note trading examples](https://support.spotgamma.com/hc/en-us/articles/28242176025363-Founder-s-Note-Trading-Example-Basic-Call-Wall-as-Resistance) curriculum:

| Tier | Named example | Teaching pattern |
|------|--------------|------------------|
| **Basic** | *Call Wall as Resistance* | When index is within ~1% of the Call Wall, sell covered calls / credit spreads at or above the wall, or buy puts near the wall. |
| **Intermediate** | *Volatility Trigger as a Flip Level* | Use Vol Trigger as the pivot between mean-reversion (above) and momentum (below); size / sign direction flips when spot crosses. |
| **Advanced** | *Expert Commentary, Levels, & Events Align* | Stack the Founder's Note narrative, multiple named levels (Vol Trigger + Call Wall + Hedge Wall / Synthetic OI clusters), and calendar events (OPEX / CPI / FOMC) for higher-conviction trades. |

Parallel curricula exist for HIRO, Equity Hub, and Volatility Dashboard (each: basic / intermediate / advanced trading examples in the Support Center).

---

## Platform operators (method as taught)

Product surfaces tied back to [Analysis patterns](#analysis-patterns-summary) so surface and lens stay one ontology.

| Operator | Primary pattern(s) | Role in their methodology |
|----------|-------------------|---------------------------|
| **Founder's Note** (daily AM/PM) | Dealer gamma regime; Structural key levels; Expiration mechanics | Written daily interpretation of **where the market sits vs named levels**, with a Risk Pivot and expected behavior. |
| **TRACE** (Gamma Heatmap, Delta Pressure, Charm Pressure, Strike Plot, GEX) | Dealer gamma regime; Structural key levels; Charm / time decay | SPX/ES **intraday structural** visualization; blue = positive gamma, red = negative; charm pin zones emerge toward end-of-day. |
| **HIRO** (chart, Flow Alerts, 5-day history, 30-day range card, Put/Call filter) | Real-time hedging flow | Real-time "who's being forced to hedge which way"; used as **mean-reversion indicator** around walls ("HIRO flattens at wall = reversal") per SpotGamma's own YouTube framing. |
| **Compass** (Explorer View, Guided View) | Compass quadrant | Cross-sectional **IV Rank × Risk Reversal** grid for **idea filtering**; Guided View overlays statistics. |
| **Equity Hub** (Synthetic OI + Total OI models, Skew chart, Dark Pool Indicator, Put/Call Impact) | Single-stock positioning; Structural key levels; Skew | Single-stock structural backbone; **Synthetic OI** is their proprietary single-stock positioning engine (distinct from Total OI). |
| **Volatility Dashboard** (Term Structure, Fixed Strike Matrix, Volatility Skew, VIX Term Structure) | Term structure / forward IV; Skew; Vanna / IV-driven hedging | SPX vol regime framing for **event trading** (calendar spreads for overblown events, iron condors in high IV, premium harvest via Fixed Strike Matrix). |
| **Tape** (Scanners, flags, Summary Charts, Flow Data, Contract Data) | Real-time hedging flow; Concentrated flow anchors | Print-level visibility with SpotGamma-specific flags; complements HIRO for single-print context. |
| **Scanners** (Squeeze, Gamma Squeeze, VRP, Most Call Gamma, Lowest Put/Call, Bullish Dark Pool) | Concentrated flow anchors; Vol regime; Skew | **Idea generation** pre-screens built on the underlying surfaces. |
| **Options Calculator** (Strategies, PnL Chart, Position Manager) | Execution structuring | Payoff sanity-check after structure is chosen (butterflies, iron condors, spreads). |
| **Indices page** (Absolute Gamma, Gamma Tilt, Delta Tilt, Expiration Concentration, Combo Strikes, 0DTE Vol/OI, Gamma Model, Vanna Model, Delta Model, SIV Index, OCC data, Realized Vol, Return Histogram, Concentration Table, Strike Table, Options Risk Reversal) | Dealer gamma regime; Vanna; 0DTE transient stability; Realized vs implied | **Aggregate market metrics**; the **Gamma / Vanna / Delta Models** are the published model backbone, and the **SIV Index** is their proprietary Structured IV projection driving Vanna. |
| **FlowPatrol** | Concentrated flow anchors | Alerts for outsized option activity (e.g. "~70,000 April 40 VIX calls in a session" flagged in March 2026). |
| **TradingView / Bookmap / NinjaTrader / Sierra / ESignal / Jigsaw** integrations | Structural key levels | Levels pushed into charting platforms so levels are usable **inside the trader's own workflow**. |

---

## Proprietary / named concepts (what a reader must internalize)

These are concepts **owned** by SpotGamma's vocabulary and used uniformly across KB, blog, and case studies. Use these names exactly when citing SpotGamma.

### Key levels (single-stock and index)

| Name | What it is | How SpotGamma uses it |
|------|------------|-----------------------|
| **Call Wall** | Strike with largest net call gamma | Upper bound of probable range; **holds ~83% intraday, ~88% on close** in SpotGamma's published SPX stats. Shifts up overnight = bullish signal. |
| **Put Wall** | Strike with largest net put gamma | Lower support; analogous hit-rate framing. |
| **Hedge Wall** | Single-stock analog of Volatility Trigger | Level where realized vol is expected to expand if breached; above it, **mean reversion > momentum**; increases = bullish, decreases = bearish. |
| **Volatility Trigger™** | Index-level bearish-feedback pivot | "Last major support above the Put Wall"; below it, realized-vol expansion is modeled. Statistically: SPX above VT has lower 5-day RV; 1- and 5-day forward-return standard deviation is materially lower above vs below. |
| **Key Gamma Strike** | Strike with dominant local gamma concentration | Precision entry anchor in case studies. |
| **Key Delta Strike / Large Gamma Strike** | Secondary structural strikes | Used to label less dominant but still published levels. |
| **Zero Gamma / Gamma Flip** | Level where aggregate dealer gamma flips sign | The "regime pivot" — often coincides with Vol Trigger. |
| **Absolute Gamma** | Magnitude aggregate of dealer gamma | Index health / range metric. |
| **Combos** | Pairings / packaged strike structures in the level set | Used to label structurally linked strikes. |
| **Reference Price** | SpotGamma's stated reference for level calcs | Transparency anchor. |
| **Risk Pivot** (blog shorthand) | The level a post says "must hold / must reclaim" | Appears in most Sunday-note closings. |

### Models and indicators

| Name | What it is |
|------|------------|
| **SpotGamma Gamma Model** | Market-gamma estimate from SPX open interest, with the published assumption that **market makers are mostly long calls and short puts**; higher gamma ⇒ tighter range. |
| **SpotGamma Vanna Model** | Visualization of how **delta changes with IV**: gray line = delta path without IV change, purple line = delta path with SIV-projected IV change; gap = where vol drives price more than spot. |
| **SpotGamma Delta Model** | Delta framing that respects vanna mechanics (IV↑ ⇒ all deltas move toward 50). |
| **SIV Index (Structured Implied Volatility)** | Proprietary projection of **how IV changes as the underlying moves**; drives the Vanna Model. |
| **SpotGamma Gamma Index™** | Named index-level aggregate gamma indicator. |
| **Stability Index** | TRACE-cited percentile describing how stable the regime is (low = directional potential). |
| **Low Volatility Point** | A strike at which Put & Call Impact chart projects **vol expands if price moves away**. |
| **Synthetic OI Model** | Single-stock positioning model that decomposes into **opened vs closed** exposure; feeds Put/Call Impact. |
| **Total OI Model** | Traditional aggregate OI track used alongside Synthetic OI. |
| **Dark Pool Indicator (DPI)** | Off-exchange print aggregation used as institutional positioning proxy. |
| **Compass quadrants** | IV Rank (y) × Risk Reversal percentile (x) grid; upper-left = bullish + expensive vol, lower-right = bearish + cheap vol, etc. |
| **VRP (Variance Risk Premium)** | Scanner built on the empirical tendency for IV > subsequent RV. |
| **Gamma Squeeze** | Self-reinforcing rally when MMs short calls are forced to buy stock; AMC 2021 is the published textbook example. |
| **FlowPatrol** | Alerting product for outsized single-block options flow. |
| **JPM Collar tracking** | Quarterly-repeating structural anchor that SpotGamma cites explicitly with strike legs and expected dealer gamma effects at quarter-end. |

---

## Sample analysis workflows — as they read in practice

A few representative walkthroughs, quoted tersely from the primary sources:

1. **[AMZN Compass 900%](https://spotgamma.com/case-study-the-amzn-trade-compass-nailed-for-900-upside/)** — Compass upper-left quadrant → Equity Hub Hedge Wall $195 + Key Gamma $200 → HIRO call-buying + MM stock-buying → long $195.11, stop $194.61, targets $197 / $199 / $200 → 978% on $0.50 risk in ~30 min.
2. **[MSTR breakdown](https://spotgamma.com/spotgamma-flags-breakdown-in-strategy-mstr-stock-trade/)** — Compass lower-right (bearish + cheap vol) → Equity Hub Low Vol Point $166 / Call Wall $165 / Hedge Wall $156 → HIRO put-buying + call-selling → short $164.90, stop $165+$1, scale out at $160 then $156 → ~5:1 to 9:1.
3. **[TSLA gamma pin break](https://spotgamma.com/tesla-breaks-gamma-pin-intraday-short/)** — Equity Hub Key Gamma $320 + Hedge Wall $315; Put & Call Impact flags $320 as Low Vol Point → HIRO flips from call buying to call selling → short $319.90, stop $321, targets $315 then $310 → ~5:1 to ~10:1.
4. **[AAPL 18:1](https://spotgamma.com/apple-breaks-gamma-support-delivers-18-1-intraday-trade/)** — Compass upper-left → Hedge Wall $190 + Key Gamma $200 → long $190.15 on HIRO Flow Alert, stop $189.65, targets $195 / $199 → up to 18:1, exit when HIRO flattens near $200.
5. **[PLTR swing 50%+](https://spotgamma.com/pltr-swing-trade-max-profit/)** — Compass upper-left, Hedge Wall $86 / Put Wall $85 / Call Wall $90 → HIRO call buying → enter unbalanced call butterfly at $87.50, defined $1 risk, 50% max profit over 6 days, exit before April 2 tariff catalyst.
6. **[SPX 12:1 0DTE iron condor](https://spotgamma.com/case-study-spx-trade-12-1-reward-risk-payoff/)** — TRACE mildly negative gamma + Stability Index 31% → 99th-percentile strike 6770 as magnet → HIRO flow flips bearish at 10:15 → sell 6820/6825 call spread (directional short) → at 11:00 add 6770/6765 put spread = iron condor → close at 1:00 as SPX breaks 6765, 12:1 on $0.15 risk.
7. **[TRACE Dec-10 SPX](https://spotgamma.com/trace-unveils-when-to-short-sp-500/)** — TRACE negative gamma pocket above 6055; Put Wall and Vol Trigger shifting lower; HIRO put-buying + call-selling at 12:35 PM; Delta Pressure flips negative; TRACE Charm pin at 6035 — SPX closes 6034.91.

These are **not 7 different methodologies** — they are the **same workflow applied to different regimes** (intraday single-stock long, intraday single-stock short, intraday pin-break short, index pin target, swing options).

---

## Blog / Sunday-note shape (summarized)

From 7 read-in-full posts spanning Feb–Apr 2026, each post follows roughly the same template:

1. **Macro / event framing** (e.g. Iran conflict, CPI/NFP/FOMC, earnings).
2. **Dealer gamma regime read** (via TRACE heatmap qualitative description).
3. **Named structural anchors** (Vol Trigger, Put/Call Wall, JPM Collar strikes, Hedge Wall).
4. **Vol structure** (term structure shape, IV−RV spread, VVIX, forward IV at events).
5. **Skew / tail positioning** (put-skew percentile, call-skew percentile).
6. **Single-stock dispersion** via Compass quadrants for Mag7 / sector names.
7. **Explicit Risk Pivot** and a **scenario set** ("above X we expect…; below X we expect…").
8. **Closing epistemic hedge** — common lines: "respect the volatility regime," "vanna-driven rally ≠ all-clear," "nimble, hedged, data-led."

Recurring macro stories during this window included: **negative-gamma trapdoor**, **JPM Collar quarter-end roll** driving a 100-pt SPX rally at the exact Trump-Iran headline, **post-OPEX loss of shock absorber**, **vanna-driven vol-crush rally**, and **right-tail squeeze risk** when put skew is extreme with flat tape.

---

## What this is not (for differentiation)

- **Not** primarily a **prints-first tape** product (cf. Unusual Whales), where the unit of reasoning is an individual block or sweep; SpotGamma leads with **positioning structure** + **aggregate hedging flow**, with printed blocks surfaced mainly via **FlowPatrol** and **Tape** flags.
- **Not** primarily an **open-source dealer exposure stack** (cf. VannaCharm's GEX/VEX/CEX + Black-Scholes + IV-surface smoothing + `floe` library + minute-surface API); SpotGamma's math is proprietary, and differentiation is in the **named-level vocabulary + trading-example curriculum + daily written narrative**, not in publishing surface math.
- **Not** a neutral "data utility." Every surface is presented inside **a directional narrative** (Founder's Note / Sunday newsletter), and case studies are published by named traders — explainability and story are a first-class feature, not a garnish.

---

## Limitations (as reflected in their own disclaimers + observed)

- **Hit rates are historical, not guarantees.** Call-Wall-held-83% and Vol-Trigger-statistics are empirical and actively cited; SpotGamma consistently reminds readers these are probabilities, not certainties.
- **0DTE-driven positive gamma is transient.** The [0DTE underbelly](https://spotgamma.com/the-markets-0dte-underbelly-is-exposed/) post is a direct acknowledgement that **intraday support can vanish overnight** — a self-imposed caveat on their own TRACE levels.
- **Vanna-driven rallies are mechanical, not fundamental.** Explicitly disclaimed in [Vol Crush](https://spotgamma.com/will-the-vol-crush-rally-last/).
- **Case-study publication bias.** Only winning trades are published, and all current equity case studies are authored by a single contributor (Doug Pless); this **is not** a backtested hit-rate dataset.
- **YouTube captions are inconsistent.** The HIRO-mean-reversion video literally has no CC; claims beyond video descriptions cannot be made without watching the video manually.
- **Support Center is Cloudflare-protected** for automated fetches; machine-readable access requires a real browser session (the source for this note combined live browser navigation, Google-indexed snippets, and outbound links from SpotGamma blog posts).
- **Sign-convention traps** exist. Some published language (e.g. "red = negative gamma = amplification") is internally consistent but easy to invert if lifted out of context — use their names literally.

---

## Reference material

### Support Center (`support.spotgamma.com/hc/en-us`)

Indexed by SpotGamma's own section structure; exact IDs verified via browser navigation or Google-indexed snippet; individual article pages gated by Cloudflare for automated fetches.

| Topic | Canonical article |
|-------|------------------|
| **Glossary root** | [Glossary category](https://support.spotgamma.com/hc/en-us/categories/1500000758601-Glossary) |
| **Volatility Trigger™** | [Volatility Trigger](https://support.spotgamma.com/hc/en-us/articles/15297954935699-Volatility-Trigger) |
| **Call Wall** | [Call Wall](https://support.spotgamma.com/hc/en-us/articles/15297391724179-Call-Wall) |
| **Put Wall** | [Put Wall](https://support.spotgamma.com/hc/en-us/articles/15297856056979-Put-Wall-What-It-Is-and-How-SpotGamma-Uses-It) |
| **Hedge Wall** | [Hedge Wall](https://support.spotgamma.com/hc/en-us/articles/15297582984723-Hedge-Wall) |
| **Gamma (concept)** | [Gamma](https://support.spotgamma.com/hc/en-us/articles/15214161607827-Gamma) |
| **Market Gamma** | [Market Gamma](https://support.spotgamma.com/hc/en-us/articles/15214378926355-Market-Gamma) |
| **Gamma Flip** | [Gamma Flip](https://support.spotgamma.com/hc/en-us/articles/15413261162387-Gamma-Flip) |
| **Gamma Profile** | [Gamma Profile](https://support.spotgamma.com/hc/en-us/articles/15413307516819-Gamma-Profile) |
| **GEX** | [What is GEX?](https://support.spotgamma.com/hc/en-us/articles/33608294279955-What-is-GEX) |
| **Charm Pressure Heatmap** | [Charm Pressure Heatmap](https://support.spotgamma.com/hc/en-us/articles/33608198289043-What-is-the-Charm-Pressure-Heatmap) |
| **TRACE** | [What is SpotGamma TRACE](https://support.spotgamma.com/hc/en-us/articles/33607907909011-What-is-SpotGamma-TRACE) |
| **HIRO — how to trade** | [How can I use HIRO to help me trade](https://support.spotgamma.com/hc/en-us/articles/15169160339475-How-can-I-use-the-SpotGamma-HIRO-to-help-me-trade) |
| **Vanna (concept)** | [Vanna](https://support.spotgamma.com/hc/en-us/articles/16876455544851-Vanna) |
| **Vanna Model** | [SpotGamma Vanna Model](https://support.spotgamma.com/hc/en-us/articles/15350867797267-What-is-the-SpotGamma-Vanna-Model) |
| **Equity Hub Synthetic OI Model** | [Synthetic OI Model](https://support.spotgamma.com/hc/en-us/articles/39946919887891-What-is-the-Equity-Hub-Synthetic-OI-Open-Interest-Model) |
| **Synthetic OI Put/Call Impact Chart** | [Synthetic OI Put & Call Impact](https://support.spotgamma.com/hc/en-us/articles/39946646214547-What-is-the-Synthetic-OI-Put-Call-Impact-Chart) |
| **Compass** | [What is SpotGamma Compass](https://support.spotgamma.com/hc/en-us/articles/39936536033171-What-is-SpotGamma-Compass) |
| **Skew** | [Skew](https://support.spotgamma.com/hc/en-us/articles/15249660292627-Skew) |
| **Equity Hub Skew chart** | [Skew chart in Equity Hub](https://support.spotgamma.com/hc/en-us/articles/8711432245779-What-is-the-Skew-chart-in-Equity-Hub) |
| **Implied Volatility** | [IV Explained](https://support.spotgamma.com/hc/en-us/articles/15214218424595-Implied-Volatility-IV-Explained-What-It-Is-and-How-to-Use-It) |
| **Forward Implied Volatility** | [Forward IV](https://support.spotgamma.com/hc/en-us/articles/15249178424595-Forward-Implied-Volatility) |
| **Realized Volatility** | [RV](https://support.spotgamma.com/hc/en-us/articles/15214902101523-RV-Realized-Volatility) |
| **Term Structure** | [Term Structure](https://support.spotgamma.com/hc/en-us/articles/4413973361427-Term-Structure) |
| **VRP** | [Variance Risk Premium](https://support.spotgamma.com/hc/en-us/articles/15249783047315-VRP-Variance-Risk-Premium) |
| **Dark Pool Indicator** | [DPI](https://support.spotgamma.com/hc/en-us/articles/1500006847122-What-is-the-Dark-Pool-Indicator-DPI) |
| **Open Interest** | [OI in Options Trading](https://support.spotgamma.com/hc/en-us/articles/15214621371539-Understanding-Open-Interest-OI-in-Options-Trading) |
| **Gamma Squeeze** | [What is a Gamma Squeeze](https://support.spotgamma.com/hc/en-us/articles/31612163559955-What-is-a-Gamma-Squeeze) |
| **Delta-Neutral Hedging** | [Delta-Neutral Hedging](https://support.spotgamma.com/hc/en-us/articles/15248965514131-Delta-Neutral-Hedging) |
| **Market Makers / Dealers** | [Market Makers](https://support.spotgamma.com/hc/en-us/articles/15214461591443-Market-Makers-Dealers) |
| **JPM Collar** | [JPM Collar](https://support.spotgamma.com/hc/en-us/articles/12763513348243-JPM-Collar) |
| **SPX Key Levels Statistics** | [SPX Key Levels Stats](https://support.spotgamma.com/hc/en-us/articles/31209900542867-SpotGamma-SPX-Key-Levels-Statistics) |
| **0DTE Volume / OI index** | [0DTE Volume/OI](https://support.spotgamma.com/hc/en-us/articles/15350782964755-What-is-the-0DTE-Volume-Open-Interest-index-chart) |
| **Founder's Note: basic example** | [Call Wall as Resistance](https://support.spotgamma.com/hc/en-us/articles/28242176025363-Founder-s-Note-Trading-Example-Basic-Call-Wall-as-Resistance) |

### Blog (`spotgamma.com/blog`) — read in full for this note

| Post | URL |
|------|-----|
| Vol Crush Lifts the S&P 500 — Will the Rally Last? | [will-the-vol-crush-rally-last](https://spotgamma.com/will-the-vol-crush-rally-last/) |
| How One Key Level Drove Last Week's Rally | [how-one-key-level-drove-last-weeks-rally](https://spotgamma.com/how-one-key-level-drove-last-weeks-rally/) |
| The New Volatility Regime | [the-new-volatility-regime](https://spotgamma.com/the-new-volatility-regime/) |
| After OPEX: Market Loses Its Shock Absorber | [after-opex-market-loses-its-shock-absorber](https://spotgamma.com/after-opex-market-loses-its-shock-absorber/) |
| March OPEX: Tipping Point or Turning Point? | [march-opex-tipping-point-or-turning-point](https://spotgamma.com/march-opex-tipping-point-or-turning-point/) |
| The Options Market Trapdoor | [the-options-market-trapdoor](https://spotgamma.com/the-options-market-trapdoor/) |
| VVIX Explained: What the Volatility Index Tells Traders | [vvix-explained](https://spotgamma.com/vvix-explained-what-the-volatility-index-tells-traders/) |
| Right Tail Risk Is Building in the S&P 500 | [right-tail-risk-is-building-in-the-sp-500](https://spotgamma.com/right-tail-risk-is-building-in-the-sp-500/) |
| The Market's 0DTE Underbelly Is Exposed | [the-markets-0dte-underbelly-is-exposed](https://spotgamma.com/the-markets-0dte-underbelly-is-exposed/) |

### Case studies — read in full for this note

| Case study | URL |
|------------|-----|
| AMZN Compass 900%+ Upside | [case-study-the-amzn-trade-compass-nailed-for-900-upside](https://spotgamma.com/case-study-the-amzn-trade-compass-nailed-for-900-upside/) |
| MSTR Breakdown 5:1 to 9:1 | [spotgamma-flags-breakdown-in-strategy-mstr-stock-trade](https://spotgamma.com/spotgamma-flags-breakdown-in-strategy-mstr-stock-trade/) |
| Tesla Gamma Pin Break | [tesla-breaks-gamma-pin-intraday-short](https://spotgamma.com/tesla-breaks-gamma-pin-intraday-short/) |
| AAPL 18:1 Breakout | [apple-breaks-gamma-support-delivers-18-1-intraday-trade](https://spotgamma.com/apple-breaks-gamma-support-delivers-18-1-intraday-trade/) |
| PLTR Swing 50% in 6 days | [pltr-swing-trade-max-profit](https://spotgamma.com/pltr-swing-trade-max-profit/) |
| SPX 12:1 TRACE + HIRO 0DTE IC | [case-study-spx-trade-12-1-reward-risk-payoff](https://spotgamma.com/case-study-spx-trade-12-1-reward-risk-payoff/) |
| TRACE Unveils When to Short SPX | [trace-unveils-when-to-short-sp-500](https://spotgamma.com/trace-unveils-when-to-short-sp-500/) |

Listing (for further case studies not read in full): [Case Studies](https://spotgamma.com/case-studies/).

### YouTube (metadata only — captions were not reliably retrievable; the HIRO video has no CC at all)

| Video | URL |
|------|-----|
| The AMZN Trade Compass Nailed for 900%+ Upside | [watch?v=uxtectvKTDE](https://www.youtube.com/watch?v=uxtectvKTDE) |
| Compass from SpotGamma (explainer) | [watch?v=9DXQgPGNjTA](https://www.youtube.com/watch?v=9DXQgPGNjTA) |
| SpotGamma Equity Hub 101 Tutorial | [watch?v=OPqyJwMQsNc](https://www.youtube.com/watch?v=OPqyJwMQsNc) |
| HIRO as a Mean Reversion Trading Indicator | [watch?v=85o73W83chs](https://www.youtube.com/watch?v=85o73W83chs) |

Video descriptions confirm, but do not extend, the methodology shown in case studies (Compass → Equity Hub levels → HIRO timing) and the Support Center (HIRO used as mean-reversion signal at walls).

---

*Last reviewed from public materials (Support Center via browser, blog + case studies via direct fetch, YouTube descriptions). Sign conventions and statistics (e.g. Call Wall 83/88%, Vol Trigger RV stats) are SpotGamma's published figures — verify before any customer-facing claim.*

---

## Skills that absorb this methodology

The skill files under [`../skills/`](../skills/) intentionally use the vocabulary described here (`Vol Trigger`, `Call Wall`, `Put Wall`, `Hedge Wall`, `Key Gamma Strike`, `Compass` quadrants, `TRACE` heatmaps, `HIRO`, `Synthetic OI`, `SIV`, `VRP`, and related terms) as generic dealer-gamma and options-structure canon. Attribution stays in this competitor note; skill bodies remain vendor-agnostic.

Mapping of SpotGamma [analysis patterns](#analysis-patterns-summary) to the skills that operationalize them:

| SpotGamma pattern | Skill(s) that implement it |
| --- | --- |
| **Dealer gamma regime** | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`charm-pin-0dte-seller`](../skills/charm-pin-0dte-seller/SKILL.md), [`zero-dte-intraday-flow-scalper`](../skills/zero-dte-intraday-flow-scalper/SKILL.md), [`pre-catalyst-flow-detector`](../skills/pre-catalyst-flow-detector/SKILL.md) |
| **Structural key levels** (Call / Put / Hedge Wall, Vol Trigger, Key Gamma Strike) | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`charm-pin-0dte-seller`](../skills/charm-pin-0dte-seller/SKILL.md) |
| **Real-time hedging flow (HIRO)** | [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`charm-pin-0dte-seller`](../skills/charm-pin-0dte-seller/SKILL.md), [`zero-dte-intraday-flow-scalper`](../skills/zero-dte-intraday-flow-scalper/SKILL.md) |
| **Compass quadrant (vol x skew)** | [`compass-quadrant-screener`](../skills/compass-quadrant-screener/SKILL.md), [`high-iv-premium-seller`](../skills/high-iv-premium-seller/SKILL.md), [`earnings-play-trader`](../skills/earnings-play-trader/SKILL.md), [`unusual-options-activity-swing`](../skills/unusual-options-activity-swing/SKILL.md), [`repeat-whale-follower`](../skills/repeat-whale-follower/SKILL.md), [`sector-rotation-etf-flow`](../skills/sector-rotation-etf-flow/SKILL.md), [`sweep-confluence-trader`](../skills/sweep-confluence-trader/SKILL.md) |
| **Vanna / IV-driven hedging** | [`vanna-regime-trader`](../skills/vanna-regime-trader/SKILL.md), [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md) |
| **Charm / time-decay pressure** | [`charm-pin-0dte-seller`](../skills/charm-pin-0dte-seller/SKILL.md), [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`zero-dte-intraday-flow-scalper`](../skills/zero-dte-intraday-flow-scalper/SKILL.md) |
| **0DTE transient stability** | [`zero-dte-intraday-flow-scalper`](../skills/zero-dte-intraday-flow-scalper/SKILL.md), [`charm-pin-0dte-seller`](../skills/charm-pin-0dte-seller/SKILL.md), [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md) |
| **Skew & tail positioning** | [`high-iv-premium-seller`](../skills/high-iv-premium-seller/SKILL.md), [`sector-rotation-etf-flow`](../skills/sector-rotation-etf-flow/SKILL.md), [`vanna-regime-trader`](../skills/vanna-regime-trader/SKILL.md), [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md) |
| **Term structure / forward IV** | [`high-iv-premium-seller`](../skills/high-iv-premium-seller/SKILL.md), [`earnings-play-trader`](../skills/earnings-play-trader/SKILL.md), [`pre-catalyst-flow-detector`](../skills/pre-catalyst-flow-detector/SKILL.md), [`vanna-regime-trader`](../skills/vanna-regime-trader/SKILL.md) |
| **VVIX (vol of vol) divergence** | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`vanna-regime-trader`](../skills/vanna-regime-trader/SKILL.md) |
| **Concentrated flow anchors (JPM Collar, large blocks)** | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`pre-catalyst-flow-detector`](../skills/pre-catalyst-flow-detector/SKILL.md) |
| **Expiration mechanics (OPEX / VIX exp / quarter-end)** | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`dealer-gamma-positioning-trader`](../skills/dealer-gamma-positioning-trader/SKILL.md), [`high-iv-premium-seller`](../skills/high-iv-premium-seller/SKILL.md) |
| **Single-stock positioning (Synthetic OI)** | [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md), [`unusual-options-activity-swing`](../skills/unusual-options-activity-swing/SKILL.md), [`repeat-whale-follower`](../skills/repeat-whale-follower/SKILL.md) |
| **Realized vs implied vol** | [`high-iv-premium-seller`](../skills/high-iv-premium-seller/SKILL.md), [`vanna-regime-trader`](../skills/vanna-regime-trader/SKILL.md), [`dealer-positioning-regime-model`](../skills/dealer-positioning-regime-model/SKILL.md) |
| **Dispersion / cross-sectional** | [`compass-quadrant-screener`](../skills/compass-quadrant-screener/SKILL.md), [`sector-rotation-etf-flow`](../skills/sector-rotation-etf-flow/SKILL.md) |
