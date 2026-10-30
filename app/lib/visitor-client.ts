let ready:Promise<void>|null=null;
export function ensureVisitor():Promise<void>{
 if(!ready){
  const establish=async()=>{const res=await fetch('/api/visitor',{method:'POST',signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('정원 연결을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.');};
  ready=(async()=>{if(typeof navigator!=='undefined'&&navigator.locks)await navigator.locks.request('garden-visitor',{signal:AbortSignal.timeout(20000)},establish);else await establish();})().catch(error=>{ready=null;throw error;});
 }
 return ready;
}
