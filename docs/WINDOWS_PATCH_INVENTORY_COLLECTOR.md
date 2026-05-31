# Windows Patch Inventory Collector

`collectors/windows/Get-BayouOpsPatchInventory.ps1` is a read-only Windows patch
inventory collector for BayouOps Patch / KB Visibility.

The collector gathers installed hotfix evidence from local Windows APIs and
exports JSON or CSV for operational readiness reporting.

## Purpose

Use this collector when you need lightweight patch evidence from a Windows
endpoint without deploying an agent or changing system state.

The output supports questions such as:

- How many systems are missing `KB5030219`?
- Which endpoints missed May patching?
- Which systems are stale more than 30 days?
- Which systems require reboot review?
- Which OS versions are drifting out of support?

## Data Sources

The collector uses:

- `Get-HotFix`
- `Get-CimInstance Win32_QuickFixEngineering`
- `Get-CimInstance Win32_OperatingSystem`

It also checks local pending reboot indicators in read-only mode.

## Exported Fields

Each record includes:

- `ComputerName`
- `HotFixID`
- `InstalledOn`
- `Description`
- `InstalledBy`
- `OSCaption`
- `LastBootUpTime`
- `PendingReboot`
- `CollectedAt`

## Example Commands

Export JSON:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsPatchInventory.ps1 -OutputJson .\exports\patch-inventory.json
```

Export CSV:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsPatchInventory.ps1 -OutputCsv .\exports\patch-inventory.csv
```

Export both:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsPatchInventory.ps1 -OutputJson .\exports\patch-inventory.json -OutputCsv .\exports\patch-inventory.csv
```

Windows PowerShell 5.1:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\collectors\windows\Get-BayouOpsPatchInventory.ps1 -OutputJson .\exports\patch-inventory.json
```

## BayouOps Import Workflow

The workflow is:

```text
Windows endpoint collector -> JSON/CSV export -> BayouOps import -> Patch / KB Visibility
```

Import steps:

1. Run `Get-BayouOpsPatchInventory.ps1` on one or more Windows endpoints.
2. Export JSON or CSV.
3. Open the BayouOps landing page.
4. Go to the Patch / KB Visibility section.
5. Select `Import JSON` or `Import CSV`.
6. Choose the collector output file.

After import, BayouOps groups patch evidence by KB, compares endpoints against
the built-in required KB baseline, calculates compliance percentage, identifies
missing KBs, highlights pending reboot review, flags stale endpoints, and marks
older operating systems for support review.

## Privacy And Safety

This collector is visibility and reporting only.

It does not:

- deploy patches
- remediate systems
- trigger Windows Update
- reboot systems
- perform remote execution
- modify registry keys or values
- install or remove software

The output can contain hostnames, OS captions, administrator or service account
names in `InstalledBy`, reboot state, and patch timeline details. Review exports
before sharing them outside the customer environment.

## Samples

Sample output files are available at:

- `samples/patch-inventory.sample.json`
- `samples/patch-inventory.sample.csv`
