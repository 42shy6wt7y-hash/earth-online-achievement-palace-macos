param(
  [string]$NodeVersion = "v24.17.0"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$tempRoot = Join-Path $env:TEMP "eoap-macos-build"
$payload = Join-Path $tempRoot "payload"
$appName = "地球online成就殿堂.app"
$appRoot = Join-Path $payload $appName
$contents = Join-Path $appRoot "Contents"
$macos = Join-Path $contents "MacOS"
$resources = Join-Path $contents "Resources"
$runtime = Join-Path $resources "runtime"
$tarArchiveName = "EarthOnlineAchievementPalace-macOS-universal.tar.gz"
$tarArchivePath = Join-Path $dist $tarArchiveName
$zipArchiveName = "EarthOnlineAchievementPalace-macOS-universal.zip"
$zipArchivePath = Join-Path $dist $zipArchiveName

Remove-Item -Recurse -Force $dist, $payload -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $dist, $tempRoot, $macos, $resources, $runtime | Out-Null

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

$mainExecutable = @(
  '#!/bin/bash'
  'set -euo pipefail'
  'SCRIPT_DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"'
  'exec "$SCRIPT_DIR/launch-earth-online-achievement-palace.command"'
) -join [Environment]::NewLine
Set-Content -LiteralPath (Join-Path $macos "地球online成就殿堂") -Value $mainExecutable -Encoding UTF8

$plist = @(
  '<?xml version="1.0" encoding="UTF-8"?>'
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
  '<plist version="1.0">'
  '<dict>'
  '  <key>CFBundleDevelopmentRegion</key><string>zh_CN</string>'
  '  <key>CFBundleDisplayName</key><string>地球online成就殿堂</string>'
  '  <key>CFBundleExecutable</key><string>地球online成就殿堂</string>'
  '  <key>CFBundleIdentifier</key><string>com.earthonline.achievementpalace.macos</string>'
  '  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>'
  '  <key>CFBundleName</key><string>地球online成就殿堂</string>'
  '  <key>CFBundlePackageType</key><string>APPL</string>'
  '  <key>CFBundleShortVersionString</key><string>0.2.4</string>'
  '  <key>CFBundleVersion</key><string>0.2.4</string>'
  '  <key>LSMinimumSystemVersion</key><string>11.0</string>'
  '  <key>NSHighResolutionCapable</key><true/>'
  '</dict>'
  '</plist>'
) -join [Environment]::NewLine
Set-Content -LiteralPath (Join-Path $contents "Info.plist") -Value $plist -Encoding UTF8

$readme = @(
  '地球online成就殿堂 macOS 通用版'
  ''
  '使用方式：'
  '1. 解压 zip。'
  '2. 把“地球online成就殿堂.app”拖到“应用程序”文件夹，或直接双击打开。'
  '3. 如果 macOS 提示来自未认证开发者，请在 Finder 中右键 App，选择“打开”，再确认打开。'
  ''
  '说明：'
  '- 这是未签名、未公证的本地离线版。'
  '- 成就档案保存在 ~/Library/Application Support/EarthOnlineAchievementPalaceMac/achievement-archive。'
  '- 本地服务使用 3417..3499 端口段。'
  '- 包内自带 macOS arm64 和 x64 Node.js 运行时，适合 Apple Silicon 和 Intel Mac。'
) -join [Environment]::NewLine
Set-Content -LiteralPath (Join-Path $payload "README-macOS.txt") -Value $readme -Encoding UTF8

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

& $python (Join-Path $PSScriptRoot "pack_macos_zip.py") $payload $zipArchivePath
if (-not (Test-Path -LiteralPath $zipArchivePath)) {
  throw "macOS zip archive was not created: $zipArchivePath"
}

Write-Host "Created $tarArchivePath"
Write-Host "Created $zipArchivePath"

