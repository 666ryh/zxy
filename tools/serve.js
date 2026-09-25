import http from 'node:http';
import {createHumanSupport} from '../server/human-support.js';
import {createSupport} from '../server/support.js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import {createAuth} from '../server/auth.js';
import {openDatabase,databaseOptions} from '../server/database.js';
import {backupDatabase} from '../server/backup.js';
import {loadPrivateEnv,mailOptions} from '../server/config.js';
loadPrivateEnv();
const root=path.resolve('dist/build/h5'),port=Number(process.env.PORT||4174);
const smtp=!!process.env.SMTP_HOST,production=process.env.NODE_ENV==='production',development=!production&&process.env.AUTH_DEV_MODE==='true';
if(production&&!smtp)throw Error('生产模式必须配置SMTP');
const devCodes=new Map();
const mail=smtp?mailOptions(process.env):null,transport=mail?nodemailer.createTransport(mail.transport):null;
const publicOrigin=production?new URL(process.env.PUBLIC_ORIGIN||'http://invalid'):null;
if(production&&publicOrigin.protocol!=='https:')throw Error('生产环境需配置HTTPS的PUBLIC_ORIGIN');
const database=await openDatabase(databaseOptions(),process.env.AUTH_DATA_FILE||path.resolve('server/data/accounts.json'));
const accounts=database.accounts;
const human=await createHumanSupport(database.pool,{staffEmails:process.env.SUPPORT_STAFF_EMAILS});
let backupRunning=false;
async function dailyBackup(){if(backupRunning)return;backupRunning=true;try{await backupDatabase();}catch{console.error('数据库每日备份失败，请检查mysqldump配置与备份目录');}finally{backupRunning=false;}}
dailyBackup();setInterval(dailyBackup,3600000).unref();
const auth=createAuth({accounts,send:async(email,code)=>{if(smtp){const result=await transport.sendMail({from:{name:'艳の辉',address:mail.from},to:email,subject:'艳の辉 · 注册与登录验证码',text:`你的艳の辉验证码是 ${code}，5分钟内有效。首次验证会创建账号，已有账号会直接登录。请勿将验证码告诉他人；如非本人操作请忽略。`});if(!result.accepted?.length)throw Error('Mail rejected');}else if(development)devCodes.set(email,code);else throw Error('Email not configured');}});
const support=createSupport();
const mode=smtp?'email':development?'development':'unavailable';
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  const host=req.headers.host;if(!(production?[publicOrigin.host]:[`127.0.0.1:${port}`,`localhost:${port}`]).includes(host)){respond(403,{error:'请求域名无效'});return;}
  const url=new URL(req.url,`http://${host}`);
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&req.headers.origin!==(production?publicOrigin.origin:`http://${host}`)){respond(403,{error:'请求来源无效'});return;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('kejian_session='))?.slice(15);

   if(req.method==='GET'&&url.pathname==='/api/session'){const user=await auth.session(token);respond(200,{user,mode,supportStaff:human.isStaff(user),syncEnvironment:production?'remote':'local'});return;}
   const supportRoute=url.pathname==='/api/support/chat';
   const humanRoute=url.pathname.startsWith('/api/human/'),staffRoute=url.pathname.startsWith('/api/staff/');
   const protectedRoute=humanRoute||staffRoute;
   const syncRoute=url.pathname.startsWith('/api/sync');
   const syncUser=(syncRoute||supportRoute||protectedRoute)?await auth.session(token):null;
   if((syncRoute||supportRoute||protectedRoute)&&!syncUser){respond(401,{error:'请重新登录后同步，本机记录仍保留'});return;}
   if((syncRoute||supportRoute||protectedRoute)&&req.headers['x-sync-account']!==syncUser.email){respond(401,{error:'当前登录账号已改变，请刷新或重新登录；未同步其他账号的数据'});return;}
   if(req.method==='GET'&&url.pathname==='/api/sync'){respond(200,await database.sync.read(syncUser.id));return;}
   if(req.method==='GET'&&url.pathname==='/api/sync/history'){respond(200,{versions:await database.sync.history(syncUser.id)});return;}
   if(req.method==='GET'&&/^\/api\/sync\/history\/\d+$/.test(url.pathname)){respond(200,await database.sync.version(syncUser.id,Number(url.pathname.split('/').at(-1))));return;}
   const staffMatch=url.pathname.match(/^\/api\/staff\/threads\/(\d+)(?:\/(send|read|close))?$/);
   if(req.method==='GET'&&url.pathname==='/api/human/thread'){respond(200,await human.getOwn(syncUser,url.searchParams.get('after')||0));return;}
   if(req.method==='GET'&&url.pathname==='/api/staff/threads'){respond(200,await human.list(syncUser,{q:url.searchParams.get('q')||'',status:url.searchParams.get('status')||''}));return;}
   if(req.method==='GET'&&staffMatch&&!staffMatch[2]){respond(200,await human.getStaff(syncUser,staffMatch[1],url.searchParams.get('after')||0));return;}
   if(req.method!=='POST'){respond(405,{error:'请求方式不支持'});return;}
   if(!req.headers['content-type']?.startsWith('application/json')){respond(400,{error:'请求格式无效'});return;}
   const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>(syncRoute?6500000:supportRoute?300000:protectedRoute?12000:4096)){respond(413,{error:'请求过大'});return;}chunks.push(chunk);}const input=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
   if(url.pathname==='/api/human/start'){respond(200,await human.start(syncUser));return;}
   if(url.pathname==='/api/human/send'){respond(200,await human.send(syncUser,null,input));return;}
   if(staffMatch&&staffMatch[2]==='send'){respond(200,await human.send(syncUser,staffMatch[1],input));return;}
   if(staffMatch&&staffMatch[2]==='read'){respond(200,await human.markRead(syncUser,staffMatch[1],input.lastId));return;}
   if(staffMatch&&staffMatch[2]==='close'){respond(200,await human.close(syncUser,staffMatch[1]));return;}
   if(supportRoute){respond(200,await support.reply(syncUser.id,input.messages));return;}
   if(url.pathname==='/api/sync'){respond(200,await database.sync.save(syncUser.id,input.expectedRevision,input.requestId,input.document));return;}
   if(url.pathname==='/api/auth/request'){if(mode==='unavailable'){respond(503,{error:'邮箱服务尚未配置，请联系管理员'});return;}const clientIp=production&&process.env.TRUST_PROXY==='true'?(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim():req.socket.remoteAddress;const {email}=await auth.request(input.email,clientIp);respond(200,{mode,...(development&&!smtp?{devCode:devCodes.get(email)}:{})});devCodes.delete(email);return;}
   if(url.pathname==='/api/auth/verify'){const value=await auth.verify(input.email,input.code);res.setHeader('Set-Cookie',`kejian_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${production?'; Secure':''}`);respond(200,{user:await auth.session(value)});return;}
   if(url.pathname==='/api/auth/logout'){await auth.logout(token);res.setHeader('Set-Cookie','kejian_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');respond(200,{ok:true});return;}
   respond(404,{error:'接口不存在'});return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error('Not found');const content=await readFile(file);res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(content);
 }catch(error){if(req.url.startsWith('/api/')){const message=error.code?'服务器暂时无法保存数据，请稍后重试':error instanceof SyntaxError?'请求格式不正确':error.message;respond(error.status||400,{error:message});}else{res.statusCode=404;res.end('Not found');}}
}).listen(port,production?'0.0.0.0':'127.0.0.1',()=>console.log(`艳の辉服务 :${port} · ${smtp?'真实邮箱验证码':development?'开发验证码模式（不发送邮件）':'邮箱服务未配置'} · ${production?'服务器同步':'本机同步测试'}`));
