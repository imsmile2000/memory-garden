import assert from 'node:assert/strict';
import fs from 'node:fs';
const photo='data:image/jpeg;base64,'+fs.readFileSync('work/photo-test.jpg').toString('base64');
const base='http://127.0.0.1:5173';
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(cookie,'local test sign-in must provide a cookie');
async function req(method,payload,options={}){
 const res=await fetch(base+'/api/garden'+(options.query||''),{method,headers:{'Content-Type':'application/json',Origin:options.origin||base,...(!options.anonymous?{Cookie:cookie}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
 const raw=await res.text();let data;try{data=JSON.parse(raw);}catch{data={error:raw};}return{status:res.status,data};
}
assert.equal((await req('POST',{action:'chat',nickname:'a',message:'hello'},{anonymous:true})).status,401);
assert.equal((await req('POST',{action:'chat',nickname:'a',message:'hello'},{origin:'https://untrusted.example'})).status,403);
assert.equal((await req('POST',{action:'pet',name:'테스트',kind:'cat',coat:'gray',breed:'shiba'})).status,400);
const savedPet={name:'구름',kind:'cat',coat:'gray',breed:'russian'};
assert.equal((await req('POST',{action:'pet',...savedPet})).status,200);
const created=await req('POST',{action:'memorial',name:'로컬 검증용 기억',kind:'cat',message:'저장과 다시 읽기를 확인하는 테스트 편지입니다.',photo});assert.equal(created.status,201);const id=created.data.id;
try{
 assert.equal((await req('POST',{action:'gesture',id,kind:'flower'})).status,200);
 assert.equal((await req('POST',{action:'gesture',id,kind:'flower'})).status,200);
 assert.equal((await req('POST',{action:'gesture',id,kind:'candle'})).status,200);
 const state=(await req('GET')).data;assert.deepEqual(state.pet,savedPet);const m=state.memorials.find(m=>m.id===id);assert.equal(m.flowers,1);assert.equal(m.candles,1);assert.equal(m.mine,true);assert.ok(m.photoUrl);assert.equal('photo' in m,false);const image=await fetch(base+m.photoUrl,{headers:{Cookie:cookie}});assert.equal(image.headers.get('Content-Type'),'image/jpeg');assert.equal(image.status,200);assert.ok((await image.arrayBuffer()).byteLength>1000);
 const msg='로컬 채팅 테스트 '+Date.now();assert.equal((await req('POST',{action:'chat',nickname:'검증 산책자',message:msg})).status,201);
 assert.ok((await req('GET')).data.messages.some(m=>m.message===msg));
 assert.equal((await req('POST',{action:'presence',x:0,z:10,pet:savedPet})).status,200);
 assert.equal((await req('POST',{action:'presence',x:7,z:-5,pet:savedPet})).status,400);
 console.log('PASS: authentication, same-origin protection, breeds, persistent pet, memorial, duplicate reactions, chat, and presence');
}finally{assert.equal((await req('DELETE',null,{query:'?id='+id})).status,200);}
const cm=await req('POST',{action:'memorial',name:'댓글 검증',kind:'dog',message:'댓글을 저장하는 로컬 테스트'});assert.equal(cm.status,201);
async function comment(method,payload,query='',anon=false){const r=await fetch(base+'/api/comments'+query,{method,headers:{Origin:base,'Content-Type':'application/json',...(!anon?{Cookie:cookie}:{})},...(payload?{body:JSON.stringify(payload)}:{})});return {status:r.status,data:await r.json()};}
try{
 const value={memorialId:cm.data.id,nickname:'검증',message:'함께 기억해요'};
 assert.equal((await comment('POST',value,'',true)).status,401);
 assert.equal((await comment('POST',{...value,message:' '})).status,400);
 assert.equal((await comment('POST',{...value,memorialId:'missing'})).status,404);
 const saved=await comment('POST',value);assert.equal(saved.status,201);
 const list=await comment('GET',null,'?memorialId='+cm.data.id);assert.equal(list.data.comments[0].message,value.message);assert.equal(list.data.comments[0].mine,true);assert.equal('userId' in list.data.comments[0],false);
 assert.equal((await comment('DELETE',null,'?id='+saved.data.id)).status,200);
 assert.equal((await comment('GET',null,'?memorialId='+cm.data.id)).data.comments.length,0);
 console.log('PASS: authenticated comments, validation, missing memorial, persistence and own-comment deletion');
}finally{await req('DELETE',null,{query:'?id='+cm.data.id});}
