import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
const sign=(id:string,secret:string)=>createHmac('sha256',secret).update('memory-garden-visitor:'+id).digest('hex');
export function newVisitor(secret:string){const id=randomUUID();return {id,token:id+'.'+sign(id,secret)};}
export function verifyVisitor(token:string|undefined,secret:string):string|null{
 if(!token)return null;const [id,signature,...extra]=token.split('.');
 if(extra.length||!/^[0-9a-f-]{36}$/.test(id)||!signature||!/^[0-9a-f]{64}$/.test(signature))return null;
 return timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(id,secret),'hex'))?id:null;
}
