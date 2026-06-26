---
name: datapipeline-error-check
description: End-to-end TradingFlow production data-pipeline error check that combines process-service Better Stack error triage, cf-service producer health, Cloudflare Worker Durable Object/KV serving health, and ClickHouse data-quality checks. Use when the user asks why contract-rank/option-flow data is stale, lagging, missing, delayed, not refreshed, or whether UW ingest, Worker snapshots, Durable Objects, or ClickHouse source data are healthy.
disable-model-invocation: true
---

# Data Pipeline Error Check - process-service + cf-service + ClickHouse

This is the canonical replacement for the retired process-service error runbook and the retired cf-service producer, Durable Object/KV status, and data-quality runbooks.

Those source files were consolidated here and removed. Keep this runbook self-contained; do not add new links back to retired paths.

Use it when the question spans more than one layer of the TradingFlow data path:

1. **Producer ownership and liveness** - which service is writing UW/option-flow rows.
2. **Process-service errors and heartbeats** - EC2 backend jobs, cron, and legacy producer health.
3. **cf-service Worker and Durable Objects** - public serving endpoints, DO/KV state, snapshots, and Worker logs.
4. **ClickHouse source data** - row freshness, completeness, latency, metadata enrichment, contract-rank correctness, and Greeks parity.

This runbook is read-only by default. Do not deploy, mutate Cloudflare KV/DO state, send heartbeat pings manually, force snapshot refreshes, run backfills, or change Better Stack monitors unless the user explicitly authorizes that exact action.

## Recommended Invocation

Use `/goal` for broad production investigations.

- **Objective:** produce an evidence-backed data-pipeline health verdict for the requested window or trading date, from producer logs through Worker serving and ClickHouse source quality.
- **Success criteria:** active writer is resolved, Better Stack source/table IDs are resolved at runtime, process-service and cf-service evidence are checked, Cloudflare serving endpoints are compared against ClickHouse source freshness, data-quality scripts or bounded SQL verify row health, and the report states impact radius, likely root cause, data-loss risk, and next action.
- **Stop condition:** the pipeline is proven healthy, the failing layer is isolated with evidence, access to a required source is explicitly blocked, or the next step would require a production mutation.

A single agent can run this end to end. A master/subagent split is useful only for longer incident reviews: the master owns scope, verdict, and risk; subagents gather bounded Better Stack, Worker, and ClickHouse evidence.

## Agent Handoff

Last updated: 2026-06-25

This runbook was created as a documentation-maintenance merge of the four retired source runbooks listed above. No production checks were executed during creation.

Current durable guidance from recent runs:

- Resolve the **active writer** before interpreting logs. Production Worker `UW_ENABLED=true` means `tradingflow-cfworker-service` owns live UW ingest and Better Stack source `cf-service` is primary; otherwise process-service `syncUwData` and `Process Service[Production]` are primary.
- Current `tradingflow-cfworker-service` code has retired Worker UW ingestion: `/uw-ingestion/*` and `/ingest` should return `404` after the removal deploy. If production still returns `200` for `/uw-ingestion/status` or emits `uw_ingestion_*` logs, treat that as stale Worker deployment / deploy skew first, then verify with `npx wrangler deployments list --env production`.
- Worker `/uw-ingestion/status` can show `enabled:false` / `connected:false` while ClickHouse and snapshots are current. Treat that as writer ownership or intentional disablement until ClickHouse freshness and the active writer are checked.
- For contract-rank staleness, separate **ClickHouse source freshness** from **Worker snapshot freshness**. Fresh ClickHouse with stale `/api/v1/contract-rank/latest-snapshot/meta` or `/api/v1/contract-rank/snapshots/meta` points at snapshot refresh, DO, KV, or cache serving; stale ClickHouse points at producer/source ingest.
- Do not treat all DEI zero rows as data loss. Split raw zero-DEI rows from actionable rows after SymbolMetaData join; precision or rounding can produce false positives.
- A broken opening stream is P0 when websocket open fails, first trades are missing after join acknowledgement, heartbeat delivery fails, or live fanout transport is broken. Per-record normalization noise is usually P1 unless it blocks ingestion.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the incident exposed a durable new rule for writer ownership, Better Stack predicates, Worker endpoint interpretation, ClickHouse thresholds, contract-rank checks, or remediation safety.
2. Update this runbook when source names, monitor names, endpoint paths, Worker env flags, ClickHouse schema, script names, thresholds, or report templates drift.
3. Keep one-off counts, temporary row totals, and completed incident notes out of the durable sections unless they change future routing.
4. If old references to the retired source runbooks reappear, replace them with this canonical runbook and move any durable missing procedure into this file.
5. State `Runbook maintenance: no change` in the final report when no durable doc change was needed.

