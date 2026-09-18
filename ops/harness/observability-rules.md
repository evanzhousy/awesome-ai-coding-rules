# Observability rules

## Purpose

These rules describe the current observability policy for TradingFlow in manager-readable terms.

It is meant to answer:

- what gets reported
- where it goes
- how severity works
- how environment behavior differs
- what teams should verify when observability changes

It is not an implementation reference and intentionally avoids code-level detail.

## Current Operating Model

TradingFlow now uses one unified observability model across frontend and backend.

There are only two event kinds:

- `error`
- `info`

There are only two priorities:

- `P0`
- `P1`

Every event must have:

- a clear scope
- a human-readable message
- a defined severity

### Outcome ownership

Error Tracking is reserved for a final user-visible failure or a critical integrity failure. The layer that knows the final user or integrity outcome owns `reportError`; lower transport, retry, cache, provider, and fallback layers must not create Error Tracking issues before recovery is settled.

Use this outcome matrix:

- success → no observability event unless an operational diagnostic is independently useful
- retry then success → `info.P1` when the recovery is useful to diagnose, otherwise nothing
- primary path fails but fallback succeeds → `info.P1`
- stale/cached data remains usable after refresh failure → `info.P1`
- optional/background work fails after the primary user action succeeds → `info.P1`, unless the work is itself a promised user outcome or integrity boundary
- abort, supersession, navigation cancellation, teardown, or expected cancellation → nothing
- expected request rejection such as authored validation, normal authentication/access denial, or malformed client input → normally no Error Tracking; use bounded `info.P1` only when operationally useful
- terminal user-visible unavailable/error state → exactly one `error.P1` from the final outcome owner
- security, data, financial, audit, payment, credit-ledger, deploy-configuration, or compliance integrity failure → `error.P0`

Do not report the same terminal outcome at both a transport/helper layer and a feature/page/store owner. Diagnostic events may describe the failed attempts, but the final error is emitted once.

The shared runtime enforces this boundary for ordinary 4xx-style P1 failures: authored HTTP 400–499 rejections are routed as bounded `info.P1` diagnostics rather than Error Tracking. `P0` is never automatically demoted; a genuine integrity/security condition must be classified explicitly at its owner.

Engineering may attach **small structured diagnosis fields** on error events via `reportError` metadata or `processApiResponseSystemError` context so Better Stack log search can group failures without guessing from message text alone. Standard fields include:

- `correlationId` — stable id for one request or user-visible operation (generated when omitted).
- `surface` — product or module area (for example `option-trades`, `billing-status`, `symbol-catalog`).
- `operation` — verb-like step name (for example `fetchOptionTradesRows`, `getUserSubscription`).
- `requestUrl` — when the failure is tied to a specific HTTP or RPC URL (no secrets).
- **`failureKind`** — high-level cause bucket; must reuse the shared `ErrorCategory` values from `src/lib/errors/errorCodes.ts` (`auth`, `validation`, `transient`, `business`, `system`). Client paths should set this via `processApiResponseSystemError`, which derives it from `classifyError` when the caller does not override it.
- **`requestStage`** — optional per-surface pipeline step (for example `timeout_client`, `stripe_customer`, `clickhouse_query`) so operators can filter within a surface. Values are defined beside each feature, not as one global enum.

When MCP cannot query historical **Errors** exceptions, repair the Better Stack Telemetry cloud connection for the Errors application (same data region as ingestion) and refresh errors query instructions before SQL per [ops/webappp-fullstack/webapp-check-error.md](../webappp-fullstack/webapp-check-error.md).

`processApiResponseSystemError` may also attach `userErrorPresentation` (`silent`, `toast`, `inline`, `toastWithRetry`) on the error event payload. Presentation is orthogonal to incident severity: the helper defaults to **`P1`**, and callers must explicitly opt into **`P0`** for a deploy-wide, security, data-integrity, financial-integrity, or compliance-critical incident.

## Severity Policy

