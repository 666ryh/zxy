export const WECHAT_ID='ryh520zxy1314';
export async function openHumanSupport({bridge=globalThis.Native,copy,open}={}){
 if(bridge?.openWechat){const result=bridge.openWechat();if(result!=='ok')throw Error(result);return;}
 await copy(WECHAT_ID);open('weixin://');
}
