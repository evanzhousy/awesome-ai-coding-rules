# neon 
email
public@tfsharedspace.com
Tradingflow123!

@

## Better Stack — login and MCP reactivation

### Account and entry points

- Shared account: `public@tfsharedspace.com`.
- Website sign-in: <https://betterstack.com/users/sign-in>.
- Codex MCP server name: `betterstack`.
- MCP endpoint: `https://mcp.betterstack.com`.
- Use the `ego-browser` skill for website actions and the Computer plugin for the native Feishu app. Read the current skill instructions before using either interface.
- Reuse a working browser session. An authenticated browser and authenticated MCP are separate: the website can be signed in while MCP reports **Not logged in**.

### Reactivate the existing Codex MCP connection

1. Run `codex mcp get betterstack` and `codex mcp list`. Confirm the endpoint above and that the server is enabled. **Not logged in**, an OAuth refresh failure, or missing Better Stack tools can require reconnection. Missing tools alone does not prove an authentication failure.
2. Start `codex mcp login betterstack`. Keep that process running through browser approval and the callback. Use the fresh authorization URL it prints; never save or reuse an old URL, state, authorization code, or callback port.
3. Create one ego-browser TaskSpace for this recovery and navigate its existing `p1` to that URL. Resume the same space in later commands. If Codex opened another browser automatically, the printed URL can still be opened in ego-browser while the original login process waits.
4. If Better Stack asks for login, use the shared email and the Feishu flow below. If it already shows the shared email on the authorization page, no OTP is necessary. If another account is shown, switch to the intended shared account before approval.
5. On **Authorize Codex**, verify that the redirect matches the current command's loopback callback (`http://127.0.0.1:<current-port>/callback/...`). Do not infer authenticity from the self-reported app name alone.
6. Choose **Read-only access** for log/monitor investigation. **Full access** includes writes and needs explicit authority. Preserve an existing authorized scope when refreshing; do not silently widen it. Read-only access covers all teams visible to this account, so resolve the intended team and source after reconnecting.
7. Click **Allow access** when authorized. The observed page also acknowledges Better Stack's Terms of Service and Privacy Policy; if the active Computer/browser rules require confirmation at this step, obtain that confirmation before submitting. Approval must return to the live callback listener.
8. Wait for the login command to report success, then rerun `codex mcp list` and confirm **OAuth** for `betterstack`.
9. Verify that Better Stack initializes and exposes tools in the intended Codex client, then make a read-only inventory call such as `telemetry_list_sources_tool`. CLI login success alone is not proof that an already-running chat has refreshed its tool catalog. If credentials are saved but the current chat still has no tools, refresh/reconnect that client's MCP connection or start a fresh session; avoid disrupting other running chats.

If the server is genuinely absent, add it with `codex mcp add betterstack --url https://mcp.betterstack.com`, then log in. Do not remove/re-add an existing correct configuration as the default repair. Use `codex mcp logout betterstack` only when an explicit credential reset is needed; it clears the saved MCP login. Do not read or copy Codex's credential store into this document.

### Website login and Feishu OTP fallback

1. Open the sign-in URL in ego-browser. If it redirects to the dashboard and the account is the shared email, reuse that session without requesting a code.
2. If login is required, enter `public@tfsharedspace.com` and follow the site's current email sign-in/code prompt. Do not assume the preserved Neon credential above belongs to Better Stack. If the site requires a password and none is available from an approved source, ask the account owner; do not reset it or invent one.
3. Use Computer to select the native **Feishu / 飞书** app and its **Mail / 邮箱** area. The verified bundle identifier on this Mac is `com.electron.lark`; if display-name lookup fails, use Computer's app inventory and select that identifier.
4. Select the shared mailbox `public@tfsharedspace.com`, noting the previously selected mailbox so it can be restored. Look for the newest Better Stack authentication message matching the request just initiated. Check the recipient, sender, and delivery time; do not use an unrelated or older code.
5. Keep the OTP transient and enter it only into the matching Better Stack sign-in form. Never put OTPs, magic links, passwords, OAuth tokens, authorization URLs, or raw authentication mail in this document, chat, command output, screenshots, reports, or Git. If a code expired or a newer request invalidated it, request a fresh one and read the newest matching message.
6. Confirm the authenticated Better Stack dashboard/account, then return to the pending MCP authorization page if reconnecting. Restore Feishu's previous mailbox afterward.
7. If Computer cannot access Feishu, report that specific blocker and ask for an approved handoff or alternative. Do not silently substitute another mailbox or authentication method.

### Troubleshooting and evidence

- An empty dashboard can mean the wrong team was selected. Confirm the team/source inventory before concluding that logs are missing.
- If the callback fails or the login process has timed out, start a fresh login and use its new URL. Do not replay the old callback or manually copy credentials.
- Distinguish website login, OAuth credential storage, MCP initialization/tool discovery, and a successful read-only tool call when reporting results.
- This procedure does not authorize production changes, source-token rotation, monitor edits, incident actions, or account security changes.
- Initial observation on 2026-10-09: the configured MCP was enabled but **Not logged in**; ego-browser already had the shared Better Stack session. Feishu was accessible through Computer by bundle ID. A fresh OTP login was not exercised.

References: [Codex MCP configuration and OAuth login](https://developers.openai.com/codex/mcp/), plus the Better Stack sign-in and authorization pages observed during recovery. UI labels and consent requirements may change; inspect the live page each time.
