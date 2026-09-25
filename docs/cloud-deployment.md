# 阿里云部署（2026-09-25）

正式站点：https://www.ryh6666.xyz/

服务器：8.152.212.109，Alibaba Cloud Linux 4。当前只有 `www` 主机名解析到服务器；裸域名 `ryh6666.xyz` 尚无 A 记录。

## 运行方式

采用系统自带 Node.js 22、MySQL 8.0 和 Nginx，项目目录 `/opt/kejian`，应用以专用 `kejian` 用户运行。由 systemd 管理 `kejian`、`mysqld`、`nginx` 三个服务，均已开启自启。前端为本地构建的 H5 产物，后端以 production 模式启动，邮箱登录和同步使用云端 MySQL。

Nginx 在 80/443 提供 HTTP 跳转、HTTPS 和反向代理；应用监听 4174，由主机防火墙阻止公网直连。MySQL 仅监听 127.0.0.1:3306。保留原有宝塔服务。

私密配置位于 `/opt/kejian/server/.env.local`，权限 600，数据库使用新生成的密码。此文件不得提交 Git。SMTP 沿用本地已配置的 QQ 邮箱；已验证云端 TLS 和 SMTP 认证，没有代发邮件。

HTTPS 使用 Let's Encrypt，续期由 `kejian-certbot.timer` 每日两次检查；成功续期后自动重载 Nginx。证书目录 `/etc/letsencrypt/live/www.ryh6666.xyz/`。

## 数据与备份

已迁移本地 MySQL 的 1 个账号；迁移时数据库中的教学文档和历史版本数均为 0。旧登录会话未启用，用户需在正式站重新邮箱登录。

本地浏览器及旧 APK 的离线数据不会随服务器部署自动转移。请在原设备“数据与备份”导出 JSON，在正式站登录相同邮箱后导入，即可开始云端同步。

2026-09-25 完整账号同步更新：邮箱首次验证即注册，之后同邮箱直接登录；学生、课程、薪资、考勤、个人资料/头像、背景设置及最近 100 条辉辉聊天按账号同步。保存后约 1 秒自动上传，打开新设备会下载云端数据，后台每 30 秒检查更新，断网保留待上传副本，联网后重试。退出登录前等待同步，失败或冲突时阻止退出并提示处理。备份导出包含上述全部字段，兼容旧教学备份。

本地 4173 预览默认将 `/api` 代理至正式站，账号与正式站互通；会话 Cookie 分属各自地址，需分别登录。需要独立本机测试时以 `KEJIAN_LOCAL_API=true` 启动。访客数据仍仅保存在本机，未经选择不会并入邮箱账号。

现有本机全局背景未自动归属于任何邮箱账号，避免在共用设备串号；可在访客模式导出完整备份再登录导入。旧版客户端未提交背景和聊天字段时，服务端保留云端已有值。

应用每小时检查当天 SQL 压缩备份，保留最近 7 天，位置 `/opt/kejian/server/data/backups`。部署当天备份另存本机 `work/cloud-backups`。目前没有持续的异地备份任务。

```sh
systemctl status kejian nginx mysqld --no-pager
journalctl -u kejian -n 100 --no-pager
systemctl restart kejian
systemctl list-timers kejian-certbot.timer
cd /opt/kejian
runuser -u kejian -- node tools/backup-db.mjs
/opt/kejian-certbot/bin/certbot renew --dry-run
```

更新前备份数据库及应用目录。在本机构建并验证 H5，再更新服务器源码和 `dist/build/h5`；保留服务器 `server/.env.local`、`server/data`、数据库。依赖变化后执行 `npm ci --omit=dev`，恢复文件属主 `kejian:kejian`，重启 `kejian` 并检查 `/api/session`。不要用本机私密配置覆盖服务器配置。

## 验证

- 本地 54 项自动测试通过，H5 构建通过。
- 公网可信 HTTPS 页面及会话接口正常；同步环境为 remote。
- 临时测试账号验证同步写入/读取、幂等、版本冲突、账号隔离、来源校验、历史版本和退出；测试账号随后清理。
- 服务重启后接口仍可访问。
- 当日 SQL 备份已恢复到隔离数据库，五张表记录数一致；临时恢复库随后清理。
- Certbot 自动续期演练成功，自启和定时器均已启用。
- 完整同步更新新增回归：背景/聊天跨设备恢复、旧聊天迁移、旧文档兼容、会话过期重新登录保留待上传数据、大图缓存去重。两个独立浏览器及本地预览已验证相同账号背景/聊天恢复，退出后回到注册/登录页。SMTP 认证通过，未代发验证码邮件。

旧 APK 仍为原离线版本；本次上线的是完整网页服务，没有重新打包安卓客户端。