### `P0`

Use `P0` only when a single event proves a critical operational condition that needs immediate human action:

- a production-wide or broad-surface outage with no safe fallback
- security exposure or authorization bypass
- irreversible data loss or corruption
- payment, credit, or audit-ledger integrity failure
- deploy-critical configuration failure
- compliance-critical delivery failure

### `P1`

Use `P1` when:

- a user-visible operation reaches a terminal failure that is not `P0`
- a user-visible feature remains unavailable after its bounded recovery paths are exhausted
- a promised user mutation or delivery fails and the failure is not a critical integrity event

Recovered, fallback, stale-but-usable, optional-background, and expected-rejection outcomes are not `error.P1`; route them as `info.P1` when they are useful for diagnosis.

## Destinations

TradingFlow currently uses two observability destinations plus one collaboration surface:

- PostHog
- BetterStack
- Slack (incident collaboration, owned by Better Stack)

Their roles are different.

### Recommended routing principle

Use both observability destinations with distinct ownership; do not mirror every log to both systems.

- PostHog is the user-facing error and context plane: error events with route, session, browser, and replay context, plus product analytics and `$pageview`.
- BetterStack is the operational plane: structured and redacted logs, request lifecycle, correlation IDs, provider/timeout/retry signals, error patterns, and incident escalation.
- Route trusted backend `error.P0` and `error.P1` to both; route `info.P0` and `info.P1` to BetterStack only. Keep product events and `$pageview` PostHog-only.
- Send only bounded operational metadata (`correlationId`, `surface`, `operation`, `requestStage`, `failureKind`, release, and environment); never duplicate secrets, request bodies, cookies, headers, or raw PII.
- A quiet sink is a coverage signal, not proof that production is healthy; verify ingestion across both destinations before declaring recovery.

### Slack

Slack is the human incident-collaboration surface. Application code does not call Slack and does not hold a Slack webhook; Better Stack creates, updates, and resolves Slack-visible incidents through its native integration.

It receives:

- explicit trusted-backend `error.P0` incidents created by Better Stack
- threshold-breached P1 aggregate incidents created by Better Stack
- recovery updates on the same incident

Individual `error.P1` events stay in PostHog and BetterStack. They do not notify Slack. Better Stack on-call scheduling is a separate plan capability; when no schedule exists, the current team receives incident notifications.

### PostHog

PostHog is used in two different roles, which must not be confused:

- product analytics
- error observability

For observability, PostHog is used only for error events.

Generic informational operational events do not go to PostHog anymore.

If a team wants a product event for growth or product analysis, that should be emitted explicitly as product analytics, not inferred from observability routing.

**PostHog Web Analytics vs this app (ops + PM)**

The same PostHog **project** receives observability errors (per routing above) and **product** events from two channels:

- **Frontend** product events from `capturePostHogEvent` in [`src/services/posthog.ts`](../../src/services/posthog.ts).
- **Backend** product events from `captureBackendPostHogEvent` in [`src/server/analytics/posthog.ts`](../../src/server/analytics/posthog.ts), reserved for server-authoritative state changes (billing/checkout success, user provisioning).

Both helpers attach the same origin contract (`channel: 'frontend' | 'backend'`, `env`, `runtime`) so PostHog filters and funnels can split by origin uniformly. See [`ops/webappp-fullstack/posthog-research.md`](../webappp-fullstack/posthog-research.md) for naming and product-analytics conventions. **`$pageview`** for route traffic is emitted from the webapp [`src/layouts/BasicLayout.tsx`](../../../tradingflow-webapp-fullstack/src/layouts/BasicLayout.tsx) via **`captureRouteViewForPostHog`** in [`src/services/posthog.ts`](../../../tradingflow-webapp-fullstack/src/services/posthog.ts) (automatic PostHog **`history_change`** pageviews are off so TanStack Router navigations are counted reliably). PostHog **Web Analytics** and digest-style summaries that depend on **`$pageview`** should align with real route traffic for **app.tradingflow.com** after that pipeline is healthy.

