# 相册选择与 iOS 安装

## 安卓 3.0.4

背景入口改为“从相册选择背景”，使用UniApp `chooseImage({count:1,sourceType:['album']})`。H5使用系统浏览器提供的选图界面，不请求摄像头；浏览器最终提供的选项取决于平台。

安卓WebView收到图片选择请求后，Android13+优先系统Photo Picker，旧版/不支持设备回退到系统相册，再回退图片内容选择器。JSON备份选择仍使用系统文档选择器。不增加读取全部相册权限。

选取后继续进行本机压缩和保存；取消不报错、失败释放忙碌状态、图片超出15MB拒绝。浏览器验证单选、image/*、无capture，选图压缩为JPEG并持久化成功。

40项测试通过；H5构建、APK签名和7项内置资源校验通过。没有连接安卓/鸿蒙真机，本次不宣称已验证实际系统相册UI或解决此前所有设备启动兼容问题。建议保留应用数据并覆盖升级，不要为更新随意卸载。

## iPhone（用户暂无开发者账号）

当前没有IPA，未配置iOS签名材料、DCloud AppID及苹果构建环境。现有安卓WebView壳不能直接转换为IPA。

可选择：
1. 先使用H5：部署到可访问地址后，iPhone Safari打开；可按Safari提供的功能添加到主屏幕。电脑127.0.0.1地址不能从iPhone直接使用。
2. 免费Apple Account个人测试：需要Mac+Xcode，以及后续iOS壳/UniApp原生能力适配。Personal Team的设备描述文件7天到期，需重新构建安装。
3. TestFlight或App Store：需要Apple Developer Program、签名和分发流程。

说明：当前仅核实路线，没有生成或签名IPA，也没有开通付费服务。

来源：
- https://uniapp.dcloud.net.cn/api/media/image.html
- https://developer.apple.com/support/compare-memberships/
