/* Roadbook revision: b2759b212275a5af */
/* A release keeps core HTML/JS/data together until the user accepts its update. */
'use strict';
const ROADBOOK_VERSION='b2759b212275a5af';
const CACHE='nordic-roadbook-'+ROADBOOK_VERSION;
const PIN_CACHE='nordic-roadbook-client-pins',PIN_URL=new URL('__roadbook_client_versions__',self.registration.scope).href;
const UPDATE_CLIENT_URL=new URL('__roadbook_update_client__',self.registration.scope);
const ACTIVE_URL=new URL('__roadbook_active_version__',self.registration.scope),CACHE_LOCK='roadbook-cache:'+self.registration.scope;
const cacheTransaction=task=>self.navigator?.locks?.request?self.navigator.locks.request(CACHE_LOCK,task):task();
let clientPins={},pinQueue=Promise.resolve();
const pinsReady=caches.open(PIN_CACHE).then(c=>c.match(PIN_URL)).then(r=>r?r.json():{}).then(p=>{clientPins=p;}).catch(()=>{});
function serializePins(task){const run=pinQueue.then(async()=>{const r=await(await caches.open(PIN_CACHE)).match(PIN_URL);clientPins=r?await r.json():{};}).then(task);pinQueue=run.catch(()=>{});return run;}
async function storePins(){await(await caches.open(PIN_CACHE)).put(PIN_URL,new Response(JSON.stringify(clientPins)));}
async function ownedVersions(){const result=[];for(const name of await caches.keys()){if(!/^nordic-roadbook-[0-9a-f]{16}$/.test(name))continue;const response=await(await caches.open(name)).match(new URL('offline-manifest.json',self.registration.scope));if(!response)continue;try{const m=await response.json();if(name==='nordic-roadbook-'+m.version)result.push({name,m});}catch{}}return result;}
async function cleanUnusedVersions(){
 // Without cross-worker locks, retaining extra caches is safer than racing an install.
 if(!self.navigator?.locks?.request)return;
 return cacheTransaction(cleanUnusedLocked);
}
async function cleanUnusedLocked(){
 if(self.registration.installing||self.registration.waiting)return;
 const active=await(await caches.open(PIN_CACHE)).match(ACTIVE_URL);
 if(!active||await active.text()!==ROADBOOK_VERSION)return;
 // An unidentified legacy page blocks collection; it never loses its fallback.
 await verifyCache();
 const pages=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>c.url.startsWith(self.registration.scope)),live=new Set(pages.map(c=>c.id));
 for(const id of Object.keys(clientPins))if(!live.has(id))delete clientPins[id];
 await storePins();
 if(pages.some(c=>!clientPins[c.id]))return;
 const keep=new Set([ROADBOOK_VERSION,...Object.values(clientPins)]);
 for(const {name,m} of await ownedVersions())if(!keep.has(m.version)){if(self.registration.installing||self.registration.waiting)return;await caches.delete(name);}
}
function requestCollection(){return new Promise(resolve=>{const worker=self.registration.active;if(!worker){resolve();return;}const channel=new MessageChannel(),timer=setTimeout(resolve,10000);channel.port1.onmessage=()=>{clearTimeout(timer);resolve();};worker.postMessage({type:'COLLECT_UNUSED'},[channel.port2]);});}
let manifestPromise=null;
const manifest=()=>manifestPromise||(manifestPromise=fetch(new URL('offline-manifest.json',self.registration.scope),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('资源清单获取失败');return r.json();}).then(m=>{if(m.version!==ROADBOOK_VERSION)throw Error('发布版本尚未一致，请稍后重试');return m;}));
async function verifyCache(){const cache=await caches.open(CACHE),stored=await cache.match(new URL('offline-manifest.json',self.registration.scope)),m=stored?await stored.json():await manifest();if(m.version!==ROADBOOK_VERSION)throw Error('缓存版本不一致');for(const file of m.assets){const response=await cache.match(new URL(file,self.registration.scope));if(!response?.ok)throw Error(file+'尚未完整缓存');if(!m.integrity?.[file])throw Error('缓存清单缺少完整性信息');const bytes=await response.arrayBuffer(),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(digest!==m.integrity[file])throw Error(file+'校验失败，请联网更新');}return m;}
self.addEventListener('install',event=>event.waitUntil(cacheTransaction(async()=>{const m=await manifest(),cache=await caches.open(CACHE);const responses=await Promise.all(m.assets.map(async file=>{const response=await fetch(new URL(file,self.registration.scope),{cache:'reload'});if(!response.ok)throw Error(file+'未保存');return [file,response];}));for(const [file,response] of responses)await cache.put(new URL(file,self.registration.scope),response);await cache.put(new URL('offline-manifest.json',self.registration.scope),new Response(JSON.stringify(m),{headers:{'Content-Type':'application/json'}}));await verifyCache();})));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await cacheTransaction(async()=>{await verifyCache();await(await caches.open(PIN_CACHE)).put(ACTIVE_URL,new Response(ROADBOOK_VERSION));});await serializePins(async()=>{for(const c of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(c.url.startsWith(self.registration.scope))c.postMessage({type:'REQUEST_CLIENT_BUILD'});await cleanUnusedVersions();});const intent=await(await caches.open(CACHE)).match(UPDATE_CLIENT_URL);if(intent){await(await caches.open(CACHE)).delete(UPDATE_CLIENT_URL);const client=await self.clients.get(await intent.text());if(client&&client.url.startsWith(self.registration.scope))client.navigate(client.url).catch(()=>{});}})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='COLLECT_UNUSED'){event.waitUntil(serializePins(cleanUnusedVersions).finally(()=>event.ports[0]?.postMessage({done:true})));return;}
 if(event.data?.type==='ACTIVATE'){event.waitUntil((async()=>{if(event.source?.id)await(await caches.open(CACHE)).put(UPDATE_CLIENT_URL,new Response(event.source.id));await self.skipWaiting();})());return;}
 if(event.data?.type==='CLIENT_BUILD'){event.waitUntil(serializePins(async()=>{const client=event.source;if(!client?.id||!client.url?.startsWith(self.registration.scope))return;const versions=await ownedVersions(),existing=versions.find(v=>v.m.version===clientPins[client.id]&&v.m.clientBuild===event.data.build),matched=existing||versions.find(v=>v.m.clientBuild===event.data.build);if(matched)clientPins[client.id]=matched.m.version;await storePins();}).then(requestCollection));return;}
 if(event.data?.type!=='PREPARE')return;
 event.waitUntil((async()=>{try{if(event.data.version&&event.data.version!==ROADBOOK_VERSION)throw Error('存在新版本，请更新并重开后再保存');const m=await verifyCache();await requestCollection();event.ports[0]?.postMessage({ok:true,count:m.assets.length,version:m.version});}catch(e){event.ports[0]?.postMessage({ok:false,error:e.message});}})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{await pinsReady;const storedPins=await(await caches.open(PIN_CACHE)).match(PIN_URL);if(storedPins)clientPins=await storedPins.json();const navigating=event.request.mode==='navigate';if(navigating&&event.resultingClientId)await serializePins(async()=>{clientPins[event.resultingClientId]=ROADBOOK_VERSION;await storePins();});const version=navigating?ROADBOOK_VERSION:clientPins[event.clientId]||ROADBOOK_VERSION;const cache=await caches.open('nordic-roadbook-'+version),scope=new URL(self.registration.scope);let clean=new URL(url);clean.search='';if(event.request.mode==='navigate'&&(clean.pathname===scope.pathname||clean.pathname.endsWith('/index.html')||clean.pathname===scope.pathname+'dist/'))clean=new URL('index.html',scope);const manifestHit=await cache.match(new URL('offline-manifest.json',scope)),m=manifestHit?await manifestHit.json():null,relative=clean.pathname.slice(scope.pathname.length),core=m?.assets.includes(relative)||relative==='offline-manifest.json';const localPack=relative.match(/^maps\/([^/]+)\//);if(localPack&&event.request.cache!=='reload'){const prepared=await(await caches.open('nordic-map-'+localPack[1])).match(clean);if(prepared)return prepared;}const hit=await cache.match(clean);if(relative==='offline-manifest.json'&&['no-store','reload'].includes(event.request.cache))return fetch(event.request);if(core&&hit){if(event.request.mode==='navigate'&&url.pathname===scope.pathname+'dist/'){const html=await hit.text();return new Response(html.replace('<head>','<head><base href="'+scope.href+'">'),{headers:{'Content-Type':'text/html;charset=utf-8'}});}return hit;}
 try{const response=await fetch(event.request);if(response.ok&&/\.(?:webp|jpg|svg)$/.test(url.pathname))await cache.put(clean,response.clone());return response;}catch(e){if(hit)return hit;if(event.request.mode==='navigate'){const fallback=await cache.match(new URL('essentials.html',scope));if(fallback)return fallback;}throw e;}
 })());
});
