import test from 'node:test';
import assert from 'node:assert/strict';
import * as domain from '../app/lib/domain.ts';
test('memorial comments require a memorial, nickname and bounded nonblank text',()=>{
 const validate=(domain as any).validateComment;
 assert.equal(typeof validate,'function');
 assert.deepEqual(validate({memorialId:'memory1',nickname:' 보호자 ',message:' 기억할게요 '}),{memorialId:'memory1',nickname:'보호자',message:'기억할게요'});
 for(const v of [{memorialId:'',nickname:'나',message:'안녕'},{memorialId:'a',nickname:' ',message:'안녕'},{memorialId:'a',nickname:'나',message:' '},{memorialId:'a',nickname:'나',message:'a'.repeat(501)}])assert.throws(()=>validate(v));
});
