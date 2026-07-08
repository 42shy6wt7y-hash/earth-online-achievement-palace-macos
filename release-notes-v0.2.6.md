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
2. 打开访达 Finder，左边点“下载”。
3. 双击 tar.gz。
4. 进入双击后解压生成的文件夹。
5. 双击最上面的 `地球online成就殿堂.app`。
6. 如果弹出“不允许打开”，点击弹窗右上角的问号。
7. 按照提示进入“系统设置 - 隐私与安全性”，在“安全性”区域点击“仍要打开”。
8. 回到解压生成的文件夹，再双击 `地球online成就殿堂.app`。
9. 这次弹窗里会出现“仍要打开”，点击它即可启动。
10. 想以后更方便，就把 App 从“下载”拖到 Finder 左边的“应用程序”。
11. 如果 App 图标仍然打不开，双击同一目录里的 `Start-EarthOnlineAchievementPalace.command`。

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
