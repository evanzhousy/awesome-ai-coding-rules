# Logging & Alerting — Domain Invariants

## Purpose

This document defines required logging and alerting behavior so production failures are visible even when one transport is degraded. It is written to be reusable across fullstack projects; each repo plugs in its concrete APIs via the **Project mapping** section.

## Environment-Based Routing Matrix

Single source of truth for where each event type goes:

| Event Type                         | Local              | Production                                  |
|------------------------------------|--------------------|---------------------------------------------|
| Debug / low-value info             | `console.log`      | None (suppressed)                            |
| Critical info (cron begin/end, summaries) | `console.log` | Info channel (e.g. Discord info)             |
| Errors                             | `console.error`    | Error channel + error-tracking (e.g. Sentry)  |

- There is no "warning" level. Actionable issues or threshold breaches use the **error handler**; non-fatal anomalies belong in run-level summaries via the **info handler**.

## Canonical Logging APIs (Abstract)

Your service must expose three behaviors; names and signatures may differ per project (see Project mapping).

1. **Error handler** `(errorOrMessage, locationOrScope)`  
   - **Local:** wraps `console.error`.  
   - **Production:** sends to **both** the error channel and the error-tracking service (e.g. Sentry).  
   - Preserve the original `Error` object or stack when possible (pass natively or in context).

2. **Info handler** `(message, locationOrScope)`  
   - **Local:** wraps `console.log`.  
   - **Production:** sends to the info channel. Optionally to error-tracking if your project config does so.

3. **Local-only logger** `(message)`  
   - **Local:** wraps `console.log`.  
   - **Production:** suppressed entirely.

**Rules:**

- Do not use `console.*` directly in production code paths.
- Debug-only output must use the local-only logger so it is suppressed in production.

## Fullstack Split

In fullstack apps, the **client** and **server** may expose different modules (e.g. client telemetry service vs server observability). Both must follow the same routing matrix and transport invariant.

## Transport Invariant (Production)

- All required transports receive errors **simultaneously** — this is not a fallback model; every required destination gets the event.
- Critical info goes to the info channel (and to error-tracking only if the project config says so).
- There is no fallback or dedup logic between transports. All sends are best-effort and independent.

## Mandatory Patterns

- **Controller/handler catch blocks:** Call the error handler before returning failure responses. Preserve the original `Error` or stack (either pass the `Error` natively or capture it in context/scope).
- **Scheduled/background jobs:** Emit:
  - Start summary (info handler).
  - Finish summary with duration (info handler).
  - On failure: error details via error handler.
- **Scope/location:** Every call must include a **scope**, **location**, or **jobName** (or equivalent) so events can be filtered in Discord, Sentry, or other tools.
- **High-volume per-item anomalies:** Aggregate into run-level summaries; use threshold-based escalation to the error handler when needed.

## Anti-Patterns

- Swallowing exceptions without calling the error handler.
- Returning HTTP error responses from catch blocks without alerting.
- Using `console.warn()` — use the error handler for threshold breaches or the info handler for summaries.
- Emitting production-critical failures through direct `console.log` / `console.error`.
- Using `console.log` in production code paths — debug-only info must use the local-only logger, which is suppressed in production.

---

## Project Mapping (tradingflow-webapp-fullstack)

Use this section to map the abstract APIs above to this repo.

| Surface | API | Purpose |
|---------|-----|---------|
| **Client** | `TelemetryService.logErrorHandler(err, location, level)` | Errors; production → Sentry + Discord error channel. |
| **Client** | `TelemetryService.logInfoHandler(msg, location)` | Critical info; production → Discord info channel. |
| **Client** | `localLogging(msg)` from `@/utils/functions` | Debug-only; production → suppressed. |
| **Server** | `serverError(scope, message, error)` from `@/server/core/observability` | Errors; production → Discord error channel. |
| **Server** | `serverInfo(scope, message)` | Critical info; production → Discord info channel. |
| **Server** | `serverLog(scope, message, context?)` | Operational/debug log; console only (no Discord). |

**Transports in this project:**

- **Client errors:** Sentry + Discord error channel.
- **Client info:** Discord info channel.
- **Server errors:** Discord error channel (no Sentry on server).
- **Server info:** Discord info channel.
- **Server log:** Process console only.

**Files:**

- Client: [src/services/telemetry.ts](../../../src/services/telemetry.ts), [src/utils/functions.ts](../../../src/utils/functions.ts) (`localLogging`).
- Server: [src/server/core/observability.ts](../../../src/server/core/observability.ts).
