import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export async function authClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key) return null;
 const store=await cookies();
 return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll:values=>{for(const {name,value,options} of values)store.set(name,value,options);}}});
}
export async function identity():Promise<string|null> {
 const client=await authClient();
 if(!client) return null;
 try {const {data,error}=await client.auth.getUser();return error?null:data.user?.id??null;} catch{return null;}
}
