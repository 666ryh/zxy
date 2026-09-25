<script setup>
import {ref,computed,watch,nextTick} from 'vue';
import {state,key,notify,confirmAction,saveConversation,api} from '../store.js';
import {WECHAT_ID,openHumanSupport} from '../support.js';
import AppIcon from './AppIcon.vue';
const messages=computed(()=>state.conversation),draft=ref(''),error=ref(''),scrollTop=ref(0),busy=ref(false),human=ref(false);let generation=0;
async function scrollBottom(){scrollTop.value=0;await nextTick();scrollTop.value=100000+messages.value.length;}
function load(){generation++;busy.value=false;draft.value='';error.value='';scrollBottom();}
watch(key,load,{immediate:true});
watch(()=>state.supportOpen,open=>{if(open)scrollBottom();});
watch(messages,scrollBottom);
async function send(){if(busy.value)return;if(!state.user){error.value='请先登录后使用AI客服，也可以直接转人工。';return;}const text=draft.value.trim();if(!text)return;const owner=key(),gen=++generation,baseline=JSON.stringify(messages.value);busy.value=true;error.value='';try{const history=[...messages.value,{role:'user',text}].slice(-100);const result=await api('/api/support/chat',{messages:history},state.user.email);if(key()!==owner||generation!==gen)return;if(JSON.stringify(messages.value)!==baseline)throw Error('聊天记录已在别处更新，请重新发送');saveConversation([...history,{role:'assistant',text:result.text}].slice(-100));draft.value='';scrollBottom();}catch(e){if(key()===owner&&generation===gen)error.value='未完成：'+e.message;}finally{if(generation===gen)busy.value=false;}}
async function clear(){if(busy.value)return;if(!await confirmAction('清空与辉辉的聊天记录？此修改会同步到账号。'))return;try{generation++;saveConversation([]);error.value='';notify('已清空聊天记录');}catch(e){error.value='清空失败：'+e.message;}}
async function transfer(){human.value=true;try{await openHumanSupport({bridge:globalThis.Native,copy:text=>new Promise((resolve,reject)=>uni.setClipboardData({data:text,showToast:false,success:resolve,fail:()=>reject(Error('复制失败，请长按微信号复制'))})),open:url=>{location.href=url;}});notify('微信号已复制，请在微信搜索添加');}catch(e){notify(e.message);}}
</script>
<template>
 <button v-if="!state.supportOpen" role="button" tabindex="0" class="huihui-float" aria-label="和辉辉聊天" @click="state.supportOpen=true"><AppIcon name="chat" :size="20"/><text>辉辉</text></button>
 <view v-if="state.supportOpen" class="support-overlay" @click.self="state.supportOpen=false">
  <view class="support-panel-new huihui-chat" role="dialog" aria-modal="true" aria-label="辉辉AI与人工客服">
   <view class="support-panel-header"><view class="huihui-avatar">辉</view><view><text>辉辉</text><text>豆包AI · 人工微信</text></view><button role="button" tabindex="0" class="text-action" @click="transfer">转人工</button><button role="button" tabindex="0" class="text-action" :disabled="busy" @click="clear">清空</button><button role="button" tabindex="0" class="icon-button" aria-label="关闭客服" @click="state.supportOpen=false"><AppIcon name="close"/></button></view>
   <scroll-view scroll-y :scroll-top="scrollTop" class="huihui-chat-history"><text class="support-system">{{state.user?'豆包AI回答，仅发送最近20条聊天，不读取教学档案。回答仅供参考。':'登录后可向豆包AI提问；转人工无需登录。'}}</text><view v-if="human" class="preview-card"><text selectable>人工微信：{{WECHAT_ID}}</text><text>微信号已尝试复制。若未打开微信，请手动打开微信搜索添加；此入口不能直接定位聊天。</text><button class="secondary" @click="transfer">复制微信号并打开微信</button></view><view v-if="!messages.length" class="huihui-chat-empty"><AppIcon name="chat" :size="32"/><text>和辉辉说句话吧</text></view><view v-for="(message,index) in messages" :key="index" :class="['huihui-message',message.role]"><view v-if="message.role==='assistant'" class="huihui-message-avatar">辉</view><text class="huihui-message-bubble" selectable>{{message.text}}</text></view><text v-if="busy" class="hint">辉辉正在思考…</text><view class="huihui-chat-bottom"/></scroll-view>
   <view class="support-composer huihui-chat-composer"><text v-if="error" class="error" role="alert">{{error}}</text><view class="huihui-send-row"><textarea class="input huihui-message-input" v-model="draft" :disabled="busy" :maxlength="500" placeholder="发消息给辉辉…" aria-label="聊天消息" confirm-type="send" @confirm="send"/><button role="button" tabindex="0" class="primary" :disabled="!draft.trim()||busy" @click="send">{{busy?'回复中…':'发送'}}</button></view><text class="huihui-chat-limit">{{draft.length}} / 500</text></view>
  </view>
 </view>
</template>
