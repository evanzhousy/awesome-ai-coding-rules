# E2E User Simulation + Product Review Runbook (TradingFlow)

This is the **unified runbook** for AI coding agents. It combines E2E journey maintenance (simulating real user behavior through Playwright specs and browser interactions) with structured Product/Trader Review (PM-style judgment of UX, trust, discoverability, and business value).

**Core Principle:** Use the E2E journey specs as the "simulate real user behavior" map. While walking those journeys (in browser via Playwright or equivalent tooling), simultaneously apply the product review passes to judge the experience against domain invariants, glossary, and trader/user jobs. The output is dual: improved tests (via CoverageAudit) + prioritized product recommendations (via ProductReviewFinding, ElementActionMatrix, TraderScorecard).

**Do not** treat this as separate "E2E maintenance" then "PM review". The power comes from doing realistic user simulation **while** conducting the review.

## Recommended Invocation

Use `/goal` for composite or multi-round reviews:

- Objective: simulate the selected user journeys and produce the requested E2E maintenance and/or product review output.
- Success criteria: required references are read, the chosen mode is explicit, CoverageAudit is produced when tests change, product findings use the required formats, verification commands are run or blocked, and runbook friction is folded back into this file.
- Stop condition: the scoped review artifacts are complete, Playwright/product-code verification is blocked with evidence, or the user narrows the review.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items after the latest maintenance sweep. This was a documentation normalization only; no browser journeys, tests, or product reviews were executed.

## References (read in order)

1. [`AGENTS.md`](../../../AGENTS.md) — task routing, domain truth precedence, composite rules.
2. [`doc/knowledge/glossary.md`](../../knowledge/glossary.md) — canonical terms (LoginModal, PaywallModal, Access Gate, Option Trades, Contract-level analysis, Symbol-level analysis, Rank workbench, etc.).
3. Relevant domain invariant (e.g. `doc/domain-knowledge/domain-invariants/data-apps/option-trades.md`, `contract-rank.md` / `rank.md`, `platform.md` for Watchlist/search).
4. This runbook.
5. Module-specific E2E spec(s) under `tests/e2e/specs/<module>/` (these are the primary "simulate real user" journey maps).
6. Paired product-review goal-driven prompt (e.g. `../product-review/option-trades-goal-driven-prompt.md`) if doing focused review.
7. Relevant product code only after the above.

**Shared runtime (for all sessions):**
- Base URL: `http://localhost:8000` (start with `pnpm dev`; on this machine prefer `PATH=/opt/homebrew/bin:$PATH pnpm dev`).
- Entitled baseline: `active+clerk_test@example.com`, OTP `424242`.
- Unpaid/canceled: `canceled+clerk_test@example.com`.
- Trial variants as needed.
- True guest: clean/incognito context (clear Clerk cookies).
- On this machine, always prefix Playwright commands with the same PATH for consistency.

## Two Integrated Modes

**A. Pure Product Review with User Simulation (default for most PM work)**
- Follow the E2E spec journeys **as the simulation script**.
- Walk the exact user steps described in the specs (login flows, filter applications, table interactions, drawer opens, handoffs to Option Trades, etc.).
- While simulating, apply the review passes (see below).
- Produce PM findings only. Do **not** edit tests or code unless the user explicitly expands scope.
- Output stays in the session/chat (no committed `FINDINGS.md` or screenshots for PM-only review).

**B. Composite: E2E Maintenance + Product Review (when both are needed)**
- **Phase 1 (VerificationRound / E2E maintenance):** Use the E2E policy below. Edit the module's journey spec(s), run the scoped Playwright verify until CoverageAudit + Criteria are met. Keep a **session-local scenario list** (meaningful test names + routes from the journeys).
- **Gate:** Only start Phase 2 after Phase 1 Criteria pass (or user narrows).
- **Phase 2 (PM review):** Use the scenario list to seed `nextRoundBrief`s expressed as **user outcomes** (e.g. "guest can open drawer shell on a ranked contract and see Flow tab without paywall; paid user can apply Net DEI filter and see updated KPI brief and handoff to Option Trades").
- Do **not** use raw selector names or spec line numbers as the primary brief for the review phase.
- This produces both updated tests (committable) **and** product review artifacts (in-session only for the PM part).

