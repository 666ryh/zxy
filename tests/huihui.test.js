import test from 'node:test';
import assert from 'node:assert/strict';
import {replyTo,readConversation,REPLIES} from '../src/domain/huihui.js';
test('豆包长回复可以保存，用户输入仍限制500字',()=>{assert.equal(readConversation([{role:'assistant',text:'答'.repeat(3000)}])[0].text.length,3000);assert.throws(()=>readConversation([{role:'user',text:'问'.repeat(501)}]));assert.throws(()=>readConversation([{role:'assistant',text:'答'.repeat(4001)}]));});
test('每条输入得到指定语料的回复，避免连续重复',()=>{const first=replyTo([],'  你好  ',()=>0);assert.equal(first[0].text,'你好');assert.equal(first[1].text,'神经病');const second=replyTo(first,'还有呢',()=>0);assert.notEqual(second[3].text,first[1].text);assert.ok(REPLIES.includes(second[3].text));assert.equal(first.length,2);});
test('空消息和超长消息不能发送，聊天历史限制为最近100条',()=>{assert.throws(()=>replyTo([],'  '));assert.throws(()=>replyTo([],'a'.repeat(501)));let history=[];for(let i=0;i<60;i++)history=replyTo(history,String(i));assert.equal(history.length,100);assert.equal(history[0].text,'10');});
test('读取历史验证格式，保留纯文本，拒绝无效角色',()=>{const messages=replyTo([],'<img src=x onerror=alert(1)>',()=>0);assert.deepEqual(readConversation(JSON.stringify(messages)),messages);assert.throws(()=>readConversation('{'));assert.throws(()=>readConversation(JSON.stringify([{role:'system',text:'x'}])));assert.deepEqual(readConversation(''),[]);});
