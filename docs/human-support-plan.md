# 人工客服工作台设计与实施

用户要求：独立 UniApp + Vue3 项目 F:/huihui，仓库 666ryh/huihui，云端网页测试，不打 APK。授权客服邮箱：2546619708@qq.com。

工作台静态 H5 部署到 https://www.ryh6666.xyz/huihui/，独立源码和构建，共享既有 HTTPS、邮箱登录及 Node/MySQL 后端。服务器配置 SUPPORT_STAFF_EMAILS 决定客服权限，未配置时拒绝客服访问。用户仅能读写自己的人工会话，客服仅能访问客服消息，不新增教学数据权限。

用户点击转人工后创建/重开自己的人工会话，保留原 AI 历史但不自动转发给真人。用户端可切回 AI；客服可结束会话，结束后发送须再次转人工。人工消息作为独立 MySQL 表保存，避免教学整文档同步冲突。消息包含唯一请求 ID，失败重试不会重复发送，按递增消息 ID 排序。仅当前可见界面每 2 秒轮询增量，重连继续获取。会话列表含最新消息、状态、未读计数，打开会话后确认已读。

接口契约（响应 JSON）：
- GET /api/session 新增 supportStaff 布尔值；沿用 POST /api/auth/request、verify、logout。
- 所有人工接口要求会话 Cookie 和 X-Sync-Account 当前邮箱，错误使用既有 {error}。
- GET /api/human/thread → {thread:null|{id,status,updatedAt},messages:[],hasMore:false}。query after 非负消息 ID，初次从0，单页100。
- POST /api/human/start {} → {thread}。
- POST /api/human/send {requestId,text} → {message}。
- GET /api/staff/threads → {threads:[{id,email,status,updatedAt,lastText,unread}]}，query q 搜索邮箱，status 可选 open/closed。
- GET /api/staff/threads/:id?after=0 → {thread:{id,email,status,updatedAt},messages:[{id,role:user|staff,text,createdAt}],hasMore}。
- POST /api/staff/threads/:id/send {requestId,text} → {message}。
- POST /api/staff/threads/:id/read {lastId} → {ok:true}。
- POST /api/staff/threads/:id/close {} → {ok:true}。

实施顺序：先真实数据库失败测试与模块；并行独立工作台前端；接入原客服组件与路由；账号隔离/幂等/关闭重开测试；两端H5构建、服务器备份后发布；临时用户+客服两个隔离浏览器真实双向消息、刷新恢复、权限拒绝；清理测试数据；提交并推送两个仓库。

验收重点：未授权账号不能列出或猜ID访问会话；用户不能互读；重复请求不新增消息；客服回复断线恢复后仍可见；切账号/切会话迟到响应不混入；空内容/超长内容拒绝；没有发送验证码测试邮件。
