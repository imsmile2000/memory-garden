import {requestOrigin} from '../../lib/request-origin';
import {quotaError} from '../../lib/quota-error';
import {identity} from '../../lib/auth';
import {getDb} from '../../../db/index';
import {memorials,gestures,pets,presence,messages} from '../../../db/schema';
import {and,eq,desc,gt,lt,sql} from 'drizzle-orm';
import {canDelete,canWrite,validateMemorial,validatePet,validateChat} from '../../lib/domain';
import {walkable} from '../../lib/navigation';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});


export async function GET(req:Request){
 try{
  const db=getDb(),user=await identity();
  const rows=await db.select({id:memorials.id,owner:memorials.owner,name:memorials.name,kind:memorials.kind,message:memorials.message,createdAt:memorials.createdAt,hasPhoto:sql<number>`${memorials.photo} IS NOT NULL`}).from(memorials).orderBy(desc(memorials.createdAt));
  const reactions=await db.select({memorialId:gestures.memorialId,
   flowers:sql<number>`count(*) filter (where ${gestures.kind}='flower')::int`,
   candles:sql<number>`count(*) filter (where ${gestures.kind}='candle')::int`,
   flowered:sql<boolean>`bool_or(${gestures.kind}='flower' and ${gestures.userId}=${user??''})`,
   lit:sql<boolean>`bool_or(${gestures.kind}='candle' and ${gestures.userId}=${user??''})`
  }).from(gestures).groupBy(gestures.memorialId);
  const pet=user?(await db.select().from(pets).where(eq(pets.userId,user)))[0]:null;
  const visitors=await db.select().from(presence).where(gt(presence.updatedAt,Date.now()-90000)).limit(50);
  const chats=await db.select().from(messages).where(gt(messages.createdAt,Date.now()-604800000)).orderBy(desc(messages.createdAt)).limit(50);
  return response({signedIn:!!user,pet:pet?{name:pet.name,kind:pet.kind,coat:pet.coat,breed:pet.breed}:null,
   messages:chats.reverse().map(({userId,...m})=>({...m,mine:userId===user})),
   memorials:rows.map(({owner,hasPhoto,...m})=>({...m,photoUrl:hasPhoto?`/api/memorial-photo?id=${encodeURIComponent(m.id)}`:null,mine:owner===user,flowers:reactions.find(r=>r.memorialId===m.id)?.flowers??0,candles:reactions.find(r=>r.memorialId===m.id)?.candles??0,flowered:reactions.find(r=>r.memorialId===m.id)?.flowered??false,lit:reactions.find(r=>r.memorialId===m.id)?.lit??false})),
   visitors:visitors.filter(v=>v.userId!==user).map(v=>({id:v.userId,x:v.x,z:v.z,pet:JSON.parse(v.pet)}))});
 }catch{ return response({error:'정원 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'},503); }
}
export async function POST(req:Request){
 const user=await identity();
 if(!user)return response({error:'브라우저 연결을 준비하지 못했어요. 새로고침해 주세요.',signIn:true},401);
 if(!canWrite(req.headers.get('origin'),requestOrigin(req),user))return response({error:'요청을 확인할 수 없어요.'},403);
 if(Number(req.headers.get('content-length'))>400000)return response({error:'사진이나 입력 내용이 너무 커요.'},413);
 let b:Record<string,unknown>;
 try { const raw=await req.text();if(raw.length>400000)return response({error:'사진이나 입력 내용이 너무 커요.'},413);b=JSON.parse(raw);if(!b||typeof b!=='object')throw Error(); } catch{return response({error:'입력 내용을 확인해 주세요.'},400);}
 try{
  const db=getDb();
  if(b.action==='chat'){
   const value=validateChat(b),last=(await db.select().from(messages).where(eq(messages.userId,user)).orderBy(desc(messages.createdAt)).limit(1))[0];
   if(last&&Date.now()-last.createdAt<1500)return response({error:'잠시 기다렸다가 이야기해 주세요.'},429);
   await db.insert(messages).values({...value,id:crypto.randomUUID(),userId:user,createdAt:Date.now()});return response({ok:true},201);
  }
  if(b.action==='memorial'){
   const value=validateMemorial(b),id=crypto.randomUUID();
   const owned=await db.select({id:memorials.id}).from(memorials).where(eq(memorials.owner,user));
   if(owned.length>=10)return response({error:'한 사람당 10개의 기억을 남길 수 있어요.'},400);
   await db.insert(memorials).values({...value,id,owner:user,createdAt:Date.now()});return response({id},201);
  }
  if(b.action==='pet'){
   const pet=validatePet(b);await db.insert(pets).values({...pet,userId:user}).onConflictDoUpdate({target:pets.userId,set:pet});return response({ok:true});
  }
  if(b.action==='gesture'){
   if(typeof b.id!=='string'||!['flower','candle'].includes(String(b.kind)))return response({error:'마음을 전할 기억을 선택해 주세요.'},400);
   const found=await db.select({id:memorials.id}).from(memorials).where(eq(memorials.id,b.id));
   if(!found.length)return response({error:'이 기억을 찾지 못했어요.'},404);
   await db.insert(gestures).values({memorialId:b.id,userId:user,kind:String(b.kind)}).onConflictDoNothing();return response({ok:true});
  }
  if(b.action==='presence'){
   const x=Number(b.x),z=Number(b.z);if(!walkable({x,z}))return response({error:'위치를 확인해 주세요.'},400);
   const pet=validatePet(b.pet),value={x,z,pet:JSON.stringify(pet),updatedAt:Date.now()};
   await db.insert(presence).values({...value,userId:user}).onConflictDoUpdate({target:presence.userId,set:value});
   await db.delete(presence).where(lt(presence.updatedAt,Date.now()-120000));return response({ok:true});
  }
  return response({error:'요청을 확인해 주세요.'},400);
 }catch(error){
  if(quotaError(error))return response({error:'무료 정원의 저장 한도에 도달했어요. 기존 기록은 그대로 보관돼요.'},429);
  const message=error instanceof Error?error.message:'';
  if(message.includes('입력해')||message.includes('선택해')||message.includes('확인해'))return response({error:message},400);
  return response({error:'저장하지 못했어요. 입력 내용은 그대로 있으니 다시 시도해 주세요.'},503);
 }
}
export async function DELETE(req:Request){
 const user=await identity();if(!canWrite(req.headers.get('origin'),requestOrigin(req),user))return response({error:'브라우저 연결과 요청을 확인해 주세요.'},403);
 try{
  const id=new URL(req.url).searchParams.get('id');if(!id)return response({error:'기억을 선택해 주세요.'},400);
  const db=getDb(),row=(await db.select().from(memorials).where(eq(memorials.id,id)))[0];
  if(!row)return response({error:'기억을 찾지 못했어요.'},404);
  if(!canDelete(user,row.owner))return response({error:'직접 남긴 기억만 지울 수 있어요.'},403);
  await db.delete(memorials).where(and(eq(memorials.id,id),eq(memorials.owner,user!)));return response({ok:true});
 }catch{return response({error:'삭제하지 못했어요. 다시 시도해 주세요.'},503);}
}
