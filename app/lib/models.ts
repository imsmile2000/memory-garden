import * as T from 'three';
import {BENCHES} from './benches';
import {damp,WALK_SPEED} from './locomotion';
import {BRIDGE,DOCK,LAKE,LOOKOUT,ROUTES,STEPPING_STONES,STREAM,TREES,heightAt,lakeDistance,surfaceAt,type TreeSpot} from './terrain';
import type {Pet} from './domain';
const mats=new Map<string,T.MeshStandardMaterial>();
export function material(color:string){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true}));return mats.get(color)!;}
export function mesh(geometry:T.BufferGeometry,color:string,parent:T.Object3D,x=0,y=0,z=0){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function ball(parent:T.Object3D,color:string,x:number,y:number,z:number,sx:number,sy=sx,sz=sx){const m=mesh(new T.SphereGeometry(1,12,8),color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
export function box(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){return mesh(new T.BoxGeometry(w,h,d),color,parent,x,y,z);}
export function cylinder(parent:T.Object3D,color:string,x:number,y:number,z:number,r:number,h:number,rt=r,n=12){return mesh(new T.CylinderGeometry(rt,r,h,n),color,parent,x,y,z);}
export function label(text:string,color='#4b6253',background='#fffff4',scale=3.4){
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d')!;
 ctx.fillStyle=background;ctx.beginPath();ctx.roundRect(6,6,500,108,54);ctx.fill();ctx.fillStyle=color;ctx.font='500 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,62,460);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(scale,scale/4,1);sprite.renderOrder=10;return sprite;
}
export {makeDetailedPet as makePet} from './pet-model';
export function makeAvatar(color='#7d9b83'){
 const g=new T.Group(),legRoot=new T.Group(),upper=new T.Group();g.add(legRoot,upper);const legs:T.Object3D[]=[],knees:T.Object3D[]=[],feet:T.Object3D[]=[],arms:T.Object3D[]=[];
 for(const x of [-.16,.16]){
  const leg=new T.Group();leg.position.set(x,.69,0);legRoot.add(leg);cylinder(leg,'#5f6f66',0,-.16,0,.11,.33,.13);
  const knee=new T.Group();knee.position.y=-.32;leg.add(knee);cylinder(knee,'#5f6f66',0,-.15,0,.085,.31,.105);
  const foot=new T.Group();foot.position.y=-.31;knee.add(foot);box(foot,'#8a6a4f',0,-.03,.07,.2,.11,.34);ball(foot,'#8a6a4f',0,-.02,.23,.1,.075,.11);box(foot,'#f0e7d3',0,-.085,.08,.21,.03,.39);
  legs.push(leg);knees.push(knee);feet.push(foot);
 }
 cylinder(upper,color,0,1.05,0,.36,.7,.3);ball(upper,'#e9bd93',0,1.65,0,.3,.32,.29);
 for(const x of [-.42,.42]){const arm=new T.Group();arm.position.set(x,1.36,0);upper.add(arm);cylinder(arm,color,0,-.27,0,.13,.55);ball(arm,'#e9bd93',0,-.58,0,.12);arms.push(arm);}
 cylinder(upper,'#f4e5bd',0,1.88,0,.46,.09);ball(upper,'#f4e5bd',0,1.93,0,.32,.17,.32);cylinder(upper,'#a89877',0,1.91,0,.325,.07);
 ball(upper,'#5b4636',0,1.66,-.05,.3,.31,.28);for(const x of [-.1,.1])ball(upper,'#49463a',x,1.66,.275,.025);
 box(upper,'#b98b64',0,1.1,-.3,.45,.49,.16);g.userData={legs,knees,feet,arms,upper,legRoot};return g;
}
// The gait advances by distance walked, not by time, so feet never skate across the ground.
export function animateWalker(g:T.Group,dt:number,speed:number,direction=1){
 const u=g.userData;u.time=(u.time||0)+dt;u.phase=(u.phase||0)+speed*dt*(u.isPet?2.8:2.4)*direction;u.stride=damp(u.stride||0,Math.min(1,speed/(WALK_SPEED*.8)),9,dt);
 const p=u.phase,s=u.stride;
 if(u.isPet){(u.legs as T.Object3D[]|undefined)?.forEach((l,i)=>l.rotation.x=Math.sin(p+(i===0||i===3?0:Math.PI))*.42*s);if(u.tail)u.tail.rotation.z=Math.sin(u.time*(5+s*5))*(.25+s*.12);u.bob=Math.abs(Math.sin(p))*.045*s;return;}
 (u.legs as T.Object3D[]).forEach((leg,i)=>{const q=p+i*Math.PI,hip=-Math.sin(q)*.55*s,knee=Math.max(0,Math.cos(q))*.95*s;leg.rotation.x=hip;u.knees[i].rotation.x=knee;u.feet[i].rotation.x=-(hip+knee)*.7;});
 (u.arms as T.Object3D[]).forEach((arm,i)=>arm.rotation.x=Math.sin(p+i*Math.PI)*.45*s);
 u.bob=-Math.abs(Math.sin(p))*.075*s;u.legRoot.position.y=u.bob;u.upper.position.y=u.bob;u.upper.rotation.x=.05*s;u.upper.rotation.y=Math.sin(p)*.06*s;
}
export function poseSeated(g:T.Group){const u=g.userData;(u.legs as T.Object3D[]).forEach((leg,i)=>{leg.rotation.x=-Math.PI/2;u.knees[i].rotation.x=Math.PI/2;u.feet[i].rotation.x=0;});u.legRoot.position.y=0;u.upper.position.y=0;u.upper.rotation.set(0,0,0);}
let seed=47;
export function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
// Instancing keeps the larger map at a handful of draw calls per plant colour.
function makeBatch(){
 const sets=new Map<string,{geometry:T.BufferGeometry;color:string;cast:boolean;items:T.Matrix4[]}>(),o=new T.Object3D();
 return {
  add(geometry:T.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy=sx,sz=sx,cast=true,yaw=0){
   const key=geometry.uuid+color+cast;if(!sets.has(key))sets.set(key,{geometry,color,cast,items:[]});
   o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(0,yaw,0);o.updateMatrix();sets.get(key)!.items.push(o.matrix.clone());
  },
  flush(root:T.Object3D){for(const {geometry,color,cast,items}of sets.values()){const m=new T.InstancedMesh(geometry,material(color),items.length);items.forEach((item,i)=>m.setMatrixAt(i,item));m.castShadow=cast;m.receiveShadow=true;m.frustumCulled=false;root.add(m);}}
 };
}
type Batch=ReturnType<typeof makeBatch>;
const GEO={blob:new T.IcosahedronGeometry(1,1),trunk:new T.CylinderGeometry(.72,1,1,7),cone:new T.ConeGeometry(1,1,8),stem:new T.CylinderGeometry(1,1,1,4),petal:new T.IcosahedronGeometry(1,0),disc:new T.CylinderGeometry(1,1,1,9)};
const TREE_LEAVES={green:['#829b69','#a0b584','#b0bf8d'],pink:['#dba7b4','#ecc2c7','#f1cfd1'],maple:['#c9693f','#d98a45','#e3ac55'],birch:['#b9c77f','#cbd38e','#d6da9f']};
function tree(b:Batch,{x,z,scale:s,kind}:TreeSpot){
 const y=heightAt(x,z);
 if(kind==='pine'){b.add(GEO.trunk,'#7d6a55',x,y+.6*s,z,.2*s,1.2*s,.2*s);for(const [h,r,l]of [[1.9,1.5,2.4],[3.3,1.15,2.1],[4.5,.8,1.7]])b.add(GEO.cone,['#5f8066','#6c8e70','#7a9a7a'][h>4?2:h>3?1:0],x,y+h*s,z,r*s,l*s,r*s);return;}
 const c=TREE_LEAVES[kind];b.add(GEO.trunk,kind==='birch'?'#e6e2d6':'#99846b',x,y+1*s,z,.18*s,2*s,.18*s);
 b.add(GEO.blob,c[0],x,y+2.7*s,z,1.55*s,1.65*s,1.35*s);b.add(GEO.blob,c[1],x-.7*s,y+2.45*s,z+.35*s,1.1*s,1.2*s,1.1*s);b.add(GEO.blob,c[2],x+.6*s,y+3.05*s,z+.2*s,1*s,1.2*s,1.1*s);
}
function flowers(b:Batch,x:number,z:number,color:string,scale=1,simple=false){
 const y=heightAt(x,z)+.06;b.add(GEO.stem,'#7e996c',x,y+.2*scale,z,.022*scale,.4*scale,.022*scale,false);
 if(simple){b.add(GEO.petal,color,x,y+.44*scale,z,.17*scale,.08*scale,.17*scale,false);return;}
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;b.add(GEO.petal,color,x+Math.cos(a)*.1*scale,y+.44*scale,z+Math.sin(a)*.1*scale,.085*scale,.05*scale,.085*scale,false);}b.add(GEO.petal,'#eac681',x,y+.47*scale,z,.055*scale,.055*scale,.055*scale,false);
}
function bench(root:T.Object3D,x:number,z:number,angle=0){const g=new T.Group();g.position.set(x,heightAt(x,z),z);g.rotation.y=angle;root.add(g);for(const q of [-.9,.9]){box(g,'#6c7965',q,.38,0,.12,.7,.65);}for(let i=0;i<3;i++){box(g,'#b79770',0,.76,(i-1)*.23,2.3,.11,.19);box(g,'#b79770',0,1.08+i*.2,-.37,2.3,.14,.1);}}
function path(root:T.Object3D,points:number[][],width:number){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.04,p[1])));const m=mesh(new T.TubeGeometry(curve,90,width,8,false),'#e9dfc5',root);m.scale.y=.035;m.position.y=.085;}
// A flat strip that follows the hills, for trails and the stream past the flat garden.
function drape(root:T.Object3D,points:readonly (readonly number[])[],half:number,color:string,lift:number){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],0,p[1]))),n=Math.ceil(curve.getLength()),across=[-1,-.5,0,.5,1],positions:number[]=[],index:number[]=[];
 for(let i=0;i<=n;i++){const p=curve.getPoint(i/n),t=curve.getTangent(i/n);for(const s of across){const x=p.x-t.z*half*s,z=p.z+t.x*half*s;positions.push(x,heightAt(x,z)+.06+lift,z);}}
 for(let i=0;i<n;i++)for(let j=0;j<across.length-1;j++){const a=i*across.length+j,b=a+1,c=a+across.length,d=c+1;index.push(a,b,c,b,d,c);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(index);geometry.computeVertexNormals();
 const m=mesh(geometry,color,root);m.castShadow=false;return m;
}
function terrain(root:T.Object3D){
 const geometry=new T.PlaneGeometry(170,170,170,170);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position,colors=new Float32Array(p.count*3),c=new T.Color();
 const meadow=new T.Color('#b9c99b'),maple=new T.Color('#c9bd8e'),pine=new T.Color('#9fb08a'),field=new T.Color('#c4cf95'),sand=new T.Color('#d0cfaf'),rim=new T.Color('#a8bb91');
 const near=(x:number,z:number,cx:number,cz:number,r:number)=>Math.max(0,Math.min(1,(r-Math.hypot(x-cx,z-cz))/(r*.4)));
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,heightAt(x,z)+.06);c.copy(meadow).lerp(maple,near(x,z,-40,16,20)).lerp(pine,near(x,z,40,-40,19)).lerp(field,near(x,z,4,44,17)).lerp(rim,Math.max(0,Math.min(1,(Math.hypot(x,z)-54)/8)));const d=lakeDistance(x,z);if(d<1.22)c.lerp(sand,Math.min(1,(1.22-d)*7));c.toArray(colors,i*3);}
 geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeVertexNormals();
 const m=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.96}));m.receiveShadow=true;root.add(m);
}
function lakeside(root:T.Object3D,b:Batch){
 const water=cylinder(root,'#83b6ae',LAKE.x,-.06,LAKE.z,1,.04,1,64);water.scale.set(LAKE.rx,1,LAKE.rz);water.material=new T.MeshStandardMaterial({color:'#8abeb6',roughness:.3,metalness:.14});water.castShadow=false;
 for(let i=0;i<7;i++){const ring=mesh(new T.TorusGeometry(2+i*1.2,.03,4,64),'#b9d7c7',root,LAKE.x+2,-.02,LAKE.z-1);ring.rotation.x=Math.PI/2;ring.scale.y=1.25;ring.castShadow=false;}
 for(let i=0;i<14;i++){const a=random()*Math.PI*2,r=.35+random()*.5,x=LAKE.x+Math.cos(a)*LAKE.rx*r,z=LAKE.z+Math.sin(a)*LAKE.rz*r;if(x<38&&Math.abs(z-2)<3)continue;b.add(GEO.disc,'#6f9d7c',x,-.02,z,.42,.025,.42,false);}
 for(let i=0;i<46;i++){const a=random()*Math.PI*2,d=.97+random()*.07,x=LAKE.x+Math.cos(a)*LAKE.rx*d,z=LAKE.z+Math.sin(a)*LAKE.rz*d;if(x<33&&Math.abs(z-2)<4)continue;if(i%3)b.add(GEO.cone,'#84a06e',x,heightAt(x,z)+.5,z,.09,1.1,.09,false);else b.add(GEO.blob,'#b9bbaa',x,heightAt(x,z)+.08,z,.3+random()*.25,.18,.3);}
 for(let i=0;i<=26;i++)box(root,'#c5ad84',DOCK.x0+i*.3,DOCK.y+.01,(DOCK.z0+DOCK.z1)/2,.27,.1,DOCK.z1-DOCK.z0+.3);
 for(const x of [DOCK.x0+1.5,(DOCK.x0+DOCK.x1)/2,DOCK.x1])for(const z of [DOCK.z0-.05,DOCK.z1+.05])cylinder(root,'#978562',x,.1,z,.09,1.4,.09,6);
}
function brook(root:T.Object3D,b:Batch){
 drape(root,STREAM,1,'#8fc1b8',.05);
 for(let i=0;i<120;i++){const seg=Math.floor(random()*(STREAM.length-1)),t=random(),side=random()<.5?-1:1,[ax,az]=STREAM[seg],[bx,bz]=STREAM[seg+1],l=Math.hypot(bx-ax,bz-az),x=ax+(bx-ax)*t-(bz-az)/l*side*(1.15+random()*.5),z=az+(bz-az)*t+(bx-ax)/l*side*(1.15+random()*.5);if(Math.hypot(x-BRIDGE.x,z-BRIDGE.z)<2||Math.hypot(x-STEPPING_STONES.x,z-STEPPING_STONES.z)<2.2)continue;b.add(GEO.blob,'#bcbdab',x,heightAt(x,z)+.1,z,.16+random()*.22,.12,.2+random()*.2);}
 for(let i=0;i<5;i++){const x=STEPPING_STONES.x-2+i,z=STEPPING_STONES.z+(i%2?.18:-.18);b.add(GEO.disc,'#c9c8b4',x,heightAt(x,z)+.13,z,.48,.14,.42);}
 const g=new T.Group();g.position.set(BRIDGE.x,0,BRIDGE.z);g.rotation.y=Math.PI/4;root.add(g);
 for(let i=-10;i<=10;i++){const u=i*BRIDGE.length/10,x=BRIDGE.x+u*Math.SQRT1_2,z=BRIDGE.z-u*Math.SQRT1_2,y=surfaceAt(x,z);box(g,'#c5ad84',u,y+.01,0,.31,.1,BRIDGE.width*2);if(i%5===0)for(const side of [-1,1])cylinder(g,'#978562',u,y+.45,side*BRIDGE.width,.05,.9,.05,6);}
}
function lookout(root:T.Object3D){
 const {x,z,top,deck}=LOOKOUT;cylinder(root,'#c5ad84',x,top+.04,z,deck,.05,deck,32).castShadow=false;
 for(let i=0;i<=10;i++){const a=Math.PI+i*Math.PI/10,px=x+Math.cos(a)*deck,pz=z+Math.sin(a)*deck;cylinder(root,'#978562',px,top+.55,pz,.06,1,.06,6);if(i<10){const a2=a+Math.PI/10,qx=x+Math.cos(a2)*deck,qz=z+Math.sin(a2)*deck,rail=box(root,'#b39a73',(px+qx)/2,top+1.02,(pz+qz)/2,Math.hypot(qx-px,qz-pz)+.1,.07,.07);rail.rotation.y=-Math.atan2(qz-pz,qx-px);}}
}
function arbor(root:T.Object3D,x:number,z:number,yaw:number){const g=new T.Group();g.position.set(x,heightAt(x,z),z);g.rotation.y=yaw;root.add(g);for(const side of [-1.5,1.5]){cylinder(g,'#a08665',side,1.3,-.4,.08,2.6,.08,6);cylinder(g,'#a08665',side,1.3,.4,.08,2.6,.08,6);}for(let i=-2;i<=2;i++)box(g,'#b39a73',0,2.65,i*.22,3.5,.08,.08);for(let i=0;i<14;i++){const a=i/13*Math.PI;ball(g,['#e8a0b4','#f3d27a','#f4efe4'][i%3],Math.cos(a)*1.55,1.3+Math.sin(a)*1.55,(i%2?.3:-.3),.14);}}
export function buildLandscape(root:T.Group){
 const batch=makeBatch();terrain(root);
 path(root,[[-2,21],[-1,13],[0,5],[-1,0],[-8,-3],[-15,-10]],1.45);
 path(root,[[-17,8],[-10,8],[-4,7],[1,4],[7,2],[14,0],[18,-6]],1.25);
 path(root,[[0,5],[3,10],[10,13],[17,9]],1.05);
 path(root,[[-2,0],[1,-6],[0,-12],[-4,-18]],1.05);
 // A new outer loop connects the existing garden to a quiet walking lawn.
 const loop=Array.from({length:33},(_,i)=>{const a=i*Math.PI/16;return [Math.sin(a)*22.35,Math.cos(a)*22.35];});path(root,loop,.72);
 path(root,[[14,0],[19,0],[22.35,0]],.85);path(root,[[0,-12],[0,-19],[0,-22.35]],.85);path(root,[[-17,8],[-20,8],[-21.5,6]],.8);
 for(const route of ROUTES)drape(root,route,.7,'#e9dfc5',.03);
 for(const t of TREES)tree(batch,t);
 // A wall of forest on the raised rim hides the edge of the world.
 for(let i=0;i<190;i++){const a=random()*Math.PI*2,r=59+random()*19,x=Math.cos(a)*r,z=Math.sin(a)*r;tree(batch,{x,z,scale:1.3+random()*.9,kind:x>0&&z<0?'pine':(['green','pine','birch','green'] as const)[i%4]});}
 for(let i=0;i<22;i++){const a=i/22*Math.PI*2+random()*.2,r=115+random()*30,cone=mesh(new T.ConeGeometry(26+random()*22,24+random()*26,6),['#bfcbb8','#c8d2c0','#b5c3ae'][i%3],root,Math.cos(a)*r,6,Math.sin(a)*r);cone.castShadow=false;cone.receiveShadow=false;}
 const trailSign=label('바람 산책길','#566d55','#fffff4',3.6);trailSign.position.set(21,2.3,1);root.add(trailSign);
 // Pond and its pale stone bank.
 const bank=cylinder(root,'#d0cfaf',7,.08,-5,4.65,.11,4.65,64);bank.scale.z=.99;
 const water=cylinder(root,'#83b6ae',7,.15,-5,4.25,.04,4.25,64);water.material=new T.MeshStandardMaterial({color:'#8abeb6',roughness:.35,metalness:.12});water.castShadow=false;
 for(let i=0;i<5;i++){const a=i*1.2;const ring=mesh(new T.TorusGeometry(1+i*.5,.018,4,48),'#b9d7c7',root,7,.18,-5);ring.rotation.x=Math.PI/2;ring.scale.z=.6;}
 for(let i=0;i<8;i++){const a=random()*Math.PI*2,r=2+random()*1.5;const x=7+Math.cos(a)*r,z=-5+Math.sin(a)*r;const lily=cylinder(root,'#6f9d7c',x,.22,z,.25,.025,.25);lily.rotation.y=random()*3;if(i%3===0)flowers(batch,x,z,'#f1c6ce',.6);}
 // Timber footbridge at the pond's front edge.
 for(let i=0;i<11;i++)box(root,'#c5ad84',5.4+i*.32,.35,-.8,.29,.15,1.8);
 for(const x of [5.4,8.7])for(const z of [-1.65,.05])cylinder(root,'#978562',x,.7,z,.07,1.2,.07,6);
 // Open picnic pavilion.
 const pavilion=new T.Group();pavilion.position.set(-10,0,-9.5);root.add(pavilion);box(pavilion,'#d6c5a5',0,.16,0,5,.3,4);
 for(const x of [-2,2])for(const z of [-1.5,1.5])cylinder(pavilion,'#a08665',x,1.8,z,.14,3.5,.14,8);
 const roof=mesh(new T.ConeGeometry(3.9,1.5,4),'#8e9f82',pavilion,0,4,0);roof.rotation.y=Math.PI/4;roof.scale.z=.85;
 box(pavilion,'#b39a73',0,1,0,2.8,.18,1.3);for(const x of [-1,1])box(pavilion,'#947d60',x,.56,0,.15,.9,1);
 for(const b of BENCHES)bench(root,b.x,b.z,b.angle);
 // Show-off plaza: a sunny circle around a notice board, where every friend gets a photo easel.
 cylinder(root,'#ecd9b0',-10,.08,7,3.5,.1,3.5,48);cylinder(root,'#f5e8c8',-10,.14,7,3.15,.08,3.15,48);
 const board=new T.Group();board.position.set(-10,0,7);root.add(board);
 for(const x of [-.85,.85])cylinder(board,'#a08665',x,1.05,0,.08,2.1,.08,8);
 box(board,'#c9a877',0,1.5,0,2.1,1.25,.12);box(board,'#fff6df',0,1.5,.07,1.85,1.02,.03);box(board,'#8e9f82',0,2.28,0,2.4,.12,.5);
 const paw=label('🐾','#8f9a80','#fff6df',.85);paw.position.set(0,1.62,.12);board.add(paw);const boardTitle=label('우리 아이 자랑','#8a6a4f','#fff6df',1.5);boardTitle.position.set(0,1.18,.12);board.add(boardTitle);
 for(let i=0;i<18;i++){const a=i*Math.PI/9;flowers(batch,-10+Math.cos(a)*3.5,7+Math.sin(a)*3.5,i%2?'#f6d27f':'#dba7b4',1.25);}
 for(let i=0;i<65;i++){const a=random()*Math.PI*2,r=18+random()*3;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<3&&z>15)continue;batch.add(GEO.blob,['#91a976','#a4b787','#b3c397'][i%3],x,.3,z,.5+random()*.5,.4,.6);}
 for(let i=0;i<100;i++){const a=random()*Math.PI*2,r=12+random()*8;flowers(batch,Math.cos(a)*r,Math.sin(a)*r,['#f3e9c3','#ede9df','#e6bdc4'][i%3],.7+random()*.6);}
 // Warm garden lamps, stones and picnic blanket.
 for(const [x,z]of [[-3,12],[-3,3],[3,3],[-6,6],[12,1],[1,-9],[26,7],[31,-16],[-26,-21],[-31,10],[-1,31],[14,-34]]){const y=heightAt(x,z);cylinder(root,'#7f8b72',x,y+.75,z,.045,1.5,.045,6);ball(root,'#f6e5b0',x,y+1.58,z,.18,.25,.18);cylinder(root,'#819077',x,y+1.84,z,.25,.1,.04,6);}
 const blanket=box(root,'#dcc5aa',9,.11,10,3.2,.03,2.5);blanket.rotation.y=.3;for(let i=0;i<4;i++){const stripe=box(root,'#f5e8cf',8+i*.55,.135,10,.15,.02,2.4);stripe.rotation.y=.3;}
 cylinder(root,'#b28f60',10,.4,10,.35,.6,.35,10);ball(root,'#ede3c5',8.3,.3,9.6,.4,.16,.4);
 for(let i=0;i<15;i++){const a=i*.78;ball(root,'#b9bbaa',7+Math.cos(a)*4.6,.2,-5+Math.sin(a)*4.6,.25+random()*.2,.2,.3);}
 // New zones past the original garden.
 lakeside(root,batch);brook(root,batch);lookout(root);
 for(let i=0;i<1300;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*15,x=4+Math.cos(a)*r,z=44+Math.sin(a)*r;if(Math.hypot(x,z)>58)continue;const patch=Math.floor((Math.sin(x*.32)+Math.cos(z*.27)+2)*1.24);flowers(batch,x,z,['#e8a0b4','#f3d27a','#b6a7e0','#f4efe4','#e2836f'][patch],.8+random()*.7,true);}
 arbor(root,2.6,38.5,.25);arbor(root,14,48,1.4);
 for(let i=0;i<340;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*18,x=-40+Math.cos(a)*r,z=16+Math.sin(a)*r;batch.add(GEO.disc,['#d9823f','#c9693f','#e3ac55'][i%3],x,heightAt(x,z)+.08,z,.11,.012,.08,false,random()*3);}
 for(let i=0;i<70;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*18,x=40+Math.cos(a)*r,z=-40+Math.sin(a)*r;if(Math.hypot(x,z)<57)batch.add(GEO.blob,'#aab09d',x,heightAt(x,z)+.15,z,.25+random()*.5,.2+random()*.3,.3+random()*.5);}
 for(let i=0;i<700;i++){const a=random()*Math.PI*2,r=27+random()*30,x=Math.cos(a)*r,z=Math.sin(a)*r;if(lakeDistance(x,z)>1.1)batch.add(GEO.cone,['#a4b787','#93aa78','#b3c397'][i%3],x,heightAt(x,z)+.2,z,.1,.36,.1,false);}
 batch.flush(root);
 const locations:[string,number,number][]=[['자랑 마당',-10,7],['물빛 연못',8,-5],['햇살 쉼터',-10,-9],['함께 걷는 잔디밭',10,11],['윤슬 호수',LAKE.x-4,LAKE.z],['바람 개울',20,-33],['구름 전망대',LOOKOUT.x,LOOKOUT.z],['단풍 숲길',-40,16],['들꽃 들판',4,44],['별빛 솔숲',38,-38]];
 for(const [name,x,z]of locations){const l=label(name,'#566d55','#fffff4',3.8);l.position.set(x,Math.max(0,heightAt(x,z))+4.8,z);root.add(l);}
 return water;
}
