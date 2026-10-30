import * as T from 'three';
import {BENCHES} from './benches';
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
 const g=new T.Group();const legs:T.Object3D[]=[],knees:T.Object3D[]=[];
 for(const x of [-.16,.16]){const leg=new T.Group();leg.position.set(x,.69,0);cylinder(leg,'#e5ddc9',0,-.12,0,.13,.24);const knee=new T.Group();knee.position.y=-.25;leg.add(knee);cylinder(knee,'#e5ddc9',0,-.12,0,.12,.24);ball(knee,'#fbf7e9',0,-.24,.09,.16,.1,.24);knees.push(knee);g.add(leg);legs.push(leg);}
 cylinder(g,color,0,1.05,0,.36,.7,.3);ball(g,'#e9bd93',0,1.65,0,.3,.32,.29);
 for(const x of [-.42,.42]){cylinder(g,color,x,1.09,0,.13,.55);ball(g,'#e9bd93',x,.78,0,.12);}
 cylinder(g,'#f4e5bd',0,1.88,0,.46,.09);ball(g,'#f4e5bd',0,1.93,0,.32,.17,.32);cylinder(g,'#a89877',0,1.91,0,.325,.07);
 for(const x of [-.1,.1])ball(g,'#49463a',x,1.66,.275,.025);
 box(g,'#b98b64',0,1.1,-.3,.45,.49,.16);g.userData={legs,knees};return g;
}
export function animateWalker(g:T.Group,t:number,moving:boolean){const legs=g.userData.legs as T.Object3D[]|undefined;legs?.forEach((l,i)=>l.rotation.x=moving?Math.sin(t*9+(g.userData.isPet?(i===0||i===3?0:Math.PI):i*Math.PI))*.35:0);if(g.userData.tail)g.userData.tail.rotation.z=Math.sin(t*5)*.25;}
let seed=47;
export function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
function tree(root:T.Object3D,x:number,z:number,scale=1,pink=false){
 const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);root.add(g);cylinder(g,'#99846b',0,1,0,.18,2.0,.13,7);
 const colors=pink?['#dba7b4','#ecc2c7','#f1cfd1']:['#829b69','#a0b584','#b0bf8d'];
 ball(g,colors[0],0,2.7,0,1.55,1.65,1.35);ball(g,colors[1],-.7,2.45,.35,1.1,1.2,1.1);ball(g,colors[2],.6,3.05,.2,1,1.2,1.1);
}
function flowers(root:T.Object3D,x:number,z:number,color:string,scale=1){
 const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);root.add(g);cylinder(g,'#7e996c',0,.2,0,.022,.4,.022,4);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,color,Math.cos(a)*.1,.44,Math.sin(a)*.1,.085,.05,.085);}ball(g,'#eac681',0,.47,0,.055);
}
function bench(root:T.Object3D,x:number,z:number,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);for(const q of [-.9,.9]){box(g,'#6c7965',q,.38,0,.12,.7,.65);}for(let i=0;i<3;i++){box(g,'#b79770',0,.76,(i-1)*.23,2.3,.11,.19);box(g,'#b79770',0,1.08+i*.2,-.37,2.3,.14,.1);}}
function path(root:T.Object3D,points:number[][],width:number){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.04,p[1])));const m=mesh(new T.TubeGeometry(curve,90,width,8,false),'#e9dfc5',root);m.scale.y=.035;m.position.y=.085;}
export function buildLandscape(root:T.Group){
 cylinder(root,'#c3ccb0',0,-.6,0,25.6,1.3,25.6,96);cylinder(root,'#a8bb91',0,-.28,0,25.7,.6,25.7,96);cylinder(root,'#b9c99b',0,.01,0,25.5,.10,25.5,96);
 path(root,[[-2,21],[-1,13],[0,5],[-1,0],[-8,-3],[-15,-10]],1.45);
 path(root,[[-17,8],[-10,8],[-4,7],[1,4],[7,2],[14,0],[18,-6]],1.25);
 path(root,[[0,5],[3,10],[10,13],[17,9]],1.05);
 path(root,[[-2,0],[1,-6],[0,-12],[-4,-18]],1.05);
 // A new outer loop connects the existing garden to a quiet walking lawn.
 const loop=Array.from({length:33},(_,i)=>{const a=i*Math.PI/16;return [Math.sin(a)*22.35,Math.cos(a)*22.35];});path(root,loop,.72);
 path(root,[[14,0],[19,0],[22.35,0]],.85);path(root,[[0,-12],[0,-19],[0,-22.35]],.85);path(root,[[-17,8],[-20,8],[-21.5,6]],.8);
 for(const a of [.3,1.2,2.1,3.2,4.3,5.2]){tree(root,Math.sin(a)*24.7,Math.cos(a)*24.7,.65);}

 const trailSign=label('바람 산책길','#566d55','#fffff4',3.6);trailSign.position.set(21,2.3,1);root.add(trailSign);
 // Pond and its pale stone bank.
 const bank=cylinder(root,'#d0cfaf',7,.08,-5,4.65,.11,4.65,64);bank.scale.z=.99;
 const water=cylinder(root,'#83b6ae',7,.15,-5,4.25,.04,4.25,64);water.material=new T.MeshStandardMaterial({color:'#8abeb6',roughness:.35,metalness:.12});water.castShadow=false;
 for(let i=0;i<5;i++){const a=i*1.2;const ring=mesh(new T.TorusGeometry(1+i*.5,.018,4,48),'#b9d7c7',root,7,.18,-5);ring.rotation.x=Math.PI/2;ring.scale.z=.6;}
 for(let i=0;i<8;i++){const a=random()*Math.PI*2,r=2+random()*1.5;const x=7+Math.cos(a)*r,z=-5+Math.sin(a)*r;const lily=cylinder(root,'#6f9d7c',x,.22,z,.25,.025,.25);lily.rotation.y=random()*3;if(i%3===0)flowers(root,x,z,'#f1c6ce',.6);}
 // Timber footbridge at the pond's front edge.
 for(let i=0;i<11;i++)box(root,'#c5ad84',5.4+i*.32,.35,-.8,.29,.15,1.8);
 for(const x of [5.4,8.7])for(const z of [-1.65,.05])cylinder(root,'#978562',x,.7,z,.07,1.2,.07,6);
 // Open picnic pavilion.
 const pavilion=new T.Group();pavilion.position.set(-10,0,-9.5);root.add(pavilion);box(pavilion,'#d6c5a5',0,.16,0,5,.3,4);
 for(const x of [-2,2])for(const z of [-1.5,1.5])cylinder(pavilion,'#a08665',x,1.8,z,.14,3.5,.14,8);
 const roof=mesh(new T.ConeGeometry(3.9,1.5,4),'#8e9f82',pavilion,0,4,0);roof.rotation.y=Math.PI/4;roof.scale.z=.85;
 box(pavilion,'#b39a73',0,1,0,2.8,.18,1.3);for(const x of [-1,1])box(pavilion,'#947d60',x,.56,0,.15,.9,1);
 for(const b of BENCHES)bench(root,b.x,b.z,b.angle);
 // Memorial grove with pink trees and an open stone circle.
 cylinder(root,'#d9d6bb',-10,.08,7,3.5,.1,3.5,48);cylinder(root,'#e6e0c9',-10,.14,7,3.15,.08,3.15,48);
 const shrine=new T.Group();shrine.position.set(-10,0,7);root.add(shrine);
 cylinder(shrine,'#c3c3af',0,.3,0,1.1,.4,1.1,12);box(shrine,'#dedecb',0,1.1,0,1.5,1.5,.55);ball(shrine,'#dedecb',0,1.83,0,.75,.35,.275);
 const heart=label('♡','#8f9a80','#dedecb',.85);heart.position.set(0,1.45,.3);shrine.add(heart);
 for(let i=0;i<18;i++){const a=i*Math.PI/9;flowers(root,-10+Math.cos(a)*3.5,7+Math.sin(a)*3.5,i%2?'#f4eee0':'#dba7b4',1.25);}
 for(const [x,z,s]of [[-17,3,1],[-16,10,1.2],[-9,14,1.1],[-5,12,.8],[-13,15,.8]])tree(root,x,z,s,true);
 // Mature trees around the island frame.
 for(const [x,z,s]of [[-17,-7,1.2],[-15,-14,1.3],[-8,-17,1.2],[-1,-19,1],[5,-17,1.2],[12,-14,1.4],[17,-9,1],[19,-2,1.1],[18,6,1.2],[14,13,1.1],[6,17,1.1],[-1,18,.8],[-19,-1,.8],[-18,6,.9]])tree(root,x,z,s);
 for(let i=0;i<65;i++){const a=random()*Math.PI*2,r=18+random()*3;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<3&&z>15)continue;ball(root,['#91a976','#a4b787','#b3c397'][i%3],x,.3,z,.5+random()*.5,.4,.6);}
 for(let i=0;i<100;i++){const a=random()*Math.PI*2,r=12+random()*8;flowers(root,Math.cos(a)*r,Math.sin(a)*r,['#f3e9c3','#ede9df','#e6bdc4'][i%3],.7+random()*.6);}
 // Low fence, warm garden lamps, stones and picnic blanket.
 for(let i=0;i<12;i++){const a=-.45+i*.11,x=Math.sin(a)*20,z=Math.cos(a)*20;if(Math.abs(x)<3)continue;const g=new T.Group();g.position.set(x,0,z);g.rotation.y=a;root.add(g);box(g,'#f0e7cf',0,.55,0,.12,1.1,.12);box(g,'#f0e7cf',1,.4,0,2,.08,.08);box(g,'#f0e7cf',1,.8,0,2,.08,.08);}
 for(const [x,z]of [[-3,12],[-3,3],[3,3],[-6,6],[12,1],[1,-9]]){cylinder(root,'#7f8b72',x,.75,z,.045,1.5,.045,6);ball(root,'#f6e5b0',x,1.58,z,.18,.25,.18);cylinder(root,'#819077',x,1.84,z,.25,.1,.04,6);}
 const blanket=box(root,'#dcc5aa',9,.11,10,3.2,.03,2.5);blanket.rotation.y=.3;for(let i=0;i<4;i++){const stripe=box(root,'#f5e8cf',8+i*.55,.135,10,.15,.02,2.4);stripe.rotation.y=.3;}
 cylinder(root,'#b28f60',10,.4,10,.35,.6,.35,10);ball(root,'#ede3c5',8.3,.3,9.6,.4,.16,.4);
 for(let i=0;i<15;i++){const a=i*.78;ball(root,'#b9bbaa',7+Math.cos(a)*4.6,.2,-5+Math.sin(a)*4.6,.25+random()*.2,.2,.3);}
 const locations:[string,number,number][]=[['기억의 숲',-10,7],['물빛 연못',8,-5],['햇살 쉼터',-10,-9],['함께 걷는 잔디밭',10,11]];
 for(const [name,x,z]of locations){const l=label(name,'#566d55','#fffff4',3.8);l.position.set(x,4.8,z);root.add(l);}
 return water;
}
