import {getDb} from '../../../db/index';
import {memorials} from '../../../db/schema';
import {eq} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id');if(!id)return new Response('Not found',{status:404});
 try{const row=(await getDb().select({photo:memorials.photo}).from(memorials).where(eq(memorials.id,id)))[0];if(!row?.photo)return new Response('Not found',{status:404});
  const data=atob(row.photo.slice(row.photo.indexOf(',')+1));const bytes=Uint8Array.from(data,c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Photo unavailable',{status:503});}
}
