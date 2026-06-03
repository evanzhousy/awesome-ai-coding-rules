# SignalPlus (signalplus.com) - competitor note

**Scope:** Public marketing and product pages at [signalplus.com](https://www.signalplus.com/), public trading terminal shell at [t.signalplus.com](https://t.signalplus.com/), SignalPlus-linked education pages on Notion, SignalPlus Insights posts, SignalPlus RFQ API docs, Deribit support docs, and the June 1, 2026 SignalPlus funding press release. *Owner:* strategy / competitive intel. *Boundary:* no logged-in trading-terminal audit, no execution-quality verification, no independent validation of reported volumes or valuation. *Date researched:* June 2, 2026.

---

## Research method

1. **HTTP / text-reader fetch** - Homepage, [Dashboard](https://www.signalplus.com/dashboard), [Automation](https://www.signalplus.com/automation), [Content](https://www.signalplus.com/content), and SignalPlus-linked Notion education pages.
2. **Official docs / product shell** - [t.signalplus.com](https://t.signalplus.com/) exposes a Retail / Institution login shell; [docs-rfq.signalplus.com](https://docs-rfq.signalplus.com/deribit/ws/operation/get-rfqs.html) exposes Block RFQ REST/WebSocket API documentation.
3. **External primary/near-primary checks** - [Deribit Block Trading support](https://support.deribit.com/hc/en-us/articles/25944688627229-Block-Trading) lists SignalPlus as a block-trade partner; [PRNewswire release sourced to SignalPlus](https://www.prnewswire.com/news-releases/signalplus-closes-b1-round-at-us500m-valuation-to-accelerate-global-expansion-and-advance-derivatives-trading-technology-302787253.html) covers the June 1, 2026 Series B1.
4. **No paid-product login audit** - This note treats UI/product claims as public positioning unless independently observable from docs or support pages.

---

## One-line positioning

**Institutional crypto-options trading infrastructure** - an all-in-one dashboard for pricing, analytics, multi-venue execution, risk/PnL, volatility analytics, scenario testing, dynamic delta hedging, market-making automation, and structured-product pricing.

SignalPlus is not primarily a US-equity retail flow screener. Its wedge is **professional options infrastructure for digital assets**, with a public "democratizing options" message and an institutional product stack behind it.

---

## Public product surfaces

| Surface | What it appears to do | Competitive meaning |
| --- | --- | --- |
| **Trading Dashboard** | Custom workspace with widgets, prebuilt views, TradingView charts, order / position context, and cross-exchange trading. | A terminal, not a single scanner. Workspace composition is part of the product promise. |
| **Live Risk / PnL** | Real-time inventory, intraday exposure, PnL attribution, strike analysis, theta analysis, Greek breakdown by expiry / strike. | Strong risk-manager framing; less "find a trade," more "run a book." |
| **Volatility Lab** | Term structure, model volatility smile, model volatility surface, 7D RV momentum, IV/RV, volatility cone, historical IV by tenor / expiry, time-lapse IV. | Closest overlap with TradingFlow's **Option Chain Analysis** and IV-surface work. |
| **Smart Dealing** | Multi-leg execution through embedded algorithms; gamma- and vega-neutral offsets. | Execution-aware strategy construction, not just analytics. |
| **Risk Scenario** | Scenario analysis and stress testing for PnL and exposures. | Portfolio-level "what-if" workflows are core to the pitch. |
| **Dynamic Delta Hedge (DDH)** | Customizable delta-hedging robot with real-time Telegram confirmations. | Converts analytics into automated risk maintenance. |
| **Market Making Robot** | 24/7 robot across major venues, full hedging, 200+ user-defined / bespoke parameters, API licensing. | Institutional automation SKU; this is infrastructure sold to desks. |
| **Structured Product Pricer / Risk Engine** | Structured-product pricing, transparent models, bespoke terms, automated hedging protocol. | Expands beyond vanilla crypto options toward issuer / desk infrastructure. |
| **Education / University** | Options basics, Greeks, volatility tools, strategy construction, SignalPlus Toolkit walkthroughs. | Education is a funnel and a product glossary: they teach the workflow their terminal implements. |
| **Options Elite Program** | VIP tier with new-feature priority, customized fees/rebates, research/signals, support, events, premium strategy templates, possible higher API limits. | GTM blends terminal + community + support + strategy templates. |
| **RFQ API / partner flow** | Block RFQ APIs for Deribit and Bullish; Deribit lists SignalPlus as a block-trade partner. | Confirms serious block-trading / institutional execution integration. |

---

## Methodology they teach

SignalPlus teaches options as **risk-factor engineering**. Their education path moves from payoff basics to pricing, Greeks, volatility structure, strategy templates, and then automated hedging / execution.

### 1. Price options through IV, not raw premium

The advanced volatility material explicitly says the benefit of IV is standardization across strike, expiry, and underlying. Their workflow pushes users to translate dollar prices into implied-volatility surfaces before judging cheap/rich.

TradingFlow analogue: keep **iv** and **IV Surface** prominent in **Option Chain Analysis**; avoid treating chain premium alone as the decision variable.

### 2. Start with term structure and delta-standardized slices

Their term-structure view compares options with the same delta exposure across maturities. Default examples use standardized strikes such as `25D Put`, `25D Call`, and ATM.

TradingFlow analogue: **Option Chain Analysis** should support expiry/tenor comparison at common deltas, not only strike rows. If we add guided workflows, "same delta across expiries" is a good default mental model.

### 3. Treat risk reversal as sentiment / skew

SignalPlus explains `25D RR` as `25 Delta Call IV - 25 Delta Put IV`; negative RR means downside-protection demand, positive RR means call-chasing / upside demand.

TradingFlow analogue: if risk-reversal columns or charts are added, teach them as **skew demand**, not as a generic bullish/bearish signal.

### 4. Split smile movement into parallel, skew, and curvature

They decompose volatility-smile movement into:

- **Parallel shift** - vega exposure.
- **Skew change** - `Rega`, tied to `25D RR`.
- **Curvature change** - `Sega`, tied to `25D Fly`.

This is one of SignalPlus's most distinctive public methodology details. It is more desk-like than most retail option-flow content.

TradingFlow analogue: a future **IV Surface** / volatility notebook could classify surface movement into **level / skew / curvature** rather than showing a 3D chart with no interpretation.

### 5. Use strategy templates to isolate Greeks

SignalPlus's advanced material maps common structures to Greek exposures:

| Structure | Public methodology framing |
| --- | --- |
| Long straddle / strangle | Delta-neutral-ish, high vega, long movement / volatility. |
| Bull / bear spreads | Directional delta with defined risk and capped upside. |
| Butterfly / condor / iron condor | Range-bound / short-vega expression with bounded risk. |
| Risk reversal | Hedge or directional skew expression. |
| Calendar spread | Time / term-structure expression. |

TradingFlow analogue: our strategy docs and **Cookbook** plans can describe structures as **risk exposure templates**, not only payoff diagrams.

### 6. Automate hedging once the desired exposure is defined

The product stack repeatedly moves from analytics to action: smart dealing can add gamma/vega-neutral offsets, the Toolkit supports delta-neutral portfolio construction, DDH automates delta hedging, and market-making automation runs 24/7.

TradingFlow analogue: for US-equity workflows, the near-term equivalent is not necessarily execution automation. A more realistic analogue is **risk-aware handoff**: from **Option Chain Analysis** / **Contract-level analysis** into a structure checklist, expected exposure, and alerts / routines.

---

## Business and traction signals

- **Recent funding:** SignalPlus announced a **US$50M Series B1** on **June 1, 2026** at a **US$500M post-money valuation**, led by HashKey Capital with follow-on participation from BlockBooster and AppWorks; Goldman Sachs served as sole financial advisor.
- **Reported institutional usage:** The same release says SignalPlus reached **US$160B platform volumes in Q4-2025**, including nearly **US$70B in Block-RFQ transactions cleared via Deribit alone**, and names Cumberland, FalconX, and Galaxy Digital among platform users. Treat as company-reported unless independently audited.
- **Expansion direction:** The release says proceeds will support product diversification and geographic expansion, including structured commodity products and a SignalPlus 2.0 platform with agentic AI via a proprietary QuantLab engine for volatility market-structure analysis, strategy backtesting, and trading-module creation.
- **Venue connectivity:** Public SignalPlus materials reference multi-venue / multi-vendor connectivity; SignalPlus Insights tournament instructions mention exchange accounts from **Deribit, OKX, and Bybit**. Deribit support lists SignalPlus as a block-trade partner.
- **Pricing signal:** The dashboard is marketed as free of charge; automation / market-making services are API-licensed / BD-contact products. The monetization appears to sit in institutional licensing, VIP programs, advanced templates/support, flow/rebate economics, and enterprise infrastructure, not just retail SaaS subscription.

---

## TradingFlow mapping

| SignalPlus pattern | TradingFlow implication |
| --- | --- |
| Volatility Lab as a named product surface | **Option Chain Analysis** should keep the IV surface / term-structure / OI Time Machine story coherent and named. Vol analytics deserve workflow framing, not just charts. |
| Workspace dashboard with widgets | If TradingFlow expands **App Canvas** or **Cookbook** dashboards, SignalPlus validates customizable "book view" layouts for advanced users. |
| Greek / exposure-first education | Strategy docs should describe setups by **delta / gamma / vega / theta / skew / curvature** exposure where possible. |
| Surface movement decomposition | Add surface-change interpretation layers: level, skew, curvature, tenor shift, and RV/IV gap. |
| Smart dealing / hedging | TradingFlow does not need to copy execution, but it can improve **Contract-level analysis** handoff with structure, hedge, and risk checklist labels. |
| DDH / 24/7 automation | The realistic counterpart is **Routine Hub**, alerts, saved scans, and scheduled **Cookbook Refresh** workflows, not broker automation unless product scope changes. |
| Structured-product pricer | Useful roadmap signal if TradingFlow ever targets issuers / desks; not relevant to current US-equity option-flow retail workflow. |
| VIP / elite program | Advanced users may value priority support, strategy template libraries, research, and API limits more than simple feature gating. |
| RFQ / block-trade APIs | Execution partnerships are a moat for crypto options; for TradingFlow, data quality and workflow depth remain the defensible near-term surface unless we integrate brokerage/execution. |

---

## Competitive strengths

1. **Institutional credibility** - Funding, named institutional users, Deribit partner listing, RFQ docs, and market-making automation point to real desk workflows.
2. **End-to-end workflow** - Analytics, scenario, execution, hedging, and automation are presented as one loop.
3. **Volatility methodology depth** - Public education covers term structure, smiles, surfaces, IV/RV, RR/Fly, Rega/Sega, and Greek isolation.
4. **Crypto-native venue complexity** - Cross-exchange connectivity, perpetual/futures forward-curve concepts, and 24/7 hedging are tailored to crypto market structure.
5. **Education-to-product loop** - Their public materials teach the exact concepts the terminal surfaces.

---

## Risks / unknowns

- Logged-in terminal UX, data coverage, latency, and execution quality were not audited.
- Public pages do not prove how much of the dashboard is free vs effectively gated by exchange connectivity, VIP tier, or institutional onboarding.
- Company-reported volumes and valuation were not independently verified in this pass.
- US regulatory accessibility is unclear; this is a global crypto-options infrastructure product, not necessarily a US-retail product.
- The agentic AI / QuantLab upgrade is announced but not yet validated as a live public workflow.

---

## Product takeaways for strategy work

1. **Make volatility surfaces actionable.** A 3D surface alone is not enough; pair it with level/skew/curvature interpretation, RR/Fly history, IV/RV, and term-structure deltas.
2. **Teach with the same vocabulary the product renders.** SignalPlus's education works because "25D RR," "Fly," "Volatility Surface," "Delta Exchange," and strategy templates map back to UI widgets.
3. **Separate discovery from book management.** TradingFlow's current surfaces excel at discovery: **Option Trades**, **Symbol-level analysis**, **Contract-level analysis**, and **Option Chain Analysis**. SignalPlus is stronger at book/risk management. Plans should be explicit about which side we are building.
4. **Use routines before execution automation.** For TradingFlow, the safer near-term adaptation is saved workflows, alerts, and **Cookbook** analysis templates that explain exposure and risk, not auto-hedging or order routing.
5. **Do not import crypto-specific assumptions blindly.** Perpetual funding, 24/7 markets, exchange account linkage, and block RFQ are central to SignalPlus but do not transfer cleanly to US listed equity options.

---

## Reference URLs

| URL | Note |
| --- | --- |
| https://www.signalplus.com/ | Homepage positioning; dashboard, Volatility Lab, smart dealing, DDH, automation, structured products. |
| https://www.signalplus.com/dashboard | Dashboard workspace, widget, TradingView integration. |
| https://www.signalplus.com/automation | Market-making / hedging robot positioning and API licensing. |
| https://www.signalplus.com/content | Education hub linking options basics / intermediate / advanced pages. |
| https://rowan-hawk-725.notion.site/Cryptocurrency-Options-Basics-da9bd01466f34a5f999101bd6c243508 | SignalPlus-linked options basics and Toolkit chain walkthrough. |
| https://rowan-hawk-725.notion.site/Cryptocurrency-Options-Intermediate-79b58139189047cfa1e66a0bdb6293ef | Pricing, Greeks, forward curve, delta-neutral examples. |
| https://rowan-hawk-725.notion.site/Cryptocurrency-Options-Advanced-ddccc1b820894f15b64a25e2d208d2af | Strategy templates and volatility-surface methodology. |
| https://rowan-hawk-725.notion.site/bdfd1a03195c489cb79d3e723dc20133 | Advanced volatility tools: term structure, smile, surface, IV/RV, cone, 7D RV momentum, historical/time-lapse IV. |
| https://t.signalplus.com/ | Trading terminal login shell; Retail / Institution split. |
| https://docs-rfq.signalplus.com/deribit/ws/operation/get-rfqs.html | SignalPlus RFQ API documentation. |
| https://support.deribit.com/hc/en-us/articles/25944688627229-Block-Trading | Deribit block-trading docs listing SignalPlus as a partner. |
| https://insights.signalplus.com/options-elite-program/ | VIP / Options Elite Program positioning. |
| https://insights.signalplus.com/2024/09/12/how-to-join-the-greatest-tournament-of-crypto/ | Terminal walkthrough and exchange-account support signal. |
| https://www.prnewswire.com/news-releases/signalplus-closes-b1-round-at-us500m-valuation-to-accelerate-global-expansion-and-advance-derivatives-trading-technology-302787253.html | June 1, 2026 Series B1, traction, and SignalPlus 2.0 / QuantLab claims. |
