'use strict';
// A single-day local pilot. Relief is Mercator; OSM vectors and itinerary layers stay geographic.
const PILOT_MAP={"version":"ice-lagoon-v1","day":13,"date":"2026-10-30","crs":"EPSG:3857","bounds":[[63.98,-16.55],[64.29,-15.72]],"maxZoom":16,"cameraContext":[64.15,-16.35],"reliefSourceGroundResolutionMetres":16.7,"assets":[{"file":"relief-overview.webp","bytes":20136,"sha256":"3e92b635d8c9b057355c60a5fe7857b24de3c83e98f220161d90f1bfde7edd63"},{"file":"relief-detail.webp","bytes":273438,"sha256":"455ee269c0d841764adca106395a54ccc12b3746072f83d6b97a2eebb9aa454c"},{"file":"geography.json","bytes":675886,"sha256":"967d2fd0012fb6a10c42c3e89ef6b4b8d08c5f291435804ac6148e2ed4c8bb5d"},{"file":"LICENSE.md","bytes":2436,"sha256":"0d76903e04d66eee8d42475781faf58db2f175c89c9f8a30178d930bb405e83f"}],"sources":{"elevation":"https://registry.opendata.aws/terrain-tiles/","elevationLicense":"https://github.com/tilezen/joerd/blob/master/docs/attribution.md","osm":"https://api.openstreetmap.org/api/0.6/map","osmLicense":"https://www.openstreetmap.org/copyright"},"sourceDataTime":"2026-10-15"};
const pilotRoot='maps/ice-lagoon-v1/',pilotCache='nordic-map-'+PILOT_MAP.version;
let pilotSession=null;
const pilotFiles=()=>PILOT_MAP.assets.map(a=>a.file);
const isLocalMapActive=()=>!!pilotSession?.active&&String(mapFilter)==='13';
async function pilotResource(file){
 const url=new URL(pilotRoot+file,document.baseURI).href,expected=PILOT_MAP.assets.find(a=>a.file===file);
 let cache;try{if('caches' in window)cache=await caches.open(pilotCache);}catch{}
 const hit=await cache?.match(url);if(hit&&await pilotValid(hit,expected))return hit;
 const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error(file+'未下载');
 const bytes=await response.clone().arrayBuffer();if(expected&&bytes.byteLength!==expected.bytes)throw Error('地图资源不完整');
 if(expected&&crypto.subtle){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==expected.sha256)throw Error('地图资源版本不一致');}
 try{await cache?.put(url,response.clone());}catch{}
 return response;
}
async function pilotValid(response,expected){if(!response)return false;const bytes=await response.clone().arrayBuffer();if(bytes.byteLength!==expected.bytes)return false;if(!crypto.subtle)return true;const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');return hash===expected.sha256;}
async function pilotPrepared(){try{const cache=await caches.open(pilotCache);return (await Promise.all(PILOT_MAP.assets.map(async a=>pilotValid(await cache.match(new URL(pilotRoot+a.file,document.baseURI)),a)))).every(Boolean);}catch{return false;}}
function pilotStatus(){
 if(!isLocalMapActive())return;
 const intro=document.querySelector('#mapIntro');if(intro)intro.hidden=true;
 let box=document.querySelector('#pilotMapPreparation');if(!box){box=document.createElement('details');box.id='pilotMapPreparation';box.className='pilot-map-preparation';box.innerHTML='<summary>离线地图 <span data-pilot-cache-short>未完整保存</span></summary><div><p id="pilotMapState" role="status">正在打开本地地图…</p><button data-prepare-pilot>保存此区域离线</button><small>外部导航需联网 · <a href="maps/ice-lagoon-v1/LICENSE.md" target="_blank" rel="noopener">地图来源</a></small></div>';document.querySelector('.map-bottom-panel')?.append(box);const footer=document.createElement('footer');footer.className='pilot-map-credit';footer.innerHTML='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · Mapzen 高程 · <a href="maps/ice-lagoon-v1/LICENSE.md" target="_blank" rel="noopener">来源与许可</a>';document.querySelector('.map-bottom-panel')?.append(footer);}
 const session=pilotSession;pilotPrepared().then(ready=>{if(pilotSession!==session||!session.active)return;const el=document.querySelector('#pilotMapState');if(el)el.textContent=session.error||(ready?'冰河湖区域已完整保存，断网后仍可缩放查看':session.failed?'本地地图未完整载入':session.loaded?'已载入本地地形，保存后可完整离线查看':'正在打开本地地图…');const short=document.querySelector('[data-pilot-cache-short]');if(short)short.textContent=ready?'已保存':'未完整保存';const btn=document.querySelector('[data-prepare-pilot]');if(btn&&!session.preparing){btn.textContent=ready?'已离线保存':'保存此区域离线';btn.disabled=ready;}});
}
function pilotLayout(s){
 const header=document.querySelector('.visual-map-header'),workspace=document.querySelector('.atlas-workspace'),wrap=workspace?.querySelector('.map-wrap');if(!header||!wrap)return;
 s.header=header;s.headerParent=header.parentElement;s.workspace=workspace;wrap.append(header);document.body.classList.add('pilot-map-active');document.documentElement.classList.add('pilot-map-root');s.target.invalidateSize({pan:false});
 const select=header.querySelector('select'),option=select?.querySelector('option[value="13"]');if(option)option.textContent='10/30 · 周五';
 const fit=header.querySelector('[data-fit]'),back=header.querySelector('[data-map-return]');
 const svg=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
 if(fit)fit.innerHTML=svg('<path d="M4 7h6l4 10h6M6 5 4 7l2 2m12 6 2 2-2 2"/>')+'<span>适应路线</span>';
 if(back)back.innerHTML=svg('<path d="m9 5-7 7 7 7M3 12h19"/>')+'<span>返回行程</span>';
}
function restorePilotSelection(){const selection=document.querySelector('#selectedMapPlace'),places=document.querySelector('#mapPlaces');if(selection&&places&&selection.parentElement!==places.parentElement)places.before(selection);}
function onLocalMapSelection(item,pan,target){
 if(!isLocalMapActive())return false;
 const row=document.querySelector('[data-map-row="'+CSS.escape(item.key)+'"]'),selection=document.querySelector('#selectedMapPlace'),panel=document.querySelector('.map-bottom-panel');if(!row||!selection||!panel)return true;
 restorePilotSelection();mapMarkers.forEach(marker=>marker.closeTooltip());pilotSession.onView?.();
 if(!pilotSession.silentSelection){const r=row.getBoundingClientRect(),b=panel.getBoundingClientRect(),top=document.querySelector('.map-panel-tabs').getBoundingClientRect().height+8;if(r.top<b.top+top||r.bottom>b.bottom)panel.scrollTo({top:panel.scrollTop+r.top-b.top-top,behavior:reduced()?'instant':'smooth'});}
 return true;
}
const pilotOriginalFit=fitMap;
fitMap=function(){if(isLocalMapActive()&&mapBounds.length)map.fitBounds([...mapBounds,PILOT_MAP.cameraContext],{paddingTopLeft:[28,140],paddingBottomRight:[30,52],maxZoom:12,animate:!reduced()});else pilotOriginalFit();};
const pilotOriginalCaption=terrainCaption;
terrainCaption=function(){if(isLocalMapActive())pilotStatus();else pilotOriginalCaption();};
const pilotOriginalClear=clearTerrain;
clearTerrain=function(){const s=pilotSession;if(s){const intro=document.querySelector('#mapIntro');if(intro)intro.hidden=false;document.querySelector('#pilotMapPreparation')?.remove();document.querySelector('.pilot-map-credit')?.remove();s.active=false;s.target.stop();restorePilotSelection();document.body.classList.remove('pilot-map-active');document.documentElement.classList.remove('pilot-map-root');if(s.header?.isConnected&&s.workspace?.isConnected)s.headerParent.insertBefore(s.header,s.workspace);s.target.off('zoomend moveend',s.onView);s.layers.forEach(layer=>{if(s.target.hasLayer(layer))s.target.removeLayer(layer)});s.urls.forEach(URL.revokeObjectURL);if(s.creditControl&&!s.creditControl._map)s.creditControl.addTo(s.target);s.target.setMaxBounds(null);s.target.options.zoomSnap=s.originalZoomSnap??1;s.target.setMinZoom(0);s.target.setMaxZoom(18);pilotSession=null;}pilotOriginalClear();};
function pilotStyle(feature){const p=feature.properties,z=map?.getZoom()||11;
 const base={pane:'pilotGeography',interactive:false};
 if(p.kind==='ocean')return {...base,stroke:false,fillColor:'#cfeaf8',fillOpacity:0};
 if(p.kind==='water')return {...base,color:'#9ecbdf',weight:.6,fillColor:'#bce4f8',fillOpacity:.94};
 if(p.kind==='glacier')return {...base,color:'#b2cbd4',weight:.8,fillColor:'#eaf6ff',fillOpacity:.16};
 if(p.kind==='coast')return {...base,color:'#a3c7d9',weight:.8};
 if(p.kind==='river')return {...base,color:'#a3c8d6',weight:p.category==='river'?1.1:.6,opacity:.8};
 if(p.kind==='road'){const major=/^(trunk|primary|secondary|tertiary)$/.test(p.category),path=/^(footway|path|track|steps|cycleway|bridleway)$/.test(p.category);return {...base,pane:'pilotRoads',color:major?'#90adbe':path?'#c0d1d9':'#bdcfd9',weight:major?(z>=14?3:2):path?.7:1.1,dashArray:path?'3 4':undefined,opacity:path?.65:1};}
 return {...base,stroke:false,fillColor:p.kind==='sand'?'#e4e0d3':'#d7e3dc',fillOpacity:.38};
}
function pilotLabels(s,geo){const bounds=s.target.getBounds(),z=s.target.getZoom(),used=[...mapMarkers.values()].map(m=>{const p=s.target.latLngToContainerPoint(m.getLatLng());return {x:p.x,y:p.y,w:74}});s.labels.clearLayers();if(z<10)return;
 const important=[{key:'hali',title:'Hali · 住宿起终点',sub:'Hali'},{key:'cave',title:'冰河湖 · 集合点',sub:'Jökulsárlón / Blue Iceland'}];
 for(const item of important){const source=DATA.places[item.key],ll=L.latLng(source.lat,source.lon);if(!bounds.contains(ll))continue;const pt=s.target.latLngToContainerPoint(ll),w=item.key==='hali'?90:154,side=pt.x<s.target.getSize().x*.55?1:-1,dx=side*(w/2+26),dy=item.key==='hali'?-34:30;L.marker(ll,{interactive:false,pane:'pilotLabels',icon:L.divIcon({className:'pilot-key-label',html:'<strong>'+esc(item.title)+'</strong><small>'+esc(item.sub)+'</small>',iconSize:[w,38],iconAnchor:[w/2-dx,19-dy]})}).addTo(s.labels);used.push({x:pt.x+dx,y:pt.y+dy,w});}
 function inRing(point,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>point[1])!==(b[1]>point[1]))&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 function inside(point,geometry){const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polygons.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(h=>inRing(point,h)));}
 const glacier=geo.features.find(f=>f.properties.kind==='glacier'&&f.properties.name==='Breiðamerkurjökull');if(glacier){for(const [x,y] of [[.28,.4],[.25,.47],[.34,.53],[.3,.6]]){const pt=L.point(s.target.getSize().x*x,s.target.getSize().y*y),ll=s.target.containerPointToLatLng(pt);if(!inside([ll.lng,ll.lat],glacier.geometry))continue;L.marker(ll,{interactive:false,pane:'pilotLabels',icon:L.divIcon({className:'pilot-glacier-label',html:'布雷扎梅尔库冰川<small>Breiðamerkurjökull</small>',iconSize:[156,38],iconAnchor:[78,19]})}).addTo(s.labels);used.push({x:pt.x,y:pt.y,w:156});break;}}
 const candidates=geo.features.filter(f=>f.properties.kind==='label').sort((a,b)=>Number(a.properties.category==='peak')-Number(b.properties.category==='peak'));
 for(const f of candidates){const p=f.properties,ll=L.latLng(f.geometry.coordinates[1],f.geometry.coordinates[0]);if(!bounds.contains(ll)||(z<13&&p.category==='locality')||(z<12&&p.category==='peak'))continue;const pt=s.target.latLngToContainerPoint(ll),width=Math.min(160,p.name.length*6.3+12);if(pt.x<width/2+6||pt.x>s.target.getSize().x-width/2-6||pt.y<12||pt.y>s.target.getSize().y-18)continue;if(used.some(b=>Math.abs(pt.x-b.x)<(width+b.w)/2+6&&Math.abs(pt.y-b.y)<25))continue;used.push({x:pt.x,y:pt.y,w:width});L.marker(ll,{interactive:false,pane:'pilotLabels',icon:L.divIcon({className:'pilot-place-label'+(p.category==='peak'?' peak':''),html:esc(p.name),iconSize:[width,22],iconAnchor:[width/2,11]})}).addTo(s.labels);}
}
function pilotMarkerSpacing(s){s.leaders.clearLayers();const all=[...mapMarkers.values()],placed=[];all.forEach(m=>{const e=m.getElement();if(e){e.style.marginLeft='-22px';e.style.marginTop='-22px';}});const entries=all.filter(m=>s.target.getBounds().contains(m.getLatLng()));entries.forEach(marker=>{const point=s.target.latLngToLayerPoint(marker.getLatLng());let offset=L.point(0,0);if(placed.some(p=>p.distanceTo(point)<46))offset=L.point(27,-24);else if(entries.some(m=>m!==marker&&s.target.latLngToLayerPoint(m.getLatLng()).distanceTo(point)<46))offset=L.point(-23,-22);placed.push(point);const screen=s.target.latLngToContainerPoint(marker.getLatLng()),size=s.target.getSize();offset=L.point(Math.max(26,Math.min(size.x-26,screen.x+offset.x))-screen.x,Math.max(26,Math.min(size.y-78,screen.y+offset.y))-screen.y);if(screen.x+offset.x>size.x-74&&screen.y+offset.y<125)offset.x=size.x-82-screen.x;const el=marker.getElement();if(el){el.style.marginLeft=(-22+offset.x)+'px';el.style.marginTop=(-22+offset.y)+'px';}if(offset.x||offset.y)L.polyline([marker.getLatLng(),s.target.layerPointToLatLng(point.add(offset))],{pane:'pilotRoads',color:'#6c91b5',weight:1,interactive:false}).addTo(s.leaders);});}
async function mountLocalPilot(target){
 clearTerrain();terrainState='loading';
 const s=pilotSession={target,active:true,layers:[],urls:[],loaded:false,failed:false,detail:null,preparing:false};
 s.credit='<a href="maps/ice-lagoon-v1/LICENSE.md">Nordic Journal · OSM / Mapzen高程</a>';
 s.creditControl=target.attributionControl;s.creditControl.remove();pilotLayout(s);
 for(const [name,z] of [['pilotRelief',210],['pilotGeography',240],['pilotRoads',280],['pilotLabels',350]]){if(!target.getPane(name))target.createPane(name).style.zIndex=String(z);}
 pilotPolishRows();s.labels=L.layerGroup().addTo(target);s.leaders=L.layerGroup().addTo(target);s.layers.push(s.labels,s.leaders);pilotStatus();
 async function image(file){const response=await pilotResource(file);if(!s.active)return;const url=URL.createObjectURL(await response.blob());s.urls.push(url);if(!s.active){URL.revokeObjectURL(url);return;}const layer=L.imageOverlay(url,PILOT_MAP.bounds,{pane:'pilotRelief',interactive:false,opacity:1});await new Promise((resolve,reject)=>{layer.once('load',resolve).once('error',()=>reject(Error('地形影像暂未打开'))).addTo(target);s.layers.push(layer)});return layer;}
 try{
  const [geoResponse,overview]=await Promise.all([pilotResource('geography.json'),image('relief-overview.webp')]);if(!s.active)return;
  const geo=await geoResponse.json();if(!s.active)return;
  const order=['ocean','wetland','forest','sand','glacier','water','coast','river','road'];geo.features.sort((a,b)=>order.indexOf(a.properties.kind)-order.indexOf(b.properties.kind));
  s.geography=L.geoJSON(geo,{filter:f=>f.geometry.type!=='Point',style:pilotStyle}).addTo(target);s.layers.push(s.geography);s.loaded=true;terrainState='local';
  s.originalZoomSnap=target.options.zoomSnap;target.options.zoomSnap=.25;target.setMinZoom(10);target.setMaxZoom(PILOT_MAP.maxZoom);
  s.onView=()=>{if(!s.active)return;pilotLabels(s,geo);pilotMarkerSpacing(s);for(const layer of mapLayer.getLayers()){if(layer.setStyle&&layer.options.style?.color){const casing=layer.options.style.color==='#fff';layer.setStyle({weight:(target.getZoom()>=14?4.5:4)+(casing?3:0)});}}s.geography.setStyle(pilotStyle);if(target.getZoom()>=12&&!s.detail){s.detail=image('relief-detail.webp').then(layer=>{if(layer&&s.active&&overview&&target.hasLayer(overview))target.removeLayer(overview);pilotStatus();return layer}).catch(()=>{s.detail=null;pilotStatus()});}pilotStatus();};
  target.on('zoomend moveend',s.onView);s.onView();if(!mapSelected){s.silentSelection=true;selectMapPlace('cave',false);s.silentSelection=false;}requestAnimationFrame(()=>requestAnimationFrame(()=>{if(s.active){target.stop();target.invalidateSize({pan:false});fitMap();target.setMaxBounds(PILOT_MAP.bounds);target.stop();}}));
 }catch(e){if(s.active){s.failed=true;terrainState='fallback';pilotStatus();}}
}
const pilotOriginalMount=mountTerrain;
mountTerrain=function(target){if(String(mapFilter)==='13'){if(pilotSession?.active&&pilotSession.target===target)return;mountLocalPilot(target);}else pilotOriginalMount(target);};
// Date changes reuse the existing Leaflet instance. Change the basemap only at the pilot boundary.
const pilotOriginalUpdate=updateMap;
function pilotPolishRows(){
 if(!isLocalMapActive())return;
 for(const item of mapItems()){
  const row=document.querySelector('[data-map-row="'+CSS.escape(item.key)+'"]');if(!row)continue;
  const button=row.querySelector(':scope>button'),text=button?.querySelector('span:nth-child(2)'),name=text?.querySelector('strong');if(!text||!name)continue;
  if(item.key==='jokulsarlon')name.textContent='Jökulsárlón冰河湖';
  const b=DATA.bookings.find(b=>b.day===13&&b.spot===item.key),time=b?b.time.match(/\d{1,2}:\d{2}/)?.[0]:item.steps[0]?.time;
  text.querySelectorAll('.pilot-row-meta,.pilot-row-badges').forEach(e=>e.remove());text.querySelector('small')?.remove();
  const meta=document.createElement('small');meta.className='pilot-row-meta';meta.textContent=[time,b?'报到 '+b.report:item.key==='hali'?'出发 / 返回':item.key==='jokulsarlon'?'冰河湖区域':item.kind].filter(Boolean).join(' · ');text.append(meta);
  if(b){const badge=document.createElement('span');badge.className='pilot-row-badges';badge.innerHTML='<span>已预订</span><span>'+b.people+'人参加</span>';text.append(badge);}
  const day=DATA.days[12],booking=DATA.bookings.find(b=>b.day===13&&b.spot===item.key),target=booking?bookingRow(day,booking):item.steps[0]?.step??Math.max(0,selectedPlan(day).findIndex(r=>r.nav?.includes(item.key)));button.removeAttribute('data-map-place');button.dataset.day='13';button.dataset.focusStep=String(target);button.setAttribute('aria-label',name.textContent+'，查看当日安排');
 }
}
updateMap=function(){const leaving=!!pilotSession&&String(mapFilter)!=='13';if(leaving)clearTerrain();restorePilotSelection();pilotOriginalUpdate();if(!map)return;const wantsLocal=String(mapFilter)==='13';if(wantsLocal&&!pilotSession)mountTerrain(map);else if(leaving)mountTerrain(map);else if(wantsLocal&&pilotSession?.loaded)pilotSession.onView?.();pilotPolishRows();};

async function preparePilotMap(){const s=pilotSession;if(!s?.active||s.preparing)return;s.preparing=true;s.error='';const button=document.querySelector('[data-prepare-pilot]'),status=document.querySelector('#pilotMapState');if(button)button.disabled=true;if(status)status.textContent='正在保存冰河湖区域地图…';try{if(!('caches' in window))throw Error('此浏览器不支持地图缓存');for(const file of pilotFiles())await pilotResource(file);if(!await pilotPrepared())throw Error('地图尚未完整保存');if(s.active&&s.failed)mountLocalPilot(s.target);}catch(e){s.error='未完成保存：'+e.message;if(status)status.textContent=s.error;}finally{s.preparing=false;if(button)button.disabled=false;pilotStatus();}}
document.addEventListener('click',e=>{if(e.target.closest('[data-prepare-pilot]'))preparePilotMap();});
