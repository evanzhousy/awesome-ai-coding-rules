---
name: process-check-error
description: Pulls recent production errors (default past 24 hours) for the tradingflow-process-service-ec2 backend from Better Stack Telemetry **logs** (level=error) and Better Stack **Uptime heartbeats**, clusters them by jobName / [P0]/[P1] tag / pattern, separates known steady-state fallback noise from real defects, states likely root causes with confidence, and produces a fix plan without speculative code changes. Use when the user asks to check production errors / health of the process service, the Unusual Whales ingestion client, the option-chain / symbol-meta cron jobs, or the CF watchdog.
disable-model-invocation: true
---

# Process Service — production error check (Better Stack logs + heartbeats, ~24h)

Agent runbook for **recent production errors** of the backend service **`tradingflow-process-service-ec2`** (the EC2 Node/Express process that runs the Unusual Whales ingestion client, the option-chain and symbol-meta cron jobs, the CF-service watchdog, and maintenance jobs). Default window is the **past 24 hours**.

This service has **no PostHog and no Sentry-backed Better Stack "Errors" application**. Its observability is:

- **Better Stack Telemetry logs** (Logtail source `Process Service[Production]`) — every `logErrorHandler` / `syncUwLogError` writes a row with `level="error"`. **This is the primary error source for this runbook.**
- **Discord** — the same errors fan out to a Discord error webhook (info summaries to a Discord info webhook). Not queryable by MCP; use only as a human cross-check.
- **Sentry.io** — the same errors also go to Sentry (`captureProcessServiceError`). Separate product; out of scope here unless the user asks.
- **Better Stack Uptime heartbeats** — two liveness monitors (process heartbeat + Sync UW ClickHouse ingest heartbeat). Separate from logs; checked via the Uptime MCP tools.

Because errors live in the **logs** collection (not an Errors application), **do not** use `telemetry_list_errors_tool` / `telemetry_get_errors_query_instructions_tool` for this service. Use the **logs** query path (`telemetry_get_query_instructions_tool` → `telemetry_query`).

## Recommended invocation

Use `/goal` for each production error check:

- **Objective:** produce an evidence-backed `-24h` production error triage for `tradingflow-process-service-ec2` from Better Stack logs + heartbeats, and the smallest safe fix plan.
- **Success criteria:** the Better Stack logs source and Uptime heartbeats were both queried for the window, the schema/IDs were resolved at runtime, error clusters are separated from known steady-state fallback noise, each cluster has a confidence-labelled root cause, and any heartbeat that is `Down` or returning non-2xx is reported.
- **Stop condition:** the deliverable meets the criteria, source access is explicitly blocked, or the user authorizes a separate implementation step.

A single agent may also run this end-to-end; a Master/Subagent split (Master owns Goal + verification, Subagent gathers bounded evidence) is optional and recommended for deep multi-round investigations.

## Goal

Produce an evidence-backed production error triage for the requested window that identifies the dominant error clusters by `jobName` and severity tag, distinguishes real defects from expected steady-state fallback chatter, states likely root causes with confidence, and gives the smallest safe fix plan — **without** speculative code changes.

## Criteria for success

The check is complete only when all applicable items pass:

1. **Source resolved at runtime** — the Better Stack logs source for `Process Service[Production]` was resolved via `telemetry_list_sources_tool` (do not trust a hardcoded id), and `telemetry_get_query_instructions_tool` was read before writing SQL.
2. **Logs queried for the window** — `level="error"` rows for the window were pulled and grouped (by `jobName`, `_pattern`, and/or severity tag). Both hot (`remote(...)`) and historical (`s3Cluster(...)`) collections were covered as needed for the window (see [Hot vs cold storage](#hot-vs-cold-storage)).
3. **Heartbeats checked** — `uptime_list_heartbeats_tool` was called; the process + ingest heartbeats were identified by name and their status reported. Any `Down` heartbeat, or any `*heartbeat request failed*` error log, is surfaced.
4. **Noise separated** — known steady-state fallback/degradation chatter (see [Known steady-state noise](#known-steady-state-noise)) is explicitly separated from product defects. P0/P1 tagged lines are ranked above untagged info-noise.
5. **Evidence cited** — findings cite `_pattern` ids, `jobName`, counts, and `last_seen` timestamps from the queries actually run, plus the resolved `source_id` used.
6. **Root cause confidence stated** — each cluster has a high/medium/low confidence label, with evidence from logs (and heartbeats / targeted repo reads where needed).
7. **Routing sanity** — if the user asks whether errors are being captured correctly, run [Observability routing check](#observability-routing-check) against the code's contract before finalizing.
8. **Fix and verification plan** — the deliverable names likely files/areas and the exact log signal (pattern / message / `jobName` + severity) that should drop after a fix.
9. **Boundaries preserved** — no code change, observability-policy change, or Better Stack state mutation unless the user explicitly expands scope.

## When to use

- "Any errors in prod in the last 24h?" / "is the process service healthy?" / "is UW ingestion alive?"
- Triaging a specific `jobName` (`UnusualWhalesClient`, `SyncSymbolMetaService`, `FetchOptionChainDataService`, `CheckCFServiceDataController`), a `[P0 Error]` / `[P1 Error]` spike, or a heartbeat going down.
- Confirming a shipped fix stopped producing a given error pattern.

## When not to use

- Frontend / webapp errors → use the webapp runbook ([`../webappp-fullstack/webapp-check-error.md`](../webappp-fullstack/webapp-check-error.md)); that one uses PostHog + a Better Stack **Errors** application and does not apply here.
- Pure throughput/latency dashboards or business metrics → query the runtime-summary fields directly (Better Stack), but that is monitoring, not error triage.
- A known local stack trace with no production-correlation need → debug the code path directly.

## Read first (do not skip)

The **source of truth** for this service's logging/alerting contract lives in the code repo (sibling of this rules repo):

1. `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2/wiki/domain-invariants/info-error-logging.md` — the routing matrix (info → Better Stack [+Discord], error → Better Stack + Discord + Sentry), the P0/P1 / first-seen-dedupe policy, the cron schedule table, and the **"Current Discord Send Map"** (which code path emits which error and when). Read this before interpreting any error.
2. `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2/wiki/domain-invariants/sync-uw-data.md` — domain invariants for the Unusual Whales ingestion client (`UnusualWhalesClient`), including the index-quote fallback ([P1]/[P0]) and reference-price rules.
3. **[Error taxonomy & interpretation](#error-taxonomy--interpretation)** (below) — how to read `jobName`, the `[P0 Error]` / `[P1 Error]` tags, and the message prefixes.
4. **[Appendix: Better Stack logs MCP runbook](#appendix-better-stack-logs-mcp-runbook)** (below) — runtime source resolution, query instructions, and copy-paste SQL.

> **Important caveat from the wiki:** production live UW → ClickHouse ingestion runs in a separate Cloudflare worker service (`tradingflow-cfworker-service`), with `SYNC_UW_DATA_ENABLED=false` on this EC2 process. So some `UnusualWhalesClient` lifecycle errors may originate from local/dev runs, and the `SyncUwClickHouseHeartbeat` behavior on EC2 may differ from the worker. Confirm `environment` and host before assuming an EC2 ingestion outage.

## Default scope

Unless the user overrides:

| Dimension | Default |
| --- | --- |
| Time window | Last **24 hours** (`dt > now() - INTERVAL 24 HOUR`) |
| Service | `service = 'tradingflow-process-service-ec2'`, `environment = 'production'` |
| Better Stack logs source | **Resolve at runtime** via `telemetry_list_sources_tool` (filter name `process`). Last observed: name **`Process Service[Production]`**, **`source_id = 533318`**, table **`t203847.process_service`**, data region `eu-fsn-3`. IDs can drift — report the one you actually used. |
| Better Stack Uptime | **Resolve at runtime** via `uptime_list_heartbeats_tool`. Last observed: **`Process Service Heartbeats`** (`461787`) and an ingest/streaming heartbeat (`463212`, last seen **Down**). Map by name; do not hardcode. |
| Errors application | **None.** `telemetry_list_applications_tool` returns no application for this service; errors are `level="error"` rows in the logs source. |

## MCP contract

### Non-negotiables

1. **Read the live query instructions before the first SQL call** — `telemetry_get_query_instructions_tool({ id: <source_id>, source_type: "logs" })`. It is the source of truth for collection names (`remote(...)`, `s3Cluster(...)`), the `raw` JSON field catalog, and `JSONExtract` rules.
2. **Never invent** query results, counts, or stack traces. If MCP is unavailable, state the blocker and point to the Discord error channel / Sentry as the manual fallback.
3. **Do not paste huge JSON / full log dumps** — summarize; cite `_pattern`, `jobName`, counts, and `last_seen`.
4. **Read-only.** Do not change observability config, resolve/ignore anything, or mutate Better Stack state.

### Better Stack tools used

- `telemetry_list_sources_tool` (filter `name: process`) — resolve the logs `source_id`. **Call first.**
- `telemetry_get_query_instructions_tool({ id, source_type: "logs" })` — field catalog + collection names. **Before any SQL.**
- `telemetry_get_source_fields_tool({ id, source_type: "logs" })` — full queryable field list when you need a field not in the catalog.
- `telemetry_query({ query, source_id, table })` — run ClickHouse SQL. `table` is the dotted table name (e.g. `t203847.process_service`); the FROM clause uses the **collection** function, not the table.
- `uptime_list_heartbeats_tool` — list heartbeat monitors and their `up`/`down`/`paused` status.
- `uptime_get_heartbeat_tool` / `uptime_get_heartbeat_availability_tool` — detail + availability for a specific heartbeat id.
- `uptime_list_monitors_tool` — only if the user asks about HTTP uptime monitors beyond heartbeats.

> **Do not use** `telemetry_list_errors_tool` / `telemetry_get_errors_query_instructions_tool` here — those target a Sentry-backed Errors application, which this service does not have.

### Hot vs cold storage

Better Stack splits log storage:

- `remote(t203847_process_service_logs)` — **only the last ~30 minutes** (hot). An empty result here does **not** mean "no errors"; older rows are in S3.
- `s3Cluster(primary, t203847_process_service_s3)` — everything **older than ~30 minutes**. Must filter `_row_type = 1` (logs).
- For a window that runs up to "now" (e.g. last 24h), **`UNION ALL`** the two, or just query S3 for `-24h` (S3 covers all but the most recent ~30 min, which is usually fine for triage; UNION when "right now" matters).

## Better Stack logs workflow

The Master selects which phases the Subagent (or single agent) runs.

### Phase 0 — Resolve source

`telemetry_list_sources_tool({ name: "process" })` → pick `Process Service[Production]`; record `source_id` + table. Then `telemetry_get_query_instructions_tool({ id: <source_id>, source_type: "logs" })`.

### Phase 1 — Error overview (cluster ranking)

Goal: ranked clusters of `level="error"` for the window. Group by `jobName` + `_pattern`, with count, example message, and `last_seen`. Use the [Top error clusters query](#a-top-error-clusters-last-24h).

Interpretation: rank by (a) severity tag (`[P0 Error]` > `[P1 Error]`/`[P1]` > untagged), then (b) count, then (c) recency. A high count of `[P1]` Polygon/Alpaca fallback lines is usually **expected noise**, not a defect (see [Known steady-state noise](#known-steady-state-noise)).

### Phase 2 — Severity / P0 focus

Pull just the `[P0 Error]` lines for the window ([P0 query](#b-p0-errors-last-24h)). P0 means a critical failure or a fully-exhausted fallback. Every distinct P0 pattern should be explained or escalated.

### Phase 3 — Drill a cluster

For a chosen `_pattern` or `jobName`, pull recent raw rows with full context fields (`message`, `stack`, `errorName`, `errorCode`, `httpStatus`, `responseBody`, `event`, `reason`, `trigger`). Use the [Drill query](#c-drill-one-pattern--jobname).

### Phase 4 — Heartbeats

`uptime_list_heartbeats_tool`. Map by name to the two monitors this service pings (see [Heartbeats](#better-stack-uptime-heartbeats)). Report status; if any is `Down` or `pending`, cross-check the logs for `jobName IN ('BetterStackHeartbeat','SyncUwClickHouseHeartbeat')` and message `heartbeat request failed` ([Heartbeat-failure query](#d-heartbeat-request-failures)). A `404`/`4xx` on a heartbeat POST means the **heartbeat URL token is stale/deleted on Better Stack** (the monitor was recreated) — a config fix, not necessarily a process outage.

### Phase 5 — Correlate & rule out noise

Align clusters by time slice and `jobName`; map message prefixes to code via the wiki "Current Discord Send Map". Separate known steady-state noise. Decide confidence per cluster.

## Error taxonomy & interpretation

Every error row has `level="error"`, `service="tradingflow-process-service-ec2"`, an `environment`, a `jobName`, and a `message`. The message is prefixed by a module tag and (for actionable issues) a severity tag.

### `jobName` map (who emitted it)

| `jobName` | Component | Typical errors |
| --- | --- | --- |
| `UnusualWhalesClient` | UW websocket ingestion client (`src/syncUwData/`) | websocket lifecycle, late-trade drop spikes, write-buffer/drain, ClickHouse insert failures, `[P0]` symbol-meta gaps, index-quote `[P1]/[P0]` fallback |
| `SyncSymbolMetaService` | Nightly symbol-meta job (7:00 PM ET) | `[P1]` Alpaca-history / Polygon-aggregates provider fallbacks, empty-map / threshold breaches |
| `FetchOptionChainDataService` | Option-chain job (6:30 AM ET) | provider storms, empty HV map, threshold breaches, fatal service errors |
| `CheckCFServiceDataController` | CF-worker watchdog (30s ping / 5m watchdog / 60m no-data) | ping timeout, socket errors, "No data received from CF WebSocket for ~N minutes" |
| `BetterStackHeartbeat` | Process-liveness heartbeat (every 5m) | `heartbeat request failed` (HTTP error on the Uptime POST) |
| `SyncUwClickHouseHeartbeat` | Ingest-health heartbeat (every 5m when eligible) | `heartbeat request failed` (often 404 = stale URL token) |
| maintenance (`deleteOldData`, `cleanupLogs`) | scheduled cleanup | delete-task / unlink / dir-read failures |

### Severity tags (rank order)

- **`[P0 Error]`** — critical failure or a *fully exhausted* fallback chain (e.g. `symbol metadata unavailable for non-index XXX; dei forced to 0`, `index quote refresh TOTAL FAILURE`). Always explain or escalate.
- **`[P1 Error]` / `[P1]`** — a degraded primary with a working fallback (e.g. "Alpaca History failed ... fallback Longport", "Longport index quote primary failed; engaging Polygon fallback", "Massive/Polygon returned no daily bars ... fallback Alpaca"). Actionable but not request-breaking; **high volume of these is often expected** during a provider hiccup or for thinly-traded symbols.
- **Untagged error** — lifecycle / health / heartbeat failures (e.g. "high late-trade drop rate", "first option_trades message not received", "heartbeat request failed", "No data received from CF WebSocket").

There is **no warning level** by design; "warning-ish" anomalies are either `error` (threshold breach) or roll up into `info` summaries.

### First-seen dedupe (don't double-count)

Recurring per-symbol issues in hot loops log **first-seen per `issueKind + symbol + ET day`** and then suppress repeats (counts roll into the runtime + market-close `info` summaries). So a single `[P0]`/`[P1]` line for symbol `XXX` may represent many suppressed occurrences. Use the `info` summary fields (`symbolIssueTotalToday`, `symbolIssueSuppressedRepeatsToday`, `symbolIssueCountsByKind`, `topSymbolIssues`) for true volume — see [Runtime-summary query](#e-runtime--health-summary-info).

### Known steady-state noise

Call these out explicitly; do **not** rank them as P0 defects by default:

- **`SyncSymbolMetaService [P1] Massive/Polygon returned no daily bars for <SYM>, fallback Alpaca`** and **`[P1 Error] Alpaca History failed for <SYM> ... 403 ... fallback Longport`** — expected provider-fallback chatter during the nightly meta job, especially for thinly-traded / structured symbols. A burst of dozens of distinct symbols in the 7–8 PM ET window is normal **if** the job's completion summary reports success. Escalate only if the fallback also fails (look for a paired `[P0]`) or the unhappy-count threshold trips.
- **`UnusualWhalesClient` index-quote `[P1]` fallback lines** — Longport→Polygon index-quote degradation; expected when Longport is briefly unavailable. Escalate to `[P0]` only on TOTAL FAILURE.
- **`[P1]` per-symbol reference-price / proxy / stale-quote lines** — first-seen degradation, deduped per ET day.

### Real-defect signals (rank up)

- Any **`[P0 Error]`** pattern (symbol-meta gap forcing `dei=0`, index-quote total failure, total provider exhaustion).
- **`heartbeat request failed`** (esp. `404` — stale Uptime URL) — alerting blind spot; fix the token/monitor.
- **`high late-trade drop rate`** crossing the threshold repeatedly — ingestion lag / backpressure.
- **`first option_trades message not received within Nms after restart`** — reconnect/subscribe failure.
- **`No data received from CF WebSocket for ~N minutes while market is open`** — upstream CF-worker outage.
- Write-buffer **overflow drops** / **drain stuck** / **insert failure** — data-loss risk.

## Better Stack Uptime heartbeats

Separate from logs. Two monitors are pinged by this service (URLs in `src/utils/betterstack-heartbeat.ts`):

- **Process liveness** — `BetterStackHeartbeat`, posts every 5 min (token `hBWssf343Zvr6KeQBtW8et64`). Last observed monitor: **`Process Service Heartbeats`** (`461787`).
- **Sync UW ClickHouse ingest** — `SyncUwClickHouseHeartbeat`, posts every 5 min **only when ingest is healthy** (recent nonzero raw **and** aggregate ClickHouse write during an open/extended session). As of 2026-06-22 it shares the **same** monitor/token as the process heartbeat above (`hBWssf343Zvr6KeQBtW8et64`, monitor `461787`) — the old dedicated ingest monitor (`3QB5QMqs8TeZgmoKEb4uYnZV`) was deleted and 404-spamming. Because both heartbeats now ping one monitor, the monitor is effectively a **process-liveness** signal; it is **not** an independent ingest-health alarm until a separate ingest monitor is recreated. Missed pings are otherwise **intentional** when the session is closed, the socket is not open, or no full write happened in the last ~6 min.

Check with `uptime_list_heartbeats_tool`; map by name; report `up`/`down`/`pending`. Cross-check a `Down`/failing heartbeat against the `heartbeat request failed` error logs ([D](#d-heartbeat-request-failures)). A POST returning **404** means the heartbeat URL token no longer exists on Better Stack (monitor deleted/recreated) → the code is pinging a dead URL → **update the token in `betterstack-heartbeat.ts`** (or recreate the monitor). This is a monitoring-config bug, distinct from an actual ingestion failure.

## Observability routing check

Run only when the user asks whether errors/info are captured correctly, or when a cluster appears in one sink but not another.

**Policy source:** `/Users/evansmacbookpro/Desktop/Projects/tradingflow-process-service-ec2/wiki/domain-invariants/info-error-logging.md`.

**Expected routing (must match `src/utils/log.ts`):**

| Event | Expected sinks |
| --- | --- |
| `error` (`logErrorHandler` / `syncUwLogError`) | Better Stack logs (`level=error`) **+** Discord error webhook **+** Sentry.io — all three, best-effort, no fallback |
| `info`, `sendToDiscordInfo=true` (cron begin/end + market-close summaries) | Better Stack logs (`level=info`) **+** Discord info webhook |
| `info`, `sendToDiscordInfo=false` (runtime/heartbeat summaries) | Better Stack logs only |
| `localLogging` / `syncUwLocalDebug` | local stdout only (suppressed in production) |

**Repo audit commands** (run from `tradingflow-process-service-ec2` when code access is in scope):

```bash
rg -n "logErrorHandler|logInfoHandler|syncUwLogError|syncUwLogInfo|reportSyncUwIssue|sendBetterStack|discordProcessService|captureProcessServiceError" src/utils src/syncUwData -g '*.ts'
rg -n "console\.(log|error|warn|info)" src -g '*.ts' -g '!*.test.ts'   # expect none in prod paths
```

**Judge:** confirm no `console.*` in production paths, no direct transport calls from app code (must go through `logInfoHandler`/`logErrorHandler`), every catch in a job/lifecycle path logs before returning, and `{ jobName }` is present in context. Missing `BETTERSTACK_SOURCE_TOKEN` in prod is reported once via Discord+Sentry then Better Stack sends are skipped — so a sudden gap in Better Stack logs with healthy Discord/Sentry points at the token, not the code.

## Workflow phases (~24h)

Copy and track:

```
[ ] Phase 0  — Resolve Better Stack logs source (telemetry_list_sources_tool name=process) + read telemetry_get_query_instructions_tool
[ ] Phase 1  — Error overview: cluster level=error by jobName + _pattern for the window (query A)
[ ] Phase 2  — P0 focus: pull [P0 Error] lines (query B); explain/escalate each distinct pattern
[ ] Phase 3  — Drill: raw rows + context for the top/most-suspicious pattern(s) (query C)
[ ] Phase 4  — Heartbeats: uptime_list_heartbeats_tool; map by name; cross-check heartbeat-failure logs (query D)
[ ] Phase 5  — Correlate + rule out known steady-state noise; set confidence per cluster
[ ] Phase O  — (if asked) Observability routing check vs src/utils/log.ts contract
[ ] Phase F  — Targeted repo read only when evidence points at a code path (read the two wiki docs first)
[ ] Phase G  — Deliverable: structured report + fix plan + verification signals (no implementation)
```

**Correlation priority:** same **time slice** → **`jobName`** → **severity tag** (`[P0]`/`[P1]`) → **`_pattern`** → **message prefix → code path** (via the wiki Send Map) → `event` / `errorCode` / `httpStatus`.

## Deliverable template

Skimmable in under ~3 minutes:

1. **Window & source** — `-24h` (or requested), resolved `source_id` + table actually used, region, and heartbeat monitor ids checked.
2. **Executive summary** — 2–4 bullets: overall health, dominant clusters, biggest risk, heartbeat status.
3. **Error clusters** — table: `jobName`, severity tag, `_pattern`, count, example message, `last_seen`. Rank P0 first.
4. **P0s** — each distinct `[P0 Error]` pattern with a one-line meaning and whether it is escalating.
5. **Heartbeats** — each monitor: name, id, status; note any `Down`/failing and the matching `heartbeat request failed` logs.
6. **Noise separated** — which high-count clusters are expected steady-state fallback chatter (cite [Known steady-state noise](#known-steady-state-noise)).
7. **Root cause** — per real cluster: hypothesis, confidence (high/medium/low), evidence (logs / heartbeat / code path).
8. **Observability routing** — only when requested or a sink is unexpectedly silent.
9. **Fix plan** — smallest safe change first; name files/areas (point at the wiki Send Map row); for UW issues read `sync-uw-data.md` first.
10. **Verification signals** — the exact pattern / message / `jobName`+severity that should drop after the fix, and the query to re-run.
11. **Blockers** — MCP down, missing token, region/host ambiguity (EC2 vs cf-worker), etc.

## Boundaries (mandatory)

- **Investigate only.** Produce a triage report and a fix plan. Do **not** implement code, edit observability config, change Discord/Sentry/Better Stack routing, recreate heartbeats, or mutate Better Stack state. Each requires a **separate explicit user request** after they review the plan.
- **Read the wiki before code conclusions.** When evidence points at a code path, read `info-error-logging.md` and (for UW) `sync-uw-data.md` in the code repo before claiming behavior.
- **Don't substitute info-noise for triage.** Steady-state `[P1]` fallback chatter and runtime summaries are health context, not defects; don't rank them as P0.

---

## Appendix: Better Stack logs MCP runbook

### Before you query

1. **Resolve the source:** `telemetry_list_sources_tool({ name: "process" })` → `Process Service[Production]` → record `source_id` (last observed `533318`) and table (`t203847.process_service`).
2. **Read query instructions:** `telemetry_get_query_instructions_tool({ id: <source_id>, source_type: "logs" })`. Confirm the collection names — last observed:
   - hot (≤~30 min): `remote(t203847_process_service_logs)`
   - cold (>~30 min): `s3Cluster(primary, t203847_process_service_s3)` with `_row_type = 1`
3. **All fields live in the `raw` JSON column** — extract with `JSONExtract(raw, 'field', 'Nullable(<Type>)')`. Always use `Nullable(...)`. Key error fields: `level`, `message`, `service`, `environment`, `jobName`, `errorName`, `errorCode`, `stack`, `event`, `source`, `reason`, `trigger`, `httpStatus`, `heartbeatUrl`, `responseBody`. (Many `Int64` runtime-summary fields also exist for health checks.)
4. **Run with** `telemetry_query({ query, source_id: <source_id>, table: "t203847.process_service" })`. The FROM clause uses the **collection** function, never the bare table.

### A. Top error clusters (last 24h)

> Validated working 2026-06-22. Use `s3Cluster` for `-24h`; `UNION ALL remote(...)` if you need the last ~30 min too.

```sql
SELECT
  JSONExtract(raw, 'jobName', 'Nullable(String)') AS jobName,
  _pattern,
  count(*) AS cnt,
  any(JSONExtract(raw, 'message', 'Nullable(String)')) AS example_message,
  max(dt) AS last_seen
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 24 HOUR
  AND JSONExtract(raw, 'level', 'Nullable(String)') = 'error'
GROUP BY jobName, _pattern
ORDER BY cnt DESC
LIMIT 25
```

### B. P0 errors (last 24h)

```sql
SELECT
  dt,
  JSONExtract(raw, 'jobName', 'Nullable(String)') AS jobName,
  JSONExtract(raw, 'message', 'Nullable(String)') AS message
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 24 HOUR
  AND JSONExtract(raw, 'level', 'Nullable(String)') = 'error'
  AND JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%[P0 Error]%'
ORDER BY dt DESC
LIMIT 100
```

(For P1: swap `[P0 Error]` → `[P1`.)

### C. Drill one pattern / jobName

```sql
SELECT
  dt,
  JSONExtract(raw, 'message', 'Nullable(String)') AS message,
  JSONExtract(raw, 'errorName', 'Nullable(String)') AS errorName,
  JSONExtract(raw, 'errorCode', 'Nullable(String)') AS errorCode,
  JSONExtract(raw, 'httpStatus', 'Nullable(Int64)') AS httpStatus,
  JSONExtract(raw, 'event', 'Nullable(String)') AS event,
  JSONExtract(raw, 'reason', 'Nullable(String)') AS reason,
  JSONExtract(raw, 'stack', 'Nullable(String)') AS stack
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 24 HOUR
  AND _pattern = '<PATTERN_FROM_QUERY_A>'
ORDER BY dt DESC
LIMIT 25
```

### D. Heartbeat request failures

```sql
SELECT
  dt,
  JSONExtract(raw, 'jobName', 'Nullable(String)') AS jobName,
  JSONExtract(raw, 'httpStatus', 'Nullable(Int64)') AS httpStatus,
  JSONExtract(raw, 'heartbeatUrl', 'Nullable(String)') AS heartbeatUrl,
  JSONExtract(raw, 'message', 'Nullable(String)') AS message
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 24 HOUR
  AND JSONExtract(raw, 'jobName', 'Nullable(String)') IN ('BetterStackHeartbeat', 'SyncUwClickHouseHeartbeat')
  AND JSONExtract(raw, 'message', 'Nullable(String)') LIKE '%heartbeat request failed%'
ORDER BY dt DESC
LIMIT 50
```

### E. Runtime / health summary (info)

Liveness + true issue volume for `UnusualWhalesClient` (these are `level=info`, `event=runtime_summary` / `end_of_day_summary`):

```sql
SELECT
  dt,
  JSONExtract(raw, 'event', 'Nullable(String)') AS event,
  JSONExtract(raw, 'wsState', 'Nullable(String)') AS wsState,
  JSONExtract(raw, 'session', 'Nullable(String)') AS session,
  JSONExtract(raw, 'writeBufferDepth', 'Nullable(Int64)') AS writeBufferDepth,
  JSONExtract(raw, 'lateTradeDrops', 'Nullable(Int64)') AS lateTradeDrops,
  JSONExtract(raw, 'symbolIssueUniqueToday', 'Nullable(Int64)') AS issueUniqueToday,
  JSONExtract(raw, 'symbolIssueTotalToday', 'Nullable(Int64)') AS issueTotalToday,
  JSONExtract(raw, 'lastAlpacaRefreshAgeMs', 'Nullable(Int64)') AS lastAlpacaRefreshAgeMs
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 24 HOUR
  AND JSONExtract(raw, 'event', 'Nullable(String)') IN ('runtime_summary', 'end_of_day_summary')
ORDER BY dt DESC
LIMIT 50
```

### F. Errors-per-hour trend (one jobName)

```sql
SELECT
  toStartOfHour(dt) AS hour,
  count(*) AS errors
FROM s3Cluster(primary, t203847_process_service_s3)
WHERE
  _row_type = 1
  AND dt > now() - INTERVAL 48 HOUR
  AND JSONExtract(raw, 'level', 'Nullable(String)') = 'error'
  AND JSONExtract(raw, 'jobName', 'Nullable(String)') = '<JOB_NAME>'
GROUP BY hour
ORDER BY hour DESC
```

### Last-observed baseline (informational; resolve fresh each run)

From a `-24h` run on **2026-06-22** (use as a sanity reference for "normal", not as ground truth):

- **`SyncUwClickHouseHeartbeat heartbeat request failed: ... status code 404` ×38** — **RESOLVED 2026-06-22**: the ingest heartbeat token (`3QB5QMqs8TeZgmoKEb4uYnZV`) was stale (its monitor was deleted on Better Stack). Repointed `SYNC_UW_CLICKHOUSE_HEARTBEAT_URL` in `src/utils/betterstack-heartbeat.ts` to the live shared monitor `hBWssf343Zvr6KeQBtW8et64`. These 404s should drop to zero after deploy — re-run [query D](#d-heartbeat-request-failures) to confirm. (Follow-up: independent ingest-health alerting needs its own monitor.)
- **`UnusualWhalesClient high late-trade drop rate` ×9** — watch; ingestion lag/backpressure when it recurs.
- **`first option_trades message not received within 60000ms after restart` ×3** — reconnect/subscribe timing.
- **`[P0 Error] symbol metadata unavailable for non-index <SYM>; dei forced to 0` (MOGA/BFA/HEIA/THYP)** — real P0 symbol-meta gaps; track distinct symbols/day.
- **`SyncSymbolMetaService [P1]/[P1 Error]` Alpaca-history 403 / Polygon empty-bars (many distinct symbols, ~10:30 AM ET)** — **expected** nightly provider-fallback chatter; escalate only if the job summary reports failure or the threshold trips.
- Heartbeat monitors observed: only `Process Service Heartbeats` (`461787`, Up) remains; the earlier `cf-service uwstreaming heartbeat` (`463212`) was deleted. Both code heartbeats (process + ingest) now ping `461787`.

### Manual fallback (MCP unavailable)

If Better Stack MCP is down: the same errors are in the **Discord error channel** (`prod-cron-errors` webhook) and **Sentry.io** (project `4505047635066880`). State the blocker; do not invent counts.
