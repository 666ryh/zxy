import {emptyData,parseBackup} from './domain/domain.js';
export function readSaved(get,key){const raw=get(key);return raw===undefined||raw===null||raw===''?emptyData():parseBackup(typeof raw==='string'?raw:JSON.stringify(raw));}
export function writeSaved(set,key,data){const raw=JSON.stringify(data);parseBackup(raw);set(key,raw);return data;}
