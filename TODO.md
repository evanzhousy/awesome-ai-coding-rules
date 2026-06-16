# TODO

## Retire `mv_contract_day_flow` → `mv_contract_rank_flow` — remaining work

Read-side disconnect (cfworker + webapp + portal readers/fallbacks) and the wiki docs are **done, deployed, and soak-verified clean** (2026-06-15: zero BFF/webapp reads of the legacy mart). **Decision (2026-06-16): the legacy table is kept frozen + unused — it is NOT dropped/deleted.** Only the writer cutover remains.

### process-service B1+B2 — DEPLOY + VERIFY (code committed, NOT deployed)

Committed on branch `decommission/mv-contract-day-flow-writer-b1b2` in `tradingflow-process-service-ec2`:
- **B2**: `fillContractStructureForDate` now writes **only** `mv_contract_rank_flow` — removed the `CONTRACT_STRUCTURE_SQL_V30` / `CONTRACT_PREV_OI_SQL_V30` INSERTs, the `rankFlowMartExists` dual-fill gate, and dead day_flow imports.
- **B1**: `assertContractStructureCoverage` verifies `mv_contract_rank_flow`, constrained to `OptionChainTable` contracts so flow-only rows don't inflate the coverage metric.
- tsc clean; `martStructureFill` + app-schedule + syncUwData tests green (23 pass).

- [ ] Deploy via pipeline (code → GitHub → deploy; B1 + B2 ship together or the scheduler throws every cycle).
- [ ] **Verify AFTER MARKET CLOSE** — the process-service fill/verify cycle runs post-close, so this cannot be verified intraday. On the next post-close run, confirm:
  - [ ] `assertContractStructureCoverage` passes against `mv_contract_rank_flow` (coverage ≥ min; no scheduler throw in `PreopenMetadataVolStructure.contractStructureCoverage`).
  - [ ] `mv_contract_day_flow` receives **no new writes** — `max(date)` stops advancing (table freezes at the last dual-fill date, then stays as inert history).
  - [ ] `mv_contract_rank_flow` keeps being filled (structure + prev_oi) with healthy coverage and no fill-step errors.

**Constraints:** no new env vars/flags (hard-code or gate on table existence); `code → GitHub → deploy`, test env first, no CLI prod mutations. The legacy `mv_contract_day_flow` table is **never dropped** — it stays in ClickHouse as frozen, unused history; keep the `syncUwData` preflight DESCRIBE intact (the table still exists).
