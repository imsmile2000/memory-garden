export function createRefresh<T>(fetcher:()=>Promise<T>){
 let pending:Promise<T>|null=null;
 return (force=false):Promise<T>=>{
  if(pending&&!force)return pending;
  const previous=pending;
  const next=(async()=>{if(previous)try{await previous;}catch{}return fetcher();})();
  pending=next;
  const clear=()=>{if(pending===next)pending=null;};next.then(clear,clear);
  return next;
 };
}
