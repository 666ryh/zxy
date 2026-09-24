import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import {createAuth} from '../server/auth.js';
const root=path.resolve('dist/build/h5'),port=Number(process.env.PORT||4174);
const smtp=!!process.env.SMTP_HOST,production=process.env.NODE_ENV==='production';
if(production&&!smtp)throw Error('生产模式必须配置SMTP');
const devCodes=new Map();
const transport=smtp?nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:process.env.SMTP_SECURE!=='false',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:10000,socketTimeout:10000}):null;
const auth=createAuth({send:async(email,code)=>{if(smtp)await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:'课笺 · 登录验证码',text:`你的课笺验证码是 ${code}，5分钟内有效。如非本人操作请忽略。`});else devCodes.set(email,code);}});
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  const host=req.headers.host;if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)){respond(403,{error:'仅限本地访问'});return;}
  const url=new URL(req.url,`http://${host}`);
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&req.headers.origin!==`http://${host}`){respond(403,{error:'请求来源无效'});return;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('kejian_session='))?.slice(15);

   if(req.method==='GET'&&url.pathname==='/api/session'){respond(200,{user:auth.session(token),mode:smtp?'email':'development'});return;}
   if(req.method!=='POST'){respond(405,{error:'请求方式不支持'});return;}
   if(!req.headers['content-type']?.startsWith('application/json')){respond(400,{error:'请求格式无效'});return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){respond(413,{error:'请求过大'});return;}}const input=JSON.parse(body||'{}');
   if(url.pathname==='/api/auth/request'){const {email}=await auth.request(input.email,req.socket.remoteAddress);respond(200,{mode:smtp?'email':'development',...(smtp?{}:{devCode:devCodes.get(email)})});devCodes.delete(email);return;}
   if(url.pathname==='/api/auth/verify'){const value=auth.verify(input.email,input.code);res.setHeader('Set-Cookie',`kejian_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${production?'; Secure':''}`);respond(200,{user:auth.session(value)});return;}
   if(url.pathname==='/api/auth/logout'){auth.logout(token);res.setHeader('Set-Cookie','kejian_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');respond(200,{ok:true});return;}
   respond(404,{error:'接口不存在'});return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error('Not found');const content=await readFile(file);res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(content);
 }catch(error){if(req.url.startsWith('/api/'))respond(400,{error:error.message});else{res.statusCode=404;res.end('Not found');}}
}).listen(port,'127.0.0.1',()=>console.log(`课笺预览 http://127.0.0.1:${port} · ${smtp?'邮箱发送已配置':'开发验证码模式（不发送邮件）'}`));
