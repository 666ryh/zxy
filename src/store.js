import {loadAppearance} from './appearance.js';
import {normalizeProfile,patchProfile} from './domain/profile.js';
import {reactive,computed} from 'vue';
import {emptyData,dateKey,addDays,saveStudent,scheduleLessons,transition,parseBackup} from './domain/domain.js';
import {saveSalarySettings,addCommission} from './domain/salary.js';
import {readSaved,writeSaved} from './storage.js';
export const CHARACTER='/static/characters/kuromi-official.png';
export const state=reactive({ready:false,user:null,guest:false,mode:'development',data:emptyData(),profile:normalizeProfile(),loadError:'',tab:'profile',selected:dateKey(),profileEditing:false,supportOpen:false,month:dateKey().slice(0,7),modal:null});
export const key=()=>state.user?`kejian-account-${state.user.email}`:'kejian-data';
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
export async function api(route,body){
 // #ifdef H5
 const response=await fetch(route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const json=await response.json();if(!response.ok)throw Error(json.error||'请求失败');return json;
 // #endif
 // #ifndef H5
 throw Error('当前为H5预览，原生登录服务将在鸿蒙适配阶段配置');
 // #endif
}
export function load(){state.data=emptyData();state.loadError='';state.profile=normalizeProfile();try{state.data=readSaved(get,key());}catch(e){state.loadError=e.message;}try{const p=get(key()+'-profile');if(p){const profile=typeof p==='string'?JSON.parse(p):p;state.profile=normalizeProfile(profile);}}catch{notify('个人资料读取失败，可重新编辑；教学记录不受影响');}}
export function mutate(fn){if(state.loadError)throw Error('原数据读取异常，请先导出原始备份后恢复');const next=JSON.parse(JSON.stringify(state.data));fn(next);writeSaved(set,key(),next);state.data=next;}
export function saveProfile(input){const profile=patchProfile(state.profile,input);set(key()+'-profile',profile);state.profile=profile;}

export function navigate(tab){state.tab=tab;state.modal=null;
 // #ifdef H5
 const route=`#/pages/index/index?tab=${tab}`;if(location.hash!==route)history.replaceState(null,'',route);window.scrollTo(0,0);
 // #endif
}
export async function init(){loadAppearance();try{const r=await api('/api/session');state.user=r.user;state.mode=r.mode;}catch{state.mode='unavailable';}
 // #ifdef H5
 state.guest=sessionStorage.getItem('kejian-guest')==='true';
 const hash=location.hash;const tab=new URLSearchParams(hash.split('?')[1]||'').get('tab')||hash.slice(1);if(['schedule','students','payroll','attendance','profile'].includes(tab))state.tab=tab;
 // #endif
 load();state.ready=true;
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
 load();state.tab='profile';}
export async function signout(){if(state.user)await api('/api/auth/logout',{});state.user=null;state.guest=false;state.modal=null;
 // #ifdef H5
 sessionStorage.removeItem('kejian-guest');
 // #endif
 load();}
export const canDemo=computed(()=>!state.loadError&&!state.data.students.length&&!state.data.lessons.length&&!(state.data.dutyRecords||[]).length&&!Object.keys(state.data.dutyPlans||{}).length&&!Object.keys(state.data.salaryMonths||{}).length&&!(state.data.commissions||[]).length);
export function seedDemo(){if(!canDemo.value)throw Error('仅空数据可加载示例');mutate(d=>{const a=saveStudent(d,{name:'林小满',subject:'数学',rate:'180',billingMinutes:90,selfRecruited:true}),b=saveStudent(d,{name:'陈一诺',subject:'英语',rate:'160',billingMinutes:90}),c=saveStudent(d,{name:'周知夏',subject:'钢琴',rate:'220',billingMinutes:90,selfRecruited:true});for(const[s,start,end]of[[a,'09:00','10:30'],[b,'14:00','15:30'],[c,'17:00','18:30']])scheduleLessons(d,{studentId:s.id,date:dateKey(),start,end,rate:s.rateCents/100,billingMinutes:90,subject:s.subject});for(let i=1;i<=5;i++){const l=scheduleLessons(d,{studentId:i%2?a.id:b.id,date:addDays(dateKey(),-i),start:'10:00',end:'11:30',rate:'180',billingMinutes:90,subject:'个别辅导'})[0];transition(d,l.id,'complete');if(i>2)transition(d,l.id,'paid');}saveSalarySettings(d,dateKey().slice(0,7),{base:'2000',eveningRate:'50',eveningCount:8});addCommission(d,{studentId:a.id,date:dateKey(),amount:'3000',percent:'10'});});notify('示例数据已加入');}
export function download(filename,content,type='application/json'){
 // #ifdef H5
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return;
 // #endif
 // #ifndef H5
 notify('文件导出将在原生适配阶段接入');
 // #endif
}
export function exportBackup(){download(`课笺备份-${dateKey()}.json`,state.loadError?get(key()):JSON.stringify(state.data,null,2));}
export function importBackup(){
 // #ifdef H5
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>5000000)throw Error('文件超过5MB');const d=parseBackup(await file.text());if(!await confirmAction(`恢复${d.students.length}位学生、${d.lessons.length}节课程并替换当前数据？`))return;writeSaved(set,key(),d);state.data=d;state.loadError='';state.modal=null;notify('备份已恢复');}catch(e){notify(e.message);}};input.click();
 // #endif
}

export function studentName(id){return state.data.students.find(s=>s.id===id)?.name||'学生';}
export const statusLabels={scheduled:'待上课',teaching:'上课中',completed:'已完成',cancelled:'已取消',leave:'已请假'};
