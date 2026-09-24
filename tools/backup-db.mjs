import {loadPrivateEnv} from '../server/config.js';import {backupDatabase} from '../server/backup.js';
loadPrivateEnv();try{const file=await backupDatabase(process.env,{force:true});console.log('Database backup saved:',file);}catch(e){console.error(e.message);process.exitCode=1;}
