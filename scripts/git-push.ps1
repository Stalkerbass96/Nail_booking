# Stage modified files + bootstrap script + new .gitignore, commit, and push.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\git-push.ps1
# Log: scripts\git-push.log

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logPath = Join-Path $repoRoot "scripts\git-push.log"
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
    param([string]$Title, [string]$Command)
    Log "==== STEP: $Title ===="
    Log "CMD: $Command"
    $output = & cmd /c "$Command 2>&1"
    $exit = $LASTEXITCODE
    foreach ($line in $output) { LogRaw $line }
    Log "EXIT: $exit"
    return $exit
}

Log "Repo: $repoRoot"
Run -Title "git status (before)" -Command "git status -sb"

# 1. stage tracked changes (the modified src/* files)
Run -Title "git add (modified src + .gitignore + new bootstrap script)" `
    -Command "git add -u && git add .gitignore scripts/bootstrap-dev.ps1"

# 2. show what's actually staged
Run -Title "git diff --staged --stat" -Command "git diff --staged --stat"

# 3. commit
$msg = @"
chore: refresh booking storefront, admin shell, and dev bootstrap

- compact public site frame, gallery hero, booking form
- tighten admin login / nav / logout button
- expand globals.css with shared site/admin tokens
- add scripts/bootstrap-dev.ps1 for one-shot Windows dev bootstrap
- broaden .gitignore to exclude .next-*, dev logs, screenshots
"@
$tmp = New-TemporaryFile
[System.IO.File]::WriteAllText($tmp.FullName, $msg, [System.Text.UTF8Encoding]::new($false))
$rc = Run -Title "git commit" -Command "git commit -F `"$($tmp.FullName)`""
Remove-Item $tmp.FullName -Force -ErrorAction SilentlyContinue
if ($rc -ne 0) {
    Log "Commit failed (maybe nothing to commit). Continuing to status."
}

# 4. fetch first to detect divergence
$rc = Run -Title "git fetch origin" -Command "git fetch origin"
if ($rc -ne 0) {
    Log "Fetch failed; check network/auth."
    exit $rc
}

Run -Title "ahead/behind summary" `
    -Command "git rev-list --left-right --count origin/main...HEAD"

# 5. push
$rc = Run -Title "git push" -Command "git push origin main"
if ($rc -ne 0) {
    Log "Push failed."
    Log "If error mentions 'non-fast-forward' or 'rejected', remote has new commits."
    Log "Run:  git pull --rebase origin main   then re-run this script."
    exit $rc
}

Run -Title "git status (after)" -Command "git status -sb"
Log "==== DONE ===="
