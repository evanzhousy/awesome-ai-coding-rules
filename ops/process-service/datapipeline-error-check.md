---
name: datapipeline-error-check
description: End-to-end TradingFlow production data-pipeline and rendered data-quality check that combines process-service Better Stack error triage, cf-service producer health, Cloudflare Worker Durable Object/R2/KV serving health, ClickHouse data-quality checks, and optional Rank GEX/IV comparisons against InsiderFinance and Barchart. Use when contract-rank/option-flow data is stale, lagging, missing, delayed, not refreshed, or when rendered GEX/IV values need same-ticker, same-session vendor comparison.
disable-model-invocation: true
---

# Data Pipeline and Rendered Data-Quality Check

Use this runbook to investigate production data health and, when relevant, compare
the rendered Rank product with external vendor references. It covers five layers:

1. **Producer ownership and liveness** — which service is writing UW/option-flow rows
2. **Process-service errors and heartbeats** — EC2 backend jobs, cron, legacy producer health
3. **cf-service Worker, Durable Objects, R2, and KV** — serving endpoints, DO/R2/KV state, snapshots, Worker logs
4. **ClickHouse source data** — freshness, completeness, latency, metadata, contract-rank, Greeks parity
5. **Rendered product evidence** — same-ticker/session GEX comparison with InsiderFinance and IV-family comparison with Barchart

External vendors are methodology references, not canonical truth. Rendered
comparison evidence can narrow a product or presentation discrepancy, but it
does not replace source, producer, or serving-layer proof.

## Objective

Produce a current, evidence-backed verdict for the selected execution mode.
Success means the run identifies the narrowest proven failing layer or rendered
discrepancy bucket, states data-loss risk and access limits, records the relevant
dates/timestamps, and gives a bounded next action without crossing the read-only
boundary.

Expected operator: an AI agent with repo access and the tools required by the
selected mode—Better Stack/Cloudflare/ClickHouse access for pipeline work, or
browser automation and the local TradingFlow test session for rendered vendor
comparison.

## How to run

Work directly in the current session. Do not invent a `/goal` or Master/Subagent loop.

| Mode | Use when | Run |
| --- | --- | --- |
| **Pipeline** (default) | Data is stale, missing, delayed, or wrong | Phase 0, the relevant Phases 1-7, then Phase 9 |
| **GEX** | TradingFlow GEX needs comparison with InsiderFinance | Phase 0, Phase 8A, then Phase 9 |
| **IV** | TradingFlow IV-family metrics need comparison with Barchart | Phase 0, Phase 8B, then Phase 9 |
| **Combined** | A rendered mismatch may originate in the pipeline | Prove pipeline health first, then run the relevant Phase 8 branch and Phase 9 |

1. Record the symptom, ticker if relevant, trading date, market state, and evidence window.
2. Run only the phases needed to prove or rule out the suspected layer; do not mechanically run every phase.
3. Resolve live IDs, writer ownership, deployment state, and vendor timestamps at runtime.
4. Classify the narrowest proven layer or discrepancy in Phase 9.
5. Write the report using the template. `Highlights` must be the first report section after the title.

Do not change code, production state, accounts, billing, or provider data unless
the user separately asks for implementation or remediation.

## Agent Handoff

Last updated: 2026-08-25

The latest read-only Pipeline audit used 2026-08-24 as the closed target, 2026-08-21 as baseline, and 2026-08-25 for live liveness. Broad integrity, raw/aggregate coverage, metadata, Contract Rank mart parity, and same-date Greeks parity passed. A bounded 11:42:45-12:12:46 ET catch-up affected 20,665 aggregate rows over ten minutes late, but every hourly raw/aggregate fill difference was explained and current-day ingestion was fresh; no permanent data loss was found. Better Stack read-only OAuth was restored and attributed the catch-up to upstream late replay: pre-handler lag carried the tail, handler normalization remained 0-18 ms, reconnect attempts and drain failures were zero, and insert latency stayed bounded. Protected edge payloads remained access-blocked.

The live capability pass again produced 12 bounded roots. `DOCK`, `FSZ`, `IDLV`, `RUI`, `SECZ`, `SNBRQ`, `TSEOQ`, and `UHALB` were metadata-capable; `RLV` and `XDB` were chain-only; `XSPBW` and `XSPBX` remained raw-only by contract. Production still runs revision `566f2d8`; `origin/master` is `095d059`, and the compiled capability-preflight module is absent on the VM.

- [ ] A one-time same-task continuation is scheduled for 17:06 ET. Recheck every live gate, then deploy the reviewed `origin/master` with the production default `ROOT_CAPABILITY_PREFLIGHT_MODE=report_only`; do not use the emergency override for this non-P0 change.
- [ ] After deployment, verify bounded candidate counts, expiring provider evidence, `addedToUniverseCount=0`, first-seen probe deduplication, and no producer-latency regression before considering `enforce`. Any backfill remains separately authorized.
- [ ] Sample at least five production `contract_rank_overlay_refresh_completed` events before judging latency. One earlier cycle completed successfully in 7,195 ms, above the five-second investigation threshold, but one sample cannot establish p95 degradation.
- [ ] Time-box the live overlay test: set `TEST_CONTRACT_RANK_OVERLAY_ENABLED=true`, deploy test, verify at least two bounded `contract_rank_overlay_refresh_completed` cycles plus base/overlay parity, then restore `false` and redeploy test before promoting production. Production ignores the test flag and remains enabled. No ClickHouse schema apply is required.

## Operating Invariants

Re-resolve dated state during every run. Keep these rules stable:

