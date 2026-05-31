<#
.SYNOPSIS
Collects read-only Windows software inventory from uninstall registry keys.

.DESCRIPTION
Get-BayouOpsSoftwareInventory reads standard Windows uninstall registry locations
and returns software inventory records for BayouOps visibility and reporting.

This collector is read-only. It does not uninstall software, modify registry
values, deploy software, run remediation, or require external dependencies.

.PARAMETER OutputJson
Optional path for a UTF-8 JSON export.

.PARAMETER OutputCsv
Optional path for a UTF-8 CSV export.

.PARAMETER IncludeEmptyNames
Include registry entries where DisplayName is empty. By default, those entries
are filtered out to reduce noise.

.EXAMPLE
.\Get-BayouOpsSoftwareInventory.ps1 -OutputJson .\software-inventory.json

.EXAMPLE
.\Get-BayouOpsSoftwareInventory.ps1 -OutputCsv .\software-inventory.csv

.EXAMPLE
.\Get-BayouOpsSoftwareInventory.ps1 -OutputJson .\software-inventory.json -OutputCsv .\software-inventory.csv
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$OutputJson,

    [Parameter(Mandatory = $false)]
    [string]$OutputCsv,

    [Parameter(Mandatory = $false)]
    [switch]$IncludeEmptyNames
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

function Convert-RegistryProviderPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $converted = $Path
    $converted = $converted -replace '^Microsoft\.PowerShell\.Core\\Registry::HKEY_LOCAL_MACHINE', 'HKLM:'
    $converted = $converted -replace '^Microsoft\.PowerShell\.Core\\Registry::HKEY_CURRENT_USER', 'HKCU:'
    return $converted
}

function Get-RegistryHiveName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ($Path -like 'HKLM:\*' -or $Path -like 'Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE*') {
        return 'HKLM'
    }

    if ($Path -like 'HKCU:\*' -or $Path -like 'Microsoft.PowerShell.Core\Registry::HKEY_CURRENT_USER*') {
        return 'HKCU'
    }

    return 'Unknown'
}

function Convert-EstimatedSize {
    param(
        [Parameter(Mandatory = $false)]
        $Value
    )

    if ($null -eq $Value -or $Value -eq '') {
        return $null
    }

    try {
        return [int64]$Value
    }
    catch {
        return $Value
    }
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

$collectedAt = (Get-Date).ToUniversalTime().ToString("o")
$computerName = $env:COMPUTERNAME

if ([string]::IsNullOrWhiteSpace($computerName)) {
    $computerName = [System.Net.Dns]::GetHostName()
}

$registryRoots = @(
    [PSCustomObject]@{
        RootPath = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
        QueryPath = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
    },
    [PSCustomObject]@{
        RootPath = 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
        QueryPath = 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    },
    [PSCustomObject]@{
        RootPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
        QueryPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
    }
)

$exportColumns = @(
    'ComputerName',
    'CollectedAt',
    'DisplayName',
    'DisplayVersion',
    'Publisher',
    'InstallDate',
    'InstallLocation',
    'InstallSource',
    'UninstallString',
    'QuietUninstallString',
    'ModifyPath',
    'EstimatedSize',
    'RegistryHive',
    'RegistryPath'
)

$inventory = New-Object System.Collections.Generic.List[object]

foreach ($root in $registryRoots) {
    try {
        if (-not (Test-Path -LiteralPath $root.RootPath -ErrorAction Stop)) {
            Write-Verbose ("Registry path '{0}' does not exist. Skipping." -f $root.RootPath)
            continue
        }

        $items = Get-ItemProperty -Path $root.QueryPath -ErrorAction Stop
    }
    catch {
        Write-Warning ("Unable to read registry path '{0}': {1}" -f $root.RootPath, $_.Exception.Message)
        continue
    }

    foreach ($item in $items) {
        $displayName = Get-ObjectPropertyValue -InputObject $item -Name 'DisplayName'

        if (-not $IncludeEmptyNames -and [string]::IsNullOrWhiteSpace([string]$displayName)) {
            continue
        }

        $registryPath = Convert-RegistryProviderPath -Path ([string](Get-ObjectPropertyValue -InputObject $item -Name 'PSPath'))

        $record = [PSCustomObject]@{
            ComputerName         = $computerName
            CollectedAt          = $collectedAt
            DisplayName          = $displayName
            DisplayVersion       = Get-ObjectPropertyValue -InputObject $item -Name 'DisplayVersion'
            Publisher            = Get-ObjectPropertyValue -InputObject $item -Name 'Publisher'
            InstallDate          = Get-ObjectPropertyValue -InputObject $item -Name 'InstallDate'
            InstallLocation      = Get-ObjectPropertyValue -InputObject $item -Name 'InstallLocation'
            InstallSource        = Get-ObjectPropertyValue -InputObject $item -Name 'InstallSource'
            UninstallString      = Get-ObjectPropertyValue -InputObject $item -Name 'UninstallString'
            QuietUninstallString = Get-ObjectPropertyValue -InputObject $item -Name 'QuietUninstallString'
            ModifyPath           = Get-ObjectPropertyValue -InputObject $item -Name 'ModifyPath'
            EstimatedSize        = Convert-EstimatedSize -Value (Get-ObjectPropertyValue -InputObject $item -Name 'EstimatedSize')
            RegistryHive         = Get-RegistryHiveName -Path $registryPath
            RegistryPath         = $registryPath
        }

        $inventory.Add($record) | Out-Null
    }
}

$results = @($inventory.ToArray() | Sort-Object -Property DisplayName, DisplayVersion, Publisher, RegistryPath)

if ($OutputJson) {
    $json = ConvertTo-Json -InputObject $results -Depth 4
    Write-Utf8TextFile -Path $OutputJson -Content $json
}

if ($OutputCsv) {
    if ($results.Count -gt 0) {
        $csv = $results | Select-Object -Property $exportColumns | ConvertTo-Csv -NoTypeInformation
    }
    else {
        $csv = '"' + ($exportColumns -join '","') + '"'
    }

    Write-Utf8TextFile -Path $OutputCsv -Content ($csv -join [Environment]::NewLine)
}

$results
