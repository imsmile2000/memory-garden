import {TREES,WALK_RADIUS,crossesWater,lakeDistance,onDock,streamDistance,type Point} from './terrain.ts';
export type {Point};
const TRUNK_CELL=4,trunks=new Map<number,{x:number;z:number;r:number}[]>();
const cellKey=(cx:number,cz:number)=>(cx+64)*1000+cz+64;
for(const t of TREES){const r=.5*t.scale,cx=Math.floor(t.x/TRUNK_CELL),cz=Math.floor(t.z/TRUNK_CELL);const list=trunks.get(cellKey(cx,cz))||[];list.push({x:t.x,z:t.z,r});trunks.set(cellKey(cx,cz),list);}
function hitsTrunk(p:Point){
 const cx=Math.floor(p.x/TRUNK_CELL),cz=Math.floor(p.z/TRUNK_CELL);
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const t of trunks.get(cellKey(cx+i,cz+j))||[])if(Math.hypot(t.x-p.x,t.z-p.z)<t.r)return true;
 return false;
}
export function walkable(p: Point): boolean {
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.hypot(p.x,p.z)>=WALK_RADIUS)return false;
  if(Math.hypot(p.x-7,p.z+5)<=4.8||(p.x>-13&&p.x<-7&&p.z>-12&&p.z<-7))return false;
  if(lakeDistance(p.x,p.z)<1.02&&!onDock(p.x,p.z))return false;
  if(streamDistance(p.x,p.z)<1.5&&!crossesWater(p.x,p.z))return false;
  return !hitsTrunk(p);
}
const SIZE=WALK_RADIUS*2+1;
const toIndex=(x:number,z:number)=>(x+WALK_RADIUS)*SIZE+z+WALK_RADIUS;
const inGrid=(x:number,z:number)=>Math.abs(x)<=WALK_RADIUS&&Math.abs(z)<=WALK_RADIUS;
let grid:Uint8Array|null=null;
function open(x:number,z:number){
 if(!grid){grid=new Uint8Array(SIZE*SIZE);for(let i=-WALK_RADIUS;i<=WALK_RADIUS;i++)for(let j=-WALK_RADIUS;j<=WALK_RADIUS;j++)grid[toIndex(i,j)]=walkable({x:i,z:j})?1:0;}
 return inGrid(x,z)&&grid[toIndex(x,z)]===1;
}
function nearest(p:Point):Point {
  const px=Number.isFinite(p.x)?Math.round(Math.max(-WALK_RADIUS,Math.min(WALK_RADIUS,p.x))):0,pz=Number.isFinite(p.z)?Math.round(Math.max(-WALK_RADIUS,Math.min(WALK_RADIUS,p.z))):0;
  let best={x:0,z:10},distance=Infinity;
  for(let r=0;r<=WALK_RADIUS*2&&distance===Infinity;r++)for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){
   if(Math.max(Math.abs(i),Math.abs(j))!==r||!open(px+i,pz+j))continue;
   const d=(px+i-p.x)**2+(pz+j-p.z)**2;if(d<distance){best={x:px+i,z:pz+j};distance=d;}
  }
  return best;
}
export function lineClear(a:Point,b:Point,step=.2):boolean {
 const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/step);
 for(let i=1;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n}))return false;
 return true;
}
// Grid routes zigzag in 45 degree turns; keep only the corners that a straight walk cannot skip.
function straighten(points:Point[]):Point[] {
 const result=[points[0]];let anchor=0;
 while(anchor<points.length-1){let next=points.length-1;while(next>anchor+1&&!lineClear(points[anchor],points[next]))next--;result.push(points[next]);anchor=next;}
 return result;
}
export function findPath(start:Point,target:Point):Point[] {
  const s=nearest(start),t=nearest(target),goal=toIndex(t.x,t.z),parent=new Int32Array(SIZE*SIZE).fill(-1),queue=new Int32Array(SIZE*SIZE);
  let head=0,tail=1;queue[0]=toIndex(s.x,s.z);parent[queue[0]]=queue[0];
  while(head<tail){
   const index=queue[head++];
   if(index===goal){
    const nodes:Point[]=[];for(let cur=index;;cur=parent[cur]){nodes.push({x:Math.floor(cur/SIZE)-WALK_RADIUS,z:cur%SIZE-WALK_RADIUS});if(cur===queue[0])break;}
    nodes.reverse();
    if(walkable(start)&&lineClear(start,nodes[0]))nodes.unshift({x:start.x,z:start.z});
    if(walkable(target)&&lineClear(nodes[nodes.length-1],target))nodes.push({x:target.x,z:target.z});
    return straighten(nodes);
   }
   const x=Math.floor(index/SIZE)-WALK_RADIUS,z=index%SIZE-WALK_RADIUS;
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const nx=x+dx,nz=z+dz;if(!open(nx,nz)||!open(x+dx,z)||!open(x,z+dz))continue;
    const n=toIndex(nx,nz);if(parent[n]===-1){parent[n]=index;queue[tail++]=n;}
   }
  }
  return [];
}
