# 课笺 · UniApp + Vue3

教师个人排课、学生管理、薪资与考勤手账。当前使用 **UniApp + Vue3 + Vite** 开发并验证 **H5**，以浏览器预览为准；不生成新的APK或HAP。

## 查看页面

```powershell
cd F:\teacher
npm install
npm run preview
```

打开 http://127.0.0.1:4173/#/pages/index/index?tab=profile 。原来的 `#profile`、`#students` 等链接也会跳转。前端4173，Node邮箱验证服务4174，均只绑定本机。

初次进入可点“先逛逛，体验页面”。“我的→常用服务→数据与备份”可在空数据时加载示例。浏览器原有访客与邮箱数据沿用相同键，不自动清空或改变旧价格。

## 技术与源码

- `src/main.js`、`App.vue`、`pages.json`、`manifest.json`：标准UniApp Vue3工程入口。
- `src/pages/index/index.vue`：应用页面、五项导航。
- `src/components/ProfilePage.vue`：封面、头像、教学收藏夹、授课记录、常用服务。
- `src/components/TeachingPages.vue`：课表、学生、薪资、考勤。
- `src/components/EditorSheet.vue`：编辑与操作表单。
- `src/store.js`、`storage.js`：Vue响应式状态、本机持久化、旧数据兼容、H5文件能力。
- `src/domain/`：独立计薪和排课规则；`server/auth.js`：验证码验证。
- `tools/dev.mjs`：一起启动H5与本地API；`tools/serve.js`：邮件API和H5构建产物静态服务。

界面使用Vue组件与UniApp基础组件，并非在UniApp内嵌旧网页。H5文件下载、文件选择和Cookie登录有平台条件编译；鸿蒙原生能力需后续适配和真机验证，当前尚未承诺原生可用。

## 检查与H5构建

```powershell
npm test
npm run build:h5
npm audit --registry=https://registry.npmjs.org
```

H5产物在 `dist/build/h5`。`npm run dev:h5`只启动前端；平时使用`npm run preview`同时启动验证服务。

DCloud包按官方模板统一版本；由于官方模板固定的旧Vite和若干传递依赖有已知漏洞，本项目升级Vite6.4.3并使用package.json overrides。`.npmrc`设置legacy-peer-deps来兼容DCloud精确的旧peer要求。当前H5构建、21项测试和依赖审计通过；升级框架需复查构建与锁文件。

## 官方角色素材与主页设计

库洛米已换成三丽鸥[官方角色页面](https://www.sanrio.co.jp/characters/kuromi/)发布的原始PNG。素材位置及来源：`src/static/characters/SOURCES.md`。没有重绘或改色；官方来源不代表项目取得商业授权，课笺不是Sanrio官方应用。

个人主页参考网易云音乐的封面、头像资料卡、统计和分区布局，将内容集合改为教学收藏夹、授课记录及常用服务，不复制音乐功能或制造社交数据。

## 保留的业务规则

月薪＝底薪（默认2000元）＋已完成课程课时费＋每笔招生实缴金额×提成比例＋晚辅单价×次数。

新课90分钟算一课时、不足向上取整；原按小时记录保留旧规则。每节课保存价格快照。请假/取消不计课时费，晚辅按月设置单价和次数，招生缴费只在缴费月份计一次。

上课/下课打卡、历史补录、时间冲突检测、重复排课、收款标记、JSON备份和CSV工资导出均保留。辉辉使用本地预设语句自动回复。

## 邮箱登录

当前默认本机开发验证码模式：页面显示验证码并明确不发送邮件。可用任意格式正确的邮箱体验；不代表已验证邮箱所有权。

真实邮件需要设置`.env.example`列出的SMTP环境变量，再启动预览。配置文件不自动加载。服务端发送，前端不获取邮件密钥。验证码5分钟有效、60秒重发间隔、错误次数和IP限流；会话Cookie在退出后失效，服务重启后需要重新登录。

数据仅存在当前浏览器，无云同步。每邮箱独立数据不等同于对设备拥有者加密；请定期备份。

## 鸿蒙目标与历史文件

目标设备：华为nova 13（BLK-AL80），HarmonyOS6.1.0，API6.1.1（24）。用户确认全部页面后，再评估UniApp鸿蒙构建、签名与真机适配。

`android/`、`releases/`与APK构建脚本为历史版本存档，不包含当前UniApp页面；不要使用旧APK验证本轮修改。

## 个人资料与考勤更新
“我的→编辑资料”现在是微信式个人资料列表，支持本机头像、名字、性别、地区、手机号、微信号、签名；个人中心主页布局保留。教学页顶部品牌块已移除，课表/学生/薪资改为简洁内容布局。

考勤含“课程考勤”和“上下班考勤”两个页签，分别统计。上下班先设置所选月份的班次、工作日、生效日期和宽限；可签到签退、补卡、登记全天请假、撤销记录。课程可按实际时间补卡、记录请假原因，补卡只计一次原约定课酬。均可按月/日和状态筛选、导出CSV；不会自动扣薪。详见docs/profile-attendance.md。

## 背景图片与QQ客服
我的→常用服务→页面背景：各页独立上传图片、完整显示/铺满、调整组件透明度与文字颜色，可应用到全部页面。设置仅保存在当前浏览器。悬浮辉辉按钮打开应用内趣味聊天，从用户指定的10句话中随机回复，避免连续重复；无需QQ或外部接口。详见docs/background-qq.md。
