import test from 'node:test';
import assert from 'node:assert/strict';
import {actionPose} from '../app/lib/pet-actions.ts';
test('pet actions have distinct motion and return to rest',()=>{
 assert.ok(actionPose('jump',.5).height>.8);
 assert.ok(actionPose('sit',.5).sit>.8);
 assert.ok(Math.abs(actionPose('spin',.5).turn)>2);
 for(const a of ['jump','sit','spin','feed','pet'] as const){const p=actionPose(a,1);assert.equal(p.height,0);assert.equal(p.sit,0);assert.ok(Object.values(p).every(Number.isFinite));}
});