| Rule | Interpretation |
| --- | --- |
| Writer first | Resolve the active writer before interpreting logs; retired Worker UW routes returning `404` are expected after the removal deploy. |
| Access is not health | `401 AUTHENTICATION_REQUIRED` on protected reads proves access control, not an outage. Corroborate with permitted telemetry and ClickHouse. |
| Source vs serving | Stale ClickHouse points to ingest/source; fresh ClickHouse with stale Worker metadata points to snapshot/DO/R2/KV/cache; both fresh with stale UI points to webapp. |
| Terminal outcome wins | A retry followed by all required artifacts and completion is recovered degradation; an unresolved failure, abandoned checkpoint, or missing artifact family is an incident. |
| Schedule is not publication cadence | Full snapshots remain the rollback-safe baseline and can complete less frequently than their admission interval. After overlay activation, verify full cadence with `contract_rank_snapshot_refresh_completed` and visible freshness with the separate 90-second `contract_rank_overlay_refresh_completed`; configuration alone proves neither. |
| Shared warehouse | Production owns continuous 90-second Contract Rank overlays. Test defaults off through `TEST_CONTRACT_RANK_OVERLAY_ENABLED` and may run only during a bounded validation window before being restored to `false`. |
| Market state matters | Before 09:30 ET, current-day flow can legitimately be empty. Prefer the latest fully closed session for full audits and recheck live flow after 09:35 ET. |
| Market Structure is Worker-owned | Process-service prepares source tables only. A retired artifact-service `410` indicates stale process-service deployment when Worker output is current. |
| Product policy is explicit | Use `src/shared/option-product-capabilities.ts` and reason-specific omission counters; do not infer lateness from legacy aggregate-drop totals. |
| Metadata bootstrap is a separate contract | The base remains aggregate-derived, but shared preflight discovery adds bounded raw-only, missing-metadata, and registry-gap candidates. The coverage gate reads raw plus aggregate roots, and chain-only roots can enter the option-chain universe independently in `enforce`. Compare `root_capability_*` evidence before calling a gap upstream loss or adding an exclusion. |
| Vendors are references | Align ticker, session, spot time, expiry universe, scope, scale, and methodology. Vendor differences alone do not prove a TradingFlow defect. |

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the run revealed reusable procedure drift.
2. Promote durable changes to prerequisites, commands, routes, fields, thresholds, comparison rules, verification, or troubleshooting.
3. Keep transient incidents and unresolved next actions only in `Agent Handoff`; prune completed or obsolete items first.
4. Keep one-off counts, screenshots, raw logs, and current comparison values out of durable sections.
5. If nothing durable changed, state `Runbook maintenance: no change` in the final report.

Update this file when source names, monitors, endpoints, Worker flags,
ClickHouse schema, scripts, Rank routes/fields, vendor page contracts,
comparison rules, thresholds, or report shape drift. Do not update it for a
single incident or speculative product idea.

Keep the canonical file at `/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules/ops/process-service/datapipeline-error-check.md` and the process-service mirror at `ops/datapipeline-error-check.md` byte-identical. Validate with `diff -u` after either copy changes.


## Workspace Map

| Area | Repo / path | Use |
| --- | --- | --- |
| Runbooks | `/Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules` | Canonical file: `ops/process-service/datapipeline-error-check.md`; keep the process-service mirror byte-identical. |
| Process service | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2` | EC2 backend, ClickHouse scripts, process-service logs, symbol-meta, option-chain and Greeks checks. |
| Cloudflare Worker | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-cfworker-service` | Worker production config, Durable Objects, R2/KV bindings, Wrangler, UW ingest Worker code. |
| Webapp | `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack` | Contract-rank consumers, UI stale-data symptoms, mart diagnostics, and rendered Rank GEX/IV capture. |
| Vendor references | InsiderFinance and Barchart public pages | Same-ticker/session GEX and IV methodology comparison; never canonical pipeline truth. |

## Read-Only Boundary

Allowed by default:

- Better Stack telemetry and uptime reads.
- Unauthenticated Worker status probes, plus authenticated read-only `GET` checks when an existing caller-authorized edge-access token is available.
- Repo-local `npx wrangler` read-only commands such as deployments list, KV key read/list, and bounded tail when needed.
- Existing ClickHouse read-only scripts and bounded SELECT queries through repo `.env`.
- Small provider probes only when a data-quality symptom requires them.
- Read-only browser navigation, visible-text capture, and screenshots using an existing local TradingFlow test session and public vendor pages.

Requires explicit user authorization:

- `wrangler deploy`, `wrangler kv key put/delete`, Durable Object migrations, or production env changes.
- Force-refresh endpoints, backfills, ClickHouse mutations, queue purge/replay, monitor edits, or heartbeat-token changes.
- Any command that prints raw secrets, full env files, webhook URLs, or API keys.
- Product code changes or vendor/account mutations discovered during a rendered comparison.

## Pipeline Starting Point

| Symptom | Start | Then |
| --- | --- | --- |
| Missing or low row counts | Phase 1 writer ownership and Phase 5 data quality | Follow the first breached layer |
| Error spike | Phase 2 process-service and Phase 3 Worker logs | Correlate with source freshness before assigning impact |
| Stale UI or snapshot | Phase 4 serving and Phase 5 ClickHouse | Fresh source plus stale serving is not ingest loss |
| Wrong contract-rank values | Phases 5-7 | Check serving only after source/mart parity |
| GEX or IV vendor mismatch | Relevant Phase 8 branch | Align session and methodology before defect classification |

For every path, record the market state, compare against a healthy session when
appropriate, bound the affected rows/symbols/fields, and distinguish permanent
loss from delay, repairable derived data, or presentation-only drift.

## Tool and Source Resolution

### Better Stack

Resolve sources at runtime. Do not rely on old IDs or table names.

1. `mcp__betterstack__teams` if team scope is unclear.
2. `mcp__betterstack__sources`.
3. Match by source name:
   - `Process Service[Production]` for EC2 process-service logs and legacy writer evidence.
   - `cf-service` for Worker producer, Durable Object, snapshot refresh, and serving-layer logs.
4. `mcp__betterstack__query_help` for the resolved `source_id` and `source_type: logs`.
5. Use the returned table names in `mcp__betterstack__query`.

For process-service uptime, resolve by name rather than trusting old IDs:

- Push heartbeat: `Process Service SyncUw Ingestion Heartbeats` via Better Stack **heartbeats** (not the status-monitors list).
- Pull monitor: `ProcessServiceCanary` via Better Stack **monitors**.

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
- `bun scripts/check-greeks-parity.ts --date YYYY-MM-DD --phase b --strict`

Use bounded custom SQL only when scripts do not answer the question.

