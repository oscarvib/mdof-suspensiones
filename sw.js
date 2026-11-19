/* Service worker: la herramienta funciona sin conexión.
   Con conexión descarga la última versión (esperando como mucho 3,5 s); sin conexión,
   o si la red no responde, usa la copia guardada. Al publicar una versión nueva,
   cambia V (y el número de versión del HTML). */
const V='26.2',CACHE='mdof-'+V,FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mdof-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith((async()=>{
  const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{})}return res});net.catch(()=>{});
  try{return await Promise.race([net,new Promise((_,no)=>setTimeout(no,3500))])}
  catch(err){const m=await caches.match(r,{ignoreSearch:true})||(r.mode==='navigate'?(await caches.match('index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true})):null);
   if(m)return m;try{return await net}catch(e2){return Response.error()}}})())});
