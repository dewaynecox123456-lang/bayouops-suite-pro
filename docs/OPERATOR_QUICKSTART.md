# BayouOps Suite Pro — Operator Quickstart

BayouOps Suite Pro is a local-first operational readiness toolkit for
collecting, organizing, and exporting system health and readiness data.

It is read-only, operator-controlled, and designed to run on demand. BayouOps
does not deploy agents, modify endpoints, trigger remediation, collect
telemetry, or run hidden background services.

## Intended Use

Use this tool to help document:

- Linux operational health
- Windows readiness exports
- patch/readiness observations
- operational aggregation output
- lightweight evidence collection

## Basic Workflow

1. Run the appropriate collector.
2. Review generated output.
3. Export or archive the result.
4. Use the report for internal review, client notes, or operational documentation.

## Preflight

Before running a customer workflow, confirm:

- `exports/` exists or can be created by the launcher/script.
- `config/lines-of-business.json` exists if customer LOB names should be used.
- Demo report packs have a generated dataset under `demo-data/generated/`.
- The executive dashboard has been rendered to
  `screenshots/demo/executive-dashboard.html` before export packaging.

## Local Demo Pack

From the source repo, generate and package a local executive demo:

```bash
node scripts/demo/generate-demo-scenario.mjs
node scripts/demo/render-demo-dashboard.mjs
node scripts/demo/export-executive-demo-pack.mjs
```

Open the generated folder under `exports/demo/`, then open
`executive-dashboard.html` in a browser.

## Lines Of Business

Edit `config/lines-of-business.json` to rename, add, or remove customer-facing
Lines of Business. The optional `aliases` object maps older names to updated
customer terms during dashboard rendering.

## Support

- Email: [support@bayoufinds.com](mailto:support@bayoufinds.com)
- Phone: Coming soon
- Website: https://bayoufinds.com

Support email forwarding must be verified before public customer launch. Keep
support phone as `Coming soon` until a dedicated business or Google Voice number
is ready.

## Notes

This is not an RMM, EDR, vulnerability scanner, or replacement for enterprise monitoring.

It is designed as a lightweight operational visibility layer with local exports.

---

Copyright © 2026 Dewayne Cox and Cheri Cox. All Rights Reserved.
