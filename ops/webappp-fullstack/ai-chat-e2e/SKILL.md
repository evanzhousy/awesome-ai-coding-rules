---
name: ai-chat-e2e
description: >-
  Browser E2E runbook for all in-app TradingFlow AI features: global sidebar shell,
  explain/attach (Rank, Option Trades, drawers, Portfolio), AI Insight, Home Customize
  with AI → Build as Recipe, cookbook build/new/Edit with AI, Select element picker,
  render_view, thread/stop/feedback, consent + credits, Skills, Messaging-apps link
  mint, and optional memory/schedule chat tools. Use when smoke- or regression-testing
  AI after changes to the sidebar, AssistantChatProvider, /api/ai/chat, assistant tools,
  recipe workspace, ElementPicker, Home workflows, Skills, or Assistant Channels settings.
  Runs against a LOCAL dev server (AI gated by AI_ENABLED). Out of band: Market Recap
  Cursor automation, scheduled digest delivery, live Slack/Telegram/Discord bot turns.
disable-model-invocation: true
---

# AI Features — Browser E2E Runbook

Work directly in the current session. No `/goal` or Master/Subagent loop — scope the flows,
run them, report pass/fail, and clean up test recipes / skills / threads.

This runbook covers **every in-app AI product surface** that a user reaches through the Browser
plugin (`cursor-ide-browser`). The primary UI is the global docked **"TradingFlow AI"** sidebar
(left), plus cookbook / Home / Settings entry points that open or feed that sidebar. Do not use
`claude-in-chrome`, Playwright scripts, or the non-AI `ops/browser-e2e-product-review.md` for LLM
turns (that runbook explicitly routes AI here).

Canonical owner: `ops/ai-chat-e2e/SKILL.md` (rules copy:
`ops/webappp-fullstack/ai-chat-e2e/SKILL.md`).

Domain truth (read the rows in scope before driving):

| Area | Docs |
| --- | --- |
| AI Assistants overview | `doc/domain-knowledge/shared/functionality.md` (AI Assistants) |
| Cookbooks AI Insight / Edit with AI | `doc/domain-knowledge/cookbooks/domain-invariants.md`, `functionality.md` |
| Assistant Channels | `doc/domain-knowledge/assistant-channels/domain-invariants.md`, `functionality.md` |
| Skills | `doc/domain-knowledge/skills/domain-invariants.md`, `functionality.md` |
| Schedules (chat tools only) | `doc/domain-knowledge/schedules/domain-invariants.md` |

## Feature map (what this runbook covers)

| ID | Feature | Primary entry | Browser success (short) |
| --- | --- | --- | --- |
| **0** | Sidebar shell | Header `✦ AI` / `✕` Close assistant | Opens; close **sticks** |
| **A** | Explain / attach | Open AI on Rank / Option Trades | Attach chip; grounded answer; `/api/ai/chat` ≠ 404 |
| **B** | Build recipe from surface | “Build a recipe from this view” | `propose_recipe` + Apply / Open in workspace |
| **C** | New recipe workspace | `/app/cookbooks` → `+ New recipe` | Create→edit flip; Save |
| **D** | Edit with AI | Report `Edit with AI` | Fork; `patch_recipe` updates preview |
| **E** | Select element picker | Composer `Select element` | Pills; `recipeElements` (+ rows or bundled snapshot) |
| **F** | Non-thinking stream | Any turn | Text/tool parts; **no** Reasoning panel |
| **G** | Thread / Stop / feedback | Sidebar new/clear/history; Stop; Retry/Copy/rate | Transcript swaps; abort no charge; actions work |
| **H** | `/app/ai` guide | `/app/ai` | Guide/catalog loads (not a chat turn) |
| **I** | Ask AI (drawers) | Drawer header `Ask AI` (+ Select) | Sidebar opens with that drawer snapshot |
| **J** | Product / knowledge Q&A | Any page, no surface | How-to / glossary answer without recipe tools |
| **K** | `render_view` | Ranking/chart question in chat | Inline chart/table/KPI; optional Save as recipe |
| **L** | AI Insight | Cookbook report `AI Insight` | Read-only insight; no recipe mutation |
| **M** | Consent + credits + billing | First open; credits pill; `/app/billing` | Consent gate; meter/OOC; usage history |
| **N** | Messaging apps mint | Settings → Messaging apps | Generate link code / list (when flag on) |
| **O** | Skills | Settings → Skills; in-chat save_skill | CRUD + next-turn injection (when flag on) |
| **P** | Home Customize with AI | `/app/home` → `Customize with AI` | Clarification (0 credits) → proposal → Build as Recipe |
| **Q** | Memory / tools (optional) | Chat remember / watchlist / portfolio / Massive | Visible tool outcome |
| **R** | Schedule via chat (optional) | Chat create/list schedule | Settings list updates; delivery itself is OUT |

