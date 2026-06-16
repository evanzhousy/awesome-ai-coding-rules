---
name: runbook-maintainer
description: Maintain existing AI-agent runbooks after execution. Use when Codex needs to run, continue, or update a Markdown/plain-text runbook intended for future agents, especially runbooks that should be invoked with /goal, revised from greenfield-style post-run lessons, and kept current with a pruned progress/todo handoff section.
---

# Runbook Maintainer

## Purpose

Use this skill to treat a runbook as both an executable procedure and the handoff state for the next agent. Keep durable instructions in the main runbook, keep transient next-run state in one bounded progress/todo section, and remove completed progress every run.

## Recommended Invocation

Use `/goal` when maintaining multiple runbooks or skills:

- Objective: update the requested runbook/skill files so the next agent can execute them with clearer instructions, bounded handoff state, and pruned completed progress.
- Success criteria: each target has a clear objective, `/goal` guidance when useful, durable lessons in the body, transient next-run state in a bounded handoff/backlog/watchlist, and no stale completed todos.
- Stop condition: all target files are updated and validated by re-read/diff checks, or a blocker identifies the file or product evidence that must be resolved first.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items after the latest maintenance sweep. This file is itself an ops runbook copy of the `runbook-maintainer` skill guidance; keep future changes aligned with the installed skill when both are meant to behave the same.

## Workflow

1. Locate and read the runbook before acting.
   - Identify the runbook objective, expected operator, prerequisites, commands, verification gates, and any existing progress/todo section.
   - If the runbook is missing a clear objective or success criteria, add them during the update.
   - If a command or action could affect production, spend money, delete data, or notify people, follow the user's approval and safety requirements before running it.

2. Prefer goal-mode execution for long or verifiable runbooks.
   - When the environment supports `/goal` and the user has asked to run or continue the runbook, structure execution as a goal with:
     - Objective: the concrete outcome the runbook is meant to achieve.
     - Success criteria: tests, checks, artifacts, or observable states that prove completion.
     - Stop condition: complete, genuinely blocked, or user-directed pause.
   - When editing the runbook, add or repair a concise "Recommended Invocation" or equivalent section that tells the next agent how to run it with `/goal`.

3. Execute the runbook from the current truth.
   - Start with the progress/todo handoff if it exists, then verify whether each item is still relevant.
   - Run the documented steps, capture important outputs and failures, and verify outcomes with the runbook's stated checks.
   - Do not paste full logs into the runbook. Keep evidence as paths, commands, timestamps, or short observations only when they change the next run.

4. Perform the post-run greenfield pass.
   - Use `$greenfield` when it is available or explicitly requested; otherwise do a greenfield-style review directly.
   - Compare the observed run against the ideal next execution: missing prerequisites, ambiguous commands, stale assumptions, ordering problems, weak verification, unsafe steps, repeated manual work, and unclear ownership.
   - Promote only durable lessons into the main runbook. A lesson is durable if it should still help after the current task state is gone.
   - Remove or rewrite instructions proven stale by the run. Do not preserve obsolete advice for historical context.

5. Update the progress/todo handoff.
   - Prune before adding. Delete completed, obsolete, duplicated, or no-longer-actionable items from prior runs.
   - Move recurring lessons into the main runbook instead of leaving them as todos.
   - Add only unresolved work that the next agent should look at first.
   - Keep the section short: default to 3-7 bullets and never exceed 12 unless the user explicitly asks.
   - Each item must state the next action and the current evidence or blocker in one bullet.

6. Validate the edited runbook.
   - Re-read the changed sections for consistency with the actual outcome.
   - Check that the runbook still distinguishes durable procedure from transient progress.
   - Ensure the next agent can start from the top, see the current handoff quickly, and know the verification path.

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

## Editing Rules

- Preserve the runbook's existing structure and style when practical.
- Keep changes scoped to what the run proved or what the next run needs.
- Prefer precise commands, file paths, success criteria, and failure recovery steps over broad advice.
- Do not make the runbook a transcript. Store history elsewhere if the user asks for an audit trail.
- Do not mark a blocked item as done unless the blocker was actually removed or a replacement path was documented.
- If the runbook conflicts with live evidence, update the runbook and mention the conflict in the final response.

## Final Response

Report the run outcome, the runbook path changed, whether `/goal` guidance was added or revised, and the remaining open handoff items. Mention any verification that could not be run.
