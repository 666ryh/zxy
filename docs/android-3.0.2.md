# 安卓测试包 3.0.2

修复 3.0.1 的启动失败页：WebView 不再把内置 JS/CSS/图片资源的 HTTP 404 当成主页面失败并替换整个页面。首页继续从 APK 内置资源加载，资源异常只写入日志；只有真正的主页面加载错误才显示重试页。

本包使用当前 UniApp H5 产物，versionCode 302，沿用本机签名密钥。当前仍是安卓离线测试包，不是 HarmonyOS 原生 HAP。真机连接后应先卸载 3.0.1，再安装 3.0.2；若保留数据，Android 会在签名一致时允许覆盖升级。
# 3.0.2最终启动修复

根因是HarmonyOS WebView拒绝 `data:text/html;base64` 页面入口。3.0.2改为直接加载 `file:///android_asset/web/index.html`，H5包内资源在打包时转换为相对路径；WebView只解析受限的android_asset资源。资源错误不会替换整个首页。`AssetRoutesTest`会校验入口、JS/CSS和图片路径。
