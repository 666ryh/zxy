# 安卓测试包 3.0.3

修复 3.0.2 在 HarmonyOS WebView 中打开后白屏的问题。`file:///android_asset` 虽然能读资源，但该系统对本地 file 页面执行 UniApp ES Module 脚本有限制；3.0.3 改用受控的 `https://app.kejian.local/` 虚拟入口，所有请求仍由 APK 内部拦截到 assets，网络不会访问外部服务器。

安装时先卸载旧 3.0.x 再安装本包。当前没有连接真机，已通过 APK 内部资源、路径、签名和 H5 构建检查。
