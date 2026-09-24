import test from 'node:test';import assert from 'node:assert/strict';
import {mailOptions,parsePrivateEnv} from '../server/config.js';
test('QQ邮箱配置强制TLS并以SMTP账号为发件人',()=>{const c=mailOptions({SMTP_HOST:'smtp.qq.com',SMTP_USER:'2546619708@qq.com',SMTP_PASS:'secret'});assert.equal(c.transport.port,465);assert.equal(c.transport.secure,true);assert.equal(c.from,'2546619708@qq.com');assert.equal(c.transport.tls.minVersion,'TLSv1.2');assert.throws(()=>mailOptions({SMTP_HOST:'smtp.qq.com',SMTP_USER:'a@qq.com'}),/配置/);});
test('配置读取只接受后端允许的字段，不处理命令插值',()=>{assert.deepEqual(parsePrivateEnv('SMTP_USER=a@qq.com\nSMTP_PASS="a$b"\nVITE_SECRET=do-not-load\n# comment'),{SMTP_USER:'a@qq.com',SMTP_PASS:'a$b'});});
