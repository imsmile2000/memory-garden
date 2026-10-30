import {createClient} from '@supabase/supabase-js';
import {ensureVisitor} from './visitor-client';
import {readMotion,shouldSendMotion,ROOM_LIMIT,type Motion,type Pose} from './multiplayer';
import type {Pet,Visitor} from './domain';
export type WalkStatus='connecting'|'live'|'offline'|'full'|'budget';
export function connectWalk(getPose:()=>Pose,getPet:()=>Pet,onVisitors:(rows:Visitor[])=>void,onStatus:(s:WalkStatus)=>void){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key){onStatus('offline');return()=>{};}
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:4}}});
 const id=crypto.randomUUID(),peers=new Map<string,Motion>();let stopped=false,generation=0,seq=0,lastSent=0,lastPose=getPose(),lastPet='',timer:ReturnType<typeof setInterval>|undefined;
 let retryTimer:ReturnType<typeof setTimeout>|undefined,retries=0;
 let channel:ReturnType<typeof client.channel>|null=null,connected=false,sending=false,reserving=false,remaining=0,reservedPeers=2,expiresAt=0,budgetEnded=false,pendingSync=false;
 const emit=()=>onVisitors([...peers.values()].map(v=>({id:v.id,x:v.x,z:v.z,pet:v.pet,heading:v.heading,moving:v.moving,seq:v.seq})));
 const snapshot=():Motion=>({id,...getPose(),pet:getPet(),seq:++seq});
 async function reserve(){if(reserving||stopped||budgetEnded)return false;reserving=true;try{await ensureVisitor();const r=await fetch('/api/realtime-budget',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({peers:peers.size+1})});if(r.status===429){budgetEnded=true;onStatus('budget');close();return false;}if(!r.ok)throw Error();const lease=await r.json();remaining=lease.packets;reservedPeers=lease.peers;expiresAt=lease.expiresAt;return true;}catch{onStatus('offline');return false;}finally{reserving=false;}}
 async function send(force=false){
  if(!channel||!connected||sending||document.hidden||budgetEnded)return;
  const pose=getPose(),now=performance.now(),pet=JSON.stringify(getPet());force=force||pendingSync;
  if(!force&&pet===lastPet&&!shouldSendMotion(lastPose,pose,now-lastSent))return;
  if(now-lastSent<500){if(force)pendingSync=true;return;}
  sending=true;try{
   if((remaining<=0||Date.now()>expiresAt||peers.size+1>reservedPeers)&&!await reserve()){scheduleRetry();return;}
   if(!channel||!connected)return;
   remaining--;pendingSync=false;lastSent=now;lastPose={...pose};lastPet=pet;
   const result=await channel.send({type:'broadcast',event:'motion',payload:snapshot()});
   if(result!=='ok')scheduleRetry();
  }finally{sending=false;}
 }
 function close(){connected=false;if(timer)clearInterval(timer);timer=undefined;const old=channel;channel=null;if(old)void client.removeChannel(old);peers.clear();emit();}
 function scheduleRetry(){if(stopped||budgetEnded||document.hidden||retryTimer)return;onStatus('offline');close();if(retries>=6)return;retryTimer=setTimeout(()=>{retryTimer=undefined;void open();},Math.min(1000*2**retries++,30000));}
 async function open(){
  if(stopped||document.hidden||budgetEnded)return;const run=++generation;onStatus('connecting');
  if(!await reserve()){scheduleRetry();return;}if(stopped||run!==generation)return;
  const room=client.channel('garden-walk-v2',{config:{broadcast:{self:false},presence:{key:id}}});channel=room;
  room.on('broadcast',{event:'motion'},({payload})=>{if(stopped||room!==channel)return;const packet=readMotion(payload);if(!packet||packet.id===id||!room.presenceState()[packet.id])return;const old=peers.get(packet.id);if(!old&&peers.size>=ROOM_LIMIT-1)return;if(old&&packet.seq<=old.seq)return;peers.set(packet.id,packet);emit();});
  room.on('presence',{event:'sync'},()=>{
   if(stopped||room!==channel)return;const state=room.presenceState(),ids=Object.keys(state).sort();
   if(ids.indexOf(id)>=ROOM_LIMIT){onStatus('full');close();return;}
   const allowed=new Set(ids.slice(0,ROOM_LIMIT));for(const peer of peers.keys())if(!allowed.has(peer))peers.delete(peer);
   for(const [peer,entries]of Object.entries(state)){if(peer===id||!allowed.has(peer))continue;const packet=readMotion(entries[0]);if(packet&&!peers.has(peer))peers.set(peer,packet);}
   emit();pendingSync=true;void send(true);
  });
  room.subscribe(async status=>{
   if(stopped||room!==channel)return;
   if(status==='SUBSCRIBED'){retries=0;connected=true;onStatus('live');const result=await room.track(snapshot());if(stopped||room!==channel)return;if(result!=='ok'){scheduleRetry();return;}if(timer)clearInterval(timer);timer=setInterval(()=>void send(),500);}
   else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){scheduleRetry();}
  });
 }
 function visibility(){if(document.hidden){generation++;if(retryTimer)clearTimeout(retryTimer);retryTimer=undefined;close();}else{retries=0;void open();}}
 const online=()=>{if(!connected&&!document.hidden){retries=0;void open();}};
 document.addEventListener('visibilitychange',visibility);window.addEventListener('online',online);void open();
 return()=>{stopped=true;generation++;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('online',online);if(retryTimer)clearTimeout(retryTimer);close();void client.removeAllChannels();};
}
