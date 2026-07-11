---
name: ai-chat-e2e
description: >-
  Browser E2E runbook for an AI agent (with the claude-in-chrome MCP tools) to exercise the unified
  TradingFlow AI sidebar end-to-end: the global toggle, explain-the-page mode on a data page, build/edit a
  cookbook recipe, create a new recipe, ANNOTATE recipe elements as focused context (the "Select element"
  Cursor-design-mode flow), and the non-thinking assistant stream. Use when asked to smoke-test or
  regression-test the AI chat feature after a change to the sidebar, the AssistantChatProvider/sync-loop, the
  /api/ai/chat endpoint, the assistant runtime (streamText + tools), the recipe workspace, the element picker
  (RecipeElementPicker), or the assistant stream. Runs against a LOCAL dev server (AI is gated by AI_ENABLED).
---

# AI Chat — Browser E2E Runbook

This runbook drives the **one** AI surface — the global docked **"TradingFlow AI"** sidebar (left side) — through
its three jobs: (1) answer/explain the on-screen data, (2) build a recipe, (3) edit a recipe in the workspace.
It is written for an autonomous agent using the `mcp__claude-in-chrome__*` tools.

## What you are testing

- **Sidebar shell** — a header toggle (`✦ AI`) opens a left-docked panel ("TradingFlow AI"); a close (`✕`)
  button closes it and the close must **stick** (regression: it used to reopen itself).
- **Explain mode** — on a data page (`/app/rank/contracts`, Option Trades, drawers) the sidebar auto-attaches
  the page's snapshot (an "attach this view" chip) and the agent answers grounded in it.
- **Build mode** — "build a recipe from this" → the agent calls `propose_recipe` → an inline preview card with
  **Apply** / **Open in workspace** on a data page.
- **Workspace mode** — `/app/cookbooks/<slug>/edit` (fork) or `/app/cookbooks/new` (create): the sidebar is the
  chat, the main pane is a live `RecipeRenderer` preview that updates as the agent proposes/patches.
- **Annotate mode** — an **always-visible "Select element"** toggle in the sidebar composer drives ONE global
  picker (Cursor design-mode): click any element on **any** page → each becomes a removable **pill** → prompt
  against them. A recipe block carries its data rows; a data-page element carries its text + the page's bundled
  surface snapshot — both as a focused `recipeElements` context.
- **Fast non-thinking stream** — assistant thinking is intentionally disabled. Turns should stream text/tool
  updates without a `reasoning` part or AI-Elements `<Reasoning>` panel.

## Prerequisites (verify before driving the browser)

1. **Dev server up** on `http://localhost:8000` (`pnpm dev`). The AI surface is gated by `AI_ENABLED`
   (`src/domain/ai/config.ts` = `import.meta.env.DEV || import.meta.env.VITE_ENABLE_AI === 'true'`): ON in
   `pnpm dev` and the `pnpm build:test` test build (which sets `VITE_ENABLE_AI=true`), OFF in the prod
   `pnpm build` until the deploy sets `VITE_ENABLE_AI=true`. If `✦ AI` is missing from the header, AI is
   disabled (a prod build without the flag).
2. **Paid test account.** Opening the sidebar runs `requirePaidAction`; use the standard test login
   (from `AGENTS.md` / `tests/e2e/fixtures/auth.ts`):
   - Email `active+clerk_test@example.com` · OTP/verification code `424242`.
3. Backend reachable (ClickHouse + Neon) so the agent's `run_read_only_sql` + thread memory work.

## Setup

Load the browser tools in ONE call:

```
ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests
```

1. `tabs_context_mcp` first. Create a fresh tab (`tabs_create_mcp`) rather than reusing one, unless a
   `localhost:8000` tab is already signed in.
2. `navigate` to `http://localhost:8000/app/rank/contracts`. `wait` ~8s for first load.
3. If redirected to sign-in: enter the test email, submit, enter OTP `424242`. (Do **not** type real
   credentials — these are the shared test ones.)

## Flow 0 — Sidebar open / close (the regression gate; run this first)

1. Screenshot. Confirm `✦ AI` is in the **top-right header**.
2. Click `✦ AI`. The left-docked **"TradingFlow AI"** panel opens (header with new/clear/history/`✕`, an input
   "Ask about this page, or build a recipe…", a disclaimer footer).
