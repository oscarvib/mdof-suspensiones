/* Service worker: la herramienta funciona sin conexión.
   Abre SIEMPRE la copia guardada (no depende de la red: sin internet, con wifi sin salida,
   o con un proxy que devuelve errores) y, si hay conexión, descarga la versión nueva en segundo plano:
   la página avisa con «Hay una versión nueva» y se actualiza al pulsar.
   Al publicar una versión nueva, cambia V (y el número de versión del HTML). */
const V='26.7',CACHE='mdof-'+V,FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mdof-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const say=async m=>{for(const c of await self.clients.matchAll({includeUncontrolled:true}))c.postMessage(m)};
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith((async()=>{
  const nav=r.mode==='navigate',
   cached=await caches.match(r,{ignoreSearch:true})||(nav?(await caches.match('index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true})):null);
  const upd=fetch(r,{cache:'no-cache'}).then(async res=>{
   if(res&&res.ok&&res.status===200&&!res.redirected){
    const c=await caches.open(CACHE),cp=res.clone();
    let changed=false;if(cached&&(nav||/index\.html$/.test(r.url))){try{changed=(await cached.clone().text())!==(await res.clone().text())}catch(x){}}
    await c.put(r,cp);if(changed)say({t:'upd',v:V})}
   return res});
  if(cached){e.waitUntil(upd.catch(()=>{}));return cached}
  try{return await upd}catch(err){return Response.error()}})())});
