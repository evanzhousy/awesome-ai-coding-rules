---
name: workspace-system-architecture-review
description: Cross-project system architecture review runbook for the projects referenced by ops. Uses a greenfield-first and reverse-adversarial simplification pass to identify elegant boundaries, duplicate ownership, removable modules, and high-ROI refactors without mutating production.
disable-model-invocation: true
---

# Workspace System Architecture Review

Use this runbook when an AI agent is asked to review the full workspace architecture across the projects referenced by `ops/`, acting as a system architect. The review is read-only by default and should produce evidence-backed recommendations for a simpler, more elegant system.

The operating principle is **elegant system first**: preserve the business contract, then aggressively remove accidental complexity. Prefer deleting, merging, collapsing, or retiring a module over adding a new layer. A proposed new abstraction is acceptable only when it lets the system remove more complexity than it introduces.

This runbook is not for production triage, browser walkthroughs, data-quality checks, or implementation. Switch to the narrower ops runbook when the user asks for those outcomes.

## Recommended Invocation

Use `/goal` for a full portfolio review:

- Objective: review all projects referenced by `ops/` from a greenfield system-architecture and reverse-adversarial simplification perspective, then produce a deletion-first architecture report and phased roadmap.
- Success criteria: every in-scope project is inventoried from current repo evidence; core product/data/ops contracts are mapped; current boundaries, data stores, jobs, APIs, deploy surfaces, and observability paths are described; the report states the ideal greenfield architecture; every major subsystem is challenged with "why does this deserve to exist?"; deletion/merge/collapse candidates include blast radius, preserved contract, migration path, verification signals, and rollback; findings distinguish evidence from assumptions; no production mutation or code edit is performed unless the user explicitly changes scope.
- Stop condition: the architecture report is complete, or a blocker names the exact missing repo/tool/evidence and the part of the architecture it prevents judging.

Pasteable objective:

```text
Use ops/workspace-system-architecture-review.md as the runbook. Review every project referenced by ops/ as a system architect. Start from greenfield domain truth, then run a reverse-adversarial simplification pass: for each repo, module, worker, job, data store, cache, queue, route family, auth/billing path, observability stream, and compatibility shim, ask whether it can be deleted, merged, collapsed into an existing owner, or replaced by a simpler boundary while preserving the product contract. Favor elegant system design and simplicity over complexity. Produce the required system-architect report sections, plus ProjectInventory, CapabilityOwnershipMatrix, BoundaryMap, ComplexityLedger, DeletionCandidateMatrix, ReverseAdversarialChallengeMatrix, and a phased simplification roadmap. Do not mutate production or implement changes.
```

## Agent Handoff

Last updated: 2026-06-28

Latest run: a local-repo-only architecture review was rerun on 2026-06-28 across the default projects present on disk: `awesome-ai-coding-rules`, `tradingflow-webapp-fullstack`, `tradingflow-cfworker-service`, `tradingflow-process-service-ec2`, `tradingflow-web-landingpage`, and `optiondata-portal`. `tradingflow-quant-service` is also present locally, but current ops runbooks only name it as a secondary project, so treat it as a secondary bounded context unless the user explicitly scopes it into the review. No production, browser, observability, billing, or database probes were run, and no sibling production systems were mutated.

Implementation follow-up on 2026-06-24 applied the accepted deletion-first items: Worker-side UW ingest is removed from `tradingflow-cfworker-service`, the process-service metadata sync no longer calls the deleted Worker metadata-refresh hook, and `optiondata-portal` dashboard page implementations were flattened into `src/routes/-dashboard-pages`. Cloudflare Durable Object cleanup uses a `deleted_classes` migration for `UwIngestionDO`; verify deployment against current Cloudflare migration docs before shipping. Local verification passed for the touched Worker Vitest set, Worker `npx wrangler deploy src/index --env production --dry-run`, process-service symbol-meta test plus `npm run build`, OptionData `npm run lint`, and `git diff --check` in all touched repos. Worker `npm run lint` is currently blocked by an existing ESLint 9 `indent.tabWidth` config schema error, and full Worker `npx tsc --noEmit` still reports pre-existing unrelated strictness errors outside the new ClickHouse client.

Secondary repos named by ops but not present in the local workspace during the latest run were `api-service-lambda` and `cron-service-lambda`; treat them as out of scope unless a current checkout or live evidence shows they still own an active capability.

