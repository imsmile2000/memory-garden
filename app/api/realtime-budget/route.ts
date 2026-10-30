import {identity} from '../../lib/auth';
import {requestOrigin} from '../../lib/request-origin';
import {getDb} from '../../../db/index';
import {sql} from 'drizzle-orm';
import {PACKETS_PER_LEASE,ROOM_LIMIT} from '../../lib/multiplayer';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const headers={'Cache-Control':'no-store'};
 if(req.headers.get('origin')!==requestOrigin(req)||!await identity())return Response.json({error:'연결을 확인해 주세요.'},{status:403,headers});
 try{
  const raw=await req.text();if(raw.length>500)return new Response(null,{status:413});
  const count=Number(JSON.parse(raw).peers),peers=Math.max(2,Math.min(ROOM_LIMIT,Number.isFinite(count)?Math.ceil(count):ROOM_LIMIT));
  // Reserve deliveries, presence and protocol overhead conservatively; never a paid upgrade.
  const units=PACKETS_PER_LEASE*(peers+1)*2+256,period=new Date().toISOString().slice(0,7);
  const rows=await getDb().execute(sql`insert into garden.realtime_usage(period,units) values(${period},${units}) on conflict(period) do update set units=garden.realtime_usage.units+${units} where garden.realtime_usage.units+${units}<=500000 returning units`);
  if(!rows.length)return Response.json({error:'budget'},{status:429,headers});
  return Response.json({packets:PACKETS_PER_LEASE,peers,expiresAt:Date.now()+60000},{headers});
 }catch{return Response.json({error:'실시간 연결을 준비하지 못했어요.'},{status:503,headers});}
}
