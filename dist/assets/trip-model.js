'use strict';
function tripDateInZone(now,zone){const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v={};for(const x of p)v[x.type]=x.value;return `${v.year}-${v.month}-${v.day}`;}
function tripAddDate(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function tripLocalTimestamp(date,time,zone){const match=time.match(/(\d{1,2}):(\d{2})/);if(!match)return NaN;const [y,m,d]=date.split('-').map(Number),want=Date.UTC(y,m-1,d,+match[1],+match[2]);let utc=want;
 const f=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){const v={};for(const p of f.formatToParts(new Date(utc)))v[p.type]=p.value;const got=Date.UTC(+v.year,+v.month-1,+v.day,+v.hour,+v.minute,+v.second);utc+=want-got;}return utc;
}
function tripZoneChanges(days){const zones={PKX:'Asia/Shanghai',HEL:'Europe/Helsinki',OSL:'Europe/Oslo',TOS:'Europe/Oslo',LKN:'Europe/Oslo',SVJ:'Europe/Oslo',BOO:'Europe/Oslo',KEF:'Atlantic/Reykjavik',CPH:'Europe/Copenhagen'},changes=[];
 for(const d of days)for(const f of d.flights||[]){const origin=zones[f[1]],target=zones[f[4]];if(!origin||!target)continue;const departDate=tripAddDate(d.date,/前日/.test(f[3])?-1:0),depart=tripLocalTimestamp(departDate,f[3],origin),explicit=f[6].match(/\+(\d+)\s*日/);let arrivalDate=tripAddDate(d.date,explicit?+explicit[1]:0),at=tripLocalTimestamp(arrivalDate,f[6],target);if(at<depart&&!explicit){arrivalDate=tripAddDate(arrivalDate,1);at=tripLocalTimestamp(arrivalDate,f[6],target);}if(Number.isFinite(at))changes.push({at,zone:target,flight:f[0]});}
 return changes.sort((a,b)=>a.at-b.at);
}
function tripToday(now,days,changes){let zone='Asia/Shanghai';for(const c of changes){if(c.at>+now)break;zone=c.zone;}const date=tripDateInZone(now,zone),exact=days.find(d=>d.date===date);const selected=exact||(date<days[0].date?days[0]:days[days.length-1]);return {day:selected.id,date,zone,inTrip:!!exact,boundary:exact?'today':date<days[0].date?'first':'last'};}
function stepTimeZones(day,row){
 const airportZones={PKX:'Asia/Shanghai',HEL:'Europe/Helsinki',OSL:'Europe/Oslo',TOS:'Europe/Oslo',LKN:'Europe/Oslo',SVJ:'Europe/Oslo',BOO:'Europe/Oslo',KEF:'Atlantic/Reykjavik',CPH:'Europe/Copenhagen'};
 const firstClock=row.time.match(/\d{1,2}:\d{2}/)?.[0];
 const flight=(day.flights||[]).find(f=>row.text.includes(f[0])&&firstClock===f[3].match(/\d{1,2}:\d{2}/)?.[0]);
 if(flight)return {start:airportZones[flight[1]],end:airportZones[flight[4]],flight};
 const i=day.timeline.indexOf(row);let zone=day.tz;
 if(day.id===2&&i>=0&&i<2)zone='Europe/Helsinki';
 if(day.id===10&&i>=0&&i<2)zone='Europe/Oslo';
 if(day.id===16&&i>=0&&i<4)zone='Atlantic/Reykjavik';
 if(day.id===17&&i>=0&&i<6)zone='Europe/Copenhagen';
 return {start:zone,end:zone};
}
function stepWindow(day,row){
 if(/前一晚/.test(row.time))return null;
 const clocks=[...row.time.matchAll(/(\d{1,2}):(\d{2})/g)].map(m=>m[0]);
 if(!clocks.length)return null;
 const z=stepTimeZones(day,row),start=tripLocalTimestamp(day.date,clocks[0],z.start);
 let end=null,deadline=false;
 if(z.flight){const f=z.flight,plus=f[6].match(/\+(\d+)\s*日/);end=tripLocalTimestamp(tripAddDate(day.date,plus?+plus[1]:0),f[6],z.end);if(end<start)end=tripLocalTimestamp(tripAddDate(day.date,1),f[6],z.end);}
 else if(clocks.length>1)end=tripLocalTimestamp(day.date,clocks[clocks.length-1],z.end);
 else if(/最迟|前$|^[^\d]*至\d/.test(row.time)){end=start;deadline=true;}
 if(end!==null&&end<start)end+=86400000;
 return {start,end,deadline,uncertain:/约|左右|至/.test(row.time),zone:z.start};
}