Next architecture follow-up should focus on the remaining user decision: extract duplicated data-domain contracts as a copied module named `tradingflow-data-contracts`, with a JSON version file, and require every participating project copy to report the same version. Do not replace this with a runtime shared package/service without a new user decision. Also tighten the Contract Rank source-of-truth/fallback contract after the copied contracts shape is defined.

Latest evidence for `tradingflow-data-contracts`: `tradingflow-process-service-ec2` and `tradingflow-cfworker-service` shared data/domain files have already diverged, including symbol aliases, index roots, date/session helpers, implied-volatility helpers, math parsing behavior, and option-trade scoring utilities. Contract Rank compact snapshot shape/version knowledge is also duplicated across the Worker and webapp. Start with a copied, versioned contract module that contains JSON-visible version metadata, canonical symbol aliases/index roots, table/source names, snapshot payload/version manifests, and small validation checks that fail when participating repos carry different versions.

Documentation drift found on 2026-06-28: `optiondata-portal` code and `AGENTS.md` describe the current TanStack Start/Nitro shape with dashboard pages under `src/routes/-dashboard-pages`, while `CLAUDE.md`, `README.md`, and `wiki/current-implementation/*` still describe the old Next.js/App Router/dashboard path shape. `tradingflow-cfworker-service` also has stale top-level docs: `AGENTS.md` still mentions old `src/grok-daily` and `src/quant-service/edgex` areas, and the README snapshot section still names the retired `mv_contract_day_flow` source instead of the current Contract Rank mart source. Patch these docs before or with the contracts extraction so future agents do not revive removed architecture.

## Scope

Default workspace root on this machine:

```bash
WORKSPACE=/Users/evansmacbookpro/Desktop/Projects
```

Default in-scope projects are the projects directly referenced by current ops runbooks:

| Project | Default review role |
| --- | --- |
| `$WORKSPACE/awesome-ai-coding-rules` | Ops runbooks, durable operational knowledge, architecture-review source. |
| `$WORKSPACE/tradingflow-webapp-fullstack` | TradingFlow webapp, auth/billing, data-app UX, domain docs, PostHog/error surfaces, some ClickHouse diagnostics and backfill helpers. |
| `$WORKSPACE/tradingflow-cfworker-service` | Cloudflare Worker serving layer, active Durable Objects, KV reference data, contract-rank snapshots, and websocket/SSE fanout from ClickHouse. Worker-side UW ingest is retired. |
| `$WORKSPACE/tradingflow-process-service-ec2` | EC2 backend jobs, production UW ingestion/writes, symbol meta sync, option-chain ingest, ClickHouse audit scripts, provider clients, and maintenance jobs. |
| `$WORKSPACE/tradingflow-web-landingpage` | Static marketing/docs site, blog/tutorial/changelog content, public SEO and visitor conversion surfaces. |
| `$WORKSPACE/optiondata-portal` | OptionData account/data portal, survey, API keys, billing/trial, historical SQL, option-chain API, realtime data API evaluation UX. |

Secondary projects named by ops, such as `api-service-lambda`, `cron-service-lambda`, `quant-service`, or other sibling checkouts, are in scope only when current repo evidence shows they still own an active capability, deploy surface, dependency, or complexity hotspot.

## Non-Negotiables

- Read current repo evidence before conclusions. Do not rely on stale runbook memory when the checkout can answer the question.
- Preserve product and data contracts. Simplicity does not justify silently removing user-visible behavior, data correctness, billing/auth safety, auditability, or operational recovery.
- Be deletion-first, not rewrite-first. For every "add" recommendation, also state what it deletes or why deletion is not available.
- Treat duplicate owners as defects until proven otherwise. There should be one clear owner for each domain concept, writer, API contract, cache, and operator workflow.
- Keep production read-only. Do not deploy, change env/secrets, write DB rows, update billing state, send notifications, or mutate third-party tools.
- Do not print secrets, full env files, API keys, webhook URLs, OTPs, or payment data.
- Make assumptions explicit. A recommendation without code evidence, runtime evidence, or a named assumption is not a finding.

## Required Context

Read these first:

