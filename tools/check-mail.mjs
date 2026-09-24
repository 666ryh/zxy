import nodemailer from 'nodemailer';
import {loadPrivateEnv,mailOptions} from '../server/config.js';
loadPrivateEnv();
const mail=mailOptions(process.env),transport=nodemailer.createTransport(mail.transport);
try{await transport.verify();console.log('SMTP TLS connection and authentication verified; no email sent.');}catch(e){console.error(`SMTP verification failed (${e.code||'UNKNOWN'}, ${e.responseCode||'no response'}). Check server, port and mailbox authorization.`);process.exitCode=1;}finally{transport.close();}
