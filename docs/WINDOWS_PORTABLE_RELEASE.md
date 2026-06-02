# Windows Portable Release

BayouOps Suite Pro can be staged as a local Windows portable package under
`release/windows-portable/`. The package is intended for ZIP distribution or
later MSI wrapping, without requiring installation or administrative privileges
by default.

The portable package is operator-triggered and local-only. It does not install
agents, start services, schedule tasks, collect telemetry, or phone home.

## Included Contents

- `README.md`: release overview and operator notes.
- `LICENSE.txt`: project license, when present in the source repo.
- `docs/`: bundled product and workflow documentation.
- `windows/`: Windows operational readiness exporter.
- `tools/`: local aggregation engine.
- `scripts/demo/`: local demo generation, dashboard rendering, and export pack scripts.
- `demo-data/generated/`: seed demo dataset for local report generation.
- `screenshots/demo/executive-dashboard.html`: rendered executive dashboard HTML.
- `exports/`: empty output folder for generated reports.
- `config/`: local customer-editable configuration, when present.
- `icons/`: bundled launcher/icon assets, when present.
- `BayouOps-Launcher.ps1`: PowerShell menu launcher.
- `BayouOps-Launcher.bat`: double-click launcher for the PowerShell menu.

## How to Run

1. Open `release/windows-portable/` on a Windows host.
2. Double-click `BayouOps-Launcher.bat`, or run `BayouOps-Launcher.ps1` from PowerShell.
3. Choose one of the launcher options:
   - Generate Demo Environment
   - Render Executive Dashboard
   - Generate Executive Export Pack
   - Run Windows Read-Only Health Export
   - Run Aggregation Engine
   - Open Exports Folder
   - Open Documentation
   - Open About BayouOps
   - Open Support Information
   - Open Terms / License Agreement
   - Exit

The launcher displays product name, version, edition, support email, license
status, package path, export path, and local preflight checks. The readiness
export runs without admin elevation by default. Some Windows inventory fields
may be partial if local policy blocks read access.

Protected workflows require the operator to confirm acceptance of the license
terms and conditions before they run. Documentation, support, about, and terms
files remain accessible without acceptance.

## Preflight

Before customer handoff, confirm:

- `exports/` exists and is writable by the operator.
- `windows/Export-PatchReadiness.ps1` is present.
- `tools/aggregate_operational_reports.py` is present if aggregation will be used.
- `docs/` is present for offline operator guidance.
- `config/lines-of-business.json` is present if customer LOB labels are needed.
- `scripts/demo/` and `demo-data/generated/` are present if executive demo packs will be generated.
- `docs/TERMS_AND_CONDITIONS.md` and `docs/EULA.md` are present.
- `icons/launcher-icon-concept.ico` is present when icon assets are packaged.

## Support

- Email: [support@bayoufinds.com](mailto:support@bayoufinds.com)
- Phone: Coming soon
- Website: https://bayoufinds.com

Verify support email forwarding before public customer launch. Keep support
phone as `Coming soon` until a dedicated business or Google Voice number is
ready.

## Expected Outputs

Generated files are written to `exports/` inside the portable package:

- `patch-readiness-report.csv`: Windows host readiness export.
- `executive-operational-summary.csv`: aggregated host summary.
- `operational-risk-summary.txt`: operator-readable risk summary.

The aggregation engine reads any available input files in `exports/`, including `patch-readiness-report.csv` and `linux-health-summary.csv` if present.

Executive demo packs generated from the portable folder are written under
`exports/demo/`. Generated export bundles are local artifacts and should not be
committed back to the source repository.

## Safety Scope

The portable release is local-first and file-based. The included launcher and bundled scripts:

- do not require administrator rights by default;
- do not delete or modify system files;
- write generated output only under the package `exports/` folder;
- perform read-only collection for the Windows readiness export;
- run aggregation against local CSV inputs only.
- perform work only after the operator chooses a launcher action.
- exclude optional screenshot gallery PNG files from the customer package.
- include existing launcher icon assets without adding new image dependencies.

## Future MSI Packaging

This package is a clean portable foundation only. A later MSI pass can wrap the same staged contents, add shortcuts, define install and uninstall behavior, and set signing or publisher metadata. MSI packaging is intentionally out of scope for this pass.

---

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