1. `ops/tradingflow-ceo-daily-review.md` for current runbook routing and tool safety rules.
2. The `Agent Handoff`, scope, and local project map sections of every in-scope ops runbook.
3. Each in-scope project's top-level instructions: `AGENTS.md`, `CLAUDE.md`, `README*`, package manifests, deployment config, and domain docs.
4. Architecture-relevant docs under `doc/`, `docs/`, `wiki/`, `knowledge/`, `src/**/README*`, and runbooks referenced by the project itself.

Start with a lightweight inventory:

```bash
cd "$WORKSPACE/awesome-ai-coding-rules"
find ops -maxdepth 3 -type f -name '*.md' | sort
rg -n "\\$WORKSPACE|/Users/evansmacbookpro/Desktop/Projects|tradingflow-|optiondata-portal|api-service-lambda|cron-service-lambda|quant-service" ops --glob '*.md'
```

For each in-scope checkout:

```bash
git -C "$PROJECT" status --short
rg --files "$PROJECT" | sed "s#^$PROJECT/##" | head -200
```

Use the file list as an index only. Then read targeted code/docs for entry points, deploy boundaries, data flows, APIs, jobs, and duplicated concepts.

## Review Mindset

### Greenfield Pass

Before judging existing modules, write one sentence:

```text
The clean version of this portfolio would be <bounded contexts>, owned by <owners>, communicating through <minimal contracts>, while preserving <business/data/user invariants>.
```

Then define the ideal shape as if building today:

- Product surfaces and user journeys.
- Data ingestion, normalization, enrichment, storage, and serving.
- Auth, billing, entitlement, and account lifecycle.
- Public APIs, internal APIs, batch jobs, streaming paths, and caches.
- Observability, error routing, incident response, and operator workflows.
- Content/docs/changelog/tutorial publishing.

### Reverse-Adversarial Pass

After the greenfield model, attack the current system from the opposite direction. For every repo, module, route family, worker, job, queue, cache, table, provider client, compatibility shim, and observability stream, ask:

1. If this disappeared today, which explicit user promise, data invariant, operator workflow, or revenue/safety control would break?
2. Is another component already owning the same concept or writing the same truth?
3. Is this only a bridge around old architecture, a compatibility alias, a stale fallback, or a one-feature helper?
4. Can a simpler owner absorb it with fewer flags, fewer deployment surfaces, or fewer data copies?
5. What proof would let us delete it safely?

Classify each challenged unit as `delete`, `merge`, `collapse`, `keep`, or `defer`. `Keep` still needs a reason.

## Workflow

### 0. Scope The Run

Write a scope block before deep reading:

- Target portfolio: all default projects, or a named subset.
- Time budget and depth: quick portfolio screen, full architecture review, or focused subsystem deep dive.
- Review mode: read-only report, implementation-ready plan, or user-authorized follow-up.
- External evidence allowed: local repo only, local runtime, production read-only, browser, observability, or none.
- Explicit non-goals.

### 1. Build Project Inventory

For each project, identify:

- Primary language/framework/runtime.
- Deployment target and production entry points.
- Package manager and major scripts.
- Major folders/modules.
- Public routes/APIs, internal APIs, batch jobs, workers, crons, queues, caches, DBs, and external providers.
- Domain docs and tests that define contract truth.
- Current handoff/watchlist items from ops runbooks.

Do not inspect every file equally. Use `rg --files`, `package.json`, route registries, worker entry points, server functions, cron declarations, migration folders, and docs to find the architectural spine.

### 2. Map Current Capabilities And Boundaries

Create a capability map before making recommendations:

- User-facing capabilities: webapp, landing/docs, OptionData portal, account/billing, API keys, data APIs.
- Data capabilities: UW ingestion, provider fallbacks, symbol meta, option-chain ingest, Greeks, contract-rank marts, snapshots, reference data.
- Control-plane capabilities: auth, billing, entitlements, feature announcements, saved filters, monitoring, runbooks.
- Storage and truth sources: ClickHouse, Durable Objects, KV, Neon, Clerk, Stripe, PostHog, Better Stack, R2, generated static artifacts.
- Direction of data flow: producer -> store -> snapshot/cache -> app/API -> user.

Flag every place where one concept has multiple writers, multiple names, multiple freshness policies, or multiple cache layers.

### 3. Identify Complexity Hotspots

Build a `ComplexityLedger` from evidence. Look especially for:

