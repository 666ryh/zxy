import {parseBackup} from './domain/domain.js';
export function migrateLegacyData(bridge,get,set){if(!bridge?.load||get('kejian-data'))return;const raw=bridge.load();if(!raw)return;parseBackup(raw);set('kejian-data',raw);}
export function exportNative(bridge,name,content,mime){if(!bridge?.exportFile)return false;const result=bridge.exportFile(name,mime,content);if(result!=='ok')throw Error(result||'文件导出失败');return true;}
