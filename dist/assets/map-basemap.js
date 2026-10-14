'use strict';
// OpenTopoMap: CC BY-SA. Only visible tiles; no prefetch or service-worker caching.
// The local Natural Earth layer remains below tiles at all times.
let terrainLayer=null,terrainCleanup=null,terrainState='offline';
function terrainCaption(){
 const el=document.querySelector('#mapIntro');
 if(el)el.textContent=(mapFilter==='all'?'全程地点与自驾道路':'当天主要地点与自驾道路')+(terrainState==='online'?' · 地形地图':terrainState==='fallback'?' · 简明底图':'');
}
function clearTerrain(){if(terrainCleanup)terrainCleanup();terrainCleanup=null;terrainLayer=null;}
function mountTerrain(target){
 clearTerrain();
 if(!navigator.onLine){terrainState='fallback';terrainCaption();return;}
 terrainState='loading';
 const layer=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{
  subdomains:'abc',minZoom:0,maxNativeZoom:17,maxZoom:18,updateWhenIdle:true,
  updateWhenZooming:false,keepBuffer:0,opacity:0,
  attribution:'地图数据 © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM · 地图 © <a href="https://opentopomap.org/about">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a>)'
 });
 terrainLayer=layer;let active=true,timer;
 const fallback=()=>{
  if(!active)return;active=false;clearTimeout(timer);
  // Leaflet finishes bookkeeping after dispatching tileerror. Removing its
  // layer inside that event would leave its pending callback without a map.
  requestAnimationFrame(()=>{if(terrainLayer!==layer)return;clearTerrain();terrainState='fallback';terrainCaption();});
 };
 const loaded=()=>{if(!active)return;clearTimeout(timer);layer.setOpacity(1);terrainState='online';terrainCaption();};
 // Remove through Leaflet before clearing listeners: its remove event detaches
 // map zoom/move handlers. Clearing those listeners first leaves stale handlers.
 terrainCleanup=()=>{active=false;clearTimeout(timer);if(target.hasLayer(layer))target.removeLayer(layer);layer.off();};
 // Show the raster layer only after the viewport batch is complete; partial
 // loads otherwise expose a checkerboard of terrain and the coarse fallback.
 layer.on('load',loaded).on('tileerror',fallback);
 timer=setTimeout(fallback,12000);layer.addTo(target);terrainCaption();
}
window.addEventListener('offline',()=>{clearTerrain();terrainState='fallback';terrainCaption();});
window.addEventListener('online',()=>{if(map)mountTerrain(map);});
