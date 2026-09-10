# TradingFlow ClickHouse Access

Human operations reference for the TradingFlow ClickHouse Cloud database.

**Last verified live:** 2026-08-29

**Database:** `default`

This document records database users and ClickHouse RBAC roles. ClickHouse
Cloud organization/console members are a separate access system and are not
listed here.

## Operating model

A ClickHouse **user** is the identity and credential used to authenticate. A
ClickHouse **role** is the reusable authorization and settings bundle enabled
for that user. Every application runtime must have its own user and default
role. Never make a product runtime safer by assigning a restricted role to the
shared `default` user: `default` still retains `default_role` and its broad
administrative authority.

## Current user and role map

| Runtime / purpose | Database user | Default and enabled role | Status |
| --- | --- | --- | --- |
| TradingFlow web application | `tradingflow_app` | `tradingflow_app_readonly` | Live |
| Process service / UW production writer | `tradingflow_process_service` | `tradingflow_process_runtime` | Live |
| CF Worker replay and snapshot readers | `tradingflow_cfworker_service` | `tradingflow_cfworker_readonly` | Live; pre-migration `default` isolates fully drained on 2026-08-29 |
| Schema migrations and operator maintenance | `tradingflow_clickhouse_maintainer` | `tradingflow_schema_maintainer` | Break-glass / operator use only; never install in a runtime |
| OptionData portal historical SQL and option-chain APIs | `default` | `default_role` | **Open exception: must migrate to a dedicated read-only user** |
| Shared ClickHouse administrator | `default` | `default_role` with admin option | Break-glass administration; not for application runtimes |

All dedicated role assignments are default roles and have no admin option.

## Role contracts

### `tradingflow_app_readonly`

Used by `tradingflow-webapp-fullstack` as `tradingflow_app`.

`SELECT` only on:

- `default.AggregatedOptionTrades`
- `default.OptionChainTable`
- `default.SymbolMetaData`
- `default.mv_contract_rank_flow`

It has no database write, DDL, access-management, external-source, or grant
option capability. The webapp additionally applies per-query time, row, byte,
and memory limits in application code.

### `tradingflow_cfworker_readonly`

Used by `tradingflow-cfworker-service` as
`tradingflow_cfworker_service`.

`SELECT` only on:

- `default.RawOptionTrades`
- `default.AggregatedOptionTrades`
- `default.OptionChainTable`
- `default.SymbolMetaData`
- `default.mv_contract_rank_flow`
- Columns `active`, `database`, `partition`, and `table` from `system.parts`

The `system.parts` grant supports the bounded available-date catalog without
scanning the full option tape.

Role settings currently enforce:

| Setting | Current value / constraint |
| --- | --- |
| `readonly` | `2`, constant |
| `max_execution_time` | 300 seconds |
| `max_rows_to_read` | 1.2 billion |
| `max_bytes_to_read` | 20 GB |
| `max_result_rows` | 400,001 |
| `max_memory_usage` | 4 GB |

The 1.2-billion-row ceiling is temporary compatibility for the older
production available-date query. After the bounded `system.parts` source
change reaches production and query-log evidence confirms it, reduce the
ceiling to 100 million.

The Worker credential migration is complete: the last legacy `default` query
from pre-deployment isolates was observed at `2026-08-29 05:57:12 UTC`, and two
successive 10-minute windows were clean by `06:27 UTC`.

### `tradingflow_process_runtime`

Used by `tradingflow-process-service-ec2` as
`tradingflow_process_service`.

Core production permissions:

- `SELECT`, `INSERT`: `RawOptionTrades`, `AggregatedOptionTrades`,
  `OptionChainTable`, `SymbolMetaData`, and `mv_contract_rank_flow`.
- `SELECT`, `INSERT`: `OptionChainLatestInferred` and
  `OptionChainInferenceCheckpoint`.
- `SELECT`, `INSERT`: the current `theta_*` shadow, staging, state, reference,
  and cursor tables.
- `SELECT`: `HistoricalOptionIv30Backfill`.
- `SHOW TABLES`, `SHOW COLUMNS` within `default`.
- `SELECT` on `system.columns`, `system.parts`, and `system.tables` for bounded
  discovery, compatibility, and retention checks.
- `ALTER DELETE` plus `ALTER UPDATE(_row_exists)` on the raw, aggregate, and
  option-chain replacement/cleanup tables.
- `ALTER UPDATE` and `ALTER DELETE` on `SymbolMetaData`.
- `ALTER DELETE` on the generated inner storage table owned by
  `mv_contract_rank_flow` for partition retention.

ClickHouse Cloud implements lightweight `DELETE FROM` on the current
SharedMergeTree tables through the hidden `_row_exists` column. Do not replace
the narrow `ALTER UPDATE(_row_exists)` grants with global `ALTER`.

`mv_contract_rank_flow` owns an inner table named `.inner_id.<uuid>`. Recreating
the materialized view changes that UUID. Re-resolve the inner table and renew
the narrow retention grant before the next `deleteOldData` run.

Role settings currently enforce:

