import {randomInt,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const normalize=email=>{if(typeof email!=='string'||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email.trim()))throw Error('请填写有效邮箱');return email.trim().toLowerCase();};
const hash=s=>createHash('sha256').update(s).digest();
export function createAuth({send,clock=Date.now}){
 const challenges=new Map(),sessions=new Map(),limits=new Map();
 const cleanup=()=>{const now=clock();for(const [k,v]of challenges)if(v.expires+3600000<now)challenges.delete(k);for(const[k,v]of sessions)if(v.expires<now)sessions.delete(k);for(const[k,v]of limits)if(v.until<now)limits.delete(k);};
 return {
 async request(email,ip){cleanup();email=normalize(email);const now=clock(),previous=challenges.get(email);if(previous&&now-previous.sent<60000)throw Error('请等待60秒后重新发送');const limit=limits.get(ip)||{count:0,until:now+3600000};if(limit.count>=10)throw Error('请求过于频繁，请稍后再试');limit.count++;limits.set(ip,limit);const code=String(randomInt(100000,1000000));const record={digest:hash(code),sent:now,expires:now+300000,attempts:0};challenges.set(email,record);try{await send(email,code);}catch{challenges.delete(email);throw Error('邮件发送失败，请稍后重试');}return {email};},
 verify(email,code){email=normalize(email);const record=challenges.get(email);if(!record||record.expires<clock())throw Error('验证码无效或已过期');if(record.attempts>=5)throw Error('验证码尝试过多，请重新获取');record.attempts++;if(typeof code!=='string'||!timingSafeEqual(hash(code),record.digest))throw Error('验证码不正确');challenges.delete(email);cleanup();const token=randomBytes(32).toString('hex');sessions.set(token,{email,expires:clock()+7*86400000});return token;},
 session(token){const s=sessions.get(token);if(!s||s.expires<clock()){sessions.delete(token);return null;}return {email:s.email};},
 logout(token){sessions.delete(token);}
 };
}