Do not fork or duplicate the composite orchestration logic. It lives here and is referenced from the old product-review README.

## E2E Journey Maintenance Policy (for Phase 1 / when editing tests)

Every meaningful E2E maintenance run must:
- Read domain context first (AGENTS, glossary, invariants, this runbook, the module's goal-driven prompt).
- Compare wiki invariants vs current tests.
- Choose explicit action for each: `add` / `change` / `remove` / `merge` / `none`.
- Edit **only** the module-local spec and thin shared helpers in `tests/e2e/helpers/`.
- Verify with the narrowest useful Playwright command for that module.
- Keep a CoverageAudit table (see format below).

### CoverageAudit Table (required in handoff)

| action | matrixId | target title/file | rationale | wiki ref |
|--------|----------|-------------------|-----------|----------|
| add/change/remove/merge/none | e.g. `CR-E2E-GUEST-PREVIEW` | `test title` in `tests/e2e/specs/contract-rank/contract-rank.spec.ts` | why this action was needed (user journey, invariant, regression, dedupe) | `rank.md` (Contracts tab) section or "dedupe with Option Trades handoff" |

**Action meanings:**
- `add`: required journey or verified regression has no executable coverage.
- `change`: existing journey is stale, weak, flaky, or no longer matches the domain contract.
- `remove`: wiki retired the behavior or a stronger journey fully covers it.
- `merge`: overlapping tests become one clearer user journey.
- `none`: sufficient coverage.

### Journey Quality Rules
- Prefer **user journeys** over isolated widget checks: persona goal + several realistic UI steps + observable outcome.
- Keep `test.describe` / `test(...)` titles **PM-readable** (they are used as the journey map in product review prompts).
- Use stable `data-testid`, roles, or `data-agent-id` selectors already in the app.
- Extend helpers only for thin, duplicated primitives.
- Keep module specs local. Cross-module journeys (e.g. exact-contract handoff from Contract-level analysis to Option Trades) belong only when the source module owns the handoff.
- If a failure is unrelated to the current edit, capture the exact file + title + error, then continue with targeted verification.
- Do not green CI by weakening assertions without wiki or stronger-journey rationale.
- Do not preserve stale test behavior when the current wiki (rank.md, option-trades.md, etc.) says otherwise.
- Do not treat screenshots or visual inspection as sole proof of access gates, preferences, or handoff contracts.

### Session Layout for E2E
- Use `test.describe.configure({ mode: 'serial' })` + shared `Page` + `beforeAll`/`afterAll` for same-persona paid journeys to avoid repeated expensive logins.
- Use `beforeEach` reset (route + table/query readiness) without re-logging when possible.
- Use explicit `entitledPage()` accessors.
- Do guest cold starts, different accounts, or parallel execution in separate describes.
- Put viewport/mobile at the end of a describe to avoid leakage.
- On this machine: always prefix with `PATH=/opt/homebrew/bin:$PATH`.

### Verification Commands (common pattern)
Start dev server first:
```bash
PATH=/opt/homebrew/bin:$PATH pnpm dev
```

Module-specific (examples — use the narrowest for the edit):
- Auth: `pnpm exec playwright test tests/e2e/specs/auth --project=chromium`
- Contract-level analysis (Contracts tab of Rank): `E2E_AUTH_SCENARIO=active pnpm exec playwright test tests/e2e/specs/contract-rank/contract-rank.spec.ts --project=chromium`
- For unpaid gates: add `--grep "unpaid|Paywall|canceled"` with `E2E_AUTH_SCENARIO=canceled`
- Option Trades, Symbol-level, etc. follow the same pattern in their specs.

Always end with:
```bash
git diff --check
```

Run relevant unit tests (`pnpm exec vitest run ...`) only when product code in the module changed.

## Product Review Passes (for Phase 2 / main review work)

Use these passes while simulating the user journeys from the E2E specs. The simulation gives you the realistic behavior; the passes give you the judgment framework.

**Pass 0: Greenfield model (mandatory before walking the UI)**
- Define the ideal workflow, primary trader/user job, and one-sentence product promise for the route/surface.
- Use glossary terms and the relevant domain invariant.
- If the current product did not exist, what is the simplest coherent workflow the user/trader should experience?

**Pass 1: Current experience (mandatory)**
- Follow the E2E spec journeys step-by-step (simulate real user behavior).
- Observe what the user actually sees and compare against the glossary, domain invariants, and the embedded contract in the module prompt.
- Note loading states, empty states, errors, live updates, handoffs, tier gates, etc.
- Treat E2E specs purely as journey maps — do not run the full suite unless in composite Phase 1.

**Pass 2: Trader / user workflow judgment (mandatory)**
- Judge: speed to insight, scanability (easy to compare rows/metrics/states), decision confidence, data trust (freshness, caveats, live states), control ergonomics (filters, sort, tabs, drawers), state persistence, cross-route handoff quality.
- For auth surfaces, focus on access, conversion, trust, and recovery.

**Pass 3: UI element action matrix (mandatory before final handoff)**
- For every meaningful element, control, modal, drawer, chart, table affordance, copy block, tab, gate, or handoff: classify as `add`, `delete`, `merge`, `update`, or `keep`.
- Do not preserve something merely because it exists today. Ask whether the workflow should be simpler.

**Pass 4: Prioritized recommendation (mandatory final synthesis)**
- Produce ranked findings with severity, action, surface, persona/job, observed friction (in user-visible terms), trader/user consequence, greenfield target, recommendation (PM-level, not implementation steps), evidence (URLs, copy descriptions, state observations — **not** source file paths unless scope explicitly includes implementation), and acceptance signal (what a future review would see to call it resolved).

## Required Output Formats

Use these structures (even if concise tables in the session).

### ProductReviewFinding
| Field | Meaning |
|-------|---------|
| `id` | Stable ID, e.g. `CR-UX-042` or `OT-ACCESS-007` |
| `severity` | `Critical`, `High`, `Medium`, `Low` |
| `action` | `add`, `delete`, `merge`, `update`, or `keep` |
| `surface` | Route, panel, drawer, table, modal, gate, chart, handoff, etc. |
| `personaJob` | Trader/user job being blocked or improved |
| `observedFriction` | What you saw, in user-visible terms |
| `traderConsequence` | Why it matters for speed, trust, decision quality, conversion, etc. |
| `greenfieldTarget` | The cleaner shape from Pass 0 |
| `recommendation` | PM-level change recommendation |
| `evidence` | URLs, observed copy, state descriptions, screenshot labels (text descriptions only — do not commit images for PM review) |
| `acceptanceSignal` | What a future reviewer would observe to call it resolved |

### ElementActionMatrix
| Field | Meaning |
|-------|---------|
| `elementControl` | Meaningful UI element, control, copy block, chart, affordance, or handoff |
| `currentRole` | What it appears to do today |
| `action` | `add` / `delete` / `merge` / `update` / `keep` |
| `rationale` | Why this follows from the user job + invariant contract |
| `expectedImpact` | Expected improvement to speed, clarity, confidence, etc. |
| `riskTradeoff` | What could get worse or needs product judgment |

### TraderScorecard (or Auth/Access equivalent)
Rate or note per dimension touched in the round:
- `speedToInsight`
- `scanability`
- `decisionConfidence`
- `dataTrust`
- `controlErgonomics`
- `statePersistence`
- `crossRouteHandoff`

For auth-focused reviews, adapt to access/conversion/trust/recovery dimensions.

## Output Shapes for Different Modes

**For pure PM review (workflow A):** Executive summary + severity table of findings + ElementActionMatrix + TraderScorecard + evidence list + gaps. All in the chat/session. No committed artifacts.

**For composite (E2E + review):**
- Phase 1: CoverageAudit table + files changed + verify command exit codes.
- Phase 2: The PM structures above, seeded from the scenario list (expressed as user outcomes).
- Final handoff: both sets of outputs + `stoppedReason` + Prompt maintenance suggestion (if this run surfaced friction in the runbook or per-module prompts).

**Prompt maintenance suggestion** (when relevant):
- `status`: `no-change` | `minor-tweak` | `needs-update`
- `rationale`: 1-3 sentences grounded in observed friction.
- `proposed edits`: concrete before/after for this file or the scaffold.
- `template impact`: whether the gap should be fixed in this runbook (so all future prompts inherit it) or is local to one module.

## Important Rules (enforced)

- **Domain truth first:** Code and E2E specs are evidence, not product truth. If they disagree with glossary or invariants, flag it and follow the docs (or update docs + tests in the same body of work).
- **Journey simulation:** Follow the E2E spec steps to simulate real user behavior. Do not invent shortcuts that a real user wouldn't take.
- **Review output policy:** For PM review portions, keep findings and evidence in the session. Do not commit `FINDINGS.md`, review screenshots, or open PRs for pure review output.
- **E2E edits:** Only when in Phase 1 / test maintenance scope. Use CoverageAudit. Prefer user journeys over widget checks. Titles must be PM-readable.
- **No source-file UX evidence in review mode:** Do not cite `src/pages/...` or test files as proof of quality unless the task explicitly includes implementation.
- **Login discipline:** Use the seeded accounts. Guest = clean context. Do not mutate seeded accounts except for documented isolated cleanup.
- **Scope:** Stick to the module's journeys and the surfaces listed in the per-module prompt or this runbook. Cross-module only when the handoff is owned by the current module.
- **Greenfield mindset:** In Pass 0 and Pass 3, ask whether the workflow should be simpler, merged, or removed — do not default to preserving the status quo.
- **Composite discipline:** If using composite, complete Phase 1 Criteria before seeding Phase 2 briefs. Do not interleave test edits with every review round.

## How to Execute (typical flow for an AI agent)

1. Read the required references above.
2. Pick the module (e.g. Contract-level analysis / Rank Contracts tab).
3. Load the module's E2E spec(s) as the user simulation script and the paired goal-driven prompt (if any) as the embedded contract + terminology.
4. If composite is requested: run VerificationRound (edit spec, run playwright, produce CoverageAudit) until criteria.
5. For each review round:
   - Derive a tight `nextRoundBrief` as user outcomes (from scenario list or prior findings).
   - Simulate the relevant journey steps in the browser (Playwright or equivalent).
   - Apply the passes.
   - Record new findings in the required formats.
6. Accumulate, dedupe, and synthesize in-session.
7. Produce final handoff with the required structures + stoppedReason + any prompt maintenance suggestion.
8. Finish with `git diff --check` (and module unit tests if code changed).

## Related / Historical

This runbook consolidates the previous separate `product-review/README.md` (PM review passes, composite session, Product/Trader Review Contract, authoring guidance) and `e2e-test/e2e-update-skills.md` (E2E policy, CoverageAudit, journey rules, anti-patterns) into one place so agents naturally do realistic user simulation **while** reviewing the product.

Per-module goal-driven prompts (in `../product-review/`) remain as focused paste packages. They should reference this runbook for the shared workflow.

When a module's behavior or invariants change, update the relevant domain doc + this runbook (or the per-module prompt) + tests in the same body of work.

---

**End of unified runbook.** Use the E2E specs to simulate; use the passes to review; produce both test improvements and product recommendations in the correct artifacts. Domain truth (glossary + invariants) is always the north star.
