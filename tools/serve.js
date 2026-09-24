import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import {createAuth} from '../server/auth.js';
import {createAccounts} from '../server/accounts.js';
import {loadPrivateEnv,mailOptions} from '../server/config.js';
loadPrivateEnv();
const root=path.resolve('dist/build/h5'),port=Number(process.env.PORT||4174);
const smtp=!!process.env.SMTP_HOST,production=process.env.NODE_ENV==='production',development=!production&&process.env.AUTH_DEV_MODE==='true';
if(production&&!smtp)throw Error('生产模式必须配置SMTP');
const devCodes=new Map();
const mail=smtp?mailOptions(process.env):null,transport=mail?nodemailer.createTransport(mail.transport):null;
const accounts=createAccounts(process.env.AUTH_DATA_FILE||path.resolve('server/data/accounts.json'));
const auth=createAuth({accounts,send:async(email,code)=>{if(smtp){const result=await transport.sendMail({from:{name:'课笺',address:mail.from},to:email,subject:'课笺 · 注册与登录验证码',text:`你的课笺验证码是 ${code}，5分钟内有效。首次验证会创建账号，已有账号会直接登录。请勿将验证码告诉他人；如非本人操作请忽略。`});if(!result.accepted?.length)throw Error('Mail rejected');}else if(development)devCodes.set(email,code);else throw Error('Email not configured');}});
const mode=smtp?'email':development?'development':'unavailable';
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  const host=req.headers.host;if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)){respond(403,{error:'仅限本地访问'});return;}
  const url=new URL(req.url,`http://${host}`);
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&req.headers.origin!==`http://${host}`){respond(403,{error:'请求来源无效'});return;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('kejian_session='))?.slice(15);

   if(req.method==='GET'&&url.pathname==='/api/session'){respond(200,{user:auth.session(token),mode});return;}
   if(req.method!=='POST'){respond(405,{error:'请求方式不支持'});return;}
   if(!req.headers['content-type']?.startsWith('application/json')){respond(400,{error:'请求格式无效'});return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){respond(413,{error:'请求过大'});return;}}const input=JSON.parse(body||'{}');
   if(url.pathname==='/api/auth/request'){if(mode==='unavailable'){respond(503,{error:'邮箱服务尚未配置，请联系管理员'});return;}const {email}=await auth.request(input.email,req.socket.remoteAddress);respond(200,{mode,...(development&&!smtp?{devCode:devCodes.get(email)}:{})});devCodes.delete(email);return;}
   if(url.pathname==='/api/auth/verify'){const value=auth.verify(input.email,input.code);res.setHeader('Set-Cookie',`kejian_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${production?'; Secure':''}`);respond(200,{user:auth.session(value)});return;}
   if(url.pathname==='/api/auth/logout'){auth.logout(token);res.setHeader('Set-Cookie','kejian_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');respond(200,{ok:true});return;}
   respond(404,{error:'接口不存在'});return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error('Not found');const content=await readFile(file);res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(content);
 }catch(error){if(req.url.startsWith('/api/')){const message=error.code?'服务器暂时无法保存账号，请稍后重试':error instanceof SyntaxError?'请求格式不正确':error.message;respond(400,{error:message});}else{res.statusCode=404;res.end('Not found');}}
}).listen(port,'127.0.0.1',()=>console.log(`课笺预览 http://127.0.0.1:${port} · ${smtp?'真实邮箱验证码':development?'开发验证码模式（不发送邮件）':'邮箱服务未配置'}`));
