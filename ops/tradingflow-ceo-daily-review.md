---
name: tradingflow-ceo-daily-review
description: Canonical ops entrypoint and daily AI CEO operating review for TradingFlow. Coordinates runbook routing, tool preflights, engineering health, product UX, data quality, business operations, support, revenue, growth, and strategic/investor analysis.
disable-model-invocation: true
---

# TradingFlow CEO Daily Review

Use this runbook when an automation asks an AI agent to act as the daily operating CEO for TradingFlow: verify whether the production company and production product are working as expected, detect unusual situations, recommend short- and long-term actions, and produce a concise board/advisor/investor-grade report.

This runbook is the canonical ops entrypoint and executive orchestration layer. It owns shared runbook routing, tool-connection preflight rules, and daily CEO synthesis. It does not replace the narrower runbooks in `ops/`; it selects and runs the right checks, then synthesizes them into one CEO report.

This is a production-first runbook. Daily CEO verdicts must use production surfaces and production credentials unless the report explicitly labels a source as test, staging, local, or fixture-only. Test-mode Stripe, test Clerk, local Browser fixtures, or local development data can support diagnosis, but they cannot satisfy production revenue, customer, billing, or company-health evidence.

## Recommended Invocation

Use `/goal` for each daily automation run:

- Objective: produce an evidence-backed TradingFlow daily CEO report covering production engineering health, production product behavior, production data freshness, business operations, customer/support signals, unusual situations, short- and long-term actions, and board/investor-level strategic recommendations.
- Success criteria: this runbook's `Agent Handoff`, tool preflight matrix, and routing table are read first; required production credentials/tools are proven with read-only preflights; the relevant narrower runbooks are used for source evidence; no production/customer/payment mutation occurs without explicit approval; the report follows the required CEO template; and this runbook is maintained if reusable drift is discovered.
- Stop condition: the CEO report is complete, a critical production incident requires immediate human escalation, or source access is explicitly blocked and the missing checks are listed.

Pasteable automation prompt:

```text
Use ops/tradingflow-ceo-daily-review.md as the production runbook and canonical ops entrypoint. Act as TradingFlow's daily AI CEO. Read its Agent Handoff, tool preflight matrix, and runbook routing table first; prove read-only production access to the needed tools; run the relevant production engineering, product, analytics, business operations, revenue, and support checks; then deliver the CEO Daily Report template. Do not mutate production, billing, customer data, support messages, deployments, secrets, or third-party configuration without explicit user approval for the exact action.
```

## Agent Handoff

Last updated: 2026-06-24

Latest maintenance clarified that this is a production-first CEO runbook. Production Stripe CLI live-mode access was verified on 2026-06-24 for aggregate read-only revenue checks; future runs should prefer `node ops/scripts/stripe-production-revenue-summary.mjs` for revenue and subscription evidence, not `.env.local` test-mode Stripe keys.

The retired shared ops index was merged into this runbook on 2026-06-24. This file now owns shared tool preflights, the tool matrix, evidence-audit shape, and runbook routing.

No open handoff items. Start with this runbook's tool preflight matrix and routing table, then record any reusable missing production tool paths, blocked credentials, stale runbook links, or report-shape improvements here or in the narrower owning runbook.

## CEO Operating Principles

1. Evidence before opinion. Every health verdict must cite a live source, a narrower runbook result, or a clearly marked blocker.
2. Read-only by default. The daily CEO may inspect tools using existing credentials, but must not deploy, refund, charge, cancel, email customers, change permissions, update monitors, edit dashboards, rotate keys, or post notifications without explicit approval for the exact action.
3. Do not expose secrets. Report credential source paths, key prefixes, object ids, counts, timestamps, and statuses only. Never print raw API keys, tokens, webhook URLs, payment methods, customer PII beyond already-approved test fixtures, or full env files.
4. Synthesize across sources. Connect product symptoms to engineering causes and business impact instead of listing tool outputs independently.
5. State uncertainty. If PostHog, Better Stack, Stripe, Clerk, Lark, Browser, ClickHouse, Cloudflare, or provider APIs are blocked, mark the affected verdict `unknown`, not `healthy`.
6. Separate CEO severity from app observability priority. Use `Critical`, `High`, `Medium`, and `Watch` for this report. Do not invent app-level `P2` observability if the narrower webapp policy only supports `P0` and `P1`.
7. Keep mode discipline. Production revenue and customer-state conclusions require production Stripe/Clerk/Neon evidence. Test-mode or fixture data must be labeled as diagnostic only.

