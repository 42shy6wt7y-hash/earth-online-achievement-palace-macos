# 地球online成就殿堂 macOS v0.2.5

这是 macOS 修正版，只发布 `.tar.gz`。本版修复了 `v0.2.4` 在部分 Mac 上显示“这台 Mac 不支持此应用程序”的问题。

## 修复

- `.app` 内部启动入口改为无 BOM、LF 换行的可执行脚本。
- `.app` 内部可执行文件名改为英文 `EarthOnlineAchievementPalace`，外部显示名仍为“地球online成就殿堂”。
- 保留 macOS arm64 和 x64 两套 Node.js 运行时。
- 不再发布 zip 包，避免 macOS 解压和权限行为不一致。

## 使用方式

1. 下载 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`。
2. 打开 Finder，左边点“下载”。
3. 双击 tar.gz，旁边会解压出 `地球online成就殿堂.app`。
4. 可以直接双击这个 App 使用。
5. 想以后更方便，就把 App 从“下载”拖到 Finder 左边的“应用程序”。
6. 首次打开如果 macOS 提示来自未认证开发者，请在 Finder 里右键 App，选择“打开”，再确认打开。

## 功能

- 黑金 Steam 风成就墙。
- 36 个默认成就，首次打开自动创建，初始全部未达成。
- 支持创建、修改、删除、切换达成状态。
- 支持用户自定义缩略图和大图。
- 主页面右上角“信”按钮和玩家信件弹窗。
- 本地事件档案只增不删，删除操作不会移除底层旧文件。

## 本地数据

- 档案保存在 `~/Library/Application Support/EarthOnlineAchievementPalaceMac/achievement-archive`。
- 本地端口段为 `3417..3499`。
