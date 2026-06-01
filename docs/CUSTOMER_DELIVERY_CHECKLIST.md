# Customer Delivery Checklist

Use this checklist before handing BayouOps Suite Pro to a customer, evaluator,
or internal operator.

## Delivery Scope

- Confirm BayouOps is described as local-first operational visibility and
  reporting, not remediation tooling.
- Confirm customer-facing language says read-only, operator-controlled, and
  no endpoint modifications.
- Confirm no telemetry, cloud sync, background daemon, watcher, polling loop,
  agent deployment, or auto-start behavior has been added.
- Confirm generated reports remain local unless the operator chooses to share
  them.
- Confirm protected workflows explain that a customer `license.json` file is
  required.
- Confirm protected launcher workflows require acceptance of license terms and
  conditions before running.
- Confirm Terms and EULA docs explain as-is/no-warranty and customer validation
  responsibility.

## Support Identity

- Confirm support email is listed as `support@bayoufinds.com`.
- Confirm support phone remains `Coming soon` until a dedicated business or
  Google Voice number is ready.
- Confirm website is listed as `https://bayoufinds.com`.
- Verify support email forwarding before public customer launch.
- Send and receive a test message from an external mailbox before publishing
  support contact details.

## Required Files And Folders

- `README.md`
- `START_HERE.txt`
- `docs/`
- `docs/SUPPORT_EMAIL_SETUP.md`
- `docs/TERMS_AND_CONDITIONS.md`
- `docs/EULA.md`
- `exports/`
- `config/lines-of-business.json`
- `config/license.example.json`
- `scripts/demo/render-demo-dashboard.mjs`
- `scripts/demo/export-executive-demo-pack.mjs`
- `screenshots/demo/executive-dashboard.html` after dashboard rendering
- `demo-data/generated/*.json` after demo data generation

For the Windows portable package, also confirm:

- `BayouOps-Launcher.bat`
- `BayouOps-Launcher.ps1`
- `windows/Export-PatchReadiness.ps1`
- `tools/aggregate_operational_reports.py`
- `icons/launcher-icon-concept.ico`, when packaged

## Startup And Preflight

1. Extract the package to a local folder.
2. Open `START_HERE.txt`.
3. On Windows, run `BayouOps-Launcher.bat`.
4. Confirm the launcher shows the local package path and export path.
5. Run only the operator-selected export or aggregation action.
6. Open `exports/` to review generated files.

## Demo And Report Pack

From the source repo, generate a local executive demo/report pack:

```bash
node scripts/demo/generate-demo-scenario.mjs
node scripts/demo/render-demo-dashboard.mjs
node scripts/demo/export-executive-demo-pack.mjs
```

The export pack is written under `exports/demo/` and includes the dashboard,
latest demo dataset, metadata, summary, and Lines of Business config when
present.

## Lines Of Business

Edit `config/lines-of-business.json` to rename, add, or remove customer-facing
Lines of Business. Use `aliases` to map older demo or imported names to the
customer's preferred names.

If the file is missing, empty, or malformed, BayouOps falls back to safe demo
defaults and prints a warning.

## License File

- Confirm the customer has been told to contact `support@bayoufinds.com` if a
  license file is needed.
- Confirm customer-specific licenses are installed as `config/license.json`.
- Confirm `config/license.json` is not committed or included in generic release
  packages.
- Use `config/license.example.json` only as a safe format reference.

## Legal Acceptance

- Confirm `docs/TERMS_AND_CONDITIONS.md` and `docs/EULA.md` are included.
- Confirm protected workflows require the operator to type `ACCEPT` before
  running.
- Confirm documentation states BayouOps is provided as-is, without warranty, and
  is not intended for production-critical decisions without independent
  validation.
- Confirm documentation states no endpoint modifications, telemetry, background
  services, or hidden polling are included.

## Branding Assets

- Confirm the portable package includes the existing launcher icon at
  `icons/launcher-icon-concept.ico`.
- Confirm customer-facing docs use the product name `BayouOps Suite Pro`
  consistently.

## Customer Handoff Notes

- Open HTML exports locally in a browser.
- Review JSON/CSV/TXT outputs before sending them outside the customer
  environment.
- Do not promise PDF, ZIP packaging, hosted portals, automated collection, or
  managed service behavior unless those items are approved separately.

---

Copyright © 2026 Dewayne Cox and Cheri Cox. All Rights Reserved.
