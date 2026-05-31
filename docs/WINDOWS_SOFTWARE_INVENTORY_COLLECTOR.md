# Windows Software Inventory Collector

`collectors/windows/Get-BayouOpsSoftwareInventory.ps1` is a read-only Windows
software inventory collector for BayouOps visibility and reporting.

The collector reads standard Windows uninstall registry locations and exports
software inventory records as JSON, CSV, or PowerShell objects. It is intended
to support operational review, reporting, audit preparation, handoff
conversations, and future BayouOps import workflows.

## Purpose

Use this collector when you need a local software inventory snapshot from a
Windows endpoint without installing an agent or changing system state.

The output can help answer operational questions such as:

- What software is registered on this endpoint?
- Which publisher and version are reported by Windows uninstall metadata?
- Which registry hive and uninstall key supplied each record?
- Can this endpoint inventory be attached to a BayouOps report later?

## Registry Paths Read

The collector reads these locations:

```text
HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*
HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*
HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*
```

These paths cover common machine-wide 64-bit installs, machine-wide 32-bit
installs on 64-bit Windows, and current-user installs.

## Collected Fields

Each record includes:

- `ComputerName`
- `CollectedAt`
- `DisplayName`
- `DisplayVersion`
- `Publisher`
- `InstallDate`
- `InstallLocation`
- `InstallSource`
- `UninstallString`
- `QuietUninstallString`
- `ModifyPath`
- `EstimatedSize`
- `RegistryHive`
- `RegistryPath`

`RegistryHive` and `RegistryPath` are included so BayouOps can trace each row
back to the source uninstall registry key.

## Example Commands

Run from Windows PowerShell 5.1:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\collectors\windows\Get-BayouOpsSoftwareInventory.ps1 -OutputJson .\exports\software-inventory.json
```

Run from PowerShell 7 or later:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsSoftwareInventory.ps1 -OutputCsv .\exports\software-inventory.csv
```

Export both JSON and CSV:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsSoftwareInventory.ps1 -OutputJson .\exports\software-inventory.json -OutputCsv .\exports\software-inventory.csv
```

Include uninstall registry entries with empty `DisplayName` values:

```powershell
pwsh -NoProfile -File .\collectors\windows\Get-BayouOpsSoftwareInventory.ps1 -OutputJson .\exports\software-inventory-all.json -IncludeEmptyNames
```

Return objects to the pipeline without writing a file:

```powershell
.\collectors\windows\Get-BayouOpsSoftwareInventory.ps1 | Format-Table DisplayName, DisplayVersion, Publisher, RegistryHive
```

## Privacy And Safety

This collector is visibility and reporting only.

It does not:

- uninstall software
- modify registry keys or values
- deploy software
- perform remediation
- start or stop services
- connect to external services
- require external dependencies

The script reads local uninstall registry metadata. Some fields, especially
`InstallLocation`, `InstallSource`, `UninstallString`, `QuietUninstallString`,
and `ModifyPath`, may contain local paths, command lines, product codes, or
environment-specific deployment details. Review exports before sharing them
outside the customer environment.

Administrator rights are not required for the script itself. Standard users may
not be able to read every machine-wide registry entry in some locked-down
environments. In that case, run under an account that has read access to the
target registry locations.

## Importing Into BayouOps

BayouOps can use the JSON or CSV output as an import source for the Software /
Agent Visibility module.

The workflow is:

```text
Windows endpoint collector -> JSON/CSV export -> BayouOps import -> visibility/reporting
```

Import steps:

1. Run `Get-BayouOpsSoftwareInventory.ps1` on a Windows endpoint.
2. Export JSON or CSV.
3. Open the BayouOps landing page.
4. Go to the Software / Agent Visibility section.
5. Select `Import JSON` or `Import CSV`.
6. Choose the collector output file.

After import, BayouOps groups inventory records by `DisplayName`, shows observed
version drift by `DisplayVersion`, shows inventory record counts, preserves
per-endpoint registry source details, and keeps JSON/CSV dashboard exports
available for reporting.

The importer maps records by:

- `ComputerName`
- `DisplayName`
- `DisplayVersion`
- `Publisher`
- `RegistryHive`
- `RegistryPath`
- `CollectedAt`

The dashboard displays a `Sample Data` or `Imported Data` indicator so operators
can tell whether they are reviewing the built-in scenario or a collector export.
Bad or unsupported files display an import validation message and do not replace
the currently loaded dashboard data.

Imported records remain local to the browser session. BayouOps does not upload
the file, deploy software, uninstall software, execute remote commands, modify
registry state, or perform remediation.

Sample output files are available at:

- `samples/software-inventory.sample.json`
- `samples/software-inventory.sample.csv`

## Scope Statement

This collector is for software inventory visibility and reporting only. It is
not a deployment tool, uninstall tool, removal workflow, remediation engine, or
agent control system.
