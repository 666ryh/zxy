import test from 'node:test';
import assert from 'node:assert/strict';
import {pickAlbumImage} from '../src/album.js';
test('相册入口只选择一张照片，不请求相机',async()=>{let options;const image=await pickAlbumImage(o=>{options=o;o.success({tempFilePaths:['blob:photo'],tempFiles:[{size:20}]});});assert.deepEqual(options.sourceType,['album']);assert.equal(options.count,1);assert.deepEqual(image,{path:'blob:photo',size:20});});
test('取消选择不报错，权限或读取失败有提示，大图被拒绝',async()=>{assert.equal(await pickAlbumImage(o=>o.fail({errMsg:'chooseImage:fail cancel'})),null);await assert.rejects(pickAlbumImage(o=>o.fail({errMsg:'permission denied'})),/相册/);await assert.rejects(pickAlbumImage(o=>o.success({tempFilePaths:['blob:x'],tempFiles:[{size:16*1024*1024}]})),/15MB/);assert.equal(await pickAlbumImage(o=>o.success({tempFilePaths:[]})),null);});
