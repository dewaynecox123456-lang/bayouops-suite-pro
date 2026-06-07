param(
    [Parameter(Mandatory=$true)]
    [string]$TargetsCsv,

    [string]$OutputDir = ".\exports",

    [switch]$SkipPing
)

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$targets = Import-Csv $TargetsCsv
$results = @()

foreach ($target in $targets) {
    $computer = $target.ComputerName
    Write-Host "Collecting from $computer..."

    $online = $true
    if (-not $SkipPing) {
        $online = Test-Connection -ComputerName $computer -Count 1 -Quiet -ErrorAction SilentlyContinue
    }

    if (-not $online) {
        $results += [pscustomobject]@{
            ComputerName = $computer
            Online = $false
            Status = "Ping failed"
            OS = ""
            OSVersion = ""
            LastBoot = ""
            RebootRequired = ""
            HotFixCount = ""
            CollectedAt = (Get-Date).ToString("s")
        }
        continue
    }

    try {
        $data = Invoke-Command -ComputerName $computer -ScriptBlock {
            $os = Get-CimInstance Win32_OperatingSystem
            $hotfixes = Get-HotFix -ErrorAction SilentlyContinue

            $rebootRequired = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending" -PathType Container

            [pscustomobject]@{
                ComputerName = $env:COMPUTERNAME
                Online = $true
                Status = "Collected"
                OS = $os.Caption
                OSVersion = $os.Version
                LastBoot = $os.LastBootUpTime
                RebootRequired = $rebootRequired
                HotFixCount = @($hotfixes).Count
                CollectedAt = (Get-Date).ToString("s")
            }
        } -ErrorAction Stop

        $results += $data
    }
    catch {
        $results += [pscustomobject]@{
            ComputerName = $computer
            Online = $true
            Status = "Collection failed: $($_.Exception.Message)"
            OS = ""
            OSVersion = ""
            LastBoot = ""
            RebootRequired = ""
            HotFixCount = ""
            CollectedAt = (Get-Date).ToString("s")
        }
    }
}

$csvPath = Join-Path $OutputDir "bayouops-network-inventory.csv"
$jsonPath = Join-Path $OutputDir "bayouops-network-inventory.json"

$results | Export-Csv -NoTypeInformation -Path $csvPath
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 $jsonPath

Write-Host "Done."
Write-Host "CSV: $csvPath"
Write-Host "JSON: $jsonPath"
