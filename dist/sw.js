/* Roadbook revision: 24f48c1f936a388e */
/* A release keeps core HTML/JS/data together until the user accepts its update. */
'use strict';
const ROADBOOK_VERSION='24f48c1f936a388e';
const CACHE='nordic-roadbook-'+ROADBOOK_VERSION;
let manifestPromise=null;
const manifest=()=>manifestPromise||(manifestPromise=fetch(new URL('offline-manifest.json',self.registration.scope),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('资源清单获取失败');return r.json();}).then(m=>{if(m.version!==ROADBOOK_VERSION)throw Error('发布版本尚未一致，请稍后重试');return m;}));
async function verifyCache(){const cache=await caches.open(CACHE),stored=await cache.match(new URL('offline-manifest.json',self.registration.scope)),m=stored?await stored.json():await manifest();if(m.version!==ROADBOOK_VERSION)throw Error('缓存版本不一致');for(const file of m.assets)if(!await cache.match(new URL(file,self.registration.scope)))throw Error(file+'尚未缓存');return m;}
self.addEventListener('install',event=>event.waitUntil((async()=>{const m=await manifest(),cache=await caches.open(CACHE);const responses=await Promise.all(m.assets.map(async file=>{const response=await fetch(new URL(file,self.registration.scope),{cache:'reload'});if(!response.ok)throw Error(file+'未保存');return [file,response];}));for(const [file,response] of responses)await cache.put(new URL(file,self.registration.scope),response);await cache.put(new URL('offline-manifest.json',self.registration.scope),new Response(JSON.stringify(m),{headers:{'Content-Type':'application/json'}}));await verifyCache();})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE'){self.skipWaiting();return;}
 if(event.data?.type!=='PREPARE')return;
 event.waitUntil((async()=>{try{const m=await verifyCache();event.ports[0]?.postMessage({ok:true,count:m.assets.length,version:m.version});}catch(e){event.ports[0]?.postMessage({ok:false,error:e.message});}})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),scope=new URL(self.registration.scope);let clean=new URL(url);clean.search='';if(event.request.mode==='navigate'&&(clean.pathname===scope.pathname||clean.pathname.endsWith('/index.html')||clean.pathname===scope.pathname+'dist/'))clean=new URL('index.html',scope);const manifestHit=await cache.match(new URL('offline-manifest.json',scope)),m=manifestHit?await manifestHit.json():null,relative=clean.pathname.slice(scope.pathname.length),core=m?.assets.includes(relative)||relative==='offline-manifest.json';const hit=await cache.match(clean);if(core&&hit){if(event.request.mode==='navigate'&&url.pathname===scope.pathname+'dist/'){const html=await hit.text();return new Response(html.replace('<head>','<head><base href="'+scope.href+'">'),{headers:{'Content-Type':'text/html;charset=utf-8'}});}return hit;}
 try{const response=await fetch(event.request);if(response.ok&&/\.(?:webp|jpg|svg)$/.test(url.pathname))await cache.put(clean,response.clone());return response;}catch(e){if(hit)return hit;if(event.request.mode==='navigate'){const fallback=await cache.match(new URL('essentials.html',scope));if(fallback)return fallback;}throw e;}
 })());
});
