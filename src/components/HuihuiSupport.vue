<script setup>
import {ref,computed,watch,nextTick,onUnmounted} from 'vue';
import {state,key,notify,confirmAction,saveConversation,api} from '../store.js';
import {createHumanClient} from '../human-client.js';
import AppIcon from './AppIcon.vue';
const human=ref(false),thread=ref(null),humanMessages=ref([]),draft=ref(''),error=ref(''),connectionError=ref(''),scrollTop=ref(0),busy=ref(false);
let generation=0,timer;const messages=computed(()=>human.value?humanMessages.value:state.conversation);
const client=createHumanClient({api,onChange:s=>{thread.value=s.thread;humanMessages.value=s.messages;}});
async function scrollBottom(){scrollTop.value=0;await nextTick();scrollTop.value=100000+messages.value.length;}
function reset(){generation++;busy.value=false;draft.value='';error.value='';connectionError.value='';human.value=false;client.reset(state.user?.email);clearTimeout(timer);}
async function poll(){clearTimeout(timer);const gen=generation;if(!state.supportOpen||!state.user)return;try{if(typeof document==='undefined'||!document.hidden){await client.poll();if(gen===generation)connectionError.value='';}}catch(e){if(gen===generation)connectionError.value='连接中断，将自动重试：'+e.message;}finally{if(gen===generation&&state.supportOpen)timer=setTimeout(poll,2000);}}
watch(key,()=>{reset();if(state.supportOpen)poll();},{immediate:true});
watch(()=>state.supportOpen,async open=>{clearTimeout(timer);if(open){const gen=generation;await poll();if(gen===generation&&thread.value?.status==='open')human.value=true;scrollBottom();}},{immediate:true});
watch(()=>messages.value.length,scrollBottom);onUnmounted(()=>{generation++;clearTimeout(timer);});
async function transfer(){if(!state.user){error.value='请先登录后联系人工客服';return;}if(busy.value)return;busy.value=true;error.value='';const gen=generation;try{await client.start();if(gen!==generation)return;human.value=true;draft.value='';await client.poll();scrollBottom();}catch(e){if(gen===generation)error.value=e.message;}finally{if(gen===generation)busy.value=false;}}
function backToAi(){if(busy.value)return;human.value=false;draft.value='';error.value='';scrollBottom();}
async function send(){if(busy.value)return;if(!state.user){error.value='请先登录后咨询';return;}const text=draft.value.trim();if(!text)return;const owner=key(),gen=++generation,baseline=JSON.stringify(state.conversation);busy.value=true;error.value='';clearTimeout(timer);try{if(human.value){await client.send(text);}else{const history=[...state.conversation,{role:'user',text}].slice(-100);const result=await api('/api/support/chat',{messages:history},state.user.email);if(key()!==owner||generation!==gen)return;if(JSON.stringify(state.conversation)!==baseline)throw Error('聊天记录已在别处更新，请重新发送');saveConversation([...history,{role:'assistant',text:result.text}].slice(-100));}if(key()===owner&&generation===gen){draft.value='';scrollBottom();}}catch(e){if(key()===owner&&generation===gen)error.value='未发送成功：'+e.message;}finally{if(generation===gen){busy.value=false;poll();}}}
async function clear(){if(busy.value||human.value)return;if(!await confirmAction('清空AI聊天记录？人工会话记录会保留。'))return;try{generation++;saveConversation([]);error.value='';notify('已清空AI记录');poll();}catch(e){error.value=e.message;}}
</script>
<template>
 <button role="button" tabindex="0" v-if="!state.supportOpen" class="huihui-float" aria-label="和辉辉聊天" @click="state.supportOpen=true"><AppIcon name="chat" :size="20"/><text>辉辉</text></button>
 <view v-if="state.supportOpen" class="support-overlay" @click.self="state.supportOpen=false">
  <view class="support-panel-new huihui-chat" role="dialog" aria-modal="true" aria-label="辉辉AI与人工客服">
   <view class="support-panel-header"><view class="huihui-avatar">辉</view><view><text>辉辉</text><text>{{human?'人工客服':'豆包AI助手'}}</text></view><button role="button" tabindex="0" class="text-action" :disabled="busy" @click="human?backToAi():transfer()">{{human?'返回AI':'转人工'}}</button><button role="button" tabindex="0" v-if="!human" class="text-action" :disabled="busy" @click="clear">清空</button><button role="button" tabindex="0" class="icon-button" aria-label="关闭客服" @click="state.supportOpen=false"><AppIcon name="close"/></button></view>
   <scroll-view scroll-y :scroll-top="scrollTop" class="huihui-chat-history">
    <text class="support-system">{{human?'消息由真人客服接收，回复后会在这里显示。离开后记录仍会保留。':'豆包AI回答，仅发送最近20条聊天，不读取教学档案。回答仅供参考。'}}</text>
    <view v-if="human&&thread?.status==='closed'" class="preview-card"><text>本次会话已结束，仍可查看历史消息。</text><button role="button" tabindex="0" class="secondary" :disabled="busy" @click="transfer">再次联系人工</button></view>
    <view v-if="!messages.length" class="huihui-chat-empty"><AppIcon name="chat" :size="32"/><text>{{human?'请描述你遇到的问题，客服会尽快回复。':'和辉辉说句话吧'}}</text></view>
    <view v-for="(message,index) in messages" :key="message.id||index" :class="['huihui-message',message.role]"><view v-if="message.role!=='user'" class="huihui-message-avatar">{{human?'客':'辉'}}</view><text class="huihui-message-bubble" selectable>{{message.text}}</text></view>
    <text v-if="busy" class="hint">{{human?'正在发送…':'辉辉正在思考…'}}</text><view class="huihui-chat-bottom"/>
   </scroll-view>
   <view class="support-composer huihui-chat-composer"><text v-if="error||(human&&connectionError)" class="error" role="alert">{{error||connectionError}}</text><view class="huihui-send-row"><textarea class="input huihui-message-input" v-model="draft" :disabled="busy||(human&&thread?.status==='closed')" :maxlength="human?2000:500" :placeholder="human?'给人工客服留言…':'发消息给辉辉…'" aria-label="聊天消息" confirm-type="send" @confirm="send"/><button role="button" tabindex="0" class="primary" :disabled="!draft.trim()||busy||(human&&thread?.status==='closed')" @click="send">发送</button></view><text class="huihui-chat-limit">{{draft.length}} / {{human?2000:500}}</text></view>
  </view>
 </view>
</template>
