import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProfile,patchProfile} from '../src/domain/profile.js';
test('单独修改性别不丢失旧名字和签名，资料手机号未填允许',()=>{const p=normalizeProfile({name:'老师',bio:'签名'});const next=patchProfile(p,{gender:'女'});assert.equal(next.name,'老师');assert.equal(next.bio,'签名');assert.equal(next.gender,'女');assert.equal(next.phone,'');});
test('拒绝空名字、非法手机号和可执行头像URL',()=>{const p=normalizeProfile({name:'老师'});assert.throws(()=>patchProfile(p,{name:'  '}));assert.throws(()=>patchProfile(p,{phone:'123'}));assert.throws(()=>patchProfile(p,{avatar:'javascript:alert(1)'}));});
