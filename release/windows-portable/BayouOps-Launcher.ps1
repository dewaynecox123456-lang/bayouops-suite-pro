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

$ProductName = 'BayouOps Suite Pro'
$ProductVersion = 'v0.3 Developer Preview'
$ProductEdition = 'Professional'
$SupportEmail = 'support@bayoufinds.com'

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportsPath = Join-Path -Path $PackageRoot -ChildPath 'exports'
$ConfigPath = Join-Path -Path $PackageRoot -ChildPath 'config'
$LobConfigPath = Join-Path -Path $ConfigPath -ChildPath 'lines-of-business.json'
$LicensePath = Join-Path -Path $ConfigPath -ChildPath 'license.json'
$DocsPath = Join-Path -Path $PackageRoot -ChildPath 'docs'
$AboutDocPath = Join-Path -Path $DocsPath -ChildPath 'ABOUT_BAYOUOPS.md'
$SupportDocPath = Join-Path -Path $DocsPath -ChildPath 'SUPPORT_EMAIL_SETUP.md'
$TermsDocPath = Join-Path -Path $DocsPath -ChildPath 'TERMS_AND_CONDITIONS.md'
$EulaDocPath = Join-Path -Path $DocsPath -ChildPath 'EULA.md'
$ReadinessScript = Join-Path -Path $PackageRoot -ChildPath 'windows/Export-PatchReadiness.ps1'
$AggregationScript = Join-Path -Path $PackageRoot -ChildPath 'tools/aggregate_operational_reports.py'
$DemoGenerateScript = Join-Path -Path $PackageRoot -ChildPath 'scripts/demo/generate-demo-scenario.mjs'
$DashboardRenderScript = Join-Path -Path $PackageRoot -ChildPath 'scripts/demo/render-demo-dashboard.mjs'
$ExecutiveExportScript = Join-Path -Path $PackageRoot -ChildPath 'scripts/demo/export-executive-demo-pack.mjs'

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

function Get-LicenseStatus {
    if (-not (Test-Path -Path $LicensePath)) {
        return 'Not installed - protected workflows require config/license.json'
    }

    try {
        $license = Get-Content -Path $LicensePath -Raw | ConvertFrom-Json
        $licensedTo = if ($license.licensedTo) { $license.licensedTo } else { 'Unknown customer' }
        $edition = if ($license.edition) { $license.edition } else { 'Unspecified edition' }
        $expiresOn = if ($license.expiresOn) { $license.expiresOn } else { 'No expiration listed' }

        return "Installed - $licensedTo / $edition / expires $expiresOn"
    }
    catch {
        return 'Present but unreadable - review config/license.json'
    }
}

function Write-MenuHeader {
    Clear-Host
    Write-Host "$ProductName - Windows Portable Launcher"
    Write-Host '======================================================'
    Write-Host ''
    Write-Host "Version : $ProductVersion"
    Write-Host "Edition : $ProductEdition"
    Write-Host "Support : $SupportEmail"
    Write-Host "License : $(Get-LicenseStatus)"
    Write-Host '© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.'
    Write-Host ''
    Write-Host "Package: $PackageRoot"
    Write-Host 'Mode: Read-only, local-only, operator-triggered visibility.'
    Write-Host 'Safety: No endpoint changes, telemetry, agents, services, or background polling.'
    Write-Host 'Legal: Use of BayouOps Suite Pro requires acceptance of the license terms and conditions.'
    Write-Host "Exports: $ExportsPath"
    Write-Host ''
}

function Write-MenuSection {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ''
    Write-Host $Title
    Write-Host ('-' * $Title.Length)
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
    Test-RequiredPath -Path $TermsDocPath -Label 'terms and conditions' | Out-Null
    Test-RequiredPath -Path $EulaDocPath -Label 'EULA' | Out-Null
    Test-RequiredPath -Path $ReadinessScript -Label 'Windows readiness exporter' | Out-Null
    Test-RequiredPath -Path $AggregationScript -Label 'aggregation engine' | Out-Null
    Test-RequiredPath -Path $DemoGenerateScript -Label 'demo generator' | Out-Null
    Test-RequiredPath -Path $DashboardRenderScript -Label 'executive dashboard renderer' | Out-Null
    Test-RequiredPath -Path $ExecutiveExportScript -Label 'executive export pack generator' | Out-Null

    if (Test-Path -Path $ConfigPath) {
        Test-RequiredPath -Path $LobConfigPath -Label 'Lines of Business config' | Out-Null
    }
    else {
        Write-Host 'Optional: config folder not present. Default demo Lines of Business will be used where applicable.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'All work is local and starts only after the operator chooses an action.'
}

function Confirm-LicenseTerms {
    Write-Host ''
    Write-Host 'License Terms Notice'
    Write-Host '--------------------'
    Write-Host 'Use of BayouOps Suite Pro requires acceptance of the license terms and conditions.'
    Write-Host 'Review the Terms / License Agreement from the launcher before running protected workflows.'
    Write-Host 'BayouOps is provided as-is. Operators are responsible for validating outputs.'
    Write-Host ''

    $confirmation = Read-Host 'Type ACCEPT to continue, or press Enter to cancel'

    if ($confirmation -ne 'ACCEPT') {
        throw 'License terms were not accepted. Workflow cancelled.'
    }
}

function Get-NodeCommand {
    $command = Get-Command -Name 'node' -ErrorAction SilentlyContinue

    if ($null -ne $command) {
        return $command.Source
    }

    return $null
}

function Invoke-NodeScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath,

        [Parameter(Mandatory = $true)]
        [string]$MissingMessage
    )

    Confirm-LicenseTerms
    Ensure-ExportsFolder

    if (-not (Test-Path -Path $ScriptPath)) {
        throw $MissingMessage
    }

    $node = Get-NodeCommand
    if (-not $node) {
        throw 'Node.js was not found. Demo generation and executive export packaging require Node.js and run locally only.'
    }

    Push-Location -Path $PackageRoot
    try {
        & $node $ScriptPath
    }
    finally {
        Pop-Location
    }
}

