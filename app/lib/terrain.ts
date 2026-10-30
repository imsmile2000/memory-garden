// Garden geography shared by rendering, walking and realtime validation. Keep it deterministic: every visitor must agree on it.
import {BENCHES} from './benches.ts';
export type Point={x:number;z:number};
export type TreeKind='green'|'pink'|'maple'|'pine'|'birch';
export type TreeSpot=Point&{scale:number;kind:TreeKind};
export const WALK_RADIUS=57;
export const LAKE={x:42,z:2,rx:11,rz:14};
export const LOOKOUT={x:-36,z:-30,top:6,deck:3.6};
export const DOCK={x0:29.5,x1:37.5,z0:1,z1:3,y:.3};
export const STREAM:[number,number][]=[[8,-56],[12,-46],[16,-36],[24,-28],[32,-20],[39,-13],[42,-11]];
export const STEPPING_STONES={x:16,z:-36,radius:2.4};
export const BRIDGE={x:28,z:-24,length:3.2,width:1.2,rise:.45};
export const ROUTES:[number,number][][]=[
 [[22.35,0],[26,1],[29,2],[31,2]],
 [[22,4],[27,8],[31,15],[40,19],[50,14],[54,2],[50,-12],[42,-20],[36,-36]],
 [[18,-13.5],[24,-19],[28,-24],[33,-29],[36,-36]],
 [[0,-22.35],[2,-30],[10,-35],[16,-36],[24,-40],[36,-36]],
 [[-14,-17.5],[-22,-20],[-30,-24],[-36,-30]],
 [[2,-30],[-8,-38],[-22,-38],[-36,-30]],
 [[-21.5,6],[-30,10],[-38,8],[-46,14],[-42,24],[-34,28],[-20,38],[-6,42],[4,44]],
 [[-2,21],[-2,30],[2,38],[4,44],[14,48],[26,40],[29,28],[31,15]]
];
export const PLACES={lake:{x:36,z:2},brook:{x:21,z:-37},lookout:{x:-36,z:-28},maple:{x:-42,z:22},wildflower:{x:5,z:42},pines:{x:36,z:-37}};
const ZONES=[
 {name:'윤슬 호수',x:LAKE.x,z:LAKE.z,radius:20},
 {name:'구름 전망대',x:LOOKOUT.x,z:LOOKOUT.z,radius:15},
 {name:'단풍 숲길',x:-40,z:16,radius:17},
 {name:'들꽃 들판',x:4,z:44,radius:15},
 {name:'별빛 솔숲',x:40,z:-40,radius:15},
 {name:'바람 개울',x:17,z:-36,radius:13}
];
const HILLS=[[LOOKOUT.x,LOOKOUT.z,7,10],[-46,30,3.2,11],[28,46,2.4,12],[50,-38,3,10],[-14,50,2.6,10],[-50,-4,2.2,9]];
const smooth=(a:number,b:number,v:number)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};
export const lakeDistance=(x:number,z:number)=>Math.hypot((x-LAKE.x)/LAKE.rx,(z-LAKE.z)/LAKE.rz);
function segmentDistance(x:number,z:number,a:readonly number[],b:readonly number[]){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.min(1,Math.max(0,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
function polylineDistance(x:number,z:number,line:readonly (readonly number[])[]){let best=Infinity;for(let i=1;i<line.length;i++)best=Math.min(best,segmentDistance(x,z,line[i-1],line[i]));return best;}
export const streamDistance=(x:number,z:number)=>polylineDistance(x,z,STREAM);
export const routeDistance=(x:number,z:number)=>Math.min(...ROUTES.map(r=>polylineDistance(x,z,r)));
// Bridge axes: u runs across the stream, v along it.
const bridgeAxes=(x:number,z:number)=>({u:((x-BRIDGE.x)-(z-BRIDGE.z))/Math.SQRT2,v:((x-BRIDGE.x)+(z-BRIDGE.z))/Math.SQRT2});
export const onDock=(x:number,z:number)=>x>=DOCK.x0&&x<=DOCK.x1&&z>=DOCK.z0&&z<=DOCK.z1;
function onBridge(x:number,z:number){const {u,v}=bridgeAxes(x,z);return Math.abs(u)<BRIDGE.length&&Math.abs(v)<BRIDGE.width;}
export function crossesWater(x:number,z:number){return onBridge(x,z)||Math.hypot(x-STEPPING_STONES.x,z-STEPPING_STONES.z)<STEPPING_STONES.radius;}
// The original garden stays flat; hills, a lake basin and a raised rim only start past it.
export function heightAt(x:number,z:number){
 const r=Math.hypot(x,z);if(r<=26)return 0;
 let h=.35*Math.sin(x*.13+1)*Math.cos(z*.11);
 for(const [hx,hz,a,s]of HILLS)h+=a*Math.exp(-((x-hx)**2+(z-hz)**2)/(2*s*s));
 if(Math.hypot(x-LOOKOUT.x,z-LOOKOUT.z)<9)h=Math.min(h,LOOKOUT.top);
 h*=smooth(26,36,r);h+=smooth(54,68,r)*9;
 const d=lakeDistance(x,z);if(d<1.5)h*=smooth(1,1.5,d);if(d<1)h=-1.4*(1-d*d);
 return h;
}
// What feet stand on: the terrain, or a structure built over it.
export function surfaceAt(x:number,z:number){
 if(onDock(x,z))return DOCK.y;
 const h=heightAt(x,z);if(!onBridge(x,z))return h;
 return h+BRIDGE.rise*Math.cos(bridgeAxes(x,z).u*Math.PI/(2*BRIDGE.length))**2;
}
// Ray march along the view ray; the terrain is gentle, so a small step finds the ground reliably.
export function groundHit(origin:{x:number;y:number;z:number},direction:{x:number;y:number;z:number},limit=150):Point|null{
 for(let t=.25;t<limit;t+=.25){const x=origin.x+direction.x*t,y=origin.y+direction.y*t,z=origin.z+direction.z*t;if(y<=surfaceAt(x,z)+.1)return {x,z};}
 return null;
}
export function areaName(p:Point){
 const zone=ZONES.find(z=>Math.hypot(p.x-z.x,p.z-z.z)<z.radius);if(zone)return zone.name;
 if(Math.hypot(p.x,p.z)>=26)return '바람 산책길';
 return p.x<-4&&p.z>2?'자랑 마당':p.z<-2?'물빛 산책길':p.x>5?'함께 걷는 잔디밭':'정원 입구';
}
const original:[number,number,number,TreeKind][]=[
 ...[[-17,3,1],[-16,10,1.2],[-9,14,1.1],[-5,12,.8],[-13,15,.8]].map(([x,z,s])=>[x,z,s,'pink'] as [number,number,number,TreeKind]),
 ...[[-17,-7,1.2],[-15,-14,1.3],[-8,-17,1.2],[-1,-19,1],[5,-17,1.2],[12,-14,1.4],[17,-9,1],[19,-2,1.1],[18,6,1.2],[14,13,1.1],[6,17,1.1],[-1,18,.8],[-19,-1,.8],[-18,6,.9]].map(([x,z,s])=>[x,z,s,'green'] as [number,number,number,TreeKind]),
 ...[.3,1.2,2.1,3.2,4.3,5.2].map(a=>[Math.sin(a)*24.7,Math.cos(a)*24.7,.65,'green'] as [number,number,number,TreeKind])
];
function clearSpot(x:number,z:number,spots:TreeSpot[]){
 return Math.hypot(x,z)>27&&Math.hypot(x,z)<WALK_RADIUS-1&&lakeDistance(x,z)>1.3&&streamDistance(x,z)>3.2&&routeDistance(x,z)>2.4&&Math.hypot(x-LOOKOUT.x,z-LOOKOUT.z)>7&&BENCHES.every(b=>Math.hypot(b.x-x,b.z-z)>3)&&spots.every(s=>Math.hypot(s.x-x,s.z-z)>3);
}
function plantTrees(){
 let seed=2718;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const spots:TreeSpot[]=original.map(([x,z,scale,kind])=>({x,z,scale,kind}));
 const plant=(cx:number,cz:number,radius:number,count:number,kind:()=>TreeKind,exclude:(x:number,z:number)=>boolean=()=>false)=>{
  for(let i=0;i<count;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*radius,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,scale=.85+rand()*.6,k=kind();if(clearSpot(x,z,spots)&&!exclude(x,z))spots.push({x,z,scale,kind:k});}
 };
 plant(-40,16,17,240,()=>rand()<.85?'maple':'birch');
 plant(35,-38,17,260,()=>'pine');
 plant(0,0,WALK_RADIUS,170,()=>rand()<.6?'green':'birch',(x,z)=>Math.hypot(x-4,z-44)<13);
 return spots;
}
export const TREES=plantTrees();
