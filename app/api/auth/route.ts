import {authClient} from '../../lib/auth';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'요청을 확인해 주세요.'},403);
 try{
  const raw=await req.text();if(raw.length>4000)return reply({error:'입력 내용이 너무 길어요.'},413);
  const {action,email,password}=JSON.parse(raw);
  const client=await authClient();if(!client)return reply({error:'로그인 연결을 준비하고 있어요. 잠시 후 다시 방문해 주세요.'},503);
  if(action==='logout'){const {error}=await client.auth.signOut();return error?reply({error:'로그아웃하지 못했어요.'},503):reply({ok:true});}
  if(!['login','signup'].includes(action)||typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply({error:'이메일 주소를 확인해 주세요.'},400);
  if(typeof password!=='string'||password.length<8||password.length>128)return reply({error:'비밀번호를 8~128자로 입력해 주세요.'},400);
  const {data,error}=action==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:new URL('/auth/confirm',req.url).href}}):await client.auth.signInWithPassword({email,password});
  if(error)return reply({error:action==='signup'?'가입하지 못했어요. 이메일과 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요.':'로그인하지 못했어요. 이메일 인증 여부와 비밀번호를 확인해 주세요.'},400);
  return reply({ok:!!data.session,message:data.session?null:'이메일로 보낸 인증 링크를 눌러 가입을 완료해 주세요.'});
 }catch{return reply({error:'로그인 요청을 처리하지 못했어요. 다시 시도해 주세요.'},400);}
}