### Root Capability Preflight

Provider support is a capability vector, not one boolean. Run this preflight
premarket for known/recent roots and asynchronously when an unknown root first
appears. Never block raw ingestion or the trade hot path on remote probes.

| Provider | Positive evidence | Negative-result rule |
| --- | --- | --- |
| Unusual Whales | `optionable-tickers` for equities, date-aware `stock/{ticker}/option-chains`, `stock/{ticker}/info`, and `stock/{ticker}/quote` | `has_options=false`, info `404`, or an empty current chain does not reject index aliases or an expired/residual chain. Check the relevant trading date. |
| Massive | Reference ticker plus daily stock aggregates; canonical `I:{symbol}` index snapshot/aggregates; option snapshot | A stock reference `404` is expected for index roots. A chain without a positive index value is `chain_only`, not fully supported. Accept `DELAYED` when usable bars/values are present. |
| Longport | Equity/ETF/OTC quote, history, static info, and option expirations/contracts; verified canonical index quote | Error `301600 invalid symbol` is provider-specific lack of support, not proof the product is invalid. |
| Alpaca | Stock snapshots/history and option snapshots | Data credentials and trading-account credentials are separate. A trading `/assets` `401` does not invalidate successful market-data probes. Index option chains may exist without an Alpaca underlying quote. |

Classify evidence as follows:

- `supported`: product semantics allow the capability and at least one current,
  usable provider result supplies every required input.
- `chain_only`: contracts exist but no approved positive reference price exists.
- `temporarily_unavailable`: timeout, rate limit, authentication scope, stale-only
  result, or a current empty response contradicted by dated evidence.
- `unsupported_by_contract`: explicit payoff/lifecycle policy, never inferred from
  one provider failure.
- `unknown`: evidence is insufficient or conflicting.

Static policy in `option-product-capabilities.ts` owns payoff, lifecycle, and
aggregate eligibility. Dynamic evidence can enable a supported transport path,
but it cannot turn a binary/raw-only product into a vanilla aggregate. Persist
probe provider, capability, normalized ticker, result state, evidence timestamp,
market date, evidence scope (`market_date` or `current_snapshot`), and expiry/TTL
so current and historical support are not conflated.

Implementation paths:

- `src/root-capability-preflight/` owns candidate queries, provider adapters,
  date/root caching, evidence TTL, and assessment rules.
- `src/sync-symbol-meta/service.ts` consumes metadata-eligible assessments;
  `src/optionchain-data/root-capability-universe.ts` independently consumes
  chain-eligible assessments.
- `src/syncUwData/root-capability-trigger.ts` starts at most one asynchronous
  missing-price probe per date/root and never blocks normalization.
- `ROOT_CAPABILITY_PREFLIGHT_MODE` is `off`, `report_only`, or `enforce`.
  Production defaults to `report_only`; non-production defaults to `off`.
  Candidate lookback, cap, concurrency, cache TTL, and HTTP timeout are bounded
  by the `ROOT_CAPABILITY_*` variables documented in `symbol-meta.md`.

### Rendered Rank and Vendor References

Work from the webapp repository for browser comparisons:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
pnpm dev
```

Use `http://127.0.0.1:8000/app/rank/symbols` unless the dev server reports a
different port. Before interpreting product behavior, read:

- `knowledge/basic_concepts.md` if present; state explicitly when it is absent.
- `doc/domain-knowledge/rank/domain-invariants.md`
- `doc/domain-knowledge/rank/functionality.md`

Prefer an existing authenticated browser session. If authentication is needed,
use only the repo's documented local paid test account; do not create an
account, change billing, or expose credentials in the report.

Vendor routes:

- GEX: `https://www.insiderfinance.io/gamma-exposure/<TICKER>`
- Barchart IV list: `https://www.barchart.com/options/iv-rank-percentile/high?orderBy=optionsImpliedVolatilityRank1y&orderDir=desc`
- Barchart low-IV list: `https://www.barchart.com/options/iv-rank-percentile/low?orderBy=optionsImpliedVolatilityRank1y&orderDir=asc`
- Broad ETF fallback when the free list does not expose the ticker: `https://www.barchart.com/etfs-funds/quotes/<TICKER>/volatility-charts`

Capture only visibly rendered fields. Do not infer hidden/paywalled values, use
scraped mirrors, or recompute a vendor metric and label it as vendor evidence.

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
- Read `mcp__betterstack__query_help` before SQL.
- Query `level="error"` rows for the requested window.
- Group by `jobName`, severity tag (`[P0 Error]`, `[P1 Error]`), `_pattern`, and last seen.
- Check Uptime push heartbeat and pull canary by name.

If production logs contradict the current process-service repo, verify deployment freshness before debugging current source behavior. A green canary proves liveness, not revision freshness. Keep this check read-only unless the user separately authorizes a deploy:

```bash
gcloud compute ssh instance-20260416-070150 \
  --project=project-433c2ee5-662f-4dd7-bd9 \
  --zone=us-central1-f \
  --tunnel-through-iap \
  --quiet \
  --command="cd ~/tradingflow-process-service-ec2 && \
    git rev-parse HEAD && \
    git status -sb && \
    git ls-remote origin refs/heads/master"
```

Do not use the host's cached `origin/master` ref as remote truth before a fetch; `git ls-remote` is read-only and returns the current remote head. If source and compiled `dist/` both reflect an older revision, classify the mismatch as stale deployment rather than a current provider-chain defect.

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
| Snapshot artifact publication | `operation = 'contract_rank_snapshot_r2_artifact_published'`; require `compact`, `columnar_v1`, and `columnar_v2` before promotion |
| Snapshot incremental overlay | `operation IN ('contract_rank_overlay_refresh_completed', 'contract_rank_overlay_refresh_failed', 'contract_rank_overlay_refresh_skipped')`; require matching base content version/watermark, bounded rows/payload/latency, and roughly 90-second terminal cadence during RTH |
| Snapshot retry recovery | `operation IN ('contract_rank_refresh_dispatch_retry', 'contract_rank_snapshot_dispatch_retry')`; correlate with the terminal refresh result for the same window |
| Market Structure base snapshot | `operation IN ('market_structure_snapshot_refresh_completed', 'market_structure_snapshot_batch_retry', 'market_structure_snapshot_refresh_failed')`; require a terminal current-date completion and no unresolved build failure |
| Market Structure intraday overlay | `operation IN ('market_structure_intraday_refresh_completed', 'market_structure_intraday_refresh_failed')`; for completion verify `durationMs`, `queryDurationMs`, `sourceSymbolCount`, `matchedSymbolCount`, and `missingSymbolCount`. Scheduled HTTP `409` means no active current-date base snapshot exists yet, and the same cadence should also have dispatched an idempotent base-snapshot ensure. |