| Setting | Default | Maximum |
| --- | ---: | ---: |
| `max_execution_time` | 600 seconds | 600 seconds |
| `max_rows_to_read` | 1 billion | 2 billion |
| `max_bytes_to_read` | 10 GB | 100 GB |
| `max_result_rows` | 3 million | 3 million |
| `max_memory_usage` | 2 GB | 4 GB |

The process service has no `CREATE TABLE`, `DROP TABLE`, role administration,
external-source, or grant-option authority.

### `tradingflow_schema_maintainer`

Used only by `tradingflow_clickhouse_maintainer` for reviewed schema and repair
operations.

Within database `default` it has:

- `SELECT`, `INSERT`
- `ALTER TABLE`
- `CREATE TABLE`, `DROP TABLE`
- `TRUNCATE`, `OPTIMIZE`
- `SELECT` on `system.columns`, `system.parts`, and `system.tables`

It has no user/role administration, database creation/deletion, external-source
access, or grant option. Do not place this credential in the process-service,
Worker, webapp, or portal runtime environments.

## Known exception: OptionData portal

Netlify production currently resolves `CLICKHOUSE_USERNAME=default`. The portal
sets `readonly=1` and scan/result limits on individual HTTP requests, but those
are application-supplied settings—not a database authorization boundary. Anyone
holding the credential can omit them and inherit `default_role`.

Required follow-up:

1. Create a dedicated portal user and read-only role scoped to the portal's
   whitelisted historical and option-chain tables.
2. Validate production, deploy-preview, branch-deploy, and development contexts.
3. Rotate the Netlify username/password atomically.
4. Prove the portal query log uses the new user before removing its dependency
   on `default`.

Do not rotate or disable the shared `default` credential until this portal
migration and any remaining operator-script dependencies are proven complete.

## Credential locations

Never print, paste, commit, or place credentials in command arguments.

| Identity | Authoritative runtime storage |
| --- | --- |
| `tradingflow_app` | Webapp deployment environment variables |
| `tradingflow_process_service` | Production host-local `.env`, mode `0600` |
| `tradingflow_cfworker_service` | Wrangler secrets for test and production |
| `tradingflow_clickhouse_maintainer` | Operator-only macOS Keychain |
| OptionData portal `default` exception | Netlify environment variables |

Local Keychain service labels created during the migration:

- `TradingFlow ClickHouse process-service`
- `TradingFlow ClickHouse cfworker-service`
- `TradingFlow ClickHouse maintainer`

The runtime username is not secret, but its password and ClickHouse URL must be
handled as credentials.

## Safe verification

Per `agent-connect-mcp`, reuse preconfigured credentials, run one read-only
statement at a time, and request an explicit structured output format.

From the credential being audited:

```sql
SELECT
  currentUser() AS current_user,
  currentRoles() AS current_roles,
  enabledRoles() AS enabled_roles;
```

From an authorized administrative session:

```sql
SHOW GRANTS FOR tradingflow_app_readonly;
SHOW GRANTS FOR tradingflow_cfworker_readonly;
SHOW GRANTS FOR tradingflow_process_runtime;
SHOW GRANTS FOR tradingflow_schema_maintainer;
```

```sql
SHOW CREATE ROLE tradingflow_cfworker_readonly;
SHOW CREATE ROLE tradingflow_process_runtime;
```

Check recent identity use without scanning product tables:

```sql
SELECT
  user,
  http_user_agent,
  count() AS queries,
  max(event_time) AS last_seen,
  countIf(exception_code != 0) AS failed
FROM system.query_log
WHERE event_time >= now() - INTERVAL 15 MINUTE
  AND user IN (
    'default',
    'tradingflow_app',
    'tradingflow_process_service',
    'tradingflow_cfworker_service'
  )
GROUP BY user, http_user_agent
ORDER BY user, http_user_agent;
```

Use `SHOW GRANTS`/`CHECK GRANT` rather than a destructive mutation merely to
prove that an omitted privilege is denied.

## Change procedure

1. Inventory actual source operations and recent query-log behavior.
2. Create or alter the role before changing runtime secrets.
3. Grant the role to a unique service user and make it the default role.
4. Verify allowed reads/writes with bounded fixtures and confirm denied grants
   through `SHOW GRANTS` or `CHECK GRANT`.
5. Rotate test/staging credentials first, then production atomically.
6. Confirm current user/roles, application health, and query-log identity.
7. Preserve recoverable old secrets until the observation window closes.
8. Remove old runtime dependencies; do not drop the shared administrator while
   another product still uses it.

Do not give service roles `WITH GRANT OPTION`, access management, external table
functions, or database-wide privileges merely to fix one missing operation.

## Repository references

- `tradingflow-webapp-fullstack/ops/clickhouse-application-role.md`
- `tradingflow-process-service-ec2/wiki/domain-invariants/clickhouse-access.md`
- `tradingflow-process-service-ec2/ops/deploy-process-service.md`
- `tradingflow-cfworker-service/wiki/operation.md`
- `optiondata-portal/AGENTS.md` (`ClickHouse query safety`)
