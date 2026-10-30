export const COATS=[{id:'cream',name:'크림색',color:'#e4cba3'},{id:'brown',name:'갈색',color:'#b78258'},{id:'gray',name:'회색',color:'#8f9eae'},{id:'white',name:'흰색',color:'#f5eee4'},{id:'black',name:'검정색',color:'#41454e'},{id:'golden',name:'골드',color:'#d9a04d'},{id:'chocolate',name:'초콜릿색',color:'#704b3e'}] as const;
export type Pet = { name: string; kind: 'dog' | 'cat'; coat: 'cream' | 'brown' | 'gray' | 'white' | 'black' | 'golden' | 'chocolate'; breed:string };
export const BREEDS={dog:[{id:'shiba',name:'시바견',description:'쫑긋한 귀와 말린 꼬리'},{id:'retriever',name:'골든 리트리버',description:'다정하고 듬직한 친구'},{id:'poodle',name:'푸들',description:'풍성한 곱슬 털'},{id:'maltese',name:'말티즈',description:'작고 하얀 친구'},{id:'pomeranian',name:'포메라니안',description:'풍성한 털과 작은 발걸음'},{id:'corgi',name:'웰시 코기',description:'짧은 다리와 큰 귀'},{id:'dachshund',name:'닥스훈트',description:'긴 몸과 늘어진 귀'},{id:'beagle',name:'비글',description:'활기찬 세 가지 빛깔'},{id:'husky',name:'시베리안 허스키',description:'선명한 얼굴 무늬와 파란 눈'},{id:'dalmatian',name:'달마시안',description:'하얀 털 위 검은 점'}],cat:[{id:'shorthair',name:'코리안 숏헤어',description:'줄무늬가 사랑스러운 친구'},{id:'russian',name:'러시안 블루',description:'날렵한 얼굴과 초록 눈'},{id:'siamese',name:'샴',description:'짙은 얼굴과 파란 눈'},{id:'ragdoll',name:'랙돌',description:'풍성한 털과 파란 눈'},{id:'persian',name:'페르시안',description:'둥근 얼굴과 긴 털'},{id:'british',name:'브리티시 숏헤어',description:'통통한 볼과 호박빛 눈'},{id:'bengal',name:'벵갈',description:'야생적인 반점 무늬'},{id:'mainecoon',name:'메인쿤',description:'큰 체구와 귀 끝의 털'}]};
export type ChatMessage={id:string;nickname:string;message:string;createdAt:number;mine:boolean};
export type Memorial = { id: string; name: string; kind: 'person' | 'dog' | 'cat'; message: string; createdAt: number; flowers: number; candles: number; mine: boolean; flowered: boolean; lit: boolean;photoUrl?:string|null };
export type Visitor = { id: string; x: number; z: number; pet: Pet };
export const DEFAULT_PET: Pet = {name:'보리',kind:'dog',coat:'cream',breed:'shiba'};
function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('입력 내용을 확인해 주세요.');
  return input as Record<string, unknown>;
}
function text(value: unknown, max: number, label: string): string {
  if(typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label}을(를) 1~${max}자로 입력해 주세요.`);
  return value.trim();
}
export function validateMemorial(input: unknown) {
  const v=record(input);
  if(!['person','dog','cat'].includes(String(v.kind))) throw new Error('추모 대상을 선택해 주세요.');
  return {name:text(v.name,40,'이름'),message:text(v.message,600,'편지'),kind:v.kind as Memorial['kind'],photo:validatePhoto(v.photo)};
}
export function validatePet(input: unknown): Pet {
  const v=record(input);
  if(!['dog','cat'].includes(String(v.kind)) || !COATS.some(c=>c.id===v.coat)) throw new Error('반려동물을 다시 선택해 주세요.');
  const kind=v.kind as Pet['kind'],breed=v.breed===undefined?BREEDS[kind][0].id:String(v.breed);
  if(!BREEDS[kind].some(b=>b.id===breed))throw new Error('반려동물 품종을 다시 선택해 주세요.');
  return {name:text(v.name,16,'이름'),kind,coat:v.coat as Pet['coat'],breed};
}
export function validateChat(input:unknown){const v=record(input);return {nickname:text(v.nickname,20,'닉네임'),message:text(v.message,300,'대화')};}
export function validatePhoto(input:unknown):string|null{
 if(input===undefined||input===null||input==='')return null;
 if(typeof input!=='string'||input.length>350000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input))throw new Error('사진을 다시 선택해 주세요. JPEG 사진만 저장할 수 있어요.');
 try{const data=atob(input.slice(input.indexOf(',')+1));if(data.charCodeAt(0)!==255||data.charCodeAt(1)!==216||data.charCodeAt(data.length-2)!==255||data.charCodeAt(data.length-1)!==217)throw Error();}catch{throw new Error('올바른 사진을 다시 선택해 주세요.');}
 return input;
}
export function canWrite(origin: string|null, expected: string, user: string|null) { return !!user && origin===expected; }
export function canDelete(user: string|null, owner: string) { return !!user && user===owner; }
export type MemorialComment={id:string;memorialId:string;nickname:string;message:string;createdAt:number;mine:boolean};
export function validateComment(input:unknown){const v=record(input);return {memorialId:text(v.memorialId,100,'기억'),nickname:text(v.nickname,20,'닉네임'),message:text(v.message,500,'댓글')};}
