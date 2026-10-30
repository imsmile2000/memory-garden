import {authClient} from '../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const url=new URL(req.url),code=url.searchParams.get('code');
 const client=await authClient();
 if(client&&code){const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return Response.redirect(new URL('/',req.url),303);}
 return Response.redirect(new URL('/login?error=confirmation',req.url),303);
}
