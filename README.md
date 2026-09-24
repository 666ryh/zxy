# 课笺

> 当前正在迭代紫色网页预览 v2，暂不打包。请阅读 docs/preview-v2.md。releases 中的 APK 属于旧版，以下旧版安装说明仅作保留。


教师个人使用的中文离线安卓应用：管理自己的学生、排课、计算课酬、记录自己的考勤。

## 安装

将 `releases/kejian-1.0.0.apk` 发送到安卓手机，点击安装。最低 Android 8.0（API 26），建议使用已更新 Android System WebView 的手机。应用无需网络、账号、定位、联系人或存储权限。安装包为本地签名的试用版本，不是应用商店发布版。

首次打开为空白业务数据，可在右上角“备份与设置”加载示例。正式使用建议从空数据开始。

## 日常使用

1. “学生”添加姓名、科目和每小时课酬。
2. “课表”选择日期并排课，支持每周重复 4/8/12 周；同一教师时间冲突会拒绝保存整批课程。
3. 上课时点击“上课打卡”，结束后“下课打卡”；历史课程点详情中的“补录完成”。
4. “薪资”查看当月已赚、已收和待收课酬，逐节标记收款，导出 CSV 账单。
5. “考勤”查看自己完成授课的日期、迟到次数、请假记录和实际打卡时间。
6. 定期从设置导出 JSON 备份；恢复备份需确认替换，文件格式不合法时拒绝导入。

### 计薪与考勤口径

- 课酬=约定课程分钟数×课程时薪÷60，逐节四舍五入到分；仅已完成课程计薪。
- 时薪在排课时保存为快照；学生后续调价不改变已排课的价格。
- 取消和教师请假不计薪；课酬不是税后工资，不包含底薪、税费或绩效。
- 实际打卡晚于计划开始 5 分钟记迟到，但不自动扣薪。补录不判断迟到。
- 课程状态恢复为待上课会清除该节考勤与收款标记；删除课程不可撤销。
- 第一版为一对一、单教师本机管理，不含班课、云同步、提醒、跨日课程或机构审批。

## 数据

Android 数据在应用私有目录 `teacher.json`，以 AtomicFile 原子写入。浏览器预览使用其自身 localStorage，与手机数据独立。卸载、清除应用数据会移除记录，升级请保留签名密钥和应用数据。容量上限为 UTF-8 5MB、5000 学生、20000 课程，超过时拒绝保存。

Android 备份由系统文件选择器写出；浏览器由下载功能保存。JSON 备份包含个人数据，请自行保管。

## 项目与开发

无 npm 运行依赖，Node 18+ 用于测试和本地预览，Java 17 + Android SDK 34 用于构建。Android 壳内置 HTML/CSS/ES modules；本地 HTTPS 虚拟域名的资源由 WebViewClient 从 assets 返回，不访问远程服务器。APK 未申请 INTERNET 权限。

```powershell
cd F:\teacher
npm test
npm run preview
# 浏览器打开 http://127.0.0.1:4173

# SDK 仅需首次准备，本机已准备完成
powershell -NoProfile -ExecutionPolicy Bypass -File tools/setup-sdk.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-apk.ps1
```

构建脚本直接调用官方 aapt2、javac、d8、zipalign 和 apksigner，不依赖 Gradle 下载。若 Java 不在 `C:\Program Files\Java\jdk-17`，修改脚本 `$javaRoot`。SDK 下载遵循其官方许可。

签名密钥位于 `work/kejian-local.keystore`（已排除 Git），本地试用密码 `android`。**保留此密钥才能覆盖升级此版本**；公开发布前使用独立妥善保护的发布密钥。

### 文件
- `web/domain.js`：金额、排课、状态与备份校验。
- `web/app.js` / `styles.css`：四页界面及交互。
- `android/app/src/main/`：离线安卓壳、文件桥和系统文件选择器。
- `tests/domain.test.js`：可独立运行的行为测试。
- `docs/design.md`：功能范围和 GitHub 项目调研。
- `docs/verification.md`：实际验证记录与尚未验证的范围。

## 参考项目

功能调研参考 [TutorZone](https://github.com/namtudev/tutor_zone)、[课薪通](https://github.com/KunLiam/Kexintong)、[StarClass](https://github.com/Hoodas101/starclass)。本项目独立实现，未复制这些仓库的业务代码。
