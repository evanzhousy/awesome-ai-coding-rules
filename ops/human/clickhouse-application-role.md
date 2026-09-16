# ClickHouse Application Role

This document records the ClickHouse identity and database-level access boundary used by the
TradingFlow web application. It separates ClickHouse RBAC from the application-side SQL guards and
resource limits layered on top of it.

**Last verified:** 2026-08-28, using the repository's local/test and production-mode credential
sources against the live ClickHouse service. Both resolved to the same user, database, and active
role.

## Current access contract

| Property          | Current value                                       |
| ----------------- | --------------------------------------------------- |
| ClickHouse user   | `tradingflow_app`                                   |
| Current database  | `default`                                           |
| Granted role      | `tradingflow_app_readonly`                          |
| Current roles     | `tradingflow_app_readonly`                          |
| Enabled roles     | `tradingflow_app_readonly`                          |
| Direct user grant | `GRANT tradingflow_app_readonly TO tradingflow_app` |

The role holds exactly these grants:

| Privilege | Object                           |
| --------- | -------------------------------- |
| `SELECT`  | `default.AggregatedOptionTrades` |
| `SELECT`  | `default.OptionChainTable`       |
| `SELECT`  | `default.SymbolMetaData`         |
| `SELECT`  | `default.mv_contract_rank_flow`  |

No `INSERT`, `ALTER`, `CREATE`, `DROP`, or other write privilege is granted. The role also has no
`SELECT` privilege outside the four named tables. ClickHouse access control is allow-list based, so
an omitted grant is denied at the database layer.

## Configuration ownership

The server reads the connection from these environment variables:

- `CLICKHOUSE_URL`
- `CLICKHOUSE_USER`
- `CLICKHOUSE_PASSWORD`

The application does not set a separate database option. The database is resolved from
`CLICKHOUSE_URL` and currently resolves to `default`.

Relevant implementation:

- [`src/server/core/config.ts`](../src/server/core/config.ts) owns the server-only environment getters.
- [`src/server/providers/clickhouse/index.ts`](../src/server/providers/clickhouse/index.ts) creates the
  shared ClickHouse client and exports the four tables read by the app.
- [`src/server/providers/clickhouse/readOnlyExec.ts`](../src/server/providers/clickhouse/readOnlyExec.ts)
  owns the shared read-only SQL execution profiles and per-query limits.
- [`src/lib/recipes/sqlSafety.ts`](../src/lib/recipes/sqlSafety.ts) owns the lexical SQL safety check.

Credentials must remain in environment configuration. Never commit, print, paste into a command,
or record the URL/password in an operations report.

## Layered safety model

The role and the application guards solve different problems.

### 1. ClickHouse RBAC is the authorization boundary

`tradingflow_app_readonly` determines which objects the app can read and prevents database writes.
This is the primary security boundary. A SQL string cannot bypass a missing ClickHouse grant.

### 2. The SQL guard is defence in depth

The application permits only one read-only statement and rejects mutating keywords, external data
functions, and `INTO OUTFILE`. This guard is intentionally conservative and is not a full SQL parser.
It must not be treated as a substitute for the ClickHouse role.

### 3. Application settings bound permitted query cost

The role itself currently has no configured value for `readonly`, `max_execution_time`,
`max_result_rows`, `max_result_bytes`, or `max_memory_usage`; each reported `0` with `changed = 0`
during the 2026-08-28 live check.

The shared application client applies:

- 10 maximum open connections
- 30-second HTTP request timeout
- 60-second ClickHouse execution ceiling
- cancellation of HTTP read-only queries when the client disconnects

The MCP ad-hoc SQL, published MCP skill, and recipe SQL paths apply the tighter shared
`READONLY_QUERY_SETTINGS` profile:

| Setting                | Value      |
| ---------------------- | ---------- |
| `readonly`             | `2`        |
| `max_execution_time`   | 30 seconds |
| `max_result_rows`      | 100,000    |
| `result_overflow_mode` | `throw`    |
| `max_result_bytes`     | 100 MB     |
| `max_memory_usage`     | 4 GB       |

`readonly = 2` permits read queries and per-request setting changes. It is not an authorization
grant and does not override the database role's table/write restrictions.

Ad-hoc SQL adds a default 200-row return limit and clamps caller-requested limits to 1,000 rows.
Recipe SQL relies on the shared ClickHouse settings because authored recipes may already contain a
top-level `LIMIT`.

## Safe verification procedure

Per `agent-connect-mcp`, reuse preconfigured credentials and request an explicit structured output
format. Do not ask for credentials when the repository or deployment environment already provides
them, and do not put passwords directly in shell history.

Run each statement separately through a preconfigured ClickHouse client:

```sql
SELECT
  currentUser() AS current_user,
  currentDatabase() AS current_database,
  currentRoles() AS current_roles,
  enabledRoles() AS enabled_roles;
```

```sql
SHOW GRANTS;
```

```sql
SHOW GRANTS FOR tradingflow_app_readonly;
```

To confirm whether resource limits have moved into the database user/role/profile:

```sql
SELECT name, value, changed
FROM system.settings
WHERE name IN (
  'readonly',
  'max_execution_time',
  'max_result_rows',
  'max_result_bytes',
  'max_memory_usage'
)
ORDER BY name;
```

Use the grant list as proof of the allow-list boundary. Do not attempt a live `INSERT`, `ALTER`,
`CREATE`, or `DROP` merely to prove that writes fail.

## Evidence boundary

A check using repository credential sources proves the identity and grants attached to those
credentials at query time. It does not by itself prove that an externally deployed runtime currently
has the same environment values. For an incident or release audit, verify the deployed environment's
configured username separately, then run the same read-only identity and grant checks from that
runtime or its exact credential source.

## Change checklist

When the application starts reading another ClickHouse table or the access policy changes:

1. Update the governing application table configuration and readers.
2. Change ClickHouse RBAC through the authorized infrastructure workflow; do not add credentials or
   grant-changing SQL to application code.
3. Re-run `currentUser()`, `currentRoles()`, `SHOW GRANTS`, and `SHOW GRANTS FOR` against every affected
   environment.
4. Confirm that no broader database- or schema-wide grant was introduced unintentionally.
5. Update this document's grant table and verification date in the same change.

Historical investigation and rationale are recorded in
historical evidence (`git show 7dcd7ad20ec19a3d6f8c51b8e85475d2cb5d873a:doc/domain-knowledge/prove-of-concept/ai-agent-harness-evaluation.md`).
