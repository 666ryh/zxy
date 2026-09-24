import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['--test','tests/cloud.test.js'],{stdio:'inherit',env:{...process.env,MYSQL_TEST:'true'}});child.on('exit',code=>process.exit(code||0));
