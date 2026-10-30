export function requestOrigin(req:Request):string{
 const url=new URL(req.url);
 // Next.js may expose an internal hostname in req.url; Host is the browser's destination.
 return url.protocol+'//'+(req.headers.get('host')||url.host);
}
