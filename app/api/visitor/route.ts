import {requestOrigin} from '../../lib/request-origin';
import {identity} from '../../lib/auth';
export async function POST(req:Request){
 if(req.headers.get('origin')!==requestOrigin(req))return Response.json({error:'요청을 확인해 주세요.'},{status:403});
 const user=await identity(true);
 return Response.json(user?{ok:true}:{error:'정원 연결을 준비하지 못했어요.'},{status:user?200:503,headers:{'Cache-Control':'no-store'}});
}
