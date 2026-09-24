import {spawn} from 'node:child_process';
const children=[];
const backend=spawn(process.execPath,['tools/serve.js'],{stdio:'inherit',env:{...process.env,PORT:'4174'}});children.push(backend);
const frontend=spawn(process.execPath,['node_modules/@dcloudio/vite-plugin-uni/bin/uni.js'],{stdio:'inherit',env:process.env});children.push(frontend);
let closing=false;function close(code=0){if(closing)return;closing=true;for(const child of children)child.kill();process.exitCode=code;}
children.forEach(child=>child.on('exit',code=>close(code||0)));process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close());
