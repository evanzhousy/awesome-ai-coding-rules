---
name: runbook-maintainer
description: Maintain existing AI-agent runbooks after execution or during maintenance sweeps. Use when Codex needs to run, continue, normalize, or update Markdown/plain-text runbooks intended for future agents, especially runbooks that should be invoked with /goal, revised from greenfield-style post-run lessons, self-evolved through a runbook self-maintenance guide, deduplicated into canonical runbooks plus aliases, and kept current with a pruned progress/todo handoff section.
---

# Runbook Maintainer

## Purpose

Use this skill to treat a runbook as both an executable procedure and the handoff state for the next agent. Keep durable instructions in the main runbook, keep transient next-run state in one bounded progress/todo section, and remove completed progress every run.

Every maintained runbook should explain how it maintains itself. A runbook that agents repeatedly execute should contain a small self-maintenance guide that tells future agents when to update the runbook body, when to update only the handoff state, and when to leave the runbook unchanged.

Distinguish a real runbook execution from a maintenance-only sweep. If no operational steps were run, say that explicitly in the handoff and final response.

## Recommended Invocation

Use `/goal` when maintaining multiple runbooks or skills:

- Objective: update the requested runbook/skill files so the next agent can execute them with clearer instructions, bounded handoff state, pruned completed progress, and explicit self-maintenance rules.
- Success criteria: each target has a clear objective, `/goal` guidance when useful, durable lessons in the body, a self-maintenance guide, transient next-run state in a bounded handoff/backlog/watchlist, and no stale completed todos.
- Stop condition: all target files are updated and validated by re-read/diff checks, or a blocker identifies the file or product evidence that must be resolved first.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items after the latest maintenance sweep. This file is itself an ops runbook copy of the `runbook-maintainer` skill guidance; keep future changes aligned with the installed skill when both are meant to behave the same.

## Workflow

1. Locate and read the runbook before acting.
   - Identify the runbook objective, expected operator, prerequisites, commands, verification gates, and any existing progress/todo section.
   - For batch requests, inventory every target file first. Classify canonical runbooks, aliases/duplicates, empty index files, and supporting notes before editing.
   - Check worktree status or equivalent file state when editing a repo. Preserve modified or untracked content you did not create.
   - If the runbook is missing a clear objective or success criteria, add them during the update.
   - If a command or action could affect production, spend money, delete data, or notify people, follow the user's approval and safety requirements before running it.

2. Prefer goal-mode execution for long or verifiable runbooks.
   - When the environment supports `/goal` and the user has asked to run or continue the runbook, structure execution as a goal with:
     - Objective: the concrete outcome the runbook is meant to achieve.
     - Success criteria: tests, checks, artifacts, or observable states that prove completion.
     - Stop condition: complete, genuinely blocked, or user-directed pause.
   - When editing the runbook, add or repair a concise "Recommended Invocation" or equivalent section that tells the next agent how to run it with `/goal`.
   - When the user asks only to update, normalize, or maintain runbooks, do not execute production-affecting commands just to populate evidence. Add the invocation guidance and note that the current pass was maintenance-only.

3. Execute the runbook from the current truth.
   - Start with the progress/todo handoff if it exists, then verify whether each item is still relevant.
   - Run the documented steps, capture important outputs and failures, and verify outcomes with the runbook's stated checks.
   - Do not paste full logs into the runbook. Keep evidence as paths, commands, timestamps, or short observations only when they change the next run.

4. Perform the post-run greenfield pass.
   - Use `$greenfield` when it is available or explicitly requested; otherwise do a greenfield-style review directly.
   - Compare the observed run against the ideal next execution: missing prerequisites, ambiguous commands, stale assumptions, ordering problems, weak verification, unsafe steps, repeated manual work, and unclear ownership.
   - For duplicate or alias runbooks, choose one canonical owner. Prefer a thin alias that points to the canonical runbook over maintaining two full bodies that can drift.
   - Promote only durable lessons into the main runbook. A lesson is durable if it should still help after the current task state is gone.
   - Remove or rewrite instructions proven stale by the run. Do not preserve obsolete advice for historical context.

