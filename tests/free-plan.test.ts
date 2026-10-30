import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePhoto} from '../app/lib/domain.ts';
test('large valid JPEG data cannot bypass the free-plan photo cap',()=>{
 const jpeg='data:image/jpeg;base64,'+Buffer.concat([Buffer.from([255,216]),Buffer.alloc(100000),Buffer.from([255,217])]).toString('base64');
 assert.throws(()=>validatePhoto(jpeg));
});
