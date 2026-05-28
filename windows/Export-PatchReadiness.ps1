<#
.SYNOPSIS
Exports a local Windows operational readiness report for BayouOps Suite Pro.

.DESCRIPTION
Collects lightweight, read-only readiness signals from the local Windows host and
writes them to exports/patch-readiness-report.csv.

The script performs no destructive actions and does not require administrative
changes. Some inventory sources may return partial data if local policy blocks
read access; those failures are captured in the Notes column.
#>

[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path -Path (Split-Path -Parent $PSScriptRoot) -ChildPath 'exports/patch-readiness-report.csv'),

    [switch]$UseSampleData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-OperatorMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [ValidateSet('INFO', 'WARN', 'ERROR')]
        [string]$Level = 'INFO'
    )

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$timestamp] [$Level] $Message"
}

function Test-IsWindowsHost {
    if ($PSVersionTable.PSEdition -eq 'Desktop') {
        return $true
    }

    return [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform(
        [System.Runtime.InteropServices.OSPlatform]::Windows
    )
}

function Get-PendingRebootStatus {
    $checks = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending',
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired',
        'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager'
    )

    $pendingReasons = New-Object System.Collections.Generic.List[string]

    foreach ($path in $checks) {
        try {
            if ($path -like '*Session Manager') {
                $sessionManager = Get-ItemProperty -Path $path -Name 'PendingFileRenameOperations' -ErrorAction SilentlyContinue
                if ($null -ne $sessionManager.PendingFileRenameOperations) {
                    $pendingReasons.Add('PendingFileRenameOperations')
                }
            }
            elseif (Test-Path -Path $path) {
                $pendingReasons.Add((Split-Path -Path $path -Leaf))
            }
        }
        catch {
            $pendingReasons.Add("UnableToRead:$path")
        }
    }

    if ($pendingReasons.Count -gt 0) {
        return [pscustomobject]@{
            IsPending = $true
            Reason    = ($pendingReasons | Sort-Object -Unique) -join '; '
        }
    }

    return [pscustomobject]@{
        IsPending = $false
        Reason    = 'None detected'
    }
}

function Get-DiskFreeSpaceSummary {
    try {
        $localDisks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType = 3' |
            Sort-Object -Property DeviceID

        if (-not $localDisks) {
            return 'No local fixed disks detected'
        }

        $summaries = foreach ($disk in $localDisks) {
            $freeGb = [math]::Round(($disk.FreeSpace / 1GB), 2)
            $sizeGb = [math]::Round(($disk.Size / 1GB), 2)
            $percentFree = if ($disk.Size -gt 0) {
                [math]::Round((($disk.FreeSpace / $disk.Size) * 100), 1)
            }
            else {
                0
            }

            "$($disk.DeviceID) $freeGb GB free of $sizeGb GB ($percentFree% free)"
        }

        return $summaries -join '; '
    }
    catch {
        return "Unavailable: $($_.Exception.Message)"
    }
}

function Get-ReadinessRecord {
    $notes = New-Object System.Collections.Generic.List[string]

    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
    }
    catch {
        $os = $null
        $notes.Add("OS inventory unavailable: $($_.Exception.Message)")
    }

    try {
        $hotfixCount = @(Get-HotFix).Count
    }
    catch {
        $hotfixCount = $null
        $notes.Add("Hotfix inventory unavailable: $($_.Exception.Message)")
    }

    try {
        $pendingReboot = Get-PendingRebootStatus
    }
    catch {
        $pendingReboot = [pscustomobject]@{
            IsPending = $null
            Reason    = "Unavailable: $($_.Exception.Message)"
        }
        $notes.Add('Reboot pending check failed')
    }

    $hostname = if ($env:COMPUTERNAME) {
        $env:COMPUTERNAME
    }
    else {
        [System.Net.Dns]::GetHostName()
    }

    [pscustomobject]@{
        Hostname            = $hostname
        LastBootTime        = if ($os) { $os.LastBootUpTime } else { $null }
        RebootPending       = $pendingReboot.IsPending
        RebootPendingReason = $pendingReboot.Reason
        InstalledHotfixCount = $hotfixCount
        DiskFreeSpace       = Get-DiskFreeSpaceSummary
        OSCaption           = if ($os) { $os.Caption } else { $null }
        OSVersion           = if ($os) { $os.Version } else { $null }
        CollectedAt         = (Get-Date).ToString('s')
        Notes               = if ($notes.Count -gt 0) { $notes -join '; ' } else { 'OK' }
    }
}

function Get-SampleReadinessRecord {
    [pscustomobject]@{
        Hostname             = 'BAYOUOPS-WIN01'
        LastBootTime         = (Get-Date).AddDays(-9).ToString('s')
        RebootPending        = $true
        RebootPendingReason  = 'RebootRequired'
        InstalledHotfixCount = 186
        DiskFreeSpace        = 'C: 84.32 GB free of 237.41 GB (35.5% free); D: 412.8 GB free of 931.5 GB (44.3% free)'
        OSCaption            = 'Microsoft Windows 11 Pro'
        OSVersion            = '10.0.22631'
        CollectedAt          = (Get-Date).ToString('s')
        Notes                = 'Sample validation record'
    }
}

try {
    Write-OperatorMessage -Message 'Starting BayouOps Windows operational readiness export.'

    $outputDirectory = Split-Path -Parent $OutputPath
    if (-not (Test-Path -Path $outputDirectory)) {
        New-Item -Path $outputDirectory -ItemType Directory -Force | Out-Null
        Write-OperatorMessage -Message "Created export directory: $outputDirectory"
    }

    $record = if ($UseSampleData) {
        Write-OperatorMessage -Message 'Using sample readiness data for validation.'
        Get-SampleReadinessRecord
    }
    else {
        if (-not (Test-IsWindowsHost)) {
            throw 'This collector must be run on Windows. Use -UseSampleData only for export validation on non-Windows systems.'
        }

        Get-ReadinessRecord
    }

    $record | Export-Csv -Path $OutputPath -NoTypeInformation -Encoding UTF8

    Write-OperatorMessage -Message "Readiness export complete: $OutputPath"
    Write-OperatorMessage -Message "Host: $($record.Hostname); Reboot pending: $($record.RebootPending); Hotfixes: $($record.InstalledHotfixCount)"
}
catch {
    Write-OperatorMessage -Message "Readiness export failed: $($_.Exception.Message)" -Level 'ERROR'
    exit 1
}
