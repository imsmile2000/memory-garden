import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestBench,BENCHES} from '../app/lib/benches.ts';
test('bench interaction only appears within reach of a real bench',()=>{
 assert.equal(nearestBench({x:0,z:0}),null);
 for(const b of BENCHES){assert.equal(nearestBench({x:b.x+1,z:b.z})?.id,b.id);}
 assert.equal(nearestBench({x:100,z:100}),null);
});