## Daily Scope

Default time windows:

| Scope | Window |
| --- | --- |
| Production errors, telemetry, support, billing, signups, conversion, and revenue | Last 24 hours unless the user or automation passes a different window |
| Market-data freshness and trading product behavior | Latest eligible New York trading session plus current market state |
| Trend and strategic context | 7-day and 30-day comparisons when the source can provide them cheaply |
| Deep product walkthrough | Daily smoke by default; full Browser product review weekly, after releases, or when anomalies point to UX/access risk |

Default company surfaces:

| Domain | Surfaces |
| --- | --- |
| Product | `app.tradingflow.com`, `/app/option-trades/live`, `/app/option-trades/historical`, `/app/rank/contracts`, `/app/rank/symbols`, `/app/billing`, `/app/cookbooks`, account/auth flows, premium gates |
| Growth and marketing | `tradingflow.com` landing pages, SEO/i18n/mobile basics, landing funnels, changelog/blog freshness |
| Data and infrastructure | Cloudflare Worker serving layer, Durable Objects, KV reference data, ClickHouse source freshness, provider APIs, Better Stack telemetry |
| Business operations | Stripe subscription/billing state, Clerk/account growth, support inbox, customer blockers, conversion and activation funnels, churn/payment failures |
| Strategy | Product-market signal, retention and trust risks, pricing/packaging signal, investor narrative, operational leverage, moat-building data assets |

## Read First

