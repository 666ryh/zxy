/** The injected picker lets tests exercise selection/cancellation without a browser. */
export function pickAlbumImage(choose=options=>uni.chooseImage(options)){
 return new Promise((resolve,reject)=>choose({count:1,sourceType:['album'],sizeType:['original'],success(result){const path=result.tempFilePaths?.[0];if(!path){resolve(null);return;}const size=result.tempFiles?.[0]?.size||0;if(size>15*1024*1024){reject(Error('请选择15MB以内的照片'));return;}resolve({path,size});},fail(error){if(/cancel/i.test(error?.errMsg||'')){resolve(null);return;}reject(Error('无法打开相册，请检查照片访问权限后重试'));}}));
}
