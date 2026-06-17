---
name: check-durability-object-status
description: Production health/status runbook for the TradingFlow cf-service Cloudflare Worker Durable Objects (ContractRankSnapshotDO, UwIngestionDO, CFWorkerService) and the KV reference-data layer. Verifies the DO/KV data model is populated, the public API returns the expected shape, the served data is fresh (not stale) vs the latest trading session, and the stored/served data size stays within Cloudflare limits. Checks via three channels — public HTTP (curl), the Cloudflare wrangler CLI, and the Better Stack MCP (log cross-verify). Use when the user asks to check DO status/health, whether contract-rank / option-flow / available-dates / symbol-meta endpoints are up, whether the snapshot is stale, whether ingestion is live, whether DO/KV storage is near its limit, "is the worker serving current data", post-deploy smoke, or empty-cache / MISS / 503 reports. Serving-layer companion to data-quality.md (ClickHouse source) and betterstack-error-healing.md (producer logs).
---

# CF-Service Durable Object & API Status Check (TradingFlow) — Production

Runbook for an AI agent to assess the **production serving layer** of `tradingflow-cfworker-service`: the three Durable Objects and the KV reference-data layer. It answers four questions:

1. **Populated?** Does the DO/KV data model actually hold data (non-empty, right version)?
2. **API correct?** Do the public endpoints return the expected shape and HTTP status (not `MISS` / `503` / `404`)?
3. **Fresh?** Is the served data up to date with the current trading session, or is it stale (refresh/ingest stalled)?
4. **Within size limits?** Are the DO storage, KV values, and served payloads safely under Cloudflare's limits (so the object never bloats → resets)?

> **Scope: production only.** This runbook checks the production Worker `cfworker-service`. (test/local are out of scope — note that in non-prod the scheduled contract-rank rebuild and UW ingest are intentionally off, so "freshness" there is meaningless.)

This is the **serving-layer** companion to:
- `ops/cf-service/data-quality.md` — audits the **ClickHouse source** (trades/metadata/contract-rank/Greeks). When a freshness check here fails, the source may still be healthy (a refresh/cron problem) — cross-check it before blaming upstream.
- `ops/cf-service/betterstack-error-healing.md` — the **process-service/EC2 producer** Better Stack source. This runbook uses the **separate cf-worker** Better Stack source (see §5).

> **Read-only.** Per the cf-service deploy rules, **do not mutate production**. Every check below is a `GET` / `wrangler tail|kv get|deployments list` / Better Stack query. The only write is the sanctioned `POST .../refresh` escape hatch (Remediation). Never `wrangler deploy`, `wrangler kv key put/delete`, or curl a mutation — those are the deploy pipeline, not a status check.

---

## Recommended Invocation

Use `/goal` for production status checks:

- Objective: determine whether the production cf-service Worker is serving populated, correctly shaped, fresh, and size-safe DO/KV data.
- Success criteria: steps 0-6 are completed or explicitly blocked, public HTTP and read-only `wrangler` checks are separated from Better Stack evidence, and the report template has a verdict for each serving surface.
- Stop condition: serving-layer health is proven, source-data failure is handed off to `data-quality.md`, or a production-safe remediation decision is required.

## Agent Handoff

Last updated: 2026-06-17

### Look First
- [ ] Investigate the production `/uw-ingestion/status` strict-live path: during the 2026-06-17 10:37-10:43 ET run it timed out at 20s, 60s, and 15s while `/canary`, contract-rank, available-dates, and symbol-meta were healthy; Wrangler tail showed the stateless `/uw-ingestion/status` fetch canceled client-side without a corresponding `UwIngestionDO` response, and Better Stack showed no UW interval report after the 09:30 ET `streaming_resumed` event.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the status check exposed a reusable lesson for this runbook.
2. Promote durable lessons into inspection channels, endpoint expectations, thresholds, remediation, or report templates.
3. Keep transient next-run state in `Agent Handoff`; keep incident-specific evidence in the final report or external incident record.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when Worker routes, compact payload shape, KV keys, DO names, Cloudflare limits, `wrangler` commands, Better Stack source behavior, or safe remediation rules drift. Do not update it for one-off payload sizes, current incident counts, raw logs, or completed production checks.

## Local workspace project map

```bash
WORKSPACE=/Users/evansmacbookpro/Desktop/Projects
```

