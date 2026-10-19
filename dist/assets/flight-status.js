'use strict';
// Dynamic observations are deliberately excluded from the versioned offline core.
(() => {
 const zones={PKX:'Asia/Shanghai',HEL:'Europe/Helsinki',OSL:'Europe/Oslo',TOS:'Europe/Oslo',LKN:'Europe/Oslo',SVJ:'Europe/Oslo',BOO:'Europe/Oslo',KEF:'Atlantic/Reykjavik',CPH:'Europe/Copenhagen'};
 const cacheKey='nordic-flight-observations-v1';
 let snapshot=null,failed=false,inflight=null,lastFetch=0;
 try{snapshot=JSON.parse(localStorage.getItem(cacheKey));}catch{}
 const key=(d,f)=>d.date+':'+f[0];
 const format=(value,airport)=>new Intl.DateTimeFormat('zh-CN',{timeZone:zones[airport],hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
 function official(f){
  if(f[1]==='HEL')return 'https://www.finavia.fi/en/airports/helsinki-airport/flights?tab=departures';
  const names={OSL:'oslo',TOS:'tromso',LKN:'leknes',SVJ:'svolvaer',BOO:'bodo'};
  if(names[f[1]])return 'https://www.avinor.no/en/airport/'+names[f[1]]+'/departures/';
  if(f[1]==='KEF')return 'https://www.kefairport.com/flights';
  if(f[1]==='CPH')return 'https://www.cph.dk/en/flight-information/departures';
  return 'https://www.csair.com/en/';
 }
 function shell(d,f){return `<div class="flight-live" data-flight-key="${esc(key(d,f))}" role="group" aria-label="${esc(f[0])}航班动态"></div>`;}
 function content(d,f){
  const r=snapshot?.flights?.[key(d,f)],dep=r?.departure,arr=r?.arrival;
  const sides=[dep,arr].filter(Boolean),latest=sides.map(s=>Date.parse(s.checkedAt)).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  const stale=failed||!navigator.onLine||sides.some(s=>Date.now()-Date.parse(s.checkedAt)>15*60000);
  const cancelled=sides.some(s=>s.code==='C'),landed=arr?.code==='A',departed=dep?.code==='D';
  const delta=s=>s?.code==='E'&&s.time?Math.round((Date.parse(s.time)-Date.parse(s.scheduled))/60000):0;
  let label=cancelled?'已取消':landed?'已到达':departed?'已出发':sides.some(s=>s.delayed)||sides.some(s=>delta(s)>0)?'延误':sides.length?'航班动态':'暂无动态';
  let items=[];
  if(dep?.time&&['D','E'].includes(dep.code))items.push((dep.code==='D'?'实际出发 ':'预计出发 ')+format(dep.time,f[1]));
  if(arr?.time&&['A','E'].includes(arr.code))items.push((arr.code==='A'?'实际到达 ':'预计到达 ')+format(arr.time,f[4]));
  if(!cancelled&&!landed&&!departed)items.push(dep?.gate?'登机口 '+dep.gate:dep?'登机口待公布':'登机口见官方');
  if(landed&&arr?.belt)items.push('行李转盘 '+arr.belt);
  const delay=delta(dep)||delta(arr);if(delay>0&&!cancelled&&!landed)items.push((delta(dep)>0?'出发':'到达')+'延误 '+delay+'分钟');
  if(cancelled)items=[];
  const historical=landed||cancelled;
  const tag=stale&&sides.length&&!historical?'上次：'+label:label;
  const date=latest?new Intl.DateTimeFormat('zh-CN',{timeZone:zones[f[1]],month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(latest)):'';
  const note=!navigator.onLine?'离线 · 上次数据':failed?'更新失败':stale&&sides.length&&!historical?'数据已过期':!sides.length?'暂未获取机场动态':'';
  return `<div class="flight-live-line"><span class="flight-live-tag ${cancelled||label==='延误'?'attention':''}">${esc(tag)}</span>${items.length?`<span>${esc(items.join(' · '))}</span>`:''}</div><div class="flight-live-meta">${date?`<span>数据 ${esc(date)}（出发地时间）</span>`:''}${note?`<span>${esc(note)}</span>`:''}<button type="button" data-flight-refresh aria-label="刷新${esc(f[0])}航班动态" ${inflight?'disabled':''}>${inflight?'更新中…':'刷新 ↻'}</button><a href="${esc(official(f))}" target="_blank" rel="noopener noreferrer">官方查询 ↗</a>${sides.length?'<a href="https://www.avinor.no/" target="_blank" rel="noopener noreferrer">Flight data from Avinor</a>':''}</div>`;
 }
 function paint(){
  for(const el of document.querySelectorAll('[data-flight-key]')){
   let pair;for(const d of DATA.days){const f=d.flights?.find(f=>key(d,f)===el.dataset.flightKey);if(f){pair=[d,f];break;}}
   if(!pair)continue;const html=content(...pair);if(el.innerHTML!==html)el.innerHTML=html;
  }
 }
 function mount(){
  // Use actual flight rows only; luggage/transfer rows may mention the same number.
  if(state.view==='day'){
   const d=DATA.days[state.day-1],rows=selectedPlan(d);
   document.querySelectorAll('.timeline-row').forEach(el=>{
    const row=rows[+el.dataset.rowIndex];if(!row)return;
    const f=stepTimeZones(d,row).flight;
    const target=el.querySelector('.timeline-text');
    if(f&&target&&!target.querySelector('[data-flight-key]')){
     const anchor=target.querySelector('.step-preview')||target.querySelector('.timeline-heading');
     anchor.insertAdjacentHTML('afterend',shell(d,f));
    }
   });
  }
  if(state.view==='toolbox')for(const el of document.querySelectorAll('[data-tool-item^="flight-"]')){
   const number=el.dataset.toolItem.slice(7),d=DATA.days.find(d=>d.flights?.some(f=>f[0]===number));
   const f=d?.flights.find(f=>f[0]===number),target=el.querySelector('.tb-card-copy');
   if(f&&target&&!target.querySelector('[data-flight-key]'))target.insertAdjacentHTML('beforeend',shell(d,f));
  }
  paint();if(document.querySelector('[data-flight-key]')&&Date.now()-lastFetch>60000)refresh();
 }
 async function refresh(){
  if(inflight)return inflight;
  lastFetch=Date.now();
  inflight=(async()=>{
   try{
    const response=await fetch(new URL('flight-status.json?t='+Math.floor(Date.now()/60000),document.baseURI),{cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('Flight snapshot unavailable');
    const data=await response.json();if(!data.flights||!Number.isFinite(Date.parse(data.generatedAt)))throw Error('Invalid snapshot');
    snapshot=data;failed=false;try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch{}
   }catch{failed=true;}finally{inflight=null;paint();}
  })();paint();return inflight;
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-flight-refresh]')){event.stopPropagation();refresh();}});
 const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.closest('.flight-live'))))mount();});
 const start=()=>{observer.observe(document.getElementById('page'),{childList:true,subtree:true});mount();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 setInterval(()=>{if(!document.hidden&&document.querySelector('[data-flight-key]'))refresh();},60000);
 window.addEventListener('online',()=>refresh());window.addEventListener('offline',paint);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){mount();paint();}});
})();