const tripCalendarChanges=tripZoneChanges(DATA.days);
const derivedFlights=new WeakMap();
function flightRows(day){if(!derivedFlights.has(day))derivedFlights.set(day,(day.flights||[]).filter(f=>!day.timeline.some(r=>r.text.includes(f[0]))).map(f=>({time:f[3]+' → '+f[6],text:f[0]+' · '+f[2]+' '+f[1]+' → '+f[5]+' '+f[4]+'；起降均为当地时间。',stepTitle:'出发航班',nav:[],critical:'原始航班时间，动态须向航司查询'})));return derivedFlights.get(day);}
function mergePlan(day,lanes){
 const keyed=lanes.flatMap((rows,lane)=>{let previous=null;return rows.map((row,i)=>{const own=stepWindow(day,row)?.start;const next=rows.slice(i+1).map(r=>stepWindow(day,r)?.start).find(Number.isFinite);let key=Number.isFinite(own)?own:previous??(Number.isFinite(next)?next:Infinity);if(/前一晚/.test(row.time))key=-Infinity;if(Number.isFinite(own))previous=own;return {row,key,lane,i};});});
 return keyed.sort((a,b)=>a.key-b.key||a.lane-b.lane||a.i-b.i).map(x=>x.row);
}
function selectedPlan(day,variants=state.variants,transport=state.transport){
 const branch=day.variants?.[variants[day.id]||'A'];let extra=branch?.timeline||[];
 if(day.id===1&&variants[1]==='B')extra=extra.filter(r=>transport==='train'?r.time!=='22:00前':transport==='taxi'?r.time!=='21:45':true);
 return mergePlan(day,[flightRows(day),day.timeline,extra]);
}
function bookingRow(day,booking,rows=selectedPlan(day)){let i=rows.findIndex(r=>/报到|集合/.test(r.stepTitle||'')&&r.time.includes(booking.report));if(i<0)i=rows.findIndex(r=>(r.nav||[]).includes(booking.spot));return i;}
function selectedVisits(day){const rows=selectedPlan(day),items=[],route=selectedRoute(day);for(let i=0;i<rows.length;i++){const r=rows[i],booking=DATA.bookings.find(b=>b.day===day.id&&bookingRow(day,b,rows)===i);let keys=[...(booking?.parking?[booking.parking]:[]),...(r.nav||[]),...(booking?[booking.meeting||booking.spot]:[])];for(const key of [...new Set(keys)]){const alias=key.startsWith('hotel:')&&DATA.places[key.slice(6)]?key.slice(6):key;const p=DATA.places[alias]||(key.startsWith('hotel:')?DATA.hotels[key.slice(6)]:null);if(!p)continue;items.push({key:alias,p,day:day.id,step:i,time:r.time,title:r.stepTitle,kind:booking?.parking===key?'停车地点':booking&&(booking.meeting||booking.spot)===key?'集合 / 报到':'行程地点'});}}
 for(const key of route){if(!items.some(x=>x.key===key)&&DATA.places[key])items.push({key,p:DATA.places[key],day:day.id,step:null,time:'原路线点位，未单列时间',title:'路线补充',kind:'原路线点位'});}return items;
}
function selectedSpots(day,variants=state.variants){return day.variants?.[variants[day.id]||'A']?.spots||day.spots||[];}
function selectedRoute(day,variants=state.variants){
 if(day.id===1)return variants[1]==='B'?day.route:['hel-airport'];
 if(day.id===10)return variants[10]==='B'?['kef-airport','blue','oddsson']:day.route;
 return day.route;
}
function planPosition(day,now=new Date(),rows=selectedPlan(day)){
 const today=tripToday(now,DATA.days,tripCalendarChanges);
 if(!today.inTrip||today.day!==day.id)return {current:-1,next:-1,live:false};
 // Use only explicit intervals. Single timestamps identify a future target;
 // untimed and approximate-ended plans never acquire an invented duration.
 const windows=rows.map(r=>stepWindow(day,r));
 const time=+now;
 const active=windows.map((w,i)=>({w,i})).filter(x=>x.w&&!x.w.deadline&&!x.w.uncertain&&x.w.end!==null&&x.w.start<=time&&time<x.w.end);
 const current=active.sort((a,b)=>b.w.start-a.w.start)[0]?.i??-1;
 const next=windows.map((w,i)=>({w,i})).filter(x=>x.w&&x.w.start>time).sort((a,b)=>a.w.start-b.w.start)[0]?.i??-1;
 const approximate=windows.map((w,i)=>({w,i})).filter(x=>x.w&&x.w.uncertain&&x.w.end!==null&&x.w.start<=time&&time<x.w.end).sort((a,b)=>b.w.start-a.w.start)[0]?.i??-1;return {current,next,approximate,live:true};
}
