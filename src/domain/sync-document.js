import {parseBackup,emptyData} from './domain.js';
import {normalizeProfile,patchProfile} from './profile.js';
export function validateDocument(input){if(!input||typeof input!=='object')throw Error('同步数据格式无效');const raw=JSON.stringify(input);if(new TextEncoder().encode(raw).length>6000000)throw Error('同步数据超过6MB');return {data:parseBackup(JSON.stringify(input.data)),profile:patchProfile(normalizeProfile(),input.profile||{})};}
export function emptyDocument(d){const x=d.data;return !x.students.length&&!x.lessons.length&&!(x.commissions||[]).length&&!(x.dutyRecords||[]).length&&!Object.keys(x.salaryMonths||{}).length&&!Object.keys(x.dutyPlans||{}).length&&JSON.stringify(normalizeProfile(d.profile))===JSON.stringify(normalizeProfile());}
export const newDocument=()=>({data:emptyData(),profile:normalizeProfile()});