## Workspace Map

| Area | Repo / path | Use |
| --- | --- | --- |
| Runbooks | `/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules` | This file and source runbooks. |
| Process service | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` | EC2 backend, ClickHouse scripts, process-service logs, symbol-meta, option-chain and Greeks checks. |
| Cloudflare Worker | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service` | Worker production config, Durable Objects, KV bindings, Wrangler, UW ingest Worker code. |
| Webapp | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack` | Contract-rank consumers, UI stale-data symptoms, mart diagnostics. |

## Read-Only Boundary

Allowed by default:

- Better Stack telemetry and uptime reads.
- Public HTTP `GET` checks against production Worker endpoints.
- Repo-local `npx wrangler` read-only commands such as deployments list, KV key read/list, and bounded tail when needed.
- Existing ClickHouse read-only scripts and bounded SELECT queries through repo `.env`.
- Small provider probes only when a data-quality symptom requires them.

Requires explicit user authorization:

- `wrangler deploy`, `wrangler kv key put/delete`, Durable Object migrations, or production env changes.
- Force-refresh endpoints, backfills, ClickHouse mutations, queue purge/replay, monitor edits, or heartbeat-token changes.
- Any command that prints raw secrets, full env files, webhook URLs, or API keys.

## Fast Triage Decision Tree

1. **Identify the symptom.**
   - UI stale/lagging: start with Worker snapshot and ClickHouse freshness.
   - Missing rows or low counts: start with active writer and ClickHouse data quality.
   - Error spike: start with Better Stack process/cf logs.
   - Contract-rank wrong: run ClickHouse data-quality, contract-rank parity, then Worker serving checks.

2. **Resolve the trading date and market state.**
   - For current-day checks, establish the New York trading date and whether the US session is pre-open, open, after-hours, or closed.
   - For full data-quality audits, prefer the most recent fully closed ET trading session. If today is open, use the prior trading day unless the user explicitly asks for live intraday latency.

3. **Resolve the active writer.**
   - Check current Worker code/config and production deployment age before interpreting `/uw-ingestion/status`.
   - In the current cfworker architecture, `/uw-ingestion/*` is retired and should return `404` once the removal deploy is live. A production `200` on `/uw-ingestion/status` means an older Worker bundle is still serving.
   - If the currently deployed Worker still includes UW ingestion, use `/uw-ingestion/status` to decide whether Worker or process-service owns ingest.
   - If Worker UW ingest is enabled and active, use `cf-service` logs for producer health.
   - If Worker UW ingest is disabled but ClickHouse is current, use process-service logs and scripts for active writer evidence.

4. **Split source vs serving.**
   - ClickHouse stale or thin: producer/source ingest problem.
   - ClickHouse current but Worker snapshot stale: Worker cron, DO/KV, payload-size, or cache problem.
   - Both current but web UI stale: webapp cache, route, query, or browser/client problem.

5. **Assess impact radius.**
   - Compare target date row counts and hourly coverage to a healthy baseline.
   - Check whether gaps affect all symbols, one source/provider, one class of contracts, one symbol family/alias, or only derived fields.
   - State whether evidence shows data loss, delayed ingestion, derived-field drift, or serving staleness.

## Tool and Source Resolution

### Better Stack

Resolve sources at runtime. Do not rely on old IDs or table names.

1. `telemetry_list_teams_tool` if team scope is unclear.
2. `telemetry_list_sources_tool`.
3. Match by source name:
   - `Process Service[Production]` for EC2 process-service logs and legacy writer evidence.
   - `cf-service` for Worker producer, Durable Object, snapshot refresh, and serving-layer logs.
4. `telemetry_get_query_instructions_tool` for the resolved `source_id` and `source_type: logs`.
5. Use the returned table names in `telemetry_query`.

For process-service uptime, resolve by name rather than trusting old IDs:

- Push heartbeat: `Process Service SyncUw Ingestion Heartbeats`.
- Pull monitor: `ProcessServiceCanary`.

### Cloudflare Worker

Production Worker origin:

```bash
WORKER_ORIGIN="https://cfworker-service.engineering-601.workers.dev"
```

Use repo-local Wrangler from the Worker repo:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service
npx wrangler deployments list --env production
```

Never use global legacy Wrangler if repo-local `npx wrangler` is available.

### ClickHouse

Use sibling repo `.env` credentials and existing scripts. Do not use a production ClickHouse MCP.

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
export PATH="$HOME/.bun/bin:$PATH" # if bun is not available in non-interactive shells
set -a; source .env; set +a
```

Preferred scripts:

- `bun scripts/verify-producer-freshness.ts YYYY-MM-DD`
- `bun scripts/check-data-integrity.ts --date YYYY-MM-DD --baseline-date YYYY-MM-DD --strict`
- `bun scripts/audit-small-trade-coverage.ts --compare BASELINE_YYYY-MM-DD,YYYY-MM-DD`
- `bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase a --symbols SPY,NVDA,AAPL --strict`

Use bounded custom SQL only when scripts do not answer the question.

## Execution Checklist

### Phase 0 - Scope, Time Window, and Baseline

Record:

- User symptom and target URL/page if any.
- Window, date, and timezone. Report both UTC and ET when interpreting market data.
- Whether the US market session is pre-open, open, after-hours, or closed.
- Baseline date for averages. Use a recent healthy full trading session, not the target date itself.

Useful local commands:

```bash
date -u
TZ=America/New_York date
```

### Phase 1 - Active Writer and Producer Liveness

Check Worker ingest status:

```bash
curl -sS "$WORKER_ORIGIN/uw-ingestion/status" | jq .
```

First compare that result with the current cfworker repo:

- Expected after the UW-ingestion removal deploy: `404` for `/uw-ingestion/*` and no `uw_ingestion_*` production logs.
- If production returns `200` or Better Stack still emits `uw_ingestion_*` logs, verify deploy skew with:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service
npx wrangler deployments list --env production
```

Interpretation:

| Signal | Meaning |
| --- | --- |
| `/uw-ingestion/status` returns `404` and current repo has retired UW ingestion | Worker UW ingestion is not active; use process-service writer evidence for live UW ingest. |
| `/uw-ingestion/status` returns `200` but current repo has retired UW ingestion | Production is running an older Worker bundle; stale UW DO logs can recur until the removal deploy reaches production. |
| `enabled:true`, `connected:true` | Worker is expected to be active writer; use `cf-service` producer logs. |
| `enabled:false` and ClickHouse current | Worker is not current writer or ingest is intentionally disabled; check process-service writer evidence. |
| `enabled:true`, `connected:false`, ClickHouse stale | Worker ingest outage or upstream streaming issue; inspect `uw_websocket_health`, streaming lifecycle, and drain/drop logs. |
| Queue enabled with enqueue/drain gap | Cloudflare Queue throughput or consumer batching issue; compare enqueue and drain attempts by hour. |

Then verify source freshness from process-service repo:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
export PATH="$HOME/.bun/bin:$PATH" # if bun is not available in non-interactive shells
set -a; source .env; set +a
bun scripts/verify-producer-freshness.ts YYYY-MM-DD
```

Healthy evidence includes current max trade times, expected RTH hourly coverage, stable raw/aggregate ratios, and no large lag tail unexplained by market state.

### Phase 2 - Process-Service Errors and Heartbeats

Use this phase when the active writer is process-service, when process-service jobs may explain data gaps, or when the user asks about backend production errors.

Required checks:

- Resolve `Process Service[Production]` logs source at runtime.
- Read `telemetry_get_query_instructions_tool` before SQL.
- Query `level="error"` rows for the requested window.
- Group by `jobName`, severity tag (`[P0 Error]`, `[P1 Error]`), `_pattern`, and last seen.
- Check Uptime push heartbeat and pull canary by name.

Prioritize:

| Priority | Examples |
| --- | --- |
| P0 | UW websocket unavailable, missing first trades after join ack, heartbeat delivery failure, index quote total failure affecting required roots, ClickHouse insert exhausted. |
| P1 | Fallback/provider degradation, isolated symbol metadata miss, per-record normalization issues, stale quote fallback. |
| Noise | Expected provider fallback chatter that does not reduce source coverage or user-visible freshness. |

If `CheckCFServiceDataController` reports no-data alerts, compare Worker `/canary`, `/uw-ingestion/status`, and `cf-service` logs before assigning the outage to EC2.

### Phase 3 - cf-Service Worker Logs and Producer Health

Use this phase when Worker ingest is active, Worker serving is stale, queue mode is suspected, or Durable Object/snapshot logs are needed.

Resolve the `cf-service` Better Stack source at runtime. Event predicates to check:

| Signal | Predicate |
| --- | --- |
| Runtime summary | `event = 'runtime_summary'` |
| Websocket health | `event = 'uw_websocket_health'` |
| Streaming lifecycle | `event IN ('streaming_started', 'streaming_resumed', 'channel_join_sent', 'channel_join_ack')` |
| Buffer drain/drop | `event IN ('write_buffer_drain_batch', 'write_buffer_drop', 'write_buffer_drop_summary')` or message contains `write buffer drop` |
| Insert failure | message contains `batch insert timeout`, `aggregate batch insert timeout`, `raw batch insert timeout`, or context `errorMessage = 'insert attempts exhausted'` |
| Queue path | `uw_ingest_queue_*`, `processUwIngestQueueBatch`, enqueue/drain fields |
| Snapshot refresh | `contract_rank_snapshot_refresh_completed` / failure events, `payloadBytes`, `snapshotDate`, and duration fields |

Queue diagnosis:

- If queue enqueue attempts greatly exceed drain attempts and ClickHouse has high `>10m` lag, treat this as queue throughput/backlog.
- Before tuning queue `max_batch_size` or concurrency, check whether each queue message is inserted separately. Combining messages into larger ClickHouse insert batches may be the real fix.
- If Worker ingest is disabled and no queue events exist, do not keep debugging queue mode as the active incident path.

### Phase 4 - Worker Serving, Durable Object, and KV Status

Use public HTTP first:

```bash
curl -sS "$WORKER_ORIGIN/canary" | jq .
curl -sS "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot/meta" | jq .
curl -sS "$WORKER_ORIGIN/api/v1/contract-rank/snapshots/meta" | jq .
curl -sS "$WORKER_ORIGIN/api/v1/available-dates" | jq .
curl -sS "$WORKER_ORIGIN/api/v1/symbol-meta/latest/meta" | jq .
curl -sS "$WORKER_ORIGIN/uw-ingestion/status" | jq .
```

For full snapshot size and date checks:

```bash
curl -sS "$WORKER_ORIGIN/api/v1/contract-rank/snapshots/YYYY-MM-DD" -o /tmp/contract-rank-snapshot.json
wc -c /tmp/contract-rank-snapshot.json
jq '{date: (.date // .effectiveDate // .d), generatedAt: (.generatedAt // .asOf // .as), rowCount: (.rowCount // .rc // (.data // .rows // .r // [] | length))}' /tmp/contract-rank-snapshot.json
```

Serving-layer interpretation:

| Symptom | Likely layer |
| --- | --- |
| `/canary` fails | Worker availability/deploy/routing. |
| Snapshot meta old, ClickHouse current | Snapshot cron, DO refresh, KV write/read, payload-size guardrail, or cache invalidation. |
| Snapshot meta current, UI old | Webapp route/cache/client state. |
| `available-dates` missing latest date, ClickHouse has rows | Worker date-retention or refresh path. |
| Snapshot payload near Cloudflare limits | Size/serialization guardrail; check `payloadBytes` trend and KV object sizes. |
| Worker ingest disabled but snapshots current | Not necessarily unhealthy; active writer is elsewhere. |

Use Wrangler read-only commands when HTTP indicates a serving issue:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service
npx wrangler deployments list --env production
npx wrangler kv key list --binding CONTRACT_RANK_KV --env production
```

If the source data is wrong or empty, switch back to Phase 5 instead of treating the Worker as the root cause.

### Phase 5 - ClickHouse Data Quality and Latency

Run this phase for data-loss risk, row-count comparisons, latency, coverage, metadata, contract-rank correctness, and Greeks/price parity.

Select a target date and healthy baseline:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
export PATH="$HOME/.bun/bin:$PATH" # if bun is not available in non-interactive shells
set -a; source .env; set +a
DATE=YYYY-MM-DD
BASELINE_DATE=YYYY-MM-DD
bun scripts/check-data-integrity.ts --date "$DATE" --baseline-date "$BASELINE_DATE" --strict
bun scripts/verify-producer-freshness.ts "$DATE"
bun scripts/audit-small-trade-coverage.ts --compare "$BASELINE_DATE,$DATE"
```

Core thresholds from the data-quality runbook:

| Metric | Healthy / expected | Investigate |
| --- | --- | --- |
| Premium under 25k share | `>= 0.90` | Below threshold suggests small-trade loss or filtering. |
| Zero market cap stock share | `<= 0.005` | Broad spike suggests SymbolMetaData issue. |
| Zero DEI with DEX share | `<= 0.02` after actionable filtering | Split raw vs actionable before claiming loss. |
| Aggregate row count ratio | `>= 0.70` vs baseline | Low ratio suggests missing writes or bad date/baseline. |
| Open p50 latency | `<= 3s` | `> 10s` needs investigation. |
| Open p95 latency | `<= ~65s` | `> 120s` needs investigation. |
| Open rows over 5m lag | `0` healthy | Sustained nonzero means backlog. |
| Full-day rows over 10m lag | `0` healthy | Any nonzero is a breach. |
| RTH hourly coverage | Every RTH hour nonzero | Missing hours suggest outage. |
| Agg/raw ratio | About `0.99-1.01` | `< 0.95` suggests aggregation gap. |

Common attribution:

| Symptom | Usually |
| --- | --- |
| Low row ratio + high lag + queue enqueue/drain gap | Cloudflare Queue consumer throughput/backlog. |
| Low small-premium share + buffer drops | Worker/process write-buffer starvation. |
| Broad `market_cap=0` or earnings sentinel | SymbolMetaData snapshot or sync race. |
| One alias family wrong, e.g. BRKB/BFB/index roots | Alias/exclusion/vendor ticker mapping. |
| Meta row exists but trades still zero fields | Stale in-memory meta snapshot or missing refresh. |
| ClickHouse current but snapshot stale | Serving refresh, not source ingest. |

Use bounded targeted SQL only after the scripts identify a failing dimension. Keep reusable SQL snippets in this runbook; do not paste credentials in output.

### Phase 6 - Contract-Rank Correctness

Run this when contract-rank rows look stale, missing, or disagree with option-chain data.

Current mart: `mv_contract_rank_flow`.

Do not use retired `mv_contract_day_flow`.

Recommended checks:

1. Confirm `mv_contract_rank_flow` has target-date rows and expected active symbols.
2. Sample active symbols/contracts from the mart.
3. Compare contract identity (`option_symbol`, `put_call`, `strike`, `expiration_date`) against Massive live snapshot when timing is appropriate.
4. Compare mart structure fields to same-day/prior `OptionChainTable` with webapp diagnostics when Massive timing drift makes live snapshot ambiguous.

Verdict:

| Result | Meaning |
| --- | --- |
| No hard identity failures, soft quote/Greek drift explained by timing | Good. |
| Repeated quote/OI/Greek drifts by one symbol or field | Degraded; compare `OptionChainTable` and timing. |
| Repeated presence, `put_call`, `strike`, or `expiration_date` failures | Bad; treat as contract-rank sync or structure-fill bug until proven vendor-wide. |

Adjusted-contract strike precision requires attribution. If OCC encodes a fractional strike but chain/mart rounded it, compare `OptionChainTable`, `mv_contract_rank_flow`, and `AggregatedOptionTrades` for the same contract before calling it UW ingest loss.

### Phase 7 - Greeks and Price Parity

Run after nightly `OptionChainTable` ingest when the question is pricing model, IV, delta, or Greek correctness.

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
bun scripts/check-greeks-parity.ts --date "$DATE" --phase a --symbols SPY,NVDA,AAPL --strict
```

Active scope:

- `OptionChainTable` vs Massive raw `implied_volatility`, Greeks, and close.
- Retired scope: old `Phase B` against `mv_contract_day_flow`. Do not run it.

Expected non-bug differences:

- Fixed local 4.5% risk-free rate vs vendor curve.
- European Black-Scholes vs vendor model.
- Mid vs close vs last-trade price.
- Index underlyings, deep OTM, 0DTE, low liquidity, and snapshot timing.

Hard fail in strict mode is currently `>= 3` symbols flagged. One or two isolated symbols usually require alias/provider/input-price drilldown rather than a broad pipeline outage conclusion.

### Phase 8 - Correlate and Classify

Classify the incident by the narrowest failing layer:

| Layer | Evidence |
| --- | --- |
| Upstream provider | Broad provider errors across many symbols plus matching service logs; do not infer from isolated aliases. |
| Producer ingest | ClickHouse stale/thin plus Better Stack writer errors, buffer drops, queue backlog, or heartbeat failures. |
| Metadata enrichment | Raw rows exist but market cap, earnings, DEI, alias, or reference fields fail coverage thresholds. |
| Derived mart | Source rows healthy but `mv_contract_rank_flow` wrong or stale. |
| Worker serving | ClickHouse current but Worker snapshot/meta/dates stale or payload too large. |
| Webapp | Worker and ClickHouse current but local/prod UI stale. |

Impact radius language:

- **Rows affected:** target row count vs baseline average and affected hours.
- **Symbols affected:** all symbols, symbol families, aliases, indexes, or isolated tickers.
- **Fields affected:** raw trade presence, aggregate rows, metadata fields, Greeks, contract identity, snapshot payload, or UI cache.
- **Data-loss risk:** permanent missing raw/aggregate writes, delayed/backlog catch-up, derived-field repairable by backfill, or serving-only staleness.

## Report Template

```markdown
## Data pipeline check - {window/date}

**Verdict:** Healthy / Degraded / Down
**Failing layer:** Upstream provider / Producer ingest / Metadata / Derived mart / Worker serving / Webapp / None proven
**Data-loss risk:** None seen / Delayed catch-up / Repairable derived fields / Potential permanent raw-row gap

### Scope
- Window:
- Trading date:
- Market state:
- Baseline date:
- User symptom:

### ToolAccess
- betterstack: connected|blocked|skipped; source=<resolved name/id>; blocker=<none or error>
- uptime: connected|blocked|skipped; monitor=<name/id>; blocker=<none or error>
- cloudflare: connected|blocked|skipped; path=<http|wrangler>; blocker=<none or error>
- clickhouse: connected|blocked|skipped; script_or_query=<name>; blocker=<none or error>
- massive/alpaca/longport: connected|blocked|skipped; path=<script/sdk>; blocker=<none or error>

### Active writer
- Owner:
- Evidence:
- `/uw-ingestion/status`:

### Process-service health
- Error clusters:
- Heartbeats/canary:
- P0/P1/noise split:

### cf-service Worker and serving
- `/canary`:
- snapshot meta/date:
- `/api/v1/available-dates`:
- `/api/v1/symbol-meta/latest/meta`:
- relevant log events:
- payload/size risk:

### ClickHouse data quality
| Metric | Target | Baseline/threshold | Status |
| --- | --- | --- | --- |
| Row count | | | |
| RTH hourly coverage | | | |
| Open p50/p95 latency | | | |
| >5m / >10m lag | | | |
| Agg/raw ratio | | | |
| Small-premium share | | >= 0.90 | |
| Zero market cap share | | <= 0.005 | |
| Actionable zero DEI with DEX | | <= 0.02 | |

### Contract-rank / Greeks
- `mv_contract_rank_flow` date/rows:
- Contract identity parity:
- Greeks parity:
- Timing/vendor drift caveats:

### Impact radius
- Rows affected:
- Symbols/contracts affected:
- Fields affected:
- Are we seeing data loss?

### Likely root cause
- Confidence:
- Evidence:

### Recommended next action
- Read-only verification:
- Authorized remediation needed:
- Success signal after fix:

### Runbook maintenance
- no change / changed:
```

## Canonical Coverage Map

The retired source runbooks were consolidated into these sections:

| Need | Section |
| --- | --- |
| Process-service error patterns, heartbeat checks, known noise | Phase 2 |
| Active producer logs, write-buffer/drop/queue predicates, queue diagnosis | Phases 1 and 3 |
| Worker public endpoints, Durable Object/KV size checks, snapshot interpretation | Phase 4 |
| ClickHouse integrity, latency, contract-rank checks, Greeks parity thresholds | Phases 5, 6, and 7 |

## Final Reminder

Do not collapse every stale UI symptom into one bucket. Prove the layer:

1. Is ClickHouse fresh and complete?
2. Is the active writer healthy?
3. Is the Worker snapshot current and size-safe?
4. Is the webapp reading the current Worker response?

Only call it data loss when ClickHouse raw/aggregate rows are missing after producer catch-up is ruled out. If source rows exist and only derived fields or snapshots are stale, classify it as repairable enrichment/derived/serving lag.
