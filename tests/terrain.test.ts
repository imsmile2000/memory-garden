import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath,lineClear,walkable} from '../app/lib/navigation.ts';
import {BENCHES} from '../app/lib/benches.ts';
import {PLACES,TREES,areaName,groundHit,heightAt,lakeDistance,streamDistance,surfaceAt} from '../app/lib/terrain.ts';
import {arrivalSpeed,damp,dampAngle,slide} from '../app/lib/locomotion.ts';
const entrance={x:0,z:10};
test('every destination and bench can be reached on foot from the entrance',()=>{
 for(const p of [...Object.values(PLACES),...BENCHES]){
  assert.ok(walkable(p),`${p.x},${p.z} is walkable`);
  const path=findPath(entrance,p);assert.ok(path.length>=2,`${p.x},${p.z} is reachable`);
  for(let i=1;i<path.length;i++)assert.ok(lineClear(path[i-1],path[i]),'every leg is a clear straight line');
 }
});
test('routes are straightened instead of zigzagging across the grid',()=>{
 const path=findPath(entrance,{x:0,z:30});
 assert.ok(path.length<=4,`got ${path.length} waypoints`);
 assert.deepEqual(path.at(-1),{x:0,z:30});
});
test('water is blocked except at the dock and the two crossings',()=>{
 assert.equal(walkable({x:42,z:2}),false);assert.equal(walkable({x:36,z:2}),true);assert.equal(walkable({x:36,z:6}),false);
 assert.equal(walkable({x:20,z:-32}),false);assert.equal(walkable({x:16,z:-36}),true);assert.equal(walkable({x:28,z:-24}),true);
});
test('tree trunks block walking and stay off the water',()=>{
 assert.ok(TREES.length>120);
 for(const t of TREES){assert.equal(walkable(t),false);assert.ok(lakeDistance(t.x,t.z)>1);assert.ok(streamDistance(t.x,t.z)>1.5);}
});
test('the original garden stays flat and the hill rises to the lookout',()=>{
 assert.equal(heightAt(0,0),0);assert.equal(heightAt(-20,10),0);
 assert.ok(surfaceAt(-36,-28)>5);assert.ok(surfaceAt(36,2)>heightAt(36,2));assert.ok(surfaceAt(28,-24)>heightAt(28,-24));
});
test('clicks land on the terrain and areas are named',()=>{
 const hit=groundHit({x:0,y:2,z:10},{x:0,y:-Math.SQRT1_2,z:-Math.SQRT1_2});assert.ok(hit&&Math.abs(hit.z-8.1)<.4);
 assert.equal(groundHit({x:0,y:2,z:10},{x:0,y:1,z:0}),null);
 assert.equal(areaName({x:-10,z:7}),'자랑 마당');assert.equal(areaName({x:4,z:44}),'들꽃 들판');assert.equal(areaName({x:0,z:10}),'정원 입구');
});
test('easing is frame-rate independent and takes the short way round',()=>{
 const once=damp(0,1,4,.1);let twice=0;twice=damp(twice,1,4,.05);twice=damp(twice,1,4,.05);assert.ok(Math.abs(once-twice)<1e-9);
 assert.ok(dampAngle(3,-3,5,.1)>3);
 assert.ok(arrivalSpeed(.1,true)<arrivalSpeed(5,true));assert.equal(arrivalSpeed(.1,false),arrivalSpeed(5,true));
});
test('walkers slide along an obstacle instead of stopping dead',()=>{
 const wall=(p:{x:number;z:number})=>p.x<1;
 const moved=slide({x:.95,z:0},.1,.1,wall);assert.equal(moved.x,.95);assert.equal(moved.z,.1);assert.equal(moved.blockedX,true);assert.equal(moved.blockedZ,false);
});
