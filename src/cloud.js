import {reactive} from 'vue';
import {createSyncEngine} from './sync-engine.js';
import {validateDocument,emptyDocument} from './domain/sync-document.js';
export const cloud=reactive({status:'signedOut',message:'',updatedAt:null,environment:'local',open:false});
export const freshMeta=()=>({revision:0,baseline:null,dirty:false,pending:null});
function encodeCache(value){const images=[],indices=new Map();const json=JSON.stringify(value,(_,v)=>{if(typeof v!=='string'||v.length<1000||!v.startsWith('data:image/'))return v;if(!indices.has(v)){indices.set(v,images.length);images.push(v);}return {$image:indices.get(v)};});return images.length?JSON.stringify({cacheVersion:2,images,value:JSON.parse(json)}):json;}
export function decodeCache(raw){const parsed=JSON.parse(raw);if(parsed.cacheVersion!==2)return parsed;if(!Array.isArray(parsed.images))throw Error('图片缓存损坏');return JSON.parse(JSON.stringify(parsed.value),(_,v)=>{if(!v||typeof v!=='object'||!Object.hasOwn(v,'$image'))return v;const image=parsed.images[v.$image];if(!Number.isInteger(v.$image)||typeof image!=='string'||!image.startsWith('data:image/'))throw Error('图片缓存损坏');return image;});}
export function createLocalCloud({api,get,set,onApply,canSync=()=>true}){
 let storageKey=null,envelope=null,storedRaw=null,timer=null,poll=null,accountEmail=null;
 function persist(next){const raw=encodeCache(next);if((get(storageKey)||null)!==storedRaw)throw Error('另一标签页已更新本机数据，请刷新后再操作');try{set(storageKey,raw);}catch(e){if(e.name==='QuotaExceededError')throw Error('本机缓存空间不足，请导出备份并缩小背景图片后重试；本次修改未保存');throw e;}storedRaw=raw;envelope=next;}
 function archive(document){const k=storageKey+'-recovery';const raw=get(k);let versions=[];if(raw){try{versions=decodeCache(raw);}catch{throw Error('本机恢复副本损坏，请先导出数据');}}versions=[{at:new Date().toISOString(),document},...versions].slice(0,3);set(k,encodeCache(versions));}
 const engine=createSyncEngine({api:async(route,body)=>{const result=await api(route,body,accountEmail);return {...result,document:result.document?validateDocument(result.document):null};},read:()=>envelope.document,readMeta:()=>envelope.meta,saveMeta:meta=>persist({...envelope,meta}),apply:(document,meta)=>{persist({document:validateDocument(document),meta});onApply(envelope.document);},archive,isEmpty:emptyDocument,onState:s=>Object.assign(cloud,{message:'',...s})});
 let inFlight=null;
 function sync(force=false){if(inFlight)return inFlight;if(force===true||canSync()){const task=engine.sync().finally(()=>{if(inFlight===task)inFlight=null;});inFlight=task;return task;}}
 function schedule(){clearTimeout(timer);timer=setTimeout(sync,1000);}
 return {
 attach(email,document){clearTimeout(timer);clearInterval(poll);engine.start(null);accountEmail=email;storageKey=email?`kejian-account-${email}-sync-v1`:null;envelope=null;storedRaw=null;if(!email)return document;storedRaw=get(storageKey)||null;if(storedRaw){const parsed=decodeCache(storedRaw);if(!parsed.meta||!Number.isSafeInteger(parsed.meta.revision)||parsed.meta.revision<0)throw Error('本机同步信息损坏，请先导出恢复副本');envelope={document:validateDocument(parsed.document),meta:{...parsed.meta,baseline:parsed.meta.baseline?validateDocument(parsed.meta.baseline):null}};if(parsed.document.conversation===undefined&&document.conversation?.length){envelope.document.conversation=validateDocument(document).conversation;envelope.meta.dirty=true;persist(envelope);}}else{envelope={document:validateDocument(document),meta:freshMeta()};persist(envelope);}engine.start(email);schedule();poll=setInterval(sync,30000);return envelope.document;},
 save(document){if(!envelope)throw Error('同步存储未就绪');persist({...envelope,document:validateDocument(document),meta:{...envelope.meta,dirty:true}});if(!['conflict','localConflict','unauthorized'].includes(cloud.status))cloud.status='pending';schedule();},
 async flush(){await sync(true);if(envelope?.meta.dirty||envelope?.meta.pending)await sync(true);if(envelope?.meta.dirty||envelope?.meta.pending||['conflict','localConflict','error','unauthorized'].includes(cloud.status))throw Error('数据尚未成功上传，请先在同步与恢复中完成同步后再退出');},
 sync,resolve:choice=>engine.resolve(choice),
 detach(){clearTimeout(timer);clearInterval(poll);engine.start(null);inFlight=null;accountEmail=null;storageKey=null;envelope=null;storedRaw=null;},
 changedElsewhere(){if(storageKey&&(get(storageKey)||null)!==storedRaw)engine.pause('另一标签页修改了本机数据，请刷新后继续，当前未保存表单请先留存。');},
 archiveCurrent(){if(envelope)archive(envelope.document);},
 recovery(){const raw=get(storageKey+'-recovery');return raw?decodeCache(raw):[];},
 get meta(){return envelope?.meta||freshMeta();},
 get active(){return !!envelope;}
 };
}
