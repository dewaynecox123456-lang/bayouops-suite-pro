# BayouOps Windows Network Inventory Collector

This collector gathers read-only operational inventory from approved Windows machines using PowerShell Remoting.

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
