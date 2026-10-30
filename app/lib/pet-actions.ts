export type PetAction='pet'|'feed'|'sit'|'jump'|'spin';
export const ACTION_DURATION:Record<PetAction,number>={pet:2,feed:2.4,sit:3.6,jump:1.4,spin:2.2};
export function actionPose(action:PetAction,progress:number){
 const p=Math.max(0,Math.min(1,progress)),envelope=p===1?0:Math.sin(Math.PI*p),ease=p*p*(3-2*p);
 return {height:action==='jump'?envelope*1.2:0,sit:action==='sit'?Math.min(1,envelope*2):0,turn:action==='spin'?ease*Math.PI*2:0,nod:action==='feed'?Math.sin(p*Math.PI*6)*.22:action==='pet'?Math.sin(p*Math.PI*2)*.13:0};
}