For **traffic by URL**, use **`$pageview`** (pathname / current URL properties as surfaced in PostHog). **Product-area rollups** that used to rely on a custom `path_group` property are no longer sent on every navigation; rebuild them in PostHog (Actions, HogQL on `$pathname`, etc.) if dashboards still need buckets. High-volume **`frontend_error`** / **`frontend_log`** events are **observability** noise in the same project; keep product funnel questions on **`$pageview`** plus named events from the two product helpers above, and use Better Stack / Slack incidents for operational triage per this document.

To split frontend vs backend in the PostHog UI, filter on the **`channel`** property — present on both **`$exception`** error events (already tagged by the observability sinks) and product events emitted via the helpers above.

### BetterStack

BetterStack is the durable operational log store.

It is intended to hold:

- error events
- informational operational events

BetterStack replaces the old pattern where informational observability was partially stored in PostHog.

## Routing Policy

The current routing behavior is:

- trusted backend `error.P0` → PostHog, BetterStack → immediate Better Stack incident / Slack
- `error.P1` → PostHog, BetterStack
- `info.P0` → BetterStack only
- `info.P1` → BetterStack only

This is intentional.

Key consequences:

- informational events no longer go to PostHog as part of generic observability
- individual P1 errors never notify Slack; Better Stack threshold monitors own the escalation decision
- browser telemetry is authenticated and relayed through the app; the server clamps it to P1, so only trusted backend events can create immediate P0 incidents

### Browser startup delivery

Browser error reporting preserves the routing policy without making the Sentry
or PostHog vendor SDKs part of the first-render bundle. The lightweight browser
bootstrap queues early vendor-sink errors while those SDKs load, then replays
them in order. Browser Better Stack Telemetry delivery uses the authenticated,
same-origin `/api/observability/client` relay; it never ships the Better Stack
bearer token to the browser and never treats client priority as pager-authoritative.
Queue overflow is surfaced as a sink failure rather than silently discarding an error.

Browser Error Tracking is application-owned. PostHog exception autocapture and Sentry global/browser-API exception integrations are disabled for Error Tracking; explicit app-owned `reportError` events remain routed through the PostHog and Better Stack Errors sinks. Raw `window.onerror` and unhandled-rejection signals may be retained as bounded, redacted Better Stack `info.P1` diagnostics, but they do not create Error Tracking issues by themselves.

Known harmless browser-runtime notifications such as benign `ResizeObserver` loop notifications are dropped at that raw-diagnostic boundary. This does not suppress an explicit app-owned failure merely because its message contains the same text.

### Third-party browser exception filtering

Raw exceptions from embedded vendors may be dropped before PostHog and Better Stack Errors only when both the failure shape and vendor provenance are established—for example, a known TradingView message paired with a TradingView host or immutable `/w/<locale>/chunks/` bundle path. Message-only suppression is not allowed because first-party code may throw the same text. The app's own structured integration failures remain reportable even when their underlying vendor's raw exception is filtered.

This filtering controls duplicate/non-actionable vendor implementation noise; it must not conceal a verified user-visible integration outage. When rendered impact is unknown, retain a narrowly scoped diagnostic or verify the affected flow before broadening a filter.

## SSR server functions (TanStack Start)

When a **server function** throws before returning, TanStack responds with HTTP 500 and a JSON body. The app also reports that failure as:

- **`error.P0`**, **`scope: serverFn.uncaught`**, **`channel: backend`**, with **`serverFnId`** in metadata (the build-generated id for that handler).

Per-process **cold-start** (when observability is enabled for the environment) runs **server env validation** and may emit one **`error.P0`** event:

