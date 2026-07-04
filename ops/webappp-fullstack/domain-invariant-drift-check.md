---
name: domain-invariant-drift-check
description: Read-only TradingFlow webapp runbook for checking whether recent code changes drift from the repo domain invariant wiki, or whether an intentional behavior change requires a wiki update before merge.
disable-model-invocation: true
---

# Domain Invariant Drift Check (Webapp Fullstack)

Use this runbook when the user asks whether recent `git diff` changes in `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack` agree with the domain invariant wiki.

This runbook is a read-only audit by default. It does not fix code, rewrite wiki docs, update tests, or make commits unless the user explicitly expands scope after seeing the drift report.

## Recommended Invocation

Use `/goal` for a full drift audit:

- Objective: compare the requested recent code changes in `tradingflow-webapp-fullstack` against the relevant domain invariant wiki and classify every possible drift.
- Success criteria: app repo status and diff base are stated, changed hunks are mapped to affected product surfaces, relevant invariant docs are read, each behavior-affecting change has a drift classification, findings are reported with file paths and invariant references, and the runbook maintenance note is included.
- Stop condition: all changed behavior is classified, the diff base or domain source is blocked, or the user redirects to implementation or wiki-update work.

Pasteable objective:

```text
Use ops/webappp-fullstack/domain-invariant-drift-check.md as the runbook. In /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack, audit the requested recent code changes from git diff against the repo domain invariant wiki. Treat domain truth as higher priority than current code and current tests. Produce DiffScope, InvariantCoverage, InvariantDriftMatrix, required actions, verification, blockers, and runbook maintenance note. Do not edit code or wiki docs unless I explicitly ask after the audit.
```

## Agent Handoff

Last updated: 2026-07-04

No open handoff items. Latest real run audited the clean app repo's `HEAD` fallback commit and revised the focused Vitest command after `pnpm test:unit -- <file>` proved too broad in this repo.

## Goal

Answer these questions with repo evidence:

1. What behavior changed in the recent diff?
2. Which domain invariant docs own that behavior?
3. Does the code still preserve those invariants?
4. If the diff intentionally changes product behavior, was the relevant wiki updated in the same body of work?
5. What must happen next: code fix, wiki update, product decision, targeted tests, or no action?

## Non-Negotiables

- Work from the app repo:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
```

- Preserve user work. Start with `git status --short` and do not revert, stage, commit, or rewrite files during this audit.
- Domain truth wins over current code and current tests. Current code is implementation evidence, not permission to weaken an invariant.
- Read the glossary/basic concepts before judging domain behavior.
- Read only the invariant docs relevant to changed surfaces; do not spend the run reading the entire wiki unless the diff is genuinely cross-cutting.
- Treat tests as evidence. A passing or failing test does not override a documented invariant.
- If the diff changes a business-critical invariant, access boundary, persisted preference contract, canonical naming, ranking/filtering contract, live-mode contract, or telemetry policy, require a wiki update or an explicit product decision.
- Do not make production calls, mutate billing state, update database rows, or run Browser journeys unless the user expands scope.

## Diff Sources

Prefer the user's requested diff range. If they do not specify one, inspect all local recent work before choosing a base:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -8
git diff --name-status
git diff --cached --name-status
```

If the working tree has uncommitted changes, audit both unstaged and staged diffs:

```bash
git diff --stat
git diff --cached --stat
git diff --unified=80
git diff --cached --unified=80
```

If the work is on a feature branch, compare against the integration branch. For this repo, `test` is normally the integration branch:

```bash
git fetch --prune
BASE_REF="${BASE_REF:-origin/test}"
MERGE_BASE="$(git merge-base HEAD "$BASE_REF")"
git diff --name-status "$MERGE_BASE"...HEAD
git diff --stat "$MERGE_BASE"...HEAD
git diff --unified=80 "$MERGE_BASE"...HEAD
```

If the checkout is already on `test`, and no uncommitted diff exists, ask or infer the intended range from the task. Reasonable read-only fallbacks are:

```bash
git show --stat --oneline --decorate HEAD
git show --unified=80 HEAD
```

Do not call the audit complete until the report states which diff source was used.

## Required Context

Read in this order:

1. `AGENTS.md`
2. `doc/knowledge/basic_concepts.md`
3. The relevant `doc/domain-knowledge/<module>/domain-invariants.md`
4. The sibling `functionality.md` only when the invariant text depends on feature behavior details
5. Relevant changed source files and tests

Resolve current invariant docs with:

```bash
rg --files doc/domain-knowledge | sort
```

Current module owners:

| Changed area | Read first |
| --- | --- |
| Auth, billing, access gates, entitlement, AI consent, app shell, ticker search, watchlists, symbol logos | `doc/domain-knowledge/shared/domain-invariants.md` and, when needed, `doc/domain-knowledge/shared/functionality.md` |
| Option Trades, saved filters, preferences, filters, sorting, Live, Historical, exports, watchlist scoping | `doc/domain-knowledge/option-trades/domain-invariants.md` and, when needed, `doc/domain-knowledge/option-trades/functionality.md` |
| Rank Contracts, Rank Symbols, contract/symbol ranking, drawer content, GEX/chain/vol integrated in Rank, Option Trades handoff | `doc/domain-knowledge/rank/domain-invariants.md` and, when needed, `doc/domain-knowledge/rank/functionality.md` |
| Cookbooks, recipe templates, user recipes, recipe AI, runRecipe behavior | `doc/domain-knowledge/cookbooks/domain-invariants.md` and, when needed, `doc/domain-knowledge/cookbooks/functionality.md` |
| Market Recap | `doc/domain-knowledge/market-recap/domain-invariants.md` and, when needed, `doc/domain-knowledge/market-recap/functionality.md` |
| Portfolio | `doc/domain-knowledge/portfolio/domain-invariants.md` and, when needed, `doc/domain-knowledge/portfolio/functionality.md` |
| Assistant Channels, linked external chat identities, webhooks | `doc/domain-knowledge/assistant-channels/domain-invariants.md` and, when needed, `doc/domain-knowledge/assistant-channels/functionality.md` |
| Logging, telemetry, async API failure reporting, observability policy | `doc/harness/observability-rules.md` |
| UI styling only | `doc/harness/ui-style.md`; still read domain invariants if the UI change affects access, persistence, ranking, data interpretation, or user promises |

## Workflow

### 1. Establish Diff Scope

Create a concise `DiffScope` before reading deeply:

```markdown
## DiffScope

- Repo: /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
- Branch: ...
- Diff source: working tree / staged / merge-base with origin/test / commit range ...
- Changed files:
  - path: surface guess, why it may affect invariants
- Explicitly excluded files:
  - path: reason, such as formatting-only, generated, package lock with no behavior change
```

For each changed file, decide whether it can affect a user promise. Be careful with tests, locale files, fixtures, helpers, query services, feature flags, and shared components; these often encode domain behavior indirectly.

### 2. Build the Surface Map

Use changed paths plus code reads to map each hunk to a product surface:

```bash
git diff --name-only "$MERGE_BASE"...HEAD 2>/dev/null || git diff --name-only
rg -n "access|entitle|paid|preview|filter|sort|live|watchlist|saved|rank|dei|gex|billing|trial|consent|export|recipe|portfolio|webhook|market recap" src tests doc -g '*.ts' -g '*.tsx' -g '*.md'
```

For every behavior-affecting hunk, record:

- User-visible behavior or system contract it changes.
- Data contract, persistence contract, access boundary, or terminology it touches.
- Source module and likely invariant owner.
- Tests that were changed or should exist.

### 3. Read Invariants and Extract Contracts

Read only the docs that govern the changed surfaces. Extract invariant clauses into an `InvariantCoverage` table:

```markdown
## InvariantCoverage

| Surface | Invariant source | Contract excerpt in your words | Changed files checked |
| --- | --- | --- | --- |
| Option Trades saved filters | doc/domain-knowledge/option-trades/domain-invariants.md#... | Paid users' saveable filters, columns, sort, and page size survive refresh; momentary date/time/lookback/page do not persist. | src/... |
```

Paraphrase rather than pasting long wiki text. Include headings or anchors when possible.

### 4. Classify Drift

Use these classifications:

| Classification | Meaning | Required action |
| --- | --- | --- |
| `behavior_preserved` | Code changed implementation details but still satisfies the invariant. | Note evidence and any targeted tests. |
| `code_violates_invariant` | The diff likely weakens or breaks a documented invariant. | Treat as a blocker; recommend code change before merge. |
| `wiki_not_updated_for_intended_change` | The code intentionally changes product behavior, and that may be valid, but the domain wiki was not updated. | Require wiki update or product approval before merge. |
| `invariant_gap` | The code touches a recurring product rule that the wiki does not clearly govern. | Require product decision and wiki clarification. |
| `needs_product_decision` | Code and wiki point to different plausible product choices. | Do not choose silently; ask for decision. |
| `test_or_fixture_only` | Diff changes tests, mocks, fixtures, or stories without changing product code. | Still verify tests are not encoding behavior that contradicts invariants. |
| `not_domain_relevant` | Diff is mechanical and has no user/system contract effect. | Explain why and move on. |