3. **Click the `✕` close button** (header, `aria-label="Close assistant"`). The panel must close **and stay
   closed** — re-screenshot after ~1s. ❌ If it reopens, the sync-loop/auto-open regression is back
   (`RecipeWorkspace`/`AssistantChatProvider` once re-fired open on every context-value change).
4. Re-open with `✦ AI` for the next flows.

## Flow A — Explain the data on /rank

1. With the sidebar open on `/app/rank/contracts`, confirm an **attach chip** is shown (e.g. `✦ Rank · Contracts`)
   — the page's surface auto-attached on open.
2. Confirm the **context suggestions**: "What does this mean?" and "Build a recipe from this view" (these appear
   only when a surface is attached; general chat shows "Top 10 symbols by total premium today" etc.).
3. Send **"What does this mean?"** (click the suggestion, or type + Enter — see *Driving input*).
4. Verify (see *Verifying agent state*): the request hits `POST /api/ai/chat` and returns 200/streaming (NOT
   404 — 404 means `AI_ENABLED`/the gate is off). The attach chip flips to the re-attach state
   ("Attach this view: …") — the surface was consumed (`onContextSent`).
5. The agent streams a grounded, plain-language **explanation** (no `propose_recipe` tool call — explain mode).
   Cold start can still take time, but a multi-minute wait is no longer expected now that thinking is disabled.

## Flow B — Build a recipe from a data surface

1. On `/app/rank/contracts`, open the sidebar, send **"Build a recipe from this view"**.
2. The agent discovers schema, dry-runs SQL (`run_read_only_sql` tool steps), then calls **`propose_recipe`**.
   Verify the part type `tool-propose_recipe:output-available` appears (see *Verifying agent state*).
3. On a data page the sidebar renders an **inline ProposedRecipe card** (a `RecipeRenderer` preview + an
   `Apply` and an `Open in workspace` button). ✅ Both buttons present.
4. Click **Open in workspace** → it saves the recipe and navigates to `/app/cookbooks/<slug>/edit`; the
   workspace loads with the live preview in the main pane and the sidebar still docked.

## Flow C — New recipe (create mode)

