---
name: data-quality
description: Legacy alias for the TradingFlow data integrity and Greeks parity runbook. Use ops/cf-service/check-data-integrity.md as the canonical operator entrypoint for ClickHouse data integrity, Option Trades latency, SymbolMetaData coverage, write-buffer health, and Greeks/price parity scans.
---

# Data Quality Runbook Alias

This file is intentionally a thin alias. The canonical, maintained runbook is:

`ops/cf-service/check-data-integrity.md`

Use that file for the full workflow, latest run note, Agent Handoff, report templates, and schema-specific guidance.

## Recommended Invocation

Use `/goal` against the canonical runbook:

- Objective: audit the most recent fully closed ET trading session for data integrity, latency, small-trade coverage, and Greeks/price parity.
- Success criteria: follow `ops/cf-service/check-data-integrity.md`, update its `Latest run note`, and prune or refresh its `Agent Handoff`.
- Stop condition: the canonical runbook produces a complete verdict or names the exact blocker.

## Agent Handoff

Last updated: 2026-06-17

No open handoff items in this alias. Look first at `ops/cf-service/check-data-integrity.md`, especially its `Agent Handoff` and `Latest run note`.

## Runbook Self-Maintenance

At the end of each run:

1. Maintain `ops/cf-service/check-data-integrity.md` first; it owns the full procedure and handoff state.
2. Update this alias only if the canonical path, alias purpose, or routing guidance changes.
3. Keep this file thin. Do not duplicate the canonical runbook body here.
4. If no durable alias rule changed, state `Runbook maintenance: no change` in the final report.

Do not add one-off findings, raw outputs, latest-run notes, or open investigation todos to this alias.