## Scope presets

**Default smoke** (run unless the user narrows further): **0, A (Rank + one OT route), B, C, D, E, F, L, P, M (consent + credits pill visible).**

**Full AI suite:** default + **G, H, I, J, K**, and when flags allow **N, O**. Optional **Q, R** only if the user asks.

**Always out of this runbook:**

1. **Market Recap authoring** — Cursor automation out-of-band; `/app/market-recap` is published prose (use `ops/browser-e2e-product-review.md` for freshness).
2. **Scheduled digest delivery runner** — data-only, no LLM / credits / consent.
3. **Live platform assistant turns** — Slack / Telegram / Discord / Messenger webhooks need bot credentials; Browser covers Settings mint only (**N**).
4. **MCP / published API skills** — unwired product surface.
5. **PostHog analytics correctness** — not a user-visible Browser outcome.
6. **Stripe credit-pack webhook reconciliation** — backend ops, not sidebar smoke.

## Shared gates (every LLM turn)

Order: **paid entitlement** → **AI consent** (`users.ai_consent`) → **rate limit** → **credits**.

| Gate | Visible / network signal |
| --- | --- |
| `AI_ENABLED` | Missing `✦ AI` in header; `/api/ai/chat` → `404 FEATURE_DISABLED` |
| Unpaid / guest | Paywall / login; no premium AI send |
| Consent | `AIConsentGate` Agree / Decline before composer |
| Credits | Sidebar credits pill; out-of-credits replaces composer; Retry disabled when OOC |
| Recipe edit (prod) | `@tradingflow.com` + PostHog `recipe-edit-enabled`; **always on in local/dev/test** |
| Channels | `ASSISTANT_CHANNELS_ENABLED` (prod often off) + per-platform PostHog |
| Skills | `USER_SKILLS_ENABLED` (prod often off); on in local/dev when flag allows |

Kill switch: `FEATURE_FLAGS.AI_ASSISTANT_ENABLED` / `isAiAssistantEnabled()` — document as prereq; do not matrix every combo unless asked.

## Prerequisites

1. **Dev server** on `http://localhost:8000` (`pnpm dev`). AI is ON in `pnpm dev` and `pnpm build:test`
   (`VITE_ENABLE_AI=true`); OFF in prod `pnpm build` until `VITE_ENABLE_AI=true` / flag. Source:
   `src/domain/ai/config.ts`.
2. **Paid test account** — `active+clerk_test@example.com` · OTP `424242`
   (`AGENTS.md`).
3. Backend reachable (ClickHouse + Neon) so `run_read_only_sql`, threads, and recipe save work.
4. Prefer local over testapp when exercising LLM turns (credits + kill-switch control). If the user
   forces testapp, confirm AI is enabled there first.

## Setup

Use the Cursor Browser plugin (`cursor-ide-browser`):