- **`scope: server.envValidation`** — the server **eagerly** runs the same deploy-critical config getters used at runtime (`CLICKHOUSE_*`, Clerk, Stripe secrets per mode). If any getter throws (same rules as lazy `requiredEnv` / mode fallbacks), a **single** P0 error is sent with structured **`failures`** (check label + message; no secret values). Used to surface misconfigured deploys **before** users only see generic HTTP 500s from many server functions. This cold-start validation runs only when external observability is enabled for that runtime env (production by default; skipped when the env gate is off, including default `test`).

## Environment Policy

TradingFlow uses three runtime environments:

- `development`
- `test`
- `production`

**SSR / backend:** the observability `env` tag comes from `getServerRuntimeEnvironment()`, which prefers **`import.meta.env.VITE_NODE_ENV`** (set at **build** time from `--mode` and `.env.*`) and only then **`process.env.VITE_NODE_ENV`**. Relying on the latter alone often mis-tags **`development`** on serverless (e.g. Netlify) because `VITE_*` may not be present in the function’s **runtime** `process.env` even when your deploy is a test build.

External observability delivery is controlled per environment by application config.

The current default policy is:

- `development` disabled
- `test` disabled
- `production` enabled

### Development

Development is console-only by default.

If the environment gate is enabled intentionally, development can emit externally with `DEVELOPMENT` tagging.

### Test

Test is console-only by default (same noop/local path as disabled `development`): PostHog observability, Better Stack Telemetry, and Better Stack Errors (Sentry-compatible SDK via observability bootstrap) do not receive events unless `enabledByEnv.test` is turned on in config for a deliberate staging-like setup.

### Production

Production emits to external observability sinks.

## Configuring PostHog, Better Stack, and Slack (Ops)

Environment gates and public PostHog hosts live in **`src/lib/observability/config.ts`** under `OBSERVABILITY_CONFIG`. Credentials come from deployment environment variables. Update the fields below, then merge and deploy like any other app config change.

**Environment gate**

- `enabledByEnv.development`
- `enabledByEnv.test`
- `enabledByEnv.production`

These booleans decide whether external observability is active in each environment. If an environment is disabled, the app falls back to local-only/noop behavior for that environment.

**PostHog** (`posthog`)

- `key` — project API key  
- `host` — ingest URL (e.g. your PostHog proxy or `https://app.posthog.com`)

**Better Stack** — two products:

- **Telemetry (logs/events):** server-only `BETTER_STACK_TELEMETRY_URL` and `BETTER_STACK_TELEMETRY_BEARER_TOKEN`. The app sends JSON with `dt`, `message`, and metadata (`Authorization: Bearer …`). Authenticated browser events use the app relay and are clamped to P1.
- **Errors:** browser `VITE_BETTER_STACK_ERRORS_DSN` and server-only `BETTER_STACK_ERRORS_DSN`. The app uses **`@sentry/tanstackstart-react`** (TanStack Start React) for both runtimes, not Next.js.

Leave either Telemetry credential or an Errors DSN empty to disable that path. PostHog remains independent.

**Better Stack incident delivery**

- Slack is configured in Better Stack Uptime integrations, not application code.
- `P0 errors - production (immediate)` filters trusted backend production P0 errors, triggers above zero every 30 seconds with no confirmation delay, and recovers after ten minutes.
- `P1 errors - production (5m)` filters trusted backend events and triggers above five production P1 errors in five minutes, confirms for two minutes, and recovers after ten minutes.
- Individual P1 errors never create an incident. The current Better Stack plan notifies the current team; an on-call schedule requires a plan upgrade.
- Forward Vercel production logs/traces through the Better Stack Vercel integration or a production-only Vercel Drain. Vercel is a telemetry source, not a second incident owner.

**Smoke-check after deploy:** PostHog (errors), Better Stack Telemetry (backend event plus authenticated browser relay), Better Stack Errors (new issue in Errors UI), and Better Stack incident → Slack delivery/recovery. For **product** sanity on the same PostHog project, confirm **`$pageview`** appears in Live events (or HogQL) after an initial load **and** after a client-side route change (no full reload)—Web Analytics visitors should then reflect SPA traffic.
