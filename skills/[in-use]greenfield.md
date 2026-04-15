---
name: greenfiled-design-skill
description: Use when planning or implementing non-trivial features, refactors, or fixes where a local patch, one-off helper, or repeated pattern may hide a structural problem.
---

# Greenfield Architectural Design first

Use this when the problem likely reflects a wrong model, not just a missing line.

## Core rules

1. **Domain truth before code shape.** Start from glossary terms, invariants, and product contract. Cleaner architecture does not justify changing documented behavior unless the task explicitly calls for that change.

2. **Design before diff.** Write one sentence naming the concept, owner, and boundary before editing code. If you cannot name it, do not add code for it yet.

3. **No glue, no one-offs.** Every new unit must earn its place as a reusable component or a real boundary with clear inputs and outputs. If code exists only to prop up one feature or wire mismatched abstractions together, rethink the design.

4. **Simplify implementation, not contract.** Reduce concepts, flags, and special cases aggressively. It is acceptable to trim incidental complexity, but do not silently remove product behavior or domain invariants to make the code cleaner.

5. **Duplication is a decision.** When the same shape appears in multiple modules, ask: _one shared invariant, or cousins that will diverge?_
   - **One invariant** → extract a named, typed, stable abstraction.
   - **Cousins** → keep them local, or share only a thin primitive.
   - **Unclear** → keep the logic local and explicit behind clear boundaries. Do not normalize copy-paste, and do not build a premature mega-abstraction with mode flags.

6. **Think greenfield.** Ask what clean shape we would choose today, then adapt that answer to present constraints without cementing a known-bad model.

## Agent checklist (before shipping)

- [ ] One-sentence design statement exists.
- [ ] Design matches domain truth and does not silently shrink product contract.
- [ ] No glue-only or single-use module was added.
- [ ] Repeated patterns got an explicit extract-or-keep-local decision.
