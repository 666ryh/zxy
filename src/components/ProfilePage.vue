<script setup>
import CharacterImage from './CharacterImage.vue';
import {appearance} from '../appearance.js';
import {ref,computed} from 'vue';
import {state,CHARACTER,navigate,studentName,statusLabels} from '../store.js';
import {summary,money,dateKey} from '../domain/domain.js';
import {salarySummary} from '../domain/salary.js';
import AppIcon from './AppIcon.vue';
const section=ref('home');
const stats=computed(()=>summary(state.data,dateKey().slice(0,7)));
const salary=computed(()=>salarySummary(state.data,dateKey().slice(0,7)));
const recent=computed(()=>[...state.data.lessons].filter(l=>l.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8));
const services=[['appearance','settings','页面背景','每页图片、透明度与文字颜色'],['salary','payroll','薪资设置','底薪、晚辅与招生提成'],['attendance','attendance','我的考勤','记录每一次认真'],['backup','download','数据与备份','给教学手账留一份副本'],['support','chat','联系辉辉','打开 QQ 聊天'],['about','star','关于课笺','我的紫色教学手账']];
function open(action){if(action==='appearance'){appearance.open=true;return;}if(action==='support'){state.supportOpen=true;return;}if(action==='attendance')navigate('attendance');else{if(action==='salary')state.month=dateKey().slice(0,7);state.modal={type:action};}}
</script>
<template>
 <view class="profile-page">
  <view class="profile-cover">
   <view class="cover-nav"><text class="cover-title">我的主页</text><button role="button" tabindex="0" class="cover-settings" aria-label="设置与服务" @click="section='services'"><AppIcon name="settings" /></button></view>
   <view class="cover-orbit orbit-one"></view><view class="cover-orbit orbit-two"></view><text class="cover-spark spark-one">✦</text><text class="cover-spark spark-two">✧</text>
   <view class="cover-copy"><text class="cover-small">留一点可爱，给自己</text><text class="cover-word">每一份热爱<br/>都有回响。</text></view>
   <CharacterImage  class="cover-kuromi"  />
   <text class="cover-caption">MY LITTLE TEACHING DIARY</text>
  </view>
  <view class="profile-body">
   <view class="identity-card">
    <view class="identity-top"><view class="profile-avatar"><CharacterImage :src="state.profile.avatar||CHARACTER" label="个人头像" /></view><button role="button" tabindex="0" class="edit-profile" @click="state.profileEditing=true"><AppIcon name="edit" :size="15" />编辑资料</button></view>
    <text class="profile-name">{{state.profile.name}}</text>
    <view class="identity-tags"><text class="identity-tag">教师的日常</text><text class="identity-tag light">{{state.user?'邮箱已登录':'访客体验'}}</text></view>
    <text class="profile-bio">{{state.profile.bio||'这里，装着我的教学与生活。'}}</text>
    <view class="profile-stats"><button role="button" tabindex="0" @click="navigate('students')"><text class="stat-value">{{state.data.students.filter(s=>!s.archived).length}}</text><text>我的学生</text></button><button role="button" tabindex="0" @click="navigate('schedule')"><text class="stat-value">{{stats.completed}}</text><text>本月授课</text></button><button role="button" tabindex="0" @click="navigate('attendance')"><text class="stat-value">{{stats.days}}</text><text>出勤天数</text></button></view>
   </view>
   <view class="profile-tabs"><button role="button" tabindex="0" v-for="[key,label] in [['home','主页'],['records','授课记录'],['services','常用服务']]" :key="key" :class="{selected:section===key}" @click="section=key">{{label}}<view v-if="section===key" class="tab-underline" /></button></view>
   <view v-if="section==='home'" class="profile-section">
    <view class="section-head"><text class="section-name">我的教学收藏夹</text><text class="subtle">把日常，整理成喜欢的样子</text></view>
    <view class="collection-grid"><button role="button" tabindex="0" class="collection-card" @click="navigate('schedule')"><view class="collection-art art-calendar"><AppIcon name="schedule" :size="36"/><text class="art-date">{{new Date().getDate()}}</text></view><text class="collection-title">我的课表</text><text class="collection-sub">按自己的节奏上课</text></button><button role="button" tabindex="0" class="collection-card" @click="navigate('students')"><view class="collection-art art-students"><CharacterImage   /></view><text class="collection-title">学生档案</text><text class="collection-sub">陪伴每一点小进步</text></button></view>
    <button role="button" tabindex="0" class="profile-income" @click="navigate('payroll')"><view class="income-icon"><AppIcon name="payroll" :size="26"/></view><view class="income-copy"><text class="income-label">{{new Date().getMonth()+1}}月的努力，正在积攒</text><text class="income-number">¥{{money(salary.total)}}</text></view><AppIcon name="arrow" :size="18"/></button>
    <view class="section-head"><text class="section-name">最近的教学足迹</text><button role="button" tabindex="0" class="text-action" @click="section='records'">全部 <AppIcon name="arrow" :size="13"/></button></view>
    <view v-if="!recent.length" class="profile-empty"><AppIcon name="heart" :size="28"/><text>第一节完成的课，会被好好记在这里。</text><button role="button" tabindex="0" class="text-action" @click="navigate('schedule')">去安排课程</button></view>
    <button role="button" tabindex="0" v-for="l in recent.slice(0,3)" :key="l.id" class="footprint" @click="state.modal={type:'lesson-detail',id:l.id}"><view class="footprint-date"><text>{{Number(l.date.slice(8))}}</text><text>{{Number(l.date.slice(5,7))}}月</text></view><view class="footprint-main"><text>{{studentName(l.studentId)}} · {{l.subject||'个别辅导'}}</text><text>{{l.start}}—{{l.end}} · 已完成</text></view><AppIcon name="arrow" :size="15"/></button>
   </view>
   <view v-else-if="section==='records'" class="profile-section"><view class="section-head"><text class="section-name">认真上过的每一节课</text><text class="subtle">最近8条</text></view><view v-if="!recent.length" class="empty-state"><text>还没有已完成的授课记录</text><button role="button" tabindex="0" class="primary" @click="navigate('schedule')">去课表看看</button></view><button role="button" tabindex="0" v-for="l in recent" :key="l.id" class="footprint" @click="state.modal={type:'lesson-detail',id:l.id}"><view class="footprint-date"><text>{{Number(l.date.slice(8))}}</text><text>{{Number(l.date.slice(5,7))}}月</text></view><view class="footprint-main"><text>{{studentName(l.studentId)}} · {{l.subject||'辅导'}}</text><text>{{l.start}}—{{l.end}} · {{statusLabels[l.status]}}</text></view><AppIcon name="arrow" :size="16"/></button></view>
   <view v-else class="profile-section"><view class="section-head"><text class="section-name">让教学更轻松一点</text></view><view class="service-list"><button role="button" tabindex="0" v-for="[action,icon,title,desc] in services" :key="action" class="service-row" @click="open(action)"><view class="service-icon"><AppIcon :name="icon"/></view><view class="service-copy"><text>{{title}}</text><text>{{desc}}</text></view><AppIcon name="arrow" :size="16"/></button></view><button role="button" tabindex="0" class="secondary full" @click="state.modal={type:'account'}">{{state.user?'账号与退出登录':'邮箱登录 / 注册'}}</button></view>
   <button role="button" tabindex="0" class="huihui-card" @click="state.supportOpen=true"><view class="huihui-avatar">辉</view><view><text class="huihui-title">有问题，就来找辉辉</text><text class="huihui-sub">QQ 聊天 · 人工接待</text></view><AppIcon name="arrow" :size="17"/></button>
   <text class="page-signature">把热爱写进日常，把温柔留给自己。</text>
  </view>
 </view>
</template>
