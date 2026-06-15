# Better Stack error healing — producer ClickHouse ingest

**Repo:** `tradingflow-process-service-ec2`  
**Source:** Process Service[Production] (`telemetry_list_sources_tool` → name match)  
**MCP server:** `user-betterstack`  
**Related:** [check-optiontrades-latency/SKILL.md](./check-optiontrades-latency/SKILL.md), `tradingflow-webapp-fullstack/doc/automation/self-healing/error-investigate.md`

---

## When to use this runbook

- ClickHouse `AggregatedOptionTrades` / `RawOptionTrades` look empty or thin for part of a session.
- `bun scripts/verify-producer-freshness.ts` returns low `row_count` or odd hourly gaps.
- Customer-visible lag is fine but warehouse row counts drop after the open.

Always pair **Better Stack producer logs** with **ClickHouse time coverage** (see Step 2). Logs explain *why* rows are missing; CH proves *what* is missing.

---

## AI Agent Runbook

### Runtime rules

- Resolve the Better Stack **Process Service[Production]** source/table at runtime every session. Do not hardcode stale source IDs.
- Treat `BetterStackHeartbeat` as Better Stack Uptime monitoring, separate from the Logtail source/table used for producer logs.
- Use repo `.env` plus `bun scripts/verify-producer-freshness.ts` for ClickHouse production-cloud checks.
- Do not use ClickHouse MCP against the production cloud service.

### Better Stack source resolution

1. `telemetry_list_sources_tool` → match name **Process Service[Production]**.
2. `telemetry_get_query_instructions_tool` with the runtime `source_id` and `source_type: logs`.
3. Use the returned table names in the SQL below.

### Event predicates

| Signal | Predicate |
| --- | --- |
| Elevated buffer | `event = 'write_buffer_elevated'` |
| Buffer drop | message contains `write buffer drop` |
| Insert timeout/exhaustion | message contains `batch insert timeout`, `aggregate batch insert timeout`, `raw batch insert timeout`, or context `errorMessage = 'insert attempts exhausted'` |
| Stale index quote degradation | `event = 'index_refresh_degraded_to_stale_cache'` |
| Requested-family quote outage | `event IN ('index_quote_total_failure', 'index_quote_incomplete')` with requested family uncovered |
| Premarket restart skip | `event = 'first_trade_alert_skipped_premarket'` |
| Runtime summary | `event = 'runtime_summary'` |

### Interpretation matrix

| Evidence | Meaning | Severity |
| --- | --- | --- |
| `write_buffer_elevated`, drains succeeding, no drops | Normal/drain pressure; producer is compensating | Info dashboard |
| `write_buffer_elevated` plus serial `write_buffer_drain_batch` pressure=`warn` | Warn pressure; aggregate/raw inserts serialized by policy | P1/dashboard |
| `index_refresh_degraded_to_stale_cache` | Requested family served from stale Longport/Massive cache | P1/info |
| `index_quote_total_failure` or requested family uncovered | True quote outage for the requested index family | P0 |
| Stuck drain after computed policy budget | Insert attempts exceeded timeout/retry budget | P0 |
| `first_trade_alert_skipped_premarket` | Scheduled premarket restart joined before regular prints; missing-first-trade timer intentionally skipped | Info |

### Post-deploy verification

1. Confirm env/defaults: `UW_WRITE_BUFFER_DRAIN_ENTRY_THRESHOLD=1500`, `UW_MAX_INSERT_ATTEMPTS=3`, `UW_FIRST_TRADE_AFTER_RESTART_ALERT_MS=60000` unless production explicitly overrides them.
2. Run `npm run build`.
3. Run `bun test src/syncUwData/`.
4. Run `node scripts/test-sync-uw-issue-logging.js`.
5. Run `node scripts/test-optionchain-run-issue-logging.js`.
6. After deploy, run `bun scripts/verify-producer-freshness.ts` from repo `.env`.

### Better Stack Uptime heartbeats