| Role | Project |
| --- | --- |
| Runbook source | `$WORKSPACE/awesome-ai-coding-rules` |
| Worker code: the 3 DOs, reference-data KV, routes, telemetry; **run `wrangler` from here** | `$WORKSPACE/tradingflow-cfworker-service` |
| ClickHouse source + audit scripts (the upstream this layer serves) | `$WORKSPACE/tradingflow-process-service-ec2` |
| Webapp consumers of contract-rank / available-dates / symbol-meta | `$WORKSPACE/tradingflow-webapp-fullstack` |

## Production target (constants)

| Thing | Value |
| --- | --- |
| Worker script | `cfworker-service` |
| Worker origin (curl these) | `https://cfworker-service.engineering-601.workers.dev` |
| `REFDATA_KV` namespace id (prod) | `be4ecc1147134239b54a01b9a6e593f1` |
| KV keys | `refdata:available-dates`, `refdata:symbol-meta:latest` |
| DOs (storage backend) | `ContractRankSnapshot-v2` (SQLite), `UwIngestionDO` (SQLite), `CFWorkerService` (key-value) |

```bash
WORKER_ORIGIN=https://cfworker-service.engineering-601.workers.dev
KV_ID=be4ecc1147134239b54a01b9a6e593f1
```

`api.tradingflow.com` is the *API host the worker calls for token verification* — **not** the worker's own URL; do not curl it for these checks.

## Three inspection channels

| Channel | Use for | Notes |
| --- | --- | --- |
| **Public HTTP (`curl`)** | DO/API populated, shape, freshness, served bytes | No auth on status/meta/snapshot GETs |
| **wrangler CLI** | live logs (`tail`), KV reads + sizes (`kv key get`), deployed version (`deployments list`) | Run from `tradingflow-cfworker-service` with `--env production`; needs Cloudflare auth (`wrangler login` or `CLOUDFLARE_API_TOKEN`). **Read-only only.** |
| **Better Stack MCP** | historical cross-verify: refresh success/failure, `payloadBytes` trend, ingest health | MCP server `user-betterstack`; resolve the **cf-worker** source at runtime (§5) |

## When to run

- After a cf-service production deploy (`wrangler deploy src/index --env production`) — smoke the serving layer.
- On a user report of: empty/`MISS` contract-rank, "ranking is yesterday's", available-dates not flipping to the new day in the morning, option-flow stream dead, or a Better Stack/Discord `contract_rank_snapshot_refresh_failed` / `uw_websocket_health` alert.
- Morning (ET) **new-trading-day transition** sanity — `available-dates` `effective` flipping to today is time-critical (worker recomputes ~10 min; webapp TTL 5 min).
- Periodic smoke during market hours (live `lastTradeAtMs`, fresh `asOf`, payload size flat).
- Storage-growth review (DO/KV size vs Cloudflare limits — §6).

## Prerequisites

| Item | Where / how |
| --- | --- |
| `curl` + `jq` | local |
| `wrangler` + Cloudflare auth | Use the repo-local CLI from `tradingflow-cfworker-service` (`npx wrangler ...`) so the project `wrangler` version is used; `wrangler login` (or `CLOUDFLARE_API_TOKEN`) |
| Better Stack MCP (`user-betterstack`) | optional but recommended for cross-verify (§5) |
| (optional) ClickHouse source check | `ops/cf-service/data-quality.md` |

Status/meta/snapshot `GET`s need no auth (`/uw-ingestion/status`, `/api/v1/contract-rank/*`, `/api/v1/available-dates`, `/api/v1/symbol-meta/latest*`). The retired client stream (`/api/v1/flow-stream`) returns 404; live fanout is the authenticated WebSocket upgrade on `/`.

---

## The three Durable Objects + KV (what serves what)

| Surface | Binding / name | Backend | Serves | Source of truth | Freshness driver |
| --- | --- | --- | --- | --- | --- |
| **ContractRankSnapshotDO** | `CONTRACT_RANK_SNAPSHOT` / `ContractRankSnapshot-v2` | SQLite | contract-rank compact snapshot + per-date + GEX regime | ClickHouse `mv_contract_rank_flow` | 5-min cron rebuild |
| **UwIngestionDO** | `UW_INGESTION` | SQLite | live UW ingest → write buffer → ClickHouse drain; status | Unusual Whales websocket | live socket + DO alarm |
| **CFWorkerService** | `CFWORKER_SERVICE` | key-value | client WebSocket fanout; per-minute cron orchestrator | replay/live fanout | per-minute cron |
| Reference-data (KV) | `REFDATA_KV` | Workers KV | `available-dates`, `symbol-meta/latest` | ClickHouse | cron: available-dates ~10 min, symbol-meta ~60 min |

