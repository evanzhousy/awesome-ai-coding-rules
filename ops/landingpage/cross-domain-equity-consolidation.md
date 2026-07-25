# Cross-domain SEO equity consolidation (doc + blog → www)

## Why

Semrush shows **doc.tradingflow.com** (GitBook) and **blog.tradingflow.com** (Substack) ranking for high-value concepts (call wall, option flow, GEX, gamma). Preferred PLG landers live on **tradingflow.com** (`/glossary/*`, `/learn/*`, `/blogs/*`, `/compare/*`).

Google consolidates when the **ranking host** points at the preferred URL via:

1. `rel=canonical` (best for near-duplicates), or  
2. **301 redirect**, or  
3. Strong editorial “updated guide” link + internal demotion of the legacy page.

**This landing repo cannot set headers on GitBook/Substack.** It maintains the map and strengthens www hubs. Operators apply the GitBook/Substack steps below.

## Source of truth

```
tradingflow-web-landingpage/src/lib/seo/cross-domain-equity.ts
```

- `CROSS_DOMAIN_EQUITY_MAP` — external URL → preferred www path + keywords  
- `getDocCanonicalTargets()` — paste into GitBook / CF  
- `getSubstackEditorialTargets()` — Substack post checklist  
- Glossary pages wire `sameAs` legacy URLs into DefinedTerm JSON-LD (www remains `url`)

Regenerate a checklist anytime:

```bash
cd tradingflow-web-landingpage
bun -e "
import { getDocCanonicalTargets, getSubstackEditorialTargets } from './src/lib/seo/cross-domain-equity.ts';
console.log('=== GitBook canonical targets ===');
for (const d of getDocCanonicalTargets()) {
  console.log(d.sourcePath, '→', d.canonicalWww, d.keywords.slice(0,3).join(', '));
}
console.log('\\n=== Substack editorial ===');
for (const p of getSubstackEditorialTargets()) {
  console.log(p.postPath, '→', p.preferredWww);
}
"
```

## Priority order (from keyword plan)

| Priority | Preferred www | Legacy hosts to fix first |
|----------|---------------|---------------------------|
| P0 | `/glossary/option-flow/` | doc `.../realtime-option-trades-flow` |
| P0 | `/glossary/call-wall/` (+ put wall) | doc `.../call-wall-vs-put-wall` |
| P0 | `/glossary/gamma-exposure/` | doc `.../gamma-exposure-gex` (+ child pages) |
| P1 | `/learn/greeks-and-gex/` | Substack gamma posts |
| P1 | `/blogs/option-trades/`, `/learn/option-trades/` | Substack track-options / flow docs |

## GitBook (`doc.tradingflow.com`)

Host: GitBook (response headers include `x-gitbook-target`).  
**Org/site:** TradingFlow → Docs site **TradingFlow Knowledge Hub** (`site_ZWmKf`) → public URL `https://doc.tradingflow.com/product-docs/`.

**App UI (2026-07 probe via ego-browser):**  
`https://app.gitbook.com/o/XdxFRtNyD1VwR0BhUdK4/sites/site_ZWmKf/settings/redirects`

- Site plan badge: **BASIC**  
- **Custom site redirects require GitBook Premium** (~$109/mo upgrade modal when clicking “Add redirects”).  
- On BASIC you cannot save redirect rules in GitBook UI. Use **Cloudflare bulk redirects** (below) or upgrade Premium.

**Bulk redirect CSV (ready to import):**  
`tradingflow-web-landingpage/public/investors/seo/cloudflare-doc-redirects.csv`

### Option A — Canonical (preferred when page stays live)

For each path from `getDocCanonicalTargets()`:

1. Open the page in GitBook editor.  
2. Add custom HTML / head injection if your plan supports it:

```html
<link rel="canonical" href="https://tradingflow.com/glossary/call-wall/" />
```

Use the **exact** `canonicalWww` from the map (trailing slash).

3. At the **top** of the page body, add:

