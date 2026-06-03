# VannaCharm — methodology (competitor note)

Public positioning: **dealer gamma, vanna, and charm exposure** (GEX / VEX / CEX) for retail, with **strike-level surfaces**, **0DTE** emphasis, and optional **broker-streamed** real-time data. Sources: [product](https://vannacharm.com/), [Learn overview](https://vannacharm.com/learn/overview), [Blog](https://vannacharm.com/blog), [API docs](https://vannacharm.com/docs).

---

## Core pipeline

1. **Inventory:** **Open interest** by strike and expiry (static / EOD-updated, or **live** when connected to a broker feed).
2. **Greeks:** **Black–Scholes** greeks using **implied volatility** inputs — not a single flat vol for the whole chain; **per-strike (and per-expiry) IV** from market prices (bisection to match quoted prices).
3. **IV surface:** **Smoothing in total variance** (\(w = \sigma^2 T\)): cubic spline–style fit, **convexity** enforcement, map back to IV — reduces quote noise and stabilizes greeks near the money (vanna most sensitive; gamma and charm also move with strike-specific IV).
4. **Dealer exposure:** Map contract-level greeks to **dealer GEX / VEX / CEX** at each strike; separate **call** vs **put** contributions where exposed; aggregate totals and **net** series.
5. **Dynamics:** Recompute as **spot, time, IV, and (when live) OI** change — from **~minute cadence** (early “dynamic data”) to **streaming** with full book + live OI.

---

## Definitions (as stated on Learn)

| Metric | Role | Formula anchor (pedagogical) |
|--------|------|------------------------------|
| **GEX** | Sensitivity of **delta** to **spot**; “acceleration” of delta | \(\Gamma = \partial^2 V / \partial S^2\) |
| **VEX** | Sensitivity of **delta** to **IV** | \(\partial^2 V / \partial S \,\partial \sigma\) |
| **CEX** | Sensitivity of **delta** to **time** (decay of delta / gamma path) | \(\partial^2 V / \partial S \,\partial \tau\) |

**Net exposure (their heuristic):** per-strike (and aggregate) combination of **GEX + VEX + CEX** into a single directional read; product copy ties this to **pin / repel** and aggregate “lean” narratives.

**Sign convention quirk:** Learn frames *large negative* net exposure as **buy-back support → market higher**, and *large positive* as **selling pressure → market lower**. This is the **opposite** of a naive reading; if we reference their pin/repel language, call out this convention so readers don’t invert it.

---

## Live open interest (when broker-connected)

- Start from **OI at open** (\(t = 0\)).
- Classify **prints vs NBBO:** at/above ask → **buy aggressor**; at/below bid → **sell aggressor**; between → **unknown**.
- **Heuristic** \(\delta_i\) per trade (retail-shaped): buy at ask → **+size OI** (assumed opening long); sell at bid → **−size OI** (assumed closing long); mid print → **0**. Cumulative live OI = \(OI_0 + \sum \delta_i\). **Stated failure mode:** a sell at bid could be a **new short open** that *increases* true OI — indistinguishable without order-level data.
- **Production brokers:** **Tradier + TradeStation** (OAuth, real-time chain / trades / quotes → live IV surface + live OI into the same exposure stack). **Roadmap:** TastyTrade, Schwab.
- Cumulative OI is **partial** if the feed is activated **after** the open (no backfill of pre-activation prints).

---

## Modeling refinements (blog)

- **Canonical vs state-weighted:**  
  - **Canonical:** unit-clean sensitivities (e.g. gamma per defined spot move, vanna per vol point, charm per day) for cross-session comparison.  
  - **State-weighted:** same constructs **scaled by current regime** (scenario spot move, vol change, time-to-close).  
  - **Flow delta** (historically “notional”): **change** in exposure; flow layer increasingly grounded in **live OI** rather than only volume + bid/ask heuristics.
- **GEXVEX:** **GEX + VEX** per strike (**sum**); **synergy index** combines **alignment** of signs, **local balance** of normalized GEX/VEX, and **significance weight** (e.g. P90-based) so small OTM noise does not dominate ATM structure.
- **Charts / regime:** **Hedgeflow** and **charm integral** over time; **IV vs RV** and **IV−RV spread** for whether realized is running hot vs implied; emphasis on **transitions** (crossings, sign flips), not levels only.

---

## Downstream indicators (built on the exposure surfaces)

Listed on the homepage / blog; sit **on top of** GEX / VEX / CEX rather than replacing them.

- **Charm Footprint:** how **time-decay pressure** across expiries evolves through the session.
- **Shares to Cover:** estimated **share count** dealers would need to buy/sell to hedge **net exposure**.
- **Implied Move:** underlying move implied by shares-to-cover and aggregate net exposure.
- **Cumulative Probability Above/Below Spot:** probabilities of closing above / below spot derived from the options market.
- **Dealer-Exposure-Adjusted Implied Probability Density:** implied density **reshaped** by the dealer-exposure view.
- **Historical Comparisons:** GEX / VEX / net trajectories across sessions and expiry buckets for **regime context**.

---

## API (premium)

- **`GET /api/getMinuteSurfaces`:** `symbol` (e.g. SPY, QQQ, SPX, NDX), `trade_date` → up to **390** RTH minutes; each minute includes `spot`, `vix`, and **`surfaces_jsonb`** with arrays **`gamma`**, **`vanna`**, **`charm`**, **`iv`** — per strike: `call`, `put`, **`net`**.
- **“Net” here is scoped to one greek surface:** `net = call + put` within that surface (e.g. the `net` in the `gamma` array is **gamma only**). This is **different** from the product’s **“net exposure”** concept which is **G + V + C** per strike.
- **Access:** premium tier + `X-API-Key`; current coverage centers on **0DTE** for the listed indexes/ETFs.
- **Clients:** `floe` (TypeScript), `floe-go`, `floe-py` — same analytics stack as the product.

---

## Tiers

**Pricing page SKUs** (as listed on [Pricing](https://vannacharm.com/pricing)): **Free**, **Starter**, **Premium** (lifetime and monthly billing variants).

- **Free / Starter:** **OI-based** footprint (EOD or session-updated OI), BS greeks with IV-surface treatment — *“where positions sit.”* Starter adds the full GEX/VEX/CEX/basic-charts set.
- **Premium:** adds **near-real-time** surfaces for major index / ETF symbols (**SPX, NDX, XSP, XND, SPY, QQQ, DIA, IWM**), **live broker** connections (**Tradier, TradeStation**) for full live book + live OI, **historical replay**, premium replay indicators, **shares-to-cover / implied-move / GEXVEX / dealer-exposure-adjusted density**, and **API access** (SPY/QQQ/SPX/NDX 1-minute surfaces).

**Naming note:** the [Learn overview](https://vannacharm.com/learn/overview) uses **“Starter / Pro”** framing — this does not match the pricing page SKUs. Prefer **Pricing-page names** when quoting externally.

---

## Analysis workflows (per their methodology)

These are **composite** procedures implied by their **Learn**, **blog**, and **dashboard** story—not a single published “official playbook,” but faithful to how they stack **surfaces → dynamics → derived indicators**.

### Workflow lenses (what question each layer answers)

| Lens | Question it foregrounds | Typical move (VannaCharm-shaped) |
|------|-------------------------|----------------------------------|
| **Strike surface** | Where are **walls, cliffs, and sign flips** in **GEX / VEX / CEX**? | Read **per-strike** bars (or legacy lines); compare **call vs put** and **net** at spot-adjacent strikes. |
| **GEX vs VEX** | Is **spot-driven** hedging or **vol-driven** hedging dominant **here**? | Compare **GEX** and **VEX** side by side; when vol is chaotic, **VEX** can rival **GEX** at a strike. |
| **GEXVEX + synergy** | Do gamma and vanna **compound** or **fight** at this strike? | Use **GEXVEX sum** for net pressure; use **synergy index** for **aligned vs tension / chop** (and “pinning” vs **locked exposure** in tooltips). |
| **Net exposure** | What is the **single-number lean** per strike / overall? | Sum **GEX + VEX + CEX** (their heuristic); tie to **pin / repel** language only as **hypothesis**, not mechanical certainty. |
| **Dynamics** | How did the **book** move **intraday**? | Enable **live** data when available; prefer **OI changes** + **strike OI bars** over a one-time snapshot. |
| **Transitions** | When does the **regime** flip? | Watch **hedgeflow** crossing zero, **charm integral** direction, **net exposure** vs zero, **IV−RV** sign — they stress **transitions**, not levels only. |
| **Vol / event** | Is **IV expansion** the main risk? | Lean on **VEX** and **IV vs RV**; canonical **vanna** is “per vol point” — avoid mixing with state-weighted views without labeling. |
| **0DTE / into close** | Is **time decay** driving flows? | **CEX** and **charm integral**; their copy emphasizes **last hours** and **gamma flips** near expiry. |
| **Canonical vs state** | Am I comparing **apples to apples** across days? | Use **canonical** for **magnitude** and history; **state-weighted** for **“right now”** scenario framing (see blog on two-mode framework). |
| **Research / API** | How did surfaces **evolve minute by minute**? | **`getMinuteSurfaces`**: replay **gamma / vanna / charm / iv** with **spot** and **VIX** for the session. |

### Sample workflow A — live session (dashboard)

1. **Set context.** Symbol, **0DTE vs farther expiry** (their live flow often centers **0DTE** for intraday index/ETF behavior). Note **scheduled events** (FOMC, earnings) if you expect **VEX** and **IV surface** moves.
2. **Load the footprint.** Start from **OI-based** surfaces if broker feed is off — **where positions sit** before intraday trading reshapes risk.
3. **Turn on live data** (tier + broker). Prefer **live IV** + **live OI** so GEX/VEX/CEX reflect **current** chain, not only **open** OI.
4. **Scan GEX by strike.** Mark **large positive / negative** clusters around spot; note **max gamma** strikes as potential **magnets** or **volatility pockets** (their narrative: long vs short gamma hedging behavior).
5. **Layer VEX.** Flag strikes where **VEX** is large vs **GEX** — **vol shocks** may dominate **spot** path there.
6. **Open GEXVEX.** For each key strike: **sum** vs **synergy** — **high synergy** vs **tension** (mixed signs) vs **pinning** (high locked, low net). Re-read their **scenario table** in the GEXVEX post for interpretation discipline.
7. **Add net and charm.** Use **net** for a **single** combined lean; use **CEX** / **charm integral** for **into-the-close** pressure, especially **0DTE**.
8. **Monitor transitions.** Watch **hedgeflow** vs **0**, **charm integral** slope, **IV−RV** and spread **sign changes** — they frame **edge** as **regime changes**, not static levels.
9. **Sanity-check data.** If **live OI** started **after** the open, cumulative OI is **partial**; **mid** prints add noise to OI inference. Label conclusions accordingly.

### Sample workflow B — research / backtest (API + floe)

1. **Pick symbol and session.** `trade_date` for **SPY / QQQ / SPX / NDX** (coverage per [API docs](https://vannacharm.com/docs)).
2. **Pull minute surfaces.** `getMinuteSurfaces` → for each minute: **spot**, **VIX**, **`gamma` / `vanna` / `charm` / `iv`** arrays with **call / put / net**.
3. **Align narratives.** Join minute **regime** (e.g. spot crossing large **GEX** strike) with **VIX** moves for **vanna-heavy** explanations.
4. **Reuse the same engine locally.** **floe** stack for replication, extensions, or custom charts beyond the web UI.

### Platform operators (method → surface)

| Operator | Role in workflows |
|----------|-------------------|
| **Static / historical symbol pages** | Footprint and **slow** OI — workflow A steps 1–2, 4–7 without live. |
| **Live symbol dashboard** | **Streaming** IV + OI, cumulative flow, OI-by-strike, **GEXVEX**, hedgeflow, IV vs RV — steps 3–8. |
| **Broker OAuth** | Enables **live OI** and **live IV** path — step 3. |
| **Historical replay / API** | Minute **surfaces_jsonb** — workflow B. |

---

## Open source

**floe / floe-go / floe-py** — Black–Scholes pricing, greeks, IV surfaces, and API clients; referenced across site and blog as the implementation backbone.

---

## Takeaways for comparison

- **Surface-first:** GEX/VEX/CEX **per strike** + **IV surface** engineering is central; not “one number GEX” only.
- **Retail packaging:** **GEXVEX**, synergy, hedgeflow/charm integral, IV vs RV — strong **dashboard** and **explainability** story.
- **Workflow shape:** [Analysis workflows](#analysis-workflows-per-their-methodology) read **surface → combine (GEXVEX/net) → dynamics (transitions)**; tape-style flow is **secondary** to **dealer exposure** unless explicitly layered (cumulative flow / OI change charts).
- **Transparency:** Public **blog** on IV smoothing, live OI heuristics, and canonical vs state-weighted **unit hygiene**; open **floe** stack lowers replication cost for motivated users.

---

*Last reviewed from public materials (site, Learn, Blog, API docs). Re-verify pricing and broker coverage before any customer-facing claims.*
