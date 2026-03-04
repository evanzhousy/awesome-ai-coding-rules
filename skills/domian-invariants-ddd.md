---
name: domain-invariants-wiki
description: Given a project folder route, analyzes the folder and produces a wiki plan listing key domain invariants—external dependencies/contracts, UI/UX constraints, and refactor-breaking rules. Use when documenting invariants for refactoring, when onboarding, or when the user asks for domain invariants, external contracts, or UX constraints that must not be broken.
---

# Domain Invariants Wiki Plan

Produce a **plan** (and optionally draft wiki text) that lists **key domain invariants** for a given project folder. Key domain invariants are constraints that, if violated during refactoring, break user experience or break the system. They fall into two main categories:

1. **External dependencies / external contracts** — APIs, env vars, wire formats, storage keys, and third-party contracts that the code must obey.
2. **UI/UX invariants** — behaviors and rules that users rely on; changing them breaks expectations (e.g. session reset rules, filter merge behavior, persistence allowlists, masked content handling).

---

## What Counts as a Key Domain Invariant

| Type | Examples |
|------|----------|
| **External contract** | Auth token claim names, API version pins, query param names, column names in DB/ClickHouse, localStorage keys, WebSocket message shapes. |
| **UI/UX rule** | "Session-only fields reset on load"; "Save button dirty-check must exclude X"; "Masked rows must be blurred, not stripped"; "Initialize with `initializeFilters` not `setTableFilters` on load." |
| **Refactor-breaking** | "Filter wire format is an API contract"; "Column key must be the same string in column def, state map, and persisted doc"; "Legacy migration runs once and is one-way." |

Exclude: internal coding style, naming preferences that don’t affect behavior, and invariants that are already fully enforced by types/tests and don’t need documenting.

---

## Workflow

1. **Scope** — Confirm the folder route (e.g. `src/pages/optionTrades`, or repo root for app-wide invariants).
2. **Discover** — Search for external integrations, env vars, API calls, persistence keys, and feature-specific state/flows. See "Where to look" below.
3. **Classify** — For each finding, label as **external contract** or **UI/UX invariant** and note what breaks if violated.
4. **Plan** — Write a structured plan (and optionally wiki) using the template in [reference.md](reference.md).

---

## Where to Look

- **External contracts:** `*.env*`, config files, API client modules, WebSocket/SSE setup, any module that imports or calls third-party SDKs (Clerk, Stripe, ClickHouse, etc.). Look for hardcoded keys, URL params, and response/request field names.
- **Persistence:** localStorage/sessionStorage keys, saved-filter or preference schemas, migration logic (one-way vs re-runnable).
- **UI/UX invariants:** Feature wikis under `wiki/`, store initializers and setters (e.g. `initializeFilters` vs `setTableFilters`), dirty-check logic, filter merge/apply logic, handling of masked/teaser content, session-only vs persisted fields, column visibility/order and its link to persisted layout.

When the project already has a `wiki/current-wiki/domain-invariants/` (or similar), align section names and level of detail with existing docs (e.g. `external-dependencies.md`, per–data-app invariant files) so the new plan can be merged in consistently.

---

## Required: Why this invariant is in the wiki

**Every** invariant in the plan and in the generated wiki **must** state:

1. **Why it is in the wiki** — Why this rule is documented as a domain invariant (e.g. it’s an external contract, or it’s easy to break during refactors).
2. **Why it is important** — What breaks for users or the system if it’s violated (concrete consequence).

Without both, readers cannot judge whether a change might break the invariant. The wiki is not a bare list of rules; it justifies each one.

---

## Output

Produce:

1. **Plan** — A bulleted or numbered list of key domain invariants, each with:
   - Short title
   - Type: external contract | UI/UX invariant
   - **Why in wiki** — Why this is documented as an invariant.
   - **Why important** — One-sentence "If violated: …" consequence.
   - Optional: file/area to document under
2. **Wiki draft** — For each invariant, 1–3 sentences describing the rule, **plus** explicit "Why in wiki" and "Why important" (or a single **Why:** paragraph that covers both). Add tables (e.g. field names, wire formats) where useful.

Use the templates and checklist in [reference.md](reference.md) for consistent structure and wording.X