---
name: error-investigate
description: Pulls recent production errors (default past 24 hours) from PostHog Error Tracking and Better Stack Errors, correlates evidence, states likely root causes with confidence, and produces a fix plan without speculative code changes. Use when the user asks for self-healing error triage, last-24-hours production errors, PostHog $exception issues plus Better Stack correlation, or a root-cause and remediation plan before implementation.
disable-model-invocation: true
---

# Error investigate (PostHog + Better Stack, ~24h)

Agent runbook for **recent production errors**—default **past 24 hours**—using **PostHog Error Tracking** (`$exception` issues) and **Better Stack** (Errors patterns + optional Telemetry logs). It is optimized for a **Master/Subagent** investigation loop: the Master owns the Goal and verifies evidence; the Subagent gathers bounded evidence and returns a triage report plus a fix plan. Do **not** implement code, change routing, resolve/suppress issues, or edit observability policy unless the user explicitly asks after the plan.

## Recommended Invocation

Use `/goal` for each production error triage:

- Objective: produce an evidence-backed `-24h` production error triage and smallest safe fix plan across PostHog Error Tracking and Better Stack.
- Success criteria: active fix verification backlog is checked first, PostHog/Better Stack access and schemas are resolved at runtime, EvidenceAudit is complete, and any confirmed backlog row is pruned from active state.
- Stop condition: the deliverable meets the criteria for success, source access is explicitly blocked, or the user authorizes a separate implementation/suppression step.

## Agent Handoff

Last updated: 2026-07-23

The `2026-07-22T18:23:55Z` through `2026-07-23T18:23:55Z` run completed against PostHog project `300646`, Better Stack Errors application `2412994`, and Better Stack Info source `2357910`. The Featurebase production-secret incident was operationally repaired by redeploying the exact current production release `0.2.1+c5fb68f` as Vercel deployment `dpl_5jNuZGZ9Mrjk7jXNq7QLsLSd55fS`, built `2026-07-23T19:31:12.154Z` and aliased to `app.tradingflow.com`. A direct unauthenticated `getFeaturebaseJwt` server-function probe reached the expected structured `401 AUTHENTICATED_FAILURE` instead of missing-secret validation, and Better Stack/PostHog had zero new `FEATUREBASE_JWT_SECRET` failures after the redeploy window began. Keep the row active until a full post-deploy window and authenticated production widget session pass.

Code fixes are committed on undeployed branch `codex/error-fixes-20260723`: `d455bf351` enables Featurebase under one shared kill switch in every environment, and `d4eb3d635` contains the KPI lazy-import failure, normalizes all observed TradingView vendor rejection variants, filters paired raw vendor exceptions before Better Stack/Sentry ingestion, and delays Featurebase post-boot actions until SDK readiness. Local browser regression rendered all six KPI summaries, a live TradingView ticker, Product Feedback, Messenger, and Updates with no boot-order warning. The remaining Featurebase warning says `identify` requires the Growth plan; treat that as an external Featurebase workspace/plan check, not as a missing-secret or boot-order code defect. The five `insertBefore` failures remain source-map/session-investigation work; no speculative DOM fix was made. The full unit suite has one unchanged baseline failure in `gexSurfaceMatrix.test.ts` (expected `0.23`, received `0.24389004272658707`).

## Goal

Produce an evidence-backed production error triage for the requested window that identifies dominant clusters, likely root causes, confidence, and the smallest safe fix plan without speculative code changes.

## Criteria for success

The investigation is complete only when all applicable checks pass:

