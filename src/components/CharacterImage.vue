<script setup>
import {CHARACTER} from '../store.js';
defineProps({label:{type:String,default:'三丽鸥官方库洛米'},src:{type:String,default:CHARACTER}});
</script>
<template>
 <!-- #ifdef H5 -->
 <img :src="src" :alt="label" style="object-fit:contain" />
 <!-- #endif -->
 <!-- #ifndef H5 -->
 <image :src="src" mode="aspectFit" :aria-label="label" />
 <!-- #endif -->
</template>
