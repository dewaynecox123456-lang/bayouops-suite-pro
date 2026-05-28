# BayouOps Suite Pro

Developer Preview v0.2 provides local, read-only Windows and Linux operational
export collectors for early access evaluation.

## Windows Operational Readiness Export

Generate a local Windows patch readiness CSV:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1
```

Default output:

```text
exports/patch-readiness-report.csv
```

The report includes hostname, last boot time, reboot pending status, installed hotfix count, disk free space, and OS caption/version.

For validation on non-Windows systems:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1 -UseSampleData
```

See [docs/windows-operational-readiness-export.md](docs/windows-operational-readiness-export.md) for full usage and safety notes.

## Linux Operational Health Export

Generate a local Linux operational health report:

```bash
bash linux/Linux_Health_Check.sh
```

Default outputs:

```text
exports/linux-health-report.txt
exports/linux-health-summary.csv
```

The report includes hostname, OS release, kernel version, uptime, disk usage, top disk usage directories, failed systemd services when available, reboot required indicator, current user, and timestamp.

See [docs/linux-operational-health-export.md](docs/linux-operational-health-export.md) for full usage and safety notes.

## Developer Preview Package

The v0.2 release package is intended for early access review and includes the
collectors, generated sample/current exports, documentation, license, support
scope, release notes, and manifest.

This Developer Preview does not include enterprise support, managed service
claims, or production service-level commitments.