Interpret snapshot refresh health by `event`, `refreshStatus`, `effectiveDate`, `rowCount`, and `payloadBytes`, not by severity tag alone. Successful `contract_rank_snapshot_refresh_completed` rows should be informational (`P1`) after the cf-service severity fix; older logs or stale deploys may still show `[P0]`, but a completed `REBUILT` event with current date and growing row count is serving-health evidence, not an incident by itself. Repeated Durable Object CPU-limit resets during scheduled Contract Rank snapshot refreshes are serving-layer build failures when ClickHouse source and `mv_contract_rank_flow` stay current.

When the incremental overlay is deployed, keep its verdict separate from the full baseline. A healthy overlay is cumulative for exactly one full-snapshot `contentVersion` plus build-start change watermark, publishes immutable replacement rows, and resets when a new base promotes. `409 BASE_CHANGED` is a client reload signal, `204` is unchanged, and a P1 overlay failure is recovered degradation only while the last-good full snapshot remains available. Overlay membership comes from the current-date `AggregatedOptionTrades.updated_timestamp` window and complete replacement state comes from `mv_contract_rank_flow`; no auxiliary change table is required. Production scheduling is always enabled. Test scheduling defaults off through `TEST_CONTRACT_RANK_OVERLAY_ENABLED`; enable it only for a time-boxed validation deployment, then restore `false`. Verify the bounded query stays within the configured limits and investigate or introduce a narrow incremental index only if regular-session p95 latency exceeds five seconds or the scan competes with full rebuilds.

For Market Structure, capture `effective_date`, `structure_as_of`, `flow_as_of`, `intraday_gex_as_of`, row count, and intraday-GEX coverage before any recovery attempt. After a failed intraday query, artifact validation, or promotion, repeat the same read and require the previously promoted catalog to remain available with unchanged provenance. An empty intraday result must fail rather than publish an all-zero catalog; a partial result may promote only if unmatched catalog rows are preserved.

For retry events, inspect the terminal outcome rather than counting the retry as a failure. A retry followed by all three artifact-publication events and `contract_rank_snapshot_refresh_completed` is a recovered transient failure. A retry followed by `refresh_failed`, an abandoned checkpoint, or a missing artifact family remains an incident.

Queue diagnosis:

- If queue enqueue attempts greatly exceed drain attempts and ClickHouse has high `>10m` lag, treat this as queue throughput/backlog.
- Before tuning queue `max_batch_size` or concurrency, check whether each queue message is inserted separately. Combining messages into larger ClickHouse insert batches may be the real fix.
- If Worker ingest is disabled and no queue events exist, do not keep debugging queue mode as the active incident path.

Expected Market Structure cadence is preopen at 08:45 ET, final at 17:50 ET,
and every five minutes during 09:30-16:00 ET for the intraday overlay.

### Phase 4 - Worker Serving, Durable Object, R2, and KV Status

Use unauthenticated status probes first:

```bash
curl -sS "$WORKER_ORIGIN/canary" # plain-text Success
curl -sS "$WORKER_ORIGIN/api/v1/available-dates" | jq .
curl -sS "$WORKER_ORIGIN/api/v1/symbol-meta/latest/meta" | jq .
curl -sS "$WORKER_ORIGIN/uw-ingestion/status" # expected 404 after retirement
```

Contract Rank, Market Structure, and advertised snapshot-object reads require an existing caller-authorized edge-access JWT. Do not mint a token, reuse another user's token, or print it during an audit:

```bash
# EDGE_ACCESS_TOKEN must already be present in the shell.
curl -sS -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot/meta" | jq .
curl -sS -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  "$WORKER_ORIGIN/api/v1/contract-rank/snapshots/meta" | jq .
curl -sS --max-time 30 -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  "$WORKER_ORIGIN/api/v1/market-structure" \
  | jq '{
      schema_version,
      effective_date,
      structure_as_of,
      flow_as_of,
      intraday_gex_as_of,
      symbol_count:(.rows|length),
      intraday_gex_count:([.rows[] | select(.intraday_gex != null)] | length)
    }'
```

Without authorized edge access, record the protected routes as `401 AUTHENTICATION_REQUIRED`, mark direct payload/R2 verification blocked in `ToolAccess`, and use terminal Better Stack publication/build events plus ClickHouse freshness for the bounded serving verdict.

For R2-backed columnar contract-rank reads, inspect metadata first and prefer V2 when advertised:

```bash
curl -sS -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot/meta" \
  -o /tmp/contract-rank-meta.json
jq '{effectiveDate,rowCount,asOf,latestTradeTime,columnarV2ObjectPath,columnarObjectPath}' \
  /tmp/contract-rank-meta.json

# Use columnarV2ObjectPath from metadata when present; otherwise use columnarObjectPath.
OBJECT_PATH="$(jq -r '.columnarV2ObjectPath // .columnarObjectPath' /tmp/contract-rank-meta.json)"
curl -sS -L --compressed --max-time 30 \
  -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  -D /tmp/contract-rank-columns.headers \
  "$WORKER_ORIGIN$OBJECT_PATH" \
  -o /tmp/contract-rank-columns.json
sed -n '1,80p' /tmp/contract-rank-columns.headers
jq '{v,d,rc,cv,as,columnKeys:(.c|keys|length), sidLen:(.c.sid|length)}' /tmp/contract-rank-columns.json
```

Expected healthy evidence:

