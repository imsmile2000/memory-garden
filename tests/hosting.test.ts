import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Vercel API routes never trust Sites identity headers',()=>{
 for(const file of ['app/api/garden/route.ts','app/api/comments/route.ts']){
  const source=readFileSync(file,'utf8');
  assert.doesNotMatch(source,/oai-authenticated-user-id/);
  assert.match(source,/await identity\(/);
 }
});
test('production build targets Next.js, not Workers',()=>{
 const pkg=JSON.parse(readFileSync('package.json','utf8'));
 assert.equal(pkg.scripts.build,'next build --webpack');
 assert.doesNotMatch(readFileSync('db/index.ts','utf8'),/cloudflare:workers/);
});