function Invoke-DemoGeneration {
    Invoke-NodeScript -ScriptPath $DemoGenerateScript -MissingMessage "Missing demo generator: $DemoGenerateScript"
    Write-Host ''
    Write-Host 'Next step: choose Render Executive Dashboard.'
}

function Invoke-DashboardRender {
    Invoke-NodeScript -ScriptPath $DashboardRenderScript -MissingMessage "Missing executive dashboard renderer: $DashboardRenderScript"
    Write-Host ''
    Write-Host 'Next step: choose Generate Executive Export Pack.'
}

function Invoke-ExecutiveExportPack {
    Invoke-NodeScript -ScriptPath $ExecutiveExportScript -MissingMessage "Missing executive export pack generator: $ExecutiveExportScript"
    Write-Host ''
    Write-Host "Next step: open exports under $ExportsPath."
}

function Invoke-WindowsReadinessExport {
    Confirm-LicenseTerms
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
    Confirm-LicenseTerms
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

function Open-TermsAndLicense {
    if (Test-Path -Path $TermsDocPath) {
        Open-PortablePath -Path $TermsDocPath
    }
    elseif (Test-Path -Path $EulaDocPath) {
        Open-PortablePath -Path $EulaDocPath
    }
    else {
        Write-Host ''
        Write-Host 'Terms and license documents were not found.'
        Write-Host 'Use of BayouOps Suite Pro requires acceptance of the license terms and conditions.'
    }
}

while ($true) {
    Write-MenuHeader
    Show-PreflightSummary

    Write-MenuSection -Title 'Demo And Executive Reporting'
    Write-Host '1. Generate Demo Environment'
    Write-Host '2. Render Executive Dashboard'
    Write-Host '3. Generate Executive Export Pack'

    Write-MenuSection -Title 'Operational Exports'
    Write-Host '4. Run Windows Read-Only Health Export'
    Write-Host '5. Run Aggregation Engine (requires Python 3)'

    Write-MenuSection -Title 'Review And Support'
    Write-Host '6. Open Exports Folder'
    Write-Host '7. Open Documentation'
    Write-Host '8. Open About BayouOps'
    Write-Host '9. Open Support Information'
    Write-Host '10. Open Terms / License Agreement'
    Write-Host '11. Exit'
    Write-Host ''

    $choice = Read-Host 'Select an option'

    try {
        switch ($choice) {
            '1' {
                Invoke-DemoGeneration
                Wait-ForOperator
            }
            '2' {
                Invoke-DashboardRender
                Wait-ForOperator
            }
            '3' {
                Invoke-ExecutiveExportPack
                Wait-ForOperator
            }
            '4' {
                Invoke-WindowsReadinessExport
                Wait-ForOperator
            }
            '5' {
                Invoke-AggregationEngine
                Wait-ForOperator
            }
            '6' {
                Ensure-ExportsFolder
                Open-PortablePath -Path $ExportsPath
                Wait-ForOperator
            }
            '7' {
                Open-PortablePath -Path $DocsPath
                Wait-ForOperator
            }
            '8' {
                if (Test-Path -Path $AboutDocPath) {
                    Open-PortablePath -Path $AboutDocPath
                }
                else {
                    Write-Host ''
                    Write-Host "$ProductName is a local-first, read-only operational visibility and reporting toolkit."
                    Write-Host "Support email: $SupportEmail"
                }
                Wait-ForOperator
            }
            '9' {
                if (Test-Path -Path $SupportDocPath) {
                    Open-PortablePath -Path $SupportDocPath
                }
                else {
                    Write-Host ''
                    Write-Host "Support email: $SupportEmail"
                    Write-Host 'Support phone: Coming soon'
                    Write-Host 'Website: https://bayoufinds.com'
                }
                Wait-ForOperator
            }
            '10' {
                Open-TermsAndLicense
                Wait-ForOperator
            }
            '11' {
                break
            }
            default {
                Write-Host 'Unknown option. Enter a number from 1 through 11.'
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
