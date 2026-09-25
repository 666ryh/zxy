import {loadAppearance,appearance,bindAppearance} from './appearance.js';
import {readConversation} from './domain/huihui.js';
import {cloud,createLocalCloud,decodeCache} from './cloud.js';
import {validateDocument} from './domain/sync-document.js';
import {migrateLegacyData,exportNative} from './native.js';
import {normalizeProfile,patchProfile} from './domain/profile.js';
import {reactive,computed} from 'vue';
import {emptyData,dateKey,addDays,saveStudent,scheduleLessons,transition,parseBackup} from './domain/domain.js';
import {saveSalarySettings,addCommission} from './domain/salary.js';
import {readSaved,writeSaved} from './storage.js';
export const CHARACTER='/static/characters/kuromi-official.png';
export const state=reactive({ready:false,user:null,guest:false,mode:'development',data:emptyData(),profile:normalizeProfile(),conversation:[],loadError:'',tab:'profile',selected:dateKey(),profileEditing:false,supportOpen:false,month:dateKey().slice(0,7),modal:null});
export const key=()=>state.user?`kejian-account-${state.user.email}`:'kejian-data';
export const cloudClient=createLocalCloud({api,get,set,canSync:()=>!state.modal&&!state.profileEditing,onApply:applyDocument});
function get(k){let result;
 // #ifdef H5
 result=localStorage.getItem(k);if(result){try{const wrapped=JSON.parse(result);if(wrapped?.type&&Object.hasOwn(wrapped,'data'))return wrapped.data;}catch{}return result;}
 // #endif
 return uni.getStorageSync(k);
}
function set(k,value){
 // #ifdef H5
 localStorage.setItem(k,typeof value==='string'?value:JSON.stringify(value));return;
 // #endif
 // #ifndef H5
 uni.setStorageSync(k,value);
 // #endif
}
export function notify(title){uni.showToast({title,icon:'none',duration:2600});}
export async function confirmAction(content){return new Promise(resolve=>uni.showModal({title:'请确认',content,confirmColor:'#7952a5',success:r=>resolve(r.confirm),fail:()=>resolve(false)}));}
export async function api(route,body,expectedAccount){
 // #ifdef H5
 const owner=expectedAccount||(route.startsWith('/api/sync')?state.user?.email:null);const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(owner?{'X-Sync-Account':owner}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});const json=await response.json();if(!response.ok){const e=Error(json.error||'请求失败');e.status=response.status;throw e;}return json;}finally{clearTimeout(timeout);}
 // #endif
 // #ifndef H5
 throw Error('当前为H5预览，原生登录服务将在鸿蒙适配阶段配置');
 // #endif
}
export function currentDocument(){return JSON.parse(JSON.stringify({data:state.data,profile:state.profile,appearance:appearance.pages,conversation:state.conversation}));}
function applyDocument(document){state.data=document.data;state.profile=document.profile;state.conversation=document.conversation||[];appearance.pages=document.appearance||{};}
function saveDocument(document){const next=validateDocument(document);if(state.loadError)throw Error('原数据读取异常，请先导出原始备份后恢复');if(cloudClient.active)cloudClient.save(next);else{writeSaved(set,key(),next.data);set(key()+'-profile',next.profile);set(key()+'-huihui-chat-v1',JSON.stringify(next.conversation));}applyDocument(next);}
export function load(){
 cloudClient.detach();bindAppearance(null);state.data=emptyData();state.loadError='';state.profile=normalizeProfile();state.conversation=[];appearance.pages={};
 if(!state.user)loadAppearance();
 try{state.data=readSaved(get,key());}catch(e){state.loadError=e.message;}
 try{const p=get(key()+'-profile');if(p)state.profile=normalizeProfile(typeof p==='string'?JSON.parse(p):p);}catch{notify('个人资料读取失败，可重新编辑；教学记录不受影响');}
 try{state.conversation=readConversation(get(key()+'-huihui-chat-v1'));}catch(e){state.loadError=e.message;}
 if(state.user){try{const cached=get(key()+'-sync-v1');if(!state.loadError||cached){applyDocument(cloudClient.attach(state.user.email,currentDocument()));state.loadError='';}}catch(e){state.loadError=e.message;cloudClient.detach();}bindAppearance(pages=>saveDocument({...currentDocument(),appearance:pages}));}
}
export function mutate(fn){const next=JSON.parse(JSON.stringify(state.data));fn(next);saveDocument({...currentDocument(),data:next});}
export function saveProfile(input){saveDocument({...currentDocument(),profile:patchProfile(state.profile,input)});}
export function saveConversation(messages){saveDocument({...currentDocument(),conversation:readConversation(messages)});}
export function restoreDocument(document){const next=validateDocument(document);if(cloudClient.active)cloudClient.archiveCurrent();const previousError=state.loadError;state.loadError='';try{saveDocument(next);if(!state.user)set('kejian-appearance-v1',JSON.stringify(next.appearance));}catch(e){state.loadError=previousError;throw e;}}

