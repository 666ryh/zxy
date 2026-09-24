import {defineConfig} from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
export default defineConfig({plugins:[(uni.default||uni)()],server:{host:'127.0.0.1',port:4173,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:4174',changeOrigin:true,configure(proxy){proxy.on('proxyReq',(outgoing,incoming)=>{if(['http://127.0.0.1:4173','http://localhost:4173'].includes(incoming.headers.origin))outgoing.setHeader('origin','http://127.0.0.1:4174');});}}}}});
