<script setup>
import {ref,watch,nextTick} from 'vue';
import {state,key,notify,confirmAction} from '../store.js';
import {replyTo,readConversation} from '../domain/huihui.js';
import AppIcon from './AppIcon.vue';
const messages=ref([]),draft=ref(''),error=ref(''),scrollTop=ref(0),loadError=ref(false);
const chatKey=()=>key()+'-huihui-chat-v1';
async function scrollBottom(){scrollTop.value=0;await nextTick();scrollTop.value=100000+messages.value.length;}
function load(){draft.value='';error.value='';messages.value=[];loadError.value=false;try{messages.value=readConversation(uni.getStorageSync(chatKey()));}catch{loadError.value=true;error.value='聊天记录读取失败，请清空记录后再试。';}scrollBottom();}
watch(key,load,{immediate:true});
watch(()=>state.supportOpen,open=>{if(open){load();scrollBottom();}});
function send(){if(loadError.value)return;try{const next=replyTo(messages.value,draft.value);uni.setStorageSync(chatKey(),JSON.stringify(next));messages.value=next;draft.value='';error.value='';scrollBottom();}catch(e){error.value='未发送：'+e.message;}}
async function clear(){if(!await confirmAction('清空与辉辉的聊天记录？'))return;try{uni.removeStorageSync(chatKey());messages.value=[];error.value='';loadError.value=false;notify('已清空聊天记录');}catch(e){error.value='清空失败：'+e.message;}}
</script>
<template>
 <button v-if="!state.supportOpen" role="button" tabindex="0" class="huihui-float" aria-label="和辉辉聊天" @click="state.supportOpen=true"><AppIcon name="chat" :size="20"/><text>辉辉</text></button>
 <view v-if="state.supportOpen" class="support-overlay" @click.self="state.supportOpen=false">
  <view class="support-panel-new huihui-chat" role="dialog" aria-modal="true" aria-label="辉辉自动回复聊天">
   <view class="support-panel-header"><view class="huihui-avatar">辉</view><view><text>辉辉</text><text>自动回复 · 趣味聊天</text></view><button role="button" tabindex="0" class="text-action" @click="clear">清空</button><button role="button" tabindex="0" class="icon-button" aria-label="关闭客服" @click="state.supportOpen=false"><AppIcon name="close"/></button></view>
   <scroll-view scroll-y :scroll-top="scrollTop" class="huihui-chat-history"><text class="support-system">从预设语句中随机回复 · 记录仅保存在本机</text><view v-if="!messages.length" class="huihui-chat-empty"><AppIcon name="chat" :size="32"/><text>和辉辉说句话吧</text></view><view v-for="(message,index) in messages" :key="index" :class="['huihui-message',message.role]"><view v-if="message.role==='assistant'" class="huihui-message-avatar">辉</view><text class="huihui-message-bubble" selectable>{{message.text}}</text></view><view class="huihui-chat-bottom"/></scroll-view>
   <view class="support-composer huihui-chat-composer"><text v-if="error" class="error" role="alert">{{error}}</text><view class="huihui-send-row"><textarea class="input huihui-message-input" v-model="draft" :maxlength="500" placeholder="发消息给辉辉…" aria-label="聊天消息" confirm-type="send" @confirm="send"/><button role="button" tabindex="0" class="primary" :disabled="!draft.trim()||loadError" @click="send">发送</button></view><text class="huihui-chat-limit">{{draft.length}} / 500</text></view>
  </view>
 </view>
</template>