- Legacy paths kept alive only by stale docs or old URLs.
- Duplicate route trees, duplicate UI surfaces, duplicate API clients, or duplicate provider adapters.
- Multiple data stores representing the same truth without a clear source-of-truth contract.
- Feature flags or modes that encode old architectures.
- Jobs that overlap in schedule, writes, or responsibility.
- Fallbacks that hide outages or make ownership ambiguous.
- Custom infrastructure that a simpler platform primitive could replace.
- Runbooks that route agents to dead paths or outdated owners.
- Observability streams that fragment the same incident across multiple systems.

### 4. Run Deletion-First Design Review

For each hotspot, produce a deletion or simplification hypothesis before proposing a new design:

- Delete: remove a dead route/module/job/cache/provider/shim.
- Merge: combine two modules with the same owner and contract.
- Collapse: move a boundary inward, such as turning a service into a library, generated artifact, or single-owner job.
- Replace: use an existing platform/source-of-truth instead of custom state.
- Keep: retain the complexity because it protects a real invariant, with the invariant named.

Every candidate must include:

- Current evidence.
- Contract preserved.
- Blast radius.
- Migration path.
- Verification signal.
- Rollback or stop condition.

### 5. Design The Greenfield Target

Describe the smallest coherent target architecture. Prefer:

- Fewer bounded contexts with stronger ownership.
- One write path per durable fact.
- One public contract per capability.
- One observability route per incident class.
- One content/source-of-truth path for user-facing product facts.
- Modular monolith or library boundaries before adding services, unless independent scale, deployment, or security requires a service.

Use a Mermaid or text diagram in the final report. The diagram should show owners and data direction, not every implementation class.

### 6. Build The Roadmap

Prioritize high-ROI simplification first:

- Phase 1: safe deletions, stale docs/aliases, obvious duplicate route cleanup, stronger ownership docs, characterization tests.
- Phase 2: merge/collapse duplicated module owners, remove compatibility modes, consolidate source-of-truth paths.
- Phase 3: larger boundary moves using strangler or branch-by-abstraction patterns.
- Phase 4: performance, scale, new capabilities, and deeper platform changes after the system is smaller.

Do not recommend a big-bang rewrite. Each phase needs a verification path and a way to stop safely.

## Required Output

The final report must use these top-level sections:

```markdown
## 1. Current System Summary
## 2. Business Domain & Core Requirements
## 3. Ideal Architecture (Greenfield Design)
- High-level diagram (text-based or Mermaid)
- Key design decisions & rationale
## 4. Major Pain Points in Current Code
## 5. Refactoring Roadmap
- Phase 1: low-risk, high-impact deletions and clarifications
- Phase 2: boundary consolidation and duplicate-owner removal
- Phase 3: larger restructuring behind safety checks
- Phase 4: performance, scale, and new capabilities after simplification
## 6. Immediate Next Actions (first 1-3 concrete steps)
```

Within those sections, include these tables when applicable.

### ProjectInventory

| Field | Meaning |
| --- | --- |
| `project` | Project path/name |
| `role` | Current responsibility |
| `runtime` | Framework/runtime/deploy target |
| `entryPoints` | Main app/server/worker/job entry points |
| `ownedTruth` | Durable facts or contracts this project owns |
| `dependsOn` | Other repos/services/data stores |
| `evidence` | Files/docs/commands read |
| `confidence` | High, medium, low |

### CapabilityOwnershipMatrix

| Field | Meaning |
| --- | --- |
| `capability` | Domain capability or operator workflow |
| `currentOwners` | Current modules/repos that own or touch it |
| `idealOwner` | Greenfield owner |
| `duplicationRisk` | None, low, medium, high |
| `simplificationMove` | delete, merge, collapse, replace, keep |
| `evidence` | Concrete repo/runtime proof |

### BoundaryMap

| Field | Meaning |
| --- | --- |
| `boundary` | Repo/service/module boundary |
| `currentContract` | API, DB table, event, artifact, or manual runbook contract |
| `problem` | Coupling, duplication, drift, unclear ownership, or healthy |
| `greenfieldContract` | Smaller or clearer target contract |
| `migrationPattern` | strangler, branch-by-abstraction, adapter removal, static redirect, table/view migration, or none |

### ComplexityLedger

