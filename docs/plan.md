# 课笺 Implementation Plan

Goal: 交付中文离线安卓 APK 和可维护源码。
Architecture: 无第三方运行依赖的 Web 界面 + Android 本地文件桥。
Spec: docs/design.md

1. 编写 Node 测试，先验证缺失实现失败；实现 web/domain.js：学生、课表、出勤转换、月度统计、严格备份导入。
2. 实现 web/index.html、styles.css、app.js 四页面与对话框。实际状态和原子保存驱动视图。
3. 实现 Android Activity：本地资源、文件存储、导入导出、返回键、禁止远程导航。提供 SDK 直接构建脚本。
4. 运行全部测试、手机浏览器交互及截图检查、APK 编译和签名检查。记录验证边界及使用说明。

Review focus: 非数字金额；跨天/重叠课程；修改学生价格后历史稳定；未来课程误算工资；坏备份不得破坏原数据。

Execution: 在用户指定的空目录直接实现。用户已要求开发和 APK，常规实现选择不重复请求许可。
