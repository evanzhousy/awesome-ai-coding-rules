# Unusual Whales — methodology (competitor note)

**Design of this note (greenfield):** This file is the **single competitor-methodology contract** for Unusual Whales: **what they teach**, **how procedures stack**, **which product surfaces implement which ideas**, and **where the evidence lives**—without duplicating the corpus statistics in [`../unusual-whales-options-flow-methodology-synthesis.md`](../unusual-whales-options-flow-methodology-synthesis.md). *Owner:* strategy / competitive intel readers. *Boundary:* published Substack + product walkthroughs as surfaced in that synthesis; not a substitute for UW’s live product spec.

**North star (one sentence):** UW’s published teaching centers on **reading the tape first** (scale, microstructure, execution truth), then **layering context** (calendar, vol, structure, aggregate pressure) and **optional overlays** (gamma, policy disclosure)—not a single black-box “unusual score.”

Public positioning: **options order flow** and **“unusual” activity** for equities and derivatives, with **tape-level** detail (prints, premium, bid/ask), **aggregated / multi-leg** handling, **filters and alerts**, plus adjacent surfaces (**congressional trading**, macro/earnings calendars, and—outside this note—prediction markets and API access). Primary narrative channel: [Unusual Whales on Substack](https://unusualwhales.substack.com/). Product: [unusualwhales.com](https://unusualwhales.com/).

The **analysis patterns** table is the **canonical lens catalog** (deduplicated themes; keyword-weighted prevalence in ~284 posts lives in the synthesis doc). The **sample workflow** is the **ordered procedure** walkthroughs tend to follow. **Platform operators** maps **product affordances → patterns**—same invariant as the pattern rows, not a parallel ontology.

---

## Analysis patterns (summary)

These are the **recurring analysis patterns** in UW’s published teaching: *what kind of question they ask* and *what lens they apply*. Pair with [Sample analysis workflow](#sample-analysis-workflow-as-their-teaching-stacks-it) for ordering, and with [Reference Substack posts](#reference-substack-posts) for sources.

| Pattern | Question they foreground | Typical move |
|--------|---------------------------|--------------|
| **Scale & liquidity** | Is the print **big in dollars** and **plausible** versus normal volume and ADV-style context? | Rank by **premium / notional / contracts** before inferring intent. |
| **Tape microstructure** | Who **aggressed**, and **how** was liquidity taken? | **Bid vs ask**, lift vs hit—same call/put label can imply different urgency. |
| **“Unusual” screen** | Does flow stand out on **size, speed, structure, or odd timing** vs the obvious story? | **Filters, alerts**, checklist mindset ([indicators post](https://unusualwhales.substack.com/p/indicators-of-unusual-options-activity)); not one scalar “score.” |
| **Execution consolidation** | Is this one **logical** trade or many **splits / legs**? | **Aggregated** fills; **expand multi-leg** before interpreting each line as standalone. |
| **Structure ID** | Is this **naked direction** or a **package** (spread, roll, risk reversal)? | Taxonomy + **calculator**; dedicated **risk-reversal** pattern vs generic flow. |
| **Position-change semantics** | Does this print **add**, **reduce**, or **roll** exposure? | **OI**, open vs close / roll language—avoid backward delta inference. |
| **Calendar anchoring** | **Why now**—earnings, macro, headline window? | Map flow to **event weeks** and **catalyst risk** before pure chart narratives. |
| **Contract zoom** | Where does conviction sit—**strike / expiry**? | Move from **ticker** to **chain / breakdown** views for convexity. |
| **Volatility constraint** | What does **IV** and **event vol** imply for payoff? | **IV level**, **post-event crush** as follow-through filter, not only direction. |
| **Aggregate regime read** | Does **one print** disagree with **pressure over a window**? | **Net premium**, **interval / grouped** flow; optional **Periscope** for one symbol. |
| **Dealer / gamma overlay** | Is the trade about **urgency on tape** or **pinning / convexity**? | **Gamma / GEX / spot-gamma** columns—**secondary** to tape in most pieces. |
| **Tape vs news (case study)** | Did **prints precede** public information in a **story** worth telling? | **Timestamps vs headlines**; framed as **speculative**, with **disclaimers**—not legal proof. |
| **Policy / disclosure overlay** | Any **parallel** public-position signal? | **Congressional / politician** disclosure as **separate** layer from options tape. |

**How to use this table:** Rows are **patterns**, not a strict pipeline—one post often stacks **scale + microstructure + structure ID + calendar**, while another emphasizes **unusual screen + tape-vs-news**. The [synthesis doc](../unusual-whales-options-flow-methodology-synthesis.md) lists approximate **per-theme post counts** for weighting.

---

## Sample analysis workflow (as their teaching stacks it)

This is a **composite** of how walkthroughs chain product + reasoning—not a single official “UW playbook,” but faithful to recurring article order. Substack links go to posts whose slugs are verified in the methodology corpus; see [Reference Substack posts](#reference-substack-posts) for the full index.

1. **Set the calendar.** Note **earnings week**, **FOMC/CPI**, or headline windows so “why now?” is explicit before reading prints. (Many posts open with a week-ahead macro/earnings frame—browse the [archive](https://unusualwhales.substack.com/archive) by date when you need a concrete week’s setup post.)
2. **Open the flow feed and apply coarse filters.** Start from **premium / size** and **symbol** so the tape is not noise-dominated; decide early whether you care about **single-leg vs multi-leg** for this pass: [Unusual Whales flow filter walkthrough](https://unusualwhales.substack.com/p/unusual-whales-flow-filter-walkthrough), [Understanding filters on Unusual Whales](https://unusualwhales.substack.com/p/understanding-filters-on-unusual), [Understanding flow filters directionality](https://unusualwhales.substack.com/p/understanding-flow-filters-directionality).
3. **Turn on aggregated trades when relevant.** If a whale-sized print might be **split across venues**, aggregate before comparing **total premium** to your mental threshold—otherwise you mis-rank urgency: [How to read multileg and aggregated](https://unusualwhales.substack.com/p/how-to-read-multileg-and-aggregated).
4. **For each candidate line, read bid/ask and aggressor.** Treat **lift vs hit** as primary microstructure: the same call/put label can mean different urgency depending on whether liquidity was taken on the offer or the bid: [A breakdown of the bid vs ask (options)](https://unusualwhales.substack.com/p/a-breakdown-of-the-bid-ask-options).
5. **Expand multi-leg rows.** Use **multi-leg + aggregated** together: recover **all legs**, infer **structure** (spread, roll, packaged hedge), and avoid interpreting each leg as a standalone directional bet: [How to read multileg and aggregated](https://unusualwhales.substack.com/p/how-to-read-multileg-and-aggregated), [A breakdown of every type of flow](https://unusualwhales.substack.com/p/a-breakdown-of-every-type-of-flow).
6. **Name the structure and sanity-check with the calculator.** When they teach it, **open the options profit calculator** on the reconstructed package so payoff shape matches the story: [Options profit calculator walkthrough](https://unusualwhales.substack.com/p/options-profit-calculator-walkthrough). For **risk reversals** specifically: [How to spot and track risk reversals](https://unusualwhales.substack.com/p/how-to-spot-and-track-risk-reversals).
7. **Separate “new risk” from rolls/closes where the platform allows.** Use posts on **opened vs rolled** semantics and **OI-linked** language so a bullish print is not automatically net-new long delta: [How to identify opened option positions](https://unusualwhales.substack.com/p/how-to-identify-opened-option-positions).
8. **Zoom symbol → strikes/expiry.** Use **symbol-level flow breakdowns** to see where premium clusters before drawing a single headline about the ticker: [Understand options flow symbol breakdowns](https://unusualwhales.substack.com/p/understand-options-flow-symbol-breakdowns).
9. **Layer net premium or interval / grouped flow for regime-style reads.** When the question is **directional balance over a window** (not one print), switch tools: [How to use the net premium tool](https://unusualwhales.substack.com/p/how-to-use-the-net-premium-tool-on), [How to use interval flows](https://unusualwhales.substack.com/p/how-to-use-interval-flows-and-our), [A guide to interval and grouped options](https://unusualwhales.substack.com/p/a-guide-to-interval-and-grouped-options), [Understanding interval flow and grouped](https://unusualwhales.substack.com/p/understanding-interval-flow-and-grouped).
10. **Optional: Periscope for a focused symbol lens.** Treat **Periscope** as a scoped “swim lane” on flow for a name when the global feed is too wide: [Understanding Unusual Whales Periscope](https://unusualwhales.substack.com/p/understanding-unusual-whales-periscope).
11. **Optional: gamma / GEX / spot-gamma columns.** Use their **gamma stack** content when the question is **dealer positioning / pinning** vs pure tape urgency—this is **additive**, not the default first screen: [How to use gamma, spot gamma, OI, and …](https://unusualwhales.substack.com/p/how-to-use-gamma-spot-gamma-oi-and), [How to trade gamma and GEX with UW](https://unusualwhales.substack.com/p/how-to-trade-gamma-and-gex-with-uw).
12. **Stress-test the “unusual” claim.** Use a **checklist mindset** ([Indicators of unusual options activity](https://unusualwhales.substack.com/p/indicators-of-unusual-options-activity)), then cross-check **bulk flow vs countertrend** prints ([Spotting unusual countertrend options](https://unusualwhales.substack.com/p/spotting-unusual-countertrend-options)), **suspicious timing** ([The tape knew first — suspicious options](https://unusualwhales.substack.com/p/the-tape-knew-first-suspicious-options)), and **long-dated flow** if the thesis is positioning—not a one-day scalp ([How to track long-term options flow](https://unusualwhales.substack.com/p/how-to-track-long-term-options-flow)).
13. **State the epistemic limit.** Case studies that compare **timestamps to later headlines** are **illustrative**; they explicitly **disclaim** proving insider knowledge—treat as **hypothesis + context**, not a legal theory: [The tape knew first — suspicious options](https://unusualwhales.substack.com/p/the-tape-knew-first-suspicious-options).

---

## Platform operators (method as taught)

The newsletter treats product features as part of analysis—not garnish. Each row ties to **[Analysis patterns](#analysis-patterns-summary)** so product and lens stay one ontology.

| Operator | Primary pattern(s) | Role in their methodology |
|----------|-------------------|---------------------------|
| **Flow feed + filters** | Unusual screen; Scale & liquidity | Narrow the tape by size, premium, single vs multi-leg, **directionality**, symbol. Walkthroughs pair **filter UI** with avoiding false confidence. |
| **Aggregated trades** | Execution consolidation; Scale & liquidity | Avoid double-counting split prints; compare **total premium** to thresholds. |
| **Multi-leg expansion** | Execution consolidation; Structure ID | Recover legs, strategy hints, and **P/L calculator** handoff. |
| **Net premium** | Aggregate regime read | Directional **net** when one print disagrees with pressure over a scope. |
| **Interval flow & grouped options** | Aggregate regime read | Time-windowed or **grouped** views for “who won the day/week” vs one alert. |
| **Periscope** | Aggregate regime read | Symbol-scoped flow lens when the global feed is too wide. |
| **Alerts + Discord** | Unusual screen | Operationalize “unusual” as repeatable screen conditions; **Discord** for distribution. |
| **Gamma / GEX / spot-gamma** | Dealer / gamma overlay | Optional when the read is **pinning / convexity**, not only tape urgency. |
| **Options profit calculator** | Structure ID | Payoff sanity-check after legs are reconstructed (see workflow step 6). |

---

## Reference Substack posts

Canonical URL pattern: `https://unusualwhales.substack.com/p/<slug>`. Slugs below appear in the **options-flow corpus** used for [`../unusual-whales-options-flow-methodology-synthesis.md`](../unusual-whales-options-flow-methodology-synthesis.md).

### Tape, microstructure, and structure

| Topic | Slug (append to base URL) |
|-------|---------------------------|
| **Bid vs ask / aggressor** | [`a-breakdown-of-the-bid-ask-options`](https://unusualwhales.substack.com/p/a-breakdown-of-the-bid-ask-options) |
| **Multi-leg + aggregated** | [`how-to-read-multileg-and-aggregated`](https://unusualwhales.substack.com/p/how-to-read-multileg-and-aggregated) |
| **Every “type” of flow (taxonomy)** | [`a-breakdown-of-every-type-of-flow`](https://unusualwhales.substack.com/p/a-breakdown-of-every-type-of-flow) |
| **Risk reversals** | [`how-to-spot-and-track-risk-reversals`](https://unusualwhales.substack.com/p/how-to-spot-and-track-risk-reversals) |
| **Opened vs rolled / position semantics** | [`how-to-identify-opened-option-positions`](https://unusualwhales.substack.com/p/how-to-identify-opened-option-positions) |

### Filters, symbol breakdowns, and “unusual”

| Topic | Slug |
|-------|------|
| **Flow filters (product walkthrough)** | [`unusual-whales-flow-filter-walkthrough`](https://unusualwhales.substack.com/p/unusual-whales-flow-filter-walkthrough) |
| **Understanding filters on UW** | [`understanding-filters-on-unusual`](https://unusualwhales.substack.com/p/understanding-filters-on-unusual) |
| **Filter directionality** | [`understanding-flow-filters-directionality`](https://unusualwhales.substack.com/p/understanding-flow-filters-directionality) |
| **Symbol-level flow breakdowns** | [`understand-options-flow-symbol-breakdowns`](https://unusualwhales.substack.com/p/understand-options-flow-symbol-breakdowns) |
| **Indicators checklist** | [`indicators-of-unusual-options-activity`](https://unusualwhales.substack.com/p/indicators-of-unusual-options-activity) |

### Net premium, interval/grouped, Periscope

| Topic | Slug |
|-------|------|
| **Net premium tool** | [`how-to-use-the-net-premium-tool-on`](https://unusualwhales.substack.com/p/how-to-use-the-net-premium-tool-on) |
| **Interval flows** | [`how-to-use-interval-flows-and-our`](https://unusualwhales.substack.com/p/how-to-use-interval-flows-and-our) |
| **Interval & grouped guide** | [`a-guide-to-interval-and-grouped-options`](https://unusualwhales.substack.com/p/a-guide-to-interval-and-grouped-options) |
| **Understanding interval + grouped** | [`understanding-interval-flow-and-grouped`](https://unusualwhales.substack.com/p/understanding-interval-flow-and-grouped) |
| **Periscope** | [`understanding-unusual-whales-periscope`](https://unusualwhales.substack.com/p/understanding-unusual-whales-periscope) |

### Gamma / GEX (secondary thread)

| Topic | Slug |
|-------|------|
| **Gamma, spot gamma, OI columns** | [`how-to-use-gamma-spot-gamma-oi-and`](https://unusualwhales.substack.com/p/how-to-use-gamma-spot-gamma-oi-and) |
| **Gamma / delta / GEX primer** | [`how-to-understand-gamma-delta-gex`](https://unusualwhales.substack.com/p/how-to-understand-gamma-delta-gex) |
| **Trade gamma + GEX with UW** | [`how-to-trade-gamma-and-gex-with-uw`](https://unusualwhales.substack.com/p/how-to-trade-gamma-and-gex-with-uw) |
| **Gamma / GEX concepts** | [`understanding-gamma-gex-and-gamma`](https://unusualwhales.substack.com/p/understanding-gamma-gex-and-gamma) |

### Case studies, suspicion, and time horizon

| Topic | Slug |
|-------|------|
| **Suspicious / pre-news framing** | [`the-tape-knew-first-suspicious-options`](https://unusualwhales.substack.com/p/the-tape-knew-first-suspicious-options) |
| **Countertrend vs bulk flow** | [`spotting-unusual-countertrend-options`](https://unusualwhales.substack.com/p/spotting-unusual-countertrend-options) |
| **Long-dated flow** | [`how-to-track-long-term-options-flow`](https://unusualwhales.substack.com/p/how-to-track-long-term-options-flow) |

### Calculator and distribution

| Topic | Slug |
|-------|------|
| **Options profit calculator** | [`options-profit-calculator-walkthrough`](https://unusualwhales.substack.com/p/options-profit-calculator-walkthrough) |
| **Discord setup** | [`how-to-setup-the-unusual-whales-discord`](https://unusualwhales.substack.com/p/how-to-setup-the-unusual-whales-discord) |

---

## What this is not (for differentiation)

- **Not** primarily a closed-form **dealer GEX/VEX/CEX surface** shop (cf. VannaCharm-style dealer exposure math); UW leads with **trade tape** and **retail workflow**, with **gamma** as an add-on in some educational pieces.
- **Not** a single published “official equation” for “unusual”; in practice it is **heuristic** (size, speed, structure, timing, context).

---

## Limitations (as reflected in their own disclaimers)

- **Open/close ambiguity** on prints is acknowledged in educational material; direction of aggression ≠ always net new risk.
- **Pre-news case studies** are **illustrative** and explicitly **not** legal or compliance claims about insider trading.
- **Sponsored blocks** and promos appear inside some posts; methodology sections should be read separately from ad copy.