| Field | Meaning |
| --- | --- |
| `hotspot` | Specific module/system/path |
| `complexityType` | duplicate, legacy, glue, mode flag, cache, provider fallback, observability split, docs drift, or other |
| `cost` | Why it slows delivery, correctness, operations, or review |
| `evidence` | File paths, route names, commands, logs, or docs |
| `owner` | Current likely owner |

### DeletionCandidateMatrix

| Field | Meaning |
| --- | --- |
| `candidate` | Module/system/path proposed for deletion or retirement |
| `action` | delete, merge, collapse, replace, keep, defer |
| `whyItMayNotNeedToExist` | Reverse-adversarial argument |
| `contractToPreserve` | User/data/operator invariant that must survive |
| `blastRadius` | Affected repos, routes, jobs, data, users, ops |
| `verification` | Tests, metrics, probes, browser checks, or shadow comparison |
| `rollbackOrStop` | How to halt or reverse safely |
| `confidence` | High, medium, low |

### ReverseAdversarialChallengeMatrix

| Field | Meaning |
| --- | --- |
| `unitChallenged` | Repo/module/job/data store/route/cache/provider |
| `challengeQuestion` | The strongest deletion/merge argument |
| `defense` | The best reason to keep it |
| `verdict` | delete, merge, collapse, keep, defer |
| `missingEvidence` | What must be checked before acting |

### RefactoringRoadmap

| Field | Meaning |
| --- | --- |
| `phase` | 1, 2, 3, 4 |
| `goal` | Simplification outcome |
| `specificTargets` | Files/modules/repos to touch |
| `technique` | Deletion, strangler, branch-by-abstraction, adapter removal, characterization tests, feature flag, migration |
| `safety` | Verification and rollback |
| `expectedComplexityRemoved` | Concrete modules, modes, routes, jobs, docs, or owner splits removed |

## Severity And Priority

Use these priority levels:

| Priority | Use when |
| --- | --- |
| `P0` | Current architecture risks data correctness, billing/access safety, production recovery, or severe user harm. |
| `P1` | Removing or merging the hotspot would materially reduce defects, ops load, or delivery risk across projects. |
| `P2` | Meaningful simplification with bounded blast radius. |
| `P3` | Cleanup, documentation, naming, or low-risk consolidation. |

Do not mark a deletion `P0` unless keeping it is actively dangerous. Most deletion work should be `P1` or `P2`.

## Verification Expectations

A simplification recommendation is implementation-ready only when it names verification:

- Characterization tests before moving boundaries.
- Data parity queries before deleting a writer, view, table, or cache.
- Browser or API checks before deleting routes or compatibility redirects.
- Observability queries before removing monitors, sources, or log paths.
- Deployment and rollback plan before moving a runtime boundary.
- Runbook updates when ownership or command paths change.

If verification is expensive or unavailable, mark the item `defer` and state the cheapest next evidence-gathering step.

## When To Switch Runbooks

- TradingFlow data-pipeline production checks, including Worker DO/KV/API serving health, ClickHouse integrity/latency, contract-rank correctness, Greeks parity, and CF/process producer errors: use `ops/process-service/datapipeline-error-check.md`.
- Webapp production error correlation: use `ops/webappp-fullstack/webapp-check-error.md`.
- Webapp Browser product review: use `ops/webappp-fullstack/browser-e2e-product-review.md`.
- Landing Browser review: use `ops/landingpage/browser-e2e-test.md`.
- OptionData portal Browser review: use `ops/optiondata/optiondata-browser-e2e-product-review.md`.
- Runbook/skill maintenance only: use `ops/skill-maintainer.md`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether this review revealed reusable routing, project-map, output-format, or simplification guidance.
2. Promote durable lessons into this runbook or `ops/tradingflow-ceo-daily-review.md`.
3. Keep transient review state in `Agent Handoff` only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- `ops/` starts referencing a new project or stops referencing an old one.
- A project changes ownership, runtime, deployment target, or source-of-truth responsibility.
- A repeated architecture-review ambiguity needs a standard evidence path.
- The required output misses a table or field needed to make deletion/merge advice actionable.

Do not update this runbook for:

- One-off architecture opinions not grounded in repo/runtime evidence.
- Current-run-only findings, raw logs, or temporary blockers.
- Implementation progress that belongs in a project issue, PR, or final report.
