export function quotaError(error:unknown):boolean {
 let value=error;
 for(let i=0;i<4&&value&&typeof value==='object';i++){
  const e=value as {message?:string;cause?:unknown};
  if(e.message?.includes('GARDEN_QUOTA'))return true;
  value=e.cause;
 }
 return false;
}
