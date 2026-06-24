# Ops Runbook Index

Start here when choosing or maintaining an AI-agent runbook under `ops/`.

This file is the canonical index for shared ops runbook routing, tool-connection preflight rules, and index-level self-maintenance. Individual runbooks own their domain-specific commands, thresholds, watchlists, and latest-run notes.

## Goal

Help Codex or another AI agent select the narrowest correct ops runbook, prove required tool access with a small read-only preflight, and keep runbook maintenance state separate from one-off execution results.

## Recommended Invocation

For multi-step or verifiable work, run the selected runbook with `/goal`:

- Objective: the concrete operator outcome named by the runbook.
- Success criteria: the runbook's verification commands, evidence checks, report template, and required maintenance step.
- Stop condition: complete, genuinely blocked, or user-directed pause.

If a runbook can touch production, money, notifications, destructive state, or third-party account configuration, keep execution read-only unless the runbook and the user explicitly authorize the mutation.

For maintenance-only edits to this index, use the `runbook-maintainer` skill and do not run production-affecting checks just to populate evidence. State in `Agent Handoff` and the final report that the pass was documentation-only.

## Criteria For Success

This index is successful when:

1. The agent can choose one canonical runbook for the requested work without reading every ops file end to end.
2. The selected runbook's `Agent Handoff`, watchlist, backlog, or latest-run note is read before executing its workflow.
3. Required external tools are checked through the smallest read-only path in [Tool Connection Preflight](#tool-connection-preflight), or blocked with the exact attempted path.
4. Reports for external-service runbooks include a compact `ToolAccess` block.
5. Durable lessons update the owning runbook or this index; transient run results stay in the selected runbook's handoff area or the final report.
6. Maintenance runs leave this index with one bounded `Agent Handoff` and one self-maintenance section.

## Agent Handoff

Last updated: 2026-06-24

Latest read-only preflight run: Alpaca API was re-tested on 2026-06-19 from `$WORKSPACE/tradingflow-process-service-ec2` with `node scripts/test-alpaca-snapshots.js AAPL`; it exited 0, returned HTTP 200, `ok: true`, and included `AAPL` in `returnedSymbols`. The previous full preflight also checked PostHog, Better Stack, ClickHouse, Massive, Longport, Cloudflare/Wrangler, Stripe test mode, Clerk test key, Neon, Discord env presence, and `lark-cli` user-auth status. Longport SDK quote probe succeeds for `AAPL.US` after refreshing `LONGPORT_ACCESS_TOKEN`. Browser plugin control was not exposed in the current loaded tool set; load or connect the Browser plugin before running browser-dependent runbooks.

Index maintenance on 2026-06-24 was documentation-only: added the workspace system architecture review runbook and TradingFlow CEO daily review runbook, and corrected stale index links to the current checked-in runbook filenames. No production checks or live tool preflights were executed.

No open index-maintenance items after the latest run. Start by selecting the narrowest runbook below and reading its `Agent Handoff` / watchlist / backlog section before following the main workflow.

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
| Better Stack telemetry, errors, uptime | `ops/webappp-fullstack/webapp-check-error.md`, `ops/cf-service/cf-check-error.md`, `ops/cf-service/check-durability-object-status.md`, `ops/cf-service/data-quality.md` | Better Stack MCP, historically `user-betterstack`; current Codex may expose `mcp__betterstack.*` tools directly. | Start with `telemetry_list_teams_tool` if team scope is unclear. For webapp errors, call `telemetry_list_applications_tool` and `telemetry_list_sources_tool` to resolve current `WebFullStack-Errors` and `WebFullStack-Info` ids. For cf-service logs, resolve the source by name (`cf-service` or `Process Service[Production]`) and then call `telemetry_get_query_instructions_tool` before SQL. | Never hardcode old `application_id`, `source_id`, table names, or collection slugs. Call the relevant instruction tool before `telemetry_query`. Do not hit real Better Stack heartbeat URLs unless intentionally verifying the live monitor. |
| ClickHouse production cloud | `ops/cf-service/data-quality.md`, `ops/cf-service/cf-check-error.md`, `ops/cf-service/check-durability-object-status.md` | No MCP/connector for production checks. Use sibling repo `.env` credentials and repo scripts. Primary path: `$WORKSPACE/tradingflow-process-service-ec2/.env` with `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`; webapp diagnostics may use `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` with `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`. | From `$WORKSPACE/tradingflow-process-service-ec2`, run a bounded existing script such as `bun scripts/verify-producer-freshness.ts` for today ET or a specified session. For full audits, use the scripts named in `data-quality.md`. | Do not use ClickHouse MCP against production cloud. Let the repo load `.env`; do not paste credentials. Treat ClickHouse as source-of-truth for row coverage and freshness, while Better Stack explains producer/log causes. |
| Massive API | `ops/cf-service/data-quality.md` | No MCP/connector. Use `MASSIVE_API_KEY` from `$WORKSPACE/tradingflow-process-service-ec2/.env` with the existing parity/check scripts. | Run the smallest relevant script path from `data-quality.md`, for example a limited contract-rank or Greeks parity sample. | Massive snapshots are live at fetch time, so same-evening runs are best for EOD parity. Do not turn timing/vendor drift into a row-loss conclusion without ClickHouse corroboration. |
| Alpaca API | `ops/cf-service/data-quality.md`, `ops/cf-service/cf-check-error.md` | No MCP/connector. Use `$WORKSPACE/tradingflow-process-service-ec2/.env` credentials `APCA_API_KEY_ID` and `APCA_API_SECRET_KEY`. These back live equity/ETF snapshot prices and symbol-meta history fallbacks. | From `$WORKSPACE/tradingflow-process-service-ec2`, run `node scripts/test-alpaca-snapshots.js AAPL` or another small stock symbol list. The script masks key values and calls `https://data.alpaca.markets/v2/stocks/snapshots` with `feed=iex`. | Keep probes to a tiny symbol set. Report HTTP status, requested/returned symbols, and blocker only. Do not print raw API keys. |
| Longport API | `ops/cf-service/data-quality.md`, `ops/cf-service/cf-check-error.md` | No MCP/connector. Use `$WORKSPACE/tradingflow-process-service-ec2/.env` credentials `LONGPORT_APP_KEY`, `LONGPORT_APP_SECRET`, and `LONGPORT_ACCESS_TOKEN`. These back Longport index quotes, sync-symbol-meta history/static fallbacks, and option-chain fallback paths. | From `$WORKSPACE/tradingflow-process-service-ec2`, run a one-symbol SDK quote probe using the repo's `longport` package: load `.env`, call `Config.fromEnv()`, create `QuoteContext`, and request `quote(['AAPL.US'])` or a configured index symbol. If a repo-owned Longport check script exists, prefer it; in this checkout, old package scripts may point at missing files. | Treat `connections limitation is hit` as a Longport session-cap blocker and `token expired` as a credential-refresh blocker. Report symbol, quote count, and blocker only. Do not print Longport tokens or secrets. |
| Cloudflare Worker / Wrangler | `ops/cf-service/check-durability-object-status.md`, `ops/cf-service/cf-check-error.md` | Public HTTP for unauthenticated status/meta GETs; repo-local `npx wrangler` from `$WORKSPACE/tradingflow-cfworker-service`; auth via `wrangler login` or `CLOUDFLARE_API_TOKEN`. | Read-only smoke: `curl` `/canary` and selected status/meta endpoints; then `cd "$WORKSPACE/tradingflow-cfworker-service"` and run `npx wrangler deployments list --env production` or a bounded `npx wrangler tail --env production --format json` when logs are required. | Never `wrangler deploy`, `wrangler kv key put/delete`, or production mutations from a status run. Use `--env production` and the repo-local Wrangler version. |
| Browser plugin / in-app browser | `ops/webappp-fullstack/browser-e2e-product-review.md`, landing E2E and screenshot runbooks | Use the Browser plugin named by the runbook, commonly `@Browser` / `plugin://browser@openai-bundled`, or the in-app browser when that is the active Codex surface. | Open the target local or production URL, verify the page loads, and capture only the evidence the runbook asks for. For webapp local flows, start the sibling dev server first and verify the actual port. | Browser product review is not the same as running repository Playwright tests. Use Playwright specs as read-only journey maps unless the runbook specifically asks for test execution. |
| Lark / Feishu CLI | Support mail, calendar, docs, Drive, Base, task, approval, and other Lark-backed workflows referenced by `lark-*` skills or user requests | Use local `lark-cli`; no MCP/connector is required when a Lark skill or runbook says to use the CLI. Choose `--as user` for user-owned resources such as mail, calendar, Drive, docs, and personal tasks; choose `--as bot` only for bot-owned/app-level operations. | Read the relevant `lark-*` skill first. Always reuse existing auth before starting login: run `command -v lark-cli`, `lark-cli --version`, then `lark-cli auth status --json --verify`. For a specific action, run `lark-cli auth check --scope "<needed_scope>" --json` before the action. For mail support workflows, prior known checks include `lark-cli mail user_mailboxes profile --as user --params '{"user_mailbox_id":"me"}' --json` and `lark-cli mail +triage --as user --mailbox me --max <n> --format json`. | Do not start `lark-cli auth login`, generate a QR code, or ask a human to scan a new QR code until the existing session has been checked and either fails, is expired, or lacks the exact required user scope. Reusing existing auth is the default because new QR login interrupts long-running runbooks. If login is actually required, use split-flow `lark-cli auth login --scope "<scope>" --no-wait --json`, generate a QR code with `lark-cli auth qrcode`, then stop and wait for the user to confirm before completing `--device-code`. Do not output app secrets, access tokens, or raw auth payloads. If JSON output includes `_notice.update`, finish the task and offer `lark-cli update`. High-risk writes that exit `10` require explicit user confirmation before retrying with `--yes`. |
| Stripe billing UX tests | `ops/webappp-fullstack/browser-e2e-product-review.md` | No MCP/connector is required for normal billing UX checks. Browser is primary for user-visible checkout/portal flows. SDK/API verification or cleanup should use `STRIPE_SECRET_KEY` from `$WORKSPACE/tradingflow-webapp-fullstack/.env.local`. | Before any authorized payment lifecycle test, confirm the local Stripe key source exists and starts with `sk_test_`. Use the app and Stripe-hosted UI in Browser for capability proof; use SDK/API only for setup, canonical status verification, or cleanup. | Abort on missing key, `sk_live_`, unknown key source, or any fetched Stripe object with `livemode: true`. Treat Stripe connector/plugin mutations as unsafe until test mode is proven. Do not complete payment/add-card/change-card/cancel flows unless the user explicitly authorizes that exact test. |
| Stripe production revenue | `ops/tradingflow-ceo-daily-review.md` | Use the local Stripe CLI only, preferably through `node ops/scripts/stripe-production-revenue-summary.mjs` from this repo. For manual preflight, verify `command -v stripe`, `stripe --version`, and `stripe config --list` with all keys redacted. The account should resolve to TradingFlow production and live mode should be available through the CLI config. | Preferred daily check: `node ops/scripts/stripe-production-revenue-summary.mjs`, then report aggregate-only balance, cash/revenue windows, charge health, subscription counts, and MRR/ARR proxy by status/currency. Manual fallback preflight: `stripe balance retrieve --live | jq '{object, available, pending}'`; manual fallback aggregate sources: `stripe balance_transactions list --live`, `stripe charges list --live`, and `stripe subscriptions list --live --status all`. | This production row is for read-only CEO revenue reporting, not payment lifecycle testing. Always pass `--live`; never print raw keys, customer PII, cards, invoices, or full object payloads. Never create, update, refund, cancel, or open checkout/portal sessions from a daily revenue check without explicit approval for that exact mutation. Treat helper `truncated: true` as partial evidence and name the truncated section. |
| Clerk auth | Browser product review and landing screenshot runbooks | Use the app's normal login fixtures and `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` (`CLERK_SECRET_KEY` for server-side checks when needed). | For UI runs, verify the displayed email/account identity after login or account switch before counting coverage. Default safe fixture OTPs and account emails are documented in the target runbook. | Do not confuse cached sessions with a new account state. Clear the Browser context or Clerk cookies and retry once when identity/billing state does not change. |
| Neon database | Authorized billing lifecycle tests | Use `NEON_DATABASE_URL` from `$WORKSPACE/tradingflow-webapp-fullstack/.env.local` when a runbook explicitly needs canonical user/billing state or restoration. | Run only read-only user/customer lookups unless an authorized Stripe lifecycle test requires fixture setup or cleanup. Report safe ids and statuses only. | Restore seeded users if a test repoints `stripe_customer_id`. Do not mutate Neon during ordinary product review. |
| Discord webhooks | Observability routing references in webapp/cf-service runbooks | Prefer verifying emitted routing through Better Stack logs or code paths. Webhook URLs live in repo env/secrets and are notification sinks, not normal connection probes. | Check that the relevant env var name exists or that Better Stack shows the expected P0/P1 event. | Do not send test Discord messages unless the user explicitly asks to verify notification delivery. |

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

## Runbooks

| Area | Runbook | Use first when |
| --- | --- | --- |
| Company | `ops/tradingflow-ceo-daily-review.md` | Running a daily CEO-level operating review across product health, engineering reliability, business operations, customer/support signals, and strategic/investor recommendations. |
| Architecture | `ops/workspace-system-architecture-review.md` | Reviewing all ops-referenced workspace projects as a system architect from greenfield and reverse-adversarial simplification perspectives. |
| CF service | `ops/cf-service/check-durability-object-status.md` | Checking production Worker DO/KV/API serving health, freshness, and size. |
| CF service | `ops/cf-service/data-quality.md` | Auditing ClickHouse trade/meta integrity, latency, small-trade coverage, contract-rank correctness, and Greeks parity. |
| CF service | `ops/cf-service/cf-check-error.md` | Investigating process-service producer ingest gaps with Better Stack plus ClickHouse coverage. |
| Webapp | `ops/webappp-fullstack/webapp-check-error.md` | Correlating recent production errors across PostHog Error Tracking and Better Stack. |
| Webapp | `ops/webappp-fullstack/posthog-research.md` | Running product analytics, event quality, dashboard, and behavior reviews in PostHog. |
| Webapp | `ops/webappp-fullstack/browser-e2e-product-review.md` | Walking webapp UI journeys with `@Browser` for manual E2E product testing, UI defects, and PM/trader UX findings. |
| Landing | `ops/landingpage/browser-e2e-test.md` | Simulating user journeys while doing E2E maintenance and product review. |
| Landing | `ops/landingpage/update-blog-posts-and-changelog.md` | Updating bilingual blog posts (`content/posts/**`), screenshots, public changelog, and What's New sync. |
| Landing | `ops/landingpage/update-tutorial-series.md` | Creating/updating the bilingual tutorial series (`content/series/tradingflow-docs`) — page-based how-to chapters with annotated screenshots, Mermaid diagrams, and cross-links. |
| Landing | `ops/landingpage/posthog-events.md` | Auditing or extending landing-site PostHog event taxonomy and funnel definitions. |
| Skills/runbooks | `ops/skill-maintainer.md` | Maintaining runbooks and skills so future agents run them cleanly. |

## Runbook Self-Maintenance

Use the `runbook-maintainer` skill when maintaining this index. At the end of each index maintenance pass or runbook execution:

1. Decide whether the run revealed a reusable lesson for the selected runbook or this index.
2. Promote durable lessons into the runbook's procedure, prerequisites, verification, or troubleshooting sections.
3. Keep transient next-run state in `Agent Handoff`, active backlog, watchlist, or latest-run note only.
4. Prune completed or obsolete handoff items in the same edit that confirms they are done.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this index when:

- A runbook is added, removed, renamed, replaced by an alias, or changes canonical ownership.
- Shared tool-connection paths, credential locations, MCP/plugin names, or preflight checks drift.
- The `/goal` invocation shape, handoff policy, evidence-audit shape, or maintenance contract changes.
- A repeated ambiguity makes agents choose the wrong runbook or the wrong connection path.

Do not update this index for:

- One-off incident counts, transient production findings, raw logs, or current-run-only evidence.
- Domain thresholds, SQL, selectors, screenshots, or workflow steps owned by a narrower runbook.
- Completed progress that belongs only in the final report.
- Speculative future improvements that were not supported by a run or repo/runtime evidence.
