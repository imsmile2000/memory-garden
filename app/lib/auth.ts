import 'server-only';
import {cookies} from 'next/headers';
import {newVisitor,verifyVisitor} from './visitor-token';
export async function identity(create=false):Promise<string|null>{
 const secret=process.env.GARDEN_SESSION_SECRET||process.env.DATABASE_URL;
 if(!secret)return null;
 const store=await cookies(),name='garden-visitor';
 const existing=verifyVisitor(store.get(name)?.value,secret);
 if(existing)return existing;
 if(!create)return null;
 const visitor=newVisitor(secret);
 store.set(name,visitor.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:31536000});
 return visitor.id;
}
