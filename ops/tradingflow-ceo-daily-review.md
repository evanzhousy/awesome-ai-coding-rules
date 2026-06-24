---
name: tradingflow-ceo-daily-review
description: Daily AI CEO operating review for TradingFlow. Coordinates engineering health, product UX, data quality, business operations, support, revenue, growth, and strategic/investor analysis using the credentials and read-only tool preflights in ops/start-here.md.
disable-model-invocation: true
---

# TradingFlow CEO Daily Review

Use this runbook when an automation asks an AI agent to act as the daily operating CEO for TradingFlow: verify whether the production company and production product are working as expected, detect unusual situations, recommend short- and long-term actions, and produce a concise board/advisor/investor-grade report.

This runbook is an executive orchestration layer. It does not replace the narrower runbooks in `ops/`; it selects and runs the right checks, then synthesizes them into one CEO report.

This is a production-first runbook. Daily CEO verdicts must use production surfaces and production credentials unless the report explicitly labels a source as test, staging, local, or fixture-only. Test-mode Stripe, test Clerk, local Browser fixtures, or local development data can support diagnosis, but they cannot satisfy production revenue, customer, billing, or company-health evidence.

## Recommended Invocation

Use `/goal` for each daily automation run:

- Objective: produce an evidence-backed TradingFlow daily CEO report covering production engineering health, production product behavior, production data freshness, business operations, customer/support signals, unusual situations, short- and long-term actions, and board/investor-level strategic recommendations.
- Success criteria: `ops/start-here.md` is read first, required production credentials/tools are proven with read-only preflights, the relevant narrower runbooks are used for source evidence, no production/customer/payment mutation occurs without explicit approval, the report follows the required CEO template, and this runbook is maintained if reusable drift is discovered.
- Stop condition: the CEO report is complete, a critical production incident requires immediate human escalation, or source access is explicitly blocked and the missing checks are listed.

Pasteable automation prompt:

```text
Use ops/tradingflow-ceo-daily-review.md as the production runbook. Act as TradingFlow's daily AI CEO. Read ops/start-here.md first, prove read-only production access to the needed tools, run the relevant production engineering, product, analytics, business operations, revenue, and support checks, then deliver the CEO Daily Report template. Do not mutate production, billing, customer data, support messages, deployments, secrets, or third-party configuration without explicit user approval for the exact action.
```

## Agent Handoff

Last updated: 2026-06-24

Latest maintenance clarified that this is a production-first CEO runbook. Production Stripe CLI live-mode access was verified on 2026-06-24 for aggregate read-only revenue checks; future runs should prefer `node ops/scripts/stripe-production-revenue-summary.mjs` for revenue and subscription evidence, not `.env.local` test-mode Stripe keys.

No open handoff items. Start with `ops/start-here.md`, then record any reusable missing production tool paths, blocked credentials, stale runbook links, or report-shape improvements here or in the narrower owning runbook.

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

1. `ops/start-here.md` for the canonical tool matrix, credential paths, read-only preflight rules, and runbook routing.
2. This runbook's [Agent Handoff](#agent-handoff).
3. The narrow runbooks selected by the workflow below. Read each selected runbook's handoff/watchlist before executing it.

Do not skip `ops/start-here.md`. It owns current connection paths for PostHog, Better Stack, ClickHouse, Massive, Alpaca, Longport, Cloudflare/Wrangler, Browser, Lark, Stripe, Clerk, Neon, and Discord.

## Workflow

### 0. Establish the Day Context

Record:

- Local date/time and timezone where the automation is running.
- New York date/time, market session state, and latest eligible trading date.
- Requested report window, defaulting to last 24 hours.
- Whether this is `daily`, `weekly-deep`, `post-release`, or `incident` mode.

If the run happens before or during a market open, be explicit about what "today" means for market-data freshness. Do not compare current-day freshness against a session that has not opened or has not produced complete data.

### 1. Prove Tool Access

Use `ops/start-here.md` [Tool Connection Preflight](start-here.md#tool-connection-preflight). Keep probes minimal and read-only.

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
| Is the Cloudflare serving layer populated, fresh, and size-safe? | `ops/cf-service/check-durability-object-status.md` |
| Is ClickHouse/source data fresh and internally consistent? | `ops/cf-service/data-quality.md` |
| Are producer ingest gaps or provider issues visible? | `ops/cf-service/cf-check-error.md` |
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

Keep this phase read-only. Use connected tools, repo scripts, or source dashboards named in `ops/start-here.md`.

Production revenue checks must use the Stripe CLI live-mode path from `ops/start-here.md`, not the webapp `.env.local` test-mode `STRIPE_SECRET_KEY`. Prefer the read-only helper:

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

1. Decide whether the run revealed a reusable lesson for this CEO runbook, `ops/start-here.md`, or a narrower owning runbook.
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
