import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5174';
for(const route of ['/','/login'])assert.equal((await fetch(base+route)).status,200);
for(const path of ['/api/garden','/api/comments']){
 const r=await fetch(base+path,{method:'POST',headers:{origin:base,'content-type':'application/json','oai-authenticated-user-id':'spoofed-user'},body:JSON.stringify({action:'chat',nickname:'test',message:'must not save',memorialId:'test'})});
 assert.equal(r.status,401,'Spoofed identity must never authorize '+path);
}
const cross=await fetch(base+'/api/auth',{method:'POST',headers:{origin:'https://invalid.example','content-type':'application/json'},body:'{}'});assert.equal(cross.status,403);
console.log('PASS: pages render; spoofed identity rejected; cross-origin auth rejected.');
