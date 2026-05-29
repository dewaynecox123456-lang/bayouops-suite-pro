<#
.SYNOPSIS
Starts the BayouOps Suite Pro portable Windows launcher.

.DESCRIPTION
Provides a local, non-admin menu for running bundled export and aggregation
workflows from the portable release folder.
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportsPath = Join-Path -Path $PackageRoot -ChildPath 'exports'
$DocsPath = Join-Path -Path $PackageRoot -ChildPath 'docs'
$ReadinessScript = Join-Path -Path $PackageRoot -ChildPath 'windows/Export-PatchReadiness.ps1'
$AggregationScript = Join-Path -Path $PackageRoot -ChildPath 'tools/aggregate_operational_reports.py'

function Write-MenuHeader {
    Clear-Host
    Write-Host 'BayouOps Suite Pro - Windows Portable Launcher'
    Write-Host '================================================'
    Write-Host ''
    Write-Host "Package: $PackageRoot"
    Write-Host "Exports: $ExportsPath"
    Write-Host ''
}

function Wait-ForOperator {
    Write-Host ''
    Read-Host 'Press Enter to return to the menu' | Out-Null
}

function Ensure-ExportsFolder {
    if (-not (Test-Path -Path $ExportsPath)) {
        New-Item -Path $ExportsPath -ItemType Directory -Force | Out-Null
    }
}

function Invoke-WindowsReadinessExport {
    Ensure-ExportsFolder

    if (-not (Test-Path -Path $ReadinessScript)) {
        throw "Missing readiness exporter: $ReadinessScript"
    }

    $outputPath = Join-Path -Path $ExportsPath -ChildPath 'patch-readiness-report.csv'
    & $ReadinessScript -OutputPath $outputPath
}

function Get-PythonCommand {
    $candidates = @('py', 'python', 'python3')

    foreach ($candidate in $candidates) {
        $command = Get-Command -Name $candidate -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }

    return $null
}

function Invoke-AggregationEngine {
    Ensure-ExportsFolder

    if (-not (Test-Path -Path $AggregationScript)) {
        throw "Missing aggregation engine: $AggregationScript"
    }

    $python = Get-PythonCommand
    if (-not $python) {
        throw 'Python was not found. Install Python 3 or run the aggregation engine from an environment where python is available.'
    }

    & $python $AggregationScript
}

function Open-PortablePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -Path $Path)) {
        throw "Path not found: $Path"
    }

    Start-Process -FilePath $Path
}

while ($true) {
    Write-MenuHeader
    Write-Host '1. Run Windows Operational Readiness Export'
    Write-Host '2. Run Aggregation Engine'
    Write-Host '3. Open Exports Folder'
    Write-Host '4. Open Documentation'
    Write-Host '5. Exit'
    Write-Host ''

    $choice = Read-Host 'Select an option'

    try {
        switch ($choice) {
            '1' {
                Invoke-WindowsReadinessExport
                Wait-ForOperator
            }
            '2' {
                Invoke-AggregationEngine
                Wait-ForOperator
            }
            '3' {
                Ensure-ExportsFolder
                Open-PortablePath -Path $ExportsPath
            }
            '4' {
                Open-PortablePath -Path $DocsPath
            }
            '5' {
                break
            }
            default {
                Write-Host 'Unknown option. Enter 1, 2, 3, 4, or 5.'
                Wait-ForOperator
            }
        }
    }
    catch {
        Write-Host ''
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Wait-ForOperator
    }
}
