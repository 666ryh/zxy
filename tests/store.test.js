import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyData} from '../src/domain/domain.js';
const entries=new Map();
globalThis.localStorage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)};
globalThis.uni={getStorageSync:k=>entries.get(k),setStorageSync:(k,v)=>entries.set(k,v),showToast(){}};
const {state,load,mutate}=await import('../src/store.js');
test('损坏的个人签名资料不能阻止有效的教学数据保存',()=>{entries.set('kejian-data',JSON.stringify(emptyData()));entries.set('kejian-data-profile','{');load();assert.equal(state.loadError,'');mutate(d=>{d.salaryMonths={'2026-09':{baseCents:200000,eveningRateCents:5000,eveningCount:2}};});assert.equal(JSON.parse(entries.get('kejian-data')).salaryMonths['2026-09'].eveningCount,2);});
