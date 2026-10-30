import * as T from 'three';
import {makeDetailedPet} from './lib/pet-model';
import type {Pet} from './lib/domain';
export function renderPetPortrait(host:HTMLElement,pet:Pet){
 const scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
 renderer.setSize(512,512);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const model=makeDetailedPet(pet);scene.add(model);model.rotation.y=-.4;
 const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
 const camera=new T.PerspectiveCamera(34,1,.01,30);
 scene.add(new T.HemisphereLight('#fff9ed','#8f9983',2));const key=new T.DirectionalLight('#fff7e5',3.4);key.position.set(-3,5,5);scene.add(key);const rim=new T.DirectionalLight('#d5e5fa',2);rim.position.set(3,2,-3);scene.add(rim);
 const direction=new T.Vector3(.48,.25,1).normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),tan=Math.tan(34*Math.PI/360);let distance=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new T.Vector3(x,y,z).sub(center);distance=Math.max(distance,Math.max(Math.abs(v.dot(right))/tan,Math.abs(v.dot(up))/tan)+v.dot(direction));}
 camera.position.copy(center).add(direction.multiplyScalar(distance*1.08));camera.lookAt(center);camera.updateProjectionMatrix();
 const img=document.createElement('img');img.alt=pet.kind==='dog'?'선택한 강아지':'선택한 고양이';
 try{renderer.render(scene,camera);img.src=renderer.domElement.toDataURL('image/png');host.replaceChildren(img);}
 finally{scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});model.userData.furTexture?.dispose();model.userData.patternTexture?.dispose();model.userData.faceTexture?.dispose();renderer.dispose();renderer.forceContextLoss();}
 return()=>img.remove();
}
