$ErrorActionPreference = "Continue"

$ProjectFrontend = $PSScriptRoot
$LocalWorkDir = "$env:LOCALAPPDATA\fit-tracker-app"
$LocalDeps = "$env:LOCALAPPDATA\fit-tracker-deps"

Write-Host "[*] Syncing source files to local workspace..." -ForegroundColor Cyan

# ローカル作業ディレクトリの準備
if (-not (Test-Path $LocalWorkDir)) {
    New-Item -ItemType Directory -Force -Path $LocalWorkDir | Out-Null
}

# ソースコードを同期（robocopy の終了コード 0〜7 は正常終了のため $LASTEXITCODE をリセット）
robocopy "$ProjectFrontend" "$LocalWorkDir" /MIR /XD "node_modules" "dist" ".git" /R:1 /W:1 | Out-Null
$global:LASTEXITCODE = 0

# node_modules のジャンクション確認・作成
if (-not (Test-Path "$LocalWorkDir\node_modules")) {
    cmd /c mklink /J "$LocalWorkDir\node_modules" "$LocalDeps\node_modules" | Out-Null
}

Write-Host "[*] Starting Vite dev server on http://localhost:5173 ..." -ForegroundColor Green

Set-Location $LocalWorkDir
& "$LocalWorkDir\node_modules\.bin\vite.cmd" --host 127.0.0.1 --port 5173
