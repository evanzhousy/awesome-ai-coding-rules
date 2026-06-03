# Xynth (xynth.com) — competitor note

**Scope:** Public marketing at [xynth.com](https://xynth.com/), the [Trade Ideas blog](https://xynth.com/blog), and the Xynth Substack profile/post shell at [substack.com/@xynth1](https://substack.com/@xynth1) / [post p-195468612](https://substack.com/@xynth1/p-195468612). *Owner:* strategy / competitive intel. *Boundary:* no paid-product login audit; methodology below is synthesized from **public blog copy** (each post includes a reusable “prompt” block). *Date researched:* April 2026.

---

## Research method

1. **HTTP fetch** — Homepage positioning ([xynth.com](https://xynth.com/)), blog index ([xynth.com/blog](https://xynth.com/blog)), and individual `/blog/*` articles (see Sources).
2. **`browser-harness`** ([browser-use/browser-harness](https://github.com/browser-use/browser-harness)) — Invoked against `https://substack.com/@xynth1/p-195468612`; **no completion within ~3 minutes** (daemon/CDP attach likely blocked in this agent environment — same class of issue as [openvlab.md](openvlab.md) CDP notes). **Do not assume harness failure implies site failure.**
3. **Cursor IDE browser (MCP)** — Navigation reached the post URL and title; **accessibility snapshot** exposed mostly **shell chrome** (tabs, subscribe), not the long-form article body (Substack renders post content in a way that snapshot did not surface as text).
4. **Substack RSS (authoritative full text for this run)** — `curl https://xynth1.substack.com/feed` returns full `content:encoded` HTML for each post. The item titled *“I told AI to watch options flow 24/7. It returned 83 percent.”* matches the same post as [substack.com/@xynth1/p-195468612](https://substack.com/@xynth1/p-195468612) (RSS permalink: [xynth1.substack.com/p/how-claude-turned-10k-100k-trading](https://xynth1.substack.com/p/how-claude-turned-10k-100k-trading); slug differs from numeric URL). **Substack section below is summarized from that RSS body** (Apr 2026).

---

## Sources (blog articles read for methodology)

| Article | URL |
|--------|-----|
| How to Day Trade with AI | [xynth.com/blog/how-to-day-trade-with-ai](https://xynth.com/blog/how-to-day-trade-with-ai) |
| How to Trade Options with AI | [xynth.com/blog/ai-options-trading-guide](https://xynth.com/blog/ai-options-trading-guide) |
| How I Used AI to Trade Options Flow ($CZR) | [xynth.com/blog/czr-merger-100pct](https://xynth.com/blog/czr-merger-100pct) |
| How I Use AI to Track Whale Trades | [xynth.com/blog/whale-watching-flow-strategy](https://xynth.com/blog/whale-watching-flow-strategy) |
| Mispriced options / vol skew verticals | [xynth.com/blog/vol-skew-spreads-250pct](https://xynth.com/blog/vol-skew-spreads-250pct) |
| Earnings IV crush / short straddle | [xynth.com/blog/earnings-iv-crush-84pct](https://xynth.com/blog/earnings-iv-crush-84pct) |
| SPX 0DTE + oil + gamma | [xynth.com/blog/spx-oil-0dte-83pct](https://xynth.com/blog/spx-oil-0dte-83pct) |
| NVDA short + GEX + Charm | [xynth.com/blog/nvda-iran-short-77pct](https://xynth.com/blog/nvda-iran-short-77pct) |

---

## One-line positioning

**Conversational AI market agent** — natural-language questions → multi-source research plan → code-backed analysis and a **dashboard** (charts, metrics, trade setups with entry/exit). Markets itself on **300+ data sources** (options flow, dark pool, SEC, gamma, IV, sentiment, fundamentals, etc.), tiered pricing from delayed to real-time ([pricing on site](https://xynth.com/)).

---

## How Xynth frames “methodology” (product + content)

Across marketing and blogs, the **repeatable pattern** is not a single indicator; it is a **pipeline**:

1. **Wide screen** — universe scan (stocks, flow, vol, macro proxy, or index).
2. **Progressive filters** — technicals, news/catalyst calendar, IV rank / IV–RV / term structure, sentiment, flow direction vs trend (hedge vs conviction).
3. **Structure selection** — pick spread or directional leg; adjust strikes/expiry (e.g. +14 days “breathing room” vs whale print).
4. **Risk framing** — P&L diagrams, breakeven, max loss, R/R, optional Black–Scholes-style scoring in prompts.
5. **Automation hook** — many guides link to a named **live alert / automation** (“Open … Scanner”, fork into chat).

Blog posts **teach by publishing the exact user prompt** — that is part of their GTM (shareable recipes + product-led growth into alerts).

---

## Options-focused methodology (synthesized from blogs)

### A. “Cheap options on trend + flow confirmation” (beginner systematic)

From [How to Trade Options with AI](https://xynth.com/blog/ai-options-trading-guide):

- Screen large universe (e.g. **500+** names) for **momentum + low IV rank** (example: IV rank < 30, cap > $1B, options liquidity).
- Rank, then add **institutional flow** slice (e.g. **$50K+** premium, calls vs puts, sweeps) to align **direction with “big money.”**
- Deep dive **chain**: OI, volume, put/call ratio, IV by strike; output **3–4** structures with **P&L diagrams** (short put / bull call / long call depending on fit).

**Idea kernel:** momentum–vol **dislocation** + **flow corroboration** + **chain-level** validation before structure.

### B. Whale / institutional flow (hedge stripping)

From [Whale Watching](https://xynth.com/blog/whale-watching-flow-strategy):

- **Step 1:** Market-wide unusual activity, **premium** threshold (e.g. **$50K+**), cluster by ticker, calls vs puts, horizon (e.g. **90d**).
- **Step 2:** **Flow vs 20-day trend** — discard **bearish flow in uptrend** and **bullish flow in downtrend** as likely **hedges**; keep **aligned** flow.
- **Step 3:** **IV rank** cap (example: reject **> 70th** percentile).
- **Step 4:** **Catalyst window** (e.g. no binary event in **7 days**); sentiment score vs flow direction.
- **Step 5:** **Retail adjustments** — extend expiry (example **+14 days**), strikes **~2% ATM**.
- **Step 6:** Rank by formula combining **R/R**, **sentiment**, **IV cost** (they label Black–Scholes-style outputs in the narrative).

**Idea kernel:** flow is **not** alpha until **trend + IV + event + strike** hygiene removes insurance trades.

### C. Vol skew “mispricing” → vertical spreads

From [Vol skew / vertical spreads](https://xynth.com/blog/vol-skew-spreads-250pct):

- **Skew screen:** 25-delta put/call skew vs **30-day** history; flag **z-score** extreme (example **< −2** = steeper than normal).
- **IV vs RV:** OTM **IV ≫ RV** while ATM **≈ fair** → sell rich OTM via spread; buy **~50Δ** ATM, sell **~15–25Δ** OTM, **2–4 week** tenor.
- **Momentum gate:** bullish tape + rich **call** skew → bull call spread; bearish + rich **put** skew → bear put spread.

**Idea kernel:** **cross-strike IV shape + RV check + direction** → defined-risk spread, asymmetric payoff story (they report **low win rate / high avg winner** explicitly).

### D. Earnings: IV crush / short straddle screening

From [Earnings IV crush](https://xynth.com/blog/earnings-iv-crush-84pct):

- Large universe + **2y** earnings history and **overnight / around-report** price behavior stats.
- **Negative vol term structure** filter (example slope below **−15%** using front vs **40–45d** IV).
- **IV/RV > 1.25** as “fear overpriced vs recent realized.”
- Trade: **ATM short straddle**, nearest **post-earnings** expiry; **tight** hold window (example **15m** before close day before → **15m** after open next day).

**Idea kernel:** **term structure + IV/RV** as pre-earnings **short-vol** filter, not “all earnings.”

### E. Event / merger + flow + technicals + gamma

From [$CZR flow case](https://xynth.com/blog/czr-merger-100pct):

- Unusual activity + **>5%** monthly move → technical **scorecard** (MA, RSI, MACD, ADX, Supertrend, volume, Bollinger).
- Chain scout **~1 week** out; rank by **R/R** and **gamma / likelihood** narrative; explicit **entry / target / stop** vs **gamma wall/support**.

**Idea kernel:** **flow + momentum + technical stack + gamma map** for directional lottery-ticket style setups (case study outcome: buyout headline).

### F. 0DTE index: macro proxy + prior-session flow + dealer gamma

From [SPX / oil 0DTE](https://xynth.com/blog/spx-oil-0dte-83pct):

- **Oil overnight direction** as risk-on/off proxy (geopolitical narrative).
- **Prior close** flow on **today’s 0DTE** expiry: **bullish vs bearish** dollar volume and **trade count**.
- **SPX gamma** — pin vs **negative gamma** “amplify” regime; spot vs **walls**.

**Idea kernel:** **three-factor confluence** for **opening window** scalps; explicit “skip if misaligned” instruction in prompt.

### G. Equity short / range: Net GEX + Charm stability

From [NVDA GEX/Charm](https://xynth.com/blog/nvda-iran-short-77pct):

- **Net GEX** high → **pin / mean-reversion** regime; combine with **Charm** band (their narrative: stable charm vs “melting” hedge).
- **Catalyst calendar** (earnings, macro, geopolitics) to avoid **range breaks**.

**Idea kernel:** **dealer positioning metrics as regime filter** for short-hold mean reversion, not only long-vol stories.

### H. Day trade / swing (stock-first, not options-only)

From [Day trade with AI](https://xynth.com/blog/how-to-day-trade-with-ai):

- Volatility band (**ATR %**), **liquidity**, distance to **20d SMA** → top N; **multi-indicator** scorecard; news/catalyst pass; **$1k**-style position sizing and **chart** markup.

**Idea kernel:** same **funnel** applied to **stocks**; options are optional follow-on.

---

## Substack — *I told AI to watch options flow 24/7. It returned 83 percent.*

**URLs:** [substack.com/@xynth1/p-195468612](https://substack.com/@xynth1/p-195468612) · canonical RSS item link [xynth1.substack.com/p/how-claude-turned-10k-100k-trading](https://xynth1.substack.com/p/how-claude-turned-10k-100k-trading) · feed [xynth1.substack.com/feed](https://xynth1.substack.com/feed) · pubDate **Mon, 27 Apr 2026** (per RSS).

**What the post is (structure):** A **product launch / education** piece for Xynth **Alerts** — plain-English prompts → Xynth builds a workflow, runs it on their servers **24/7** while markets are open, and notifies the user when conditions hit. The narrative stacks **edge cases** (options flow before the move, dark pool, insider Form 4s, London-open setups) then positions **3,000+ live market data endpoints** behind **Claude Opus 4.7** (marketing copy in post).

**Hero example (their numbers, not independently verified):** They anchor on the **“whale watching”** unusual-options-flow pipeline (same six steps as the [Xynth blog whale post](https://xynth.com/blog/whale-watching-flow-strategy)), calling it the **“most profitable alert”** on the product at time of writing, with a **power user** story: **$10,000 → $103,847 in four months** detecting/verifying unusual flow. They link the live alert [xynth.com/alerts/alert-05481a1e8c25](https://xynth.com/alerts/alert-05481a1e8c25) (same ID as the blog’s “Whale Watching Scanner”). Example trade photo caption references **$CZR $27 Call Mar 20** (consistent with their blog case study).

**Six-step strategy (as in post — duplicates Section B with prose emphasis):**

1. **Unusual activity** — Premium **> $50,000**, expiry **≤ 90 days**; cluster by ticker/direction; top ~20 by premium; “urgency = conviction,” far-dated treated as more likely hedges.
2. **Flow vs 20-day SMA trend** — Reject bearish flow + uptrend and bullish flow + downtrend as **stock hedges**, not directional bets.
3. **IV rank** — Reject if **> 70th percentile** (“whale move already priced in”).
4. **Narrative / calendar** — Skip binary events (**earnings, FDA, lawsuits**) inside **7 days**; sentiment **−1…+1**; reject if sentiment **contradicts** flow (e.g. huge call buying + uniformly negative news → hedge).
5. **“Breathing room”** — **Do not copy whales 1:1**; pad expiry **+14 days**, move strike **within ~2% of ATM** for retail-sized risk.
6. **Math / rank** — Black–Scholes on adjusted trades: max loss, max profit, POP, breakeven; enforce **minimum 2:1** upside vs risk (“for every dollar at risk you need at least two dollars of upside”); rank with **Score = Risk/Reward + Sentiment − IV Cost** (verbatim from their prompt block; they also write an equivalent expanded form in prose).

**“83 percent” in the title:** The RSS `content:encoded` excerpt reviewed for this note **does not spell out** where **83%** is defined (win rate vs return vs hit rate on the alert). Treat the headline metric as **marketing** unless you reproduce their backtest or read the on-page dynamic module. For comparison, the **standalone blog** version of the whale strategy cites **56% win rate** and **+85% avg winner** ([whale post](https://xynth.com/blog/whale-watching-flow-strategy)) — not the same number as the Substack title.

**Alerts CTA:** One-line prompt to productize the pipeline: *“Now turn this into an alert that notifies me every time this occurs.”* — positions **zero local setup**, cloud execution, and links to [xynth.com/automations](https://xynth.com/automations) for more templates.

**TradingFlow takeaway from this post (incremental):** Same as Section B + alerts row in the matrix below, plus explicit **GTM**: package multi-step flow logic as **subscribe-able monitors** + **one published prompt** to fork — our analogue is **saved views / routines / notifications**, not necessarily LLM-built workflows.

---

## What TradingFlow can realistically adopt (without cloning “AI agent”)

TradingFlow’s shipped surfaces skew toward **data + filters + ranked discovery** (e.g. **Option Trades**, **Option Chain Analysis**, **Symbol-level analysis**, **Contract-level analysis** per glossary) rather than a single chat agent. Mappable ideas:

| Xynth pattern | TradingFlow angle |
|---------------|-------------------|
| Published **prompt recipes** + checklists | **Docs, in-app “playbooks,” or blog** that encode the same filters (premium thresholds, IV rank bands, trend alignment, 7-day catalyst exclusion) using **our** field names and routes — education + power-user templates. |
| Flow vs **trend** hedge filter | UX or saved views on **Option Trades** / aggregates: emphasize **direction + underlying trend** (or link out to **Symbol-level analysis**) so users don’t chase hedges — mirrors their Step 2 narrative. |
| **IV rank, IV/RV, term structure** gates | **Option Chain Analysis** and vol columns already sit in the chain universe story; **guided views** (“earnings straddle candidate”) could mirror *their* screening *logic* as **filters + copy**, not as performance claims. |
| **Skew / strike richness** → spreads | If product roadmap includes **skew** or richer **strike IV vs RV** breakdowns, the vol-skew article is a **spec reference** for which gates traders expect. |
| **GEX + spot + walls** for 0DTE / pin | **Option Chain Analysis** GEX narrative + flip/wall concepts already in domain; **morning checklist** content (oil + prior flow + gamma regime) could be **editorial** or a **routine**-style saved workflow. |
| **P&L / breakeven / structure** teaching | They differentiate vs raw chatbots with **diagrams**; TradingFlow can double down on **contract-level** clarity (payoff intuition, max loss labels) wherever we show strikes — even if full P&L charts are roadmap. |
| **Alerts / scheduled scans** | Their **email alert + fork automation** is a **product wedge**; TradingFlow equivalent might be **notifications, saved screens, or Routine Hub** patterns — same *habit loop*, different implementation. |
| **Transparency** | Their posts often include **win rate, avg winner/loser, max drawdown** disclaimers (e.g. earnings piece). Any TradingFlow **strategy content** should keep that **honesty bar** — we should not import headline **returns** as implied product guarantees. |

**Strategic non-copy:** positioning as “**300+ sources in one agent**” and “**AI writes code on your data**” is **their** moat narrative; TradingFlow should not **sound-alike** unless the product truly delivers the same agent loop. Safer borrow is **method transparency** (pipelines, filters, handoffs between chain and flow surfaces).

---

## Pricing signal (from public site, Apr 2026)

Marketing lists tiers roughly **$49 / $99 / $179** per month with usage balance and delayed vs real-time data differentiation — useful **comp bench** only; verify live before any pricing work.

---

## Competitor links

- [https://xynth.com/](https://xynth.com/)  
- [https://xynth.com/blog](https://xynth.com/blog)  
- [https://substack.com/@xynth1](https://substack.com/@xynth1)  
- [https://substack.com/@xynth1/p-195468612](https://substack.com/@xynth1/p-195468612)  
- [https://xynth1.substack.com/feed](https://xynth1.substack.com/feed) (RSS — full post HTML in `content:encoded`)