Checklist (copy and track):

- [ ] 0. Liveness: `/canary` → `Success`; `wrangler deployments list` shows the expected build
- [ ] 1. ContractRankSnapshotDO — populated, API shape OK, `asOf`/`effectiveDate` fresh
- [ ] 2. Reference-data KV — `available-dates.effective` == today; `symbol-meta` `asOf` is last sync
- [ ] 3. UwIngestionDO — `connected`, `lastTradeAtMs` live, drains succeeding, meta loaded
- [ ] 4. Cross-check `effectiveDate` / available-dates vs ClickHouse latest date
- [ ] 5. Better Stack cross-verify (refresh + ingest events, `payloadBytes` trend)
- [ ] 6. Data size vs Cloudflare limits (DO storage, KV values, served payload, write buffer)
- [ ] 7. Verdict + remediation + report

---

### 0. Liveness

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$WORKER_ORIGIN/canary"   # expect 200
curl -s "$WORKER_ORIGIN/canary"                                    # expect: Success

# What's actually deployed right now (read-only):
cd "$WORKSPACE/tradingflow-cfworker-service" && npx wrangler deployments list --env production | head
```

Non-200 canary → the Worker script is down/misrouted; stop and escalate (Cloudflare dashboard / recent deploy). A surprising `deployments list` head (old version) explains stale behavior — a fix may be committed but not deployed.

---

### 1. ContractRankSnapshotDO — snapshot served to the webapp

**Endpoints** (Worker forwards `/api/v1/contract-rank/*` to the DO):

| Method + path | Returns | Cache |
| --- | --- | --- |
| `GET /api/v1/contract-rank/latest-snapshot` | compact payload `{v,d,ad,rc,cv,as,u,up,av,g,r}` | `private, max-age=15` |
| `GET /api/v1/contract-rank/latest-snapshot/meta` | `{effectiveDate, availableTradingDates, rowCount, contentVersion, asOf, metricVersion, dataHorizon, dataCaveat}` | — |
| `GET /api/v1/contract-rank/snapshots/meta` | `{effectiveDate, availableTradingDates, retainedSnapshotDates, retainedSessionCount, snapshots:[meta…]}` | — |
| `GET /api/v1/contract-rank/snapshots/<YYYY-MM-DD>` | compact payload for that date | — |
| `GET /api/v1/contract-rank/gex-regime` | `{effectiveDate, asOf, gexRegimeBySymbol}` | `private, max-age=60` |
| `POST /api/v1/contract-rank/latest-snapshot/refresh[?force=true]` | `{status, effectiveDate, rowCount, …}` | **write — Remediation only** |

Compact payload keys: `v`=version (`contract_rank_snapshot_compact_v9`), `d`=effectiveDate, `ad`=availableTradingDates, `rc`=rowCount, `cv`=contentVersion, `as`=asOf (ISO build time), `r`=rows. (The public meta endpoints intentionally omit `payloadBytes`/`chunkCount`; get those from Better Stack — §5/§6.)

```bash
META=$(curl -s "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot/meta")
echo "$META" | jq '{effectiveDate, rowCount, asOf, contentVersion}'
```

| Question | Pass | Fail / red flag |
| --- | --- | --- |
| **Populated?** | `rowCount` > 0 (full session ≈ thousands of contracts) | `{"status":"MISS"}` + HTTP 404, or `rowCount: 0` |
| **API correct?** | HTTP 200; payload `v == contract_rank_snapshot_compact_v9`; `r` length == `rc` | 404/503, wrong/old `v`, `rc` ≠ `len(r)` |
| **Fresh (date)?** | `effectiveDate` == latest eligible trading date (step 4) | `effectiveDate` behind the latest session well into RTH |
| **Fresh (build)?** | market hours: `asOf` within ~10 min (refresh runs every 5) | `asOf` older than ~15 min during RTH → refresh stalled |

```bash
# asOf age (minutes)
AS_OF=$(echo "$META" | jq -r '.asOf')
echo "asOf age: $(( ( $(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%S" "${AS_OF%.*}" +%s 2>/dev/null || echo 0) ) / 60 )) min"

# Full payload parses + row count is internally consistent (also yields served bytes — §6)
curl -s "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot" \
  | jq '{v, d, asOf:.as, rc, rows:(.r|length), match:(.rc == (.r|length))}'
```

Interpreting failures:
- **`MISS` / 404** — DO storage empty: post-deploy before first rebuild, or a prior storage reset (the `-v2` instance exists because the original bloated its SQLite store with orphaned chunks — see §6). Remedy: `force` refresh, or wait for the next cron tick during market hours.
- **`rowCount: 0`, date correct** — source returned zero current-day rows (early bootstrap) and fell back; check ClickHouse `mv_contract_rank_flow` for the date.
- **Old `effectiveDate` during RTH** — scheduled rebuild not advancing: check Better Stack `contract_rank_snapshot_refresh_failed` (§5) and whether the DO is reset-looping (§6).

---

### 2. Reference-data KV — available-dates & symbol-meta

| Method + path | Returns | Cache |
| --- | --- | --- |
| `GET /api/v1/available-dates` | `{source, latestDate, effective, count, asOf, dates:[…desc]}` | `max-age=300` |
| `GET /api/v1/symbol-meta/latest/meta` | `{date, rowCount, asOf}` | `max-age=3600` |
| `GET /api/v1/symbol-meta/latest` | full symbol-meta blob | `max-age=3600` |

`503 "Reference data unavailable"` → `REFDATA_KV` unbound or cold-miss populate failed.

**`latestDate` vs `effective` (important):** `dates` is descending, so `latestDate == dates[0]` is the newest raw date in `AggregatedOptionTrades` — which on a live day already includes **today's in-progress (premarket) rows**. `effective` is what the app serves: `resolveEffectiveDate` **hides today until 09:30 ET**. **Compare `effective`, not `latestDate`, for the morning flip.**

```bash
# via HTTP
curl -s "$WORKER_ORIGIN/api/v1/available-dates" | jq '{latestDate, effective, count, asOf, head:(.dates[0:3])}'
curl -s "$WORKER_ORIGIN/api/v1/symbol-meta/latest/meta" | jq '{date, rowCount, asOf}'

# via wrangler — read the raw KV value directly (also measures size — §6)
cd "$WORKSPACE/tradingflow-cfworker-service"
npx wrangler kv key get "refdata:available-dates"  --namespace-id "$KV_ID" | jq '{effective, latestDate, count}'
npx wrangler kv key list --namespace-id "$KV_ID" | jq -r '.[].name'   # enumerate refdata keys
```

| Question | Pass | Fail / red flag |
| --- | --- | --- |
| Populated? | `dates` non-empty (`count`>0); symbol-meta `rowCount` in the thousands | empty `dates`, `503`, `rowCount` 0/tiny |
| API correct? | HTTP 200, `{…,effective,dates}` / `{date,rowCount,asOf}` | 503/404 |
| **Fresh (time-critical)** | at/after 09:30 ET on a session day: `effective` == today | `effective` still **yesterday** well into RTH → cron/refresh stalled (or source has no today rows — step 4) |

> **available-dates `effective` is the most time-sensitive freshness signal here.** It must become today in the morning (worker recomputes ~10 min; webapp TTL 5 min). If it lags the open session, contract-rank `effectiveDate` lags too and the whole webapp shows yesterday. Pre-09:30 ET, `effective`=yesterday is **correct** even when `latestDate` already shows today (premarket). Confirm against ClickHouse (step 4) before blaming the cron.

---

### 3. UwIngestionDO — live ingest health

```bash
S=$(curl -s "$WORKER_ORIGIN/uw-ingestion/status")
echo "$S" | jq '{
  enabled, environment, upstreamAllowed, connected, upstreamReadyState,
  lastTradeAtMs: .ingestionTelemetry.lastTradeAtMs,
  messagesReceived: .ingestionTelemetry.messagesReceived,
  tradesParsed: .ingestionTelemetry.tradesParsed,
  awaitingFirstTrade: .ingestionTelemetry.awaitingFirstTradeAfterJoin,
  writeBufferDepth, writeBufferRawRows, bucketCount,
  metaSnapshotDate, symbolMetaCount, dailyReferenceStateUsable, lastMetadataFetchOkAtMs,
  lastDrainFinishedAtMs, lastDrainTrigger, drainInFlight, liveFanoutEnabled
}'
echo "$S" | jq '.lastIntervalReport // "no interval report yet"'
```

**During market hours — healthy:**

| Field | Healthy | Investigate |
| --- | --- | --- |
| `enabled` / `upstreamAllowed` | `true` | `false` = ingest off (check `UW_ENABLED`) |
| `connected` / `upstreamReadyState` | `true` / `OPEN` | `false` / non-OPEN during RTH → zombie UW socket (one ws per API token) → reconnect |
| `ingestionTelemetry.lastTradeAtMs` | within seconds of now | `null` or minutes old during RTH → stream dead |
| `awaitingFirstTradeAfterJoin` | `false` | `true` > 60s after join → `first_option_trades_after_restart_missing` (P0) |
| `tradesParsed` / `messagesReceived` | climbing | flat during RTH → not receiving |
| `dailyReferenceStateUsable` | `true` | `false` blocks connect (symbol-meta snapshot unusable) |
| `metaSnapshotDate` / `symbolMetaCount` | today (or last weekday) / thousands | old date / 0 → meta not loaded → market_cap/DEI zeros downstream |
| `lastDrainFinishedAtMs` | recent | stale + rising `writeBufferDepth` → drain stalled |
| `writeBufferDepth` / `writeBufferRawRows` | low and draining (caps 6000 / 20000) | near/at cap → drops; **0 before market activity is normal** |

`lastIntervalReport` (latest `uw_websocket_health` counters): `trades_in`, `normalize_ok`/`normalize_fail`, `ch_drain_ok`/`ch_drain_fail`, `ch_raw_rows`/`ch_agg_rows`, `write_buffer_high_drops`/`low_drops`, `max_write_buffer_depth`, `errors_total`. Healthy during RTH: `trades_in > 0`, `ch_drain_ok > 0`, `normalize_fail`/`errors_total` near zero.

Watch the stream live (cron nudges, drains, errors in real time):

```bash
cd "$WORKSPACE/tradingflow-cfworker-service"
npx wrangler tail --env production --format json \
  | jq -rc 'select(.logs != null) | .logs[].message? // .'      # Ctrl-C to stop
```

If `/uw-ingestion/status` times out but other Worker routes are healthy, run a bounded `npx wrangler tail --env production --format json` while issuing one status request. If the tail only shows the stateless fetch canceled and no `UwIngestionDO` entry, treat the live status/control path as degraded and cross-check Better Stack for the latest UW lifecycle and interval-report events before attempting any remediation.

For a stuck stream see `tradingflow-cfworker-service/wiki/runbook/human/restore-streaming.md` (Unusual Whales allows one websocket per API token; a zombie session starves trades until reconnect).

---

### 4. Cross-check freshness against the ClickHouse source

Before declaring the DO/KV "stale", confirm the source has newer data. If ClickHouse has no rows for today yet (early morning, or an upstream gap), the DO is *correct* to serve yesterday.

- DO/KV `effectiveDate` / available-dates `effective` should equal the latest full (post-09:30-ET) trading date in `AggregatedOptionTrades` / `mv_contract_rank_flow`.
- Use `ops/cf-service/data-quality.md` → "Resolve latest trading date" for the authoritative date + row counts.

| DO/API says | ClickHouse says | Conclusion |
| --- | --- | --- |
| date = yesterday | latest = yesterday (today no/low rows yet) | **Fresh** — source not ready; not a serving bug |
| date = yesterday | today is a full session with rows | **Stale serving layer** — cron/refresh stalled → remediate |
| `MISS` / empty | source healthy | DO storage empty/reset → `force` rebuild |
| date current, `rowCount` low | source row count also low | source/ingest issue → §3 + data-integrity |

---

### 5. Cross-verify with Better Stack (MCP) — the historical record

curl/wrangler show *now*; Better Stack shows *what happened* (refresh successes/failures, `payloadBytes` over time, ingest health intervals). Production P0/P1 telemetry ships to a **cf-worker** source (`BETTERSTACK_CFWORKER_TOKEN` → `s2442821.eu-fsn-3.betterstackdata.com`), **separate** from the process-service/EC2 source used by `betterstack-error-healing.md`.

**Access (MCP server `user-betterstack`):**
1. `telemetry_list_sources_tool` → match the **cf-service / cfworker production** source by name (resolve at runtime; do **not** hardcode a stale `source_id`). Pick the cf-worker one, not "Process Service[Production]".
2. `telemetry_get_query_instructions_tool` with that `source_id`, `source_type: logs` → returns the table names.
3. `telemetry_query` with SQL. Filter cf-worker prod rows: `runtime = 'cfworker'` and `environment = 'production'` (every event carries `runtime`, `env`/`environment`, `scope`, `operation`, and a `[module][severity][environment]` `tag`).

**Events to query and what each cross-verifies:**

| `operation` / event | Cross-verifies | Key fields |
| --- | --- | --- |
| `contract_rank_snapshot_refresh_completed` | §1 freshness **and** §6 size | `refreshStatus`, `effectiveDate`, `rowCount`, **`payloadBytes`**, `latencyMs`, `force` |
| `contract_rank_snapshot_refresh_failed` / `refresh_failed` | a stale snapshot (§1) | `requestStage` |
| `uw_websocket_health` (every 5 min, RTH P0) | §3 ingest health | `trades_in`, `ch_drain_ok/fail`, `write_buffer_*_drops`, `max_write_buffer_depth`, `max_low_priority_lag_ms` |
| `streaming_started` / `streaming_stopped` / `streaming_resumed` | UW socket lifecycle | reason, timestamps |
| `first_option_trades_after_restart_missing` (P0) | no trades after join | — |
| `end_of_day_summary` (P0, ≥16:00 ET) | the session settled cleanly | `happy_total_count`, `unhappy_total_count` |

Decision pairing:
- Stale `asOf` (§1) **+** recent `contract_rank_snapshot_refresh_failed` → rebuild path broken (read `requestStage`); not an empty-source problem.
- Stale `asOf` **+** no `refresh_*` events at all → the cron itself isn't firing (check §0 deployment, DO reset loop §6).
- Stale `lastTradeAtMs` (§3) **+** `streaming_stopped` / `first_option_trades_after_restart_missing` → upstream socket issue → restore-streaming.
- `payloadBytes` trending up sharply across `refresh_completed` events → size review (§6).

(For producer-side ClickHouse ingest incidents — write-buffer drops, insert timeouts — that telemetry is on the EC2 source: use `betterstack-error-healing.md`.)

---

### 6. Data size vs Cloudflare limits

We do **not** want DO storage / KV values / served payloads to grow until they hit a Cloudflare limit and trip resets — exactly what bloated the original ContractRankSnapshot object (orphaned payload chunks → storage commits exceeded the runtime deadline → `exceededMemory` / `exceededCpu` / storage-timeout resets → the `-v2` rebuild + chunk cleanup).

**Authoritative Cloudflare limits (verify current — these were accurate at writing):**

| Surface | Backend | Hard limit |
| --- | --- | --- |
| `ContractRankSnapshotDO`, `UwIngestionDO` | **SQLite DO** | **10 GB / object**; **2 MB combined key+value per entry** (and per string/BLOB/row); up to 128 pairs per `put()`; 30 s CPU/request (→ 5 min) |
| `CFWorkerService` | key-value DO | 128 KiB / value; 2 KiB / key |
| `REFDATA_KV` (available-dates, symbol-meta) | Workers KV | **25 MiB / value**; 512 B / key |
| Worker isolate | — | **128 MB memory** — buffering a full multi-MB body (`await res.text()`) can OOM; the snapshot is served as streamed chunks for this reason |

**Design guardrails already in code (`contract-rank-snapshot/index.ts`):** snapshot payload is split into **512 KB chunks** (`CONTRACT_RANK_CHUNK_SIZE`) so each stored value stays well under the 2 MB DO entry limit; stale builds are swept (`CLEANUP_MAX_STALE_BUILDS_PER_PASS=12`, `CLEANUP_DELETE_BATCH_SIZE=128`, `CLEANUP_MAX_CHUNKS_PER_BUILD=1024`) to stop orphaned-chunk bloat. UW write buffer is bounded in memory by `UW_WRITE_BUFFER_MAX_ENTRIES=6000` / `UW_WRITE_BUFFER_MAX_RAW_ROWS=20000` (evicts at cap → drops, not OOM).

**Measure it:**

```bash
# 1) Served snapshot payload size (bytes) — the multi-MB body the webapp pulls
curl -s -o /dev/null -w 'snapshot bytes: %{size_download}\n' \
  "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot"

# 2) KV value sizes — symbol-meta is the big one (thousands of symbols); must stay < 25 MiB
cd "$WORKSPACE/tradingflow-cfworker-service"
echo "symbol-meta bytes:   $(npx wrangler kv key get 'refdata:symbol-meta:latest' --namespace-id "$KV_ID" | wc -c)"
echo "available-dates bytes: $(npx wrangler kv key get 'refdata:available-dates' --namespace-id "$KV_ID" | wc -c)"

# 3) payloadBytes trend — Better Stack §5: contract_rank_snapshot_refresh_completed.payloadBytes over the last N days
# 4) DO total stored bytes (10 GB cap) — Cloudflare dashboard → Workers & Pages → DO namespace → Metrics → "Stored data"
#    (wrangler has no DO-storage dump; the dashboard / GraphQL analytics is the source of truth)
```

| Check | OK | Watch / act |
| --- | --- | --- |
| snapshot served bytes | a few MB, stable session-over-session | sharp growth, or approaching tens of MB (isolate-memory risk; verify chunks still < 2 MB) |
| `payloadBytes` (Better Stack) | flat/seasonal | trending up across rebuilds → investigate row blow-up / encoding regression |
| `refresh_completed.chunkCount × 512 KB` | ≈ payloadBytes | a chunk would exceed 2 MB → DO `put` would fail (shouldn't, given 512 KB chunking) |
| `symbol-meta` KV value | well under 25 MiB | within a few MB of 25 MiB → split/compact before it 413s |
| DO stored bytes (dashboard) | far below 10 GB, flat | rising monotonically (orphaned chunks not being swept) → cleanup regression |
| Reset symptoms in logs (`wrangler tail` / Better Stack) | none | object re-initializing, `exceededMemory`/`exceededCpu`/storage-timeout → bloat/CPU incident |

---

## Staleness thresholds (RTH unless noted)

| Surface | Fresh | Stale → act |
| --- | --- | --- |
| contract-rank `asOf` | ≤ ~10 min | > ~15 min during RTH |
| contract-rank `effectiveDate` | == latest session date | behind latest session mid-RTH |
| available-dates `effective` | == today at/after 09:30 ET on a session day | yesterday well into RTH (morning transition missed) |
| symbol-meta `asOf`/`date` | last nightly sync (~19:00 ET) | older than last completed sync |
| UW `lastTradeAtMs` | seconds | minutes (or null) during RTH |
| UW `lastDrainFinishedAtMs` | recent, buffer draining | stale + rising buffer depth |

Outside market hours, contract-rank `asOf`/`effectiveDate` and UW `lastTradeAtMs` are **frozen at last session** — fresh, not stale.

## Attribution cheat sheet

| Symptom | Usually |
| --- | --- |
| contract-rank `MISS`/404, everything else OK | DO storage empty/reset → `force` rebuild |
| contract-rank `effectiveDate` stuck mid-RTH, UW healthy, ClickHouse current | Scheduled **rebuild** stalled — Better Stack `contract_rank_snapshot_refresh_failed` (§5), cron, DO reset loop (§6) |
| `effective` shows yesterday after 09:30 ET | Reference-data cron stalled, OR ClickHouse has no today rows yet (step 4). Pre-09:30 ET it's correct. |
| symbol-meta date old / `symbolMetaCount` low | Nightly sync failed or DO meta refresh failing → downstream market_cap/DEI zeros (data-integrity) |
| UW `connected:false` during RTH | Zombie UW socket / reconnect → restore-streaming |
| `writeBufferDepth` rising, `lastDrainFinishedAtMs` stale | ClickHouse drain stalled — `ch_drain_fail`, CH reachability |
| `dailyReferenceStateUsable:false` | Symbol-meta snapshot unusable → connect blocked → fix meta first |
| object re-initializing / storage-timeout in logs; DO stored bytes rising | **Storage bloat** (§6) — orphaned chunks / cleanup regression |
| served payload / `payloadBytes` ballooning | Size regression (§6) — risks isolate memory + 2 MB chunk limit |
| `/canary` non-200 or `deployments list` shows old build | Worker down / not deployed — escalate before other checks |

---

## Remediation

Read-only checks never change state. The actions below do — **no ad-hoc CLI mutations against production; ship code via GitHub → deploy; rebuild via cron or the sanctioned endpoint.**

| Finding | Action |
| --- | --- |
| contract-rank `MISS`/empty or stale build | Sanctioned escape hatch — force one rebuild from ClickHouse: `curl -X POST "$WORKER_ORIGIN/api/v1/contract-rank/latest-snapshot/refresh?force=true"`. Bypasses the schedule/market gate. Verify the returned `{status, effectiveDate, rowCount}`, then re-check `/meta`. Use deliberately, not in a loop. |
| Scheduled rebuild stalled despite force working | Better Stack `contract_rank_snapshot_refresh_failed` (`requestStage`), check the cron (`*/1 * * * *`) and DO reset-looping (§6). Fix in code, deploy. |
| available-dates / symbol-meta stale | Confirm cron firing (`wrangler tail`); a cold `GET` triggers populate-on-miss, but a stuck cron needs a code/deploy fix. Don't `wrangler kv key put` in prod. |
| UW stream down | `tradingflow-cfworker-service/wiki/runbook/human/restore-streaming.md` (reconnect; one ws per UW token). |
| Drain stalled / buffer growing | ClickHouse reachability + `ch_drain_fail`; write-buffer tuning in `data-quality.md`. |
| Storage bloat / DO stored bytes rising | Investigate cleanup regression (`cleanupRetainedSnapshots`); a fresh DO name (the `-v2` precedent) is the last resort — code change + deploy, not a CLI op. |
| Size regression (payload/symbol-meta growing) | Find the row/encoding blow-up; keep chunks < 2 MB and KV values < 25 MiB. |
| Source itself wrong/empty | Not a serving bug — switch to `ops/cf-service/data-quality.md`. |

After any `force` rebuild or deploy, re-run steps 0–6 and confirm `asOf` advanced, `effectiveDate` matches the latest session, and sizes are stable.

---

## Report template

```markdown
## CF-service DO/API status — PRODUCTION — {timestamp ET}