1. Navigate to `http://localhost:8000/app/rank/contracts`. Wait for first load (~8s).
2. Prefer a fresh tab unless a `localhost:8000` tab is already signed in.
3. If redirected to sign-in: test email → OTP `424242`.
4. Snapshot / screenshots for UI; CDP/`Runtime.evaluate` for fiber parts, request-body interception,
   console/network (see [Verifying agent state](#verifying-agent-state-techniques)).

---

## Flow 0 — Sidebar open / close (regression gate; run first)

1. Confirm `✦ AI` in the **top-right header**.
2. Click `✦ AI`. Left-docked **"TradingFlow AI"** opens (header new/clear/history/`✕`, composer, disclaimer).
3. Click `✕` (`aria-label="Close assistant"`). Panel must close **and stay closed** (~1s).
4. Re-open with `✦ AI` for later flows.

---

## Flow A — Explain / attach (Rank + Option Trades)

1. On `/app/rank/contracts`, open the sidebar. Confirm attach chip (e.g. `✦ Rank · Contracts`).
2. Confirm suggestions: “What does this mean?” / “Build a recipe from this view” when a surface is attached.
3. Send **“What does this mean?”**.
4. Verify `POST /api/ai/chat` is 200/streaming (not 404). Attach chip flips to re-attach after send.
5. Agent streams a grounded explanation (**no** `propose_recipe`).
6. Repeat attach+one short question on `/app/option-trades/historical` or `/live` (whichever loads rows).
   Confirm a distinct Option Trades attach label and a grounded answer.

---

## Flow B — Build a recipe from a data surface

1. On `/app/rank/contracts`, send **“Build a recipe from this view”**.
2. Expect schema discovery / `run_read_only_sql` then **`propose_recipe`**
   (`tool-propose_recipe:output-available` — snake_case; camelCase is a bug).
3. Inline ProposedRecipe card: **Apply** and **Open in workspace** both present.
4. Click **Open in workspace** → `/app/cookbooks/<id>/edit` with live preview + docked sidebar.
5. (Optional) From a later propose card, click **Apply** once and confirm no double-insert / broken preview.

---

## Flow C — New recipe (create mode)

1. `/app/cookbooks` → **`+ New recipe`** → `/app/cookbooks/new`.
2. Empty state + sidebar auto-open. Send e.g. **“Top 5 symbols by total option premium today”**.
3. First `propose_recipe` flips canvas to **live preview** (create→edit). ✅
4. **Save** → header shows Saved.

---

## Flow D — Edit with AI (fork)

1. Open a template report, e.g. `/app/cookbooks/zero-gamma-flip`. Confirm **Edit with AI**.
2. Click → `/edit` workspace (fork). Send: **`Rename the recipe title to "QA Test Title".`**
3. Expect **`patch_recipe`** and main-pane title → “QA Test Title” (agent → sync → `applyPatch` → preview).
4. Optional: workspace header Select → one block chip (multi-element picker is Flow E).

---

## Flow E — Global “Select element” picker

ONE global picker in the sidebar composer (not a page-header Annotate button). Works on any `/app` page.

**Channels:**

- **Recipe** (report or `/edit`): `annotateData` + `[data-block-index]` → element with `rows` ≤12, no `snapshot`.
- **Data page** (Rank / Option Trades / drawers): element text + bundled page `snapshot`, no `blockIndex`/`rows`.

**Heavy-page caveat:** chart-heavy reports (e.g. `market-recap`) can freeze screenshots/JS during streams.
Drive picks between turns; assert intercepted `/api/ai/chat` body + DOM; recover with navigate away/back.
Prefer light `quick-test/edit` or Rank for picker checks.

1. **E0** — Sidebar open → composer shows **Select element** on data pages too (0 blocks OK). No header Annotate.
2. **E1** — Click → **Selecting — click any element** (`aria-pressed`); `document.body` has `data-tf-annotating` + crosshair.
3. **E2** — Click element → removable pill immediately (`[aria-label="Remove element"]`).
4. **E3** — Multi-select; remove one pill; last pill clears context.
5. **E4a** — Recipe send body: `attachedContext.kind === 'recipeElements'` with `rows` where applicable, **no** `snapshot`.
6. **E4b** — Data-page send: elements + `surfaceLabel` + bundled `snapshot`, **no** `rows`/`blockIndex`.
7. **E5** — Escape / toggle-off exits selecting; pills retained; picks stay valid across navigation.

---

## Flow F — Fast non-thinking stream

Thinking is disabled (`getAssistantThinkingProviderOptions()` → `undefined`).

1. Run any turn (E send or D rename).
2. Sidebar shows tool/text progress; **no** `<Reasoning>` panel.
3. Completion emits expected text/tool parts; missing `reasoning` is correct.

---

## Flow G — Thread controls, Stop, response actions

1. With a completed turn visible, use sidebar **new / clear / history** — transcript swaps; no crash.
2. Start a longer turn; click **Stop** while streaming — stream ends; aborted turn must **not** consume credits
   (credits pill unchanged vs pre-send, within normal refresh lag).
3. On an assistant reply, exercise **Copy**, **Retry**, and Helpful / Not helpful when visible. Retry disabled
   when out of credits.

---

## Flow H — `/app/ai` guide

1. Open `/app/ai`.
2. Guide / catalog / gallery content renders without console errors from `components/ai/*`.
3. Optional: open sidebar from here and send one general question (ties to Flow J).

---

## Flow I — Ask AI from drawers

1. `/app/rank/symbols` → open a symbol drawer (e.g. SPY) → settle Overview/GEX.
2. Click drawer header **Ask AI** — sidebar opens with that drawer/surface attached.
3. Send a short “What am I looking at?” — grounded answer; no recipe mutation.
4. Optional: drawer **Select element** uses the same global picker as Flow E.
5. Optional: Contract drawer Ask AI; Portfolio dashboard attach if `PORTFOLIO_ENABLED`.

---

## Flow J — Product / knowledge Q&A

1. On any page with sidebar open and **no** special recipe edit intent, ask a product question
   (e.g. “What is Net DEX?” or “How do I open Live Option Trades?”).
2. Expect a markdown answer (glossary / knowledge tools OK). Should **not** call `propose_recipe` /
   `patch_recipe` unless the user asked to build/edit.

---

## Flow K — `render_view` + Save as recipe

1. Ask for a small ranked table or chart (e.g. “Show a table of top 5 symbols by total premium today”).
2. Expect an inline **`render_view`** (or equivalent) chart/table/KPI **in the thread**.
3. Heavy turns may cost **2 credits** — note pill delta.
4. If **Save as recipe** appears, click once → workspace/save path without double-create. Skip if rollout hides it.

---

## Flow L — AI Insight (cookbook report)

1. Open an official template report (prefer a light template, not `market-recap` for this flow).
2. Click **AI Insight** (paid). Sidebar opens with recipe outline + trimmed run data attached.
3. Insight streams read-only analysis. Confirm **no** `patch_recipe` / `propose_recipe` mutation of the template.
4. Guest/unpaid: AI Insight must paywall, not silently fail.

---

## Flow M — Consent, credits, billing

1. **Consent** — On a fresh test identity (or cleared consent if available), open `✦ AI`. Agree unlocks composer;
   Decline keeps chat blocked. Do not burn the seeded `active+` account’s consent without a restore plan.
2. **Credits pill** — After a successful turn, pill updates (or stays consistent with balance).
3. **Out of credits** — Only when the user authorizes draining/using an OOC fixture: composer replaced by OOC
   panel; View billing / Buy when enabled; `/api/ai/chat` returns quota error.
4. **`/app/billing`** — AI Credits balance + Usage History rows (date, credits, source) when the account has usage.
5. **Credit pack purchase** — optional; only with explicit user auth (Stripe test mode).

---

## Flow N — Messaging apps (Settings mint only)

Run only when Messaging apps UI is visible (`ASSISTANT_CHANNELS_ENABLED` / PostHog).

1. Settings → **Messaging apps**.
2. **Generate link code** for an enabled platform; code appears; list/unlink works.
3. Optional: ask sidebar “connect Telegram” → `create_channel_link_code` shows a code in-thread.
4. Do **not** require a live Telegram/Slack message round-trip in this runbook.

---

## Flow O — Skills

Run only when Skills UI is visible (`USER_SKILLS_ENABLED`).

1. Settings → **Skills** — create a temporary skill (clear name like `QA E2E skill <date>`), edit, pause, delete.
2. Or in chat: “Always prefer weekly GEX when I ask about walls” → `save_skill`; confirm it appears in Settings.
3. Next turn should reflect the skill when enabled. Delete the QA skill before finishing.

---

## Flow P — Home Customize with AI → Build as Recipe

1. `/app/home` → pick a guided template → selected-template **Customize with AI** (aside primary; Current Build footer is the edited-sequence entry).
2. Left sidebar opens. First clarification phase is **code-owned (0 credits)** — answer the clarifying question.
3. Ordered proposal appears (**0 credits**, no model authoring of the workflow itself).
4. Choose **Build this as a Recipe** (exact post-proposal action) → one forced `propose_recipe` conversion.
5. Preview card; user must **Apply** / **Open in workspace** — **no auto-save**.
6. Clean up any saved QA recipe.

---

## Flow Q — Memory / data tools (optional)

Only when the user asks:

- **Memory:** “Remember that I trade 0DTE SPY” → later turn uses it; “Forget …” clears.
- **Watchlist / portfolio tools:** ask about the user’s lists or portfolio when connected.
- **Massive market data:** quote/profile questions when `MASSIVE_MARKET_DATA_ENABLED`.

Record tool part types; do not treat missing optional tools as a product FAIL if the flag is off.

---

## Flow R — Schedule via chat (optional)

Only when the user asks and schedules are enabled:

1. Ask the sidebar to create/list/delete a recipe schedule for a **user** recipe (not a parameterized template
   that schedules reject).
2. Confirm Settings → Scheduled deliveries updates.
3. Do **not** wait for cron delivery or assert digest email/content here (non-LLM runner = OUT).

---

## Verifying agent state (techniques)

**Network** — track `/api/ai/chat` before send. Streaming POSTs may lack timing until complete; missing/404 +
error chip ⇒ gate off.

**Console** — errors matching `AgentContext|AssistantChat|api/ai|hook|Cannot`. Ignore pre-existing
`MissingTranslationError` for `zh-CN`.

**Agent message parts (React fiber)** — walk `__reactFiber$…` from the chat textarea to `messages[].parts`:

```js
function getFiber(el){const k=Object.keys(el).find(k=>k.startsWith('__reactFiber$'));return k?el[k]:null;}
const ta=document.querySelector('textarea[placeholder*="Ask about this page"], textarea[placeholder*="Describe a change"]');
let f=ta&&getFiber(ta),hops=0,found=null;
while(f&&hops<60&&!found){for(const c of [f.memoizedProps,f.memoizedState]){if(c&&typeof c==='object'){for(const v of Object.values(c)){if(Array.isArray(v)&&v.length&&v[0]&&Array.isArray(v[0].parts)){found=v;break;}}}if(found)break;}f=f.return;hops++;}
JSON.stringify(found?found.flatMap(m=>(m.parts||[]).map(p=>p.type+(p.state?(':'+p.state):''))):null);
```

Expected: `text`, `step-start`, `tool-run_read_only_sql:output-available`, `tool-propose_recipe:output-available`,
`tool-patch_recipe:output-available`, `tool-get_recipe:output-available`, plus channel/skill tools when in scope.
Tool names are **snake_case** (`tool-proposeRecipe` camelCase is a bug). `reasoning` unexpected while thinking off.

**Preview title flip** — read the workspace title node, not the chat, before/after edits.

**Annotation DOM + request body (Flow E)** — toggle text `/Select element|Selecting/`; pills
`[aria-label="Remove element"]`; `[data-tf-annotating]`; intercept fetch body for `attachedContext`.

```js
window.__b=null;const of=window.fetch;
window.fetch=function(u,o){try{if(String(u).includes('/api/ai/chat')&&o?.body)window.__b=JSON.parse(o.body);}catch(e){}return of.apply(this,arguments);};
```

**Server-side thread poll** — when the renderer freezes, query Neon `chat_threads` for the prompt snippet and
read assistant `parts` (thread persists on `onFinish` only).

## Driving input (when Send is flaky)

Two separate page evaluations (React needs `input` before submit):

```js
// call 1
const ta=document.querySelector('textarea[placeholder*="Ask about this page"], textarea[placeholder*="Describe a change"]');
const setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
setter.call(ta,'Rename the recipe title to "QA Test Title".');
ta.dispatchEvent(new Event('input',{bubbles:true}));
'set';
```
```js
// call 2
document.querySelector('textarea[placeholder*="Ask about this page"], textarea[placeholder*="Describe a change"]').closest('form').requestSubmit();
'submitted';
```

## Known gotchas

- **Latency without thinking.** Raw `streamText` + tools; minutes-long pre-answer waits are unexpected. Poll
  fiber parts / Neon thread to distinguish work from provider failure.
- **Heavy report freezes.** Prefer Rank / light workspace for E/F/L; recover with navigate.
- **Intermittent Moonshot / Neon network.** Resend; failed turns do not persist.
- **HMR kills streams.** Do not edit source mid-turn.
- **Sidebar auto-opens once** per workspace entry, then respects toggle — re-check Flow 0 if close sticks fail.
- **Thread switch desync** with workspace preview is a known limitation, not a crash.
- **Mic / attachment buttons removed** — absence expected.
- **Native `alert`/`confirm`** freezes the extension — avoid delete-confirm paths or use app UI carefully.
- **Recipe-edit rollout** differs in prod; local/dev should always show Edit / New recipe when AI is on.
- **Channels / Skills** may be flag-off in prod builds — mark `not-in-scope` / `blocked`, not FAIL.

## Pass / fail

Report a matrix of flow ID → `pass` / `fail` / `blocked` / `not-in-scope`.

**Default smoke PASS when:**

- **0** close sticks; **A** grounded Rank (+ OT) answer, `/api/ai/chat` ≠ 404;
- **B** `propose_recipe` + card; **C** create→edit + Save; **D** `patch_recipe` updates title;
- **E** global Select element + correct `attachedContext` shapes; **F** no Reasoning panel;
- **L** AI Insight read-only; **P** Home Customize → Build as Recipe without auto-save;
- **M** consent/credits UX consistent with gates (at least pill + no false OOC on a paid test account).

**FAIL (with fiber `partTypes` / request body / network / screenshot) on:**

- 404 from `/api/ai/chat` when AI should be on; reopening close button;
- `propose_recipe` / `patch_recipe` that never updates preview;
- AI Insight or Ask AI mutating a template;
- Select/Annotate living in a **page header** instead of the sidebar;
- Select missing on a data page; JS hover overlay thrash / freeze in annotate mode;
- data-page pick missing bundled `snapshot`;
- Home Customize charging credits for the code-owned clarification phase;
- Build-as-Recipe auto-saving without Apply;
- hook/runtime errors from `components/ai/*`;
- tests requiring `reasoning` while thinking is disabled.

## Cleanup

- Delete recipes created in B/C/P from **My recipes** (`/app/cookbooks` or `deleteMyRecipe`).
- Delete QA skills from Settings → Skills (**O**).
- Clear or leave a clean chat thread if reusing the tab.
- Unlink any Messaging-apps test codes created in **N**.
- Do not leave Stripe/credit-pack purchases hanging unless the user owns cleanup.

## Report shape

```markdown
## AI E2E Report
- Environment: localhost:8000 / build / AI_ENABLED
- Persona: active+clerk_test@…
- Scope preset: default smoke | full suite | custom
- Flow matrix: id → status + one-line evidence
- Material failures:
- Credits / consent notes:
- Cleanup:
- Runbook maintenance: no change | <what changed>
```

## When to switch runbooks

| Ask | Use |
| --- | --- |
| Non-AI product walkthrough (Rank, OT, Market Recap freshness, billing UI without LLM) | `ops/browser-e2e-product-review.md` |
| Market Recap scheduled publish / authoring automation | `ops/market-recap/routine-prompt.md` + domain docs |
| Live Slack/Telegram/Discord assistant delivery | Separate channels integration runbook (not this file) |
| PostHog AI event quality | `ops/posthog-research.md` |

## Runbook self-maintenance

At end of run, update this file only for reusable drift (routes, entry labels, gates, new AI surfaces).
One-off numeric results and screenshots stay in the session report.

Update when:

- A new AI entry point ships (Ask AI, Insight, Home, Skills, Channels, credits UX).
- Tool names, attach-context shapes, or credit costs change.
- Flags flip default visibility for Skills / Channels / recipe-edit.
- Verification techniques stop working (fiber walk, fetch intercept).

Do not update for one-off flake retries or single-run numeric answers.

**Runbook maintenance:** expanded from sidebar/cookbook-only coverage to the full in-app AI feature map
(Flows G–R + scope presets + OUT list) after product inventory of shared/cookbooks/channels/skills docs.
