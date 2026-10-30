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
test('shared links carry a 1200x630 preview image',()=>{
 const layout=readFileSync('app/layout.tsx','utf8');
 assert.match(layout,/metadataBase: new URL\("https:\/\/memory-garden-iota\.vercel\.app"\)/);
 assert.match(layout,/openGraph/);
 assert.match(layout,/summary_large_image/);
 const png=readFileSync('public/og-image.png');
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1200,630]);
 assert.ok(png.length<1024*1024);
});
