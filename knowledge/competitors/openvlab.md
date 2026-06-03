# OpenVlab (openvlab.cn) — competitor note

**Scope:** Public marketing and product pages on [openvlab.cn](https://www.openvlab.cn/), with emphasis on [市场 `/market`](https://www.openvlab.cn/market). *Owner:* strategy / competitive intel. *Boundary:* no logged-in product audit beyond anonymous `/market`; static HTTP fetchers still see “加载中…” before JS runs.

---

## Research method (Apr 2026)

1. **Browser-harness** ([browser-use/browser-harness](https://github.com/browser-use/browser-harness)) — Multiple attempts including after enabling remote debugging in Chrome.
   - **Stale daemon:** one run reached `new_tab` then failed with `no close frame received or sent` on `Target.activateTarget` — fixed by `restart_daemon()` per skill.
   - **Daemon boot / attach:** subsequent runs failed in `ensure_daemon()` with *“DevTools is not live yet on 127.0.0.1:9222”* — the harness polls TCP for 30s; **no listener accepted** from the agent’s shell even when `DevToolsActivePort` listed `9222` (stale file vs. real bind, or **Cursor’s integrated terminal not sharing the same localhost namespace as GUI Chrome** on some setups).
   - **2026-04-27 check:** 60s poll of `curl http://127.0.0.1:9222/json/version` from the agent never saw CDP; **before** that, an earlier host check briefly showed `Google Chrome … LISTEN` on 9222 — binding can be intermittent until Chrome fully settles after toggling debugging.
   - **If harness keeps failing:** In **Terminal.app** (same Mac as Chrome), run `curl -sS http://127.0.0.1:9222/json/version` until it returns JSON with `webSocketDebuggerUrl`, then run `browser-harness` **from that same environment**; or set **`BU_CDP_WS`** to the `webSocketDebuggerUrl` value from that JSON (or from `chrome://inspect` → target → copy link) so the daemon skips inferring the port from disk.
2. **Chrome CDP checklist (for next browser-harness run)** — Quit Chrome completely (Cmd+Q), reopen, open `chrome://inspect/#remote-debugging`, ensure **“Discover network targets”** is enabled, confirm `lsof -iTCP:9222 -sTCP:LISTEN` shows a listener **and** `curl -sS http://127.0.0.1:9222/json/version` returns JSON, then run `browser-harness` again. Full bootstrap notes: `install.md` in your local [browser-harness](https://github.com/browser-use/browser-harness) clone (e.g. `~/Developer/browser-harness/install.md`).
3. **Playwright (fallback, this repo)** — With CDP unavailable, used headless Chromium via `pnpm exec node` + `playwright` from the project to load `/market`, wait for hydration, and snapshot visible **innerText** (equivalent competitive signal to a harness DOM read).
4. **HTTP fetch** — Marketing HTML for [home](https://www.openvlab.cn/), [Pro / 合作大V](https://www.openvlab.cn/pro/influencer), [教学中心](https://www.openvlab.cn/teaching).
5. **Search snippets** — Early IA cross-check.

---

## `/market` hub — hydrated UI (anonymous session)

Observed strings after load (Playwright, `zh-CN`, ~6s wait). Confirms **`/market` is a vol-centric scanner**, not a generic quote-only landing page.

**Global nav:** OpenVlab · **市场** · **行情** · **波动率** · **期货** · **异动** · **策略** · **交易** · **社区** · **登录**.

**Toolbar / filters:** **品种板块** · **交易所** · **自选** · **全部** · **股指** · **金属** · **能化** · **农副** · **油脂** · **黑色** · **仅夜盘** · **外盘**.

**Leaderboard strips (each: 名称 / 涨幅% / 隐波变化 / 分时预览):**

| Strip | Purpose (inferred) |
|-------|--------------------|
| **隐波最大上升** | Largest implied-vol **increases** (ranking underlyings). |
| **隐波最大下降** | Largest IV **drops**. |
| **波动率溢价最高** | **隐波 − 实波** (IV vs realized) most positive — “expensive” options vs realized. |
| **波动率溢价最低** | Same spread most **negative** — IV cheap vs realized vol. |

**Main grid:** **选择品种** · **选择到期日** · **导出** (**CSV** / **XLSX** / **JSON**). Columns include **名称** · **最新价** · **标的涨幅%** · **剩余时间** · **当月隐波** · **隐波变化** · **隐波涨速** · **实波** · **溢价** · **当月偏度** · **隐波百分位** · **偏度百分位** · **走势预览** (intraday thumbnail). Mix of **股指 ETF** (e.g. 科创板50ETF / 科创50ETF), **商品期货主连** (氧化铝、沪镍、沥青、对二甲苯、乙二醇、尿素、美原油、沪银等), and **贵金属** (钯、铂).

**Takeaway:** `/market` productizes **cross-sectional implied vol + RV spread + skew/percentile** in one scannable table, with **sector / night-session / overseas** filters — strong overlap in *intent* with pro vol dashboards elsewhere, tuned to **CN futures + ETF options** universe.

---

## One-line positioning

**China-focused, “Wall Street–grade” options analytics and charting** — self-described as 专业、极简、跨平台的期权行情与策略分析平台 (“professional, minimal, cross-platform options quotes and strategy analysis”), aimed at retail sophistication with institutional framing.

---

## Information architecture (public)

| Area (Chinese) | Role (inferred) |
|----------------|-----------------|
| **市场** | App entry / market hub — primary CTA from homepage (“开始使用” → `/market`). |
| **行情** | Quotes / market data. |
| **波动率** | Vol analytics (see Pro routes below). |
| **期货** | Futures context (common in China retail options stack). |
| **异动** | Unusual / flow-style monitoring (positioning language in ecosystem). |
| **策略** | Strategy construction / scanning. |
| **交易** | Trading workflow (depth unknown without login). |
| **社区** | Community / social layer. |

Homepage hero explicitly bundles three pillars: **策略构建**、**波动率**、**异动** (strategy builder, volatility, flow/“异动”).

---

## Product surfaces we could verify from marketing copy

- **Volatility suite (Pro-advertised)**  
  - [波动率云图 `/volatility/cloud`](https://www.openvlab.cn/volatility/cloud) — full-market IV distribution; dual view (ΔIV / 今日IV); sector / exchange / night session filters; strike sort + auto refresh.  
  - [波动率总览 `/volatility/overview`](https://www.openvlab.cn/volatility/overview) — cross-market vol scan, expiry comparison, sector grouping, charts + term structure.  
  - [期限结构 `/volatility/term-structure`](https://www.openvlab.cn/volatility/term-structure) — multi-product term structure, premium/discount structure.  
- **外盘数据** — “Scarce” **overseas options** real-time data sold as **leading indicator** for **domestic (内盘)** pricing — clear differentiation vs US-only competitors.  
- **教学中心** [`/teaching`](https://www.openvlab.cn/teaching) — docs / tutorials (“学习指南与教程”); onboarding path from homepage (“如何使用” → `teaching?section=doc-1`).  
- **Mobile** — Android APK hosted on `downloads.openvlab.cn`; iOS “即将上线”; Android described as H5 wrapper first, iterating.

Stack signal: **Next.js** (`/_next/image` URLs).

---

## Monetization & distribution (differentiated)

- **Pro Tool Suite** — packaged advanced vol + term structure + **外盘**; **historical vol data** listed as active Pro entitlement.  
- **Influencer / educator channel (合作大V)** — Pro bundled with **paid offline courses** or **designated online services** from named KOLs (微信 / B站 / 小红书 / 抖音 links on [`/pro/influencer`](https://www.openvlab.cn/pro/influencer)). Copy emphasizes **methodology → same workflow in the tool**.  
- **Roadmap (public)** — API access, faster realtime, and future features “自动纳入 Pro” — signals **API + latency** as upgrade levers.

---

## What we can learn (for TradingFlow-style products)

1. **Bundle education + software** — Tight loop: pay educator → unlock Pro; reduces CAC for tools and gives educators a tangible deliverable beyond chat groups.  
2. **Volatility as hero SKUs** — Cloud / overview / term structure are **named, screenshot-ready modules** with concrete filters (ΔIV vs IV0, sector, night session). Good pattern for landing pages and tier gating.  
3. **Cross-market wedge** — **外盘期权** as **signal for 内盘** is a crisp narrative where data scarcity supports premium positioning.  
4. **Three-pillar IA** — Strategy + vol + 异动 is easy to communicate on homepage; mirrors how sophisticated retail actually chunks the problem.  
5. **Distribution in China** — Deep integration with **WeChat / short video / Xiaohongshu** funnels; less reliance on a single English Twitter-style channel.  
6. **Mobile pragmatism** — Ship **Android H5 shell early**, promise native App Store later — balances time-to-market vs “complete app” narrative.  
7. **Tech** — Next.js + image CDN is standard; competitor parity is about **data + vol UX + educator partnerships**, not exotic front-end stack.

---

## Risks / unknowns

- Depth of **交易** execution, broker connectivity, and compliance (not audited).  
- Real-time quality, full symbol coverage, and **期货** vs listed options depth.  
- **异动** and **策略** surfaces vs US flow incumbents (not opened in this pass).  
- Logged-in-only columns, rate limits, or export caps on **`/market`** (anonymous grid only).

---

## Reference URLs

| URL | Note |
|-----|------|
| https://www.openvlab.cn/ | Positioning, pillars, milestones, Android APK |
| https://www.openvlab.cn/market | Vol scanner hub — IV/RV/skew grid + leaderboards (hydrated; see section above) |
| https://www.openvlab.cn/pro/influencer | Pro features + KOL partnership model |
| https://www.openvlab.cn/teaching | Documentation / learning hub |
| https://www.openvlab.cn/volatility/cloud | Vol cloud (linked from Pro) |
| https://www.openvlab.cn/volatility/overview | Vol overview |
| https://www.openvlab.cn/volatility/term-structure | Term structure |

Repo cross-link: strategy README already cites OpenVlab teaching — [`doc/strategy/README.md`](../README.md).