- When `columnarV2ObjectPath` is present, the advertised object response is `200` with a `columns-v2` `x-contract-rank-r2-key`, matching `x-contract-rank-content-version` and payload-digest headers, and immutable cache headers.
- When V2 is absent, the advertised V1 object is the compatibility fallback. The alias route `/api/v1/contract-rank/latest-snapshot?format=columns` can also be checked separately and should return a `307` to `columns-v1.json` followed by `200`.
- No `x-contract-rank-object-fallback` header appears.
- Parsed payload date and row count match latest snapshot metadata.
- `HEAD` can return `405`; use `GET` for this check.

For full snapshot size and date checks:

```bash
curl -sS -H "Authorization: Bearer $EDGE_ACCESS_TOKEN" \
  "$WORKER_ORIGIN/api/v1/contract-rank/snapshots/YYYY-MM-DD" \
  -o /tmp/contract-rank-snapshot.json
wc -c /tmp/contract-rank-snapshot.json
jq '{date: (.date // .effectiveDate // .d), generatedAt: (.generatedAt // .asOf // .as), rowCount: (.rowCount // .rc // (.data // .rows // .r // [] | length))}' /tmp/contract-rank-snapshot.json
```

Serving-layer interpretation:

| Symptom | Likely layer |
| --- | --- |
| `/canary` fails | Worker availability/deploy/routing. |
| Snapshot meta old, ClickHouse current | Snapshot cron, DO refresh, R2/KV write/read, payload-size guardrail, or cache invalidation. |
| Snapshot meta old, mart current, and DO CPU-limit reset logs | Contract Rank snapshot builder exceeded Worker/Durable Object CPU budget; fix or split the build path, not source ingest. |
| Market Structure endpoint old, option chain and contract coverage current | Worker `MarketStructureSnapshotDO` build, checkpoint retry, R2 candidate validation, or atomic promotion failed; inspect Worker operations and build status. Do not debug a process-service artifact upload. |
| Snapshot meta current, UI old | Webapp route/cache/client state. |
| `available-dates` missing latest date, ClickHouse has rows | Worker date-retention or refresh path. |
| Snapshot payload near Cloudflare limits | Size/serialization guardrail; check `payloadBytes` trend and KV object sizes. |
| Columnar metadata present but no R2 redirect/key | R2 upload, binding, object lookup, or fallback path. |
| Worker ingest disabled but snapshots current | Not necessarily unhealthy; active writer is elsewhere. |
| Repeatable DO memory reset at one checkpoint while ClickHouse is current | Snapshot-builder state retention; inspect writer buffers/object shape, not source ingest. |
| Outer 502 followed by `contract_rank_snapshot_build_abandoned` at `row_query` with no chunks | Pre-promotion builder interruption; the last-good R2 object can remain healthy. |
| R2 `10001`/timeout/reset | Transient only if a bounded retry publishes all required artifact families and completes promotion. |

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
| Rare/provider-supported roots exist only in raw flow | Aggregate-to-metadata bootstrap loop or missing product capability; inspect the shared universe boundary before adding symbol exceptions. |

Use bounded targeted SQL only after the scripts identify a failing dimension. Keep reusable SQL snippets in this runbook; do not paste credentials in output.

If the open window is healthy but the full-day `>10m` counter is nonzero, cluster
the tail by ET trade hour and UTC insert minute before assigning a cause:

```sql
WITH
  dateDiff(
    'second',
    toDateTime64(formatDateTime(time, '%F %T'), 3, 'America/New_York'),
    toDateTime64(updated_timestamp / 1000, 3, 'UTC')
  ) AS lag_sec,
  toDateTime64(updated_timestamp / 1000, 3, 'UTC') AS inserted_at_utc
SELECT
  toHour(time) AS trade_hour_et,
  toStartOfMinute(inserted_at_utc) AS insert_minute_utc,
  count() AS late_rows,
  sum(toUInt64(trade_count)) AS late_fills,
  quantile(0.5)(lag_sec) AS p50_lag_sec,
  max(lag_sec) AS max_lag_sec
FROM AggregatedOptionTrades
PREWHERE date = toDate('YYYY-MM-DD')
WHERE lag_sec > 600
GROUP BY trade_hour_et, insert_minute_utc
ORDER BY late_rows DESC
LIMIT 30
SETTINGS
  max_execution_time = 30,
  timeout_before_checking_execution_speed = 0,
  max_rows_to_read = 50000000,
  max_bytes_to_read = 10000000000,
  max_result_rows = 100;
```

A concentrated cross-symbol insertion burst with raw/aggregate parity proves
catch-up, not loss. Use `runtime_summary` pre-handler, handler-normalization,
reconnect, and buffer fields before distinguishing upstream replay from local
producer delay.

When raw rows and aggregate `sum(trade_count)` differ, group both sides by the
same date/hour/root, then classify each root in this order:

1. Explicit `product_raw_only` policy in `option-product-capabilities.ts`.
2. Same-day `SymbolMetaData` presence and positive reference price.
3. Provider daily-aggregate and option-snapshot coverage using a bounded probe.
4. Corporate/OTC symbol-change policy and canonical alias mapping.

If an active/provider-supported root has raw prints but no metadata or aggregate,
inspect `root_capability_preflight_completed`, per-root
`root_capability_assessed`, and `root_capability_option_chain_completed` along
with the raw-plus-aggregate coverage gate. In `report_only`, supported candidates
must not change either dynamic universe; in `enforce`, require the relevant
`metadataEligible` or `optionChainEligible` decision and a non-expired evidence
vector before diagnosing downstream processing.

### Phase 6 - Contract-Rank Correctness

Run this when contract-rank rows look stale, missing, or disagree with option-chain data.

Current mart: `mv_contract_rank_flow`.

Do not use retired `mv_contract_day_flow`.

Recommended checks:

1. Confirm `mv_contract_rank_flow` has target-date rows and expected active symbols.
2. Sample active symbols/contracts from the mart.
3. Compare contract identity (`option_symbol`, `put_call`, `strike`, `expiration_date`) against Massive live snapshot when timing is appropriate.
4. Compare mart structure fields to same-day/prior `OptionChainTable` with webapp diagnostics when Massive timing drift makes live snapshot ambiguous.

