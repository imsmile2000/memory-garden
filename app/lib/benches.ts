export const BENCHES=[
 {id:'pavilion',x:-13,z:-5,angle:Math.PI/3},
 {id:'pond',x:3,z:-11,angle:-.5},
 {id:'lawn',x:13,z:5,angle:-.7},
 {id:'memorial',x:-13,z:11,angle:Math.PI},
 {id:'east-trail',x:20.6,z:5,angle:-Math.PI/2},
 {id:'north-trail',x:-4,z:-23.2,angle:0},
 {id:'lake',x:27,z:-3,angle:Math.PI/2},
 {id:'lookout',x:-36,z:-33,angle:0},
 {id:'maple',x:-37,z:12,angle:-2.2},
 {id:'wildflower',x:9,z:40,angle:-.6},
 {id:'pines',x:33,z:-41,angle:.7},
 {id:'brook',x:11,z:-31,angle:-2.4}
];
export function nearestBench(p:{x:number;z:number}){return BENCHES.filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<=2.5).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null;}
