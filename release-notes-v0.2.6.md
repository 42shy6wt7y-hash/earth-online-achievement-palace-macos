# 地球online成就殿堂 macOS v0.2.6

这是 macOS 备用启动增强版，只发布 `.tar.gz`。

## 这版重点

- 保留 `v0.2.5` 的无 BOM、LF 换行 App 启动修复。
- 继续使用英文内部可执行文件名 `EarthOnlineAchievementPalace`，外部显示名仍为“地球online成就殿堂”。
- 新增顶层备用启动脚本 `Start-EarthOnlineAchievementPalace.command`。
- 如果 App 图标仍然打不开，可以双击备用启动脚本启动同一个本地应用。
- 不发布 zip。

## 使用方式

1. 下载 `EarthOnlineAchievementPalace-macOS-universal.tar.gz`。
2. 打开 Finder，左边点“下载”。
3. 双击 tar.gz，旁边会解压出 `地球online成就殿堂.app`。
4. 先右键 App，选择“打开”，再确认打开。
5. 想以后更方便，就把 App 从“下载”拖到 Finder 左边的“应用程序”。
6. 如果 App 图标仍然打不开，双击同一目录里的 `Start-EarthOnlineAchievementPalace.command`。

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
