import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import mysql from 'mysql2/promise';
import {openDatabase} from '../server/database.js';
import {createHumanSupport} from '../server/human-support.js';
test('人工客服真实MySQL：双向通信、权限、重试、已读、关闭重开、持久化',{skip:process.env.MYSQL_TEST!=='true'},async()=>{
 const admin=JSON.parse(readFileSync('server/data/mysql-admin.json','utf8'));const root=await mysql.createConnection(admin);const name='huihui_test_'+randomBytes(6).toString('hex');let db;
 try{
  await root.query('CREATE DATABASE '+name+' CHARACTER SET utf8mb4');db=await openDatabase({...admin,database:name});
  const a=await db.accounts.login('a@example.com','a'.repeat(64),Date.now()),b=await db.accounts.login('b@example.com','b'.repeat(64),Date.now()),staff=await db.accounts.login('staff@example.com','c'.repeat(64),Date.now());
  await root.query('ALTER DATABASE '+name+' COLLATE utf8mb4_unicode_ci');
  let human=await createHumanSupport(db.pool,{staffEmails:'staff@example.com'});
  assert.equal(human.isStaff(a),false);assert.equal(human.isStaff(staff),true);assert.equal((await human.getOwn(a,0)).thread,null);
  await assert.rejects(()=>human.list(a,{}),e=>e.status===403);
  const {thread}=await human.start(a);assert.equal((await human.start(a)).thread.id,thread.id);
  const sent=await human.send(a,null,{requestId:'user-one',text:'你好客服'});assert.equal(sent.message.role,'user');
  assert.equal((await human.send(a,null,{requestId:'user-one',text:'你好客服'})).message.id,sent.message.id);
  await assert.rejects(()=>human.send(a,null,{requestId:'user-one',text:'换内容'}),e=>e.status===409);
  assert.equal((await human.getOwn(b,0)).thread,null);await assert.rejects(()=>human.getStaff(b,thread.id,0),e=>e.status===403);
  assert.equal((await human.list(staff,{})).threads[0].unread,1);
  await human.markRead(staff,thread.id,sent.message.id);assert.equal((await human.list(staff,{})).threads[0].unread,0);
  const reply=await human.send(staff,thread.id,{requestId:'staff-one',text:'请问有什么需要帮助？'});
  assert.equal((await human.getOwn(a,sent.message.id)).messages[0].id,reply.message.id);
  await human.close(staff,thread.id);await assert.rejects(()=>human.send(a,null,{requestId:'closed',text:'关闭后'}),e=>e.status===409);
  assert.equal((await human.send(staff,thread.id,{requestId:'staff-one',text:'请问有什么需要帮助？'})).message.id,reply.message.id);
  await human.start(a);assert.equal((await human.getOwn(a,0)).messages.length,2);
  await assert.rejects(()=>human.send(a,null,{requestId:'bad',text:'x'.repeat(2001)}),e=>e.status===400);
  await assert.rejects(()=>human.getOwn(a,'-1'),e=>e.status===400);
  await db.close();db=await openDatabase({...admin,database:name});human=await createHumanSupport(db.pool,{staffEmails:'staff@example.com'});
  assert.equal((await human.getOwn(a,0)).messages[1].text,'请问有什么需要帮助？');
  console.log('Human support MySQL integration passed');
 }finally{await db?.close();await root.query('DROP DATABASE '+name);await root.end();}
});
