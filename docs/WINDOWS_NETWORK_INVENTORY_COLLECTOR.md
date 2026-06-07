# BayouOps Windows Network Inventory Collector

This collector gathers read-only operational inventory from approved Windows machines using PowerShell Remoting.

This collector is read-only and intended only for systems you own or are authorized to manage.

The collector is CSV-driven. It does not perform blind network scanning,
brute-force discovery, credential harvesting, exploit checks, remediation,
remote software installation, or endpoint modification.

## Requirements

- Run from a Windows admin workstation
- PowerShell 5.1 or newer
- WinRM enabled on target machines
- Permission to query target systems
- Target list CSV

## Input CSV

Required column:

```csv
ComputerName,Role,LOB,Owner
SERVER01,Application,Operations,Dewayne Cox
SERVER02,SQL,Finance,Dewayne Cox
WORKSTATION01,Workstation,FieldOps,Dewayne Cox
```

## Example

```powershell
pwsh -NoProfile -File .\collectors\windows\Invoke-BayouOpsNetworkInventory.ps1 `
  -TargetsCsv .\samples\windows-network-targets.sample.csv `
  -OutputDir .\exports
```

Outputs are written locally:

- `exports/bayouops-network-inventory.csv`
- `exports/bayouops-network-inventory.json`

## Operator Boundaries

Use an explicit target CSV approved for the environment being reviewed. Do not
use this collector as a discovery scanner, remediation tool, or replacement for
human approval and change-control workflows.