> **Updated guide:** [Call wall (TradingFlow glossary)](https://tradingflow.com/glossary/call-wall/) — preferred definition and product workflow. Tutorial: [Option chain & OI](https://tradingflow.com/learn/option-chain-and-oi/).

4. Soften H1 competition: keep product-docs title operational (“How walls appear in the app”) rather than pure “What is a call wall?” when the glossary owns the definition query.

### Option B — Redirect (strongest)

In GitBook **Redirects** (or Cloudflare for `doc.tradingflow.com`):

| From | To |
|------|-----|
| `/product-docs/concepts/call-wall-vs-put-wall` | `https://tradingflow.com/glossary/call-wall/` |
| `/product-docs/concepts/realtime-option-trades-flow` | `https://tradingflow.com/glossary/option-flow/` |
| `/product-docs/concepts/gamma-exposure-gex` | `https://tradingflow.com/glossary/gamma-exposure/` |
| `/product-docs/concepts/gamma-exposure-gex/*` (children) | `https://tradingflow.com/glossary/gamma-exposure/` or specific learn URLs |

Prefer **301**. Keep a short product-only page only if the app still links to doc for in-product help—then use Option A, not redirect.

### Cloudflare (implemented 2026-07 on account `evanzhousy`)

`doc.tradingflow.com` is a **proxied** CNAME → GitBook (`9f7c8aae4a-hosting.gitbook.io`). DNS comment already noted docs-sunset redirects.

**What is live:**

1. **Zone Dynamic Redirect ruleset** — `TradingFlow docs sunset redirects`  
   Zone `tradingflow.com` (`b4a7a0d7151b1b8187db2b85a364dc6f`)  
   Phase `http_request_dynamic_redirect`  
   This is what actually wins for overlapping paths (updated 2026-07 to glossary hubs).

2. **Account Bulk Redirect list** — `doc_to_www_equity_202607` (14 items)  
   + account rule `http.request.full_uri in $doc_to_www_equity_202607`  
   Dashboard: Delivery & performance → Bulk redirects  
   Backup for list-based maintenance; CSV also at  
   `tradingflow-web-landingpage/public/investors/seo/cloudflare-doc-redirects.csv`

**Preferred targets (glossary-first):**

| Doc path | 301 → |
|----------|--------|
| `/product-docs/concepts/call-wall-vs-put-wall` | `/glossary/call-wall/` |
| `/product-docs/concepts/gamma-exposure-gex` (+ children) | `/glossary/gamma-exposure/` |
| `/product-docs/concepts/realtime-option-trades-flow` | `/glossary/option-flow/` |
| `/product-docs/concepts/delta-exposure-dex` | `/glossary/delta-exposure/` |
| `/product-docs/overview/data-driven-trading-strategy` | `/learn/why-tradingflow/` |
| `/product-docs` root | `/glossary/` |

### Critical: deploy www before (or with) glossary-first 301s

**Status 2026-07-24 recheck:** Cloudflare zone rules **do** emit 301 → `/glossary/*` (confirmed e.g. gamma path → `https://tradingflow.com/glossary/gamma-exposure/`). Production `tradingflow.com` at recheck still served the **pre-glossary** static export (sitemap `lastmod` ~2026-07-12):

| Destination | Live status |
|-------------|-------------|
| `/glossary/`, `/glossary/*` | **404** |
| `/compare/*`, `/guides/*` | **404** |
| `/learn/*` (greeks-and-gex, option-chain-and-oi, option-trades, why-tradingflow, learn/glossary) | **200** |
| `/blogs/*` product posts | **200** |

A 301 into a 404 burns crawl equity. Until the landing repo that contains `/glossary/*` is **built and deployed** (`bun run build` → `bun run deploy` / your host rsync), either:

1. **Preferred:** ship www (glossary + P0 SEO) so CF targets resolve 200, or  
2. **Interim only:** point the zone rules / bulk list back at live learn hubs:

| Doc path | Interim 301 (live today) |
|----------|--------------------------|
| call-wall-vs-put-wall | `/learn/option-chain-and-oi/` |
| gamma-exposure-gex (+ children) | `/learn/greeks-and-gex/` |
| realtime-option-trades-flow | `/learn/option-trades/` |
| data-driven-trading-strategy | `/learn/why-tradingflow/` (already) |
| product-docs root | `/learn/` or `/learn/glossary/` (not `/glossary/` until deploy) |

After deploy, re-verify **both** hop and destination:

```bash
# 301 hop (use public DNS / CF edge if local VPN fake-ip 198.18.x breaks TLS)
curl -sI "https://doc.tradingflow.com/product-docs/concepts/call-wall-vs-put-wall" | rg -i 'HTTP/|location:'
# expect: 301 + location: https://tradingflow.com/glossary/call-wall/

# destination must be 200
curl -s -o /dev/null -w '%{http_code}\n' "https://tradingflow.com/glossary/call-wall/"
```

## Substack (`blog.tradingflow.com`)

Substack does **not** offer HTTP 301 redirects or reliable custom `rel=canonical` for custom-domain posts. Use **editorial consolidation** only (above-the-fold “Updated guide” links).

**Editor path:** `https://blog.tradingflow.com/publish/post/{postId}` then **Update → Update now** (does not re-email).

### Implemented 2026-07-25 (ego-browser, TradingFlow Blog editor)

| Public post | Publish postId | Above-fold links (live 200 on www) |
|-------------|----------------|-------------------------------------|
| [/p/what-is-gamma-in-options-trading](https://blog.tradingflow.com/p/what-is-gamma-in-options-trading) | `147327489` | `/learn/greeks-and-gex/`, `/blogs/gex-screener/` |
| [/p/understanding-option-greeks-a-deep](https://blog.tradingflow.com/p/understanding-option-greeks-a-deep) | `148042182` | `/learn/greeks-and-gex/`, `/blogs/gex-screener/` |
| [/p/how-to-track-options-opening-and](https://blog.tradingflow.com/p/how-to-track-options-opening-and) | `143354092` | `/blogs/option-trades/`, `/learn/option-trades/` |

Intro copy pattern (verified live):

> Updated guide — Prefer our current tutorial: Greeks & GEX (https://tradingflow.com/learn/greeks-and-gex/). Product: GEX screener (https://tradingflow.com/blogs/gex-screener/).

**Note:** Linked to **live** `/learn/*` and `/blogs/*` hubs (glossary `/glossary/*` still 404 on production until www deploy). After glossary ships, optionally add glossary URLs to the same intros.

Optional later: footer CTA block; reframe SEO titles away from pure definition queries.

## www (this repo) — already automated

- Glossary hubs strengthened for option flow / UOA / walls / GEX.  
- DefinedTerm JSON-LD `url` = www glossary; `sameAs` = legacy doc/blog URLs when mapped.  
- Internal links: learn ↔ glossary ↔ compare ↔ product blogs.  
- Do **not** mass-link from www ranking pages back to doc for the same head terms (avoids sending crawl equity outward).

## Verification

1. After GitBook/Substack changes, re-fetch headers:

```bash
curl -sI "https://doc.tradingflow.com/product-docs/concepts/call-wall-vs-put-wall" | rg -i 'location|canonical'
```

2. Rich Results / URL Inspection: preferred www URL is indexable; legacy shows canonical or redirect.  
3. Semrush/GSC: watch query move from `doc.` / `blog.` hosts to `tradingflow.com` for wall/flow/GEX terms (weeks, not days).  
4. Unit tests: `bun test src/lib/seo/cross-domain-equity.test.ts`

## Do not

- Invent 301s on www for paths that never existed.  
- Dual-post identical “What is X?” essays on Substack and glossary.  
- Canonical to www while still aggressively ranking a conflicting H1 on doc without an “updated guide” link (confuses users + crawlers).
