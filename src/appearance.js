import {reactive} from 'vue';
import {pickAlbumImage} from './album.js';
import {resolveAppearance,updateAppearance} from './domain/appearance.js';
export const appearance=reactive({pages:{},open:false});
const KEY='kejian-appearance-v1';
let accountSave=null;
export function bindAppearance(save){accountSave=save;}
export function loadAppearance(){try{const saved=uni.getStorageSync(KEY);const raw=typeof saved==='string'?JSON.parse(saved):saved;if(!raw||typeof raw!=='object')return;let valid={};for(const [key,p]of Object.entries(raw))valid=updateAppearance(valid,key,p);appearance.pages=valid;}catch{appearance.pages={};}}
export function saveAppearance(page,patch){const next=updateAppearance(appearance.pages,page,patch);if(accountSave)accountSave(next);else uni.setStorageSync(KEY,JSON.stringify(next));appearance.pages=next;}
export function wallpaperStyle(page){const p=resolveAppearance(appearance.pages,page);if(!p.image)return {};return {backgroundImage:`url("${p.image}")`,backgroundSize:p.fit,backgroundPosition:`${p.position}% center`};}
export function themeStyle(page){const p=resolveAppearance(appearance.pages,page);return {'--wall-surface':`rgba(${p.tone==='light'?'18,12,28':'255,255,255'},${p.opacity/100})`,'--wall-ink':p.tone==='light'?'#ffffff':'#251b32','--wall-muted':p.tone==='light'?'#f4edf9':'#453a50','--wall-shade':`rgba(${p.tone==='light'?'0,0,0':'255,255,255'},${p.shade/100})`,'--wall-shadow':p.tone==='light'?'0 1px 4px #000b':'0 1px 3px #fffc'};}
export async function chooseWallpaper(){
 // #ifdef H5
 const selected=await pickAlbumImage();if(!selected)return null;
 try{const image=new Image();await new Promise((ok,no)=>{image.onload=ok;image.onerror=()=>no(Error('照片无法解码，请选择JPG、PNG或WebP照片'));image.src=selected.path;});const ratio=Math.min(1,1440/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);let quality=.82,encoded=canvas.toDataURL('image/jpeg',quality);while(encoded.length>620000&&quality>.22){quality-=.1;encoded=canvas.toDataURL('image/jpeg',quality);}if(encoded.length>650000)throw Error('图片细节过多，请选择更小的图片');return encoded;}finally{if(selected.path.startsWith('blob:'))URL.revokeObjectURL(selected.path);}
 // #endif
 // #ifndef H5
 throw Error('当前原生端尚未接入图片持久化，请使用H5或安卓测试包');
 // #endif
}
