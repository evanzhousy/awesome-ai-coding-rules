# TODO

## Retire `mv_contract_day_flow` → `mv_contract_rank_flow` (decommission cleanup)

**Status:** in soak. Do NOT remove reader fallbacks yet — they are the soak-period safety net (documented invariant in webapp `data_schema.md:258` / `rank.md:135`).

**Gate (all must hold — per `webapp/scripts/clickhouse/ddl/010_decommission_mv_contract_day_flow.sql`):**
- [ ] Readers on `mv_contract_rank_flow` for **≥5 green trading days** since the 2026-06-11 flip (cross-mart parity, mart verifiers, product smoke all clean). ETA ~Thu 2026-06-18 (only Fri 6/12 elapsed as of 6/14).
- [x] **optiondata-portal migrated off `mv_contract_day_flow`** (precondition #2 — done & deployed: reads rank_flow, `close = latest_trade_price`, dex/dei/bullish/bearish removed, `startsWith(option_symbol, …)` prefix prune to stay under `max_bytes_to_read`).
- [ ] Follow-up code cleanup below ready to land.

**Decommission cleanup (human-run, post-soak — one deliberate pass; never delete the table before all readers are off it):**

- [ ] **cfworker** (`tradingflow-cfworker-service/src/contract-rank-snapshot/index.ts`): rewrite `resolveActiveContractMart()` to hard-code `{ table: rank_flow, version: v9 }` (drop the env-flag branch + the day_flow/v7 fallback; simplest = drop the `system.columns` probe). Remove `CONTRACT_RANK_FLOW_MART_ENABLED` from the Env interface + `wrangler.jsonc` (test + prod vars). KEEP the `MV_CONTRACT_DAY_FLOW_TABLE` const and the v7 type/serializer. Tests: re-point the two v7-shape tests + the flag-passing test to v9 (the v9 row query still contains `argMaxMerge(latest_trade_price)`, so `mockRebuildQueries` still matches); run vitest green. Deploy is human-run.
- [ ] **webapp** (`tradingflow-webapp-fullstack/src/server/services/contractFlowRankQueryService.ts`): hard-code `resolveContractFlowMvColumnCapabilities()` to the rank_flow success value; DELETE `resolveLegacyContractMartCapabilities()` + the catch-fallback; drop the `MV_CONTRACT_DAY_FLOW_TABLE` import. Delete the one "falls back to the legacy mart when missing" test (keep the rest). Dead-code: `hasContractDayFlowForDate` in `providers/clickhouse/index.ts`. KEEP table-name constants. Update the wiki (`data_schema.md`, `rank.md`) per AGENTS.md docs-maintenance. Caller is `src/server/marketRank.ts` (no edit needed).
- [ ] **process-service** (`tradingflow-process-service-ec2`) — NEEDS HUMAN SIGN-OFF (stops the dual-fill writer → ends lossless rollback; no retention job → table freezes). Atomically: repoint the `assertContractStructureCoverage` verifier (`verifiers.ts`) FROM day_flow → rank_flow AND drop the V30 fill statements (`service.ts`, `sql.ts`: `CONTRACT_STRUCTURE_SQL_V30` / `CONTRACT_PREV_OI_SQL_V30`). B1 + B2 MUST ship together or the scheduler throws every cycle. Consider constraining the coverage CTE to chain contracts (flow-only contracts survive `HAVING symbol != ''` on rank_flow and shift the metric's meaning, though only upward). KEEP the strict `syncUwData` preflight DESCRIBE until the table is actually dropped.
- [ ] **DROP** (`ddl/010`, human-run, irreversible — capture baseline `001` first), only after all readers are off day_flow and the writer is stopped.

**Constraints:** no new env vars/flags (hard-code or gate on table existence); `code → GitHub → deploy`, test env first, no CLI prod mutations; do NOT delete the table until the gate above is fully satisfied.
