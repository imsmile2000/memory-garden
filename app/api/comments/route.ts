import {requestOrigin} from '../../lib/request-origin';
import {quotaError} from '../../lib/quota-error';
import {identity} from '../../lib/auth';
import {getDb} from '../../../db/index';
import {comments,memorials} from '../../../db/schema';
import {and,eq,desc} from 'drizzle-orm';
import {canWrite,validateComment} from '../../lib/domain';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('memorialId');if(!id)return reply({error:'자랑을 선택해 주세요.'},400);
 try{const user=await identity(),rows=await getDb().select().from(comments).where(eq(comments.memorialId,id)).orderBy(desc(comments.createdAt));return reply({comments:rows.reverse().map(({userId,...row})=>({...row,mine:userId===user}))});}catch{return reply({error:'댓글을 불러오지 못했어요.'},503);}
}
export async function POST(req:Request){
 const user=await identity();if(!user)return reply({error:'브라우저 연결을 준비하지 못했어요. 새로고침해 주세요.'},401);
 if(!canWrite(req.headers.get('origin'),requestOrigin(req),user))return reply({error:'요청을 확인해 주세요.'},403);
 let value;try{const raw=await req.text();if(raw.length>4000)return reply({error:'댓글은 500자 이내로 남겨 주세요.'},413);value=validateComment(JSON.parse(raw));}catch(e){return reply({error:e instanceof Error?e.message:'입력 내용을 확인해 주세요.'},400);}
 try{const db=getDb();if(!(await db.select({id:memorials.id}).from(memorials).where(eq(memorials.id,value.memorialId)))[0])return reply({error:'이 자랑을 찾지 못했어요.'},404);
 const last=(await db.select().from(comments).where(eq(comments.userId,user)).orderBy(desc(comments.createdAt)).limit(1))[0];if(last&&Date.now()-last.createdAt<2000)return reply({error:'잠시 기다린 뒤 남겨 주세요.'},429);
 const id=crypto.randomUUID();await db.insert(comments).values({...value,id,userId:user,createdAt:Date.now()});return reply({id},201);
 }catch(error){if(quotaError(error))return reply({error:'무료 정원의 댓글 한도에 도달했어요. 기존 댓글은 그대로 보관돼요.'},429);return reply({error:'댓글을 저장하지 못했어요. 다시 시도해 주세요.'},503);}
}
export async function DELETE(req:Request){
 const user=await identity();if(!canWrite(req.headers.get('origin'),requestOrigin(req),user))return reply({error:'브라우저 연결과 요청을 확인해 주세요.'},403);
 const id=new URL(req.url).searchParams.get('id');if(!id)return reply({error:'댓글을 선택해 주세요.'},400);
 try{const db=getDb(),row=(await db.select().from(comments).where(eq(comments.id,id)))[0];if(!row)return reply({error:'댓글을 찾지 못했어요.'},404);if(row.userId!==user)return reply({error:'내가 쓴 댓글만 삭제할 수 있어요.'},403);await db.delete(comments).where(and(eq(comments.id,id),eq(comments.userId,user!)));return reply({ok:true});}catch{return reply({error:'댓글을 삭제하지 못했어요.'},503);}
}
