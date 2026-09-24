import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';import path from 'node:path';
const digest=t=>createHash('sha256').update(t).digest('hex');
export function createAccounts(file){let data={version:1,users:[],sessions:[]};if(file){try{data=JSON.parse(readFileSync(file,'utf8'));if(data.version!==1||!Array.isArray(data.users)||!Array.isArray(data.sessions))throw Error('Invalid account data');}catch(e){if(e.code!=='ENOENT')throw Error('账号存储读取失败，请检查服务器数据文件');}mkdirSync(path.dirname(file),{recursive:true});}
 function save(next){if(file){writeFileSync(file+'.tmp',JSON.stringify(next),{mode:0o600});renameSync(file+'.tmp',file);}data=next;}
 return {
 login(email,token,now){const next=structuredClone(data);let user=next.users.find(u=>u.email===email);if(!user){user={id:randomUUID(),email,createdAt:new Date(now).toISOString()};next.users.push(user);}user.lastLoginAt=new Date(now).toISOString();next.sessions=next.sessions.filter(s=>s.expires>now);next.sessions.push({hash:digest(token),userId:user.id,expires:now+7*86400000});save(next);return {...user};},
 session(token,now){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;const session=data.sessions.find(s=>s.hash===digest(token)&&s.expires>now);if(!session)return null;const user=data.users.find(u=>u.id===session.userId);return user?{...user}:null;},
 logout(token){if(typeof token!=='string')return;const next=structuredClone(data);next.sessions=next.sessions.filter(s=>s.hash!==digest(token));save(next);}
 };
}