1. **Sources checked** — PostHog Error Tracking and Better Stack Errors were queried for the same window, or a blocker clearly states which MCP/tool/schema was unavailable.
2. **Schemas respected** — MCP tool descriptors were read before first use, Better Stack IDs were resolved via `telemetry_list_applications_tool` / `telemetry_list_sources_tool`, and Better Stack Errors SQL was based on fresh `telemetry_get_errors_query_instructions_tool` output.
3. **Evidence cited** — Findings cite PostHog issue UUIDs and Better Stack `pattern` ids, plus counts/users/sessions/timestamps when the tools return them.
4. **Correlation attempted** — Clusters are aligned by time slice, then `correlationId`, `scope`, `operation`, `requestUrl`/route, stack top frames, and `channel` as available.
5. **Noise separated** — Known PostHog/rrweb/TradingView/deploy-skew noise is explicitly separated from product defects.
6. **Root cause confidence stated** — Each cluster has a high/medium/low confidence label with evidence from PostHog, Better Stack, and targeted repo reads where needed.
7. **EvidenceAudit recorded** — Each Subagent round has an `EvidenceAudit` line set (`post-deploy-backlog`, `posthog-access`, `posthog-list`, `posthog-detail`, `betterstack-errors`, `betterstack-logs`, `observability-set`, `repo-read`, `runbook-maint`, `none`) with ids and reasons.
8. **Observability setup audited** — When the task asks whether errors/info are being captured, run [Observability setup audit](#observability-setup-audit) before finalizing: verify the P0/P1 routing matrix, confirm no app-level `P2` priority is being assumed, inspect representative caught-error paths for `reportError` / `processApiResponseSystemError`, and name any intentional local-only catches.
9. **Fix and verification plan included** — The deliverable names likely files/areas to inspect or change, plus the exact PostHog/Better Stack signals that should drop after a fix. When [Active fix verification backlog](#active-fix-verification-backlog) has unconfirmed rows, **Verification** must report pass/fail against pre-fix baselines before net-new clusters.
10. **Boundaries preserved** — No code implementation, observability policy change, issue suppression, or Better Stack state update occurs unless the user explicitly expands scope.

## When to use

- User wants **last 24h** (or similar) error health, **clusters**, and **what to fix next**.
- Combine **PostHog** issue list/detail with **Better Stack** patterns, stacks, **Telemetry logs** (when more context is needed), and **info** trails (`correlationId`, `scope`, `operation`).
- **Self-healing** style: investigate → plan → hand off; verification steps only as **plan**, unless tasked to ship fixes.

## When not to use

- Pure product analytics, funnels, retention, dashboards, or `$pageview` questions; use [PostHog product analytics](../posthog/SKILL.md).
- One known local stack trace with no production-correlation need; debug the code path directly with the relevant domain docs.
- Requests to implement a fix immediately without evidence; first confirm the production signal or get explicit approval to skip triage.

## Read first (do not skip)

1. [`ops/harness/observability-rules.md`](../harness/observability-rules.md) — P0/P1, destinations, `channel`, structured diagnosis fields, what is error vs info.
2. **[PostHog Error Tracking workflow](#posthog-error-tracking-workflow)** (below) — issue list/search/detail, optional session replay, query defaults, and TradingFlow interpretation (channel, scope, known noise).
3. **[Appendix: Better Stack Errors MCP runbook](#appendix-better-stack-errors-mcp-runbook)** (below) — runtime **application_id** / **source_id** resolution, `telemetry_get_errors_query_instructions_tool`, `telemetry_query`, pattern drill-down.

If the task names product surfaces or routes, read the app repo's `AGENTS.md`, then resolve the current domain docs with `rg --files doc/domain-knowledge`. Canonical data concepts live in this rules repo at [`knowledge/basic_concepts.md`](../../knowledge/basic_concepts.md). Older guidance may mention `doc/knowledge/glossary.md`; if that file is absent, use `knowledge/basic_concepts.md` plus the relevant module's `domain-invariants.md` and `functionality.md`, and record path drift in **EvidenceAudit**.

4. **[Check first on every run](#check-first-on-every-run)** — pending post-deploy verification rows below; run before opening new clusters.
5. **[Runbook maintenance (post-deploy verification)](#runbook-maintenance-post-deploy-verification)** — how to add, check, and remove backlog rows after fixes ship.
6. **[Observability setup audit](#observability-setup-audit)** — required when the user asks whether logging/alerts are set up correctly or when a cluster appears silent in one source.

## Check first on every run

Before Phase 0 (Better Stack ID resolution) or a generic `-24h` triage, the Master **must** read [Active fix verification backlog](#active-fix-verification-backlog).

| Order | Action |
| --- | --- |
| 1 | For each **unconfirmed** backlog row, run its verification signals in the same `-24h` window (PostHog issue detail + Better Stack pattern metrics). |
| 2 | Report pass/fail per row in the deliverable **Verification** section. If all signals pass, move the row to [Resolved fixes (archive)](#resolved-fixes-archive) and remove it from the backlog **in the same session** (edit this runbook). |
| 3 | If a backlog row **fails** verification, treat it as the dominant follow-up for the round; do not re-open the same root cause as a “new” cluster unless evidence shows a different defect. |
| 4 | Only after backlog checks, proceed with [Workflow phases](#workflow-phases-24h) for net-new clusters. |

Skip backlog checks only when the user explicitly asks for a narrow question unrelated to shipped fixes (name the skip in `EvidenceAudit`).

## Active fix verification backlog

Rows track fixes that **shipped in code** but are **not yet confirmed in production**. Each row must include pre-fix baselines from the triage that motivated the fix so the next run can compare `-24h` counts without re-investigating.

| Fix | Shipped (repo) | Pre-fix baseline (-24h, triage date) | Verify first (same window) | Confirmed |
| --- | --- | --- | --- | --- |
| **TradingView ticker-tape duplicate raw vendor rejection suppression** — ticker-tape captures `invalid_symbol`, `no_such_symbol`, and `permission_denied` as one structured app `error.P1`, suppresses paired raw browser/Sentry events, and preserves configured/reported symbol context. | Undeployed branch `codex/error-fixes-20260723`, commit `d4eb3d635`. The integration-boundary classifier and capture listeners handle all three observed variants; the browser Sentry `beforeSend` drops only matching raw vendor exceptions. | 2026-07-08 pre-fix: legacy PostHog issue `019f3430-50f2-7201-bc2c-eaa20b6744a0` = 5 occurrences / 4 users / 4 sessions; Better Stack structured pattern `002542d631afc57ddc5d8034f2a34eb92e307ed39bb9b4b810fa091f69827999` = 4; raw `[tv] invalid symbol` pattern `904676ed82ffa77159cb99b64bc737ecd6063e8021d7cdb6a7004bbc402ebc1c` = 4. 2026-07-23 failed verification: legacy issue/patterns dropped to 0, but new structured PostHog issue `019f7c34-b504-7560-84dd-a9c63fc47738` and Better Stack pattern `01b3a0197b96206046afc5fc9e598c309c072220eaff2657490e5adb976d33f3` each had 3 events; paired raw patterns remained: `[tv] invalid symbol` `904676ed...` = 3, `no_such_symbol` `4aff24ed6231e81ae47aea3c090fe954ed1af3781985062c9eef0889ed216c36` = 4, and `Permission denied` `e0f898f8dfb659ba3849fea6f5b23d11a82cfe6f9a66fadb12cfe5c2f6778fbe` = 2. | After merge/deploy, confirm the production build contains `d4eb3d635`. Query structured issue `019f7c34-b504-7560-84dd-a9c63fc47738` and patterns `01b3a0197b96206046afc5fc9e598c309c072220eaff2657490e5adb976d33f3`, `904676ed82ffa77159cb99b64bc737ecd6063e8021d7cdb6a7004bbc402ebc1c`, `4aff24ed6231e81ae47aea3c090fe954ed1af3781985062c9eef0889ed216c36`, and `e0f898f8dfb659ba3849fea6f5b23d11a82cfe6f9a66fadb12cfe5c2f6778fbe`. Expected: one structured P1 per rejection and zero paired raw patterns. Confirm `configuredSymbolMappings`, `thirdPartyReportedSymbol`, and `thirdPartyErrorKind` are present. | No |
| **Featurebase production secret capture plus all-environment widget lifecycle** — the production deployment captures the signing secret, widgets stay enabled in every environment under one kill switch, and post-boot actions wait for SDK readiness. | Production secret repair: Vercel deployment `dpl_5jNuZGZ9Mrjk7jXNq7QLsLSd55fS`, release `0.2.1+c5fb68f`, built `2026-07-23T19:31:12.154Z`. Undeployed code: branch `codex/error-fixes-20260723`, commits `d455bf351` and `d4eb3d635`. | 2026-07-21 baseline: runtime PostHog issue `019f6e7f-02f3-7dd1-82a3-12167d49bba8` = 3 occurrences / 1 user and prerender issue `019f6e7d-1350-7420-b31f-b8601ef8e438` = 1 / 1. 2026-07-23 failed verification repeated the same 3 + 1 counts after the old build. Better Stack runtime pattern `f15aa1f01cefb21666111f37d863386cc1642cc4272c2e3becae6f4a6eb0ab5a` = 3, prerender pattern `ddef1a3858572331beee73930186be220182578392d58958df91fea6d88e4b00` = 1, and P0 `server.envValidation` log pattern `7707f99b0fd013a2a2ea656393547c43` = 4. | Production operational probe now reaches expected auth validation and no new secret failures appeared immediately after redeploy. Over a full post-deploy window, query both PostHog issues and all three Better Stack patterns; expected zero new rows. After `d455bf351` and `d4eb3d635` deploy, verify authenticated Product Feedback, Messenger, and Updates in production and a development/preview environment, with no `Messenger not initialized` warning. Separately confirm the Featurebase workspace supports authenticated `identify`; do not classify the Growth-plan warning as a secret regression. | No - immediate operational checks passed; full-window and authenticated checks pending |
| **Option Trades KPI lazy-import containment** — a `KpiCardProgress` chunk failure gets one bounded reload attempt, then an inline metrics-unavailable fallback and one structured P1 instead of six repeated AppErrorBoundary P0s. | Undeployed branch `codex/error-fixes-20260723`, commit `d4eb3d635`. | 2026-07-23: one KPI dynamic-import failure cascaded into six duplicate `KpiCardProgress` P0 boundary errors in the same affected flow. The source triage did not preserve a stable dedicated issue/pattern id, so verify by exact component/message plus `scope=optionTrades.marketStatusCards`. | After merge/deploy, confirm the production build contains `d4eb3d635`. Query PostHog and Better Stack for `KpiCardProgress`, `AppErrorBoundary`, dynamic-import/preload failures, and `scope=optionTrades.marketStatusCards`. Expected: zero repeated KPI/AppErrorBoundary P0s, at most one structured P1 for an exhausted recovery, the Option Trades rows remain usable, and the inline metrics-unavailable state appears when the lazy chunk is intentionally blocked. | No |

**Next run priority:** If any row is added here, Phase V (below) is **mandatory** before ranking new P0 clusters.

## Resolved fixes (archive)

Move rows here after verification passes. Keep one line each so future runs know what already dropped.

| Fix | Confirmed | Outcome |
| --- | --- | --- |
| **Contract Rank direct snapshot recovered-fallback diagnostics + server fallback type repair** — direct parse/fetch stages and recovered fallback tags remain diagnosable, while the server fallback query uses consistent `Float64` casts. | 2026-07-23 | Confirmed in live `-24h`: all three PostHog issues and all four Better Stack failure patterns were 0; six recovered P1 fallbacks had zero paired `contractFlowRank.snapshot` or `query:contractFlowRankSnapshot` P0s. The producer returned `contract_rank_snapshot_compact_v9`, `rc=293392`, `rc == r.length`, and tuple length `19`. |
| **Cross-platform missing-asset 404 handling** — stale hashed assets return a real immutable 404 before the SPA shell on Vercel and Netlify. | 2026-07-23 | Confirmed in live `-24h`: all four stale asset probes returned `404 text/html`; exact searches for those filenames were 0 in PostHog; Better Stack module/MIME and dynamic-import patterns were 0. The remaining generic PostHog fingerprint and nine Better Stack `network error` rows had no `/assets/` URL or matching filename, so they are transport/KPI evidence rather than an asset-routing regression. |
| **Auth provisioning gate + session heal** — `completeAuthLogin` returns `{ ok: false }` when register fails; **session heal** via `ensureSessionProvisioned` in `PostAuthFlowCoordinator` + Google `session_exists` path; billing gated until heal completes. | 2026-06-17 | Confirmed in live `-24h`: Better Stack `UserNotProvisionedError` / pattern `fe8e2c32` = 0; PostHog “account setup incomplete” / `USER_NOT_PROVISIONED` issues = 0; `auth_login_completed` with `session_heal=true` = 119 events / 29 users. |
| **Option Trades cold/live stats serialization behind rows** — rows remained the primary request and optional stats no longer competed during timeout-prone loads. | 2026-06-18 | Confirmed in live `-24h`: PostHog issue `019ece10-5bbc-7040-b2e1-6a8783992071` = 0 sampled events; Better Stack pattern `e1494dc8ae11d3adec3cbc7453fff06ff1ebb544b370a7e92efead72ad2e5af1` = 0; Better Stack Info `surface=option-trades` / `operation=fetchOptionTradesRows` / `requestStage=timeout_client` = 0. Separate `server_fn_transport` network failures remain tracked as a transport cluster, not this resolved timeout row. |
| **Preference server-function load normalization** — preference/watchlist Saved Filter server functions load through `loadNamedServerFunction` and import/export-access failures report `ServerFunctionLoadError` with structured `surface=preferences`, `requestStage=server_fn_load`, `failureKind=transient`, `serverModule`, and `serverExport` instead of raw destructuring exceptions. | 2026-06-22 | Confirmed in live `-24h`: PostHog issues `019ed88f-78d6-7a21-93ac-eca1de351b9f`, `019ed88f-78d6-7a21-93ac-ecb053e91fc1`, and `019ed82b-ed18-7083-85e2-ae56b61d4172` had no current impact rows; Better Stack exact patterns `90e2c3d8ac0bf0e6d5519be61fbb3f26418803fc000d4284528552996824e468` and `2f018277185b0c3222a4a711d85f184d7b57bd00e6ebb3a1108d8e7ac1367255` = 0; Better Stack message search for `Cannot destructure property` / `getWatchlist` / `getOptionTradesPreference` / `getSymbolCatalog` = 0; Better Stack Info `surface=preferences` / `requestStage=server_fn_load` = 0. |
| **Option Trades Live buffer-overflow summary telemetry** — live pending-buffer drops remain captured as P1 info but are aggregated into bounded summary events with per-stage drop counts. | 2026-06-24 | Confirmed in live `-24h`: Better Stack Info `scope=useLiveMode buffer overflow` / `operation=live_mode_buffer_overflow` emitted 343 summary rows with message `Dropped live buffer overflow summary; pending rows bounded`; rows carried `overflowEventCount`, `droppedCount`, `dripPausedDropCount`, and `pendingLimitDropCount`; aggregate summary represented 2,104 overflow events and total event-row volume dropped materially versus the 2,359-event pre-fix flood baseline. |
| **Option Trades access-tiered fetch request + timeout diagnostics** — unpaid rows/stats requests are coerced to the canonical public preview request and timeout events carry browser/client diagnostics. | 2026-07-01 | Confirmed in live `-24h` on production `0.2.1+78e6938`: Better Stack pattern `40f926ceec27f0789c6f75b5997b85585f3c8784fb9f59d2d1180f13df6a08b8` and access-guard `Paid access required` logs = 0; PostHog search for `Stats request timed out after 25s` = 0; rows timeout logs = 4, with the single post-deploy row carrying `clientTimeoutMs`, `timeoutDriftMs`, `documentVisibilityState`, `documentHidden`, `navigatorOnline`, `accessTier`, and `requestCoercedToPreview`. Remaining row timeouts are diagnosable operational events, not an unverified access-tier fix. |
| **TradingView ticker-tape invalid-symbol canonicalization + paired diagnostics** — NDX aliases are canonicalized before widget config and ticker-tape third-party invalid-symbol rows carry paired mappings. | 2026-07-08 | Confirmed in live `-24h`: old PostHog issue `019f1b9d-898d-7cf1-8495-26f0df9b9a6a` had 0 sampled events, old issue `019f1f0c-2a0f-7220-ba50-58e306f540f3` was not found in project `300646`, old Better Stack patterns `aa7332f87002488125e24c84372c7b27bb2989e31c94d2daf815b70f29d64599` / `bb0f6afe12034784f3dd15895acb0c584699730a2fbf1dc97219674185b069a2` were absent, and Better Stack Info `surface=tradingview` / `requestStage=symbol_validation` rows no longer contained `NASDAQ:NDXP` while carrying `configuredSymbolMappings`. Current valid-symbol TradingView rejects are a separate cluster. |

## Runbook maintenance (post-deploy verification)

This runbook is the **living checklist** for “did the last fix work in prod?” — not only for triage.

At the end of every triage or verification run:

1. Decide whether the run revealed a reusable lesson for future error investigations.
2. Promote durable lessons into source access, MCP workflow, noise rules, EvidenceAudit, backlog verification, or deliverable structure.
3. Keep transient state in [Active fix verification backlog](#active-fix-verification-backlog), [Self-maintained guidance from recent runs](#self-maintained-guidance-from-recent-runs), or the final report only.
4. Prune completed or obsolete backlog/guidance items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the deliverable.

Update this runbook when tool schemas, source IDs, event/error semantics, noise filters, verification signals, or recurring blockers drift. Do not update it for one-off counts, raw logs, temporary incidents, speculative fix ideas, or completed progress that belongs only in the report.

**When a fix ships (implementation session, after merge/deploy):**

1. Capture **pre-fix baselines** from the triage deliverable (PostHog issue UUIDs, Better Stack `pattern` ids, counts/users, triage date).
2. Add or update a row in [Active fix verification backlog](#active-fix-verification-backlog) with explicit **Verify first** signals and set **Confirmed** to **No**.
3. Do **not** add speculative checks; only signals that were in the original fix plan.

**On the next error-investigate run (or a dedicated post-deploy check):**

1. Master runs [Check first on every run](#check-first-on-every-run) — backlog before generic triage.
2. Subagent Phase V (optional dedicated round): query only backlog signals; compare to baselines; note deploy date if known.
3. Deliverable **Verification** section must state pass/fail per backlog row with current counts.

**When verification passes (or the user confirms in prod):**

1. Move the row to [Resolved fixes (archive)](#resolved-fixes-archive) with confirmation date and short outcome.
2. **Remove** the row from **Active fix verification backlog** so the next run does not re-check a closed item.
3. If the fix changed observability shape (new event names, Better Stack-only paths), leave a one-line note under **Resolved fixes** for historical context.

**When verification fails:**

1. Keep the row **unconfirmed**; update **Verify first** or baselines only if the investigation found new evidence.
2. Do not delete the row until confirmed or the fix is reverted.

**Prompt maintenance suggestion** in triage deliverables should call out backlog edits (`added row`, `confirmed and archived`, `needs baseline update`) when relevant.

## Observability setup audit

Use this section when the user asks to verify logging/routing, when an error appears in one source but not another, or when a fix plan adds/changes `reportError`, `reportInfo`, or `processApiResponseSystemError`.

**Policy source:** always read [`ops/harness/observability-rules.md`](../harness/observability-rules.md) first.

**Priority vocabulary:** the WebFullStack observability policy has only `P0` and `P1`; there is no app-level `P2` routing. If a prompt asks about `P2`, state that `P2` is not a valid app observability priority and map the intent to `P1` unless the policy doc changes.

**Expected routing matrix (must match `src/lib/observability/router.ts`):**

| Event | Expected sinks |
| --- | --- |
| `error.P0` | Discord error, PostHog `$exception`, Better Stack Telemetry error, Better Stack Errors/Sentry |
| `error.P1` | Discord error, PostHog `$exception`, Better Stack Telemetry error, Better Stack Errors/Sentry |
| `info.P0` | Discord info, Better Stack Telemetry info |
| `info.P1` | Better Stack Telemetry info only |

**Repo audit commands (run from `tradingflow-webapp-fullstack` when code access is in scope):**

```bash
rg -n "type Priority|const ROUTES|reportError|reportInfo|processApiResponseSystemError" src/lib/observability src/utils src/server src/platform src/services src/pages src/hooks -g '*.ts' -g '*.tsx'
rg -n "P2|reportError\\(|reportInfo\\(|processApiResponseSystemError\\(" src doc -g '*.ts' -g '*.tsx' -g '*.md'
rg -n "catch \\([^)]*\\) \\{|catch \\{|\\.catch\\(" src/server src/platform src/services src/pages src/hooks src/utils -g '*.ts' -g '*.tsx'
```

**How to judge setup:**

1. Confirm `src/lib/observability/types.ts` allows only `P0 | P1` and `src/lib/observability/router.ts` matches the routing matrix above.
2. Confirm `src/lib/observability/router.test.ts` has coverage for `info.P0`, `info.P1`, `error.P0`, and `error.P1`; if not, add or request a small test before claiming routing is verified.
3. For every caught failure in the suspected surface, classify it:
   - **User-flow breaks / intended action cannot complete** — should report `error.P0` through `reportError` or `processApiResponseSystemError` before returning an error response or showing a blocking toast.
   - **Recovered fallback / secondary path / operationally relevant but not request-breaking** — should report `error.P1` with small structured fields (`surface`, `operation`, `requestStage`, `correlationId` when available).
   - **High-signal successful operational checkpoint** — use `info.P0` only when humans should see it in Discord; otherwise use `info.P1`.
   - **Expected local-only catch** — acceptable only for best-effort browser storage, UUID generation, optional UI cleanup, product analytics failures, or observability sink self-protection. Name the rationale; do not call it "captured."
4. Check that handled server function failures are reported before returning `STATUS.ERROR`; uncaught server function failures should be covered by `serverFn.uncaught` as `error.P0`.
5. Check that `processApiResponseSystemError` callers do not accidentally hide user-blocking failures with `presentation: silent` / `inline` unless they explicitly set an appropriate severity and the UI has another visible failure state.
6. Check Better Stack Telemetry logs for the matching `surface`, `operation`, `requestStage`, and `correlationId` after deploy; PostHog is error-only, so missing `info` in PostHog is expected.

**Deliverable wording:** include an **Observability setup** subsection with:

- routing matrix verified/not verified
- priority vocabulary (`P0/P1 only`; no `P2`)
- code paths checked and whether each reports `P0`/`P1` correctly
- any silent catches and why they are acceptable or need a fix
- exact tests run, or a blocker if tests were not run

## Self-maintained guidance from recent runs

Update this section when an investigation exposes repeatable runbook friction, MCP schema drift, or source-access behavior that future agents should not rediscover.

Keep this section compact and reusable. Remove or rewrite entries when they become obsolete, are promoted into the main workflow, or stop helping future investigations.

- **2026-06-16 — PostHog plugin unavailable in Codex:** `tool_search` for PostHog / Error Tracking / HogQL exposed no usable PostHog query tools in this session. Treat this as a PostHog source blocker, not as zero PostHog errors. Do not substitute Chrome/browser UI unless the user explicitly asks for `@chrome` or approves that fallback.
- **2026-06-16 — Subagent requirement can be host-policy blocked:** this Codex host exposes multi-agent tools only when the user explicitly asks for delegation. When that policy applies, use the [Single-agent fallback](#master-loop), name it in **Blockers**, and still run schema reads, Better Stack ID resolution, and `EvidenceAudit`.
- **2026-06-16 — Better Stack `telemetry_list_errors_tool` schema drift:** the live tool rejected `per_page` even though the static tool schema advertised it. Retry `telemetry_list_errors_tool` with only `application_id`, `state`, `start_time`, `end_time`, `environment`, `release`, `query`, `order_by`, and `page`.
- **2026-06-16 — Historical Errors S3 collection missing:** `s3Cluster(primary, t203847_webfullstack_errors_2_s3)` failed with `NAMED_COLLECTION_DOESNT_EXIST`. For that run, metrics plus `telemetry_get_error_details_tool` and recent `remote(..._exceptions)` were valid evidence, but historical raw exception payloads were blocked until the Better Stack cloud connection is repaired.
- **2026-06-16 — Current resolved IDs:** `WebFullStack-Errors` resolved to application `2412994`; `WebFullStack-Info` resolved to source `2357910`. These are evidence from one run only; still resolve fresh every run.
- **2026-06-17 — Rank invariant doc path drift:** Some webapp repo guidance may still point to old Rank invariant/glossary paths. For Rank / Contract-level analysis / Symbol-level analysis clusters, resolve the path with `rg --files doc/domain-knowledge | rg 'rank|contract'`; current webapp checkouts use `doc/domain-knowledge/rank/domain-invariants.md` and `doc/domain-knowledge/rank/functionality.md`.
- **2026-06-24 — Missing asset paths can be masked by SPA fallback:** For dynamic-import, module-MIME, or stale-chunk clusters, probe the exact missing hashed asset with `curl -I https://app.tradingflow.com/assets/<hash>.js`. If it returns `200 text/html` from the SPA catch-all, treat that as a deploy-routing defect/noise amplifier and include a fix plan for Netlify asset-miss handling instead of only changing client error classification.
- **2026-06-25 — PostHog connected-project mismatch:** PostHog tools were available, but the live tool response pointed at project `90561` while this runbook expects TradingFlow project `300646`; specific historical issue lookups returned 404 in that connected project. Treat this as a PostHog source blocker for the expected project, not proof of zero PostHog errors, unless the connected project is corrected or confirmed to be the current TradingFlow project.
- **2026-06-26 — Cookbooks missing `recipes` relation is migration drift, not an empty-state bug:** If Better Stack shows `relation "recipes" does not exist` under `recipes.listMine`, `query:my-recipes`, or `serverFn.uncaught`, inspect `src/server/recipeStore.ts` and `src/server/db/migrations/0001_recipes.sql` / `0002_recipe_forked_from.sql`, then verify the production Neon migration runner (`pnpm db:migrate` / `scripts/db-migrate.mjs`) rather than suppressing the UI failure.
- **2026-06-28 — Option Trades client timeouts can be delayed by browser suspension:** For `Rows request timed out after 22s` / `Stats request timed out after 25s`, compare `elapsedMs` to `clientTimeoutMs`, inspect `document.visibilityState` or user-agent clues when available, and search the same `correlationId` in Better Stack Info before blaming ClickHouse. Mobile Safari/backgrounded tabs can fire timeout callbacks minutes late with no matching `data.fetchOptionTrades*.slow` or server error row.
- **2026-06-30 — PostHog issue titles can misclassify Option Trades timeout surfaces:** PostHog issue `019f11d7-6eff-7b02-b547-fdd21dff8478` was titled `Stats request timed out after 25s`, but sampled events carried `Rows request timed out after 22s` and Better Stack logs showed `operation=fetchOptionTradesRows`. For Option Trades timeout clusters, classify by event `value`, Better Stack `scope` / `operation` / `requestStage`, and route before assigning owner or fix area.
- **2026-07-16 — Asset-miss HTTP checks can pass before stale-session errors clear:** stale `/assets/*.js` probes may correctly return `404` while PostHog dynamic-import / `network error` issues remain active from open stale tabs or transport failures. Report these as separate checks: deployed routing behavior versus production error-volume clearance.
- **2026-07-16 — TradingView raw vendor rejections can beat component-level suppression:** the live bundle can contain the ticker-tape capture listener while Better Stack/Sentry still records raw `[tv]` unhandled rejections if the vendor/Sentry listener order wins or if the rejection code is outside `invalid symbol`. Verify both structured `surface=tradingview` Info/Error rows and raw `[tv] invalid symbol` / `no_such_symbol` / `Permission denied` patterns before confirming the fix.
- **2026-07-16 — Contract Rank direct meta path is `/snapshots/meta`:** browser direct-meta telemetry uses `/api/v1/contract-rank/snapshots/meta`, not `/latest-snapshot/meta`; probe that exact path when checking recovered meta fallbacks.
- **2026-07-21 — Parent and Subagent MCP inventories can differ:** The Master runtime advertised Better Stack tools while two fresh delegated workers did not. Under the mandatory Master/Subagent contract, record Better Stack as a delegated-source blocker, keep affected backlog rows pending, and do not reuse prior IDs or counts as current evidence.
- **2026-07-23 — Contract Rank latest-snapshot now redirects to an immutable object:** use `curl -sS -L` for producer-shape verification. The full compact payload can exceed the old 20-second budget; allow a bounded longer download when `rc == r.length` must be checked, or use a range request only for the `v` / `rc` prefix.
- **2026-07-23 — Reused PostHog fingerprints can mix unrelated failures:** before using an aggregate issue count to pass or fail a backlog row, sample exact exception messages and current URLs. This run's generic `network error` issue mixed ordinary transport events with one KPI dynamic-import failure while all named stale asset filenames were absent.
- **2026-07-23 — Vercel project env presence does not prove a deployment captured the value:** after an env repair, verify the next production deployment by release/build timestamp and startup telemetry. `vercel env ls` still showed the Featurebase secret while the later `c5fb68f` deploy emitted missing-secret prerender and runtime validation failures.
- **2026-07-23 — Featurebase secret, boot, and plan failures are separate checks:** an unauthenticated JWT server-function probe should reach the expected auth failure rather than missing-secret validation, then telemetry must remain clear after the exact deployment timestamp. In browser verification, `Messenger not initialized` is an SDK-readiness defect, while `Identify functionality is available starting from the Growth plan` is a Featurebase workspace capability issue; do not merge these into one secret incident or suppress them together.

## Roles

### Master

- Owns the Goal, Criteria, scope, time window, `nextRoundBrief`, and stop conditions.
- Reads this runbook and required policy docs before delegation.
- Dispatches one bounded Subagent round at a time with paths, IDs to resolve, and deliverables—not pasted full file bodies or raw MCP JSON.
- Verifies the Subagent return against the Criteria and decides: stop, resume the same Subagent, or start a fresh Subagent with a failure digest.
- Keeps cost bounded: default **2 evidence rounds + 1 targeted-code-read round**, hard cap **maxTurns = 8** unless the user asks for deeper investigation.

### Subagent

- Performs the assigned investigation round only.
- Reads MCP schemas before tool calls and avoids invented results.
- Returns concise evidence: issue ids, pattern ids, queries/tool calls used, counts, blockers, and targeted repo paths.
- Does not implement fixes, edit observability config, suppress issues, or update Better Stack state.

## Inputs and outputs

**Inputs**

- User-requested time window; default is **past 24 hours**.
- Optional PostHog issue id, Better Stack `pattern`, route/surface, deploy time, or suspected feature.
- Enabled production evidence tools: PostHog plugin **`@posthog`** (`plugin://posthog@openai-curated-remote`; older Cursor MCP ids may appear as `plugin-posthog-posthog` or `user-posthog`) and/or Better Stack (`user-betterstack`).
- Optional: [Active fix verification backlog](#active-fix-verification-backlog) rows to confirm before net-new triage.

**Outputs**

- Structured triage report using the [Deliverable template](#deliverable-template).
- Fix plan with likely files/areas and explicit verification signals.
- Blocker list when MCP access, schemas, logs, or product context are missing.

## Default scope

Unless the user overrides:

| Dimension | Default |
| --- | --- |
| Time window | Last **24 hours** (`date_from`: `-24h` in PostHog; `dt BETWEEN now() - INTERVAL 24 HOUR AND now()` in Better Stack) |
| PostHog | Production **app.tradingflow.com** — project id **300646** (if MCP is bound elsewhere, **state the project** in the deliverable) |
| PostHog issues | `status`: `active`; sort by `occurrences` or `last_seen` per question |
| Better Stack | **Resolve IDs at run time.** Call **`telemetry_list_applications_tool`** (filter `name`: `WebFullStack`) and **`telemetry_list_sources_tool`** at the start of each investigation; use the returned **`application_id`** for **WebFullStack-Errors** and the **`source_id`** for **WebFullStack-Info** in this round. Last observed values were `2412994` (Errors) and `2357910` (Info), but they are **not** canonical — the Subagent must report the IDs it actually used. SQL workflow in [Appendix](#appendix-better-stack-errors-mcp-runbook). |

## MCP contract

### Non-negotiables

1. **Read tool descriptors / live tool schemas** before the first call for that tool. For **`@posthog`**, follow the PostHog plugin skill first, then discover the live tools the connected app exposes; do not assume stale tool names. For older Cursor MCP bundles, descriptors may live under `mcps/plugin-posthog-posthog/tools/<tool>.json` or `mcps/user-posthog/tools/`. For Better Stack, use the host MCP schema / `mcps/user-betterstack/tools/<tool>.json`.
2. **Never invent** query results, stack traces, or issue counts if MCP is unavailable—state the blocker and point to manual UI steps in the linked docs.
3. **Do not paste huge JSON**—summarize; cite **PostHog issue UUIDs** and **Better Stack `pattern`** ids for follow-up.

### PostHog (`@posthog` plugin / `plugin-posthog-posthog` / `user-posthog`)

Primary path in Codex is the **PostHog plugin**: **`@posthog`** / `plugin://posthog@openai-curated-remote`. Use it before falling back to browser UI inspection.

Required access sequence:

1. Read the PostHog plugin skill (`PostHog:posthog`) and follow its workflow: confirm project, date range, and error-investigation scope.
2. Discover the live PostHog tools exposed in this session (for example with tool discovery for `PostHog`, `error tracking`, `$exception`, or `HogQL`). The connected app may expose different tool names over time.
3. If Error Tracking tools are exposed, use them directly for issue list/detail/events.
4. If only a HogQL/query tool is exposed, use HogQL against `$exception` events only after confirming the available schema/properties in that tool. Useful fields usually include exception type/message, issue id, `$current_url`, `$pathname`, `channel`, `scope`, `tag`, session id, and timestamp.
5. If no PostHog tools are exposed, state a **PostHog plugin blocker** and ask to connect/re-auth the PostHog plugin. Do **not** silently replace `@posthog` with Chrome/browser UI; Chrome is only a manual fallback when the user explicitly asks for `@chrome` or approves that fallback.

Older host MCP id is often **`plugin-posthog-posthog`**, not `user-posthog`. If tools return `INVALID_API_KEY`, re-auth the PostHog plugin before triage.

- **`query-error-tracking-issues-list`** — list or filter issues. See [PostHog Error Tracking workflow](#posthog-error-tracking-workflow) for defaults (`status`, `dateRange`, `orderBy`, `limit`, `volumeResolution`) and common adjustments.
- **`query-error-tracking-issue`** — compact detail for one issue UUID.
- **`query-error-tracking-issue-events`** — sampled `$exception` events, URLs, `$session_id`.
- Optional: **`query-session-recordings-list`** when the user needs “what were they doing?” (see [Session context](#3-session-context-optional)).

### Better Stack (`user-betterstack`)

- **`telemetry_list_applications_tool`** / **`telemetry_list_sources_tool`** — call **first** to resolve the current **WebFullStack-Errors** `application_id` and **WebFullStack-Info** `source_id`. Do not hardcode IDs from prior rounds.
- **`telemetry_get_errors_query_instructions_tool`** with the resolved Errors `application_id` — **always** before writing Errors SQL; collection names and rules change.
- **`telemetry_query`** — run SQL from instructions with literal time bounds (no `{{start_time}}` placeholders in executed queries).
- **`telemetry_get_error_details_tool`** — when you already have a **`pattern`** from metrics.
- Optional log correlation: **`telemetry_get_query_instructions_tool`** for the resolved logs **source** (see [Appendix](#appendix-better-stack-errors-mcp-runbook)), then **`telemetry_query`** on the instructed **table** — **info** is Better Stack–primary per observability rules.
- **More context from Telemetry logs:** When PostHog or Errors data is not enough, use **Better Stack MCP** to pull **telemetry logging** for the same time window—call **`telemetry_get_query_instructions_tool`** for the resolved **WebFullStack-Info** logs source, then **`telemetry_query`** as instructed. Treat matching log lines (including **`info`**-routed events that do not appear in PostHog) as **timeline and diagnosis context** around the error (`correlationId`, `scope`, `operation`, `requestUrl`, etc., per observability rules).
- **Auth provisioning P0 tags** (for example `auth.provisioning.gap`, `auth.provisioning.register`) appear in the **Errors application**, not WebFullStack-Info logs — do not expect them in Info log searches.

If historical **Errors** queries fail (e.g. missing S3 collection), follow **Before you query** in the [Appendix](#appendix-better-stack-errors-mcp-runbook) and [`ops/harness/observability-rules.md`](../harness/observability-rules.md) (cloud connection repair); do not guess SQL.

## PostHog Error Tracking workflow

The Master selects which of these steps the Subagent runs in `Round scope`. The Subagent runs only the selected steps and returns structured evidence.

### 0. Connect and discover `@posthog`

Use **`@posthog`** as the primary PostHog access path.

- Confirm the target is project **`300646`** / **`app.tradingflow.com`** and the requested date range.
- Discover the live PostHog tool surface before querying. Prefer first-class Error Tracking tools when present; otherwise use the plugin's HogQL/query tool if it is available and the schema supports `$exception` analysis.
- Record the exact PostHog tool names used in **EvidenceAudit** / **Sources queried**. If no PostHog plugin tools are exposed, record `posthog-list` and `posthog-detail` as `skipped-blocked` with the blocker `@posthog tools unavailable`.
- Only use Chrome UI inspection as a fallback when the user explicitly asks for `@chrome` or approves browser fallback. If Chrome is used, report the visible filters exactly (for example `dateRange=-24h`, `status=all`, project `300646`) and treat the UI result as manual cross-check evidence, not as MCP completion.

### 1. List or search issues

Call **`query-error-tracking-issues-list`** (list) or **`query-error-tracking-issue`** (single issue).

**Reasonable defaults** unless the user specifies otherwise:

- `status`: `active`
- `dateRange`: `{ "date_from": "-24h" }` for the default `~24h` triage; widen to `-7d` / `-14d` / `-30d` when comparing trends.
- `orderBy`: `occurrences`, `orderDirection`: `DESC`
- `limit`: `25`–`50`; use `offset` for pagination.
- `volumeResolution`: `0` when sparklines are unnecessary (smaller payload).

**Common adjustments**

- `searchQuery`: free text across exception type, message, stack.
- `status`: `resolved` / `all` when comparing regressions or cleanup.
- `orderBy`: `last_seen` / `first_seen` / `users` / `sessions` for recency or blast radius.
- `filterGroup`: only when essential (e.g. browser, geo); read schema for operators — do not add filters speculatively.

**HogQL fallback via `@posthog`**

Use only when the PostHog plugin exposes query/HogQL access but not Error Tracking issue tools. Start with a narrow schema-check query, then query `$exception` events for the same window. Keep the query bounded and summarize rows instead of pasting JSON. A typical shape is:

```sql
SELECT
  timestamp,
  uuid,
  distinct_id,
  properties.$exception_type AS exception_type,
  properties.$exception_message AS exception_message,
  properties.$exception_issue_id AS issue_id,
  properties.$current_url AS current_url,
  properties.$pathname AS pathname,
  properties.channel AS channel,
  properties.scope AS scope,
  properties.tag AS tag,
  properties.$session_id AS session_id
FROM events
WHERE
  event = '$exception'
  AND timestamp >= now() - INTERVAL 24 HOUR
ORDER BY timestamp DESC
LIMIT 100
```

If the plugin reports different property names, use the live schema from the tool response instead of this example.

### 2. Issue detail

When assignee, full description, or API-backed issue fields matter, call **`query-error-tracking-issue`** with the **`issueId`** (UUID) from the list. Use **`query-error-tracking-issue-events`** for stack traces and `$current_url`.

### 3. Session context (optional)

If the user asks what the user was doing, or wants replay context, use **`query-session-recordings-list`** filtered for **`$exception`** and the issue’s time range (see the `query-error-tracking-issue-events` tool description for session linkage).

## PostHog interpretation (TradingFlow)

- **`library: web`** and stacks under **`/assets/*.js`** → captured in the **browser** (PostHog JS or observability sinks that use `captureException`).
- **`properties.channel`**:
  - **`frontend`** — typical client **`reportError`** / unhandled exceptions.
  - **`backend`** — server observability errors sent as **`$exception`** (HTTP capture); list payloads may also show **`distinct_id`** like `backend:<scope>` from [server PostHog sink](../../../src/lib/observability/sinks/posthog.ts).
- Use **`scope`**, **`$pathname`**, **`$current_url`**, and **`tag`** (when present) to map issues to code areas. Routing of errors to sinks is defined in [router](../../../src/lib/observability/router.ts).
- **Backend SSR provisioning gaps** (`UserNotProvisionedError`, `reportProvisioningGap` / `requireUserByEmail` on `ssr.mjs`) are often **Better Stack–primary**; PostHog may show **zero** `channel=backend` issues while client **`AppError`** “account setup incomplete” (`USER_NOT_PROVISIONED`) correlates on the same routes. Correlate both sources for auth clusters.

### Known noise / false-positive patterns

Call out explicitly in the deliverable; do not treat as P0 app bugs by default:

- **`SecurityError`** reading **`Window`** / iframe properties with **`posthog-recorder.js`** / rrweb in the stack — often **session replay** crossing **cross-origin** iframes, not core app logic.
- **`Script error.`** with little detail — common on **WebKit / embedded browsers** when third-party scripts omit CORS headers.
- **`[tv]`** **`no_such_symbol`**, **`Permission denied`** — **TradingView** widget / symbol lifecycle; separate from core API unless correlated with bad inputs.
- **Dynamic import / `Failed to fetch` / `Load failed`** clusters often indicate **deploy skew**, **cache**, or **transport** failures (WebKit surfaces `TypeError: Load failed`, Chromium surfaces `Failed to fetch`); note environment (**app** vs **testapp**) from URLs in the payload.

**In-app PostHog `$exception` filtering:** [`src/lib/observability/sinks/posthog.ts`](../../../src/lib/observability/sinks/posthog.ts) skips sending exceptions that match `isPostHogExceptionNoise` in [`src/lib/observability/posthogExceptionNoise.ts`](../../../src/lib/observability/posthogExceptionNoise.ts) (recorder/rrweb, cross-origin `SecurityError`, bare `Script error.`, and `[tv]` patterns above). Those events still go to **Better Stack** and **Discord** via the normal error router. For issues captured **only** by PostHog autocapture (outside `reportError`), suggesting a matching **Error Tracking suppression rule** in the PostHog project UI is OK — actually applying it is **out of scope** for this skill.

## Master loop

**Mandatory execution shape.** When the user invokes this skill, the Master must **launch a bounded Subagent for evidence collection**. The Master does **not** perform PostHog or Better Stack querying inline; it owns scope, criteria, and verification. Doing the investigation inline violates the goal-driven contract and skips schema reads / context isolation.

1. **Set Goal and Criteria** — Read [Check first on every run](#check-first-on-every-run) and [Active fix verification backlog](#active-fix-verification-backlog). Confirm the window, default sources, and any named issue/pattern/surface. Set `turn = 1`, `maxTurns = 8` unless the user expands budget. For long investigations, record round state in a short task note or issue comment with paths and ids only.
2. **Prepare `nextRoundBrief`** — Fill the [Subagent prompt template](#subagent-prompt-template): time window, IDs to resolve, non-goals, allowed paths, and the specific phases the Subagent should run this round. If [Active fix verification backlog](#active-fix-verification-backlog) has unconfirmed rows, **include Phase V first**. Phase 0 starts with **`telemetry_list_applications_tool`** / **`telemetry_list_sources_tool`** to resolve current Better Stack IDs.
3. **Delegate one Subagent round** — Always start by **launching a fresh Subagent** with the brief. The Subagent reads required docs, reads MCP tool descriptors, runs the assigned PostHog / Better Stack tools, and returns structured evidence. Keep raw tool payloads out of the Master context; require summaries with ids and counts.
4. **Verify Criteria against the Subagent return** — Check whether sources, schemas, evidence, correlation, noise separation, observability setup (when requested), confidence, `EvidenceAudit`, and verification plan are complete. Also confirm the Subagent reported the **resolved Better Stack `application_id` / `source_id`** it actually used.
5. **Continue or stop**:
   - **Stop** when Criteria pass, `EvidenceAudit` is `none` for warranted follow-up, or a hard blocker is explicit.
   - **Resume the same Subagent** when the round found useful state but missed a bounded follow-up, such as one pattern detail or one log correlation query.
   - **Start a fresh Subagent** when the prior round drifted, guessed, pasted excessive raw JSON, or failed on setup; provide a **failure digest** with commands/tools attempted, paths, ids, and the last error.
6. **Hand off** — Deliver the report, `EvidenceAudit`, fix plan, verification signals, and **Prompt maintenance suggestion**. Implementation, suppression, or Better Stack state changes require a **separate explicit** user request after they review the plan.

**Single-agent fallback.** If the Master truly cannot delegate (no Task tool / Subagent runtime), it may run **one** evidence round inline, but it must say so explicitly in the deliverable’s **Blockers** section and still follow every other rule (schema reads, ID resolution, no inline implementation, no JSON dumps).

## Subagent prompt template

Use this as the bounded worker brief:

```text
You are the Subagent for a TradingFlow production error investigation.

Goal:
{{MASTER_FILLS: one-sentence goal for this round}}

Round scope:
{{MASTER_FILLS: phases to run, e.g. PostHog list + Better Stack top patterns + correlation}}

Turn:
{{MASTER_FILLS: turn N / maxTurns 8}}

Time window:
{{MASTER_FILLS: e.g. last 24 hours / exact UTC bounds}}

Allowed paths to read:
- ops/harness/observability-rules.md
- ops/webappp-fullstack/webapp-check-error.md (Check first, Active fix verification backlog, PostHog workflow, Appendix)
- {{MASTER_FILLS: any route/domain docs or targeted source paths}}

Backlog (check before net-new triage):
- {{MASTER_FILLS: unconfirmed rows from Active fix verification backlog, or "none"}}

MCP requirements:
- Read each tool descriptor before first use.
- Use **@posthog** (`plugin://posthog@openai-curated-remote`) as the primary PostHog path. Read the PostHog plugin skill, discover live PostHog tools, and prefer Error Tracking tools; use HogQL `$exception` queries only when issue tools are unavailable but query access exists.
- Older PostHog MCP ids may appear as plugin-posthog-posthog or user-posthog; use them only when those are the live exposed PostHog tools in this host.
- If no PostHog plugin tools are exposed, report `@posthog tools unavailable` as a blocker. Do not use Chrome UI fallback unless the user explicitly asked for @chrome or approved browser fallback.
- Use user-betterstack for Better Stack Errors/logs.
- Resolve Better Stack IDs first: call telemetry_list_applications_tool (filter name: WebFullStack) and telemetry_list_sources_tool, then use those ids for the rest of the round. Do not hardcode ids from prior rounds.
- Call telemetry_get_errors_query_instructions_tool before Better Stack Errors SQL.
- Do not invent results if MCP is unavailable; report blockers explicitly.

Non-goals:
- Do not edit code or docs.
- Do not change OBSERVABILITY_CONFIG or observability policy.
- Do not suppress, resolve, ignore, or update error state (no telemetry_update_error_state_tool).
- Do not propose or run code changes; the Master will request a separate session if needed.
- Do not paste huge JSON into the response.

Return:
1. Post-deploy backlog: pass/fail per unconfirmed row with current vs baseline counts.
2. Sources queried and tool/schema blockers, including the resolved Better Stack application_id and source_id used this round.
3. PostHog issue UUIDs with counts/users/sessions/timestamps when available.
4. Better Stack pattern ids with counts/timestamps and drill-down summary.
5. Correlation keys used: time slice, correlationId, scope, operation, requestUrl/route, stack top frames, channel.
6. Clustered likely root causes with confidence and evidence.
7. EvidenceAudit lines for phases run/skipped (post-deploy-backlog, posthog-access, posthog-list, posthog-detail, betterstack-errors, betterstack-logs, observability-set, repo-read, runbook-maint, none).
8. Observability setup audit when requested: P0/P1 routing, no app-level P2 assumption, info/error sink coverage, silent-catch review, tests/blockers.
9. Targeted repo paths worth reading next, if any.
10. Fix plan and verification signals (no implementation).
11. Runbook maintenance: backlog row added, archived, or unchanged.
12. Prompt friction or maintenance suggestion, if this runbook was ambiguous.
```

## Workflow phases (~24h)

The Master selects which phases the Subagent runs this round and lists them in `Round scope`. Copy and track:

```
[ ] Phase V — Post-deploy backlog: for each unconfirmed row in Active fix verification backlog, query listed PostHog issues + Better Stack patterns; compare to pre-fix baselines; report pass/fail (see Check first on every run)
[ ] Phase 0 — Better Stack: telemetry_list_applications_tool + telemetry_list_sources_tool to resolve current WebFullStack-Errors application_id and WebFullStack-Info source_id
[ ] Phase A0 — PostHog access: use @posthog first; read the PostHog plugin skill, discover live tools, and record whether Error Tracking tools or HogQL/query tools are available
[ ] Phase A — PostHog: list active issues in -24h; note top by occurrences or last_seen
[ ] Phase B — PostHog: retrieve detail for top N (or user-specified issue ids)
[ ] Phase C — Better Stack: refresh errors instructions for the resolved application_id; top patterns in same window (+ production filter when applicable)
[ ] Phase D — Better Stack: drill pattern(s) for stacks / raw fields; optional logs source for correlationId / scope / operation
[ ] Phase E — Correlate: align timestamps; map channel, scope, pathname, requestUrl; rule out known noise (see PostHog interpretation → Known noise section)
[ ] Phase O — Observability setup: when requested or when a signal is missing, verify router/tests, P0/P1 vocabulary, caught-error reporting, P0 info routing, and intentional local-only catches
[ ] Phase F — Code/docs: targeted repo read only when evidence points to a surface; for product/code interpretation follow AGENTS.md Mandatory Read Order (glossary + relevant doc/domain-knowledge/domain-invariants/* docs) before code reads
[ ] Phase G — Deliverable: structured report + fix plan + verification plan (no implementation; never call telemetry_update_error_state_tool)
```

**Correlation priority:** same **time slice** → **`correlationId`** → **`scope` + `operation`** → **`requestUrl`** / route → **stack top frames** → **distinct_id** shape (`frontend` vs `backend`).

## EvidenceAudit (required every round)

The Master writes one `EvidenceAudit` block after each Subagent return. It answers: **what evidence did this round cover, what did it skip, and why is that enough or not enough?**

```text
EvidenceAudit (turn N):
- post-deploy-backlog: <ran|skipped>  why=<reason>  rows=<backlog fix names checked>  result=<pass|fail|pending>
- posthog-access    : <ran|skipped>  why=<reason>  tools=<@posthog tool names or unavailable>  fallback=<none|chrome-approved|chrome-requested>
- posthog-list      : <ran|skipped>  why=<reason>  ids=<issue UUIDs or empty>
- posthog-detail    : <ran|skipped>  why=<reason>  ids=<issue UUIDs drilled or empty>
- betterstack-errors: <ran|skipped>  why=<reason>  ids=<pattern ids or empty>  app=<resolved application_id>
- betterstack-logs  : <ran|skipped>  why=<reason>  ids=<correlationIds/scopes or empty>  source=<resolved source_id>
- observability-set : <ran|skipped>  why=<reason>  paths=<router/types/tests/code paths checked>  result=<pass|fail|blocked>
- repo-read         : <ran|skipped>  why=<reason>  paths=<targeted paths read or empty>
- runbook-maint     : <ran|skipped>  why=<reason>  action=<archived confirmed row|added row|no change>
- none              : <reason>       (use when no further evidence is warranted)
```

Use `EvidenceAudit` like the auth E2E prompt uses `CoverageAudit`: it is the Master’s compact proof that the next decision is justified. A missing or vague `EvidenceAudit` means the Master should resume the same Subagent for the narrow missing piece, not finalize the investigation.

## Resources and round state

- Keep handoffs path-first: issue ids, pattern ids, query summaries, command/tool names, and short blockers.
- Store long-running progress outside chat when needed: a task issue, `GOAL.md`, or a short investigation note. Do not create persistent state for a quick one-round report.
- Read project learning docs under `doc/solutions/` when a targeted fix area already has a relevant learning. Append a compact lesson only after a later fix is verified, not during triage.
- Link large references instead of inlining them; this file is the single source of truth for the Better Stack Errors appendix.

## Deliverable template

Use this structure (skimmable in under ~3 minutes):

1. **Window and sources** — `-24h`, PostHog project id, **resolved Better Stack `application_id` (Errors) and `source_id` (Info) actually used this round** (and how they were resolved — `telemetry_list_applications_tool` / `telemetry_list_sources_tool` output).
2. **Executive summary** — 2–4 bullets: overall health, dominant themes, biggest risk.
3. **PostHog — top issues** — For each: short title, **issue `id`**, occurrences/users/sessions if returned, `channel` / route / scope signals from payload samples.
4. **Better Stack — top patterns** — For each: **`pattern`**, message/type, count trend in window, link to drill-down finding.
5. **Clusters** — Group duplicates (deploy/chunk fetch, third-party, replay noise, etc.); cite the [Known noise / false-positive patterns](#known-noise--false-positive-patterns) section for PostHog noise.
6. **Root cause** — Per cluster: **hypothesis**, **confidence** (high/medium/low), **evidence** (PostHog vs Better Stack vs code path).
7. **Observability setup** — Required when requested or when a source is unexpectedly silent: P0/P1 routing status, no-P2 note, info/error sink coverage, code paths checked, silent catches, tests/blockers.
8. **Fix plan** — Ordered steps: smallest safe change first; note files/areas to touch; call out entitlement/auth/data-app wiki reads if needed.
9. **EvidenceAudit** — Round-by-round `EvidenceAudit` lines, including skipped evidence and reasons.
10. **Verification** — **Backlog first:** pass/fail per [Active fix verification backlog](#active-fix-verification-backlog) row with current vs baseline counts. Then net-new signals that should drop after any open fix plan; optional session replay spot-checks.
11. **Runbook maintenance** — If a backlog row confirmed, state that the row was moved to [Resolved fixes (archive)](#resolved-fixes-archive) and removed from the backlog. If a new fix shipped since last run, state the row added (or defer to the implementation session).
12. **Blockers** — MCP down, missing logs, need deploy time or feature flag context, etc.
13. **Prompt maintenance suggestion** — `status:` `no-change` | `minor-tweak` | `needs-update`; `rationale:`; `proposed edits:`. Use for MCP schema drift, ID drift, new noise, ambiguity, or backlog/process gaps.

## Boundaries (mandatory)

- **Investigate only.** This skill produces a triage report and a **fix plan**. It does **not** implement code, edit observability config, change Discord/PostHog/Better Stack routing, add suppression rules, or call **`telemetry_update_error_state_tool`**. Any of those require a **separate explicit user request** after they review the plan.
- **AGENTS.md applies for code interpretation.** When evidence points the Subagent at app code or product behavior, follow the webapp [`AGENTS.md`](../../../tradingflow-webapp-fullstack/AGENTS.md) Mandatory Read Order — read [`knowledge/basic_concepts.md`](../../knowledge/basic_concepts.md) and the relevant docs under the webapp `doc/domain-knowledge/` before drawing conclusions about product behavior.
- **No `frontend_error` substitution.** Do not treat **`frontend_error`** product events as a substitute for **`$exception`** / Error Tracking or Better Stack operational triage (see observability rules).

## Related docs

- PostHog product analytics (not this skill): [ops/webappp-fullstack/posthog-research.md](./posthog-research.md)
- Cursor skill pointer: [.cursor/skills/betterstack-monitor/SKILL.md](../../../.cursor/skills/betterstack-monitor/SKILL.md)

---

## Appendix: Better Stack Errors MCP runbook

Use this section when an agent or engineer should **analyze recent production errors (roughly the last 24 hours)** via the **Better Stack MCP** (`server`: `user-betterstack`) and **propose** fixes. Implementation, suppression, and Better Stack state mutation are out of scope for this skill and require a **separate explicit user request** after the deliverable.

### Before you query

1. **Read tool schemas first** — MCP tool descriptors live under the Cursor MCP config for `user-betterstack`. Never guess parameter names.
2. **Domain and observability policy** — For what “errors” mean in-app, severity, and destinations, read [`ops/harness/observability-rules.md`](../harness/observability-rules.md).
3. **ClickHouse / errors access issues** — If `telemetry_query` fails on cold exceptions storage (`NAMED_COLLECTION_DOESNT_EXIST`, missing S3 collection), fix the **Better Stack → Telemetry** cloud connection for the same data region as your ingestion host (see **Step 1** below for current collection names), then retry. Use MCP **`telemetry_create_cloud_connection_tool`** with the correct **`team_id`** when the dashboard instructs you to create or repair access.

### TradingFlow identifiers (resolve at run time)

There is **no canonical hardcoded `application_id` / `source_id`** in this runbook. IDs change when the org renames or recreates sources, and the previously canonical Errors id (`2358698`) was already observed to drift to `2412994`. Resolve fresh each round:

1. **`telemetry_list_applications_tool`** with `name` filter `WebFullStack` — pick the entry whose name is **`WebFullStack-Errors`**; record its `application_id` for the deliverable.
2. **`telemetry_list_sources_tool`** — pick the entry for **`WebFullStack-Info`**; record its `source_id` for the deliverable.
3. The Errors **table** (logical name in docs / UI) is **`t203847.webfullstack_errors`**, but use whatever the Step 1 instructions in the next section return as authoritative.

| Concept | How to obtain |
| --- | --- |
| Errors **application** (`WebFullStack-Errors`) | `telemetry_list_applications_tool` → `application_id` |
| Logs / JS telemetry **source** (`WebFullStack-Info`) | `telemetry_list_sources_tool` → `source_id` |
| Errors **table** | from `telemetry_get_errors_query_instructions_tool` output (Step 1 below) |

Last observed IDs (informational only, may be stale): Errors `application_id` `2412994`, Info `source_id` `2357910`.

### MCP workflow: last 24 hours in production

#### Step 1 — Refresh SQL rules (required)

Call **`telemetry_get_errors_query_instructions_tool`** with the `application_id` resolved in **TradingFlow identifiers (resolve at run time)** above:

```json
{ "application_id": <RESOLVED_ERRORS_APPLICATION_ID> }
```

The response is the **source of truth** for collection names (`remote(...)`, `s3Cluster(...)`), Merge functions on metrics, `_pattern` vs `pattern`, and JSONExtract patterns. **Collection slugs can change**; do not copy old SQL from wikis without reconciling to this output.

#### Step 2 — Substitute a 24-hour window

Instructions use template placeholders `{{start_time}}` and `{{end_time}}`. For **ad-hoc `telemetry_query`** against live data, replace them with explicit ClickHouse bounds, for example:

```sql
WHERE dt BETWEEN now() - INTERVAL 24 HOUR AND now()
```

Add **`AND environment = 'production'`** in metrics queries when the column exists and you only care about prod (see examples in Step 1 output).

#### Step 3 — List top error patterns (fast path)

Use the **metrics** collection from Step 1: aggregated patterns, `countMerge(events_count)`, `uniqMerge(user_uniq)`, `GROUP BY pattern`, `ORDER BY last_seen DESC` or by count. Keep a **LIMIT** (for example 50).

Goal: ranked list of **`pattern`** + human-readable `anyLastMerge(message_last)` / type / file for the window.

#### Step 4 — Drill into one pattern

For stack traces and payloads:

- **Recent hot storage:** `remote(..._exceptions)` with `_pattern = '<pattern from metrics>'`.
- **Older than ~30 minutes in the window:** `s3Cluster(primary, ..._s3)` with **`_row_type = 4`** and the same `_pattern` filter.

Use **`telemetry_get_error_details_tool`** when you already have a pattern id:

```json
{
  "application_id": <RESOLVED_ERRORS_APPLICATION_ID>,
  "pattern": "<pattern string from metrics>"
}
```

#### Step 5 — Execute SQL

**`telemetry_query`** requires (see tool schema): `query`, `source_id`, `table`.

For **Errors** data, use the **errors** source/table pairing from Better Stack for the **resolved Errors `application_id`** — typically the same logical table name as in the instructions (for example `t203847.webfullstack_errors_2`) and the **source id** shown in the Telemetry UI or from `telemetry_list_sources_tool`. If unsure, list sources and pick the one tied to **WebFullStack-Errors**.

Pass the final SQL from Step 2–4 with literals instead of `{{start_time}}` / `{{end_time}}`.

**Historical exceptions SQL:** For `-24h` triage, **metrics** queries from Step 1 are usually sufficient. `remote(..._exceptions)` is often empty outside the hot window; `s3Cluster(..._errors_*_s3)` may fail with `NAMED_COLLECTION_DOESNT_EXIST` — prefer **`telemetry_get_error_details_tool`** + metrics over cold exceptions S3 when the cloud connection lacks that collection.

#### Step 6 — Optional: docs search

**`better_stack_search_documentation_tool`** — use for Better Stack product behavior, limits, or UI concepts; not a substitute for Step 1 for SQL shape.

#### Step 7 — Out of scope for this skill: triage state in Better Stack

**`telemetry_update_error_state_tool`** marks a pattern `resolved`, `ignored`, or `unresolved`. **Do not call** it from this investigation. State changes belong to a **separate explicit user request** after a deploy or intentional suppression decision; do not use “resolved” to hide unfixed production defects.

### How to turn findings into a fix plan

This skill produces the **plan**; a follow-up session implements and verifies. The deliverable should:

1. **Cluster by `pattern` and message** — One code defect often maps to one pattern; spikes after a release point to regression.
2. **Use structured tags in `raw`** — Prefer `correlationId`, `surface`, `operation`, `requestUrl` (see [`ops/harness/observability-rules.md`](../harness/observability-rules.md)) to map to routes, stores, or API handlers in this repo.
3. **Name files / surfaces to inspect**, not edits — point at the area; the implementation session reads the webapp [`AGENTS.md`](../../../tradingflow-webapp-fullstack/AGENTS.md) Mandatory Read Order, [`knowledge/basic_concepts.md`](../../knowledge/basic_concepts.md), and the relevant domain-invariant docs **before** changing code.
4. **Specify verification signals** — which metric query / pattern id / PostHog issue should drop after the fix; whether `telemetry_update_error_state_tool` should be called as part of the deploy session. **Add a row** to [Active fix verification backlog](#active-fix-verification-backlog) when the fix ships (see [Runbook maintenance](#runbook-maintenance-post-deploy-verification)).

### MCP server id

Cursor MCP identifier: **`user-betterstack`** (see `SERVER_METADATA.json` in the MCP bundle).
