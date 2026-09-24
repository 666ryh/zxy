import test from 'node:test';
import assert from 'node:assert/strict';
import {readSaved,writeSaved} from '../src/storage.js';
import {emptyData} from '../src/domain/domain.js';
test('读取旧H5字符串与UniApp包装对象均保留原数据，不主动写回',()=>{const d=emptyData();const map=new Map([['kejian-data',JSON.stringify(d)]]);const get=k=>map.get(k);assert.deepEqual(readSaved(get,'kejian-data'),d);map.set('kejian-data',d);assert.deepEqual(readSaved(get,'kejian-data'),d);assert.deepEqual(readSaved(get,'another'),d);});
test('损坏数据抛错，写入失败不返回伪成功',()=>{assert.throws(()=>readSaved(()=>'{','key'));assert.throws(()=>writeSaved(()=>{throw Error('quota');},'key',emptyData()),/quota/);});
