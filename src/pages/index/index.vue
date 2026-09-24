<script setup>
import CharacterImage from '../../components/CharacterImage.vue';
import {onMounted,onUnmounted} from 'vue';
import {onLoad,onBackPress} from '@dcloudio/uni-app';
import {state,init,navigate,CHARACTER} from '../../store.js';
import PersonalDetails from '../../components/PersonalDetails.vue';
import AttendanceEditor from '../../components/AttendanceEditor.vue';
import AttendancePage from '../../components/AttendancePage.vue';
import ProfilePage from '../../components/ProfilePage.vue';
import TeachingPages from '../../components/TeachingPages.vue';
import LoginPage from '../../components/LoginPage.vue';
import EditorSheet from '../../components/EditorSheet.vue';
import AppIcon from '../../components/AppIcon.vue';
const tabs=[['schedule','课表'],['students','学生'],['payroll','薪资'],['attendance','考勤'],['profile','我的']];
onLoad(options=>{if(tabs.some(t=>t[0]===options.tab))state.tab=options.tab;});
onMounted(()=>{if(!state.ready)init();});
onBackPress(()=>{if(state.modal){state.modal=null;return true;}if(state.profileEditing){state.profileEditing=false;return true;}return false;});
function escape(e){if(e.key==='Escape'){if(state.modal)state.modal=null;else state.profileEditing=false;}}
function hashChanged(){const hash=location.hash;const tab=new URLSearchParams(hash.split('?')[1]||'').get('tab')||hash.slice(1);if(tabs.some(t=>t[0]===tab))navigate(tab);}
// #ifdef H5
onMounted(()=>{window.addEventListener('keydown',escape);window.addEventListener('hashchange',hashChanged);});onUnmounted(()=>{window.removeEventListener('keydown',escape);window.removeEventListener('hashchange',hashChanged);});
// #endif
</script>
<template><view class="app-shell"><view v-if="!state.ready" class="loading"><CharacterImage  /><text>正在打开你的教学手账…</text></view><LoginPage v-else-if="!state.user&&!state.guest"/><template v-else><view v-if="state.loadError" class="data-error" @click="state.modal={type:'backup'}">数据读取异常，请先导出原始备份：{{state.loadError}}</view><ProfilePage v-if="state.tab==='profile'"/><AttendancePage v-else-if="state.tab==='attendance'"/><TeachingPages v-else/><view class="bottom-nav" role="navigation" aria-label="主导航"><button role="button" tabindex="0" v-for="[tab,label] in tabs" :key="tab" :class="{active:state.tab===tab}" @click="navigate(tab)" :aria-label="label"><view class="nav-icon"><AppIcon :name="tab" :size="22"/></view><text>{{label}}</text></button></view></template><EditorSheet/><AttendanceEditor/><PersonalDetails v-if="state.profileEditing"/></view></template>
