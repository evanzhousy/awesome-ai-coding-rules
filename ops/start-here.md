# Ops Runbook Index

Start here when choosing or maintaining an AI-agent runbook under `ops/`.

## Recommended Invocation

For multi-step or verifiable work, run the selected runbook with `/goal`:

- Objective: the concrete operator outcome named by the runbook.
- Success criteria: the runbook's verification commands, evidence checks, report template, and required maintenance step.
- Stop condition: complete, genuinely blocked, or user-directed pause.

If a runbook can touch production, money, notifications, destructive state, or third-party account configuration, keep execution read-only unless the runbook and the user explicitly authorize the mutation.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items after the latest maintenance sweep. Start by selecting the narrowest runbook below and reading its `Agent Handoff` / watchlist / backlog section before following the main workflow.

## Runbooks

| Area | Runbook | Use first when |
| --- | --- | --- |
| CF service | `ops/cf-service/check-durability-object-status.md` | Checking production Worker DO/KV/API serving health, freshness, and size. |
| CF service | `ops/cf-service/data-quality.md` | Auditing ClickHouse trade/meta integrity, latency, small-trade coverage, contract-rank correctness, and Greeks parity. |
| CF service | `ops/cf-service/betterstack-error-healing.md` | Investigating process-service producer ingest gaps with Better Stack plus ClickHouse coverage. |
| Webapp | `ops/webappp-fullstack/error-investigate.md` | Correlating recent production errors across PostHog Error Tracking and Better Stack. |
| Webapp | `ops/webappp-fullstack/posthog-research.md` | Running product analytics, event quality, dashboard, and behavior reviews in PostHog. |
| Webapp | `ops/webappp-fullstack/browser-e2e-product-review.md` | Walking webapp UI journeys with `@Browser` for manual E2E product testing, UI defects, and PM/trader UX findings. |
| Landing | `ops/landingpage/e2e-product-review-runbook.md` | Simulating user journeys while doing E2E maintenance and product review. |
| Landing | `ops/landingpage/update-blog-posts-and-changelog.md` | Updating bilingual blog posts, screenshots, public changelog, and What's New sync. |
| Landing | `ops/landingpage/posthog-events.md` | Auditing or extending landing-site PostHog event taxonomy and funnel definitions. |
| Skills/runbooks | `ops/skill-maintainer.md` | Maintaining runbooks and skills so future agents run them cleanly. |

## Runbook Self-Maintenance

After any runbook execution:

1. Decide whether the run revealed a reusable lesson for the selected runbook or this index.
2. Promote durable lessons into the runbook's procedure, prerequisites, verification, or troubleshooting sections.
3. Keep transient next-run state in `Agent Handoff`, active backlog, watchlist, or latest-run note only.
4. Prune completed or obsolete handoff items in the same edit that confirms they are done.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this index only when routing, canonical ownership, aliases, or the shared maintenance contract changes. Do not add one-off incident notes, raw outputs, or completed progress here.
