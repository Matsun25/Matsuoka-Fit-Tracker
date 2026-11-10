$ErrorActionPreference = "Continue"

$ProjectFrontend = $PSScriptRoot
$LocalWorkDir = "$env:LOCALAPPDATA\fit-tracker-app"
$LocalDeps = "$env:LOCALAPPDATA\fit-tracker-deps"

Write-Host "[1/3] ソースコードをローカルビルド領域へ同期しています..." -ForegroundColor Cyan

if (-not (Test-Path $LocalWorkDir)) {
    New-Item -ItemType Directory -Force -Path $LocalWorkDir | Out-Null
}

robocopy "$ProjectFrontend" "$LocalWorkDir" /MIR /XD "node_modules" "dist" ".git" /R:1 /W:1 | Out-Null
$global:LASTEXITCODE = 0

if (-not (Test-Path "$LocalWorkDir\node_modules")) {
    cmd /c mklink /J "$LocalWorkDir\node_modules" "$LocalDeps\node_modules" | Out-Null
}

Set-Location $LocalWorkDir

Write-Host "[2/3] 本番ビルド (npm run build) を実行しています..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "ビルドに失敗しました。"
    exit 1
}

Write-Host "[3/3] Cloudflare Pages へデプロイしています..." -ForegroundColor Green
npx wrangler@3 pages deploy dist --project-name matsuoka-fit-tracker