export function navigate(tab){state.tab=tab;state.modal=null;
 // #ifdef H5
 const route=`#/pages/index/index?tab=${tab}`;if(location.hash!==route)history.replaceState(null,'',route);window.scrollTo(0,0);
 // #endif
}
export async function init(){loadAppearance();let migrationError='';try{const r=await api('/api/session');state.user=r.user;state.mode=r.mode;cloud.environment=r.syncEnvironment||'local';}catch{state.mode='unavailable';}
 // #ifdef H5
 state.guest=sessionStorage.getItem('kejian-guest')==='true';
 if(window.Native?.isOffline?.()){state.mode='offline';state.guest=true;try{migrateLegacyData(window.Native,get,set);}catch(e){migrationError='旧版数据迁移失败：'+e.message;}}
 window.nativeFeedback=notify;
 const hash=location.hash;const tab=new URLSearchParams(hash.split('?')[1]||'').get('tab')||hash.slice(1);if(['schedule','students','payroll','attendance','profile'].includes(tab))state.tab=tab;
 // #endif
 load();if(migrationError)state.loadError=migrationError;state.ready=true;
}
export function enterGuest(){state.guest=true;
 // #ifdef H5
 sessionStorage.setItem('kejian-guest','true');
 // #endif
 load();}
export async function login(email,code){const r=await api('/api/auth/verify',{email,code});state.user=r.user;state.guest=false;
 // #ifdef H5
 sessionStorage.removeItem('kejian-guest');
 // #endif
 load();await cloudClient.sync();state.tab='profile';}
export async function signout(){if(state.user){try{await cloudClient.flush();}catch(e){if(cloud.status!=='unauthorized')throw e;notify('登录已过期，待上传数据已保留，请重新登录同一邮箱');}}cloudClient.detach();try{if(state.user)await api('/api/auth/logout',{});}catch(e){load();throw e;}state.user=null;state.guest=false;state.modal=null;cloud.open=false;
 // #ifdef H5
 sessionStorage.removeItem('kejian-guest');
 // #endif
 load();}
export const canDemo=computed(()=>!state.loadError&&!state.data.students.length&&!state.data.lessons.length&&!(state.data.dutyRecords||[]).length&&!Object.keys(state.data.dutyPlans||{}).length&&!Object.keys(state.data.salaryMonths||{}).length&&!(state.data.commissions||[]).length);
export function seedDemo(){if(!canDemo.value)throw Error('仅空数据可加载示例');mutate(d=>{const a=saveStudent(d,{name:'林小满',subject:'数学',rate:'180',billingMinutes:90,selfRecruited:true}),b=saveStudent(d,{name:'陈一诺',subject:'英语',rate:'160',billingMinutes:90}),c=saveStudent(d,{name:'周知夏',subject:'钢琴',rate:'220',billingMinutes:90,selfRecruited:true});for(const[s,start,end]of[[a,'09:00','10:30'],[b,'14:00','15:30'],[c,'17:00','18:30']])scheduleLessons(d,{studentId:s.id,date:dateKey(),start,end,rate:s.rateCents/100,billingMinutes:90,subject:s.subject});for(let i=1;i<=5;i++){const l=scheduleLessons(d,{studentId:i%2?a.id:b.id,date:addDays(dateKey(),-i),start:'10:00',end:'11:30',rate:'180',billingMinutes:90,subject:'个别辅导'})[0];transition(d,l.id,'complete');if(i>2)transition(d,l.id,'paid');}saveSalarySettings(d,dateKey().slice(0,7),{base:'2000',eveningRate:'50',eveningCount:8});addCommission(d,{studentId:a.id,date:dateKey(),amount:'3000',percent:'10'});});notify('示例数据已加入');}
export function download(filename,content,type='application/json'){
 // #ifdef H5
 if(exportNative(window.Native,filename,content,type))return;
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return;
 // #endif
 // #ifndef H5
 notify('文件导出将在原生适配阶段接入');
 // #endif
}
export function exportBackup(){download(`艳の辉备份-${dateKey()}.json`,state.loadError?(get(key()+'-sync-v1')||get(key())||globalThis.Native?.load?.()||''):JSON.stringify(currentDocument(),null,2));}
export function importBackup(){
 // #ifdef H5
 const owner=key();const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>20000000)throw Error('备份文件无效或过大');let raw=decodeCache(await file.text());if(Array.isArray(raw)){if(!raw.length)throw Error('备份文件无效或过大');if(!await confirmAction('此文件含多个恢复点，是否使用最新的恢复点？'))return;raw=raw[0].document;}if(raw?.document)raw=raw.document;const doc=raw?.data?validateDocument(raw):validateDocument({...currentDocument(),data:parseBackup(JSON.stringify(raw))});if(!await confirmAction(`恢复${doc.data.students.length}位学生、${doc.data.lessons.length}节课程并替换当前数据？`))return;if(key()!==owner)throw Error('账号已切换，请重新选择备份');if(state.loadError&&state.user){const broken=get(key()+'-sync-v1');if(broken)set(key()+'-broken-sync-'+Date.now(),broken);const seed={document:doc,meta:{revision:0,baseline:null,dirty:true,pending:null}};set(key()+'-sync-v1',JSON.stringify(seed));load();}else{restoreDocument(doc);state.loadError='';}state.modal=null;notify('备份已恢复');}catch(e){notify(e.message);}};input.click();
 // #endif
}

export function studentName(id){return state.data.students.find(s=>s.id===id)?.name||'学生';}
export const statusLabels={scheduled:'待上课',teaching:'上课中',completed:'已完成',cancelled:'已取消',leave:'已请假'};