Freshness query. Keep output aliases distinct from source column names; ClickHouse alias substitution can otherwise rewrite the `date` filter before execution.

```sql
SELECT
  toString(date) AS mart_date,
  count() AS state_rows,
  uniqExact(option_symbol) AS contracts,
  toString(sumMerge(trade_count)) AS mart_trade_count,
  toString(maxMerge(latest_trade_time)) AS latest_trade_time
FROM mv_contract_rank_flow
WHERE date = 'YYYY-MM-DD'
GROUP BY date
FORMAT JSONEachRow
```

Compare with `AggregatedOptionTrades` for the same date:

```sql
SELECT
  toString(date) AS aggregate_date,
  count() AS agg_buckets,
  toString(sum(trade_count)) AS agg_trade_count,
  toString(max(time)) AS latest_agg_time
FROM AggregatedOptionTrades
WHERE date = 'YYYY-MM-DD'
GROUP BY date
FORMAT JSONEachRow
```

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
bun scripts/check-greeks-parity.ts --date "$DATE" --phase a --symbols SPY,NVDA,AAPL
# Add --strict only when the target date and live vendor snapshot timing are comparable.
bun scripts/check-greeks-parity.ts --date "$DATE" --phase b --strict
```

Active scope:

- Phase A: `OptionChainTable` vs Massive raw `implied_volatility`, Greeks, and close.
- Phase B: same-date `mv_contract_rank_flow` vs finalized `OptionChainTable`.
- Retired scope: the old Phase B query against `mv_contract_day_flow`. Do not use that table.

Phase A calls Massive's current live snapshot. Use strict mode only when the target date and vendor snapshot timing are comparable. A prior-session `OptionChainTable` row compared with a next-session live Massive quote will commonly fail close, IV, or delta thresholds because the market moved; that is temporal drift, not pipeline evidence. For a historical target, run Phase A as diagnostic evidence and use same-date Phase B plus hard contract identity checks for the correctness verdict.

For an independent bounded same-date cross-check, run the SQL below. Keep output aliases distinct from source column names; ClickHouse alias substitution can otherwise pass a finalized `String` or `Float32` back into a `*Merge` function.

```sql
WITH mart AS (
  SELECT
    option_symbol,
    argMaxMerge(iv) AS mart_iv,
    argMaxMerge(delta) AS mart_delta,
    sumMerge(trade_count) AS mart_trade_count,
    sumIfMerge(ask_premium)
      + sumIfMerge(bid_premium)
      + sumIfMerge(mid_premium) AS mart_premium
  FROM mv_contract_rank_flow
  WHERE date = toDate('YYYY-MM-DD')
  GROUP BY option_symbol
  HAVING mart_trade_count > 0
  ORDER BY mart_premium DESC, mart_trade_count DESC
  LIMIT 50
),
chain AS (
  SELECT
    option_symbol,
    argMax(iv, updated_timestamp) AS chain_iv,
    argMax(delta, updated_timestamp) AS chain_delta
  FROM OptionChainTable
  WHERE date = toDate('YYYY-MM-DD')
  GROUP BY option_symbol
)
SELECT
  count() AS compared,
  countIf(abs(mart_iv - chain_iv) > 0.08) AS iv_breaches,
  countIf(abs(mart_delta - chain_delta) > 0.12) AS delta_breaches,
  round(max(abs(mart_iv - chain_iv)), 6) AS max_iv_abs_diff,
  round(max(abs(mart_delta - chain_delta)), 6) AS max_delta_abs_diff
FROM mart
INNER JOIN chain USING (option_symbol)
FORMAT JSONEachRow
```

Expected non-bug differences:

- Fixed local 4.5% risk-free rate vs vendor curve.
- European Black-Scholes vs vendor model.
- Mid vs close vs last-trade price.
- Index underlyings, deep OTM, 0DTE, low liquidity, and snapshot timing.

Hard fail in strict mode is currently `>= 3` symbols flagged. One or two isolated symbols usually require alias/provider/input-price drilldown rather than a broad pipeline outage conclusion.

### Phase 8 - Rendered GEX and IV Vendor Comparison

Run this phase only for **GEX comparison**, **IV comparison**, or after the
pipeline portion of a **combined investigation**. Do not use a vendor page as a
substitute for Phases 1-7 when the symptom is stale or missing source data.

#### Phase 8 Preflight and Capture Discipline

1. Check webapp worktree state, read the Rank domain files, and verify `/app/rank/symbols` is reachable.
2. Use a clean or known signed-in test session. When prompted, use `active+clerk_test@example.com` with OTP `424242`.
3. Compare the same ticker and session; default to `SPY`. Record absolute timestamps, URLs, capture window, and browser in the report's Scope and ToolAccess sections.
4. During market hours, refresh both pages when captures are more than a few minutes apart.
5. Capture screenshots only when they materially support the conclusion; never paste raw browser state.

If a vendor blocks content, changes markup, omits a timestamp, or hides a field,
capture the visible fallback evidence and mark the field unavailable. Never
guess or silently substitute a computed value.

#### Phase 8A - GEX: TradingFlow vs InsiderFinance

Open `https://www.insiderfinance.io/gamma-exposure/<TICKER>` and capture:

| Area | InsiderFinance fields |
| --- | --- |
| Header | Ticker, spot, visible timestamp/session if present |
| Headline | Net GEX, ratio, Call GEX, Put GEX, Total/Gross GEX |
| Levels | Call Wall, Put Wall, Zero Gamma |
| Expiry scope | 0DTE, Weekly, Monthly, All Expirations values and labels |
| Heatmap/profile | Visible expiries, strike range/count, graph/table and near/all controls |
| Signals | Volatility, magnet, squeeze, or other narrative cards; record wording without endorsing it |

Then open the same ticker in TradingFlow Rank, open the symbol drawer, and use
the **GEX** tab. Capture:

