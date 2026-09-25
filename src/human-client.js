export function createHumanClient({api,onChange,id=()=>globalThis.crypto.randomUUID()}){
 let generation=0,cursor=0,account=null,messages=[],thread=null,pending=null,polling=false;
 const emit=()=>onChange({thread,messages:[...messages]});
 function merge(next){const map=new Map(messages.map(m=>[m.id,m]));for(const m of next)map.set(m.id,m);messages=[...map.values()].sort((a,b)=>a.id-b.id);}
 return {
 reset(email){generation++;cursor=0;account=email;messages=[];thread=null;pending=null;polling=false;emit();},
 async start(){const gen=generation,result=await api('/api/human/start',{},account);if(gen!==generation)return;thread=result.thread;emit();},
 async poll(){if(!account||polling)return;polling=true;const gen=generation;try{let more;do{const result=await api('/api/human/thread?after='+cursor,undefined,account);if(gen!==generation)return;thread=result.thread;cursor=Math.max(cursor,...result.messages.map(m=>m.id));merge(result.messages);emit();more=result.hasMore;}while(more);}finally{if(gen===generation)polling=false;}},
 async send(text){const gen=generation;if(!pending||pending.text!==text)pending={requestId:id(),text};const result=await api('/api/human/send',pending,account);if(gen!==generation)return;merge([result.message]);pending=null;emit();}
 };
}