- `BetterStackHeartbeat` is registered only in production runtime and sends `GET https://uptime.betterstack.com/api/v1/heartbeat/hBWssf343Zvr6KeQBtW8et64` every 5 minutes. This proves process liveness only.
- `SyncUwClickHouseHeartbeat` is owned by `UnusualWhalesClient` and sends `GET https://uptime.betterstack.com/api/v1/heartbeat/3QB5QMqs8TeZgmoKEb4uYnZV` only when the current session is regular or extended, the real websocket path is open, and a nonzero raw plus aggregate ClickHouse drain succeeded within the last 6 minutes.
- The process monitor should expect a heartbeat every 5 minutes with a grace period large enough to avoid one-off network jitter.
- The ingest monitor must be scheduled or paused for the active market-data window. Otherwise it will false-alert overnight, on weekends, and on market holidays because closed-session missed heartbeats are intentional.
- Local build/test verification must not manually hit the real heartbeat endpoints unless intentionally verifying the live Better Stack monitor, because that starts or advances the monitor heartbeat timeline.
- Do not call `/fail` or `/<exit-code>` for these heartbeats. Missed heartbeats are the failure condition; explicit failure endpoints remain reserved for job-output failure reporting.

---

## MCP setup (each session)

1. `telemetry_list_sources_tool` → **Process Service[Production]** (resolve `source_id` at runtime).
2. `telemetry_get_query_instructions_tool` with that `source_id`, `source_type: logs`.
3. `telemetry_query` with SQL below (replace date bounds).

Hard rule: do **not** reuse stale `source_id` values across months.

---

## Incident pattern: May 19, 2026 (reference)

| Phase | ET | What happened |
| --- | --- | --- |
| Open | 09:30–09:35 | Drains OK; ~221k aggregate rows with `time` in hour 9 |
| Failure | **09:35:41** | ClickHouse insert **timeout** (5s); `aggregate_status=timeout`, `raw_status=timeout` |
| Buffer cap | **09:36** | `write_buffer_depth=10000` (max entries); **3,564** `write buffer drop` logs |
| Silence | **09:36–~14:05** | No `runtime_summary`, no successful drains (~4.5h) |
| Recovery | **~14:05–14:08** | `setup_started` / `websocket_open`; drains resume |
| CH gap | `time` hour **10** | **0 rows** — morning hole in trade-time column |
| Afternoon | 11–16 ET | Millions of rows (late timestamps + normal flow) |

**Root cause (producer-side):** insert timeouts under open load → backlog → write-buffer cap evictions → data never written. Default cap was 10k FIFO (now 50k with premium-priority drain). Not a missing table or CH outage.

**Process death without app error (2026-05-22):** logs stop mid-drain → check EC2 `journalctl` / OOM; ensure `Restart=always` and `registerProcessFatalHandlers`.

**Today check:** May 20+ logs show `drain_failures=0`, healthy `runtime_summary`; use Step 2 daily.

---

## Step 1 — Is the producer alive?

```sql
SELECT
  max(dt) AS last_log_utc,
  countIf(dt > now() - INTERVAL 15 MINUTE) AS logs_last_15m
FROM (
  SELECT dt FROM remote(t203847_process_service_logs) WHERE dt > now() - INTERVAL 2 DAY
  UNION ALL
  SELECT dt FROM s3Cluster(primary, t203847_process_service_s3)
  WHERE _row_type = 1 AND dt > now() - INTERVAL 2 DAY
)
```

| Signal | Healthy | Investigate |
| --- | --- | --- |
| `logs_last_15m` | > 0 during market hours | Process down or not shipping logs |
| `last_log_utc` | Within minutes of now | Stale logging / crash |

---

## Step 2 — ClickHouse coverage (ground truth)

From repo (`.env` credentials):

```bash
cd tradingflow-process-service-ec2
bun scripts/verify-producer-freshness.ts              # today ET
bun scripts/verify-producer-freshness.ts 2026-05-19   # specific session
```

Script prints:

- Open-window lag (09:30–09:35 ET): p50/p95, `rows_gt_30s`, `row_count`
- **Hourly row counts** by `time` — catches May-19-style **hour 10 = 0** gaps
- `min_time` / `max_time` for the calendar date

| Pattern | Meaning |
| --- | --- |
| `row_count = 0` on a trading day | No rows in open window — ingest failed or never ran |
| Hour 9 only, hour 10 = 0 | Mid-morning gap in `time` (see May 19) |
| `max_time` stops before ~16:00 ET | Ingest stopped mid-session (live incident) |

---

## Step 3 — Drain health (market hours)

Replace date with the trading day under investigation (UTC date for ET open ≈ same calendar day; open 09:30 ET = 13:30 UTC in EDT).

### 3a. Successful drains per minute

```sql
SELECT
  toStartOfMinute(dt) AS minute,
  countIf(JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%drained batch%aggregate_status=success%') AS success_drains,
  countIf(JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%aggregate_status=timeout%') AS timeouts,
  countIf(JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%write buffer drop%') AS buffer_drops
FROM (
  SELECT dt, raw FROM remote(t203847_process_service_logs) WHERE dt > now() - INTERVAL 3 DAY
  UNION ALL
  SELECT dt, raw FROM s3Cluster(primary, t203847_process_service_s3) WHERE _row_type = 1 AND dt > now() - INTERVAL 3 DAY
)
WHERE
  toDate(dt) = '2026-05-19'
  AND dt >= toDateTime('2026-05-19 13:25:00')
  AND dt < toDateTime('2026-05-19 21:00:00')
GROUP BY minute
ORDER BY minute ASC
```

**Alert:** `success_drains = 0` for **> 5 minutes** while `session=regular` (cross-check 3c).

### 3b. Insert failures (sample)

```sql
SELECT
  dt,
  JSONExtract(raw, 'level', 'Nullable(String)') AS level,
  JSONExtract(raw, 'message', 'Nullable(String)') AS message
FROM (
  SELECT dt, raw FROM remote(t203847_process_service_logs) WHERE dt > now() - INTERVAL 3 DAY
  UNION ALL
  SELECT dt, raw FROM s3Cluster(primary, t203847_process_service_s3) WHERE _row_type = 1 AND dt > now() - INTERVAL 3 DAY
)
WHERE
  toDate(dt) = '2026-05-19'
  AND (
    JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%aggregate batch insert timeout%'
    OR JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%write buffer drop%'
    OR JSONExtract(raw, 'event', 'Nullable(String)') = 'write_buffer_elevated'
  )
ORDER BY dt ASC
LIMIT 100
```

### 3c. `runtime_summary` gaps

```sql
SELECT
  toStartOfHour(dt) AS hour_utc,
  countIf(JSONExtract(raw, 'event', 'Nullable(String)') = 'runtime_summary') AS summaries,
  countIf(JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%drained batch%') AS drain_logs
FROM (
  SELECT dt, raw FROM remote(t203847_process_service_logs) WHERE dt > now() - INTERVAL 3 DAY
  UNION ALL
  SELECT dt, raw FROM s3Cluster(primary, t203847_process_service_s3) WHERE _row_type = 1 AND dt > now() - INTERVAL 3 DAY
)
WHERE toDate(dt) = '2026-05-19'
GROUP BY hour_utc
ORDER BY hour_utc ASC
```

**May 19:** summaries/drains only in hours **13** and **18–20** UTC; gap **14–17** UTC matches CH morning hole.

### 3d. Last `runtime_summary`

```sql
SELECT
  dt,
  JSONExtract(raw, 'message', 'Nullable(String)') AS message
FROM (
  SELECT dt, raw FROM remote(t203847_process_service_logs) WHERE dt > now() - INTERVAL 1 DAY
  UNION ALL
  SELECT dt, raw FROM s3Cluster(primary, t203847_process_service_s3) WHERE _row_type = 1 AND dt > now() - INTERVAL 1 DAY
)
WHERE JSONExtract(raw, 'event', 'Nullable(String)') = 'runtime_summary'
ORDER BY dt DESC
LIMIT 5
```

