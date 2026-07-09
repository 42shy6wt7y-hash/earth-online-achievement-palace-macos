# 地球online成就殿堂 macOS 版

一个本地离线的黑金 Steam 风人生成就殿堂，内置 48 个默认人生梗系成就，并带有“给玩家的一封信”。macOS 版下载 `.tar.gz` 后，在“访达 - 下载”里双击解压，再按下面步骤首次打开。

## 普通用户

下载发布页里的 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`。

### 首次打开步骤

1. 下载 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`。
2. 打开访达 Finder，左边点“下载”。
3. 双击 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`。
4. 进入双击后解压生成的文件夹。
5. 双击最上面的应用程序：

```text
地球online成就殿堂.app
```

6. macOS 会弹出“不允许打开”之类的提示，这是因为软件未经过 Apple 签名公证。
7. 点击弹窗右上角的问号。
8. 按照说明打开“系统设置 - 隐私与安全性”。
9. 在“安全性”区域找到 `地球online成就殿堂`，点击“仍要打开”。
10. 回到解压生成的文件夹，再双击 `地球online成就殿堂.app`。
11. 这次弹窗里会出现“仍要打开”选项，点击它即可启动。

### 推荐装到应用程序

1. 打开 Finder。
2. 左边点“下载”。
3. 把解压出来的 `地球online成就殿堂.app` 拖到 Finder 左边的“应用程序”。
4. 以后可以从“应用程序”或 Launchpad 里打开。

### 如果还是打不开

如果没有看到“仍要打开”，不同 macOS 版本的位置可能略有差异。可以直接打开“系统设置 - 隐私与安全性”，在页面底部附近寻找 `地球online成就殿堂` 的拦截记录，再点击“仍要打开”。

### 备用启动

如果 App 图标仍然打不开，可以双击同一目录里的 `Start-EarthOnlineAchievementPalace.command`。它会打开一个终端窗口，并启动同一个本地应用。

应用会在本机启动一个只监听 `127.0.0.1` 的本地服务，然后用默认浏览器打开页面。不需要联网，不需要服务器。

如果你已经使用过旧版并拥有本地档案，升级后会自动补上第 37-48 个新增默认成就；已有成就、用户自建成就和本地图片不会被覆盖。

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
