export const BENCHES=[
 {id:'pavilion',x:-13,z:-5,angle:Math.PI/3},
 {id:'pond',x:3,z:-11,angle:-.5},
 {id:'lawn',x:13,z:5,angle:-.7},
 {id:'memorial',x:-13,z:11,angle:Math.PI},
 {id:'east-trail',x:20.6,z:5,angle:-Math.PI/2},
 {id:'north-trail',x:-4,z:-23.2,angle:0}
];
export function nearestBench(p:{x:number;z:number}){return BENCHES.filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<=2.5).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null;}
