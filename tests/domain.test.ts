import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMemorial, validatePet, validateChat, validatePhoto, canWrite, canDelete } from '../app/lib/domain.ts';
import { findPath, walkable } from '../app/lib/navigation.ts';

test('memorial requires a name and letter with bounded input', () => {
  assert.equal(validateMemorial({name:'  보리  ',kind:'dog',message:'늘 기억할게'}).name,'보리');
  for (const input of [{name:' ',message:'a',kind:'dog'},{name:'a',message:' ',kind:'dog'},{name:'a'.repeat(41),message:'a',kind:'dog'},{name:'a',message:'b'.repeat(601),kind:'dog'},{name:'a',message:'b',kind:'other'},null]) assert.throws(()=>validateMemorial(input));
});
test('pet supports only cat or dog and valid palette', () => {
  assert.deepEqual(validatePet({name:'나비',kind:'cat',coat:'cream',breed:'shorthair'}),{name:'나비',kind:'cat',coat:'cream',breed:'shorthair'});
  assert.throws(()=>validatePet({name:'a',kind:'wolf',coat:'cream'}));
  assert.throws(()=>validatePet({name:'a',kind:'cat',coat:'unknown'}));
});
test('pet breeds must match species; chat trims and bounds nickname and text',()=>{
 assert.throws(()=>validatePet({name:'a',kind:'cat',coat:'cream',breed:'shiba'}));
 assert.equal(validatePet({name:'a',kind:'dog',coat:'cream',breed:'poodle'}).breed,'poodle');
 assert.deepEqual(validateChat({nickname:' 산책자 ',message:' 안녕하세요 '}),{nickname:'산책자',message:'안녕하세요'});
 assert.throws(()=>validateChat({nickname:'a',message:' '}));
 assert.throws(()=>validateChat({nickname:'a'.repeat(21),message:'hi'}));
 assert.throws(()=>validateChat({nickname:'a',message:'b'.repeat(301)}));
});
test('writes require identity and same origin; deletes require ownership', () => {
  assert.equal(canWrite('https://garden.test','https://garden.test','u1'),true);
  assert.equal(canWrite('https://evil.test','https://garden.test','u1'),false);
  assert.equal(canWrite(null,'https://garden.test',null),false);
  assert.equal(canDelete('u1','u2'),false);
  assert.equal(canDelete('u1','u1'),true);
});
test('walking avoids pond and edge while finding a path around water', () => {
  assert.equal(walkable({x:7,z:-5}),false);
  assert.equal(walkable({x:24,z:0}),false);
  const path=findPath({x:0,z:-5},{x:14,z:-5});
  assert.ok(path.length>2);
  for(const p of path) assert.equal(walkable(p),true);
  assert.ok(Math.hypot(path.at(-1)!.x-14,path.at(-1)!.z+5)<1.5);
  assert.ok(findPath({x:0,z:0},{x:100,z:100}).every(walkable));
});
test('photos are optional and accept only small JPEG data, never HTML or SVG',()=>{
 assert.equal(validatePhoto(null),null);
 assert.equal(validatePhoto(undefined),null);
 const jpeg='data:image/jpeg;base64,/9j/2Q==';
 assert.equal(validatePhoto(jpeg),jpeg);
 assert.throws(()=>validatePhoto('data:image/svg+xml;base64,PHN2Zz4='));
 assert.throws(()=>validatePhoto('data:image/jpeg;base64,aGVsbG8='));
 assert.throws(()=>validatePhoto('data:image/jpeg;base64,'+'A'.repeat(350001)));
});
test('seven coat colors survive validation for both species',()=>{
 for(const kind of ['dog','cat'])for(const coat of ['cream','brown','gray','white','black','golden','chocolate'])assert.equal(validatePet({kind,coat,name:'친구'}).coat,coat);
});
test('expanded garden reaches the new outer walking path but keeps a safe edge',()=>{
 assert.equal(walkable({x:23,z:0}),true);
 assert.equal(walkable({x:26,z:0}),false);
 const path=findPath({x:0,z:10},{x:23,z:0});assert.ok(path.length>0);assert.equal(path.at(-1)?.x,23);assert.ok(path.every(walkable));
});
