# One-shot cleanup before migrating to Claude Code.
# Removes ~636 MB of stale build artifacts, dev logs, screenshots,
# and the helper scripts from the previous Cowork session.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\cleanup-workspace.ps1

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Step($name) { Write-Host ""; Write-Host "==> $name" -ForegroundColor Cyan }
function RemoveItemSafe($path) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force -LiteralPath $path -ErrorAction Stop
            Write-Host "  removed: $path"
        } catch {
            Write-Host "  FAILED:  $path -> $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Step "1. Stray .next-* build outputs"
@(
    ".next-brand-build",
    ".next-line-mobile-build",
    ".next-line-mobile-dev",
    ".next-tsuzuri-build",
    ".next-ui-build",
    ".next-ui-check",
    ".next-verify-build",
    ".next-verify-e2e"
) | ForEach-Object { RemoveItemSafe $_ }

Step "2. Old dev / ui-check log files"
Get-ChildItem -File -Filter "dev-*.log"     -ErrorAction SilentlyContinue | ForEach-Object { RemoveItemSafe $_.FullName }
Get-ChildItem -File -Filter "dev-*.err.log" -ErrorAction SilentlyContinue | ForEach-Object { RemoveItemSafe $_.FullName }

Step "3. Screenshot artifacts at repo root"
Get-ChildItem -File -Filter "*.png" -ErrorAction SilentlyContinue | ForEach-Object { RemoveItemSafe $_.FullName }

Step "4. TypeScript incremental cache"
RemoveItemSafe "tsconfig.tsbuildinfo"

Step "5. Helper scripts and logs from the previous Cowork session"
RemoveItemSafe "scripts\bootstrap-dev.ps1"
RemoveItemSafe "scripts\bootstrap-dev.log"
RemoveItemSafe "scripts\git-push.ps1"
RemoveItemSafe "scripts\git-push.log"

Step "6. Final state"
Write-Host ""
git status -sb
Write-Host ""
$bytes = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\\.git\\" -and $_.FullName -notmatch "\\\.next\\" } | Measure-Object Length -Sum).Sum
$mb = [math]::Round($bytes / 1MB, 1)
Write-Host "Repo content size (excluding node_modules/.git/.next): $mb MB"

Step "7. Self-delete this cleanup script"
$self = $MyInvocation.MyCommand.Path
Write-Host "Cleanup complete. This script ($self) will now delete itself."
# Schedule a delayed self-delete so the running file isn't held open
Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c timeout /t 2 /nobreak >nul & del /f /q `"$self`""