| Area | TradingFlow fields |
| --- | --- |
| Session | Session date, last-trade timestamp, row spot, structural reference spot, structure built/resolved time |
| Scope | All, 0DTE, Weekly, Monthly labels and percentages |
| Headline | Net/Gross GEX, regime, ratio, Call/Put GEX, total OI, strike and expiry counts |
| Levels | Zero-Gamma Flip, Gamma Magnet, Call Wall, Put Wall, 0DTE Flip if shown |
| Level Map | Above/At/Below nodes, role badges, dollar/percent/ATR distances, gross-GEX share, chart-layer toggles |
| Expiry/heatmap/profile | Bucket denominators, net/gross values, expiry counts, strike range, chart/table and net/call-put controls |
| Extras | 0DTE Focus, GEX Ladder, Charm/Vanna section if present |

Populate the report's GEX matrix with the comparable headline values. Keep
session/spot provenance, scope, and strike/expiry breadth in the assessment.

Classify each material difference as:

- **Freshness/source:** different spot, session, chain roll, or page update time.
- **Scope:** different expiry universe, bucket boundaries, near-spot filter, or denominator.
- **Calculation semantics:** full-chain versus filtered inputs, wall definition, or flip methodology.
- **Presentation/UX:** values broadly align but one product explains or exposes them better.
- **Vendor/access limitation:** a field is hidden, blocked, or no longer rendered.
- **Product defect candidate:** same-session inputs and scope align, but TradingFlow is internally inconsistent or contradicted by its governed source.

Do not call a wall, flip, or total discrepancy a bug until spot timing, chain
roll, expiry buckets, scope denominator, and formula semantics have been ruled
out. In particular, a Friday completed-session snapshot containing 0DTE exposure
is not directly comparable with a Saturday live chain whose first expiry is the
following week.

#### Phase 8B - IV Family: TradingFlow vs Barchart

Use these definitions before judging differences:

| Metric | TradingFlow contract | Barchart visible/help contract | Comparison rule |
| --- | --- | --- | --- |
| IV30 / implied volatility | Qualified two-sided ATM call+put IV by expiry, interpolated to 30 DTE | Average IV of the nearest monthly options contract 30 days out or more | Expect close direction, not exact parity |
| IV Rank | Current IV30 within the high/low range of a full clean 252-observation ATM 30D window | Current ATM average IV relative to the prior one-year high/low | Normalize fraction versus percent display before comparing |
| IV Percentile | Share of clean prior observations below current IV30, available only with the full clean window | Percentage of prior-year days with IV below current ATM IV | Compare concept and rough value; day inclusion can differ |
| Historical volatility | TradingFlow RV20/RV30 | Barchart visible historical-volatility window | Match window and close convention before numeric parity claims |

Barchart says its public IV Rank/Percentile page begins updating for a new day
around 09:50 ET, options data is delayed roughly 25-30 minutes, and the list
updates during the session. Capture the visible timestamp or session every run.

Start with the high- or low-volatility list and select the correct Stocks, ETFs,
or Indices scope. If the free list does not expose a broad ETF such as `SPY`, use
the documented symbol-page fallback:

```text
https://www.barchart.com/etfs-funds/quotes/<TICKER>/volatility-charts
```

Capture only visible fields:

| Area | Barchart fields |
| --- | --- |
| Header/session | Page date, visible update/session, delay note, asset type |
| Filters/view | High/Low mode, asset scope, active sort and view |
| Quote | Symbol, last/close, change, trade time, post-market quote if shown |
| IV metrics | Implied Volatility, IV Rank, IV Percentile |
| Adjacent context | Historical volatility window, IV/HV, option volume, OI, earnings if visible |
| Access limits | Login wall, truncated free list, missing columns, custom-view requirement |

In TradingFlow, filter Symbols to the same ticker. Capture the current row fields
when present: `IV30`, `RV20`, `RV30`, `IV Rank`, `IV30-RV20`, `IV Percentile`,
`25Δ Skew`, `Term Slope`, and `25Δ Bfly`. Do not require a separate `ATM IV`
column unless the current UI visibly exposes one. Then open the **Vol** drawer
tab and capture:

- Session/vol date and spot.
- IV30, RV20, RV30, and spread.
- IV Rank, label, tooltip/formula, and IV Percentile.
- 25Δ skew tenor/interpolation label, term slope, and butterfly when visible.
- Volatility-surface measured/interpolated/unsupported coverage when the symptom involves surface quality.
- Exact unavailable reason when Rank or Percentile is absent.

Populate the report's IV matrix with the comparable values. Put quote/session
timing, scale normalization, historical-window availability, and adjacent skew,
term, or earnings context in the assessment.

Classify IV discrepancies as:

| Bucket | How to decide | Typical action |
| --- | --- | --- |
| Freshness/source | Session, spot, quote, or visible update time differs | Refresh and align captures; avoid code changes |
| Methodology | Both values are plausible under interpolated-30D versus nearest-monthly construction | Document the method boundary |
| Scale/format | Fraction versus percent or rounding differs | Normalize before judging |
| Unavailable-by-contract | TradingFlow lacks the full clean 252-observation window | Keep unavailable and explain it |
| Data-pipeline gap | The clean window should exist but governed rows are missing or stale | Trace `SymbolVolDaily`, metadata, and producer evidence |
| Presentation/UX | Definition, session, update cadence, or filter scope is unclear | Recommend a specific label, tooltip, or timestamp |
| Vendor/access limitation | Row, timestamp, or fields are hidden | Report the limit and compare visible fields only |

If the Rank row and Vol drawer show different values, first check whether one is
a selected-session scalar and the other an explicitly interpolated tenor. Treat
unclear labeling as a presentation issue until the governed reader path proves
an internal calculation mismatch.

#### Copy Opportunities and Guardrails

Recommend only patterns supported by current evidence: clearer as-of labels,
scope labels, concise metric summaries, formulas/tooltips, or an expanded view
when the existing interaction is insufficient. Do not duplicate an equally clear
TradingFlow control, weaken the paid-access contract, or copy deterministic
support/resistance, dealer-intent, squeeze-probability, or directional-IV claims
without a separately governed product contract.

Common browser/vendor blockers:

