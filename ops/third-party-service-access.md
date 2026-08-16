---
name: third-party-service-access
description: Canonical ego-browser access and authentication runbook for third-party services used by tradingflow-webapp-fullstack and optiondata-portal, including Feishu Mail mailbox switching for email OTP and magic-link login.
disable-model-invocation: true
---

# Third-Party Service Access

Use this runbook when an AI agent needs to open, inspect, or manage a third-party service used by `tradingflow-webapp-fullstack` or `optiondata-portal`. It is the canonical browser-login procedure and service directory for those two projects.

The goal is to reuse the authenticated ego-browser state and complete normal email verification without interrupting the user. Do not ask the user to sign in, copy an email OTP, or open a magic link when the agent can complete that flow in ego-browser and Feishu Mail. A genuine CAPTCHA, passkey, hardware security key, authenticator-app challenge, phone-only challenge, or unavailable mailbox is still a human-only blocker.

Authentication is not blanket authorization to mutate a service. The current user request controls which read or write actions are allowed after login.

## Recommended Invocation

Use `/goal` for multi-service work:

- Objective: authenticate to every third-party service required by the current task using ego-browser, existing sessions, and the approved Feishu Mail OTP path; select the correct company tenant/project; then complete the requested checks or explicitly authorized management actions.
- Success criteria: each in-scope service is `connected`, `blocked`, or `skipped` with an exact reason; no avoidable login request reaches the user; the selected tenant/project and environment are proven; no password, OTP, recovery code, token, webhook, or complete secret is printed; all actions stay inside the user's requested mutation boundary; and ego-browser tabs/task spaces are cleaned up or intentionally handed off.
- Stop condition: the requested work is complete, or every independent action is complete and a remaining essential service presents a genuine human-only challenge.

Pasteable prompt:

```text
Use ops/third-party-service-access.md as the canonical access runbook. Use ego-browser for each required dashboard, reuse its authenticated state, and use Feishu Mail at https://tradingflow.feishu.cn/mail for email OTP or magic-link verification. Select engineering@tradingflow.com through Other Accounts at the bottom-left of Feishu Mail before requesting an admin-service code. Do not ask me to log in or provide an email OTP unless a genuine human-only challenge remains. Prove the correct tenant, project, and environment before acting; authentication alone does not authorize mutations beyond my request. Continue independent services if one is blocked, and report the exact blocker without exposing secrets.
```

## Agent Handoff

Last updated: 2026-08-11

No open handoff items. This runbook was created from a current repository inventory of `tradingflow-webapp-fullstack` and `optiondata-portal`. The Feishu Mail mailbox switch and the existing Better Stack account/team session were live-verified with ego-browser on 2026-08-11. Selected vendor entry routes for Massive, Logo.dev, Resend, Webull, Crisp, GitBook, and Alpaca were also opened without authenticating. The other dashboard rows are repository-derived and must be visibly re-verified when first used; this maintenance pass did not log into every listed service or execute production mutations.

## Non-Negotiable Boundaries

1. **Reuse before login.** Open the direct dashboard in ego-browser first. Do not sign out of a working company session merely to force `engineering@tradingflow.com`.
2. **Use the named browser.** Dashboard login and management use ego-browser. Do not silently substitute Chrome, the in-app Browser, Playwright, or raw HTTP for an authenticated dashboard workflow.
3. **Do not ask for an email OTP.** Use Feishu Mail when the login recipient is an available company mailbox. Never ask the user to read or paste that code.
4. **Do not expose secrets.** Never send an OTP, password, recovery code, API key, token, session cookie, DSN, webhook URL, database URL, or full environment file to `cliLog`, terminal output, screenshots delivered to the user, runbook text, or the final report.
5. **Login is not mutation authority.** Read-only inspection and tenant verification are the default. Deploys, DNS edits, billing changes, refunds, subscription changes, user/role changes, secret rotation, data deletion, monitor edits, alert tests, outbound messages, OAuth-app changes, and production configuration changes require authorization from the current request.
6. **Prove scope before acting.** Verify company identity, tenant/account, project/site/application, environment, and Live/Test or Production/Development mode where applicable. Do not rely on a dashboard's last-selected state.
7. **Do not bypass account protection.** Never attempt CAPTCHA bypass, recovery-code guessing, SMS interception, passkey workarounds, or security-key automation.
8. **Do not block the whole workflow unnecessarily.** If one service is blocked, finish every independent service first. Ask for one precise human action only when the blocked service is essential to the remaining work.
9. **Honor ego-browser control.** A `user is controlling`, inactive, or unassigned task-space error is a hard stop under the ego-browser skill. Do not retry or seize control.

