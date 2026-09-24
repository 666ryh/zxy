import {reactive} from 'vue';
import {resolveAppearance,updateAppearance} from './domain/appearance.js';
export const appearance=reactive({pages:{},open:false});
const KEY='kejian-appearance-v1';
export function loadAppearance(){try{const saved=uni.getStorageSync(KEY);const raw=typeof saved==='string'?JSON.parse(saved):saved;if(!raw||typeof raw!=='object')return;let valid={};for(const [key,p]of Object.entries(raw))valid=updateAppearance(valid,key,p);appearance.pages=valid;}catch{appearance.pages={};}}
export function saveAppearance(page,patch){const next=updateAppearance(appearance.pages,page,patch);uni.setStorageSync(KEY,JSON.stringify(next));appearance.pages=next;}
export function wallpaperStyle(page){const p=resolveAppearance(appearance.pages,page);if(!p.image)return {};return {backgroundImage:`url("${p.image}")`,backgroundSize:p.fit,backgroundPosition:`${p.position}% center`};}
export function themeStyle(page){const p=resolveAppearance(appearance.pages,page);return {'--wall-surface':`rgba(${p.tone==='light'?'18,12,28':'255,255,255'},${p.opacity/100})`,'--wall-ink':p.tone==='light'?'#ffffff':'#251b32','--wall-muted':p.tone==='light'?'#f4edf9':'#453a50','--wall-shade':`rgba(${p.tone==='light'?'0,0,0':'255,255,255'},${p.shade/100})`,'--wall-shadow':p.tone==='light'?'0 1px 4px #000b':'0 1px 3px #fffc'};}
export function chooseWallpaper(){return new Promise((resolve,reject)=>{
 // #ifdef H5
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.style.display='none';document.body.appendChild(input);input.oncancel=()=>{input.remove();resolve(null);};input.onchange=async()=>{const file=input.files?.[0];if(!file){resolve(null);return;}let url;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('请选择15MB以内的JPG、PNG或WebP图片');url=URL.createObjectURL(file);const image=new Image();await new Promise((ok,no)=>{image.onload=ok;image.onerror=()=>no(Error('图片无法读取'));image.src=url;});const ratio=Math.min(1,1440/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);let quality=.82,encoded=canvas.toDataURL('image/jpeg',quality);while(encoded.length>620000&&quality>.22){quality-=.1;encoded=canvas.toDataURL('image/jpeg',quality);}if(encoded.length>650000)throw Error('图片细节过多，请选择更小的图片');resolve(encoded);}catch(e){reject(e);}finally{if(url)URL.revokeObjectURL(url);input.remove();}};input.click();
 // #endif
 // #ifndef H5
 reject(Error('当前仅H5支持本地背景上传，原生端将在适配阶段接入'));
 // #endif
});}
