<script setup>
import {ref,onMounted,watch} from 'vue';
import {state,api,notify} from '../store.js';
import AppIcon from './AppIcon.vue';
const config=ref({configured:false}),loading=ref(true),error=ref('');
async function load(){loading.value=true;error.value='';try{config.value=await api('/api/support/config');}catch{error.value='客服配置暂时无法读取，请稍后重试。';}finally{loading.value=false;}}
function contact(){if(loading.value){notify('正在读取客服信息，请稍后再点');return;}if(!config.value.configured){state.supportOpen=true;return;}
 // #ifdef H5
 window.open(config.value.url,'_blank','noopener,noreferrer');
 // #endif
}
function copy(){uni.setClipboardData({data:config.value.qq,success:()=>notify('已复制 QQ 号'),fail:()=>notify('请手动复制下方QQ号')});}
onMounted(load);
watch(()=>state.supportOpen,open=>{if(open&&!config.value.configured)load();});
</script>
<template><button v-if="!state.supportOpen" role="button" tabindex="0" class="huihui-float" aria-label="QQ联系辉辉" @click="contact" @longpress="state.supportOpen=true"><AppIcon name="chat" :size="20"/><text>辉辉</text></button><view v-if="state.supportOpen" class="support-overlay" @click.self="state.supportOpen=false"><view class="support-panel-new"><view class="support-panel-header"><view class="huihui-avatar">辉</view><view><text>辉辉 · QQ客服</text><text>{{loading?'正在读取配置':config.configured?'点击进入 QQ 聊天':'等待配置接待 QQ 号'}}</text></view><button role="button" tabindex="0" class="icon-button" aria-label="关闭客服" @click="state.supportOpen=false"><AppIcon name="close"/></button></view><view class="support-conversation"><text class="note">{{config.configured?'聊天在 QQ 中进行，由辉辉本人回复。':'尚未填写辉辉的 QQ 号，配置后点击悬浮按钮即可打开 QQ 聊天。'}}</text><text v-if="config.qq" class="wechat-phone" selectable>{{config.qq}}</text><text v-if="error" class="error">{{error}}</text><view v-if="config.configured" class="two-buttons"><button role="button" tabindex="0" class="secondary" @click="copy">复制 QQ 号</button><button role="button" tabindex="0" class="primary" @click="contact">打开 QQ</button></view><button v-else role="button" tabindex="0" class="secondary full" @click="load">重新读取配置</button><text class="hint">需要安装并登录 QQ；若浏览器未能唤起，可在 QQ 内搜索号码。陌生人会话是否可用取决于 QQ 账号设置。</text></view></view></view></template>
