import {parseBackup,emptyData} from './domain.js';
import {normalizeProfile,patchProfile} from './profile.js';
import {updateAppearance} from './appearance.js';
import {readConversation} from './huihui.js';
export function validateDocument(input){if(!input||typeof input!=='object')throw Error('同步数据格式无效');const raw=JSON.stringify(input);if(new TextEncoder().encode(raw).length>6000000)throw Error('同步数据超过6MB');let appearance={};if(input.appearance!==undefined){if(!input.appearance||typeof input.appearance!=='object'||Array.isArray(input.appearance))throw Error('背景设置格式不正确');for(const [key,value]of Object.entries(input.appearance)){if(key==='all')throw Error('背景页面无效');appearance=updateAppearance(appearance,key,value);}}return {data:parseBackup(JSON.stringify(input.data)),profile:patchProfile(normalizeProfile(),input.profile||{}),appearance,conversation:readConversation(input.conversation)};}
export function emptyDocument(d){const x=d.data;return !x.students.length&&!x.lessons.length&&!(x.commissions||[]).length&&!(x.dutyRecords||[]).length&&!Object.keys(x.salaryMonths||{}).length&&!Object.keys(x.dutyPlans||{}).length&&JSON.stringify(normalizeProfile(d.profile))===JSON.stringify(normalizeProfile())&&!Object.keys(d.appearance||{}).length&&!(d.conversation||[]).length;}
export const newDocument=()=>({data:emptyData(),profile:normalizeProfile(),appearance:{},conversation:[]});
