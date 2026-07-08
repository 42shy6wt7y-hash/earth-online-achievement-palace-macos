param(
  [string]$NodeVersion = "v24.17.0"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$tempRoot = Join-Path $env:TEMP "eoap-macos-build"
$payload = Join-Path $tempRoot "payload"
$appName = "地球online成就殿堂.app"
$executableName = "EarthOnlineAchievementPalace"
$appRoot = Join-Path $payload $appName
$contents = Join-Path $appRoot "Contents"
$macos = Join-Path $contents "MacOS"
$resources = Join-Path $contents "Resources"
$runtime = Join-Path $resources "runtime"
$tarArchiveName = "EarthOnlineAchievementPalace-macOS-universal.tar.gz"
$tarArchivePath = Join-Path $dist $tarArchiveName

Remove-Item -Recurse -Force $dist, $payload -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $dist, $tempRoot, $macos, $resources, $runtime | Out-Null

function Write-Utf8NoBomLf([string]$Path, [string[]]$Lines) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, ($Lines -join "`n") + "`n", $encoding)
}

function Normalize-Utf8NoBomLf([string]$Path) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  $content = [System.IO.File]::ReadAllText($Path)
  $content = $content.TrimStart([char]0xFEFF).Replace("`r`n", "`n").Replace("`r", "`n")
  [System.IO.File]::WriteAllText($Path, $content, $encoding)
}

function Add-NodeRuntime([string]$Arch) {
  $nodeArchive = "node-$NodeVersion-darwin-$Arch.tar.gz"
  $nodeUrl = "https://nodejs.org/dist/$NodeVersion/$nodeArchive"
  $nodeDownload = Join-Path $tempRoot $nodeArchive
  $nodeExtract = Join-Path $tempRoot "node-$Arch"
  Remove-Item -Recurse -Force $nodeExtract -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $nodeExtract | Out-Null

  if (Test-Path -LiteralPath $nodeDownload) {
    Write-Host "Using cached $nodeArchive"
  } else {
    Write-Host "Downloading $nodeUrl"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeDownload
  }
  $nodeDirName = "node-$NodeVersion-darwin-$Arch"
  & tar -xzf $nodeDownload -C $nodeExtract "$nodeDirName/bin/node" "$nodeDirName/LICENSE"
  if ($LASTEXITCODE -ne 0) {
    throw "Node runtime extraction failed for $Arch with exit code $LASTEXITCODE."
  }

  $nodeDir = Get-ChildItem -LiteralPath $nodeExtract -Directory | Select-Object -First 1
  if (-not $nodeDir) {
    throw "Node runtime extraction failed for $Arch."
  }

  $target = Join-Path $runtime "node-darwin-$Arch"
  New-Item -ItemType Directory -Force -Path (Join-Path $target "bin") | Out-Null
  Copy-Item -LiteralPath (Join-Path $nodeDir.FullName "bin\node") -Destination (Join-Path $target "bin\node")
  Copy-Item -LiteralPath (Join-Path $nodeDir.FullName "LICENSE") -Destination (Join-Path $target "LICENSE")
}

Add-NodeRuntime "arm64"
Add-NodeRuntime "x64"

Copy-Item -LiteralPath (Join-Path $root "server.js") -Destination $resources
Copy-Item -LiteralPath (Join-Path $root "README.md") -Destination $resources
Copy-Item -LiteralPath (Join-Path $root "public") -Destination $resources -Recurse
Copy-Item -LiteralPath (Join-Path $root "launch-earth-online-achievement-palace.command") -Destination $resources
Normalize-Utf8NoBomLf (Join-Path $resources "launch-earth-online-achievement-palace.command")

Write-Utf8NoBomLf (Join-Path $macos $executableName) @(
  '#!/bin/bash'
  'set -euo pipefail'
  'SCRIPT_DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"'
  'exec "$SCRIPT_DIR/launch-earth-online-achievement-palace.command"'
)

Write-Utf8NoBomLf (Join-Path $contents "Info.plist") @(
  '<?xml version="1.0" encoding="UTF-8"?>'
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
  '<plist version="1.0">'
  '<dict>'
  '  <key>CFBundleDevelopmentRegion</key><string>zh_CN</string>'
  '  <key>CFBundleDisplayName</key><string>地球online成就殿堂</string>'
  "  <key>CFBundleExecutable</key><string>$executableName</string>"
  '  <key>CFBundleIdentifier</key><string>com.earthonline.achievementpalace.macos</string>'
  '  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>'
  '  <key>CFBundleName</key><string>地球online成就殿堂</string>'
  '  <key>CFBundlePackageType</key><string>APPL</string>'
  '  <key>CFBundleShortVersionString</key><string>0.2.6</string>'
  '  <key>CFBundleVersion</key><string>0.2.6</string>'
  '  <key>LSMinimumSystemVersion</key><string>11.0</string>'
  '  <key>NSHighResolutionCapable</key><true/>'
  '</dict>'
  '</plist>'
)

Write-Utf8NoBomLf (Join-Path $payload "README-macOS.txt") @(
  '地球online成就殿堂 macOS 通用版'
  ''
  '使用方式：'
  '1. 打开 Finder，左边点“下载”。'
  '2. 双击 EarthOnlineAchievementPalace-macOS-universal.tar.gz，旁边会解压出“地球online成就殿堂.app”。'
  '3. 可以直接双击“地球online成就殿堂.app”使用。'
  '4. 想以后更方便，就把“地球online成就殿堂.app”从“下载”拖到 Finder 左边的“应用程序”。'
  '5. 以后可以从“应用程序”或 Launchpad 打开。'
  ''
  '第一次打不开怎么办：'
  '如果 macOS 提示来自未认证开发者，请在 Finder 里右键“地球online成就殿堂.app”，选择“打开”，再确认打开。'
  ''
  '备用启动：'
  '如果 App 图标仍然打不开，请双击同一目录里的 Start-EarthOnlineAchievementPalace.command。它会打开一个终端窗口并启动同一个本地应用。'
  ''
  '说明：'
  '- 这是未签名、未公证的本地离线版。'
  '- 成就档案保存在 ~/Library/Application Support/EarthOnlineAchievementPalaceMac/achievement-archive。'
  '- 本地服务使用 3417..3499 端口段。'
  '- 包内自带 macOS arm64 和 x64 Node.js 运行时，适合 Apple Silicon 和 Intel Mac。'
)

Write-Utf8NoBomLf (Join-Path $payload "Start-EarthOnlineAchievementPalace.command") @(
  '#!/bin/bash'
  'set -euo pipefail'
  'BASE_DIR="$(cd "$(dirname "$0")" && pwd)"'
  'exec "$BASE_DIR/地球online成就殿堂.app/Contents/Resources/launch-earth-online-achievement-palace.command"'
)

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
$python = if ($pythonCommand) { $pythonCommand.Source } else { $null }
if (-not $python) {
  $pyCommand = Get-Command py -ErrorAction SilentlyContinue
  $python = if ($pyCommand) { $pyCommand.Source } else { $null }
}
if (-not $python) {
  throw "Cannot find Python to create a macOS permission-preserving tar.gz."
}

& $python (Join-Path $PSScriptRoot "pack_macos_tar.py") $payload $tarArchivePath
if (-not (Test-Path -LiteralPath $tarArchivePath)) {
  throw "macOS tar archive was not created: $tarArchivePath"
}

Write-Host "Created $tarArchivePath"

