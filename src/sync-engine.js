const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const requestId=()=>globalThis.crypto?.randomUUID?.()||`sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function createSyncEngine({api,read,readMeta,saveMeta,apply,archive,isEmpty,onState}){
 let generation=0,account=null,busy=false,conflict=null,paused=false;
 const emit=(status,extra={})=>onState({status,...extra});
 function localChanged(){const m=readMeta();return !!m.dirty||!same(read(),m.baseline);}
 async function upload(remote,gen){let m=readMeta();const current=structuredClone(read());let pending=m.pending;if(!pending||!same(pending.document,current)||pending.expectedRevision!==remote.revision){pending={requestId:requestId(),expectedRevision:remote.revision,document:current};saveMeta({...m,pending,dirty:true});}const result=await api('/api/sync',pending);if(gen!==generation)return;const latest=read();saveMeta({...readMeta(),revision:result.revision,baseline:result.document,dirty:!same(latest,result.document),pending:null});emit(same(latest,result.document)?'synced':'pending',{updatedAt:result.updatedAt});}
 async function sync(){if(!account||busy||conflict||paused)return;busy=true;const gen=generation;emit('syncing');try{
   // Retry a persisted request first: a previous response may have been lost after commit.
   const pending=readMeta().pending;if(pending){try{const r=await api('/api/sync',pending);if(gen!==generation)return;saveMeta({...readMeta(),revision:r.revision,baseline:r.document,dirty:!same(read(),r.document),pending:null});}catch(e){if(gen!==generation)return;if(e.status!==409)throw e;saveMeta({...readMeta(),pending:null});}}
   const remote=await api('/api/sync');if(gen!==generation)return;const m=readMeta(),local=read();
   if(!remote.document){if(isEmpty(local)&&!m.dirty){emit('synced',{updatedAt:null});return;}await upload(remote,gen);return;}
   if(same(local,remote.document)){saveMeta({...m,revision:remote.revision,baseline:remote.document,dirty:false,pending:null});emit('synced',{updatedAt:remote.updatedAt});return;}
   const first=m.baseline===null||m.baseline===undefined;
   if((first&&isEmpty(local)&&!m.dirty)||(!first&&!localChanged())){apply(remote.document,{revision:remote.revision,baseline:remote.document,dirty:false,pending:null});emit('synced',{updatedAt:remote.updatedAt});return;}
   if(!first&&m.revision===remote.revision){await upload(remote,gen);return;}
   conflict=remote;emit('conflict',{remoteRevision:remote.revision});
 }catch(e){if(gen!==generation)return;if(e.status===409){conflict={revision:null};emit('conflict');}else emit(e.status===401?'unauthorized':'error',{message:e.message||'暂时无法同步，本机数据已保留'});}finally{if(gen===generation)busy=false;}}
 async function resolve(choice){if(!account||busy||paused)return;busy=true;const gen=generation;try{const remote=await api('/api/sync');if(gen!==generation)return;archive(structuredClone(read()));if(choice==='remote'){if(!remote.document)throw Error('服务端没有可恢复数据');apply(remote.document,{revision:remote.revision,baseline:remote.document,dirty:false,pending:null});conflict=null;emit('synced',{updatedAt:remote.updatedAt});}else if(choice==='local'){await upload(remote,gen);if(gen===generation)conflict=null;}else throw Error('请选择同步处理方式');}catch(e){if(gen===generation){conflict=conflict||{revision:null};emit(e.status===401?'unauthorized':'conflict',{message:e.message});}}finally{if(gen===generation)busy=false;}}
 return {start(id){generation++;account=id;busy=false;paused=false;conflict=null;emit(id?'pending':'signedOut');},sync,resolve,pause(message){paused=true;emit('localConflict',{message});},resume(){paused=false;conflict=null;},get busy(){return busy;}};
}
