<#
.SYNOPSIS
Collects read-only Windows patch inventory for BayouOps visibility and reporting.

.DESCRIPTION
Get-BayouOpsPatchInventory collects installed Windows hotfix evidence using
Get-HotFix and Get-CimInstance Win32_QuickFixEngineering. It exports local patch
inventory records for BayouOps Patch / KB Visibility workflows.

This collector is read-only. It does not deploy patches, trigger Windows Update,
remediate systems, reboot systems, perform remote execution, or modify registry
values.

.PARAMETER OutputJson
Optional path for a UTF-8 JSON export.

.PARAMETER OutputCsv
Optional path for a UTF-8 CSV export.

.EXAMPLE
.\Get-BayouOpsPatchInventory.ps1 -OutputJson .\patch-inventory.json

.EXAMPLE
.\Get-BayouOpsPatchInventory.ps1 -OutputCsv .\patch-inventory.csv

.EXAMPLE
.\Get-BayouOpsPatchInventory.ps1 -OutputJson .\patch-inventory.json -OutputCsv .\patch-inventory.csv
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$OutputJson,

    [Parameter(Mandatory = $false)]
    [string]$OutputCsv
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

function Resolve-OutputFilePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $pathExecutionContext = $ExecutionContext.SessionState.Path
    $resolvedProviderPath = $pathExecutionContext.GetUnresolvedProviderPathFromPSPath($Path)
    $parent = Split-Path -Path $resolvedProviderPath -Parent

    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -Path $parent -ItemType Directory -Force | Out-Null
    }

    return $resolvedProviderPath
}

function Write-Utf8TextFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $resolvedPath = Resolve-OutputFilePath -Path $Path
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($resolvedPath, $Content, $utf8NoBom)
    Write-Verbose "Wrote $resolvedPath"
}

function Get-ObjectPropertyValue {
    param(
        [Parameter(Mandatory = $true)]
        $InputObject,

        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $property = $InputObject.PSObject.Properties[$Name]

    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Convert-DateValue {
    param(
        [Parameter(Mandatory = $false)]
        $Value
    )

    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return $null
    }

    try {
        return ([datetime]$Value).ToString("yyyy-MM-dd")
    }
    catch {
        return [string]$Value
    }
}

function Test-PendingReboot {
    $paths = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending',
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired',
        'HKLM:\SOFTWARE\Microsoft\Updates\UpdateExeVolatile'
    )

    foreach ($path in $paths) {
        try {
            if (Test-Path -LiteralPath $path) {
                return $true
            }
        }
        catch {
            Write-Verbose ("Unable to read pending reboot path '{0}': {1}" -f $path, $_.Exception.Message)
        }
    }

    try {
        $sessionManager = Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager' -Name PendingFileRenameOperations -ErrorAction SilentlyContinue
        if ($null -ne $sessionManager -and $null -ne $sessionManager.PendingFileRenameOperations) {
            return $true
        }
    }
    catch {
        Write-Verbose ("Unable to read PendingFileRenameOperations: {0}" -f $_.Exception.Message)
    }

    return $false
}

function Get-ComputerName {
    if (-not [string]::IsNullOrWhiteSpace($env:COMPUTERNAME)) {
        return $env:COMPUTERNAME
    }

    return [System.Net.Dns]::GetHostName()
}

$computerName = Get-ComputerName
$collectedAt = (Get-Date).ToUniversalTime().ToString("o")
$pendingReboot = Test-PendingReboot

try {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
}
catch {
    Write-Warning ("Unable to read Win32_OperatingSystem: {0}" -f $_.Exception.Message)
    $os = $null
}

$osCaption = if ($null -ne $os) { Get-ObjectPropertyValue -InputObject $os -Name 'Caption' } else { $null }
$lastBootUpTime = if ($null -ne $os) { Get-ObjectPropertyValue -InputObject $os -Name 'LastBootUpTime' } else { $null }

if ($null -ne $lastBootUpTime -and $lastBootUpTime -is [datetime]) {
    $lastBootUpTime = $lastBootUpTime.ToUniversalTime().ToString("o")
}

$hotfixRecords = @()

try {
    $hotfixRecords += Get-HotFix -ErrorAction Stop
}
catch {
    Write-Warning ("Get-HotFix failed: {0}" -f $_.Exception.Message)
}

try {
    $hotfixRecords += Get-CimInstance -ClassName Win32_QuickFixEngineering -ErrorAction Stop
}
catch {
    Write-Warning ("Get-CimInstance Win32_QuickFixEngineering failed: {0}" -f $_.Exception.Message)
}

$deduped = New-Object 'System.Collections.Generic.Dictionary[string,object]'

foreach ($record in $hotfixRecords) {
    $hotFixId = [string](Get-ObjectPropertyValue -InputObject $record -Name 'HotFixID')

    if ([string]::IsNullOrWhiteSpace($hotFixId)) {
        continue
    }

    $installedOn = Convert-DateValue -Value (Get-ObjectPropertyValue -InputObject $record -Name 'InstalledOn')
    $key = "{0}|{1}" -f $hotFixId.Trim().ToUpperInvariant(), $installedOn

    if (-not $deduped.ContainsKey($key)) {
        $deduped[$key] = [PSCustomObject]@{
            ComputerName   = $computerName
            HotFixID       = $hotFixId.Trim().ToUpperInvariant()
            InstalledOn    = $installedOn
            Description    = Get-ObjectPropertyValue -InputObject $record -Name 'Description'
            InstalledBy    = Get-ObjectPropertyValue -InputObject $record -Name 'InstalledBy'
            OSCaption      = $osCaption
            LastBootUpTime = $lastBootUpTime
            PendingReboot  = $pendingReboot
            CollectedAt    = $collectedAt
        }
    }
}

$results = @($deduped.Values | Sort-Object -Property HotFixID, InstalledOn)

if ($OutputJson) {
    $json = ConvertTo-Json -InputObject $results -Depth 4
    Write-Utf8TextFile -Path $OutputJson -Content $json
}

if ($OutputCsv) {
    $columns = @(
        'ComputerName',
        'HotFixID',
        'InstalledOn',
        'Description',
        'InstalledBy',
        'OSCaption',
        'LastBootUpTime',
        'PendingReboot',
        'CollectedAt'
    )

    if ($results.Count -gt 0) {
        $csv = $results | Select-Object -Property $columns | ConvertTo-Csv -NoTypeInformation
    }
    else {
        $csv = '"' + ($columns -join '","') + '"'
    }

    Write-Utf8TextFile -Path $OutputCsv -Content ($csv -join [Environment]::NewLine)
}

$results