Parse: `drain_failures`, `drain_timeouts`, `dropped_aggregate_rows`, `write_buffer_drops`, `max_write_buffer_depth`, `aggregate_rows_written`.

---

## Step 4 — Decision matrix

| Evidence | Verdict | Action |
| --- | --- | --- |
| CH hourly gap + `write buffer drop` spike + insert timeouts | **Producer ingest failure** | Restart process service; tune pressure settings (see code); watch CH `max(time)` recover |
| CH gap, logs silent >30m, no errors | **Process hung / crashed** | SSH EC2; restart; inspect OOM/systemd |
| `aggregate batch insert timeout` only, few drops | **ClickHouse slow** | CH Cloud load; confirm `SyncUwWriteDrainPolicy` is applying drain/warn pressure |
| `index_refresh_degraded_to_stale_cache` only | **Quote degradation covered** | Monitor; not a P0 while requested family is served |
| `index_quote_total_failure` or requested family uncovered | **True index quote outage** | Treat as P0 for affected index family |
| `first_trade_alert_skipped_premarket` | **Expected premarket restart behavior** | No missing-first-trade incident unless regular-session summaries are silent |
| No CH rows weekend | **Expected** | None |
| CH OK, high `late_gt30s_upstream` only | **Upstream UW** | Not a CH-missing-rows incident |

---

## Alerting recommendations (Better Stack)

Create charts/alerts on **Process Service[Production]** logs:

| Alert | Condition | Severity |
| --- | --- | --- |
| Write buffer drops | `message` contains `write buffer drop` > **50/min** | P0 |
| Write buffer pressure + timeout | `aggregate batch insert timeout` (or `aggregate_status=timeout`) **and** `write_buffer_depth` > **5000** in same minute | P0 |
| CH trade time stale | `max(time)` in `AggregatedOptionTrades` not advancing **> 10 min** during US regular session (verify via `verify-producer-freshness.ts`) | P0 |
| Aggregate/raw insert exhaustion | insert timeout/exhaustion after retry budget | P0 |
| Drain stall | No `event = runtime_summary` for **> 3 min** during 13:00–21:00 UTC weekdays | P0 |
| Low-priority lag at open | `max_low_priority_lag_ms` in `runtime_summary` p95 > **120s** in first 5 min after 13:30 UTC | P1 |
| Requested-family quote unavailable | `event IN ('index_quote_total_failure', 'index_quote_incomplete')` where requested family is uncovered | P0 |
| Elevated buffer | `event = write_buffer_elevated` any occurrence at open | P1/info dashboard |
| Stale quote degradation | `event = index_refresh_degraded_to_stale_cache` | P1/info dashboard |
| Longport partial omission | `event = index_quote_incomplete` with fallback coverage | P1/info dashboard |
| Premarket first-trade skip | `event = first_trade_alert_skipped_premarket` | Info |
| High late-trade drops | `high late-trade drop rate` (existing) | P1 (context) |

Wire notifications to the same channel as existing `[WebSocketService]` P0 errors.

---

## Code mitigations (2026-05-20 follow-up)

| Change | File | Behavior |
| --- | --- | --- |
| Sync UW write-drain policy | `src/syncUwData/write-drain-policy.ts` | Default drain threshold **1,500** entries; drain pressure uses 1,000-entry batches, 10s timeout, 500ms retry; warn pressure uses 500-entry batches, serialized aggregate→raw inserts, 15s timeout, 1s retry |
| Retry and alert env | `src/syncUwData/write-drain-policy.ts` | `UW_MAX_INSERT_ATTEMPTS` default **3**; stuck alert budget includes attempts, retry delays, and serial sink mode |
| First-trade alert env | `src/syncUwData/write-drain-policy.ts` | `UW_FIRST_TRADE_AFTER_RESTART_ALERT_MS` default **60s**; scheduled premarket restarts emit `first_trade_alert_skipped_premarket` instead of scheduling the error timer |
| Index quote outcomes | `src/syncUwData/index-quote-provider.ts` | Fresh and stale-covered requested families keep serving; P0 only when the requested family has no fresh/stale quote |
| Coverage script | `scripts/verify-producer-freshness.ts` | Hourly CH distribution + open-window lag |