Red flags that usually need a drift row:

- Access gates move from a shared boundary into local one-off logic.
- Guest or unpaid users can change, persist, export, stream, or inspect premium-only data.
- Paid users lose documented persistence or continuity guarantees.
- Saved state starts persisting momentary research fields.
- Ranking/filtering starts using partial slices where full-session semantics are required.
- DEI, GEX, sentiment, side, or execution terms are renamed or reinterpreted.
- Symbol identity, aliasing, watchlists, or ticker search behavior changes in only one surface.
- A UI refactor hides, disables, or re-labels controls in a way that changes the product promise.
- Locale/copy edits change the meaning of a domain term.
- Test fixtures redefine account states, billing states, public previews, or seeded saved views.
- Error handling suppresses user-blocking failures or invents an observability severity outside the policy.

### 5. Produce the Drift Matrix

Use this table in the final report:

```markdown
## InvariantDriftMatrix

| Changed behavior | Files | Invariant source | Classification | Evidence | Required action |
| --- | --- | --- | --- | --- | --- |
| ... | `src/...` | `doc/domain-knowledge/.../domain-invariants.md#...` | `code_violates_invariant` | Diff now allows unpaid users to apply watchlist scope; invariant says scope changes are paid-only. | Fix code before merge; add targeted access-gate test. |
```

Keep rows behavior-level, not file-level, when several files implement one behavior.

### 6. Verification

This audit can be complete from code and docs when the diff is simple. Run tests only when they are cheap, relevant, and do not require credentials or production resources.

Use repo-pinned pnpm when running commands:

```bash
corepack pnpm@9.15.2 exec vitest run <focused-test-file-or-pattern>
corepack pnpm@9.15.2 typecheck
corepack pnpm@9.15.2 validate:routes
git diff --check
```

Use `pnpm exec vitest run` for focused unit files. In this repo, `corepack pnpm@9.15.2 test:unit -- <file>` can pass a literal `--` into Vitest and run the full suite instead of the intended file.

Do not run full E2E, Browser walkthroughs, build, production probes, billing mutations, or database migrations unless the user asks or the drift cannot be resolved without them.

Report verification as:

```markdown
## Verification

- Ran: ...
- Not run: ... because ...
- Residual risk: ...
```

If tests are already known to be noisy, do not bury the audit under unrelated failures. Run the narrowest relevant command and state baseline noise separately.

### 7. Decide the Next Action

For each drift row, recommend exactly one primary next action:

- `fix_code`: current diff breaks a documented invariant.
- `update_wiki`: product behavior intentionally changed and the invariant docs must move with it.
- `product_decision`: code and docs disagree and neither should win silently.
- `add_test`: invariant is preserved but there is no guard for a risky boundary.
- `no_action`: behavior is preserved or not domain relevant.

When a wiki update is required, name the exact file and section. When code should change, name likely files, but do not implement in this run unless the user asks.

## Deliverable Template

```markdown
## Summary

- Diff source:
- Overall result: no drift / drift found / blocked
- Highest-risk item:

## DiffScope

...

## InvariantCoverage

...

## InvariantDriftMatrix

...

## Required Actions

- `fix_code`: ...
- `update_wiki`: ...
- `product_decision`: ...
- `add_test`: ...

## Verification

...

## Blockers

...

## Runbook Maintenance

Runbook maintenance: no change
```

If there are no findings, say that directly and still list the docs and diff source checked.

## Common Judgment Rules

- A refactor is not domain drift if it preserves the externally promised behavior and keeps the owning boundary coherent.
- A code change can be correct even when it differs from old code, but if it changes a documented invariant then the wiki must change too.
- A test update that makes a previously forbidden behavior pass is a domain change until proven otherwise.
- A UI-only diff can still drift if it changes labels, disabled states, upgrade prompts, persistence affordances, or data interpretation.
- New local one-off gates are suspicious when a shared access boundary already owns the rule.
- If the user explicitly says the task is a planned product change, do not block only because the old invariant differs. Instead classify as `wiki_not_updated_for_intended_change` or `needs_product_decision`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether the audit exposed a reusable lesson for future drift checks.
2. Promote durable lessons into required context, surface mapping, drift classifications, or verification guidance.
3. Keep transient state in `Agent Handoff` only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- The app repo moves or renames domain invariant docs.
- The integration branch, package-manager command, or required read order changes.
- A repeated false positive or missed drift pattern appears.
- A new domain module becomes part of the mandatory wiki.
- A verification command or source path drifts.

Do not update this runbook for:

- One-off diff findings.
- Current branch names, current counts, raw logs, or transient local dirtiness.
- Completed audit items that belong only in the final report.
