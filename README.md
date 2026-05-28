# BayouOps Suite Pro

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
