export type Point = {x:number;z:number};
export function walkable(p: Point): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.z) && Math.hypot(p.x,p.z)<24 && Math.hypot(p.x-7,p.z+5)>4.8 && !(p.x>-13 && p.x<-7 && p.z>-12 && p.z<-7);
}
const key=(p:Point)=>`${p.x},${p.z}`;
function nearest(p:Point):Point {
  let best={x:0,z:0},distance=Infinity;
  for(let x=-23;x<=23;x++) for(let z=-23;z<=23;z++) {
    const d=(x-p.x)**2+(z-p.z)**2;
    if(d<distance && walkable({x,z})){best={x,z};distance=d;}
  }
  return best;
}
export function findPath(start:Point,target:Point):Point[] {
  const s=nearest(start),t=nearest(target),queue=[s],seen=new Set([key(s)]),parent=new Map<string,Point>();
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(key(p)===key(t)){
      const path:Point[]=[p]; let cur=p;
      while(key(cur)!==key(s)){cur=parent.get(key(cur))!;path.push(cur);}
      return path.reverse();
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const n={x:p.x+dx,z:p.z+dz};
      if(!seen.has(key(n))&&walkable(n)&&walkable({x:p.x+dx,z:p.z})&&walkable({x:p.x,z:p.z+dz})){
        seen.add(key(n));parent.set(key(n),p);queue.push(n);
      }
    }
  }
  return [];
}
