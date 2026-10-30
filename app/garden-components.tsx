'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
import type {Pet} from './lib/domain';
export function PetPicture({kind,coat='cream',breed}:{kind:Pet['kind'];coat?:Pet['coat'];breed?:string}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{let stopped=false,dispose:(()=>void)|undefined;import('./pet-portrait').then(({renderPetPortrait})=>{if(!stopped&&host.current)dispose=renderPetPortrait(host.current,{name:'친구',kind,coat,breed:breed||(kind==='dog'?'shiba':'shorthair')});}).catch(()=>{if(host.current)host.current.textContent=kind==='dog'?'강아지':'고양이';});return()=>{stopped=true;dispose?.();};},[kind,coat,breed]);
 return <div className="pet-model-portrait" ref={host} aria-label={kind==='dog'?'강아지 3D 미리보기':'고양이 3D 미리보기'} role="img"/>;
}

export function Modal({title,eyebrow,children,onClose}:{title:string;eyebrow:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement as HTMLElement;const el=ref.current;el?.querySelector<HTMLElement>('button,input')?.focus();const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')close.current();if(e.key==='Tab'&&el){const focusables=Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,a[href]'));const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',listener);return()=>{document.removeEventListener('keydown',listener);previous?.focus();};},[]);
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="icon-button close" aria-label="닫기" onClick={onClose}><X size={20}/></button><span className="eyebrow">{eyebrow}</span><h2 id="dialog-title">{title}</h2>{children}</div></div>;
}
