import * as T from 'three';
import {nearestBench} from './lib/benches';
import {actionPose,ACTION_DURATION,type PetAction} from './lib/pet-actions';
import {DEFAULT_PITCH,eyePose,followPose,type Pose} from './lib/multiplayer';
import {makeAvatar,makePet,animateWalker,poseSeated,buildLandscape,label,box,ball,cylinder,mesh} from './lib/models';
import {findPath,lineClear,walkable,type Point} from './lib/navigation';
import {arrivalSpeed,damp,dampAngle,slide,WALK_SPEED} from './lib/locomotion';
import {PLACES,groundHit,surfaceAt} from './lib/terrain';
import type {Pet,Memorial,Visitor} from './lib/domain';
export type ViewMode='first'|'third';
export type SceneApi={setView:(mode:ViewMode)=>void;setPet:(pet:Pet)=>void;goTo:(place:string)=>void;gesture:()=>void;performAction:(action:PetAction)=>void;toggleBench:()=>boolean;setMemorials:(m:Memorial[])=>void;setVisitors:(v:Visitor[])=>void;zoom:(direction:number)=>void;reset:()=>void;pause:(value:boolean)=>void;position:()=>Pose;destroy:()=>void};
export function createGarden(host:HTMLElement,pet:Pet,onSelect:(id:string)=>void,onMove:(p:Point)=>void,onSit:(sitting:boolean)=>void):SceneApi{
 const scene=new T.Scene();scene.background=new T.Color('#e7ecdf');scene.fog=new T.Fog('#e7ecdf',60,175);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','3D 정원. 바닥을 눌러 이동하거나 방향키를 사용하세요.');renderer.domElement.tabIndex=0;
 const camera=new T.PerspectiveCamera(68,1,.05,270);let yaw=0,pitch=DEFAULT_PITCH,walkingNow=false,view:ViewMode='third',petYaw=0,transition=0,lookFree=false,lookGoal:{yaw?:number;pitch?:number}|null=null,replanned=0,petRouteAt=0,petRoute:Point[]=[],velocity={x:0,z:0},petVelocity={x:0,z:0};
 renderer.domElement.style.touchAction='none';
 scene.add(new T.HemisphereLight('#fff5d9','#789377',2.1));const sun=new T.DirectionalLight('#fff0d4',2.3);sun.position.set(-15,30,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:.5,far:90});sun.shadow.bias=-.0006;sun.shadow.normalBias=.06;scene.add(sun,sun.target);
 const backdrop=mesh(new T.PlaneGeometry(700,700),'#e7ecdf',scene,0,-4,0);backdrop.rotation.x=-Math.PI/2;backdrop.castShadow=false;
 const world=new T.Group();scene.add(world);buildLandscape(world);
 const avatar=makeAvatar();avatar.position.set((Math.random()-.5)*3,.12,10+(Math.random()-.5)*2);scene.add(avatar);let companion=makePet(pet);companion.position.set(1,.12,11);scene.add(companion);
 const petName=label(pet.name,'#5b735c','#fffdf2',1.7);companion.add(petName);petName.position.set(0,1.85,0);petName.visible=false;
 const playerLabel=label('나','#fffdf2','#748e76',.65);playerLabel.position.set(0,2.65,0);avatar.add(playerLabel);
 const marker=mesh(new T.RingGeometry(.18,.28,24),'#fffbea',scene);marker.rotation.x=-Math.PI/2;marker.visible=false;marker.castShadow=false;
 const eye=new T.Vector3(avatar.position.x,1.8,avatar.position.z+4),focus=new T.Vector3(avatar.position.x,1,avatar.position.z-10);
 const ray=new T.Raycaster(),pointer=new T.Vector2(),keys=new Set<string>();let path:Point[]=[],paused=false,frame=0,last=performance.now(),clock=0,tick=0,disposed=false;
 let seated=false,standPoint={x:0,z:10};
 let petAction:{kind:PetAction;elapsed:number;heading:number}|null=null;
 let memorialSignature="";let memGroup=new T.Group();scene.add(memGroup);const remote=new Map<string,{avatar:T.Group;pet:T.Group;target:Point;config:string;heading:number;moving:boolean;received:number;seq?:number;speed:number}>();
 const particles:{sprite:T.Sprite;life:number}[]=[];
 const positions={trail:{x:22,z:0},memorial:{x:-6,z:8},pond:{x:9,z:1},picnic:{x:-12,z:-4},meadow:{x:9,z:10},entrance:{x:0,z:10},...PLACES};
 function stand(){if(!seated)return;seated=false;transition=.7;avatar.position.set(standPoint.x,surfaceAt(standPoint.x,standPoint.z)+.12,standPoint.z);onSit(false);onMove(standPoint);}
 function navigate(p:Point){stand();path=findPath(avatar.position,p);lookFree=false;const end=path.at(-1);if(end){marker.position.set(end.x,surfaceAt(end.x,end.z)+.1,end.z);marker.visible=true;}}
 let down={x:0,y:0},dragging=false,dragged=false,lastPointer={x:0,y:0};
 const pointerDown=(e:PointerEvent)=>{if(paused)return;down={x:e.clientX,y:e.clientY};lastPointer={...down};dragging=true;dragged=false;renderer.domElement.setPointerCapture(e.pointerId);};
 const pointerMove=(e:PointerEvent)=>{if(!dragging||paused)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragged=true;if(dragged){lookGoal=null;lookFree=true;yaw-=dx*.004;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.05,.8);}lastPointer={x:e.clientX,y:e.clientY};};
 const pointerUp=(e:PointerEvent)=>{
  dragging=false;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);if(paused||dragged||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;
  const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
  const hits=ray.intersectObjects(memGroup.children,true);if(hits.length){let o:T.Object3D|null=hits[0].object;while(o&&!o.userData.memorial)o=o.parent;if(o?.userData.memorial){onSelect(o.userData.memorial);return;}}
  const petHits=ray.intersectObject(companion,true);if(petHits.length){gesture();return;}
  const point=groundHit(ray.ray.origin,ray.ray.direction);if(point)navigate(point);
 };
 const keyDown=(e:KeyboardEvent)=>{if(paused||/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)||((e.target as HTMLElement)?.isContentEditable))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();stand();keys.add(e.key.toLowerCase());path=[];lookGoal=null;marker.visible=false;}};
 const keyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase()),blur=()=>{keys.clear();dragging=false;};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointercancel',blur);window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function gesture(){for(let i=0;i<5;i++){const heart=label('♥','#cd8f96','#ffffff00',.5);heart.position.copy(companion.position).add(new T.Vector3((Math.random()-.5)*.8,1.5+Math.random()*.5,(Math.random()-.5)*.8));scene.add(heart);particles.push({sprite:heart,life:1.8+i*.12});}}
 function disposeObject(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m.userData.petOwned)m.dispose();});}if(o.userData.furTexture)o.userData.furTexture.dispose();if(o.userData.patternTexture)o.userData.patternTexture.dispose();if(o.userData.faceTexture)o.userData.faceTexture.dispose();if(o instanceof T.Sprite){o.material.map?.dispose();o.material.dispose();}});root.removeFromParent();}
 function step(){if(disposed)return;frame=requestAnimationFrame(step);const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;clock+=dt;transition=Math.max(0,transition-dt);let wantX=0,wantZ=0;
  if(!paused&&!petAction&&!seated){
   if(keys.size){let x=0,z=0;if(keys.has('w')||keys.has('arrowup'))z-=1;if(keys.has('s')||keys.has('arrowdown'))z+=1;if(keys.has('a')||keys.has('arrowleft'))x-=1;if(keys.has('d')||keys.has('arrowright'))x+=1;
    const fx=Math.sin(yaw),fz=-Math.cos(yaw),dirX=fx*-z+Math.cos(yaw)*x,dirZ=fz*-z+Math.sin(yaw)*x,len=Math.hypot(dirX,dirZ);if(len>0){wantX=dirX/len*WALK_SPEED;wantZ=dirZ/len*WALK_SPEED;}
   }else if(path.length){
    let p=path[0],dx=p.x-avatar.position.x,dz=p.z-avatar.position.z,d=Math.hypot(dx,dz);
    while(path.length>1&&d<.8){path.shift();p=path[0];dx=p.x-avatar.position.x;dz=p.z-avatar.position.z;d=Math.hypot(dx,dz);}
    if(path.length===1&&d<.1)path=[];else if(d>0){const pace=arrivalSpeed(d,path.length===1);wantX=dx/d*pace;wantZ=dz/d*pace;if(!lookFree&&d>.5)lookGoal={yaw:Math.atan2(dx,-dz)};}
   }
  }
  velocity.x=damp(velocity.x,wantX,8,dt);velocity.z=damp(velocity.z,wantZ,8,dt);
  const before={x:avatar.position.x,z:avatar.position.z};
  if(!seated&&Math.hypot(velocity.x,velocity.z)>.01){const moved=slide(avatar.position,velocity.x*dt,velocity.z*dt,walkable);avatar.position.x=moved.x;avatar.position.z=moved.z;if(moved.blockedX)velocity.x=0;if(moved.blockedZ)velocity.z=0;if(moved.blockedX&&moved.blockedZ&&path.length&&now-replanned>500){replanned=now;path=findPath(avatar.position,path[path.length-1]);}}
  const speed=seated?0:Math.hypot(avatar.position.x-before.x,avatar.position.z-before.z)/Math.max(dt,.001),moving=speed>.25;
  if(!seated)avatar.position.y=damp(avatar.position.y,surfaceAt(avatar.position.x,avatar.position.z)+.12,14,dt);
  if(!path.length)marker.visible=false;else marker.position.y=surfaceAt(marker.position.x,marker.position.z)+.1;
  if(!seated&&moving)avatar.rotation.y=dampAngle(avatar.rotation.y,Math.atan2(velocity.x,velocity.z),9,dt);
  animateWalker(avatar,dt,speed);if(seated)poseSeated(avatar);
  avatar.visible=view==='third';
  // The companion trails a smoothed heading, so it does not whip around every time the view turns.
  petYaw=dampAngle(petYaw,yaw,1.6,dt);const body=avatar.rotation.y,offset=view==='first'?{x:Math.sin(petYaw)*2.1+Math.cos(petYaw)*.85,z:-Math.cos(petYaw)*2.1+Math.sin(petYaw)*.85}:{x:Math.sin(body)*.3+Math.cos(body)*1.1,z:Math.cos(body)*.3-Math.sin(body)*1.1};
  const petGoal={x:avatar.position.x+offset.x,z:avatar.position.z+offset.z};let petStop=.15;if(!walkable(petGoal)){petGoal.x=avatar.position.x;petGoal.z=avatar.position.z;petStop=1;}
  let petWantX=0,petWantZ=0,petSpeed=0;
  if(!paused&&!petAction&&!seated){
   let aim=petGoal,d=Math.hypot(petGoal.x-companion.position.x,petGoal.z-companion.position.z);
   if(d>30){companion.position.x=petGoal.x;companion.position.z=petGoal.z;petVelocity={x:0,z:0};d=0;}
   else if(d>petStop&&!lineClear(companion.position,petGoal,.3)){if(now-petRouteAt>700){petRouteAt=now;petRoute=findPath(companion.position,petGoal);}while(petRoute.length>1&&Math.hypot(petRoute[0].x-companion.position.x,petRoute[0].z-companion.position.z)<.7)petRoute.shift();if(petRoute[0])aim=petRoute[0];}
   const ax=aim.x-companion.position.x,az=aim.z-companion.position.z,al=Math.hypot(ax,az),pace=aim===petGoal?Math.min(5.6,Math.max(0,d-petStop)*4):5;if(al>.001&&pace>.05){petWantX=ax/al*pace;petWantZ=az/al*pace;}
  }
  petVelocity.x=damp(petVelocity.x,petWantX,6,dt);petVelocity.z=damp(petVelocity.z,petWantZ,6,dt);
  if(!petAction&&!seated&&Math.hypot(petVelocity.x,petVelocity.z)>.01){const petBefore={x:companion.position.x,z:companion.position.z},moved=slide(companion.position,petVelocity.x*dt,petVelocity.z*dt,walkable);companion.position.x=moved.x;companion.position.z=moved.z;if(moved.blockedX)petVelocity.x=0;if(moved.blockedZ)petVelocity.z=0;petSpeed=Math.hypot(moved.x-petBefore.x,moved.z-petBefore.z)/Math.max(dt,.001);if(petSpeed>.25)companion.rotation.y=dampAngle(companion.rotation.y,Math.atan2(petVelocity.x,petVelocity.z),7,dt);}
  animateWalker(companion,dt,petSpeed);const petGround=surfaceAt(companion.position.x,companion.position.z)+.12;companion.position.y=petGround+(companion.userData.bob||0);
  if(petAction){if(!paused)petAction.elapsed+=dt;const progress=Math.min(1,petAction.elapsed/ACTION_DURATION[petAction.kind]),pose=actionPose(petAction.kind,progress);companion.position.y=petGround+pose.height-pose.sit*.07;companion.rotation.set(-pose.sit*.18,petAction.heading+pose.turn,0);if(companion.userData.head)companion.userData.head.rotation.x=pose.nod+pose.sit*.18;companion.userData.legs?.forEach((leg:T.Object3D,i:number)=>{leg.rotation.x=i%2===0?-pose.sit*1.05:pose.sit*.12;});if(progress===1){companion.rotation.set(0,petAction.heading,0);if(companion.userData.head)companion.userData.head.rotation.x=0;petAction=null;}}

  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.sprite.position.y+=dt*.7;p.sprite.material.opacity=Math.min(1,p.life);if(p.life<=0){disposeObject(p.sprite);particles.splice(i,1);}}
  for(const r of remote.values()){
   // Positions arrive twice a second: walk toward each one at a steady, eased pace instead of hopping.
   const dx=r.target.x-r.avatar.position.x,dz=r.target.z-r.avatar.position.z,d=Math.hypot(dx,dz);if(d>12){r.avatar.position.x=r.target.x;r.avatar.position.z=r.target.z;r.speed=0;}
   else{r.speed=damp(r.speed,Math.min(6,d/.55),6,dt);if(d>.01){const amount=Math.min(d,r.speed*dt);r.avatar.position.x+=dx/d*amount;r.avatar.position.z+=dz/d*amount;}}
   const walking=d>.05&&r.speed>.25;r.avatar.position.y=surfaceAt(r.avatar.position.x,r.avatar.position.z)+.12;r.avatar.rotation.y=dampAngle(r.avatar.rotation.y,walking?Math.atan2(dx,dz):r.heading,8,dt);animateWalker(r.avatar,dt,walking?Math.min(r.speed,WALK_SPEED):0);
   const h=r.avatar.rotation.y,goalX=r.avatar.position.x+Math.cos(h)*.9-Math.sin(h)*.3,goalZ=r.avatar.position.z-Math.sin(h)*.9-Math.cos(h)*.3,px=damp(r.pet.position.x,goalX,3.5,dt),pz=damp(r.pet.position.z,goalZ,3.5,dt),petPace=Math.hypot(px-r.pet.position.x,pz-r.pet.position.z)/Math.max(dt,.001);if(petPace>.25)r.pet.rotation.y=dampAngle(r.pet.rotation.y,Math.atan2(px-r.pet.position.x,pz-r.pet.position.z),7,dt);r.pet.position.x=px;r.pet.position.z=pz;animateWalker(r.pet,dt,petPace);r.pet.position.y=surfaceAt(px,pz)+.12+(r.pet.userData.bob||0);
  }
  walkingNow=moving;
  if(lookGoal){if(lookGoal.yaw!==undefined)yaw=dampAngle(yaw,lookGoal.yaw,2.4,dt);if(lookGoal.pitch!==undefined)pitch=damp(pitch,lookGoal.pitch,4,dt);}
  const standing=avatar.position.y-.12,pose=view==='first'?eyePose(avatar.position,yaw,pitch,seated,standing):followPose(avatar.position,yaw,pitch,standing,seated);
  if(view==='third')pose.position.y=Math.max(pose.position.y,surfaceAt(pose.position.x,pose.position.z)+.5);else pose.position.y+=(avatar.userData.bob||0)*.55;
  const positionRate=transition>0?5:view==='first'?22:7;eye.set(damp(eye.x,pose.position.x,positionRate,dt),damp(eye.y,pose.position.y,positionRate,dt),damp(eye.z,pose.position.z,positionRate,dt));camera.position.copy(eye);
  if(view==='first'&&!transition){focus.set(eye.x+(pose.target.x-pose.position.x)*10,eye.y+(pose.target.y-pose.position.y)*10,eye.z+(pose.target.z-pose.position.z)*10);}
  else{const reach=view==='first'?10:1,rate=transition>0?6:12;focus.set(damp(focus.x,pose.position.x+(pose.target.x-pose.position.x)*reach,rate,dt),damp(focus.y,pose.position.y+(pose.target.y-pose.position.y)*reach,rate,dt),damp(focus.z,pose.position.z+(pose.target.z-pose.position.z)*reach,rate,dt));}
  camera.lookAt(focus);
  const sunX=Math.round(avatar.position.x/3)*3,sunZ=Math.round(avatar.position.z/3)*3;sun.position.set(sunX-15,standing+30,sunZ+15);sun.target.position.set(sunX,standing,sunZ);
  if(now-tick>350){tick=now;onMove({x:avatar.position.x,z:avatar.position.z});}renderer.render(scene,camera);
 }
 step();
 return{
  setView(mode){if(mode===view)return;view=mode;transition=.7;lookGoal=null;pitch=mode==='third'?DEFAULT_PITCH:-.12;},
  setPet(p){petAction=null;const pos=companion.position.clone(),rot=companion.rotation.y;disposeObject(companion);companion=makePet(p);companion.position.copy(pos);companion.rotation.y=rot;const n=label(p.name,'#5b735c','#fffdf2',1.7);n.position.set(0,1.85,0);n.visible=false;companion.add(n);scene.add(companion);},
  goTo(place){navigate(positions[place as keyof typeof positions]||positions.entrance);},gesture,
  toggleBench(){if(seated){stand();return false;}const b=nearestBench(avatar.position);if(!b)return false;path=[];keys.clear();petAction=null;standPoint={x:avatar.position.x,z:avatar.position.z};seated=true;velocity={x:0,z:0};petVelocity={x:0,z:0};lookGoal=null;transition=.7;avatar.position.set(b.x,surfaceAt(b.x,b.z)+.13,b.z);avatar.rotation.y=b.angle;const side=new T.Vector3(1.45,0,.9).applyAxisAngle(new T.Vector3(0,1,0),b.angle).add(new T.Vector3(b.x,0,b.z));if(walkable(side))companion.position.set(side.x,surfaceAt(side.x,side.z)+.12,side.z);companion.rotation.set(0,b.angle,0);if(companion.userData.head)companion.userData.head.rotation.x=0;onSit(true);onMove({x:b.x,z:b.z});yaw=Math.PI-b.angle;petYaw=yaw;pitch=view==='third'?DEFAULT_PITCH:-.12;return true;},
  performAction(kind){if(paused)return;path=[];keys.clear();petAction={kind,elapsed:0,heading:companion.rotation.y};if(kind==='pet'||kind==='feed')gesture();lookGoal={yaw:Math.atan2(companion.position.x-avatar.position.x,-(companion.position.z-avatar.position.z)),pitch:-.5};},
  setMemorials(items){const signature=JSON.stringify(items);if(signature===memorialSignature)return;memorialSignature=signature;disposeObject(memGroup);memGroup=new T.Group();scene.add(memGroup);items.slice(0,30).forEach((item,i)=>{const angle=(i%10)/10*Math.PI*2,r=4.4+Math.floor(i/10)*1.5,x=-10+Math.cos(angle)*r,z=7+Math.sin(angle)*r;const g=new T.Group();g.position.set(x,.1,z);g.rotation.y=Math.atan2(Math.cos(angle),Math.sin(angle));g.userData.memorial=item.id;memGroup.add(g);for(const side of [-.32,.32]){const stand=box(g,'#a9825a',side,.68,0,.07,1.4,.07);stand.rotation.z=side>0?-.1:.1;}box(g,'#a9825a',0,.6,0,.72,.06,.14);box(g,'#c9a877',0,1.1,.03,1.06,.92,.05);box(g,['#fff6df','#fde8e4','#e8f3e4','#e9edf8'][i%4],0,1.1,.06,.94,.8,.02);const l=label(item.name,'#68755f','#fffdf1',1.8);l.position.set(0,item.photoUrl?2.05:1.8,0);g.add(l);if(item.photoUrl){const photoMaterial=new T.SpriteMaterial({color:0xffffff});const photoSprite=new T.Sprite(photoMaterial);photoSprite.position.set(0,1.1,.12);photoSprite.scale.set(.82,.72,1);g.add(photoSprite);new T.TextureLoader().load(item.photoUrl,texture=>{if(!scene.getObjectById(g.id)){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;photoMaterial.map=texture;photoMaterial.needsUpdate=true;const ratio=texture.image.width/texture.image.height;photoSprite.scale.set(ratio>=.82/.72?.82:.72*ratio,ratio>=.82/.72?.82/ratio:.72,1);},undefined,()=>{photoSprite.visible=false;});}if(item.flowers){const hearts=label(`♥ ${item.flowers}`,'#cd6f83','#fff6f4',1);hearts.position.set(.42,.3,.4);g.add(hearts);}if(item.candles){box(g,'#f0dcb4',-.42,.14,.4,.3,.07,.09);for(const q of [-.15,.15])for(const w of [-.04,.04])ball(g,'#f0dcb4',-.42+q,.14,.4+w,.055);}});},
  setVisitors(visitors){const ids=new Set(visitors.map(v=>v.id));for(const[id,r]of remote)if(!ids.has(id)){disposeObject(r.avatar);disposeObject(r.pet);remote.delete(id);}for(const v of visitors){const config=JSON.stringify(v.pet);let r=remote.get(v.id);if(r&&r.config!==config){disposeObject(r.pet);r.pet=makePet(v.pet);r.pet.position.copy(r.avatar.position);scene.add(r.pet);r.config=config;}if(!r){r={avatar:makeAvatar('#b0a6c4'),pet:makePet(v.pet),target:{x:v.x,z:v.z},config,heading:v.heading??0,moving:!!v.moving,received:performance.now(),seq:v.seq,speed:0};r.avatar.position.set(v.x,surfaceAt(v.x,v.z)+.12,v.z);r.pet.position.set(v.x+1,surfaceAt(v.x+1,v.z)+.12,v.z);const l=label('산책 친구','#72706e','#fffcf1',1.7);l.position.y=2.6;r.avatar.add(l);scene.add(r.avatar,r.pet);remote.set(v.id,r);}r.target={x:v.x,z:v.z};r.heading=v.heading??0;r.moving=!!v.moving;if(v.seq===undefined||v.seq!==r.seq){r.received=performance.now();r.seq=v.seq;}}},
  zoom(d){camera.fov=T.MathUtils.clamp(camera.fov+(d>0?-5:5),48,85);camera.updateProjectionMatrix();},
  reset(){lookGoal=null;yaw=0;pitch=view==='third'?DEFAULT_PITCH:-.12;camera.fov=68;camera.updateProjectionMatrix();},pause(v){paused=v;keys.clear();dragging=false;},position(){return{x:avatar.position.x,z:avatar.position.z,heading:Math.atan2(Math.sin(yaw),-Math.cos(yaw)),moving:walkingNow};},
  destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointercancel',blur);const materials=new Set<T.Material>();scene.traverse(o=>{if(o.userData.furTexture)o.userData.furTexture.dispose();if(o.userData.patternTexture)o.userData.patternTexture.dispose();if(o.userData.faceTexture)o.userData.faceTexture.dispose();if(o instanceof T.Mesh||o instanceof T.Sprite||o instanceof T.LineSegments){if(o instanceof T.Mesh||o instanceof T.LineSegments)o.geometry.dispose();const list=Array.isArray(o.material)?o.material:[o.material];list.forEach(m=>{materials.add(m);if('map'in m)(m as T.MeshStandardMaterial).map?.dispose();});}});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
 };
}
