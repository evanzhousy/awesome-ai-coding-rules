---
name: third-party-service-access
description: Canonical human-maintained service-access guide for TradingFlow and OptionData, including the preserved Neon credential record, ego-browser login, Feishu OTP, Stripe CLI authentication, and Better Stack MCP recovery.
disable-model-invocation: true
---

# Third-Party Service Access

Use this runbook when an AI agent needs to open, inspect, or manage a third-party service used by `tradingflow-webapp-fullstack` or `optiondata-portal`. It is the canonical browser-login procedure and service directory for those two projects.

This file also owns the account notes and Better Stack MCP recovery guidance formerly in the deleted `ops/human/password.md`. The [Neon human credential record](#neon-access-and-human-credential-record) is preserved here at the user's request. Treat this document as sensitive: inspect only the needed sections and redact credentials from command output, snapshots, reports, and excerpts.

The goal is to reuse the authenticated ego-browser state and complete normal email verification without interrupting the user. Do not ask the user to sign in, copy an email OTP, or open a magic link when the agent can complete that flow in ego-browser and Feishu Mail. A genuine CAPTCHA, passkey, hardware security key, authenticator-app challenge, phone-only challenge, or unavailable mailbox is still a human-only blocker.

Authentication is not blanket authorization to mutate a service. The current user request controls which read or write actions are allowed after login.

## Recommended Invocation

Use `/goal` for multi-service work:

- Objective: authenticate to every third-party service required by the current task using ego-browser, existing sessions, and the approved Feishu Mail OTP path; select the correct company tenant/project; then complete the requested checks or explicitly authorized management actions.
- Success criteria: each in-scope service is `connected`, `blocked`, or `skipped` with an exact reason; no avoidable login request reaches the user; the selected tenant/project and environment are proven; no password, OTP, recovery code, token, webhook, or complete secret is printed; all actions stay inside the user's requested mutation boundary; and ego-browser tabs/task spaces are cleaned up or intentionally handed off.
- Stop condition: the requested work is complete, or every independent action is complete and a remaining essential service presents a genuine human-only challenge.

Pasteable prompt:

```text
Use ops/human/third-party-service-access.md as the canonical access runbook. Treat its human credential record as sensitive and never print it. Use ego-browser for each required dashboard, reuse its authenticated state, and follow the service-specific identity and login procedure before applying the general defaults. Netlify and Better Stack use public@tfsharedspace.com; Better Stack website login and MCP OAuth must be verified separately. For services that actually request email OTP or magic-link verification, use Feishu Mail at https://tradingflow.feishu.cn/mail and select the exact recipient through Other Accounts at the bottom-left; the general admin mailbox is engineering@tradingflow.com. Do not ask me to log in or provide an email OTP when the approved session or mailbox can complete the step. Prove the correct tenant, project, and environment before acting; authentication alone does not authorize mutations beyond my request. Continue independent services if one is blocked, and report the exact blocker without exposing secrets.
```

## Agent Handoff

Last updated: 2026-10-17

- Stripe product-account switching is **verified in ego-browser** on 2026-10-17: the existing company session switched from `www.optiondata.io` to `TradingFlow.com` (`acct_1AtaljDVsC6tSD27`), then to `www.optiondata.io` (`acct_1MXLheEsKvZ43FCy`), restoring the original account. Follow [Verified Switching Between Product Accounts](#verified-switching-between-product-accounts); product domain, Stripe display name, account ID, and CLI profile are distinct concepts.
- Stripe CLI login remains **blocked**, not end-to-end verified. A fresh retry during the multi-product account check again failed before pairing at `POST https://dashboard.stripe.com/stripecli/auth` with `lookup dashboard.stripe.com: no such host`; ordinary CLI startup also could not access the saved config (`chmod ... operation not permitted`). Temporary test configuration was removed; no saved credential or default CLI account was changed.
- Next action: retry the documented CLI flow in an execution context with permitted Stripe DNS/network access and a writable approved CLI configuration location. No pairing payload, consent, completion poll, new credential, or CLI account/mode GET was produced. Do not ask for an OTP or reset credentials to fix these local execution restrictions. The browser check was session reuse, not fresh sign-in; no billing configuration or customer state was changed.
- Browser cleanup pending: the original `www.optiondata.io` selection was restored and the switcher closed, but the final `finish({ keep: [] })` attempt for task space `154` failed before connecting with `Failed to connect to ego_cli bootstrap`. Closure is not confirmed. When permitted browser connectivity returns, inspect/resume that same space and close it if agent-owned; do not create another space or bypass the sandbox to clean it up.

The latest Netlify login verification remains 2026-10-14: fresh email/password login passed through ego-browser's own API using the user-authorized runtime credential. The session proved `public@tfsharedspace.com`, team `FlowMan Sites` (`engineering-a9acvw0`), project `optiondataportal`, and `www.optiondata.io`; no OTP was requested. Better Stack's latest documented verification remains 2026-10-12 and reused an existing website session and OAuth credentials; fresh OTP login was not exercised. These dates do not certify current service state.

The working invocation was `ego-browser nodejs -e` with a normal non-PTY command. Heredoc and PTY invocations reported a bootstrap connection failure; the documented inline-script invocation completed the same browser workflow. Start with that working mode rather than treating the bootstrap message as proof of missing access or a bad credential.

## Non-Negotiable Boundaries

1. **Reuse before login.** Open the direct dashboard in ego-browser first. Do not sign out of a working company session merely to force `engineering@tradingflow.com`.
2. **Use the named browser API.** Dashboard login and management use `ego-browser nodejs` and the named ego-browser skill. Do not substitute Computer Use to operate Ego Lite, Chrome, the in-app Browser, Playwright, or raw HTTP when the user requires this API.
3. **Do not ask for an email OTP.** Use Feishu Mail when the login recipient is an available company mailbox. Never ask the user to read or paste that code.
4. **Do not expose secrets.** Never send an OTP, password, recovery code, API key, token, session cookie, DSN, webhook URL, database URL, or full environment file to `cliLog`, terminal output, screenshots delivered to the user, or the final report. Do not add runtime secrets to the operational procedure. The existing Neon human credential record is preserved by the requested consolidation; do not duplicate or alter it during an ordinary access run.
5. **Login is not mutation authority.** Read-only inspection and tenant verification are the default. Deploys, DNS edits, billing changes, refunds, subscription changes, user/role changes, secret rotation, data deletion, monitor edits, alert tests, outbound messages, OAuth-app changes, and production configuration changes require authorization from the current request.
6. **Prove scope before acting.** Verify company identity, tenant/account, project/site/application, environment, and Live/Test or Production/Development mode where applicable. Do not rely on a dashboard's last-selected state.
7. **Do not bypass account protection.** Never attempt CAPTCHA bypass, recovery-code guessing, SMS interception, passkey workarounds, or security-key automation.
8. **Do not block the whole workflow unnecessarily.** If one service is blocked, finish every independent service first. Ask for one precise human action only when the blocked service is essential to the remaining work.
9. **Honor ego-browser control.** A `user is controlling`, inactive, or unassigned task-space error is a hard stop under the ego-browser skill. Do not retry or seize control.

## Identity and Environment Defaults

| Purpose | Default | Rule |
| --- | --- | --- |
| Third-party admin identity | `engineering@tradingflow.com` | Apply only when the service has no documented identity override. An earlier Better Stack website check used this identity on 2026-08-11; the newer shared-account recovery instructions below use `public@tfsharedspace.com`. |
| Netlify admin identity | `public@tfsharedspace.com` | Fresh email/password login verified through ego-browser's own API on 2026-10-14 for team `FlowMan Sites` and project `optiondataportal`. Use the current authorized credential. |
| Better Stack shared identity | `public@tfsharedspace.com` | Latest documented website/MCP verification: 2026-10-12. Follow [Better Stack Login and MCP Reactivation](#better-stack-login-and-mcp-reactivation); website and MCP authentication are separate. |
| Stripe operator identity | `public@tfsharedspace.com` | Reused Dashboard session and Personal details email verified through ego-browser on 2026-10-17 for OptionData. Follow [Stripe CLI Login and Account Verification](#stripe-cli-login-and-account-verification); browser, CLI, and MCP authentication are separate. Fresh sign-in and CLI pairing remain unverified. |
| Neon account note | `public@tfsharedspace.com` | The preserved [human credential record](#neon-access-and-human-credential-record) applies to Neon only. Its current validity was not tested in this consolidation. |
| Feishu Mail URL | `https://tradingflow.feishu.cn/mail` | Do not substitute `mail.feishu.cn` or `mail.larksuite.com`. |
| Product end-user production login | `evanzhou@tradingflow.com` | This is an app/Clerk verification exception, not the default vendor-admin identity. Follow the product-review runbook when testing the customer app. |
| TradingFlow production app | `https://app.tradingflow.com` | Do not confuse it with `testapp.tradingflow.com`, preview deployments, or local development. |
| TradingFlow local/test login | Seeded Clerk personas in [Local and test login](../../../tradingflow-webapp-fullstack/doc/ops/codex/browser-access-and-evidence.md#local-and-test-login) | The same seeded personas and test-code procedure are designated for local and `testapp.tradingflow.com`; use only in those environments. Verify identity and current entitlement on the selected host. |
| OptionData production portal | `https://www.optiondata.io` | Include `optiondata.io` and `portal.optiondata.io` only when a target service visibly lists them. |

If a vendor is already authenticated with another approved company member and the correct tenant is accessible, keep that session. If an account chooser appears, select the company identity that visibly has access; do not choose a personal account merely because it is first in the list.

## ego-browser Session Procedure

Use the named `ego-browser` skill and its current helper surface. Keep one task space for the whole user goal so service and mailbox tabs share session state.

```bash
ego-browser nodejs -e '
const task = await taskSpace("third-party service access");
const page = task.page("p1");
await page.goto("<DIRECT_DASHBOARD_URL>");
console.log({ taskSpaceId: task.spaceId, page: page.label });
'
```

These examples use ego-browser skill API v2. The `-e` mode above was verified for this runbook; run it without allocating a PTY (`tty: false` or omitted in the command tool). Use single shell quotes around the script and double quotes for JavaScript strings. Resume the recorded numeric space id and Page label in later rounds. Use `page.snapshot()` and stable refs/locators for ordinary dashboards; use `page.screenshot()` and targeted checks for Feishu Mail. All v2 wait/timeout values are milliseconds. When the user has supplied a credential for the requested login, enter it with `page.fill()` using the freshly observed field ref or locator. Keep the credential runtime-only. Browser-owned autofill menus are not page DOM elements and do not justify switching to Computer Use.

If heredoc or PTY execution reports `Failed to connect to ego_cli bootstrap`, first retry the documented `nodejs -e` mode through a normal non-PTY command. This mode completed the Netlify login even when the other modes failed. Reuse the same task-space id if one was created. If the inline mode also fails, follow the skill's connection troubleshooting and report the exact attempted invocation; do not substitute Computer Use or run outside the sandbox to bypass a restriction. User-control and inactive-space errors remain hard stops and must not be retried through another mode.

When the task succeeds, replace the sample id below with the recorded task-space id and call `finish` exactly once:

```bash
ego-browser nodejs -e '
const task = await taskSpace(123); // Replace 123 with the recorded task-space id.
await task.finish({ keep: [] });
'
```

Use `keep: ["p1"]` only for a Page the user needs to view or continue. For a human-only challenge, use `task.handOff()` and resume only after the user's confirmation. Do not call `finish` while stopped for user control or an error. Preserve pre-existing user tabs.

## Feishu Mail: Exact Mailbox Switch

Do this **before** clicking a vendor's `Send code`, `Continue`, or magic-link button. Preparing the mailbox first prevents an expiring code from turning into a user interruption.

1. Open `https://tradingflow.feishu.cn/mail` in the same ego-browser task space as the vendor dashboard.
2. Look at the **left mail rail**. The current mailbox address appears directly below the blue **Compose** button.
3. Go to the **very bottom-left** of that rail, below the normal folders and labels. Click **Other Accounts** beside the person icon and unread badge. It is pinned to the bottom of the rail; do not search Settings, the top-right avatar, or the nine-dot app launcher.
4. An account picker opens upward from the bottom-left. Click the exact mailbox that will receive the vendor message. For normal third-party admin access, choose **`engineering@tradingflow.com`**.
5. Wait for the mailbox to finish switching. The page may briefly show a spinner or no current address. Do not continue until the small address directly beneath **Compose** visibly reads **`engineering@tradingflow.com`**.
6. Ignore unread-count badges. They do not identify the correct mailbox.

If the vendor says it sent mail to a different company address, repeat the same `Other Accounts` path and select the **exact recipient address** shown by the vendor. Never guess from the sender, unread count, or product brand.

### Retrieve an OTP without leaking it

1. Record the request time and vendor name privately, then request one code.
2. Return to the prepared Feishu tab. Use the Search field at the top of Feishu Mail with the vendor name or sender, or refresh the selected mailbox and inspect the newest message received after the request time.
3. Open only the newest matching message. Old inbox subjects can contain still-visible six-digit codes; do not reuse them.
4. Read the code into a short-lived in-memory variable or visually, switch to the vendor tab, and enter it immediately.
5. Never call `console.log(otp)`. Never print a full Feishu `page.snapshot()` or accessibility tree: message subjects and previews can contain OTP values. Capture the mailbox layout before requesting a code; once OTP mail is present, prefer targeted in-memory extraction and avoid new inbox screenshots. Do not attach a mailbox screenshot to the final report.
6. After successful verification, discard the code and verify the vendor dashboard identity and tenant. Do not preserve the code in notes, shell history, a file, or a runbook update.

If the email contains a magic link, open it in the same ego-browser task space, verify that it lands on the expected vendor domain and tenant, and close the message/mail tab after the dashboard session is established. Do not copy the signed magic-link URL into logs or chat.

### Restore the prior mailbox

When the task does not need more admin OTPs, open **Other Accounts** again and return to the mailbox that was selected before the run. Wait until the address under **Compose** proves the restoration. On the 2026-08-11 verification, switching between `evanzhou@tradingflow.com` and `engineering@tradingflow.com` could briefly clear the current-address label before the new inbox settled.

## Authentication Ladder

Follow a service-specific procedure when one exists; otherwise use this order:

1. **Existing session:** open the direct dashboard and prove the current account, tenant, and project.
2. **Existing company SSO:** if the vendor offers Google or another already-authenticated company SSO, use it and verify the selected company identity before consenting.
3. **Email OTP or magic link:** use `engineering@tradingflow.com` unless the vendor visibly names another approved company recipient; complete the Feishu procedure above without asking the user.
4. **Password form:** allow the browser's existing authenticated/password-manager state to fill it. Do not reveal, extract, or invent a password. Do not start a password reset merely to avoid a handoff.
5. **Human-only challenge:** finish independent work, hand off the exact ego-browser task space, and ask for only the required CAPTCHA, passkey, security key, authenticator, phone, or unavailable-mailbox action. Do not ask the user to send the secret back in chat; ask them to complete it in the handed-off page.

After any login, navigate to the direct dashboard URL again. Login landing pages and remembered last projects are not proof that the intended tenant is selected.

## TradingFlow Local and Test App Login

The TradingFlow repository designates its seeded Clerk personas for both local development and `testapp.tradingflow.com`; these are test users, not production accounts. The local/test credential source lists the persona emails and test-code procedure. Do not copy its one-time test code into this service-access guide. Production login is a separate path; never enter a local/test persona or test code on `app.tradingflow.com`.

| Environment | App URL | How to start/select it |
| --- | --- | --- |
| Local development | `http://localhost:8000` | From `tradingflow-webapp-fullstack`, use Node.js 24 and the pinned pnpm version, then run `PATH=/opt/homebrew/bin:$PATH pnpm dev`. This uses the normal development mode. Do not pass `--mode test`; that disables the app's SSR middleware. If port 8000 is occupied, use the repository's documented free-port Vite command and open the resulting URL. |
| Shared test deployment | `https://testapp.tradingflow.com` | Navigate to this host explicitly. Verify the deployed build/version before reviewing a change; the checked-out `test` branch does not prove which revision is deployed. |

### Steps

1. Select the `active` persona for ordinary paid-flow checks, or choose the required scenario (`canceled`, `trial_no_pm`, or `trial_with_pm`) from the [persona table](../../../tradingflow-webapp-fullstack/doc/ops/codex/e2e-testing/browser-e2e-runbook.md#login-and-subscription-personas). The canonical [local/test credential source](../../../tradingflow-webapp-fullstack/doc/ops/codex/browser-access-and-evidence.md#local-and-test-login) confirms that these persona emails and the seeded test-code procedure apply on **both** local and testapp. Fresh registrations instead require the code actually delivered to that new address.
2. Open the chosen host in the browser surface required by the product review runbook. For local, start the dev server using the table above and wait until it is ready. For testapp, stay on the deployed test host; do not silently switch to local if the deployment is unavailable.
3. Use the app's visible **Sign in** action and enter the selected persona's email. If another user is signed in, open the avatar/User menu, choose **Logout**, and verify the prior identity and protected data disappear before continuing.
4. When the app presents its OTP step, use the local/test seeded code from the canonical credential source above. It is a test fixture code, not email delivered to Feishu; do not use the Feishu OTP procedure for it. Keep it runtime-only and out of screenshots, terminal output, chat, logs, and this runbook. If you are registering a fresh disposable account, use only the actual newly delivered code and its approved mailbox flow.
5. Fill the current code control as shown: one full-code field once, or each single-character field individually. Wait for automatic verification or activate the visible verify/continue control once. Confirm the login modal closes and the avatar/User menu shows the **exact selected email**.
6. Open `/app/billing` on that same host and check the actual subscription, trial, payment-method, and access state before relying on the persona. Persona names can drift from current account state. Re-prove identity and billing on each host; successful login on one host does not establish the current session or access state on the other.
7. If `testapp.tradingflow.com` displays Vercel deployment protection before the TradingFlow page, treat that as a separate infrastructure gate and follow the [testapp troubleshooting procedure](../../../tradingflow-webapp-fullstack/doc/ops/codex/e2e-testing/browser-e2e-runbook.md#sign-in-and-switch-accounts-through-browser). Do not enter a Clerk persona in an infrastructure password form. Record the block and do not substitute production.

The detailed Browser sign-in and account-switching procedure is maintained by the [product E2E runbook](../../../tradingflow-webapp-fullstack/doc/ops/codex/e2e-testing/browser-e2e-runbook.md#sign-in-and-switch-accounts-through-browser). Use it for browser-test mechanics and assertion matrices; this section is the shared-environment entry point. Do not infer that the same signed-in browser session, deployment revision, or billing state is shared merely because the same seeded login works in both environments.

## Neon Access and Human Credential Record

Preserved from `ops/human/password.md` during the 2026-10-17 consolidation. This is an existing human-owned account note, not a fresh login verification. Use it only for an authorized Neon login; do not infer that it belongs to Better Stack or another vendor, even when the email is the same.

- Dashboard: `https://console.neon.tech/`.
- Email: `public@tfsharedspace.com`.
- Password: `Tradingflow123!`.

Keep the credential out of logs, exports, screenshots, reports, code examples, and new copies. Routine runbook maintenance must preserve this record unless the user explicitly requests its correction, migration, or removal.

## Better Stack Login and MCP Reactivation

Last verified: 2026-10-12 (website session, MCP OAuth status, source discovery, and a bounded production-log query; fresh OTP login was not needed). This procedure was consolidated on 2026-10-17 without executing it again.

### Account and entry points

- Shared account: `public@tfsharedspace.com`.
- Website sign-in: <https://betterstack.com/users/sign-in>.
- Codex MCP server name: `betterstack`.
- MCP endpoint: `https://mcp.betterstack.com`.
- Use the `ego-browser` skill and API for all website actions. The Computer plugin is an optional, separately approved interface for the native Feishu app only; it must not control Ego Lite. Read the current skill instructions before using either interface.
- Standing user authorization (2026-10-09): proceed with routine Better Stack read-only reconnections and login using this shared account without asking again when the active rules permit. This does not authorize wider access; any mandatory action-time confirmation still applies. The user approved the read-only grant and terms acknowledgement for this recovery.
- Reuse a working browser session. An authenticated browser and authenticated MCP are separate: the website can be signed in while MCP reports **Not logged in**.

### Check the current connection before reconnecting

Inspect just Better Stack's status without printing other servers' configuration or credentials:

```bash
python3 - <<'PY'
import json, subprocess
servers = json.loads(subprocess.check_output(
    ["codex", "mcp", "list", "--json"], text=True))
server = next((s for s in servers if s.get("name") == "betterstack"), None)
print({k: server.get(k) for k in ("name", "enabled", "auth_status")}
      if server else {"name": "betterstack", "configured": False})
PY
```

- `enabled: true` with `auth_status: "o_auth"` means the CLI has saved OAuth credentials. Verify native tool calls below before declaring the connection usable.
- If native `sources` and a bounded `query` already succeed, keep the working connection; no new OAuth flow or OTP is needed.
- `auth_status: "not_logged_in"` requires the fresh OAuth flow below. If an OAuth connection still fails, inspect the specific startup, refresh, or tool error before choosing reconnection.
- `BETTERSTACK_SOURCE_TOKEN` sends logs; it is not an MCP login or a credential for reading production logs. Do not substitute it for OAuth.

### Reactivate the existing Codex MCP connection

1. Run `codex mcp get betterstack` and `codex mcp list` (or the filtered JSON check above). Confirm the endpoint above and that the server is enabled. Keep any credential-bearing configuration output private. **Not logged in**, an OAuth refresh failure, or missing Better Stack tools can require reconnection. Missing tools alone does not prove an authentication failure.
2. Start `codex mcp login betterstack`. Keep that process running through browser approval and the callback. Use the fresh authorization URL it prints; never save or reuse an old URL, state, authorization code, or callback port.
3. Create one ego-browser TaskSpace for this recovery and navigate its existing `p1` to that URL. Resume the same space in later commands. If Codex opened another browser automatically, the printed URL can still be opened in ego-browser while the original login process waits.
4. If Better Stack asks for login, use the shared email and the Feishu flow below. If it already shows the shared email on the authorization page, no OTP is necessary. If another account is shown, switch to the intended shared account before approval.
5. On **Authorize Codex**, verify that the redirect matches the current command's loopback callback (`http://127.0.0.1:<current-port>/callback/...`). Do not infer authenticity from the self-reported app name alone.
6. Choose **Read-only access** for log/monitor investigation. **Full access** includes writes and needs explicit authority. Preserve an existing authorized scope when refreshing; do not silently widen it. Read-only access covers all teams visible to this account, so resolve the intended team and source after reconnecting.
7. Click **Allow access** when authorized. The observed page also acknowledges Better Stack's Terms of Service and Privacy Policy; if the active Computer/browser rules require confirmation at this step, obtain that confirmation before submitting. Approval must return to the live callback listener.
8. Wait for the login command to report success, then rerun `codex mcp list` and confirm **OAuth** for `betterstack`.
9. Verify that Better Stack initializes and exposes tools in the intended Codex client, then make a read-only inventory call. The current tools are `teams` and `sources` (`mcp__betterstack__teams` / `mcp__betterstack__sources`); older runbooks may refer to `telemetry_list_sources_tool`, so resolve live tool names rather than assuming that legacy name is available. CLI login success alone is not proof that an already-running chat has refreshed its tool catalog. If credentials are saved but the current chat still has no tools, refresh/reconnect that client's MCP connection or start a fresh session; avoid disrupting other running chats.
10. Prove log access as well as inventory access: call `mcp__betterstack__sources` with `name: "Process Service"`, select **Process Service[Production]** in **TradingFlow**, then call `mcp__betterstack__query_help` with its live `source_id` and `source_type: "logs"`. Use the returned table and collection names for a bounded, read-only `mcp__betterstack__query`; do not rely on a remembered source ID or query the table name directly in `FROM`.
11. For ingestion verification, use the date and UTC job window from [the metadata and option-chain runbook](../../../tradingflow-process-service-ec2/wiki/ops/agent-runbook/check-metadata-optionchain-ingestion.md). Select only the needed timestamps, levels, job names, and summary messages, with a small `LIMIT`. Logs older than roughly 30 minutes require the historical `s3Cluster(...)` collection with `_row_type = 1`; use hot storage as well when the window includes recent logs. Before today's first job is due, verify a previous completed trading session. A successful query with no rows proves query access, but does not establish job completion or absence of errors.
12. Report website login, stored OAuth status, native tool discovery, and the production query result separately. Finish the ego-browser TaskSpace with `await task.finish({ keep: [] })` once verification is complete, unless an unfinished sign-in requires the user to continue in that space.

If the server is genuinely absent, add it with `codex mcp add betterstack --url https://mcp.betterstack.com`, then log in. Do not remove/re-add an existing correct configuration as the default repair. Use `codex mcp logout betterstack` only when an explicit credential reset is needed; it clears the saved MCP login. Do not read or copy Codex's credential store into this document.

### Website login and Feishu OTP fallback

Start website verification in one ego-browser TaskSpace using the documented non-PTY invocation:

```bash
ego-browser nodejs -e '
const task = await taskSpace("Better Stack login");
const page = task.page("p1");
await page.goto("https://betterstack.com/users/sign-in");
await page.waitForLoadState();
console.log({ taskSpaceId: task.spaceId, page: page.label });
console.log(await page.snapshot());
'
```

Resume the returned numeric TaskSpace ID for subsequent rounds. Read the installed ego-browser skill before running commands; use the current skill path rather than hard-coding a versioned app bundle. This example uses the public sign-in URL; when navigating an OAuth URL, avoid printing snapshots or metadata that echo its state, code, or callback URL. The public homepage's **Sign in** link does not prove the browser is signed out: follow it and inspect the settled destination and account.

1. Open the sign-in URL in ego-browser. If it redirects to the dashboard and the account is the shared email, reuse that session without requesting a code.
2. If login is required, enter `public@tfsharedspace.com` and follow the site's current email sign-in/code prompt. Do not use the [Neon credential record](#neon-access-and-human-credential-record) as a Better Stack password. If the site requires a password and none is available from an approved source, ask the account owner; do not reset it or invent one.
3. For browser mailbox access, follow [Feishu Mail: Exact Mailbox Switch](#feishu-mail-exact-mailbox-switch) and select the actual recipient `public@tfsharedspace.com` if it is available in that approved mailbox session. The earlier recovery also documented a native Feishu fallback: use Computer only when that interface is approved, select **Feishu / 飞书** → **Mail / 邮箱**, and select the shared mailbox. The verified bundle identifier on this Mac is `com.electron.lark`; if display-name lookup fails, use Computer's app inventory and select that identifier. This permission does not extend to controlling Ego Lite through Computer.
4. Note the previously selected mailbox so it can be restored. Look for the newest Better Stack authentication message matching the request just initiated. Check the recipient, sender, and delivery time; do not use an unrelated or older code.
5. Keep the OTP transient and enter it only into the matching Better Stack sign-in form. Never add OTPs, magic links, runtime passwords, OAuth tokens, authorization URLs, or raw authentication mail to this document, chat, command output, screenshots, reports, or Git. If a code expired or a newer request invalidated it, request a fresh one and read the newest matching message.
6. Confirm the authenticated Better Stack dashboard/account, then return to the pending MCP authorization page if reconnecting. Restore Feishu's previous mailbox afterward.
7. If the selected mailbox interface cannot access Feishu, report that specific blocker and use an approved handoff or alternative. Do not silently substitute another mailbox or authentication method. In particular, do not request another Computer action after a tool-access denial; browser access remains governed by its own approved workflow.

### Troubleshooting and retained verification evidence

- An empty dashboard can mean the wrong team was selected. Confirm the team/source inventory before concluding that logs are missing.
- If the callback fails or the login process has timed out, start a fresh login and use its new URL. Do not replay the old callback or manually copy credentials.
- Distinguish website login, OAuth credential storage, MCP initialization/tool discovery, and a successful read-only tool call when reporting results.
- This procedure does not authorize production changes, source-token rotation, monitor edits, incident actions, or account security changes.
- Verified recovery on 2026-10-09: read-only **Allow access** returned **Authentication complete**, and `codex mcp login betterstack` reported success. A fresh MCP initialization reported OAuth and 71 tools; Better Stack tools also became available in that chat. Read-only `teams` returned TradingFlow (team `159323`), and `sources` returned the active `Process Service[Production]` source (`533318`). No OTP was required, and no production data or monitoring configuration was changed. These ids/counts are historical evidence, not defaults for the next run.
- Initial observation on 2026-10-09: the configured MCP was enabled but **Not logged in**; ego-browser already had the shared Better Stack session. Feishu was accessible through Computer by bundle ID. A fresh OTP login was not exercised.
- Verified on 2026-10-12: ego-browser's **Sign in** link reached the authenticated TradingFlow workspace using the existing shared-account session. The CLI reported `enabled: true` and `auth_status: "o_auth"`; native `sources`, `query_help`, and a bounded historical production-log `query` all succeeded. The query returned the 2026-10-09 pre-open scheduler completion and metadata/chain/volatility summaries. No new OAuth grant or OTP retrieval was necessary; the Feishu OTP fallback remains documented but untested in that verification.

References: [Codex MCP configuration and OAuth login](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Better Stack MCP setup](https://betterstack.com/docs/getting-started/integrations/mcp/), plus the Better Stack sign-in and authorization pages observed during recovery. UI labels and consent requirements may change; inspect the live page each time.

## Netlify Dashboard Login: OptionData

This section owns operator access to the Netlify dashboard. OptionData customer login and deploy visitor protection have separate sessions.

### Verified account and login settings

Verified through ego-browser's own API on 2026-10-14, including credential submission and authenticated project access:

| Item | Confirmed value |
| --- | --- |
| Netlify user | `public@tfsharedspace.com` |
| Default/owning team | `FlowMan Sites` |
| Team slug | `engineering-a9acvw0` |
| Project | `optiondataportal` |
| Production domain | `www.optiondata.io` |
| Dashboard entry | `https://app.netlify.com/projects/optiondataportal/overview` |
| Email/password form | `https://app.netlify.com/login/email` |
| Connected accounts | GitHub, Google, GitLab, and Bitbucket all showed `Not connected` in User settings → General → Connected accounts. |
| Two-factor authentication | User settings → Security displayed `Enable two-factor authentication`; 2FA was not enabled for this user at the time of the check. |
| Fresh login result | Email/password submission redirected to `https://app.netlify.com/`, then the authenticated project overview passed all identity/team/project checks. No OTP or SSO was requested. |

The verified path is direct email/password login using the current authorized credential. A saved browser entry is not a substitute for a credential explicitly supplied for the task. Preserve the distinction between opening an existing session and proving a new credential submission.

### Exact login steps

1. Use `ego-browser nodejs -e` without a PTY. Create or resume the task space, take its Page `p1`, and open the dashboard entry. If it opens directly, prove the sidebar user menu reads **`User public@tfsharedspace.com. Open menu`**, the team breadcrumb reads **`FlowMan Sites`**, the heading is **`optiondataportal`**, and the project link is **`www.optiondata.io`**. This is sufficient for session reuse.
2. If signed out, open `https://app.netlify.com/login` and click **Log in with email**. Confirm the route changes to `/login/email` and the heading reads **Log in to Netlify**. Opening the email-form URL directly is also valid.
3. Take a fresh `page.snapshot()`. The verified email locator is `loc=css:input[name="email"]`; fill it with **`public@tfsharedspace.com`** using `page.fill()`.
4. The verified password locator is `loc=css:input[name="password"]`. Fill it with the current password authorized by the user for this login. Verify the email and that the password field has filled without returning the password value in tool output. Never print or persist the password in this document, a script file, environment file, or report.
5. Click the exact submit button with `page.click("loc=role:button[name=\"Log in\"]")`. Its accessible name is **Log in**; the alternative **Log in with a Git provider** is a different button. Wait for navigation or a visible error. The successful test redirected to `https://app.netlify.com/`. If the form returns `No user found for this email/password`, preserve any working session and report the rejected attempt without guessing passwords or starting recovery.
6. Navigate to `https://app.netlify.com/projects/optiondataportal/overview` and wait for the project content to settle. Prove **`public@tfsharedspace.com` → `FlowMan Sites` (`engineering-a9acvw0`) → `optiondataportal` → `www.optiondata.io`**, then check the requested Production/Preview/branch deploy context before continuing. The verified user-menu locator is `loc=role:button[name="User public@tfsharedspace.com. Open menu"]`; the team-switcher locator is `loc=css:button[name="Switch teams"]`. When the sidebar is collapsed and shows only **F**, inspect or expand it before asserting the team name.

For a specifically requested fresh-login test, establish a signed-out state through the supported ego-browser API. Read the skill's `references/clearing-state.md` before clearing any cookies, cache, or storage, and preserve the user's working sessions. A fresh-login success verdict requires step 6 to pass after the credential submission; opening an inherited session alone is session-reuse evidence.

### Verify or recover the correct path

- To check the operator identity and provider linkage, open the sidebar user menu → **User settings** → **General** (`https://app.netlify.com/user/settings`). Read **Personal information** for Email and Default team, then **Connected accounts**. This account's verified path is email/password; the presence of a Google/GitHub/GitLab/Bitbucket button on Netlify's public login screen does not prove those providers are linked. Use `page.snapshot({ scope: "full_page" })` when the provider list extends below the viewport.
- To check whether 2FA has changed, use **User settings** → **Security** → **Two-factor authentication** (`https://app.netlify.com/user/security#content`). If a future login requests an authenticator code, use that user's approved authenticator source. Use Feishu only if the live Netlify screen explicitly sends an email verification to an available mailbox; no email OTP was needed in the verified login.
- Use `https://app.netlify.com/sso` only if live tenant policy or a redirect establishes enforced SAML SSO. It was not required by the verified public account settings.
- Deploys, environment variables, domains, team membership, build hooks, project visibility, and site-protection changes remain governed by the current user request.

## Stripe CLI Login and Account Verification

This section owns local Stripe CLI authentication, not Stripe Connect onboarding, customer Checkout login, or the Codex Stripe connector. A working Dashboard session does not prove CLI access, and a CLI login does not reconnect the Stripe MCP app. Only perform a new login when the current user task authorizes service access and existing CLI credentials cannot satisfy it.

### Reuse and select the correct account

1. Check `command -v stripe`, `stripe --version`, `stripe login --help`, and `stripe get --help`. The local CLI reported `1.41.2` on 2026-10-17 and supports `--non-interactive`, `--complete`, `--project-name`, `login list`, and `login switch`. Treat help from the installed binary as the flag contract; do not assume another version behaves identically.
2. Keep existing authentication. Do not run `stripe logout`, overwrite the default profile, or print `stripe config --list` / `~/.config/stripe/config.toml`: saved configuration can contain credentials. Detect whether `STRIPE_API_KEY` is set without printing its value; environment or explicit-key overrides can select a different account from the saved profile. Do not silently replace them with a repo's test key.
3. Choose the intended product using the account IDs in the [service directory](#current-managed-service-directory), not the last-open Dashboard account. TradingFlow is `acct_1AtaljDVsC6tSD27`; OptionData production is `acct_1MXLheEsKvZ43FCy`, **not** the Blobr lookalike. For separate saved configurations, use a task-selected profile name such as `tradingflow` or `optiondata` and pass `--project-name` consistently to login, completion, and every request. These example profile names are not proof that profiles already exist. [Stripe documents project-specific configuration here](https://github.com/stripe/stripe-cli/wiki/login-command).
4. Before initiating login, try the bounded account verification below with the selected existing profile. Successful verification is sufficient for reuse. If using `stripe login list` or `stripe login switch <account_name>`, inspect their current help, keep output private, and re-verify the resulting account; switching changes local selection. Never use `--stripe-account` to switch these independent platform accounts: that flag sends the Connect connected-account header.

### Verified browser entry and identity checks

Verified on 2026-10-17 using only `ego-browser nodejs -e`, without a PTY:

1. Open `https://dashboard.stripe.com/` in the task's `p1` Page. Wait for the authenticated content rather than treating an initial empty snapshot as a login failure. The reused session opened **Home – www.optiondata.io – Stripe** with account-specific links containing `acct_1MXLheEsKvZ43FCy`.
2. Open the account switcher with `page.click("loc=css:a[aria-label=\"Account options and switcher, current account is www.optiondata.io\"]")`. Its menu showed **www.optiondata.io**, **Switch to sandbox**, **Search accounts by name**, and the **Evan Zhou** user-settings item. This establishes the visible Dashboard's non-sandbox context, not the CLI's mode. The account list is not limited to three entries; search/verify the intended account rather than relying on count or position.
3. Open the observed **Evan Zhou** menu-item link, `https://dashboard.stripe.com/acct_1MXLheEsKvZ43FCy/settings/user`. Wait until **Personal details** and the **User** group have loaded. Read only the necessary identity fields: Email was **public@tfsharedspace.com**. Avoid full profile snapshots because unrelated contact data is present.
4. The same page listed a passkey plus **Authenticator app** and **Touch ID** under **Two-step authentication**. These are configured methods, not proof that a new login challenge was completed. Do not promise email OTP or use Feishu to satisfy an authenticator challenge. No password, OTP, or MFA action was needed for this session reuse.

### Verified Switching Between Product Accounts

The same Stripe operator can access many independent accounts. Logging in as `public@tfsharedspace.com` is identity proof, not product-account selection. Treat the user's "project" as a request to select the matching Stripe account; do not assume the account display name equals the application's domain.

Browser switching and account IDs were verified on 2026-10-17:

| User's product/domain | Exact Stripe account name | Expected account ID | Account-scoped Dashboard |
| --- | --- | --- | --- |
| TradingFlow / `app.tradingflow.com` | `TradingFlow.com` | `acct_1AtaljDVsC6tSD27` | `https://dashboard.stripe.com/acct_1AtaljDVsC6tSD27/dashboard` |
| OptionData / `optiondata.io` / `www.optiondata.io` | `www.optiondata.io` | `acct_1MXLheEsKvZ43FCy` | `https://dashboard.stripe.com/acct_1MXLheEsKvZ43FCy/dashboard` |

1. Resolve the requested product to the table above **before** reading billing data or starting CLI authorization. For another project, verify its identity separately; do not default to either listed account.
2. Record the currently selected account so it can be restored. Take a fresh snapshot and click the top-left **Account options and switcher, current account is …** button. The observed element is an `a` with that `aria-label`; a current-account-independent selector is `loc=css:a[aria-label^="Account options and switcher, current account is "]`.
3. In the opened menu, fill **Search accounts by name** with `tradingflow` for TradingFlow, or `optiondata` for OptionData. The tested search locator is `loc=role:searchbox[name="Search accounts by name"]`. Search by product name, not `app.tradingflow.com`, because the actual TradingFlow account label is **TradingFlow.com**.
4. Take a new snapshot of the filtered menu and click the fresh ref for the exact matching menu item. `tradingflow` returned **TradingFlow.com**. `optiondata` returned **optiondata.io** and **www.optiondata.io**; select **www.optiondata.io** for the current production portal. Do not select the first similar name, create a new account, or assume a fixed number/order of accounts. The older directory maps the bare-name Blobr account to `acct_1LK6ZyPETuTsNF5I`; that account was not opened during this check.
5. Wait until the account-switcher label changes to the exact selected name. Verify the page title and account-scoped URL/links against the table. The test produced **Home – TradingFlow.com – Stripe** at the TradingFlow ID, then **Home – www.optiondata.io – Stripe** at the OptionData ID. Do not treat the click receipt or old page contents as a completed switch.
6. Reopen the selected account's switcher and verify the mode control. Both tested accounts showed **Switch to sandbox**, establishing the visible Dashboard's non-sandbox context. Do not click it during a production check. CLI mode still requires its own `--live` request and `livemode` check; browser state cannot prove it.
7. Perform only the task's authorized work, then restore the prior account through the same search/switch procedure unless the user asks to leave a different one selected. This test restored **www.optiondata.io** and closed the switcher. No billing/customer configuration was changed.

**CLI account selection is independent.** A browser account switch does not retarget credentials already saved by the CLI. A value such as `--project-name tradingflow` or `--project-name optiondata` names a local configuration; its name alone does not bind it to a Stripe account. For each product, select the matching account on the CLI authorization screen, complete login into the intended local profile, then verify `/v1/account` returns the expected ID and the request's mode gate passes. Use that exact verified profile/credential source on every subsequent command, and repeat these checks after switching products. If a CLI authorization page defaults to another account, change it before consent and confirm its displayed name/ID; if that cannot be proven, stop. The CLI authorization selector itself remains untested because pairing was blocked before an authorization page was created.

### Agent pairing procedure: not yet end-to-end verified

The following commands/flags were confirmed from installed help; browser approval and CLI completion could not be exercised because of the execution restrictions recorded below.

1. Read the ego-browser skill, create or resume one task space, and open `https://dashboard.stripe.com/` through its own API. Reuse the approved company session. If Stripe requests an email, use **`public@tfsharedspace.com`** and the current authorized Stripe credential, not the Neon credential record. Follow the challenge actually displayed: use the Feishu **Other Accounts** procedure only for an email sent to that exact mailbox. An authenticator/TOTP challenge is not an email OTP. Use an explicitly approved and available authenticator source; otherwise hand off the challenge without requesting its secret in chat. Never reset the password or disable MFA as a workaround.
2. Start the two-step login without a PTY. Example for an OptionData-specific profile:

   ```bash
   stripe login --non-interactive --project-name optiondata
   ```

   Capture stdout privately in the agent runtime, parse its JSON, and retain `browser_url`, `verification_code`, and `next_step` only in memory. Do not echo the payload into logs, chat, files, or this runbook. Unlike a normal terminal login, this mode returns pairing details and exits rather than relying on the default system browser. Do not use `--interactive` for this workflow: it prompts for an API key, not browser approval.
3. Immediately start the completion poll described by `next_step` in a non-PTY command session, while retaining its session handle. The installed help specifies `stripe login --complete <poll-url>`; preserve the same `--project-name optiondata` and any deliberately selected config path. Validate the returned command and Stripe URL before invoking it; do not blindly evaluate shell text. Keep the poll URL runtime-only, and keep the poll running while completing browser approval.
4. Navigate the ego-browser Page to the returned `browser_url` using `page.goto()`; never substitute Computer Use or the automatically opened system browser. Compare the displayed pairing code with the retained `verification_code` without printing either. Apply the [product-account mapping](#verified-switching-between-product-accounts): choose **TradingFlow.com** for `app.tradingflow.com`, or **www.optiondata.io** for OptionData, and confirm the expected account ID plus displayed role/access before approving. Do not approve whichever account the shared session last selected. A mismatched code or unproven account means stop before consent. Stripe's browser sign-in is being rolled out; availability and permissions depend on the account and Dashboard role. [Official sign-in guidance](https://support.stripe.com/questions/sign-in-to-stripe-cli).
5. Submit the CLI authorization only for the task-authorized account/access, then wait for the completion command to succeed and save the credentials. Capture/redact its output before reporting: do not assume a success message is free of credentials. Browser approval alone is not completion. If pairing expires, stop the old poll before starting one fresh pairing; do not reuse its URL or code.
6. Run the account/mode verification below before any billing query. Report CLI authentication separately from Dashboard and MCP status. Close the temporary ego-browser task space when complete or hand off a genuine human-only challenge using the existing session procedure.

If installed help lacks the two-step flags, do not guess replacements or force `--interactive`. Use the supported browser-pairing flow only if its fresh URL can be opened through ego-browser without changing browser settings; otherwise report the version/capability gap and obtain direction before upgrading or creating new API credentials. If browser sign-in is unavailable, use only an already-approved, securely provided restricted key suitable for the task; never expose a key as a command argument or create/rotate one just to unblock a check.

### Verify account and Live/Test scope

Run a GET using the exact profile and credential source that subsequent commands will use, with no Connect account override. Keep the raw response in memory and emit only the expected account ID and safe status fields. Example for an authorized OptionData production check (`jq` required):

```bash
set -o pipefail
stripe get /v1/account --project-name optiondata --live \
  | jq -e '{id, charges_enabled, payouts_enabled} | select(.id == "acct_1MXLheEsKvZ43FCy")'
stripe balance retrieve --project-name optiondata --live \
  | jq -e '{object, livemode} | select(.object == "balance" and .livemode == true)'
```

Both commands must succeed. The account ID proves the credential's account; the balance object's `livemode` proves the request mode. `charges_enabled` / `payouts_enabled` are status fields, not a substitute for mode proof. For TradingFlow, use its verified profile and expected ID instead. For test/sandbox work, omit `--live`, verify `livemode == false`, and prove the intended sandbox account separately; a production account ID must not be assumed to identify its sandbox. The CLI's `get --help` states that requests default to test unless `--live` is passed. Stop on an ID/mode mismatch, permission failure, or expired credentials; do not broaden permissions automatically.

The CEO revenue helper currently invokes the default CLI profile without `--project-name`. A successful named-profile check does **not** prove that helper uses the same account. Verify the helper's effective default account first; do not switch the user's default merely to run it or assume a profile flag is propagated by the helper. Authentication never authorizes refunds, cancellations, product/price changes, webhook changes, or payment tests.

### Local configuration failure and verification limits

On 2026-10-17, even `stripe --version` / help failed in this sandbox with `chmod .../.config/stripe/config.toml: operation not permitted`. This was a local configuration-access failure, not evidence of invalid Stripe credentials. A `--config` argument alone did not avoid startup touching the original configuration. Do not change permissions on, delete, copy, or dump the credential file.

For **help/version inspection only**, an empty temporary configuration root worked:

```bash
stripe_help_config=$(mktemp -d /private/tmp/codex-stripe-help.XXXXXX)
XDG_CONFIG_HOME="$stripe_help_config" stripe --version
XDG_CONFIG_HOME="$stripe_help_config" stripe login --help
```

This empty root does not reuse saved authentication. For ordinary operational work, restore normal configuration context; do not present temporary-profile success as authentication of the user's normal CLI profile. When the user explicitly requests a fresh CLI login test, a separate private temporary root and unique profile may isolate that test without reading/copying the existing config. Keep `XDG_CONFIG_HOME` and `--project-name` identical for pairing, completion, and verification, exclude inherited `STRIPE_API_KEY` from that test process without printing it, and securely remove only the test-created credential/config files afterward. Never use this technique to run around a denied network boundary or modify the protected saved config. Persistent operational login still requires an approved writable credential location. Do not initiate new login merely to fix a local file restriction.

The requested fresh login test on 2026-10-17 used an isolated temporary config and profile `optiondata-verification`, with the inherited API-key override excluded. `stripe login --non-interactive --project-name optiondata-verification` failed at the initial auth POST with `lookup dashboard.stripe.com: no such host`. No pairing JSON, authorization URL/code, approval, completion poll, or new credential was produced. Ego-browser reached the Dashboard in the same run; browser connectivity does not prove CLI-process network access. Stop at this boundary rather than launching the CLI through another host/app or proxying its auth requests to evade the restriction. Retry only when the execution context legitimately permits the required CLI network/config access.

The subsequent multi-product retry also failed at the initial pairing POST with the same CLI DNS error. Its isolated profile was `product-account-verification`, its inherited `STRIPE_API_KEY` override was excluded, and its temporary config was removed. Browser switching between the two product accounts succeeded in that run. This proves the account-switching procedure, not CLI pairing or authorization-account selection.

Current verification status: Dashboard session/account/email and TradingFlow↔OptionData browser switching verified; CLI login **blocked**; CLI account and Live/Test GET checks **not run**; Stripe MCP connection **not tested**. Earlier help inspection found the installed `stripe docs` plugin unavailable and its documentation connector requiring reauthentication. No upgrade or connector reconnection was performed. Re-check current help before execution; do not label the pairing procedure end-to-end verified until CLI completion and account/mode gates pass.

## Current Managed Service Directory

This table covers control planes with a current or repository-configured company integration. Service-specific identities take precedence over the general `engineering@tradingflow.com` default. Keep an already-valid company session when it has the required tenant access.

| Service | Project use and current status | Direct browser entry | Required tenant/project proof |
| --- | --- | --- | --- |
| Vercel | TradingFlow production hosting, serverless functions, cron, Speed Insights, and AI Gateway | `https://vercel.com/dashboard` | Project `tradingflow-webapp-fullstack`; production domain `app.tradingflow.com`; distinguish Production from Preview. AI Gateway and Speed Insights are inside this Vercel project, not separate vendor logins. |
| Netlify | OptionData production host; TradingFlow still has legacy Netlify config but its production host is Vercel | `https://app.netlify.com/projects/optiondataportal/overview` | Follow [Netlify Dashboard Login: OptionData](#netlify-dashboard-login-optiondata). Fresh email/password login verified with ego-browser's own API on 2026-10-14: operator `public@tfsharedspace.com`, team `FlowMan Sites` (`engineering-a9acvw0`), project `optiondataportal`, domain `www.optiondata.io`. Prove deploy context before acting. |
| Cloudflare | Worker/Durable Objects/R2 and edge serving used by both products, including `ws.optiondata.io` | `https://dash.cloudflare.com/` | Active account `FlowMan LLC`; select the authoritative zone and the production Worker/environment that owns the requested host. Do not edit a duplicate/stale zone or test Worker. |
| Clerk | Authentication for both products and Google sign-in for TradingFlow | `https://dashboard.clerk.com/` | Select the application by its production domains: TradingFlow `app.tradingflow.com`; OptionData `accounts.optiondata.io` / OptionData production domains. Prove Production versus Development before any user/session change. |
| Stripe | Billing and subscriptions for both products | `https://dashboard.stripe.com/` | Follow [Stripe CLI Login and Account Verification](#stripe-cli-login-and-account-verification). TradingFlow is `TradingFlow.com` (`acct_1AtaljDVsC6tSD27`). OptionData production is **`www.optiondata.io`** (`acct_1MXLheEsKvZ43FCy`): it holds the portal's live key, the Pro price, and the `OptionData Portal production` webhook endpoint. `optiondata.io (Blobr)` (`acct_1LK6ZyPETuTsNF5I`) is a lookalike with no endpoints; do not act there. Search/select by name and ID, not the number or position of switcher entries. Prove the account name and visible Live/Sandbox mode before acting; never infer mode from the URL alone. Refunds, cancellations, price/product edits, invoices, and payment-method actions require exact authorization. Billing mapping verified 2026-10-14; OptionData Dashboard identity/session rechecked 2026-10-17, while CLI pairing remained blocked. |
| Neon | TradingFlow application database | `https://console.neon.tech/` | Account note: `public@tfsharedspace.com`; use the [preserved human credential record](#neon-access-and-human-credential-record) only for authorized Neon access. Match the project/branch host against `NEON_DATABASE_URL` without printing it. Credential validity was not re-tested in the consolidation. |
| ClickHouse Cloud | Market/options data queried by both products | `https://console.clickhouse.cloud/` | Match the service hostname and database to the repo-owned environment variables without printing credentials. Browser access is for service administration; production data audits should still follow the process-service runbook and its read-only scripts. |
| PostHog — TradingFlow | Product analytics, feature flags, error tracking, and session evidence | `https://us.posthog.com/project/300646/home` | Project id `300646`, product domain `app.tradingflow.com`. Re-prove the project on every dashboard/query batch. |
| PostHog — OptionData | Product analytics, web analytics, replay, heatmaps, and error tracking | `https://us.posthog.com/project/90561/home` | Project name `optiondata`, id `90561`; never substitute TradingFlow project `300646`. |
| Better Stack | Telemetry, Errors, Uptime/Better Uptime, incidents, and the OptionData public status page | `https://telemetry.betterstack.com/team/t159323/sources` | Shared account `public@tfsharedspace.com`; follow [Better Stack Login and MCP Reactivation](#better-stack-login-and-mcp-reactivation). Latest documented website/MCP verification: 2026-10-12. Resolve live teams/sources/applications; stored OAuth status alone does not prove tool access. |
| Better Stack Errors | TradingFlow Sentry-compatible error ingestion, hosted by Better Stack | `https://errors.betterstack.com/team/t159323/applications` | Same Better Stack team. This is **not Sentry SaaS** even though the SDK/protocol is Sentry-compatible. |
| Better Stack Uptime / status | Monitors, incidents, heartbeats, and `https://status.optiondata.io/` | `https://uptime.betterstack.com/team/t159323/monitors` | Same Better Stack team; select monitors/status pages by visible name. Do not trigger heartbeats or test alerts unless requested. |
| Massive | TradingFlow market-data provider | `https://massive.com/dashboard/login` | Match the account/API-key context to `MASSIVE_API_KEY` without displaying the key. Use repo scripts for data probes; the dashboard is for account/plan/key management. |
| Google Analytics 4 | TradingFlow web analytics | `https://analytics.google.com/` | Select the property/data stream containing `app.tradingflow.com` and measurement id `G-NDVM12NY0C`. Do not change filters, retention, links, or audiences during a read-only check. |
| Google Cloud / Identity | Google OAuth client behind TradingFlow's Clerk sign-in | `https://console.cloud.google.com/apis/credentials` | Select the project/client whose authorized origins or redirect URIs contain the TradingFlow production domains. Do not create credentials or rotate a client secret without explicit authorization. |
| Feishu / Lark Mail | Company mailbox used for admin-service OTPs, magic links, and operational mail | `https://tradingflow.feishu.cn/mail` | Select the exact recipient through bottom-left **Other Accounts** and prove the address beneath **Compose** before reading mail. If Feishu itself requires QR/device login, use the human-handoff rule. |
| Featurebase | TradingFlow feedback, roadmap, changelog, help center, messenger, surveys, and outbound workflows | `https://tradingflowcom.featurebase.app/dashboard` | Workspace `tradingflowcom`. Public portal pages are not proof of admin access. Publishing, outbound messages, surveys, and workflow edits are mutations. |
| Discord | TradingFlow and OptionData community/webhooks; TradingFlow assistant bot is gated | `https://discord.com/app` and `https://discord.com/developers/applications` | Prove the intended server and, for bot work, the intended application. Do not send a test message or recreate a webhook merely to prove access. |
| Crisp | OptionData customer-support chat | `https://app.crisp.chat/` | Select the website/workspace for `optiondata.io`. Opening conversations exposes customer data; read only what the current support task requires. |
| Resend | TradingFlow scheduled-digest email client; runtime remains optional/configuration-gated | `https://resend.com/emails` | Select the account/domain for `tradingflow.com` and the configured sender. Do not send a test email, verify a new domain, or change DNS without authorization. |
| Logo.dev | TradingFlow symbol-logo delivery | `https://www.logo.dev/dashboard` | Select the project/token used for TradingFlow. Treat the browser-visible publishable token as sensitive in reports even if it is client-side. |

### Configured or gated service portals

Open these only when the current task targets the feature. Their presence in code does not prove that the production feature is enabled.

| Service | Status in current projects | Direct browser entry | Selection and blocker rule |
| --- | --- | --- | --- |
| Alpaca | TradingFlow Portfolio OAuth/API integration; production rollout is feature-gated | `https://app.alpaca.markets/` | Select the TradingFlow OAuth/app and prove paper versus live. Do not authorize a brokerage account, trade, or rotate keys during an access check. |
| Webull OpenAPI | TradingFlow Portfolio UI/integration exists, but local credentials and production endpoint completion were not confirmed in the 2026-08-11 inventory | `https://www.webull.com/open-api` | Treat as `configured-unverified`, not production healthy. The public OpenAPI page links to the developer documentation; if no company developer console/app is reachable, report the gap and do not create one. |
| Slack | TradingFlow assistant-channel adapter; production master switch is off unless current configuration proves otherwise | `https://api.slack.com/apps` | Select the TradingFlow app and workspace. Installing/reinstalling, changing scopes, or posting a message requires authorization. |
| Telegram | TradingFlow assistant-channel adapter; production master switch is off unless current configuration proves otherwise | `https://web.telegram.org/` or `https://t.me/BotFather` | Reuse an existing session. A phone number, QR login, or device confirmation is a human-only blocker. Never expose the bot token. |
| Meta Messenger | TradingFlow assistant-channel adapter; production master switch is off unless current configuration proves otherwise | `https://developers.facebook.com/apps/` | Select the TradingFlow app/page. Meta 2FA, passkey, or phone challenges require handoff; do not alter app review or permissions during a check. |

## Runtime Dependencies Without a Separate Routine Login

Do not interrupt the user or create new vendor accounts for these. Validate the integration through the owning control plane, public endpoint, browser network evidence, or repository configuration.

| Dependency | Current use | Correct management/check path |
| --- | --- | --- |
| Vercel AI Gateway | TradingFlow AI routing; current upstream model is MoonshotAI/Kimi | Manage and inspect it inside the TradingFlow Vercel project. No separate Moonshot login or direct Moonshot credential was established by the current repo inventory. |
| Vercel Speed Insights | TradingFlow performance telemetry | Open the TradingFlow project in Vercel. |
| Cloudflare Worker, Durable Objects, R2 | TradingFlow/OptionData edge and snapshot infrastructure | Open the active Cloudflare account/Worker/environment; these are not separate services to authenticate. |
| TradingView widgets | TradingFlow ticker/chart embeds | No company dashboard credential is used by the current embed integration. Check widget transport and visible rendering; do not create a TradingView account. |
| Seeking Alpha CDN | TradingFlow symbol-logo fallback | Public runtime asset dependency; check the exact asset/network response. |
| Financial Modeling Prep | TradingFlow hard-coded logo overrides | Current use is an asset URL override, not a proven managed API account. Check the URL; do not start a password flow. |
| EODHD | TradingFlow hard-coded logo overrides | Current use is an asset URL override, not a proven managed API account. Check the URL; do not start a password flow. |
| Google Favicon service | TradingFlow broker-logo fallback | Public URL service; no account login. |
| Amazon S3 public bucket | OptionData historical CSV URLs from `fulloptionflow-external-daily-csv` in `us-east-2` | Treat the public object URL as the integration. Open AWS Console only if the task establishes that the bucket is company-owned and the correct AWS account is already available; otherwise report ownership/admin access as unproven. |
| GitBook CDN / legacy docs | OptionData legacy `docs.optiondata.io` content and media references; current portal routes redirect docs into the repo-owned site | Check the current redirect/content path first. Use `https://app.gitbook.com/` only when maintaining a still-owned legacy GitBook space; do not assume it remains the publishing source. |

## Services Not to Treat as Current Separate Control Planes

Do not spend workflow time logging into these unless a fresh repository/configuration audit proves a current direct integration or the user explicitly asks:

- **Sentry SaaS:** TradingFlow errors use Better Stack's Sentry-compatible ingestion. Open Better Stack Errors, not Sentry.
- **Direct OpenAI or Anthropic dashboards:** the current TradingFlow AI path is Vercel AI Gateway with MoonshotAI/Kimi. Package names, old experiments, or model abstractions do not prove a direct production vendor account.
- **Mastra or assistant-ui Cloud:** code/framework references are not evidence of a current hosted control plane.
- **TradingFlow Netlify production:** the checked-in Netlify config is legacy; Vercel owns the current TradingFlow production deployment.
- **OptionData Builder.io, Svix, Sentry, or Alpaca:** current repository references are stale, unused, or comparison/documentation-only unless a new audit proves otherwise.

## Per-Service Execution Workflow

1. Read the user's requested action and classify it as read-only, reversible write, production/configuration write, financial/customer action, or destructive action.
2. Select the service from this directory and open its direct entry in the active ego-browser task space.
3. Determine whether the page is already authenticated. If it is, prove identity and tenant before interacting.
4. If signed out, use the Authentication Ladder. Prepare the correct Feishu mailbox before requesting an email code.
5. After login, return to the direct entry and prove the exact project/site/application plus environment/mode.
6. Perform only the requested action. For a write, capture the current value before editing, review the proposed value, submit once, and verify the settled result.
7. Record compact evidence without secrets: service, identity email, tenant/project name or safe id, environment, URL, action, outcome, and blocker.
8. Close mailbox, login, and scratch tabs. Restore the prior Feishu mailbox. Complete the ego-browser task space unless a justified handoff remains.

For a multi-service task, preflight all in-scope sessions before doing deep work. Handle email OTPs one service at a time so two fresh codes cannot be confused. If one login blocks, mark it and continue the other tabs before deciding whether a user handoff is essential.

## Human Handoff Rule

Ask the user only after the agent has exhausted session reuse, company SSO, and Feishu email verification, and after independent work is complete.

The handoff message must name:

- the service and exact dashboard URL;
- the human-only challenge shown;
- the selected company tenant/project if already known;
- the exact action the user should complete in the handed-off ego-browser task space;
- what the agent will verify after the user says `continue`.

Do not ask the user to paste a password, OTP, authenticator code, recovery code, or token into chat. After the user confirms completion, use `takeOverTaskSpace` as required by the ego-browser skill, verify the settled dashboard, and resume.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Feishu still shows the previous inbox | Reopen bottom-left **Other Accounts**, select the exact address, and wait for the address under **Compose** to change. Do not search for the OTP until it does. |
| OTP email is missing | Confirm the vendor's displayed recipient and request time, search the correct mailbox by vendor/sender, wait for delivery, refresh once, and use one resend only after the vendor timer permits it. |
| Several codes are visible | Use only the newest matching message received after the current request. Never infer validity from unread state. |
| Code is rejected | Reconfirm mailbox, recipient, vendor, and request time. Request one fresh code and enter it promptly; do not cycle through old codes. |
| Magic link opens a public homepage | Return to the original email and use the newest unexpired link in the same task space, then navigate to the direct dashboard URL. Never log the link. |
| Correct identity, wrong tenant/project | Use the vendor's account/team/project switcher and verify the expected domain/id. Do not create, rename, transfer, or delete a tenant to solve navigation. |
| SSO chooses a personal Google account | Cancel before granting access. Choose the approved company identity from the account chooser. Do not globally sign out of Google unless the user requests it. |
| Netlify redirects to `/sso` or shows **Log in via SSO** | Treat this as Netlify dashboard Organization/Team SSO. Use the known team ID/slug and configured identity provider; do not substitute Netlify Identity, a site password, or an unrelated social account. |
| A Netlify-hosted deploy asks for a password or team login | This is deploy/site protection, not dashboard login. Open the direct `app.netlify.com/projects/optiondataportal/overview` route to prove dashboard access separately. |
| Netlify requests a six-digit 2FA code | Retrieve it from the Netlify user's configured authenticator app. It is not an email OTP; hand off rather than starting recovery or disabling 2FA. |
| Netlify returns `No user found for this email/password` | Confirm `public@tfsharedspace.com` and the exact selected saved credential. Preserve any working session; obtain or confirm the valid credential through an approved password manager, then re-test fresh sign-in. Do not infer that the account is absent or create a replacement user. |
| Ego Lite autofill menu appears but the password is still empty | The native menu can outlive the page observation. Inspect the current menu, select the exact address, and verify the masked field has filled before clicking **Log in**. Do not submit an empty field or repeatedly retry rejected credentials. |
| Heredoc or PTY execution reports `Failed to connect to ego_cli bootstrap` | Retry `ego-browser nodejs -e` with ordinary non-PTY execution, reusing the recorded task space. This documented mode completed the verified Netlify login. If it also fails, investigate the skill's connection prerequisites and report the exact invocation; the error alone does not establish missing Full Access. |
| Feishu itself is signed out | Reuse another existing agent-owned Feishu task space only if available. Otherwise hand off Feishu's QR/device/login challenge; do not substitute another mailbox or browser. |
| Vendor requires CAPTCHA, passkey, hardware key, app authenticator, phone, or recovery code | Finish independent work, hand off the task space, and request completion in-browser. |
| Session expires during a long run | Re-authenticate in the same task space, re-prove the tenant/environment, and re-read any form before submitting. |
| A dashboard URL redirects after login | Navigate to the direct entry from this directory again and verify the expected project. Update this runbook only if the canonical route actually drifted. |

## Required Output

Include one compact access block in the final report:

```text
ServiceAccess:
- <service>: connected|blocked|skipped; identity=<approved email or n/a>; tenant=<safe name/id or n/a>; environment=<production|test|n/a>; action=<read-only or authorized write>; blocker=<none or exact challenge>

Authentication:
- reused_sessions=<services>
- feishu_mailboxes_used=<addresses, never codes>
- human_handoffs=<none or services/challenges>
- secrets_exposed=none

Cleanup:
- feishu_mailbox_restored=<address or n/a>
- ego_task_space=<closed|handed-off|kept by request>
```

Do not claim a service is connected solely because its public homepage loads. Dashboard access requires an authenticated page plus correct tenant/project proof. Report Stripe CLI access separately: it requires the successful account/mode GET gates above; it does not certify the Dashboard or MCP connection.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether live use revealed a durable change to a dashboard URL, tenant selector, login method, CLI authentication flag, Feishu mailbox path, service status, or verification rule.
2. Update the durable procedure or service directory only from visible dashboard evidence and current repository/configuration evidence. Record session reuse and fresh sign-in as separate verification results; provider linkage and 2FA status must be checked on the actual user. Do not infer that a vendor is active from a package name alone.
   - For CLI access, separate Dashboard reachability, pairing creation, browser consent, credential persistence, account identity, and request mode. A browser-only success or temporary-profile result must never certify a protected normal CLI profile.
3. Keep transient outages, temporary OTP delays, current counts, and one-run blockers out of the permanent service table. Put only unresolved next action in `Agent Handoff`, and prune completed items first.
4. When a service is added, removed, renamed, nested under another control plane, or moved between active and gated status, update this file and the canonical routing row in `ops/tradingflow-ceo-daily-review.md` if its purpose changes.
5. Never add runtime passwords, OTPs, magic links, tokens, recovery codes, session data, full env values, customer data, or screenshots of a mailbox to this runbook. Preserve the existing Neon human credential record during ordinary maintenance; change it only when the user explicitly requests that work, and never duplicate its value in validation output.
6. Re-run `git diff --check`, verify every referenced local runbook path, and re-read the Feishu and authorization boundaries after editing.
7. If no durable rule changed, report `Runbook maintenance: no change`.
8. Keep `ops/human/third-party-service-access.md` as the single owner of login, account, and MCP recovery guidance. Do not recreate the deleted `ops/human/password.md` duplicate or compatibility pointer; update the CEO runbook's routing row when this canonical path moves.

Update this runbook when:

- `Other Accounts` moves or the mailbox-switch confirmation changes.
- A service's canonical dashboard, tenant/project identifier, production owner, login method, or current/gated status changes.
- A repeated login blocker can be eliminated through an existing company session or approved mailbox path.
- Repository evidence adds or removes a true hosted control plane.

Do not update it for:

- A single expired session, one delayed email, temporary vendor outage, or current unread count.
- Unverified assumptions about who owns an external bucket/account.
- A dependency that appears only in tests, documentation comparisons, lockfiles, or dormant code.