| Symptom | Action |
| --- | --- |
| TradingFlow redirects to login or hides the drawer | Use the local paid test session and verify the premium gate; do not alter billing |
| Local page does not load | Check the dev server, reported port, terminal, and browser console/network |
| InsiderFinance layout or fields changed | Capture visible fallback evidence; do not infer hidden values |
| Barchart list omits the ticker | Select the correct asset scope, try High/Low mode, then use the official symbol-page fallback |
| Spot differs materially | Refresh both pages and align regular/live/post-market timestamps before comparing math |
| TradingFlow Rank/Percentile unavailable | Verify the clean 252-observation window before calling it a regression |
| Vendor data is paywalled or truncated | Record the access limitation and stop that side of the comparison |

### Phase 9 - Correlate and Classify

Classify the incident by the narrowest failing layer:

| Layer | Evidence |
| --- | --- |
| Upstream provider | Broad provider errors across many symbols plus matching service logs; do not infer from isolated aliases. |
| Producer ingest | ClickHouse stale/thin plus Better Stack writer errors, buffer drops, queue backlog, or heartbeat failures. |
| Metadata enrichment | Raw rows exist but market cap, earnings, DEI, alias, or reference fields fail coverage thresholds. |
| Derived mart | Source rows healthy but `mv_contract_rank_flow` wrong or stale. |
| Worker serving | ClickHouse current but Worker snapshot/meta/dates stale or payload too large. |
| Webapp | Worker and ClickHouse current but local/prod UI stale. |
| Vendor/session or methodology | TradingFlow is internally consistent, but external values use a different session, expiry universe, price timestamp, or formula. |
| Rendered product defect candidate | Pipeline and serving are current, same-session inputs align, and the governed TradingFlow source contradicts the rendered value. |

Impact radius language:

- **Rows affected:** target row count vs baseline average and affected hours.
- **Symbols affected:** all symbols, symbol families, aliases, indexes, or isolated tickers.
- **Fields affected:** raw trade presence, aggregate rows, metadata fields, Greeks, contract identity, snapshot payload, or UI cache.
- **Data-loss risk:** permanent missing raw/aggregate writes, delayed/backlog catch-up, derived-field repairable by backfill, or serving-only staleness.
- **Rendered comparison:** ticker/session alignment, vendor access limits, discrepancy bucket, and whether the issue is numeric correctness or presentation only.

## Report Template

Every report must put `Highlights` immediately after the title. Do not place a
preamble, scope, tool-access block, or methodology note before it. Keep it to
three to six decision-focused bullets and move supporting metrics into
`Detailed Evidence`. Omit detailed subsections for modes that were not run.

```markdown
# Data quality check - {mode/window/date}

## Highlights

- **Verdict:** Healthy / Degraded / Down / Methodology or session mismatch / Inconclusive
- **Primary finding:** One sentence with the most important evidence-backed conclusion.
- **Failing layer or discrepancy:** Narrowest proven layer, or `None proven`.
- **Impact / data-loss risk:** User-visible impact and None seen / Delayed catch-up / Repairable derived fields / Potential permanent raw-row gap.
- **Next action:** The single highest-value bounded action and owner/authorization gate.
- **Confidence / blocker:** Confidence level and the material access or evidence limitation, if any.

## Detailed Evidence

### Scope

- Mode: Pipeline audit / GEX comparison / IV comparison / Combined
- Window:
- Trading date:
- Market state:
- Baseline date:
- Ticker and capture window, if applicable:
- User symptom:

### ToolAccess

- betterstack: connected|blocked|skipped; source=<resolved name/id>; blocker=<none or error>
- uptime: connected|blocked|skipped; monitor=<name/id>; blocker=<none or error>
- cloudflare: connected|blocked|skipped; path=<http|wrangler>; blocker=<none or error>
- clickhouse: connected|blocked|skipped; script_or_query=<name>; blocker=<none or error>
- massive/alpaca/longport: connected|blocked|skipped; path=<script/sdk>; blocker=<none or error>
- browser/vendors: connected|blocked|skipped; urls=<TradingFlow/vendor>; blocker=<none or error>

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
- `/api/v1/market-structure` date/status:
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

### Rendered GEX comparison (optional)

| Field | TradingFlow | InsiderFinance | Assessment |
| --- | --- | --- | --- |
| Session / spot | | | |
| Net / Gross GEX | | | |
| Call / Put GEX | | | |
| Call Wall / Put Wall / Flip | | | |
| 0DTE / Weekly / Monthly | | | |
| Strike / expiry breadth | | | |

- Discrepancy bucket:
- Screenshot evidence:

### Rendered IV comparison (optional)

| Field | TradingFlow | Barchart | Assessment |
| --- | --- | --- | --- |
| Session / spot | | | |
| IV30 / Implied Volatility | | | |
| RV20/RV30 / Historical Volatility | | | |
| IV Rank | | | |
| IV Percentile | | | |
| Historical-window availability | | | |

- Discrepancy bucket:
- Screenshot evidence:

### Product patterns (optional)

- What to copy:
- What not to copy yet:
- Vendor/access caveats:

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
- Canonical/mirror validation:
```

## Canonical Coverage Map

Where to go for each need:

| Need | Section |
| --- | --- |
| Process-service error patterns, heartbeat checks, known noise | Phase 2 |
| Active producer logs, write-buffer/drop/queue predicates, queue diagnosis | Phases 1 and 3 |
| Worker public endpoints, Durable Object/KV size checks, snapshot interpretation | Phase 4 |
| ClickHouse integrity, latency, contract-rank checks, Greeks parity thresholds | Phases 5, 6, and 7 |
| TradingFlow GEX vs InsiderFinance and IV vs Barchart capture, comparison, and UX guardrails | Phase 8 |
| Cross-layer incident and rendered-discrepancy classification | Phase 9 |

## Documentation Verification

For maintenance-only changes, do not run production checks merely to populate
evidence. Re-read the changed sections, then validate:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2
git diff --check
test -f ops/datapipeline-error-check.md
test ! -e ops/check-data-quality.md
test -f /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/rank/domain-invariants.md
test -f /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/doc/domain-knowledge/rank/functionality.md
diff -u \
  /Users/evansmacbookpro/Desktop/Projects/awesome-ai-coding-rules/ops/process-service/datapipeline-error-check.md \
  ops/datapipeline-error-check.md
```

Expect no output from `diff -u`.
