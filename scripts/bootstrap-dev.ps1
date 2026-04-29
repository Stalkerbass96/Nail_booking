# Bootstrap dev environment and capture output for Claude.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\bootstrap-dev.ps1
# Log file: scripts\bootstrap-dev.log (ASCII)

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logPath = Join-Path $repoRoot "scripts\bootstrap-dev.log"
[System.IO.File]::WriteAllText($logPath, "")

function Log {
    param([string]$Message)
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$stamp] $Message"
    Write-Host $line
    [System.IO.File]::AppendAllText($logPath, $line + "`r`n", [System.Text.Encoding]::UTF8)
}

function LogRaw {
    param([string]$Message)
    Write-Host $Message
    [System.IO.File]::AppendAllText($logPath, $Message + "`r`n", [System.Text.Encoding]::UTF8)
}

function Run {
    param(
        [string]$Title,
        [string]$Command
    )
    Log "==== STEP: $Title ===="
    Log "CMD: $Command"
    $output = & cmd /c "$Command 2>&1"
    $exit = $LASTEXITCODE
    foreach ($line in $output) { LogRaw $line }
    Log "EXIT: $exit"
    return $exit
}

Log "Repo root: $repoRoot"
Log "Node: $(node -v 2>&1)"
Log "npm:  $(npm -v 2>&1)"
Log "docker: $(docker --version 2>&1)"

# 0. Kill suspicious processes that may hold .node files in node_modules
Log "==== STEP: kill stale node/next processes ===="
$names = @("node", "next-router-worker", "next-render-worker")
foreach ($n in $names) {
    Get-Process -Name $n -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Log ("  killing PID {0} ({1})" -f $_.Id, $_.ProcessName)
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
        } catch {
            Log ("  failed to kill PID {0}: {1}" -f $_.Id, $_.Exception.Message)
        }
    }
}
Start-Sleep -Seconds 2

# 1. docker ps
Run -Title "docker ps" -Command "docker ps --format ""table {{.Names}}\t{{.Status}}\t{{.Ports}}"""
Run -Title "docker compose up -d" -Command "docker compose up -d"
Start-Sleep -Seconds 3

# 2. clean node_modules with retries (Windows file locks)
if (Test-Path "node_modules") {
    Log "Removing existing node_modules ..."
    $tries = 0
    while ((Test-Path "node_modules") -and ($tries -lt 4)) {
        $tries++
        try {
            Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        } catch {
            Log ("  Remove-Item attempt {0} failed: {1}" -f $tries, $_.Exception.Message)
            Start-Sleep -Seconds 2
        }
    }
    if (Test-Path "node_modules") {
        Log "node_modules still present; trying rename + delete trick ..."
        $stash = "node_modules.stale.$(Get-Random)"
        try {
            Rename-Item "node_modules" $stash -ErrorAction Stop
            Start-Job -ScriptBlock { param($p) Remove-Item -Recurse -Force $p } -ArgumentList (Join-Path $repoRoot $stash) | Out-Null
            Log "  renamed to $stash and queued background delete"
        } catch {
            Log ("  rename failed: {0}" -f $_.Exception.Message)
            Log "Please close VS Code / dev server and re-run this script."
            exit 1
        }
    }
}

# 3. install
$installCmd = if (Test-Path "package-lock.json") { "npm ci" } else { "npm install" }
$rc = Run -Title "install dependencies" -Command $installCmd
if ($rc -ne 0) {
    Log "Install failed; aborting."
    exit $rc
}

# 4. prisma migrate + generate + seed
$rc = Run -Title "prisma migrate deploy" -Command "npm run prisma:migrate:deploy"
if ($rc -ne 0) { Log "migrate failed"; exit $rc }

$rc = Run -Title "prisma generate" -Command "npm run prisma:generate"
if ($rc -ne 0) { Log "generate failed"; exit $rc }

$rc = Run -Title "db seed" -Command "npm run db:seed"
if ($rc -ne 0) { Log "seed failed"; exit $rc }

Log "==== DONE ===="
Log "Now run:  npm run dev"
Log "Log saved to: $logPath"
