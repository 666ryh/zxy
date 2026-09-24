# 安卓测试包 3.0.0

本包使用UniApp + Vue3编译得到H5，再嵌入本项目Android WebView壳。不是DCloud原生App-Plus包，也不是鸿蒙HAP。

- 包：`releases/kejian-3.0.0.apk`，包名`cn.kejian.teacher`，versionCode 300。
- 最低Android 8.0，建议更新Android System WebView。
- 包含当前课表、学生、工资、双考勤、个人资料、独立背景和辉辉自动回复。
- 默认离线使用，无需登录；尚未部署邮箱后端，APK不提供真实邮箱登录。
- 图片通过系统文件选择器选择；JSON/CSV通过系统保存窗口导出。聊天、背景、资料与新教学数据保存在WebView本机存储。
- 首次升级可将1.0的teacher.json迁移到新版存储，已有新版数据不覆盖。升级前建议先导出备份；卸载或清除数据会删除本机记录。
- 沿用本机`work/kejian-local.keystore`签名，密钥不入Git。正式分发需自行保管签名密钥。

构建：`npm run build:apk`，每次先重新编译H5，使用独立构建目录避免混入旧资源；脚本要求Java17及准备好的Android SDK34（`tools/setup-sdk.ps1`）。

验收：38项Node测试、H5构建、Java/dex构建及APK v2/v3签名验证通过，包内资源逐项校验与最新dist一致。当前adb无设备，Android系统文件选择器、原生返回键和WebView真机交互尚未验收。

用户目标手机为nova13 HarmonyOS6.1.0，当前APK不作为它的原生鸿蒙交付。后续原生鸿蒙需另行适配和签名。
