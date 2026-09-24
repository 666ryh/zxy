import {reactive} from 'vue';
import {createSyncEngine} from './sync-engine.js';
import {validateDocument,emptyDocument} from './domain/sync-document.js';
export const cloud=reactive({status:'signedOut',message:'',updatedAt:null,environment:'local',open:false});
export const freshMeta=()=>({revision:0,baseline:null,dirty:false,pending:null});
export function createLocalCloud({api,get,set,onApply,canSync=()=>true}){
 let storageKey=null,envelope=null,storedRaw=null,timer=null,poll=null,accountEmail=null;
 function persist(next){const raw=JSON.stringify(next);if((get(storageKey)||null)!==storedRaw)throw Error('另一标签页已更新本机数据，请刷新后再操作');set(storageKey,raw);storedRaw=raw;envelope=next;}
 function archive(document){const k=storageKey+'-recovery';const raw=get(k);let versions=[];if(raw){try{versions=JSON.parse(raw);}catch{throw Error('本机恢复副本损坏，请先导出数据');}}versions=[{at:new Date().toISOString(),document},...versions].slice(0,3);set(k,JSON.stringify(versions));}
 const engine=createSyncEngine({api:(route,body)=>api(route,body,accountEmail),read:()=>envelope.document,readMeta:()=>envelope.meta,saveMeta:meta=>persist({...envelope,meta}),apply:(document,meta)=>{persist({document:validateDocument(document),meta});onApply(envelope.document);},archive,isEmpty:emptyDocument,onState:s=>Object.assign(cloud,{message:'',...s})});
 function sync(){if(canSync())return engine.sync();}
 function schedule(){clearTimeout(timer);timer=setTimeout(sync,1000);}
 return {
 attach(email,document){clearTimeout(timer);clearInterval(poll);engine.start(null);accountEmail=email;storageKey=email?`kejian-account-${email}-sync-v1`:null;envelope=null;storedRaw=null;if(!email)return document;storedRaw=get(storageKey)||null;if(storedRaw){const parsed=JSON.parse(storedRaw);if(!parsed.meta||!Number.isSafeInteger(parsed.meta.revision)||parsed.meta.revision<0)throw Error('本机同步信息损坏，请先导出恢复副本');envelope={document:validateDocument(parsed.document),meta:parsed.meta};}else{envelope={document:validateDocument(document),meta:freshMeta()};persist(envelope);}engine.start(email);schedule();poll=setInterval(sync,30000);return envelope.document;},
 save(document){if(!envelope)throw Error('同步存储未就绪');persist({...envelope,document:validateDocument(document),meta:{...envelope.meta,dirty:true}});schedule();},
 sync,resolve:choice=>engine.resolve(choice),
 detach(){clearTimeout(timer);clearInterval(poll);engine.start(null);accountEmail=null;storageKey=null;envelope=null;storedRaw=null;},
 changedElsewhere(){if(storageKey&&(get(storageKey)||null)!==storedRaw)engine.pause('另一标签页修改了本机数据，请刷新后继续，当前未保存表单请先留存。');},
 archiveCurrent(){if(envelope)archive(envelope.document);},
 recovery(){const raw=get(storageKey+'-recovery');return raw?JSON.parse(raw):[];},
 get meta(){return envelope?.meta||freshMeta();},
 get active(){return !!envelope;}
 };
}
