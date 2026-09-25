import {readConversation} from '../src/domain/huihui.js';
const BASE='https://ark.cn-beijing.volces.com/api/v3';
const prompt='你是艳の辉应用中的辉辉AI助手，由豆包提供回答。用友好、简洁的中文帮助用户解决排课、学生、薪资、考勤、账号、同步及日常问题。你只能看到用户发来的聊天，没有读取或修改用户教学数据、账号和订单的权限，不要声称已经操作。遇到需要真人协助的问题，提示点击“转人工”，复制微信号后打开微信搜索添加。不得冒充真人客服或承诺人工响应时间。';
function fail(status,message){const error=Error(message);error.status=status;return error;}
export function createSupport(env=process.env,{fetchImpl=fetch,clock=Date.now}={}){
 const active=new Set(),limits=new Map();
 return {get ready(){return !!(env.DOUBAO_API_KEY&&env.DOUBAO_MODEL);},async reply(account,input){
  if(!account)throw fail(401,'请先登录后使用辉辉AI');
  if(!this.ready)throw fail(503,'AI客服尚未配置完成，请使用转人工');
  const messages=readConversation(input);if(!messages.length||messages.at(-1).role!=='user')throw fail(400,'聊天格式不正确');
  if(active.has(account))throw fail(429,'辉辉正在回复，请稍后再发');
  const now=clock();for(const [key,value] of limits)if(value.until<=now)limits.delete(key);
  const limit=limits.get(account)||{count:0,until:now+3600000};if(limit.count>=30)throw fail(429,'本小时咨询次数已达上限，请稍后再试或转人工');
  const base=new URL(env.DOUBAO_BASE_URL||BASE);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw fail(503,'AI客服配置异常，请联系管理员');
  limits.set(account,{...limit,count:limit.count+1});active.add(account);
  try{
   const response=await fetchImpl(base.href.replace(/\/$/,'')+'/chat/completions',{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${env.DOUBAO_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.DOUBAO_MODEL,messages:[{role:'system',content:prompt},...messages.slice(-20).map(m=>({role:m.role,content:m.text}))],max_tokens:700,thinking:{type:'disabled'},stream:false}),signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw fail(502,'豆包服务暂时不可用，请稍后重试或转人工');
   const result=await response.json(),text=result.choices?.[0]?.message?.content;
   if(typeof text!=='string'||!text.trim())throw fail(502,'豆包暂未返回回答，请重试或转人工');
   return {text:text.trim().slice(0,4000)};
  }catch(error){if(error.status)throw error;throw fail(502,'AI客服连接超时或暂不可用，请重试或转人工');}finally{active.delete(account);}
 }};
}