5. Add or update the runbook's self-maintenance guide.
   - Ensure the runbook tells future agents to perform a short post-run maintenance decision before finalizing.
   - Add this guide when it is missing; revise it when the current run reveals a better rule for future runs.
   - Keep the guide generic and durable. Do not encode one-off incident results, current counts, or temporary blockers as permanent self-maintenance rules.
   - Prefer a short section named `Runbook Self-Maintenance`, `Self-Maintained Runbook Rules`, or the nearest existing equivalent.
   - If the runbook already has a strong self-maintenance section, improve it in place instead of adding a duplicate section.

6. Update the progress/todo handoff.
   - Prune before adding. Delete completed, obsolete, duplicated, or no-longer-actionable items from prior runs.
   - Move recurring lessons into the main runbook instead of leaving them as todos.
   - Treat existing active backlogs, watchlists, "Latest run note" sections, or equivalent runbook-owned state as handoff surfaces. Update or point to them instead of duplicating the same open item in a new section.
   - Add only unresolved work that the next agent should look at first.
   - Keep the section short: default to 3-7 bullets and never exceed 12 unless the user explicitly asks.
   - Each item must state the next action and the current evidence or blocker in one bullet.

7. Validate the edited runbook.
   - Re-read the changed sections for consistency with the actual outcome.
   - Check that the runbook still distinguishes durable procedure from transient progress.
   - Ensure the next agent can start from the top, see the current handoff quickly, know the verification path, and know how to maintain the runbook after the next run.
   - For batch edits, run a lightweight coverage check that every target runbook has the intended invocation/handoff shape or an intentional alias/index reason.

## Self-Maintenance Guide Pattern

If the runbook lacks self-maintenance guidance, add a compact section near the handoff, maintenance, or verification sections:

```markdown
## Runbook Self-Maintenance

At the end of each run:

1. Decide whether this runbook changed because the run revealed a reusable lesson.
2. Promote durable lessons into the procedure, prerequisites, verification, or troubleshooting sections.
3. Keep transient state in `Agent Handoff`, active backlog, watchlist, or latest-run note only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:
- A command, selector, endpoint, schema, credential path, tool name, or validation check drifted.
- A repeated blocker or ambiguity slowed execution.
- A verification gate was too weak, too broad, or missing.
- A duplicate runbook or alias needs a clearer canonical owner.

Do not update this runbook for:
- One-off counts, transient incidents, raw logs, or current-run-only findings.
- Completed progress that belongs only in the final report.
- Speculative future improvements that were not supported by the run.
```

Keep the self-maintenance guide as policy, not history. It should tell the next agent how to evolve the runbook safely without bloating it.

## Handoff Section Pattern

If the runbook lacks a progress/todo area, add one near the top after the title or overview:

```markdown
## Agent Handoff

Last updated: YYYY-MM-DD

### Look First

- [ ] Next action, with the current evidence or blocker.

### Blocked / Needs Decision

- [ ] Decision needed, why it blocks progress, and where to verify.
```

Keep this section as live state, not a changelog. Remove checked-off items instead of accumulating `[x]` entries. If there are no open items, write a single line such as `No open handoff items after the latest run.` rather than keeping empty headings.

If the pass was documentation maintenance only, say so in the handoff, for example: `This was a documentation normalization only; no production checks were executed.`

## Editing Rules

- Preserve the runbook's existing structure and style when practical.
- Keep changes scoped to what the run proved or what the next run needs.
- Prefer precise commands, file paths, success criteria, and failure recovery steps over broad advice.
- Do not claim a runbook was executed when only its documentation was updated.
- Do not keep full duplicate runbook bodies in sync unless there is a clear reason; name the canonical file and make aliases point to it.
- Do not create multiple self-maintenance sections; merge with the existing maintenance/watchlist/backlog policy when present.
- Do not make the runbook a transcript. Store history elsewhere if the user asks for an audit trail.
- Do not mark a blocked item as done unless the blocker was actually removed or a replacement path was documented.
- If the runbook conflicts with live evidence, update the runbook and mention the conflict in the final response.

## Final Response

Report the run outcome, the runbook path changed, whether `/goal` guidance was added or revised, whether self-maintenance guidance was added/revised/left unchanged, and the remaining open handoff items. Mention whether the pass executed the runbook or was maintenance-only, any canonical/alias changes, and any verification that could not be run.
