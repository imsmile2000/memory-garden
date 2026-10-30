import test from 'node:test';
import assert from 'node:assert/strict';
import {readMotion,shouldSendMotion,eyePose,followPose} from '../app/lib/multiplayer.ts';
import {DEFAULT_PET} from '../app/lib/domain.ts';
test('motion accepts only finite walkable positions and valid pet, bounded ids',()=>{
 const p={id:'peer-a',x:0,z:10,heading:0,moving:true,pet:DEFAULT_PET,seq:1};
 assert.equal(readMotion(p)?.x,0);
 assert.equal(readMotion({...p,x:Infinity}),null);
 assert.equal(readMotion({...p,x:1000}),null);
 assert.equal(readMotion({...p,pet:{...DEFAULT_PET,kind:'bird'}}),null);
});
test('moving frames are capped to2Hz, stopping is sent and idle does not spam',()=>{
 const a={x:0,z:0,heading:0,moving:false};
 assert.equal(shouldSendMotion(a,a,600),false);
 assert.equal(shouldSendMotion(a,{...a,x:1,moving:true},100),false);
 assert.equal(shouldSendMotion(a,{...a,x:1,moving:true},500),true);
 assert.equal(shouldSendMotion({...a,moving:true},a,500),true);
});
test('first person stays at player eye level and looks along yaw',()=>{
 const v=eyePose({x:5,z:10},0,0,false);
 assert.equal(v.position.x,5);assert.equal(v.position.z,10);
 assert.ok(v.position.y>1.5&&v.position.y<2.3);
 assert.equal(v.target.x,5);assert.ok(v.target.z<10);
 const f=followPose({x:5,z:10},0,-.4);assert.ok(f.position.z>12&&f.position.y>f.target.y);assert.equal(f.target.z,10);
 assert.ok(eyePose({x:5,z:10},0,0,true).position.y<v.position.y);
});