## Identity and Environment Defaults

| Purpose | Default | Rule |
| --- | --- | --- |
| Third-party admin identity | `engineering@tradingflow.com` | Use when a signed-out vendor accepts email, email OTP, or magic-link login. Better Stack was visibly verified under this identity on 2026-08-11. |
| Feishu Mail URL | `https://tradingflow.feishu.cn/mail` | Do not substitute `mail.feishu.cn` or `mail.larksuite.com`. |
| Product end-user production login | `evanzhou@tradingflow.com` | This is an app/Clerk verification exception, not the default vendor-admin identity. Follow the product-review runbook when testing the customer app. |
| TradingFlow production app | `https://app.tradingflow.com` | Do not confuse it with `testapp.tradingflow.com`, preview deployments, or local development. |
| OptionData production portal | `https://www.optiondata.io` | Include `optiondata.io` and `portal.optiondata.io` only when a target service visibly lists them. |

If a vendor is already authenticated with another approved company member and the correct tenant is accessible, keep that session. If an account chooser appears, select the company identity that visibly has access; do not choose a personal account merely because it is first in the list.

## ego-browser Session Procedure

Use the named `ego-browser` skill and its current helper surface. Keep one task space for the whole user goal so service and mailbox tabs share session state.

```bash
ego-browser nodejs <<'EOF'
const task = await useOrCreateTaskSpace('third-party service access')
const tab = await openOrReuseTab('<DIRECT_DASHBOARD_URL>', {
  wait: true,
  timeout: 30,
})
cliLog(JSON.stringify({ taskId: task.id, tabId: tab.targetId, page: await pageInfo() }))
EOF
```

For ordinary vendor dashboards, use `snapshotText()` and stable refs/locators first. Feishu Mail is a rich web application: inspect it visually first, then use screenshot-guided clicks or targeted DOM checks. Do not hard-code screen coordinates from a previous run.

At the end, close scratch tabs and complete the task space in its own final heredoc after the prior round proves the work is done:

```bash
ego-browser nodejs <<'EOF'
const result = await completeTaskSpace(<TASK_ID>, { keep: false })
cliLog(JSON.stringify(result))
EOF
```

Use `{ keep: true }` only when the user explicitly wants the dashboard left open or must complete a human-only challenge in that exact task space.

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
5. Never call `cliLog(otp)`. Never print full Feishu `snapshotText()` output: message subjects and previews can contain OTP values. Capture the mailbox layout before requesting a code; once OTP mail is present, prefer targeted in-memory extraction and avoid new inbox screenshots. Do not attach a mailbox screenshot to the final report.
6. After successful verification, discard the code and verify the vendor dashboard identity and tenant. Do not preserve the code in notes, shell history, a file, or a runbook update.

If the email contains a magic link, open it in the same ego-browser task space, verify that it lands on the expected vendor domain and tenant, and close the message/mail tab after the dashboard session is established. Do not copy the signed magic-link URL into logs or chat.

### Restore the prior mailbox

When the task does not need more admin OTPs, open **Other Accounts** again and return to the mailbox that was selected before the run. Wait until the address under **Compose** proves the restoration. On the 2026-08-11 verification, switching between `evanzhou@tradingflow.com` and `engineering@tradingflow.com` could briefly clear the current-address label before the new inbox settled.

## Authentication Ladder

Use this order for every in-scope service:

1. **Existing session:** open the direct dashboard and prove the current account, tenant, and project.
2. **Existing company SSO:** if the vendor offers Google or another already-authenticated company SSO, use it and verify the selected company identity before consenting.
3. **Email OTP or magic link:** use `engineering@tradingflow.com` unless the vendor visibly names another approved company recipient; complete the Feishu procedure above without asking the user.
4. **Password form:** allow the browser's existing authenticated/password-manager state to fill it. Do not reveal, extract, or invent a password. Do not start a password reset merely to avoid a handoff.
5. **Human-only challenge:** finish independent work, hand off the exact ego-browser task space, and ask for only the required CAPTCHA, passkey, security key, authenticator, phone, or unavailable-mailbox action. Do not ask the user to send the secret back in chat; ask them to complete it in the handed-off page.

After any login, navigate to the direct dashboard URL again. Login landing pages and remembered last projects are not proof that the intended tenant is selected.

## Current Managed Service Directory

This table covers control planes with a current or repository-configured company integration. `Default admin email` means `engineering@tradingflow.com` when email login is needed; it does not override an already-valid company session.

