# Windows Operational Readiness Export

BayouOps Suite Pro includes a lightweight PowerShell collector for generating a local Windows patch readiness CSV.

## Output

The script writes:

```text
exports/patch-readiness-report.csv
```

The CSV includes:

- Hostname
- Last boot time
- Reboot pending status and reason
- Installed hotfix count
- Disk free space summary
- OS caption and version
- Collection timestamp
- Notes for partial inventory or access errors

## Usage

Run from the project root on a Windows system:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\Export-PatchReadiness.ps1
```

Or with PowerShell 7:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1
```

To write to a custom path:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1 -OutputPath .\exports\custom-readiness-report.csv
```

## Validation Mode

For syntax and CSV export validation on non-Windows systems, use sample data:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1 -UseSampleData
```

This creates the same CSV path with a realistic sample record.

## Safety Notes

- Local-only collection
- Read-only inventory commands
- No service changes
- No registry writes
- No reboot actions
- No package installation
- No administrator-only destructive behavior

The reboot pending check reads common Windows registry locations and records partial failures in the `Notes` column when local policy blocks access.
