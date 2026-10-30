// Frame-rate independent easing for walkers and cameras.
export const WALK_SPEED=3.7;
export const damp=(current:number,target:number,rate:number,dt:number)=>target+(current-target)*Math.exp(-rate*dt);
export function dampAngle(current:number,target:number,rate:number,dt:number){const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+difference*(1-Math.exp(-rate*dt));}
// Ease into the final waypoint; keep full pace through the ones along the way.
export const arrivalSpeed=(distance:number,isLast:boolean,max=WALK_SPEED)=>isLast?Math.min(max,distance*2.4+.25):max;
// Try the full step, then each axis on its own so walkers glide along obstacles instead of stopping dead.
export function slide(p:{x:number;z:number},dx:number,dz:number,open:(p:{x:number;z:number})=>boolean){
 if(open({x:p.x+dx,z:p.z+dz}))return {x:p.x+dx,z:p.z+dz,blockedX:false,blockedZ:false};
 if(open({x:p.x+dx,z:p.z}))return {x:p.x+dx,z:p.z,blockedX:false,blockedZ:true};
 if(open({x:p.x,z:p.z+dz}))return {x:p.x,z:p.z+dz,blockedX:true,blockedZ:false};
 return {x:p.x,z:p.z,blockedX:true,blockedZ:true};
}