| Priority write buffer | `src/syncUwData/write-buffer-priority.ts` | Dual queue (high/low); high = any fill `premium ≥ UW_PREMIUM_HIGH_PRIORITY_THRESHOLD` (default **25k**); cap `UW_WRITE_BUFFER_MAX_ENTRIES` (default **50k**); low drain gated by `UW_LOW_DRAIN_GATE_HIGH_DEPTH` (default **1500**) |
| ClickHouse client transport | `src/shared-clients/clickhouse/client.ts` | Request/response compression, keep-alive, `max_open_connections=20` (global; no async_insert on shared client) |
| SyncUw async insert | `src/syncUwData/sql.ts` | Per-insert `async_insert=1`, `wait_for_async_insert=0` on raw/agg option-trade inserts only; ordering by trade time not required |
| Latency-aware drain pressure | `src/syncUwData/write-drain-policy.ts` | Normal tier: **800** batch cap, **10s** insert timeout; escalate to drain/warn when buffer depth **or** insert p99 ≥ **3s** / **8s** |
| Process fatal logging | `src/utils/process-fatal-handlers.ts` | `uncaughtException` / `unhandledRejection` → Better Stack before exit |

Constants/env reference: `UW_WRITE_BUFFER_MAX_ENTRIES` (default **50_000**), `UW_WRITE_BUFFER_MAX_RAW_ROWS` (default **100_000**), `UW_PREMIUM_HIGH_PRIORITY_THRESHOLD` (default **25_000**), `UW_LOW_DRAIN_GATE_HIGH_DEPTH` (default **1500**), `UW_WRITE_BUFFER_DRAIN_ENTRY_THRESHOLD=1500`, `UW_MAX_INSERT_ATTEMPTS=3`, `UW_FIRST_TRADE_AFTER_RESTART_ALERT_MS=60000`, `INDEX_TIMEOUT_MS` default fallback **6000ms**.

**Friday 2026-05-22 outage ops:** [friday-2026-05-22-streaming-outage.md](../ops/friday-2026-05-22-streaming-outage.md) — EC2 forensics, restart, backfill decision.

---

## Ops checklist (live incident)

0. **Pre-deploy / post-incident env (EC2 process-service):** Confirm `UW_WRITE_BUFFER_MAX_ENTRIES=50000` (not legacy `10000` — May-22 timeouts showed `write_buffer_depth=9999`). Also `UW_WRITE_BUFFER_DRAIN_ENTRY_THRESHOLD=1500`, `UW_MAX_INSERT_ATTEMPTS=3`. Code defaults apply when unset; explicit env on the unit avoids drift.

1. Run Step 1–2 (MCP + `verify-producer-freshness.ts`).
2. If `max(time)` is stale during market hours → restart producer on EC2.
3. After restart, confirm within 5 min:
   - `drained batch ... aggregate_status=success` in logs
   - CH `max(time)` advancing
4. Post-mortem: count `write buffer drop` + `aggregate batch insert timeout` in the failure window.
5. Optional: compare `RawOptionTrades` vs `AggregatedOptionTrades` `max(time)` — both should move together.

---

## Agent workflow

```mermaid
flowchart TD
  A[Report: missing CH rows] --> B[Step 1: producer alive?]
  B -->|no| C[Restart EC2 process]
  B -->|yes| D[Step 2: verify-producer-freshness.ts]
  D --> E[Step 3: Better Stack drains / drops / summaries]
  E --> F{buffer drops or insert timeouts?}
  F -->|yes| G[Ingest failure - restart + pressure tune]
  F -->|no| H{log gap > 30m?}
  H -->|yes| I[Hung process - restart]
  H -->|no| J[Upstream lag or query window mistake]
```