| Service | Project use and current status | Direct browser entry | Required tenant/project proof |
| --- | --- | --- | --- |
| Vercel | TradingFlow production hosting, serverless functions, cron, Speed Insights, and AI Gateway | `https://vercel.com/dashboard` | Project `tradingflow-webapp-fullstack`; production domain `app.tradingflow.com`; distinguish Production from Preview. AI Gateway and Speed Insights are inside this Vercel project, not separate vendor logins. |
| Netlify | OptionData production host; TradingFlow still has legacy Netlify config but its production host is Vercel | `https://app.netlify.com/sites/optiondataportal/overview` | Site `optiondataportal`; production domains belong to OptionData. Do not manage the legacy TradingFlow Netlify site as production. |
| Cloudflare | Worker/Durable Objects/R2 and edge serving used by both products, including `ws.optiondata.io` | `https://dash.cloudflare.com/` | Active account `FlowMan LLC`; select the authoritative zone and the production Worker/environment that owns the requested host. Do not edit a duplicate/stale zone or test Worker. |
| Clerk | Authentication for both products and Google sign-in for TradingFlow | `https://dashboard.clerk.com/` | Select the application by its production domains: TradingFlow `app.tradingflow.com`; OptionData `accounts.optiondata.io` / OptionData production domains. Prove Production versus Development before any user/session change. |
| Stripe | Billing and subscriptions for both products | `https://dashboard.stripe.com/` | Prove the product account and the visible Live/Test mode before reading or acting. Never infer mode from the URL alone. Refunds, cancellations, price/product edits, invoices, and payment-method actions require exact authorization. |
| Neon | TradingFlow application database | `https://console.neon.tech/` | Match the project/branch host against `NEON_DATABASE_URL` from the webapp environment without printing the URL or credentials. |
| ClickHouse Cloud | Market/options data queried by both products | `https://console.clickhouse.cloud/` | Match the service hostname and database to the repo-owned environment variables without printing credentials. Browser access is for service administration; production data audits should still follow the process-service runbook and its read-only scripts. |
| PostHog — TradingFlow | Product analytics, feature flags, error tracking, and session evidence | `https://us.posthog.com/project/300646/home` | Project id `300646`, product domain `app.tradingflow.com`. Re-prove the project on every dashboard/query batch. |
| PostHog — OptionData | Product analytics, web analytics, replay, heatmaps, and error tracking | `https://us.posthog.com/project/90561/home` | Project name `optiondata`, id `90561`; never substitute TradingFlow project `300646`. |
| Better Stack | Telemetry, Errors, Uptime/Better Uptime, incidents, and the OptionData public status page | `https://telemetry.betterstack.com/team/t159323/sources` | Default admin email `engineering@tradingflow.com`; team path `t159323` was live-verified 2026-08-11. Resolve sources/applications by current name instead of hard-coding resource ids. |
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

Do not claim a service is connected solely because its public homepage loads. A connected verdict requires an authenticated dashboard plus correct tenant/project proof.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether live use revealed a durable change to a dashboard URL, tenant selector, login method, Feishu mailbox path, service status, or verification rule.
2. Update the durable procedure or service directory only from visible dashboard evidence and current repository/configuration evidence. Do not infer that a vendor is active from a package name alone.
3. Keep transient outages, temporary OTP delays, current counts, and one-run blockers out of the permanent service table. Put only unresolved next action in `Agent Handoff`, and prune completed items first.
4. When a service is added, removed, renamed, nested under another control plane, or moved between active and gated status, update this file and the canonical routing row in `ops/tradingflow-ceo-daily-review.md` if its purpose changes.
5. Never add passwords, OTPs, magic links, tokens, recovery codes, session data, full env values, customer data, or screenshots of a mailbox to this runbook.
6. Re-run `git diff --check`, verify every referenced local runbook path, and re-read the Feishu and authorization boundaries after editing.
7. If no durable rule changed, report `Runbook maintenance: no change`.

Update this runbook when:

- `Other Accounts` moves or the mailbox-switch confirmation changes.
- A service's canonical dashboard, tenant/project identifier, production owner, login method, or current/gated status changes.
- A repeated login blocker can be eliminated through an existing company session or approved mailbox path.
- Repository evidence adds or removes a true hosted control plane.

Do not update it for:

- A single expired session, one delayed email, temporary vendor outage, or current unread count.
- Unverified assumptions about who owns an external bucket/account.
- A dependency that appears only in tests, documentation comparisons, lockfiles, or dormant code.
