# Windows Portable Release

BayouOps Suite Pro can be staged as a local Windows portable package under `release/windows-portable/`. The package is intended for ZIP distribution or later MSI wrapping, without requiring installation or administrative privileges by default.

## Included Contents

- `README.md`: release overview and operator notes.
- `LICENSE.txt`: project license, when present in the source repo.
- `docs/`: bundled product and workflow documentation.
- `windows/`: Windows operational readiness exporter.
- `tools/`: local aggregation engine.
- `screenshots/demo/`: demo screenshots, when present in the source repo.
- `exports/`: empty output folder for generated reports.
- `BayouOps-Launcher.ps1`: PowerShell menu launcher.
- `BayouOps-Launcher.bat`: double-click launcher for the PowerShell menu.

## How to Run

1. Open `release/windows-portable/` on a Windows host.
2. Double-click `BayouOps-Launcher.bat`, or run `BayouOps-Launcher.ps1` from PowerShell.
3. Choose one of the launcher options:
   - Run Windows Operational Readiness Export
   - Run Aggregation Engine
   - Open Exports Folder
   - Open Documentation
   - Exit

The readiness export runs without admin elevation by default. Some Windows inventory fields may be partial if local policy blocks read access.

## Expected Outputs

Generated files are written to `exports/` inside the portable package:

- `patch-readiness-report.csv`: Windows host readiness export.
- `executive-operational-summary.csv`: aggregated host summary.
- `operational-risk-summary.txt`: operator-readable risk summary.

The aggregation engine reads any available input files in `exports/`, including `patch-readiness-report.csv` and `linux-health-summary.csv` if present.

## Safety Scope

The portable release is local-first and file-based. The included launcher and bundled scripts:

- do not require administrator rights by default;
- do not delete or modify system files;
- write generated output only under the package `exports/` folder;
- perform read-only collection for the Windows readiness export;
- run aggregation against local CSV inputs only.

## Future MSI Packaging

This package is a clean portable foundation only. A later MSI pass can wrap the same staged contents, add shortcuts, define install and uninstall behavior, and set signing or publisher metadata. MSI packaging is intentionally out of scope for this pass.
