import test from 'node:test';
import assert from 'node:assert/strict';
import {newVisitor,verifyVisitor} from '../app/lib/visitor-token.ts';
test('visitor cookie preserves ownership without login and rejects forgery',()=>{
 const v=newVisitor('test-secret');assert.equal(verifyVisitor(v.token,'test-secret'),v.id);
 assert.equal(verifyVisitor(v.token,'other-secret'),null);
 assert.equal(verifyVisitor(v.token+'0','test-secret'),null);
 assert.equal(verifyVisitor(undefined,'test-secret'),null);
 assert.notEqual(newVisitor('test-secret').id,v.id);
});
