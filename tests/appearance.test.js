import test from 'node:test';import assert from 'node:assert/strict';
import {updateAppearance,resolveAppearance,PAGE_KEYS} from '../src/domain/appearance.js';
const image='data:image/jpeg;base64,YWJj';
test('每页独立设置，应用全部仍可单页更改',()=>{let a=updateAppearance({},'schedule',{image,opacity:0,tone:'light',fit:'contain'});assert.equal(resolveAppearance(a,'students').image,'');a=updateAppearance(a,'all',{image});a=updateAppearance(a,'students',{image:''});assert.equal(resolveAppearance(a,'students').image,'');assert.equal(resolveAppearance(a,'schedule').image,image);assert.equal(Object.keys(a).length,PAGE_KEYS.length);});
test('拒绝非法图片和越界透明度，不修改原设置',()=>{const a={};assert.throws(()=>updateAppearance(a,'schedule',{image:'javascript:alert(1)'}));assert.throws(()=>updateAppearance(a,'schedule',{opacity:101}));assert.deepEqual(a,{});});
