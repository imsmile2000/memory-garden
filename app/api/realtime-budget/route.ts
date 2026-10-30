import {identity} from '../../lib/auth';
import {requestOrigin} from '../../lib/request-origin';
import postgres from 'postgres';
import {PACKETS_PER_LEASE,ROOM_LIMIT} from '../../lib/multiplayer';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const headers={'Cache-Control':'no-store'};
 if(req.headers.get('origin')!==requestOrigin(req)||!await identity())return Response.json({error:'연결을 확인해 주세요.'},{status:403,headers});
 let client:ReturnType<typeof postgres>|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const raw=await req.text();if(raw.length>500)return new Response(null,{status:413});
  const count=Number(JSON.parse(raw).peers),peers=Math.max(2,Math.min(ROOM_LIMIT,Number.isFinite(count)?Math.ceil(count):ROOM_LIMIT));
  // Reserve deliveries, presence and protocol overhead conservatively; never a paid upgrade.
  const units=PACKETS_PER_LEASE*(peers+1)*2+256,period=new Date().toISOString().slice(0,7);
  const url=process.env.DATABASE_URL;if(!url)throw Error('DB unavailable');
  // A short-lived pooler connection cannot resume with a stale socket after a serverless freeze.
  client=postgres(url,{prepare:false,max:1,connect_timeout:5,idle_timeout:1,max_lifetime:10,fetch_types:false,ssl:'require'});
  const query=client`insert into garden.realtime_usage(period,units) values(${period},${units}) on conflict(period) do update set units=garden.realtime_usage.units+${units} where garden.realtime_usage.units+${units}<=500000 returning units`;
  const rows=await Promise.race([query,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('DB deadline')),7000);})]);
  if(!rows.length)return Response.json({error:'budget'},{status:429,headers});
  return Response.json({packets:PACKETS_PER_LEASE,peers,expiresAt:Date.now()+60000},{headers});
 }catch{return Response.json({error:'실시간 연결을 준비하지 못했어요.'},{status:503,headers});}
 finally{if(timer)clearTimeout(timer);if(client)await client.end({timeout:0}).catch(()=>{});}
}
