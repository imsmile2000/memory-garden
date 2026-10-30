import {validatePet,type Pet} from './domain.ts';
import {walkable,type Point} from './navigation.ts';
export const ROOM_LIMIT=12,PACKETS_PER_LEASE=50,LEASE_UNITS=2000;
export type Pose=Point&{heading:number;moving:boolean};
export type Motion=Pose&{id:string;pet:Pet;seq:number};
export function readMotion(value:unknown):Motion|null{
 try{if(!value||typeof value!=='object')return null;const v=value as Motion;
 if(typeof v.id!=='string'||v.id.length>80||!v.id||!walkable(v)||!Number.isFinite(v.heading)||Math.abs(v.heading)>Math.PI*4||typeof v.moving!=='boolean'||!Number.isSafeInteger(v.seq)||v.seq<0)return null;
 return {id:v.id,x:v.x,z:v.z,heading:v.heading,moving:v.moving,seq:v.seq,pet:validatePet(v.pet)};
 }catch{return null;}
}
export function shouldSendMotion(previous:Pose,current:Pose,elapsed:number){return elapsed>=500&&(Math.hypot(current.x-previous.x,current.z-previous.z)>.025||Math.abs(current.heading-previous.heading)>.1||current.moving!==previous.moving);}
export function eyePose(p:Point,yaw:number,pitch:number,seated:boolean){const y=seated?1.45:2.02;return {position:{x:p.x,y,z:p.z},target:{x:p.x+Math.sin(yaw)*Math.cos(pitch),y:y+Math.sin(pitch),z:p.z-Math.cos(yaw)*Math.cos(pitch)}};}
