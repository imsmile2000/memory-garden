import test from 'node:test';
import assert from 'node:assert/strict';
import {createRefresh} from '../app/lib/refresh.ts';
test('a refresh after a mutation waits for the old poll then fetches new state',async()=>{
 let release!:()=>void;let calls=0;
 const gate=new Promise<void>(resolve=>release=resolve);
 const refresh=createRefresh(async()=>{const n=++calls;if(n===1)await gate;return n;});
 const old=refresh();const fresh=refresh(true);release();
 assert.equal(await old,1);assert.equal(await fresh,2);assert.equal(calls,2);
});
test('concurrent polls share one request',async()=>{
 let calls=0;const refresh=createRefresh(async()=>++calls);
 const [a,b]=await Promise.all([refresh(),refresh()]);assert.equal(a,b);assert.equal(calls,1);
});
