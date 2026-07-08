# 地球online成就殿堂 macOS 版

一个本地离线的黑金 Steam 风人生成就殿堂，内置 36 个默认人生梗系成就，并带有“给玩家的一封信”。

## 普通用户

下载发布页里的 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`，解压后得到：

```text
地球online成就殿堂.app
```

可以直接双击打开，也可以拖到“应用程序”文件夹。

因为这一版是在 Windows 环境里构建的未签名、未公证版本，macOS 首次打开时可能提示来自未认证开发者。遇到这种提示时，在 Finder 中右键 `地球online成就殿堂.app`，选择“打开”，再确认打开即可。

应用会在本机启动一个只监听 `127.0.0.1` 的本地服务，然后用默认浏览器打开页面。不需要联网，不需要服务器。

## 本地档案

用户成就档案默认保存在：

```text
~/Library/Application Support/EarthOnlineAchievementPalaceMac/achievement-archive
```

界面里的删除只是写入删除事件，不会移除旧文件。

## 版本隔离

这个 macOS 版使用独立仓库、独立数据目录、独立本地端口段：

```text
3417..3499
```

它不影响 Windows 第一版，也不影响 Windows 第二版。

## 开发启动

运行本地网页服务：

```bash
npm start
```

然后打开：

```text
http://localhost:3417
```

开发模式的数据保存在项目里的 `achievement-archive/`。

## 打包 macOS 版本

在 Windows 环境中运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-macos-app.ps1
```

产物会生成在：

```text
dist/EarthOnlineAchievementPalace-macOS-universal.tar.gz
```

该包内置 macOS arm64 和 x64 两套 Node.js 运行时，适合 Apple Silicon 和 Intel Mac。
