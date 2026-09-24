<script setup>
import CharacterImage from '../../components/CharacterImage.vue';
import {onMounted,onUnmounted,computed} from 'vue';
import {onLoad,onBackPress} from '@dcloudio/uni-app';
import {state,init,navigate,CHARACTER,cloudClient} from '../../store.js';
import {appearance,wallpaperStyle,themeStyle} from '../../appearance.js';
import {resolveAppearance} from '../../domain/appearance.js';
import BackgroundSettings from '../../components/BackgroundSettings.vue';
import HuihuiSupport from '../../components/HuihuiSupport.vue';
import {cloud} from '../../cloud.js';
import SyncPanel from '../../components/SyncPanel.vue';
import PersonalDetails from '../../components/PersonalDetails.vue';
import AttendanceEditor from '../../components/AttendanceEditor.vue';
import AttendancePage from '../../components/AttendancePage.vue';
import ProfilePage from '../../components/ProfilePage.vue';
import TeachingPages from '../../components/TeachingPages.vue';
import LoginPage from '../../components/LoginPage.vue';
import EditorSheet from '../../components/EditorSheet.vue';
import AppIcon from '../../components/AppIcon.vue';
const wallpaperPage=computed(()=>!state.user&&!state.guest?'login':state.profileEditing?'details':state.tab);
const hasWallpaper=computed(()=>!!resolveAppearance(appearance.pages,wallpaperPage.value).image);
const tabs=[['schedule','课表'],['students','学生'],['payroll','薪资'],['attendance','考勤'],['profile','我的']];
onLoad(options=>{if(tabs.some(t=>t[0]===options.tab))state.tab=options.tab;});
onMounted(()=>{if(!state.ready)init();});
onBackPress(()=>{if(cloud.open){cloud.open=false;return true;}if(appearance.open){appearance.open=false;return true;}if(state.supportOpen){state.supportOpen=false;return true;}if(state.modal){state.modal=null;return true;}if(state.profileEditing){state.profileEditing=false;return true;}return false;});
function escape(e){if(e.key==='Escape'){if(cloud.open){cloud.open=false;return true;}if(appearance.open){appearance.open=false;return;}if(state.supportOpen){state.supportOpen=false;return;}if(state.modal)state.modal=null;else state.profileEditing=false;}}
function hashChanged(){const hash=location.hash;const tab=new URLSearchParams(hash.split('?')[1]||'').get('tab')||hash.slice(1);if(tabs.some(t=>t[0]===tab))navigate(tab);}
function nativeBack(){if(cloud.open){cloud.open=false;return true;}if(appearance.open){appearance.open=false;return true;}if(state.supportOpen){state.supportOpen=false;return true;}if(state.modal){state.modal=null;return true;}if(state.profileEditing){state.profileEditing=false;return true;}if(state.tab!=='schedule'){navigate('schedule');return true;}return false;}
// #ifdef H5
onMounted(()=>{window.closeSheet=nativeBack;window.addEventListener('online',cloudClient.sync);window.addEventListener('storage',cloudClient.changedElsewhere);window.addEventListener('keydown',escape);window.addEventListener('hashchange',hashChanged);});onUnmounted(()=>{delete window.closeSheet;window.removeEventListener('online',cloudClient.sync);window.removeEventListener('storage',cloudClient.changedElsewhere);window.removeEventListener('keydown',escape);window.removeEventListener('hashchange',hashChanged);});
// #endif
</script>
<template><view :class="['app-shell',{'has-wallpaper':hasWallpaper,'details-active':state.profileEditing}]" :style="themeStyle(wallpaperPage)"><view v-if="hasWallpaper" class="page-wallpaper" :style="wallpaperStyle(wallpaperPage)"/><view v-if="hasWallpaper" class="page-wallpaper-shade"/><view v-if="!state.ready" class="loading"><CharacterImage  /><text>正在打开你的教学手账…</text></view><LoginPage v-else-if="!state.user&&!state.guest"/><template v-else><view v-if="state.loadError" class="data-error" @click="state.modal={type:'backup'}">数据读取异常，请先导出原始备份：{{state.loadError}}</view><ProfilePage v-if="state.tab==='profile'"/><AttendancePage v-else-if="state.tab==='attendance'"/><TeachingPages v-else/><view class="bottom-nav" role="navigation" aria-label="主导航"><view v-if="hasWallpaper" class="nav-wallpaper" :style="wallpaperStyle(wallpaperPage)" aria-hidden="true"><view class="nav-wallpaper-shade"/><view class="nav-wallpaper-surface"/></view><button role="button" tabindex="0" v-for="[tab,label] in tabs" :key="tab" :class="{active:state.tab===tab}" @click="navigate(tab)" :aria-label="label"><view class="nav-icon"><AppIcon :name="tab" :size="22"/></view><text>{{label}}</text></button></view></template><HuihuiSupport v-if="state.ready&&(state.user||state.guest)&&!state.profileEditing&&!appearance.open&&!cloud.open&&!state.modal"/><SyncPanel/><EditorSheet/><AttendanceEditor/><PersonalDetails v-if="state.profileEditing"/><BackgroundSettings v-if="appearance.open"/></view></template>
