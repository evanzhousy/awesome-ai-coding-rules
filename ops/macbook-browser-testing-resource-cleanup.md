---
name: macbook-browser-testing-resource-cleanup
description: Conservatively reclaim MacBook resources by closing stale non-default ego-browser task spaces and terminating stale local web servers that Codex started for in-app Browser testing.
disable-model-invocation: true
---

# MacBook Browser-Testing Resource Cleanup

Use this runbook when an AI agent is asked to reclaim MacBook memory and local ports left behind by Codex browser testing.

This runbook owns two resource classes only:

1. Local development or test web-server processes that Codex started for [@Browser](plugin://browser@openai-bundled) testing.
2. Stale pages inside non-default ego-browser task spaces.

Here, “memory cleanup” means releasing resources held by those processes and task-space pages. It does **not** mean deleting Codex memory files, browser profiles, cookies, caches, worktrees, repositories, or user data.

Design statement: one conservative machine-local workflow owns discovery, proof of staleness, graceful cleanup, and post-action verification; the Browser default space and every ambiguous or active resource remain protected.

## Recommended Invocation

Use `/goal` for an execution that should continue until every safe candidate is cleaned or explicitly classified as protected or unresolved:

- Objective: reclaim machine-local resources by closing proven-stale non-default ego-browser task spaces and gracefully terminating proven-stale local web servers launched for Codex in-app Browser testing.
- Success criteria: current resources are freshly inventoried; every mutation targets an exact task-space ID, tab `targetId`, or PID; the ego-browser default space, user-controlled spaces, active Codex tasks, active browser sessions, and unrelated listeners are preserved; each ego-browser closure returns `done: true`; each pruned tab is absent from the verified remaining-tab inventory; each terminated listener disappears or is reported with its exact blocker; no files, profiles, cookies, caches, or repositories are deleted; and the final report distinguishes cleaned, protected, unresolved, and unchanged resources.
- Stop condition: all proven-stale candidates pass verification, no safe candidates exist, an ownership/control boundary requires user confirmation, or an exact unresolved resource and missing evidence are reported.

Pasteable objective:

```text
Use ops/macbook-browser-testing-resource-cleanup.md as the runbook. Perform a fresh, conservative cleanup of this Mac only. Close proven-stale non-default ego-browser task spaces and gracefully terminate only local web servers proven to have been started for completed Codex in-app Browser testing. Preserve the default browser space, active or user-controlled task spaces, active Codex/ChatGPT/Cursor/Chrome/ego-lite integrations, and unrelated listeners. Do not delete files, profiles, cookies, caches, worktrees, repositories, or Codex memories. Do not use name-based blanket kills or SIGKILL without my explicit approval. Verify every exact ID/PID and report cleaned, protected, unresolved, and unchanged resources separately.
```

## Agent Handoff

Last updated: 2026-08-11

No open handoff items. This was a documentation-only creation pass. No processes were terminated and no ego-browser task spaces or pages were closed. A read-only `listTaskSpaces()` probe confirmed the installed helper's current inventory fields; on the installed ego-browser version, `help('listTaskSpaces')` may say `Unknown helper` even though the documented helper itself works.

## Non-Negotiable Safety Rules

- Run only on the current Mac and only against resources visible in a fresh scan. Never reuse historical PIDs, ports, process ages, or task-space IDs.
- Inventory and classify before mutating. A resource is stale only when every required gate below is satisfied.
- Never use `pkill`, `killall`, `pkill -f`, a broad regular expression, a port-range kill, or a name-only kill.
- Never treat age, low CPU, `PPID 1`, a process name such as `node`, or an old-looking tab title as sufficient proof by itself.
- Preserve Codex, ChatGPT, Browser-plugin, Chrome, Cursor, ego-lite, browser-extension, and crash-reporting processes unless the exact target is separately proven to be the local app server launched for a completed test.
- Never use `sudo` for this runbook.
- Send `SIGTERM` first. Do not send `SIGKILL` unless the user explicitly approves it for the exact still-running PID after a fresh reinspection.
- Never delete browser profiles, cookies, caches, local storage, session stores, Codex memory files, worktrees, project files, lockfiles, or temporary directories.
- Never enter, switch to, close, or otherwise manipulate ego-browser's default browsing space.
- Never call `claimTaskSpace(...)` or `takeOverTaskSpace(...)` as a cleanup shortcut. User control, inactive ownership, or unassigned ownership is a hard stop that requires explicit user confirmation.
- If evidence is ambiguous, skip the resource and report the exact missing proof. “Nothing was safe to clean” is a valid successful run.

## Required Skills And Tools

Read the current versions before execution because browser helper contracts can drift:

1. `browser:control-in-app-browser` for the user-named in-app Browser surface. Use it read-only to correlate local test pages when needed; do not substitute Chrome, ego-browser, repository Playwright, or another browser for this check.
2. `/Applications/ego lite.app/Contents/Frameworks/ego Framework.framework/Versions/Current/Resources/ego-skills/ego-browser/SKILL.md`, or the installed versioned equivalent, for task-space ownership and completion rules.
3. `runbook-maintainer` after execution if live evidence reveals durable drift in this procedure.
4. macOS `ps`, `lsof`, `/bin/kill`, `date`, `awk`, and `rg` for process discovery and verification.

Do not create an ego-browser task space for the cleanup. The read-only inventory helper works without `useOrCreateTaskSpace(...)`, and creating a cleanup space would add the kind of resource this runbook is meant to remove.

## Stale Classification Gates

### Local Web Server

A listener is a cleanup candidate only when **all** of these are true:

| Gate | Required proof |
| --- | --- |
| Local listener | A fresh `lsof` scan shows an exact current-user PID listening on a local development/test port. |
| Codex test attribution | Its full command, working directory, parent/process group, port, and current task context identify it as the app server Codex launched for in-app Browser testing. |
| Old enough | Its elapsed time exceeds 24 hours by default, or exceeds a different threshold explicitly supplied by the user for this run. |
| Test is finished | The associated Codex test/task is completed, cancelled, or otherwise explicitly abandoned. |
| No active consumer | It is not required by any active task, terminal, user workflow, or current browser test. Any established connection is explained before cleanup. |
| Isolated target | The exact PID and any process-group members are understood; the target is not a Browser/plugin runtime, another app's service, or a shared server. |

An open localhost tab is a correlation signal, not automatic proof that a server is active or stale. Map it to the owning task. If the tab/task relationship cannot be established, preserve the process.

### ego-browser Task Space

An ego-browser task space is a cleanup candidate only when **all** of these are true:

| Gate | Required proof |
| --- | --- |
| Non-default boundary | The entry came from `listTaskSpaces()`; the agent never navigated to or selected the default browsing space. |
| Agent-created | `createdBy` is `agent`. |
| Agent-owned | `ownership` is `agent`, not `user`, `agentDelegatedToUser`, inactive, unassigned, or user-controlled. |
| Task is finished | Its `id`, `name`/`taskId`, and recent tab titles correlate to a completed, cancelled, or explicitly abandoned Codex task. |
| No active reuse | No current or concurrent Codex task needs the space, and the user did not ask to keep it open. |
| Exact target | The exact numeric ID was copied from the fresh inventory and confirmed before the completion call. |

`profileId: "Default"` or `profileName` describes the browser profile inherited by a task space. It is **not** proof that the entry is the default browsing space, and it must not be used as a cleanup selector.

The current task-space inventory does not provide a reliable age field. Do not invent an age from the task name or tab titles. If completion/current-use status cannot be proven from the Codex task context, preserve the space or ask the user to confirm the exact candidate IDs.

When a non-default task space must remain open, an individual page/tab is a pruning candidate only when its exact `targetId` came from a fresh `listTabs()` call, it is clearly a scratch or abandoned page, and another tab that must remain has been identified. If every page is stale, close the whole task space with `completeTaskSpace(...)` instead of pruning tabs one by one.

## Workflow

### 0. Scope And Protect Current Work

Before any mutation, record:

- Run timestamp and the stale threshold; default is 24 hours.
- The current Codex task and any concurrent task known to be running browser tests or local servers.
- Any local URL/port explicitly requested to remain available.
- Any ego-browser task-space ID explicitly requested to remain open.
- Whether the run is cleanup execution or documentation/diagnosis only.

When current in-app Browser tabs are needed for attribution, follow the current Browser skill and selected Browser documentation, list tabs read-only, and record only localhost/loopback URLs, ports, and safe titles relevant to this cleanup. Do not inspect cookies, local storage, profiles, passwords, or session stores, and do not close in-app Browser tabs under this runbook.

If concurrent browser work cannot be enumerated, do not clean an ambiguous server or ego-browser space.

### 1. Inventory ego-browser Task Spaces Read-Only

Run one observation-only heredoc. Do not call `useOrCreateTaskSpace`, `claimTaskSpace`, `takeOverTaskSpace`, `switchTaskSpace`, `closeTab`, or `completeTaskSpace` here.

```bash
ego-browser nodejs <<'EOF'
const spaces = await listTaskSpaces()
const inventory = spaces.map((space) => ({
  id: space.id,
  name: space.name,
  taskId: space.taskId,
  createdBy: space.createdBy,
  ownership: space.ownership,
  profileId: space.profileId,
  profileName: space.profileName,
  recentTabTitles: space.recentTabTitles,
}))
cliLog(JSON.stringify(inventory, null, 2))
EOF
```

Build a candidate table before closing anything:

| ID | Name/task ID | Ownership | Completed-task evidence | Decision |
| --- | --- | --- | --- | --- |
| exact ID | safe name | exact value | current task/handoff evidence | close space / prune tabs / protect / unresolved |

Rules:

- Protect `user` and `agentDelegatedToUser` ownership.
- Protect any space connected to current or concurrent work.
- Treat an inactive, unassigned, or “user is controlling” response as a hard stop. Do not retry, claim, or take over.
- If task status cannot be proven, show the exact candidate to the user and wait for confirmation.
- Do not use the default GUI space to inspect task-space pages.

### 2A. Close Only Confirmed Stale Task Spaces

Run completion only after a prior heredoc and the task context have confirmed the exact IDs. Per the ego-browser contract, completion belongs in its own dedicated final heredoc. Keep only an immediate read-only ownership recheck and the completion calls in that heredoc; do not mix in navigation or page work.

Replace the sentinel strings below with exact numeric IDs from the immediately preceding inventory. The guard intentionally refuses to run while a sentinel remains.

```bash
ego-browser nodejs <<'EOF'
const rawTargetIds = ['REPLACE_WITH_CONFIRMED_TASK_SPACE_ID']
const targetIds = rawTargetIds.map((value) => Number(value))

if (
  targetIds.length === 0 ||
  targetIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
  new Set(targetIds).size !== targetIds.length
) {
  throw new Error('Refusing cleanup: task-space targets must be unique exact positive numeric IDs')
}

for (const id of targetIds) {
  const latestSpaces = await listTaskSpaces()
  const latest = latestSpaces.find((space) => Number(space.id) === id)
  if (!latest || latest.createdBy !== 'agent' || latest.ownership !== 'agent') {
    throw new Error(`Refusing task-space ${id}: it is missing or no longer agent-created and agent-owned`)
  }
  const result = await completeTaskSpace(id, { keep: false })
  cliLog(JSON.stringify({ id, result }))
  if (!result?.done) {
    throw new Error(`Task space ${id} was not closed; stop without claiming success`)
  }
}
EOF
```

`done: true` is the completion proof. Closing all tabs in a task space closes that task space. Do not add a verification navigation round that recreates or takes over a space.

If the call returns `done: false`, `skipped`, “user is controlling,” inactive, unassigned, or another ownership error:

1. Stop the ego-browser cleanup immediately.
2. Record the exact ID and safe error text.
3. Do not retry and do not call `claimTaskSpace` or `takeOverTaskSpace`.
4. Ask the user whether to preserve the space or explicitly transfer control for a later run.

### 2B. Prune Stale Pages Only When The Task Space Must Remain

Use this branch only when a confirmed non-default, agent-owned task space contains both pages that must remain and scratch/abandoned pages that should close. Do not use it on a current space controlled by another agent, a user-owned/delegated space, or an uncertain space.

First inventory the exact space and its tabs in a read-only round. Use a numeric space ID from Step 1; numeric IDs select only an existing task space and cannot create a new one.

```bash
ego-browser nodejs <<'EOF'
const rawSpaceId = 'REPLACE_WITH_CONFIRMED_TASK_SPACE_ID'
const spaceId = Number(rawSpaceId)

if (!Number.isSafeInteger(spaceId) || spaceId <= 0) {
  throw new Error('Refusing tab inventory: spaceId must be an exact positive numeric ID')
}

const space = (await listTaskSpaces()).find((entry) => Number(entry.id) === spaceId)
if (!space || space.createdBy !== 'agent' || space.ownership !== 'agent') {
  throw new Error(`Refusing tab inventory for ${spaceId}: space is missing or not agent-created and agent-owned`)
}

await useOrCreateTaskSpace(spaceId)
cliLog(JSON.stringify({ spaceId, tabs: await listTabs() }, null, 2))
EOF
```

Classify every returned tab as `keep`, `close`, or `unresolved`. Preserve final results, pages awaiting manual action, pages tied to current work, and any tab whose purpose is unclear.

Then close only exact confirmed `targetId` values. The guard refuses to close every remaining tab; use Step 2A when the whole space is stale.

```bash
ego-browser nodejs <<'EOF'
const rawSpaceId = 'REPLACE_WITH_CONFIRMED_TASK_SPACE_ID'
const rawTargetIds = ['REPLACE_WITH_CONFIRMED_TAB_TARGET_ID']
const spaceId = Number(rawSpaceId)

if (!Number.isSafeInteger(spaceId) || spaceId <= 0) {
  throw new Error('Refusing tab cleanup: spaceId must be an exact positive numeric ID')
}
if (
  rawTargetIds.length === 0 ||
  rawTargetIds.some((id) => !id || id.startsWith('REPLACE_')) ||
  new Set(rawTargetIds).size !== rawTargetIds.length
) {
  throw new Error('Refusing tab cleanup: provide unique exact targetId values from listTabs()')
}

const space = (await listTaskSpaces()).find((entry) => Number(entry.id) === spaceId)
if (!space || space.createdBy !== 'agent' || space.ownership !== 'agent') {
  throw new Error(`Refusing tab cleanup for ${spaceId}: space is missing or not agent-created and agent-owned`)
}

await useOrCreateTaskSpace(spaceId)
const before = await listTabs()
const beforeIds = new Set(before.map((tab) => String(tab.targetId)))

if (rawTargetIds.some((id) => !beforeIds.has(id))) {
  throw new Error('Refusing tab cleanup: at least one targetId is no longer present')
}
if (before.length <= rawTargetIds.length) {
  throw new Error('Refusing tab cleanup: this would close every tab; complete the stale task space instead')
}

for (const targetId of rawTargetIds) {
  await closeTab(targetId)
}

const after = await listTabs()
const afterIds = new Set(after.map((tab) => String(tab.targetId)))
const stillOpen = rawTargetIds.filter((id) => afterIds.has(id))
cliLog(JSON.stringify({ spaceId, closedTargetIds: rawTargetIds, remainingTabCount: after.length }))

if (stillOpen.length > 0) {
  throw new Error(`Tab cleanup did not close targetIds: ${stillOpen.join(', ')}`)
}
EOF
```

If selection reports user control, inactive state, or unassigned ownership, stop without retrying or taking over. If only one retained page remains, leave it; do not add a blank page merely to keep the task space alive.

### 3. Inventory Local Listeners And Candidate Processes

Run a fresh scan after stale ego-browser spaces have been closed so their connections cannot make an abandoned server look active.

```bash
date
lsof -nP -a -u "$(id -un)" -iTCP -sTCP:LISTEN
ps -axo pid=,ppid=,pgid=,user=,lstart=,etime=,state=,pcpu=,pmem=,rss=,command= | \
  rg -i 'vite(\.js)?|next(\.js)?[[:space:]]+dev|astro[[:space:]]+dev|remix[[:space:]]+dev|webpack([[:space:]].*)?(serve|dev-server)|parcel([[:space:]].*)?(serve|watch)|http-server|python([0-9.]*)?[[:space:]]+-m[[:space:]]+http\.server|playwright.*webserver|(^|[ /])(npm|pnpm|yarn|bun)(\.cjs)?[[:space:]]+(run[[:space:]]+)?dev([[:space:]]|$)|deno[[:space:]]+(run|serve)' | \
  rg -v 'rg -i|/bin/zsh -c ps -axo'
```

The process search is a discovery aid only. Cross-reference its PIDs with the listener list; never terminate every match.

For each listener candidate, substitute one exact freshly observed PID into this read-only inspection block:

```bash
cleanup_candidate_pid='REPLACE_WITH_EXACT_PID'

case "$cleanup_candidate_pid" in
  ''|*[!0-9]*)
    echo 'Refusing inspection: cleanup_candidate_pid must be an exact numeric PID'
    exit 1
    ;;
esac

if [ "$cleanup_candidate_pid" -le 1 ] || [ "$cleanup_candidate_pid" -eq "$$" ]; then
  echo 'Refusing inspection: PID 0, PID 1, and the current shell are protected'
  exit 1
fi
if ! /bin/kill -0 "$cleanup_candidate_pid" 2>/dev/null; then
  echo "PID $cleanup_candidate_pid is already gone; return to discovery"
  exit 1
fi

cleanup_candidate_ppid="$(ps -p "$cleanup_candidate_pid" -o ppid= | tr -d ' ')"
cleanup_candidate_pgid="$(ps -p "$cleanup_candidate_pid" -o pgid= | tr -d ' ')"

if [ -z "$cleanup_candidate_ppid" ] || [ -z "$cleanup_candidate_pgid" ]; then
  echo 'Candidate identity changed during inspection; return to discovery'
  exit 1
fi

ps -p "$cleanup_candidate_pid" -o pid=,ppid=,pgid=,user=,lstart=,etime=,state=,pcpu=,pmem=,rss=,command=
ps -p "$cleanup_candidate_ppid" -o pid=,ppid=,pgid=,user=,lstart=,etime=,state=,pcpu=,pmem=,rss=,command=
lsof -nP -a -p "$cleanup_candidate_pid" -d cwd
lsof -nP -a -p "$cleanup_candidate_pid" -iTCP
ps -axo pid=,ppid=,pgid=,etime=,state=,command= | \
  awk -v cleanup_group="$cleanup_candidate_pgid" '$3 == cleanup_group'
```

Before termination, write down for each candidate:

- Exact PID, PPID, PGID, command, start time/elapsed time, working directory, listening port, and RSS.
- Which completed Codex Browser test launched it and the evidence for that attribution.
- Every member of its process group and whether any member belongs to another app or active terminal.
- Any established TCP connection and whether it belongs to active work, a stale page already closed, or an unknown consumer.
- Decision: `terminate`, `protect`, or `unresolved`, with one-sentence evidence.

Preserve the candidate if its CWD is missing or unexpected, the test owner is unknown, the process group contains an unrelated process, an active terminal/task depends on it, or a connection cannot be explained.

### 4. Reconfirm And Terminate One Exact PID At A Time

Immediately before termination, rerun the candidate's `ps`, CWD, and socket checks and compare them with the approved record. This protects against PID reuse or a restarted server. If PID, command, CWD, port, parent, or process group changed, return to discovery.

After reconfirmation, substitute the exact PID into this guarded block:

```bash
cleanup_confirmed_pid='REPLACE_WITH_RECONFIRMED_PID'

case "$cleanup_confirmed_pid" in
  ''|*[!0-9]*)
    echo 'Refusing termination: cleanup_confirmed_pid must be an exact numeric PID'
    exit 1
    ;;
esac

if [ "$cleanup_confirmed_pid" -le 1 ] || [ "$cleanup_confirmed_pid" -eq "$$" ]; then
  echo 'Refusing termination: PID 0, PID 1, and the current shell are protected'
  exit 1
fi

if ! /bin/kill -0 "$cleanup_confirmed_pid" 2>/dev/null; then
  echo "PID $cleanup_confirmed_pid is already gone; no signal sent"
  exit 0
fi

cleanup_confirmed_owner="$(ps -p "$cleanup_confirmed_pid" -o user= | tr -d ' ')"
cleanup_confirmed_pgid="$(ps -p "$cleanup_confirmed_pid" -o pgid= | tr -d ' ')"
cleanup_current_user="$(id -un)"
cleanup_current_shell_pgid="$(ps -p "$$" -o pgid= | tr -d ' ')"

if [ -z "$cleanup_confirmed_owner" ] || [ -z "$cleanup_confirmed_pgid" ]; then
  echo 'Refusing termination: candidate identity changed; return to discovery'
  exit 1
fi
if [ "$cleanup_confirmed_owner" != "$cleanup_current_user" ]; then
  echo 'Refusing termination: candidate belongs to another user'
  exit 1
fi
if [ "$cleanup_confirmed_pgid" = "$cleanup_current_shell_pgid" ]; then
  echo 'Refusing termination: candidate shares the current shell process group'
  exit 1
fi

/bin/kill -TERM "$cleanup_confirmed_pid"

cleanup_attempt=0
while /bin/kill -0 "$cleanup_confirmed_pid" 2>/dev/null && [ "$cleanup_attempt" -lt 10 ]; do
  sleep 1
  cleanup_attempt=$((cleanup_attempt + 1))
done

if /bin/kill -0 "$cleanup_confirmed_pid" 2>/dev/null; then
  echo "PID $cleanup_confirmed_pid is still running after SIGTERM; stop and reinspect"
  exit 2
fi

echo "PID $cleanup_confirmed_pid exited after SIGTERM"
```

Then:

1. Recheck the exact listening port with the guarded command below.
2. Recheck the previously recorded process group.
3. If a verified package-runner parent or child from the same abandoned server remains, inspect it again and terminate that exact PID separately with `SIGTERM`.
4. If the port now belongs to a different PID, inspect the new process from the beginning; do not assume it is the same server or kill it automatically.
5. If a target respawns, identify its supervisor and active owner. Do not enter a kill loop.
6. If `SIGTERM` fails, report the still-running PID. Obtain explicit user approval before any exact-PID `SIGKILL` attempt.

```bash
cleanup_confirmed_port='REPLACE_WITH_EXACT_PORT'

case "$cleanup_confirmed_port" in
  ''|*[!0-9]*)
    echo 'Refusing port check: cleanup_confirmed_port must be an exact numeric port'
    exit 1
    ;;
esac

if [ "$cleanup_confirmed_port" -lt 1 ] || [ "$cleanup_confirmed_port" -gt 65535 ]; then
  echo 'Refusing port check: port must be between 1 and 65535'
  exit 1
fi

lsof -nP -iTCP:"$cleanup_confirmed_port" -sTCP:LISTEN
```

Do not use a negative process-group signal unless every member has been freshly enumerated and the user explicitly approves that broader target. Exact-PID termination is the default.

### 5. Verify The Outcome

The run is complete only when all of the following are recorded:

- Every targeted ego-browser task-space result returned `done: true`, or the exact space is listed as unresolved/protected.
- Every targeted ego-browser tab `targetId` is absent from the after-inventory, the retained space still has at least one required tab, or the exact tab is listed as unresolved/protected.
- The default ego-browser space was never selected or mutated.
- Every targeted PID is gone after `SIGTERM`, or its exact blocker is reported.
- Each targeted port is no longer listening, or a newly owning PID is separately identified and preserved pending classification.
- No active Browser, Codex, ChatGPT, Chrome, Cursor, ego-lite, user workflow, or unrelated listener was changed. No file, profile, cookie, cache, repository, worktree, or Codex memory was deleted; any explicit runbook-maintenance edit is reported separately.
- No `SIGKILL` was used unless the final report names the user's exact approval and PID.

Do not claim an exact number of bytes reclaimed. Browser renderers and operating-system memory accounting are shared and asynchronous. Report resources removed, prior RSS only as an approximation, and optional before/after memory-pressure observations as non-causal context.

## Troubleshooting

### `help('listTaskSpaces')` says `Unknown helper`

Do not conclude that task-space inventory is unavailable. On the currently installed ego-browser build, the direct documented call `await listTaskSpaces()` works even though `help(...)` does not list that helper. Run the read-only inventory heredoc. If the direct call fails, stop and read the current ego-browser installation guidance rather than guessing another API.

### ego-browser says the user is controlling the space

This is a hard stop, not a transient retry condition. Preserve the space, report its exact ID, and wait for explicit user confirmation. Never auto-take over.

### `completeTaskSpace` returns `done: false` or `skipped`

The space was not closed. Do not report success, retry blindly, claim it, or switch to the default space. Report the result and ask for direction if cleanup is still desired.

### `ps` output is too broad or truncated

Filter to candidate server classes for discovery, then inspect only the exact listener PIDs with `ps` and `lsof`. Never compensate for truncated output with a broad kill.

### A process is old, idle, or parented by PID 1

Those are supporting signals only. Require command/CWD/port attribution, completed-task evidence, no active consumer, and an isolated process tree before termination.

### The listener respawns

It has a supervisor or active owner. Stop. Inspect the new PID, parent, launch context, CWD, and sockets. Do not repeatedly terminate it or modify launch agents under this runbook.

### The port remains open under a different PID

The original termination may have succeeded and another process may have bound the port. Treat the new PID as a new candidate and run every classification gate again.

## Final Report Template

```markdown
## MacBook Browser-Testing Cleanup Result

- Run time / stale threshold:
- Mode: execution | read-only diagnosis | documentation maintenance
- Overall verdict: cleaned | nothing safe to clean | partially cleaned | blocked

### Cleaned

- Web servers: PID, port, CWD, completed-test attribution, signal, verification.
- ego-browser task spaces: ID, safe name/task ID, prior ownership, `done: true`.
- ego-browser pages pruned from retained spaces: space ID, exact tab target IDs, remaining tab count.

### Protected

- Resource and the active/default/user-ownership evidence that protected it.

### Unresolved / Needs Decision

- Exact PID or task-space ID, missing proof/control boundary, and next action.

### Safety And Verification

- Default ego-browser space untouched: yes/no.
- Files/profiles/cookies/caches/repos/worktrees/Codex memories deleted: none or exact exception.
- SIGKILL used: no or exact approved PID/evidence.
- Ports/PIDs rechecked:
- Runbook maintenance: no change | changed <path> because <durable lesson>.
```

Do not paste full `ps`, `lsof`, tab, or task-space logs into the final report. Keep only exact safe identifiers and the evidence needed to justify each decision.

## Runbook Self-Maintenance

At the end of each execution:

1. Decide whether live execution revealed a reusable lesson or only current machine state.
2. Promote durable helper, ownership, process-attribution, safety-gate, or verification changes into this procedure.
3. Keep transient PIDs, ports, task-space IDs, tab titles, current process counts, and one-off blockers in the final report or `Agent Handoff` only.
4. Prune completed or obsolete handoff items before adding unresolved work.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Browser or ego-browser helper names, return shapes, ownership semantics, or completion verification drift.
- The default-space boundary changes or `listTaskSpaces()` begins including a default-space record.
- A new recurring server launcher, supervisor, or process-tree shape needs a safer attribution check.
- The 24-hour default or a mutation/verification gate proves too weak or ambiguous.
- This runbook is renamed, moved, or replaced and the canonical ops routing table must change.

Do not update this runbook for:

- One-off PIDs, ports, current tab titles, task-space IDs, memory readings, or process counts.
- A normal no-op cleanup where no candidate satisfied all gates.
- Speculative automation that was not validated safely.

After an edit, re-read the changed sections, verify every referenced skill/runbook path, and run `git diff --check`. Keep this file canonical; use thin links rather than copying the full procedure into another runbook.