**Verdict:** Healthy / Degraded / Down
**Market state:** RTH / closed / pre-open
**Deployed build:** {from wrangler deployments list}

| Surface | Populated | API | Fresh | Size | Notes |
| --- | --- | --- | --- | --- | --- |
| /canary | — | 200 | — | — | |
| contract-rank latest-snapshot | rc=____ | 200/MISS | effDate=____, asOf age=__min | served=__MB, payloadBytes=____ | |
| available-dates | count=____ | 200/503 | effective=____ (today? Y/N) | — | |
| symbol-meta/latest | rows=____ | 200/503 | date=____ asOf=____ | KV bytes=____ (/25MiB) | |
| uw-ingestion/status | bufDepth=__/6000 | 200 | lastTradeAtMs age=__s, connected=__ | rawRows=__/20000 | |
| DO storage (dashboard) | — | — | — | stored=__ /10GB | |

**ClickHouse cross-check:** latest source date = ____ (matches served? Y/N)
**Better Stack:** last refresh_completed = ____ (status/effDate/payloadBytes); refresh_failed in window? Y/N; uw_websocket_health OK? Y/N

**Stale/empty/oversized surfaces:** ...
**Likely cause:** (storage reset/bloat / rebuild stalled / cron stuck / UW socket / source gap / size regression / not deployed)
**Action taken / recommended:** (none / force refresh / deploy fix / restore-streaming / escalate)
```

---

## Related code & artifacts

| Artifact | Project |
| --- | --- |
| `src/index.ts` (routes, `/canary`, cron orchestrator, DO bindings) | `tradingflow-cfworker-service` |
| `src/contract-rank-snapshot/index.ts` (DO, `publicMeta`, chunking + cleanup, `evaluateScheduledRefreshGate`) | `tradingflow-cfworker-service` |
| `src/uw-ingestion/index.ts` (`UwIngestionStatus`, `getStatus`, drain/alarm) + `ingestion-telemetry.ts` | `tradingflow-cfworker-service` |
| `src/reference-data/index.ts` (available-dates / symbol-meta KV handlers) | `tradingflow-cfworker-service` |
| `src/util/betterstack.ts` (cf-worker telemetry sink → Better Stack source used in §5) | `tradingflow-cfworker-service` |
| `wrangler.jsonc` (worker name, KV namespace ids, DO backends, prod vars) | `tradingflow-cfworker-service` |
| `wiki/operation.md`, `wiki/uw-ingestion-do.md`, `wiki/runbook/human/restore-streaming.md` | `tradingflow-cfworker-service` |
| ClickHouse source audit (the upstream this layer serves) | `ops/cf-service/data-quality.md` |
| Better Stack **producer/EC2** triage (separate source) | `ops/cf-service/betterstack-error-healing.md` |
| Cloudflare limits reference | DO: developers.cloudflare.com/durable-objects/platform/limits · KV: developers.cloudflare.com/kv/platform/limits |

**Serving-layer vs source.** A green run here means the Worker is *serving populated, correctly-shaped, current, size-safe* data from DO storage + KV. It does **not** prove the underlying ClickHouse data is correct — pair with `data-quality.md` for the full picture.