1. This runbook's [Agent Handoff](#agent-handoff).
2. [Tool Connection Preflight](#tool-connection-preflight), [Tool Matrix](#tool-matrix), and [Runbook Routing](#runbook-routing).
3. The narrow runbooks selected by the workflow below. Read each selected runbook's handoff/watchlist before executing it.

Do not skip the embedded tool-preflight sections. They own current connection paths for PostHog, Better Stack, ClickHouse, Massive, Alpaca, Longport, Cloudflare/Wrangler, Browser, Lark, Stripe, Clerk, Neon, and Discord.

## Shared Ops Index

This section is the merged replacement for the retired shared ops index. It helps Codex or another AI agent select the narrowest correct ops runbook, prove required tool access with a small read-only preflight, and keep runbook maintenance state separate from one-off execution results.

### Shared Criteria For Success

This canonical entrypoint is successful when:

1. The agent can choose one canonical runbook for the requested work without reading every ops file end to end.
2. The selected runbook's `Agent Handoff`, watchlist, backlog, or latest-run note is read before executing its workflow.
3. Required external tools are checked through the smallest read-only path in [Tool Connection Preflight](#tool-connection-preflight), or blocked with the exact attempted path.
4. Reports for external-service runbooks include a compact `ToolAccess` block.
5. Durable lessons update the owning runbook or this entrypoint; transient run results stay in the selected runbook's handoff area or the final report.
6. Maintenance runs leave this file with one bounded `Agent Handoff` and one self-maintenance section.

## Tool Connection Preflight

Before running any ops runbook, identify the tools that runbook needs and verify the smallest read-only connection path first. The goal is to prove the agent can reach the evidence source before spending time on the domain workflow.

### Connection Rules

1. Read the selected runbook's prerequisites and `Agent Handoff` first.
2. Use Codex-connected MCP/plugin/connector tools when the runbook names them, but discover the live tool surface and schema before the first call. Tool names can drift.
3. Use repo-local `.env` credentials when the runbook says the credential is already in a sibling project. Do not replace those paths with an MCP/connector just because one exists.
4. Keep all probes read-only unless the runbook and the user explicitly authorize mutation.
5. Never print raw secrets, complete env files, payment methods, personal tokens, webhook URLs, or API keys. It is OK to report variable names, key prefixes such as `sk_test_`, safe object ids, status fields, counts, and timestamps.
6. If a tool is unavailable, report the exact attempted path and mark dependent checks blocked instead of inventing results or silently swapping to a browser/UI fallback.

### Standard Read-Only API Probes

Use these probes when a selected runbook depends on the named API and has no narrower domain-specific check. Keep symbol lists tiny and report only status/counts, not credentials.

#### Alpaca API

Alpaca does not need MCP, CLI, plugin, or connector access for these ops runbooks. Use the sibling process-service repo and its local env-backed script:

```bash
cd "$WORKSPACE/tradingflow-process-service-ec2"
node scripts/test-alpaca-snapshots.js AAPL
```

Treat Alpaca as connected when the command exits 0, reports `status: 200`, `ok: true`, and `returnedSymbols` contains every requested symbol. Treat it as blocked when the script is missing, credentials are missing, the response is non-200, or `returnedSymbols` omits the requested symbol. The script masks `APCA_API_KEY_ID` and `APCA_API_SECRET_KEY`; do not replace it with a command that prints raw env values.

### Tool Matrix

| Tool / service | Used by | Preferred connection path | Minimal connection check | Notes and hard stops |
| --- | --- | --- | --- | --- |
| PostHog | `ops/webappp-fullstack/posthog-research.md`, `ops/webappp-fullstack/webapp-check-error.md`, `ops/landingpage/posthog-events.md` | PostHog plugin/MCP, usually `@posthog` / `plugin://posthog@openai-curated-remote`. Use CLI only when the user asks for `posthog-cli` or the runbook selects CLI mode. | Discover live tools first. In current Codex hosts, if exposed as `mcp__posthog.exec`, run `search` or `tools`, then `info <tool_name>`, then `schema` for hinted fields before `call`. Prefer `organization-get {}` for project confirmation because it returns project ids/names without raw ingestion tokens. Confirm project before querying: webapp default `300646`, landing default `344580`. For CLI mode, run `npx -y @posthog/cli --help`, set `POSTHOG_CLI_HOST=https://us.posthog.com`, and require a personal token with `query:read`. | App env keys such as `POSTHOG_KEY`, `VITE_POSTHOG_KEY`, or `NEXT_PUBLIC_POSTHOG_KEY` are ingestion keys, not read-query credentials. `projects-get` can return raw `api_token` values; if used, summarize and redact the output. Do not browser-scrape PostHog unless the user explicitly approves that fallback. Backend events can be hostless and bot-classified; do not apply browser-only filters to them. |
| Better Stack telemetry, errors, uptime | `ops/webappp-fullstack/webapp-check-error.md`, `ops/process-service/datapipeline-error-check.md` | Better Stack MCP, historically `user-betterstack`; current Codex may expose `mcp__betterstack.*` tools directly. | Start with `telemetry_list_teams_tool` if team scope is unclear. For webapp errors, call `telemetry_list_applications_tool` and `telemetry_list_sources_tool` to resolve current `WebFullStack-Errors` and `WebFullStack-Info` ids. For data-pipeline logs, resolve the source by name (`cf-service` or `Process Service[Production]`) and then call `telemetry_get_query_instructions_tool` before SQL. | Never hardcode old `application_id`, `source_id`, table names, or collection slugs. Call the relevant instruction tool before `telemetry_query`. Do not hit real Better Stack heartbeat URLs unless intentionally verifying the live monitor. |
| ClickHouse production cloud | `ops/process-service/datapipeline-error-check.md` | No MCP/connector for production checks. Use sibling repo `.env` credentials and repo scripts. Primary path: `$WORKSPACE/tradingflow-process-service-ec2/.env` with `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`; webapp diagnostics may use `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` with `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`. | From `$WORKSPACE/tradingflow-process-service-ec2`, run a bounded existing script such as `bun scripts/verify-producer-freshness.ts` for today ET or a specified session. For full audits, use the scripts named in `datapipeline-error-check.md`. | Do not use ClickHouse MCP against production cloud. Let the repo load `.env`; do not paste credentials. Treat ClickHouse as source-of-truth for row coverage and freshness, while Better Stack explains producer/log causes. |
| Massive API | `ops/process-service/datapipeline-error-check.md` | No MCP/connector. Use `MASSIVE_API_KEY` from `$WORKSPACE/tradingflow-process-service-ec2/.env` with the existing parity/check scripts. | Run the smallest relevant script path from `datapipeline-error-check.md`, for example a limited contract-rank or Greeks parity sample. | Massive snapshots are live at fetch time, so same-evening runs are best for EOD parity. Do not turn timing/vendor drift into a row-loss conclusion without ClickHouse corroboration. |
| Alpaca API | `ops/process-service/datapipeline-error-check.md` | No MCP/connector. Use `$WORKSPACE/tradingflow-process-service-ec2/.env` credentials `APCA_API_KEY_ID` and `APCA_API_SECRET_KEY`. These back live equity/ETF snapshot prices and symbol-meta history fallbacks. | From `$WORKSPACE/tradingflow-process-service-ec2`, run `node scripts/test-alpaca-snapshots.js AAPL` or another small stock symbol list. The script masks key values and calls `https://data.alpaca.markets/v2/stocks/snapshots` with `feed=iex`. | Keep probes to a tiny symbol set. Report HTTP status, requested/returned symbols, and blocker only. Do not print raw API keys. |
| Longport API | `ops/process-service/datapipeline-error-check.md` | No MCP/connector. Use `$WORKSPACE/tradingflow-process-service-ec2/.env` credentials `LONGPORT_APP_KEY`, `LONGPORT_APP_SECRET`, and `LONGPORT_ACCESS_TOKEN`. These back Longport index quotes, sync-symbol-meta history/static fallbacks, and option-chain fallback paths. | From `$WORKSPACE/tradingflow-process-service-ec2`, run a one-symbol SDK quote probe using the repo's `longport` package: load `.env`, call `Config.fromEnv()`, create `QuoteContext`, and request `quote(['AAPL.US'])` or a configured index symbol. If a repo-owned Longport check script exists, prefer it; in this checkout, old package scripts may point at missing files. | Treat `connections limitation is hit` as a Longport session-cap blocker and `token expired` as a credential-refresh blocker. Report symbol, quote count, and blocker only. Do not print Longport tokens or secrets. |
| Cloudflare Worker / Wrangler | `ops/process-service/datapipeline-error-check.md` | Public HTTP for unauthenticated status/meta GETs; repo-local `npx wrangler` from `$WORKSPACE/tradingflow-cfworker-service`; auth via `wrangler login` or `CLOUDFLARE_API_TOKEN`. | Read-only smoke: `curl` `/canary` and selected status/meta endpoints; then `cd "$WORKSPACE/tradingflow-cfworker-service"` and run `npx wrangler deployments list --env production` or a bounded `npx wrangler tail --env production --format json` when logs are required. | Never `wrangler deploy`, `wrangler kv key put/delete`, or production mutations from a status run. Use `--env production` and the repo-local Wrangler version. |
| Browser plugin / in-app browser | `ops/webappp-fullstack/browser-e2e-product-review.md`, landing E2E and screenshot runbooks | Use the Browser plugin named by the runbook, commonly `@Browser` / `plugin://browser@openai-bundled`, or the in-app browser when that is the active Codex surface. | Open the target local or production URL, verify the page loads, and capture only the evidence the runbook asks for. For webapp local flows, start the sibling dev server first and verify the actual port. | Browser product review is not the same as running repository Playwright tests. Use Playwright specs as read-only journey maps unless the runbook specifically asks for test execution. |
| Lark / Feishu CLI | Support mail, calendar, docs, Drive, Base, task, approval, and other Lark-backed workflows referenced by `lark-*` skills or user requests | Use local `lark-cli`; no MCP/connector is required when a Lark skill or runbook says to use the CLI. Choose `--as user` for user-owned resources such as mail, calendar, Drive, docs, and personal tasks; choose `--as bot` only for bot-owned/app-level operations. | Read the relevant `lark-*` skill first. Always reuse existing auth before starting login: run `command -v lark-cli`, `lark-cli --version`, then `lark-cli auth status --json --verify`. For a specific action, run `lark-cli auth check --scope "<needed_scope>" --json` before the action. For mail support workflows, prior known checks include `lark-cli mail user_mailboxes profile --as user --params '{"user_mailbox_id":"me"}' --json` and `lark-cli mail +triage --as user --mailbox me --max <n> --format json`. | Do not start `lark-cli auth login`, generate a QR code, or ask a human to scan a new QR code until the existing session has been checked and either fails, is expired, or lacks the exact required user scope. Reusing existing auth is the default because new QR login interrupts long-running runbooks. If login is actually required, use split-flow `lark-cli auth login --scope "<scope>" --no-wait --json`, generate a QR code with `lark-cli auth qrcode`, then stop and wait for the user to confirm before completing `--device-code`. Do not output app secrets, access tokens, or raw auth payloads. If JSON output includes `_notice.update`, finish the task and offer `lark-cli update`. High-risk writes that exit `10` require explicit user confirmation before retrying with `--yes`. |
| Stripe billing UX tests | `ops/webappp-fullstack/browser-e2e-product-review.md` | No MCP/connector is required for normal billing UX checks. Browser is primary for user-visible checkout/portal flows. SDK/API verification or cleanup should use `STRIPE_SECRET_KEY` from `$WORKSPACE/tradingflow-webapp-fullstack/.env.local`. | Before any authorized payment lifecycle test, confirm the local Stripe key source exists and starts with `sk_test_`. Use the app and Stripe-hosted UI in Browser for capability proof; use SDK/API only for setup, canonical status verification, or cleanup. | Abort on missing key, `sk_live_`, unknown key source, or any fetched Stripe object with `livemode: true`. Treat Stripe connector/plugin mutations as unsafe until test mode is proven. Do not complete payment/add-card/change-card/cancel flows unless the user explicitly authorizes that exact test. |
| Stripe production revenue | `ops/tradingflow-ceo-daily-review.md` | Use the local Stripe CLI only, preferably through `node ops/scripts/stripe-production-revenue-summary.mjs` from this repo. For manual preflight, verify `command -v stripe`, `stripe --version`, and `stripe config --list` with all keys redacted. The account should resolve to TradingFlow production and live mode should be available through the CLI config. | Preferred daily check: `node ops/scripts/stripe-production-revenue-summary.mjs`, then report aggregate-only balance, cash/revenue windows, charge health, subscription counts, and MRR/ARR proxy by status/currency. Manual fallback preflight: `stripe balance retrieve --live | jq '{object, available, pending}'`; manual fallback aggregate sources: `stripe balance_transactions list --live`, `stripe charges list --live`, and `stripe subscriptions list --live --status all`. | This production row is for read-only CEO revenue reporting, not payment lifecycle testing. Always pass `--live`; never print raw keys, customer PII, cards, invoices, or full object payloads. Never create, update, refund, cancel, or open checkout/portal sessions from a daily revenue check without explicit approval for that exact mutation. Treat helper `truncated: true` as partial evidence and name the truncated section. |
| Clerk auth | Browser product review and landing screenshot runbooks | Use the app's normal login fixtures and `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` (`CLERK_SECRET_KEY` for server-side checks when needed). | For UI runs, verify the displayed email/account identity after login or account switch before counting coverage. Default safe fixture OTPs and account emails are documented in the target runbook. | Do not confuse cached sessions with a new account state. Clear the Browser context or Clerk cookies and retry once when identity/billing state does not change. |
| Neon database | Authorized billing lifecycle tests | Use `NEON_DATABASE_URL` from `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` when a runbook explicitly needs canonical user/billing state or restoration. | Run only read-only user/customer lookups unless an authorized Stripe lifecycle test requires fixture setup or cleanup. Report safe ids and statuses only. | Restore seeded users if a test repoints `stripe_customer_id`. Do not mutate Neon during ordinary product review. |
| Discord webhooks | Observability routing references in webapp/data-pipeline runbooks | Prefer verifying emitted routing through Better Stack logs or code paths. Webhook URLs live in repo env/secrets and are notification sinks, not normal connection probes. | Check that the relevant env var name exists or that Better Stack shows the expected P0/P1 event. | Do not send test Discord messages unless the user explicitly asks to verify notification delivery. |

### Evidence Audit Template

Include a compact tool-access block in the final report for any runbook that depends on external services:

```text
ToolAccess:
- posthog: connected|blocked|skipped; path=<plugin|cli>; project=<id or n/a>; blocker=<none or exact error>
- betterstack: connected|blocked|skipped; app=<resolved id or n/a>; source=<resolved id or n/a>; blocker=<none or exact error>
- clickhouse: connected|blocked|skipped; credential_source=<repo/.env path>; script_or_query=<name>; blocker=<none or exact error>
- browser: connected|blocked|skipped; target=<url>; blocker=<none or exact error>
- stripe/clerk/neon/cloudflare/massive/alpaca/longport/lark-cli/discord: connected|blocked|skipped; path=<env|browser|wrangler|sdk|cli>; blocker=<none or exact error>
```

## Runbook Routing

| Area | Runbook | Use first when |
| --- | --- | --- |
| Company | `ops/tradingflow-ceo-daily-review.md` | Running a daily CEO-level operating review across product health, engineering reliability, business operations, customer/support signals, and strategic/investor recommendations. |
| Architecture | `ops/workspace-system-architecture-review.md` | Reviewing all ops-referenced workspace projects as a system architect from greenfield and reverse-adversarial simplification perspectives. |
| Process service | `ops/process-service/datapipeline-error-check.md` | Investigating cross-layer TradingFlow data-pipeline stale data, lag, missing rows, UW ingest, Worker snapshot/DO/KV freshness, ClickHouse quality, contract-rank, or Greeks issues. |
| Webapp | `ops/webappp-fullstack/webapp-check-error.md` | Correlating recent production errors across PostHog Error Tracking and Better Stack. |
| Webapp | `ops/webappp-fullstack/posthog-research.md` | Running product analytics, event quality, dashboard, and behavior reviews in PostHog. |
| Webapp | `ops/webappp-fullstack/browser-e2e-product-review.md` | Walking webapp UI journeys with `@Browser` for manual E2E product testing, UI defects, and PM/trader UX findings. |
| Landing | `ops/landingpage/browser-e2e-test.md` | Simulating user journeys while doing E2E maintenance and product review. |
| Landing | `ops/landingpage/update-blog-posts-and-changelog.md` | Updating bilingual blog posts (`content/posts/**`), screenshots, public changelog, and What's New sync. |
| Landing | `ops/landingpage/update-tutorial-series.md` | Creating/updating the bilingual tutorial series (`content/series/tradingflow-docs`) - page-based how-to chapters with annotated screenshots, Mermaid diagrams, and cross-links. |
| Landing | `ops/landingpage/posthog-events.md` | Auditing or extending landing-site PostHog event taxonomy and funnel definitions. |
| Skills/runbooks | `ops/skill-maintainer.md` | Maintaining runbooks and skills so future agents run them cleanly. |

## Workflow

### 0. Establish the Day Context

Record:

- Local date/time and timezone where the automation is running.
- New York date/time, market session state, and latest eligible trading date.
- Requested report window, defaulting to last 24 hours.
- Whether this is `daily`, `weekly-deep`, `post-release`, or `incident` mode.

If the run happens before or during a market open, be explicit about what "today" means for market-data freshness. Do not compare current-day freshness against a session that has not opened or has not produced complete data.

### 1. Prove Tool Access

Use [Tool Connection Preflight](#tool-connection-preflight). Keep probes minimal and read-only.

At minimum for a standard daily run:

| Tool | Daily need |
| --- | --- |
| Better Stack | Production error/info telemetry, uptime/log correlation |
| PostHog | Product analytics, funnels, error tracking when available |
| ClickHouse | Market-data freshness and data coverage through repo scripts |
| Cloudflare/Wrangler | Worker deploy/status, DO/KV/API serving health |
| Browser | Product smoke and landing/app visible-state checks |
| Stripe CLI live mode | Production revenue, subscription, payment failure, trial, refund, and billing-state aggregate checks |
| Clerk/Neon | Account growth and entitlement/account-state read-only checks when needed |
| Lark / support mail | Support inbox and customer issue triage |
| Provider APIs | Massive, Alpaca, Longport checks only when data-quality symptoms require them |

If a tool is blocked, continue with the rest of the run and include the blocker in `ToolAccess` and the affected scorecard row.

### 2. Engineering Health

Use the narrowest existing runbook for evidence:

| Question | Runbook / source |
| --- | --- |
| Are production app errors normal or unusual? | `ops/webappp-fullstack/webapp-check-error.md` |
| Is the data pipeline fresh, served, internally consistent, and free of producer/provider gaps? | `ops/process-service/datapipeline-error-check.md` |
| Are app observability routes capturing the right severity? | Webapp error runbook plus sibling webapp `doc/harness/observability-rules.md` when needed |

Daily minimum:

1. Check active production error clusters and unresolved verification backlog.
2. Check app and worker liveness.
3. Check latest trading date, source freshness, and served data freshness.
4. Check known risk watchlists from selected runbooks.
5. Compare current issue volume to 7-day or previous-day baseline when available.

Escalate immediately if any `Critical` signal appears: app unavailable, paid users broadly blocked, market data stale during active session, billing cannot complete, source data has suspected loss, support inbox contains a severe customer blocker, or observability is blind for a suspected incident.

### 3. Product and UX Health

Use `ops/webappp-fullstack/browser-e2e-product-review.md` for Browser-driven evidence and `ops/landingpage/browser-e2e-test.md` for landing evidence.

Daily smoke should cover:

| Surface | Minimum evidence |
| --- | --- |
| Landing | Home page loads, primary CTA works, core SEO/title/i18n/mobile regressions are not obvious |
| Auth/app shell | Known account can sign in or existing session identity is clear |
| Premium gates | Guest/canceled users are blocked from premium data or mutations; active/trial users can use expected premium controls |
| Option Trades | Historical rows load, filters/sort do not visibly break, Live state is explained by market hours or streaming health |
| Rank contracts/symbols | Rows load, latest date is plausible, core sort/filter/drawer interactions still respond |
| Billing | Active/trial/canceled state is coherent; no unauthorized payment mutation is attempted |
| Cookbooks/content | Dated snapshot gallery/report loads if in scope; mutation-capable AI/editor controls are treated as risk unless explicitly intended |

Run a full Browser product review instead of a smoke when:

- A release shipped in the last 24 hours.
- Error or support signals point to a user journey.
- Revenue, activation, churn, or premium-access metrics move unusually.
- The automation is the weekly-deep run.

### 4. Business Operations

Keep this phase read-only. Use connected tools, repo scripts, or source dashboards named in [Tool Matrix](#tool-matrix).

Production revenue checks must use the Stripe CLI live-mode path from [Tool Matrix](#tool-matrix), not the webapp `.env.local` test-mode `STRIPE_SECRET_KEY`. Prefer the read-only helper:

```bash
node ops/scripts/stripe-production-revenue-summary.mjs
```

Treat `truncated: true` in helper output as partial evidence and say which section was truncated. If the helper is blocked, fall back to manual aggregate-only CLI checks for:

- Account balance: `stripe balance retrieve --live`.
- Cash/revenue windows: `stripe balance_transactions list --live` over trailing 24 hours, trailing 7 days, trailing 30 days, and month-to-date UTC; aggregate by type/category/currency.
- Charge health: `stripe charges list --live` for the trailing 30 days; report counts by status/paid/refunded, not customer rows.
- Current subscription base: `stripe subscriptions list --live --status all`; report counts and MRR/ARR proxy by status (`active`, `trialing`, `past_due`, `canceled`, and other statuses).
- Risk split: report active paid MRR separately from trialing plan MRR and past-due at-risk MRR. Do not combine them into one clean revenue number without labels.

Do not print customer emails, payment method data, invoice PDFs, full object payloads, or raw API keys. Do not create checkout sessions, refunds, coupons, subscriptions, customer records, or portal sessions from this daily production check.

| Area | Checks |
| --- | --- |
| Revenue and billing | Production Stripe balance, gross charge volume, fees, refunds, failed payments, subscriptions by status, active paid MRR, trialing plan MRR, past-due at-risk MRR, cancellations, obvious Stripe/webapp billing mismatches |
| Activation and product usage | Signup count, activation events, active users, Option Trades/Rank/Cookbooks usage, saved filters/watchlists, AI/report usage if instrumented |
| Conversion funnel | Landing visits, CTA clicks, signup starts, signup completions, paywall views, checkout starts, checkout completions |
| Retention and engagement | 1-day/7-day active users, repeat users, session depth, feature stickiness, trader workflow completion |
| Support and customer voice | New support emails/messages, unresolved urgent threads, repeated complaints, churn reasons, enterprise/prospect signals |
| Prospect/investor signal | Unread investor, partner, or qualified prospect emails/messages; report counts and subject-level themes only unless the user asks for details |
| Marketing/content | Landing uptime, recent changelog/blog/tutorial freshness, SEO/i18n/mobile regressions, campaign or launch anomalies |

Do not send replies, drafts, refunds, coupons, customer status changes, billing changes, or CRM updates unless the user explicitly asks. It is safe to propose exact next actions and draft language in the report.

### 5. Unusual Situation Detection

Flag a situation as unusual when any of these are true:

- Current 24-hour metric is materially worse than the prior 7-day median or the last comparable market day.
- Engineering health is green but business metrics dropped.
- Business metrics are healthy but support complaints or product friction increased.
- Paid-user capability differs from billing/account state.
- Source data is fresh but served data is stale, or served data is fresh but the UI shows stale state.
- Landing/marketing funnel changes without an obvious campaign or release reason.
- A monitor/tool is unavailable and would hide a material incident.
- The same issue appears in two independent sources, such as Better Stack plus support, or PostHog plus Browser.

For each unusual situation, report:

- Signal and severity.
- Evidence source and timestamp.
- Customer/business impact.
- Likely cause with confidence.
- Immediate owner/action suggestion.
- Verification signal that would prove recovery.

### 6. CEO Synthesis

Convert evidence into decisions. The daily report must include:

1. What is working as expected.
2. What is not working or is unknown.
3. What changed since the previous day or latest comparable baseline.
4. What the company should do today.
5. What the company should invest in over 7-30 days.
6. What strategic questions or risks should be raised to board members, advisors, or investors.

Keep strategic recommendations evidence-tied. Avoid generic advice such as "improve marketing" unless the report names the metric, customer behavior, or product gap that supports it.

## CEO Daily Report Template

Use this structure in the final report.

```text
# TradingFlow CEO Daily Report

Date/window:
Mode:
Market context:

## Executive Verdict
- Overall status: Healthy | Watch | Degraded | Critical | Unknown
- One-sentence company read:
- Top 3 decisions/actions:

## Operating Scorecard
| Area | Status | Evidence | Business impact | Owner/action |
| --- | --- | --- | --- | --- |
| Product UX | Healthy/Watch/Degraded/Critical/Unknown | ... | ... | ... |
| Market data | ... | ... | ... | ... |
| App/API reliability | ... | ... | ... | ... |
| Revenue/billing | ... | ... | ... | ... |
| Growth/conversion | ... | ... | ... | ... |
| Support/customer voice | ... | ... | ... | ... |
| Observability/tools | ... | ... | ... | ... |

## Unusual Situations
| Severity | Signal | Evidence | Likely cause | Recommended action | Verification |
| --- | --- | --- | --- | --- | --- |

## Engineering Health
- Production errors:
- Serving/data freshness:
- Product smoke:
- Known watchlist/backlog:
- Blockers:

## Business Operations
- Revenue/billing:
- Acquisition/activation:
- Engagement/retention:
- Support/customer voice:
- Prospect/investor signal:
- Marketing/content:
- Blockers:

## Action Plan
| Horizon | Action | Why now | Expected impact | Confidence | Verification |
| --- | --- | --- | --- | --- | --- |
| Today | ... | ... | ... | High/Medium/Low | ... |
| 7 days | ... | ... | ... | ... | ... |
| 30-90 days | ... | ... | ... | ... | ... |

## Board / Advisor Lens
- Strategic read:
- Key risk:
- Key leverage point:
- Decision needed:

## VC / Investor Lens
- Investor-facing narrative:
- Metrics that strengthen the story:
- Metrics or risks that weaken the story:
- Suggested next investor update angle:

## ToolAccess
- posthog: connected|blocked|skipped; path=...; project=...; blocker=...
- betterstack: connected|blocked|skipped; app/source=...; blocker=...
- clickhouse: connected|blocked|skipped; credential_source=...; script_or_query=...; blocker=...
- cloudflare/wrangler: connected|blocked|skipped; path=...; blocker=...
- browser: connected|blocked|skipped; target=...; blocker=...
- stripe: connected|blocked|skipped; path=...; blocker=...
- clerk/neon: connected|blocked|skipped; path=...; blocker=...
- lark/support: connected|blocked|skipped; path=...; blocker=...
- provider-apis: connected|blocked|skipped; path=...; blocker=...

## Evidence Index
- Source, command/tool/query, timestamp, and short result.

## Runbook Maintenance
- Runbook maintenance: no change | changed <file> because <durable lesson>.
```

## Severity Guide

| CEO severity | Use when |
| --- | --- |
| Critical | Revenue, paid access, production availability, data integrity, or customer trust is actively impaired and needs same-day human action |
| High | A material product/business metric or important workflow is degraded, but there is a workaround or limited scope |
| Medium | User friction, instrumentation gaps, or operational debt could become material if ignored |
| Watch | Mild anomaly, unclear source, or needs another data point before action |
| Unknown | Required evidence source is blocked or unavailable |

## Automation Notes

- Daily automation should pass the desired window if not `last 24h`.
- Weekly automation should set mode `weekly-deep` and include a deeper Browser review plus a broader data-quality audit.
- Post-release automation should include the release/deploy identifier and prioritize product smoke, error regression, and conversion/billing impact.
- Incident automation should name the suspected symptom and let this runbook route to the narrow incident runbook first.
- Archive or persist reports outside this runbook. Keep this file as durable procedure, not a daily log.

## Runbook Self-Maintenance

At the end of each real run:

1. Decide whether the run revealed a reusable lesson for this CEO runbook or a narrower owning runbook.
2. Promote durable lessons into routing, prerequisites, tool access, report shape, severity rules, or selected narrow runbooks.
3. Keep transient daily evidence in the final report or external report archive, not in this runbook.
4. Keep only unresolved next-run blockers in [Agent Handoff](#agent-handoff), and prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the report.

Update this runbook when:

- A daily CEO run repeatedly needs a new source, metric, surface, report section, or escalation rule.
- A tool credential path, connector, runbook filename, or preflight check drifts.
- A strategic/business metric becomes important enough to check every daily run.
- Automation needs a different mode, schedule contract, or output format.

Do not update this runbook for:

- One-off daily counts, transient incidents, raw logs, or current-run-only findings.
- Speculative strategy ideas not supported by current evidence.
- Completed action items that belong in the daily report or a separate task system.
