<script setup>
import {ref,computed} from 'vue';
import {state,saveProfile,CHARACTER,notify,confirmAction} from '../store.js';
import CharacterImage from './CharacterImage.vue';
import AppIcon from './AppIcon.vue';
const editing=ref(''),value=ref(''),error=ref(''),uploading=ref(false);
const fields=[['name','名字',24],['gender','性别',10],['region','地区',60],['phone','手机号',11],['wechat','微信号',40],['bio','签名',80]];
const field=computed(()=>fields.find(f=>f[0]===editing.value));
function edit(k){editing.value=k;value.value=state.profile[k]||'';error.value='';}
function commit(){try{saveProfile({[editing.value]:value.value});editing.value='';notify('已保存');}catch(e){error.value=e.message;}}
const display=(k)=>{const s=state.profile[k]||'';return k==='phone'&&s?s.slice(0,3)+'****'+s.slice(-4):s||'未填写';};
async function avatar(){
 // #ifdef H5
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;uploading.value=true;let url;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('请选择8MB以内的JPG、PNG或WebP图片');url=URL.createObjectURL(file);const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(Error('图片无法读取'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const side=Math.min(img.width,img.height),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,320,320);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,320,320);saveProfile({avatar:canvas.toDataURL('image/jpeg',.85)});notify('头像已更新');}catch(e){notify(e.message);}finally{if(url)URL.revokeObjectURL(url);uploading.value=false;}};input.click();
 // #endif
 // #ifndef H5
 notify('头像上传将在原生适配阶段接入');
 // #endif
}
async function resetAvatar(){if(await confirmAction('恢复默认库洛米头像？')){try{saveProfile({avatar:''});notify('已恢复');}catch(e){notify(e.message);}}}
</script>
<template><view class="personal-details">
 <view class="detail-navbar"><button role="button" tabindex="0" class="icon-button" aria-label="返回个人中心" @click="editing?editing='':state.profileEditing=false"><AppIcon name="left"/></button><text>{{editing?field?.[1]:'个人资料'}}</text><button v-if="editing" role="button" tabindex="0" class="detail-save" @click="commit">保存</button><view v-else class="nav-spacer"/></view>
 <template v-if="!editing"><view class="detail-list"><button role="button" tabindex="0" class="detail-row avatar-row" :disabled="uploading" @click="avatar"><text>头像</text><view class="detail-value"><CharacterImage class="settings-avatar" :src="state.profile.avatar||CHARACTER" label="个人头像"/><AppIcon name="arrow" :size="17"/></view></button><button role="button" tabindex="0" v-for="[key,label] in fields" :key="key" class="detail-row" @click="edit(key)"><text>{{label}}</text><view class="detail-value"><text>{{display(key)}}</text><AppIcon name="arrow" :size="17"/></view></button></view><text class="detail-caption">手机号和微信号仅作为联系资料保存，不代表已绑定或验证。</text><view class="detail-list"><view class="detail-row"><text>登录邮箱</text><text class="detail-muted">{{state.user?.email||'未登录'}}</text></view><button v-if="state.profile.avatar" role="button" tabindex="0" class="detail-row" @click="resetAvatar"><text>恢复默认头像</text><AppIcon name="arrow" :size="17"/></button></view></template>
 <template v-else><view v-if="editing==='gender'" class="detail-list"><button role="button" tabindex="0" v-for="gender in ['男','女','不透露','未设置']" :key="gender" class="detail-row" @click="value=gender"><text>{{gender}}</text><text v-if="value===gender" class="chosen">✓</text></button></view><view v-else class="detail-edit"><textarea v-if="editing==='bio'" class="input textarea" v-model="value" :maxlength="80" placeholder="填写签名" aria-label="签名"/><input v-else class="input" v-model="value" :type="editing==='phone'?'number':'text'" :maxlength="field?.[2]" :placeholder="'填写'+field?.[1]" :aria-label="field?.[1]"/><text class="detail-caption">{{editing==='region'?'例如：内蒙古 呼和浩特':editing==='phone'?'填写11位手机号，可留空。':editing==='name'?'名字最多24个字。':'修改后点击右上角保存。'}}</text><text v-if="error" class="error" role="alert">{{error}}</text></view></template>
</view></template>