1. Navigate to `/app/cookbooks` (gallery). Confirm a **`+ New recipe`** button in the header.
2. Click it → `/app/cookbooks/new`. The main pane shows a **create empty-state** ("New recipe" + "Describe the
   report you want in the AI sidebar…"); the sidebar auto-opens.
3. Send a starter, e.g. **"Top 5 symbols by total option premium today"**.
4. On the first `propose_recipe`, the empty canvas flips to a **live preview** (create → edit). Confirm the main
   pane now renders the proposed recipe (title + blocks). ✅ The CREATE→EDIT flip is the key check.
5. Click **Save** → it persists; the header shows "Saved".

## Flow D — Edit with AI (fork an existing recipe)

1. Navigate to a recipe report, e.g. `/app/cookbooks/zero-gamma-flip`. Confirm an **"Edit with AI"** button.
2. Click it → `/app/cookbooks/zero-gamma-flip/edit`. The workspace forks the recipe (live preview in main pane).
3. Send a non-SQL edit: **`Rename the recipe title to "QA Test Title".`**
4. The agent calls **`patch_recipe`** (no dry-run). Verify the part `tool-patch_recipe:output-available` AND the
   **main-pane preview title updates** to "QA Test Title" (this is the end-to-end proof: agent → sync loop →
   `applyPatch` → preview re-render). A compact in-thread note "✓ Updated the recipe — see the live preview."
   appears in the sidebar (no inline card in the workspace).
5. (Optional) Use **Select** (the workspace header toggle) → click a preview block → confirm an attach chip
   ("Table #N" / "Chart · …") and that the next message targets that block. (This is the older single-block
   workspace select; the report's multi-element picker is **Flow E**.)

## Flow E — Global "Select element" picker (Cursor design-mode, any page)

The picker is **global**: ONE `ElementPicker` mounted in the sidebar, driven by an **always-visible**
`Select element` toggle in the composer (NOT a header button, NOT gated to recipes). It works on **any** page,
with two channels over the one picker:
- **Recipe surface** (`RecipeReportView` report OR `RecipeWorkspace` `/edit`) — the page registers
  `annotateData { recipe, datasets }` on the provider; a click inside a `[data-block-index]` maps to that block
  and attaches its trimmed `rows` (≤12) — the rich path.
- **Data page** (`/app/rank/*`, `/app/option-trades`, drawers — generic rows, no stable ids) — the click
  captures the element's text/identity via agentation (`identifyElement`/`getNearbyText`) and **bundles the
  page's active surface snapshot** (`getActiveContext().buildSnapshot()`) as the data.

> **Heavy-page caveat (recipe template reports).** A chart-heavy report (`market-recap` ≈30 charts) makes
> full-page **screenshots / `javascript_tool` time out** and can **freeze while a turn streams**. Drive the
> picker in short JS bursts **between** turns, assert on the intercepted `/api/ai/chat` body + DOM counts, and
> confirm completion via the **server-side thread poll** (see *Verifying*); recover with a `navigate` away and
> back. Data pages (a table, not 30 charts) and the light `quick-test/edit` workspace do NOT freeze — prefer
> them for picker checks.

1. **Gating (E0).** With the sidebar **open** on ANY `/app` page, the **`Select element`** toggle is in the
   composer (above the input) — including data pages with **0** `[data-block-index]`. It's absent only when the
   sidebar is closed. There is **NO "Annotate"/"Select" button** in any page header (the entry is the chatbot).
2. **Activate (E1).** Click `Select element` → label flips to **`Selecting — click any element`**
   (`aria-pressed=true`); **`document.body`** gets `data-tf-annotating` and `cursor:crosshair`. Recipe blocks
   highlight via the **pure-CSS** rule (`[data-tf-annotating] [data-block-index]:hover > *`); generic elements
   get a lightweight **rAF-throttled `.tf-annotate-hover`** class (paint-only — no overlay / `getBoundingClientRect`
   thrash; that froze the heavy report before). The sidebar (`[data-ai-sidebar]`) + top `header` are excluded so
   chat + nav still work while selecting.
3. **Single select (E2).** Click any element → it's added **immediately** as a removable **pill** (no popover).
   Each pill has `[aria-label="Remove element"]`. Label = the recipe block (`Chart · <title>`, `Table`, …) or,
   for a generic element, the pointed-at text (the cell value).
4. **Multi-select + per-element removal (E3).** Click more → one pill each. Remove one pill → only it drops,
   order preserved. Removing the **last** pill clears the `recipeElements` context (the pill row disappears).
5. **Send — recipe channel (E4a).** On a recipe surface, the `POST /api/ai/chat` body carries
   `attachedContext { kind:'recipeElements', elements:[{ blockIndex, blockType, label, selectedText?, rows? }] }`
   — a data block's `rows` ≤12; a markdown / no-query block has `rows` undefined; **no** `snapshot`. Pills clear
   after send (`onContextSent`).
6. **Send — data-page channel (E4b).** On `/app/rank/*` or `/app/option-trades`, a pick sends
   `attachedContext { kind:'recipeElements', elements:[{ label, selectedText, nearbyText, surfaceLabel }],
   snapshot:{ surfaceId, surfaceLabel, data } }` — **no** `blockIndex`/`rows` (generic), `surfaceLabel` = the
   page (e.g. "Rank · Contracts"), and the bundled `snapshot` IS the page's surface data. The agent answers
   about the element grounded in that page data (surface mode → streams text/tool updates, Flow F).
7. **Escape / toggle-off (E5).** `Escape` exits annotate mode (label → `Select element`; existing pills
   **retained**). Clicking the toggle again while `Selecting` also exits; mode off → clicks add nothing. Picks
   are self-contained (rows / snapshot captured at click time), so they **persist validly across navigation** —
   there is no stale-clear (that earlier report-unmount clear was removed with the global picker).

## Flow F — Fast non-thinking stream

Assistant thinking is intentionally disabled for now to keep Netlify-hosted turns fast. The assistant still uses
the raw Vercel AI SDK `streamText` tool loop, but `getAssistantThinkingProviderOptions()` returns `undefined`
and `getAssistantLanguageModel()` resolves the fast non-thinking model path. `sendReasoning: true` remains in
`chat.ts` for compatibility, but no `reasoning` parts should be emitted.

1. Run any turn (e.g. Flow E's send, or a Flow D rename).
2. While streaming, the sidebar should show normal assistant progress: tool parts and/or answer text. The
   `<Reasoning>` panel should not appear.
3. Verify the assistant completes and, when applicable, emits the expected text/tool part types. A missing
   `reasoning` part is expected.

## Verifying agent state (techniques)

**Network** — confirm the endpoint, not 404:
- `read_network_requests` with `urlPattern: "/api/ai/chat"` (call it BEFORE sending — tracking starts on first
  call). Streaming POSTs may not show resource timing until complete; a missing/404 entry with an error chip in
  the sidebar = the gate is off.

**Console** — `read_console_messages` with `onlyErrors: true, pattern: "AgentContext|AssistantChat|api/ai|hook|Cannot"`.
  Ignore pre-existing `MissingTranslationError` for `zh-CN` (unrelated i18n fallbacks).

**Agent message parts (React fiber)** — the most reliable signal for tool calls/streaming. Walk
`__reactFiber$…` from the chat textarea to the `messages[]` array and read each part's `type[:state]`:

```js
function getFiber(el){const k=Object.keys(el).find(k=>k.startsWith('__reactFiber$'));return k?el[k]:null;}
const ta=document.querySelector('textarea[placeholder*="Ask about this page"], textarea[placeholder*="Describe a change"]');
let f=ta&&getFiber(ta),hops=0,found=null;
while(f&&hops<60&&!found){for(const c of [f.memoizedProps,f.memoizedState]){if(c&&typeof c==='object'){for(const v of Object.values(c)){if(Array.isArray(v)&&v.length&&v[0]&&Array.isArray(v[0].parts)){found=v;break;}}}if(found)break;}f=f.return;hops++;}
JSON.stringify(found?found.flatMap(m=>(m.parts||[]).map(p=>p.type+(p.state?(':'+p.state):''))):null);
```

Expected part types: `text`, `step-start`,
`tool-run_read_only_sql:output-available`, `tool-propose_recipe:output-available`,
`tool-patch_recipe:output-available`, `tool-get_recipe:output-available`. The tool names are **snake_case**
(the AI-SDK message part type is `tool-<agent-tools-object-key>`); `tool-proposeRecipe` (camelCase) is a
**bug** — the commit/preview won't fire. `reasoning` is not expected while assistant thinking is disabled.

**Preview title flip** — to confirm an edit landed in the workspace preview, read the rendered title node
(not the chat) before/after; it should change to the requested value.

**Annotation DOM + request body (Flow E)** — the picker has no React-fiber message of its own, so assert on the
DOM + the intercepted request:
- Toggle: a `button` whose text matches `/Select element|Selecting — click recipe/`. Pills:
  `[aria-label="Remove element"]` (count = #selected). Annotate-active: `[data-tf-annotating]` on the recipe
  container. Blocks: `[data-block-index]` / `[data-block-type]`.
- Dispatch a pick (the picker listens on `document` in **capture** phase and maps via
  `closest('[data-block-index]')`): on a descendant of a `[data-block-type="…"]` element,
  `el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))`.
- Intercept the send body BEFORE submitting, then read it after:
  ```js
  window.__b=null;const of=window.fetch;
  window.fetch=function(u,o){try{if(String(u).includes('/api/ai/chat')&&o?.body)window.__b=JSON.parse(o.body);}catch(e){}return of.apply(this,arguments);};
  // …submit… then: window.__b.attachedContext  →  { kind:'recipeElements', elements:[{blockIndex,blockType,label,selectedText?,rows?}] }
  ```

**Server-side thread poll (when the renderer freezes mid-stream, or to check completion)** — every finished
turn persists to Neon `chat_threads`, so you can confirm completion + the assistant parts WITHOUT touching a
frozen page. Query the latest thread by a snippet of its first user message and read the assistant parts:
```sql
SELECT messages FROM chat_threads WHERE title ILIKE '%<prompt snippet>%' ORDER BY updated_at DESC LIMIT 1;
```
Use the project's Neon creds (`.env.local` `DATABASE_URL` + `@neondatabase/serverless`). The assistant message's
`parts[].type` should include the relevant `text` / `tool-*` parts. A thread only persists on `onFinish`, so a
**network-failed turn never appears** — distinguish "still streaming" from "failed" by tailing the dev log for
`AI_APICallError` / `socket disconnected before secure TLS`.

## Driving input (when clicking the send button is flaky)

Set the textarea value via the native setter, fire `input`, then submit the form — in **two** `javascript_tool`
calls (top-level `await` isn't supported, and React needs the input event before submit):

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

- **Latency without thinking.** The assistant runs on the **raw Vercel AI SDK** (`streamText` + tools, no
  Mastra). Thinking is disabled, so minutes-long pre-answer waits are no longer expected. Poll the fiber
  `partTypes` / the server-side thread poll to distinguish active tool work from a provider/network/runtime
  failure.
- **Heavy report freezes the renderer.** `market-recap`-class **template reports** (the annotation feature's
  only surface) freeze screenshots and `javascript_tool` during streaming (the page never idles). Drive the
  picker in short JS bursts **between** turns, assert via the intercepted request body + the server-side thread
  poll, and recover a frozen renderer with a `navigate` away and back. The light workspace pages
  (`/app/cookbooks/<slug>/edit`) do not freeze — use them for Flow F stream checks.
- **Intermittent Moonshot / Neon network.** A turn can fail with
  `AI_APICallError: … Client network socket disconnected before secure TLS connection was established` (or Neon
  `fetch failed` on a cold start) — a transient VPN/endpoint flake, **not the code**. A failed turn never
  persists; just resend. A dev-server restart clears a stale Neon connection pool.
- **HMR reloads kill the stream.** Editing source while a turn streams triggers a Vite full reload that drops
  the SSE connection. Don't edit files mid-turn; if a turn dies, resend.
- **Sidebar auto-opens once** per workspace entry (by design) and then respects the toggle — re-verify Flow 0
  if the close button ever seems stuck.
- **`crypto.randomUUID` thread ids** + per-context memory: switching pages/threads via the sidebar's thread
  controls can desync the transcript from the workspace preview (a known limitation, not a crash).
- **Mic / attachment buttons are intentionally removed** from the sidebar input — their absence is expected.
- **Don't trigger native `alert/confirm`** via clicks (e.g. a delete-with-confirm) — it freezes the extension.

## Pass / fail

PASS when: Flow 0 close sticks; Flow A returns a grounded answer with no error chip and `/api/ai/chat` is not
404; Flow B reaches `tool-propose_recipe:output-available` + shows the inline card; Flow C flips create→edit and
saves; Flow D's `patch_recipe` updates the preview title; **Flow E** — the `Select element` toggle is in the
sidebar on **every** page (incl. data pages, none in any header), a click adds an instant pill (no popover),
multi-select + per-element removal work, the send body carries `attachedContext.kind === 'recipeElements'`
**with `rows`+no snapshot on a recipe surface** AND **with `surfaceLabel`+bundled `snapshot`+no rows on a data
page** (`/rank`, `/option-trades`), and pills clear after send; **Flow F** — the assistant completes with
text/tool parts and no required `reasoning` part, including in recipe edit.

FAIL (and report with the fiber `partTypes` / the persisted thread parts, the request body, the network status,
and a screenshot or DOM dump) on: a 404 from `/api/ai/chat`; a reopening close button; a `propose_recipe` that
never updates the preview; a hook/runtime error in the console from `components/ai/*`; a **`Select`/`Annotate`
button in a page header** (it must live in the sidebar); the toggle **missing on a data page** (it must be
always-visible); a **JS hover overlay or a renderer freeze on hover** in annotate mode (block highlight must be
pure CSS, generic highlight the rAF `.tf-annotate-hover` class); a data-page pick **missing its bundled
`snapshot`**; a turn stuck with no text/tool progress; or tests still requiring `reasoning` while assistant
thinking is disabled.

## Cleanup

Delete any recipes saved during the run (Flow B/C) from **"My recipes"** on `/app/cookbooks` (or
`deleteMyRecipe`) so the gallery isn't polluted. Clear the chat thread (the sidebar's clear control) if reusing
the tab.
