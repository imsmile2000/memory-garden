import * as T from 'three';
import {COATS,type Pet} from './domain';
// Smooth anatomical parts, physically shaded eyes and fine directional fur.
export function makeDetailedPet(pet:Pet){
 const cat=pet.kind==='cat',b=pet.breed,g=new T.Group();
 const long=['poodle','pomeranian','maltese','persian','ragdoll','mainecoon'].includes(b);
 const short=['corgi','dachshund'].includes(b),stocky=['british','persian','corgi'].includes(b);
 const catShapes:Record<string,{width:number;length:number;leg:number;headW:number;headH:number;ear:number;tail:number}>={
  shorthair:{width:.24,length:.48,leg:.36,headW:.29,headH:.26,ear:.17,tail:.042},
  russian:{width:.205,length:.56,leg:.43,headW:.255,headH:.27,ear:.23,tail:.034},
  siamese:{width:.20,length:.61,leg:.45,headW:.245,headH:.245,ear:.27,tail:.032},
  ragdoll:{width:.28,length:.60,leg:.35,headW:.31,headH:.27,ear:.17,tail:.12},
  persian:{width:.33,length:.46,leg:.25,headW:.36,headH:.30,ear:.10,tail:.14},
  british:{width:.32,length:.48,leg:.29,headW:.35,headH:.31,ear:.12,tail:.075},
  bengal:{width:.235,length:.64,leg:.44,headW:.27,headH:.245,ear:.18,tail:.04},
  mainecoon:{width:.31,length:.74,leg:.47,headW:.31,headH:.30,ear:.28,tail:.14}
 };const catShape=catShapes[b]||catShapes.shorthair;

 const chosenCoat=COATS.find(c=>c.id===pet.coat)!.color;
 const base=b==='dalmatian'?new T.Color(chosenCoat).lerp(new T.Color('#fffaf1'),.84).getStyle():chosenCoat;
 const pale='#fbf2e2',point=pet.coat==='black'?'#272b31':pet.coat==='gray'?'#536475':'#70513e',materials:T.Material[]=[];
 const tex=document.createElement('canvas');tex.width=512;tex.height=512;const c=tex.getContext('2d')!;
 c.fillStyle='#b5b5b5';c.fillRect(0,0,512,512);let seed=37;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 for(let i=0;i<18000;i++){const x=rand()*512,y=rand()*512;c.strokeStyle=rand()>.5?'rgba(255,255,255,.35)':'rgba(20,20,20,.24)';c.lineWidth=.6+rand()*.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+rand()*2-1,y+3+rand()*9);c.stroke();}
 const texture=new T.CanvasTexture(tex);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2,2);
 function mat(color:string,fur=true){const m=new T.MeshPhysicalMaterial({color,roughness:fur?.94:.2,metalness:0,bumpMap:fur?texture:null,bumpScale:fur?.009:0,sheen:fur?.45:0,sheenRoughness:.8,sheenColor:new T.Color('#e2d5c6'),clearcoat:fur?0:.7});m.userData.petOwned=true;materials.push(m);return m;}
 const coat=mat(base),white=mat(pale),dark=mat(point),nose=mat(cat?'#b9807c':'#25221e',false),eyeDark=mat('#0c1310',false),iris=mat(['siamese','ragdoll','husky'].includes(b)?'#80bdd1':b==='russian'?'#92b75e':cat?'#bba054':'#785331',false);
 function part(parent:T.Object3D,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){const o=new T.Mesh(new T.SphereGeometry(1,32,24),m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const legH=cat?catShape.leg:b==='pomeranian'?.23:short?.27:b==='retriever'?.56:.46,bodyY=legH+.18,bodyL=cat?catShape.length:b==='dachshund'?.82:b==='retriever'?.76:b==='pomeranian'?.40:b==='corgi'?.68:.56,bodyW=cat?catShape.width:b==='dachshund'?.235:b==='retriever'?.33:b==='pomeranian'?.32:stocky?.30:.29;
 part(g,coat,0,bodyY,0,bodyW,cat?.27:b==='dachshund'?.23:.32,bodyL);
 part(g,coat,0,bodyY+.02,bodyL*.55,bodyW*.88,cat?.25:b==='dachshund'?.22:.30,.26);
 if(['shiba','corgi','husky','beagle','ragdoll'].includes(b))part(g,white,0,bodyY-.04,.46,bodyW*.79,.27,.15);
 const neck=new T.Group();neck.position.set(0,bodyY+.15,bodyL*.63);neck.rotation.x=-.22;g.add(neck);part(neck,coat,0,.06,0,bodyW*.8,.27,.23);
 const head=new T.Group();head.position.set(0,bodyY+(cat?.30:b==='dachshund'?.22:.32),bodyL*.8);g.add(head);
 const hw=cat?catShape.headW:b==='dachshund'?.23:b==='pomeranian'?.28:.29,hy=cat?catShape.headH:b==='retriever'?.25:b==='dachshund'?.23:.29;
 const headSurface=part(head,coat,0,0,0,hw,hy,cat?.265:b==='dachshund'?.26:.29);
 const masked=['siamese','ragdoll'].includes(b);
 if(masked){
  const fc=document.createElement('canvas');fc.width=512;fc.height=256;const ctx=fc.getContext('2d')!,pixels=ctx.createImageData(512,256);
  const main=new T.Color(base),mark=new T.Color(point),light=new T.Color(pale);
  // Project the markings onto the continuous head, preserving its rounded shape.
  for(let v=0;v<256;v++)for(let u=0;u<512;u++){const phi=u/512*Math.PI*2,theta=v/256*Math.PI,x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta),z=Math.sin(phi)*Math.sin(theta);let color=main;
   if(z>.25){if(b==='ragdoll')color=Math.abs(x)<(.13+.48*Math.max(0,.35-y))||y<-.38?light:mark;else color=mark;}
   const srgb=color.clone().convertLinearToSRGB(),i=(v*512+u)*4;pixels.data[i]=Math.round(srgb.r*255);pixels.data[i+1]=Math.round(srgb.g*255);pixels.data[i+2]=Math.round(srgb.b*255);pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);const faceTexture=new T.CanvasTexture(fc);faceTexture.colorSpace=T.SRGBColorSpace;const faceMat=coat.clone();faceMat.color.set('#fff');faceMat.map=faceTexture;faceMat.userData.petOwned=true;headSurface.material=faceMat;g.userData.faceTexture=faceTexture;
 }

 if(b==='husky'){for(const sign of [-1,1]){const mask=part(head,white,sign*.13,-.025,.215,.115,.17,.065);mask.rotation.z=sign*-.25;}part(head,white,0,.125,.24,.045,.14,.04);}
 const snout=cat?(b==='persian'?.045:.07):b==='retriever'?.37:b==='pomeranian'?.14:['poodle','dachshund','beagle'].includes(b)?.32:.22;
 const muzzle=masked?dark:['shiba','corgi','husky','beagle'].includes(b)?white:coat;
 if(cat){for(const sign of [-1,1])part(head,b==='ragdoll'?white:coat,sign*.052,-.085,.24,b==='persian'?.067:.078,.05,.034);}else if(b==='dachshund'){part(head,coat,0,-.075,.29,.115,.095,.27);part(head,coat,0,-.03,.19,.15,.12,.18);}else for(const sign of [-1,1])part(head,muzzle,sign*.065,-.085,.20,.10,.085,snout);
 part(head,nose,0,cat?-.048:-.045,cat?.291:b==='dachshund'?.535:.20+snout*.91,cat?.028:.052,cat?.022:.032,cat?.019:.033);
 if(cat){for(const sign of [-1,1]){const smile=new T.QuadraticBezierCurve3(new T.Vector3(0,-.08,.289),new T.Vector3(sign*.022,-.125,.285),new T.Vector3(sign*.055,-.105,.282));head.add(new T.Mesh(new T.TubeGeometry(smile,10,.003,4,false),dark));}}else part(head,dark,0,-.151,.23,.065,.005,snout*.65);
 for(const sign of [-1,1]){
  const x=sign*hw*(cat?.48:.52),z=cat?.244:b==='husky'?.282:.245;
  part(head,eyeDark,x,.055,z,.055,.063,.018);
  part(head,iris,x,.057,z+.012,.044,.050,.012);
  part(head,eyeDark,x,.057,z+.022,cat?.035:.033,.045,.007);
  part(head,mat('#ffffff',false),x-.011,.072,z+.030,.010,.010,.004);
  const pointy=cat||['shiba','husky','corgi','pomeranian'].includes(b);
  if(pointy){
   const h=b==='corgi'?.32:cat?catShape.ear:b==='husky'?.22:b==='pomeranian'?.16:.25;const shape=new T.Shape();shape.moveTo(-.10,0);shape.quadraticCurveTo(-.08,h*.6,0,h);shape.quadraticCurveTo(.09,h*.5,.12,0);shape.closePath();
   const ear=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.018,bevelThickness:.018,curveSegments:16}),masked?dark:coat);ear.position.set(sign*hw*.70,hy*.67,-.055);ear.rotation.z=sign*-.18;ear.castShadow=true;head.add(ear);
   const inner=new T.Mesh(new T.ShapeGeometry(shape),mat(cat?'#c29c98':'#a6a09a'));inner.scale.set(.58,.7,1);inner.position.set(sign*hw*.70,hy*.71,.02);inner.rotation.z=sign*-.18;head.add(inner);
   if(b==='mainecoon')for(let k=0;k<3;k++){const tuft=new T.Mesh(new T.ConeGeometry(.013,.11,5),coat);tuft.position.set(sign*hw*.72+(k-1)*.018,hy*.65+h+.025,-.01);head.add(tuft);}
  }else{const e=part(head,['beagle','dachshund'].includes(b)?dark:coat,sign*hw*.94,b==='retriever'?-.13:b==='dachshund'?-.105:-.04,-.015,b==='dachshund'?.105:.10,b==='retriever'?.32:b==='dachshund'?.245:long?.28:.29,b==='retriever'?.12:b==='dachshund'?.10:.15);e.rotation.z=sign*.13;}
  if(cat)for(let i=0;i<3;i++){const curve=new T.QuadraticBezierCurve3(new T.Vector3(sign*.10,-.085+i*.016,.285),new T.Vector3(sign*.24,-.09+i*.027,.27),new T.Vector3(sign*.34,-.11+i*.038,.22));const whisker=new T.Mesh(new T.TubeGeometry(curve,8,.0012,3,false),white);head.add(whisker);}
 }
 const legs:T.Object3D[]=[];
 for(const x of [-bodyW*.66,bodyW*.66])for(const z of [-bodyL*.68,bodyL*.69]){const leg=new T.Group();leg.position.set(x,bodyY-.09,z);g.add(leg);const back=z<0;part(leg,coat,0,-.04,back?-.03:0,cat?.078:b==='dachshund'?.078:.095,legH*.34,cat?.09:.105);part(leg,coat,0,-legH*.35,back?.04:0,cat?.057:.065,legH*.38,.063);part(leg,masked?dark:['beagle','corgi','husky','shiba'].includes(b)?white:coat,0,-legH*.68,.04,cat?.075:.085,.055,cat?.10:.12);legs.push(leg);}
 const tail=new T.Group();tail.position.set(0,bodyY+.11,-bodyL*.82);g.add(tail);
 const curled=['shiba','pomeranian','husky'].includes(b);const points=curled?[[0,0,0],[0,.24,-.2],[.03,.43,-.1],[.03,.31,.08]]:cat?(b==='persian'||b==='ragdoll'||b==='mainecoon'?[[0,0,0],[.15,.10,-.25],[.36,.15,-.40],[.48,.25,-.32]]:b==='bengal'?[[0,0,0],[0,.03,-.3],[.09,.08,-.6],[.18,.22,-.7]]:[[0,0,0],[0,.3,-.2],[.04,.62,-.24],[.13,.73,-.19]]):[[0,0,0],[0,.04,-.25],[.06,.16,-.49],[.10,.28,-.66]];
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number])));
 const tailGeometry=new T.TubeGeometry(curve,28,cat?catShape.tail:b==='husky'?.11:long?.12:b==='retriever'?.09:b==='dachshund'?.035:.065,10,false);
 const tailPositions=tailGeometry.attributes.position;for(let i=0;i<=28;i++){const center=curve.getPointAt(i/28),taper=Math.max(.025,Math.pow(1-i/28,.38));for(let j=0;j<=10;j++){const index=i*11+j;const vertex=new T.Vector3().fromBufferAttribute(tailPositions,index).sub(center).multiplyScalar(taper).add(center);tailPositions.setXYZ(index,vertex.x,vertex.y,vertex.z);}}tailGeometry.computeVertexNormals();
 const tailMesh=new T.Mesh(tailGeometry,masked?dark:coat);tail.add(tailMesh);
 if(['shorthair','bengal','dalmatian','beagle'].includes(b)){
  const pc=document.createElement('canvas');pc.width=512;pc.height=256;const ctx=pc.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,512,256);ctx.fillStyle=b==='dalmatian'?'#24252b':point;ctx.strokeStyle=point;
  if(b==='beagle'){ctx.beginPath();ctx.ellipse(256,105,185,85,0,0,Math.PI*2);ctx.fill();}
  else if(b==='shorthair'){ctx.lineWidth=12;ctx.lineCap='round';for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(i*44,48);ctx.bezierCurveTo(i*44+24,100,i*44-16,140,i*44+8,192);ctx.stroke();}}
  else for(let i=0;i<70;i++){const x=rand()*512,y=40+rand()*180;ctx.beginPath();ctx.ellipse(x,y,b==='bengal'?7:8,5+rand()*7,rand()*3,0,Math.PI*2);if(b==='bengal'){ctx.lineWidth=3;ctx.stroke();}else ctx.fill();}
  const patternTexture=new T.CanvasTexture(pc);patternTexture.colorSpace=T.SRGBColorSpace;
  const patterned=coat.clone();patterned.color.set('#ffffff');patterned.map=patternTexture;patterned.userData.petOwned=true;
  if(b==='dalmatian')g.traverse(o=>{if(o instanceof T.Mesh&&o.material===coat)o.material=patterned;});else (g.children[0] as T.Mesh).material=patterned;g.userData.patternTexture=patternTexture;
 }
 if(['mainecoon'].includes(b)){
  // Rounded cheek ruffs and a layered bib distinguish long-haired breeds.
  for(const sign of [-1,1]){part(head,coat,sign*hw*.72,-.07,-.015,hw*.46,.19,.21);part(g,b==='ragdoll'?white:coat,sign*bodyW*.42,bodyY+.12,bodyL*.56,.18,.27,.22);}
 }
 if(b==='british'){for(const sign of [-1,1])part(head,coat,sign*.17,-.08,.12,.14,.13,.12);}
 if(b==='ragdoll'){part(g,white,0,bodyY+.03,bodyL*.55,.23,.27,.18);}
 if(b==='persian'){
  // One soft, continuous ruff under the round face, with small low-set ears.
  part(g,coat,0,bodyY+.13,bodyL*.55,.32,.25,.25);headSurface.scale.set(.345,.30,.265);
 }

 if(b==='husky'){for(const sign of [-1,1])part(head,white,sign*.19,-.105,.11,.13,.13,.16);}
 if(b==='pomeranian'){
  part(g,coat,0,bodyY+.02,bodyL*.32,.38,.30,.36);
  part(g,coat,0,bodyY+.04,-bodyL*.45,.33,.28,.30);
 }
 if(b==='retriever'){
  part(g,coat,0,bodyY+.03,bodyL*.60,.26,.36,.27);
  for(const sign of [-1,1]){const fringe=part(head,coat,sign*.28,-.20,-.04,.105,.22,.12);fringe.rotation.z=sign*.08;}
 }

 if(b==='maltese'){for(const sign of [-1,1])part(head,coat,sign*.23,-.09,.02,.14,.26,.15);}


 if(b==='poodle'){for(let i=0;i<22;i++){const a=i*2.4;part(head,coat,Math.cos(a)*hw*.85,Math.sin(a)*hy*.9,-.02,.09,.09,.09);}for(const sign of [-1,1])part(head,coat,sign*.29,-.06,-.03,.14,.25,.16);}
 const collar=new T.Mesh(new T.TorusGeometry(bodyW*.76,.023,8,40),mat('#597567',false));collar.rotation.x=Math.PI/2;collar.position.set(0,bodyY+.16,bodyL*.57);g.add(collar);
 const scale=cat?(b==='mainecoon'?1.13:.94):['maltese','pomeranian','poodle'].includes(b)?.85:['retriever','husky','dalmatian'].includes(b)?1.12:1;g.scale.setScalar(scale);
 g.userData={...g.userData,legs,tail,head,isPet:true,furTexture:texture};return g;
}
