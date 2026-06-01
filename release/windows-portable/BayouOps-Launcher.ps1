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
$ConfigPath = Join-Path -Path $PackageRoot -ChildPath 'config'
$LobConfigPath = Join-Path -Path $ConfigPath -ChildPath 'lines-of-business.json'
$DocsPath = Join-Path -Path $PackageRoot -ChildPath 'docs'
$ReadinessScript = Join-Path -Path $PackageRoot -ChildPath 'windows/Export-PatchReadiness.ps1'
$AggregationScript = Join-Path -Path $PackageRoot -ChildPath 'tools/aggregate_operational_reports.py'

function Test-RequiredPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if (Test-Path -Path $Path) {
        Write-Host "OK: $Label"
        return $true
    }

    Write-Host "Missing: $Label ($Path)" -ForegroundColor Yellow
    return $false
}

function Write-MenuHeader {
    Clear-Host
    Write-Host 'BayouOps Suite Pro - Windows Portable Launcher'
    Write-Host '================================================'
    Write-Host ''
    Write-Host "Package: $PackageRoot"
    Write-Host 'Mode: Read-only, local-only, operator-triggered visibility.'
    Write-Host 'Safety: No endpoint changes, telemetry, agents, services, or background polling.'
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
        Write-Host "Created exports folder: $ExportsPath"
    }
}

function Show-PreflightSummary {
    Write-Host ''
    Write-Host 'Preflight'
    Write-Host '---------'
    Test-RequiredPath -Path $ExportsPath -Label 'exports folder' | Out-Null
    Test-RequiredPath -Path $DocsPath -Label 'documentation folder' | Out-Null
    Test-RequiredPath -Path $ReadinessScript -Label 'Windows readiness exporter' | Out-Null
    Test-RequiredPath -Path $AggregationScript -Label 'aggregation engine' | Out-Null

    if (Test-Path -Path $ConfigPath) {
        Test-RequiredPath -Path $LobConfigPath -Label 'Lines of Business config' | Out-Null
    }
    else {
        Write-Host 'Optional: config folder not present. Default demo Lines of Business will be used where applicable.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'All work is local and starts only after the operator chooses an action.'
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
        throw 'Python 3 was not found. This option is for report aggregation only. You can still run option 1 and open exports without Python.'
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
    Show-PreflightSummary
    Write-Host '1. Run Windows Read-Only Health Export'
    Write-Host '2. Run Aggregation Engine (requires Python 3)'
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
                Wait-ForOperator
            }
            '4' {
                Open-PortablePath -Path $DocsPath
                Wait-ForOperator
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
