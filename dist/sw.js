/* Roadbook revision: 151faa7caa3626fa */
/* Cache only this site's public roadbook. No private credentials or APIs. */
'use strict';
let manifestPromise=null;
const manifest=()=>manifestPromise||(manifestPromise=fetch(new URL('offline-manifest.json',self.registration.scope),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('资源清单获取失败');return r.json();}));
self.addEventListener('install',event=>event.waitUntil(manifest().then(async m=>{const cache=await caches.open('nordic-roadbook-'+m.version);await cache.add(new Request(new URL('index.html',self.registration.scope),{cache:'reload'}));})));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE'){self.skipWaiting();return;}
 if(event.data?.type!=='PREPARE')return;
 event.waitUntil((async()=>{try{const m=await manifest(),cache=await caches.open('nordic-roadbook-'+m.version);for(const file of m.assets){const url=new URL(file,self.registration.scope),response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error(file+'未保存');await cache.put(url,response);}for(const file of m.assets)if(!await cache.match(new URL(file,self.registration.scope)))throw Error(file+'核验失败');await cache.put(new URL('offline-manifest.json',self.registration.scope),new Response(JSON.stringify(m),{headers:{'Content-Type':'application/json'}}));event.ports[0]?.postMessage({ok:true,count:m.assets.length,version:m.version});}catch(e){event.ports[0]?.postMessage({ok:false,error:e.message});}})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const names=(await caches.keys()).filter(k=>k.startsWith('nordic-roadbook-')).reverse();
  const lookup=async key=>{for(const name of names){const hit=await (await caches.open(name)).match(key);if(hit)return hit;}return null;};
  try{const response=await fetch(event.request);if(response.ok&&names.length&&/\.(?:js|css|webp|jpg|svg|html|json)$/.test(url.pathname)){const clean=new URL(url);clean.search='';await(await caches.open(names[0])).put(clean,response.clone());}return response;}
  catch(error){let clean=new URL(url);clean.search='';if(event.request.mode==='navigate'&&(clean.pathname===new URL(self.registration.scope).pathname||clean.pathname.endsWith('/index.html')))clean=new URL('index.html',self.registration.scope);const cached=await lookup(clean);if(cached)return cached;if(event.request.mode==='navigate'){const fallback=await lookup(new URL('essentials.html',self.registration.scope));if(fallback)return fallback;}throw error;}
 })());
});
