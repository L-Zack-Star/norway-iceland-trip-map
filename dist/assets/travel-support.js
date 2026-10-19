'use strict';
// A view-only layer. Original itinerary objects remain unchanged.
const TRAVEL_SUPPORT = (() => {
 const explicit = {
  '1:入境取箱':[['办理','60–90分钟']], '1:酒店入住':[['办理','20–30分钟']], '1:晚餐':[['用餐','约20–30分钟']], '1:市区夜游':[['步行','20–25分钟'],['观景','约55–70分钟']], '1:打车返程':[['交通预留','30–45分钟']],
  '3:教堂外观':[['观景','15–20分钟']], '3:缆车上山':[['缆车单程','约4分钟']], '3:晚餐':[['餐厅用餐预留','60–90分钟']], '3:桑拿备选':[['泡浴','90分钟']],
  '4:前往码头':[['步行、找码头与报到预留','30分钟']], '4:追鲸':[['活动','约8小时']], '4:港边短逛':[['步行','约20–40分钟']],
  '5:前往渔村':[['驾驶预留','约20–30分钟']], '5:超市补给':[['交通与购物预留','45分钟']],
  '6:渔村漫步':[['活动','约80分钟']], '6:白沙滩':[['步行','20–30分钟']], '6:入住晚餐':[['村内步行','45–60分钟']],
  '7:海岸短走':[['步行','20–30分钟']], '7:雷讷拍照':[['活动','约45分钟']], '7:红屋拍照':[['拍照','约30分钟']],
  '9:午餐进城':[['列车车上','约23分钟']], '9:市区购物':[['购物','约90分钟']], '9:晚餐':[['特色餐用餐预留','60–75分钟']],
  '10:Sky温泉':[['泡浴、更衣全程预留','约3小时']], '10:Blue温泉':[['泡浴、更衣全程预留','约3小时']],
  '11:黑沙滩':[['观景','约30–40分钟']], '11:四晚采购':[['购物与结账预留','1小时']],
  '12:钻石沙滩':[['拍照','约30分钟']], '13:前往冰湖':[['驾驶','约15–20分钟']], '13:蓝冰洞':[['接驳、徒步与冰洞全程','约5–7小时']], '13:返回Hali':[['驾驶','约15–20分钟']],
  '14:黄金圈转场':[['驾驶','约5–5.5小时'],['午餐','45分钟'],['途中休息','两次各15分钟']], '14:黄金瀑布':[['停车与观景','约50分钟']], '14:前往间歇泉':[['驾驶预留','约15分钟']], '14:间歇泉':[['停车与观景','约45分钟']],
  '15:前往Silfra':[['驾驶','约45–60分钟'],['慢行余量','15分钟']], '15:停车步行':[['P5至集合处步行','约5–10分钟']], '15:峡谷浮潜':[['装备、浮潜与换装全程','约3小时']], '15:前往机场':[['驾驶','约45–60分钟']],
  '16:小美人鱼':[['步行','15–20分钟'],['拍照','约20分钟']], '16:王宫外观':[['步行','约20–25分钟']], '16:市区购物':[['购物','约90分钟']], '17:退房赴机场':[['带箱步行预留','10–15分钟']]
 };
 const actions = {
  '1:交通选择':'列车夜游需20:15前到中央车站；打车最晚20:45。赶不上就留在酒店休息。',
  '2:取箱转机':'取四箱、过海关，去Norwegian柜台托运；尚未收箱时，问清寄存位置与费用。',
  '3:教堂外观':'普通汽车和出租车绕隧道；白天公交停站按当天公告确认。',
  '3:下山返城':'出租车经隧道返城，先留出下山及排队时间。',
  '3:桑拿备选':'先向酒店预约20:00泡浴，至少提前2小时；餐厅晚餐需60–90分钟，下山晚时与泡浴择一。',
  '4:前往码头':'带电子票、自备午餐、热饮和防风防水衣物。',
  '5:租车验车':'签字前核对免赔额、除外责任与是否追加全险；拍车况、电量，确认充电和归还要求。',
  '6:隧道排队':'到Flesa/Leknes侧等候区，跟随引导车；错过班次时缩短后续海滩停留。',
  '7:红屋拍照':'先合法停车，再步行找机位；不在桥上临停。',
  '8:隧道放行':'Napp侧往Leknes/Svolvær；错过10:30班则等11:30，之后不加景点。',
  '8:交车':'结束停车计时，核对付款记录；保存车况、电量照片与交车回执，移除租赁车牌自动支付。',
  '10:租车验车':'确认保险、车况、油量、还车点、接驳与公里费计收方式；拍照后再出发。',
  '11:黑沙滩':'只走现场允许的观景区，远离浪线；没有警灯也要看封闭标志。',
  '11:四晚采购':'保留完整一小时；延误先缩减景点，买完按日期分装并及时冷藏。',
  '12:前往柜台':'找Jökulsárlón Ferðaþjónusta订单柜台；先缴停车费，再步行报到。',
  '13:冰洞报到':'找咖啡馆前Blue Iceland车辆或标志，按电子票集合。四人参加。',
  '14:黄金圈转场':'07:00出发，途中保留午餐和两次休息；不再加景点。',
  '15:停车步行':'先停P5并缴费，再步行到Troll集合处；留守同伴保留车钥匙。',
  '15:加油还车':'按合同加油并拍车况、油表；核对停车收据和后续账单联系方式，交车后移除自动支付车牌。',
  '16:值机安检':'05:00左右到柜台；计划06:30关闭，具体以航司当天通知为准。',
  '17:值机托运':'确认行李直挂PKX或仅到HEL，保留行李条。',
  '17:落地取箱':'只托运到HEL时先取四箱再到南航柜台；直挂PKX则按转机指引走。'
 };
 const deadlines = {
  '1:列车返程':[['21:45','到中央车站候车，主选21:53 P线','返程计划目标']], '1:打车返程':[['22:00前','上车返回酒店；21:20先查看供车','返程计划目标']], '1:回到酒店':[['23:00前','回到Comfort酒店','返程计划目标']],
  '2:退房赴机场':[['09:40前','完成退房赴机场段，预留托运安检时间','计划到达目标']], '2:托运候机':[['17:30','开始办理后续托运、安检，按柜台要求执行','计划办理时间']],
  '3:缆车上山':[['16:00前','尽量到山顶，保留日落观景时间','观景计划目标']],
  '4:观鲸集合':[['08:00前','到Kaigata 6集合点报到登船','10月19日最新活动截图'],['08:20','截止登船；游船08:30准时出发','10月19日最新活动截图']],
  '5:值机安检':[['12:30–12:45','到特罗姆瑟机场托运安检','计划到达目标']], '5:租车验车':[['16:00','到租车柜台办理取车','原定取车时间']],
  '6:隧道排队':[['10:40','到Flesa/Leknes侧等候区，赶11:00引导车','原计划班次；出发前看道路公告']], '6:隧道通行':[['11:00','跟随引导车过隧道','原计划班次；出发前看道路公告']],
  '8:前往隧道':[['10:10左右','到Napp侧等候区，留20分钟候车','计划到达目标']], '8:隧道放行':[['10:30','乘目标引导车班次','原计划班次；错过改11:30']], '8:交车':[['最迟15:00','按原定时间交车','原定还车时间']],
  '9:早餐赴机场':[['08:30左右','到博德航站楼','计划到达目标']], '10:前往机场':[['07:00左右','到奥斯陆机场柜台','计划到达目标']],
  '11:四晚采购':[['17:30–18:30','保留Krónan一小时采购','计划采购时段']],
  '12:前往柜台':[['14:10前','到订单指定快艇柜台','提前1小时为计划余量']], '12:快艇报到':[['14:10','到快艇柜台报到','计划提前1小时；运营商至少提前30分钟']],
  '13:冰洞报到':[['08:45','到咖啡馆前找Blue Iceland报到','计划提前45分钟，电子票优先']],
  '15:前往Silfra':[['08:15左右','到P5停车场','计划到达目标']], '15:浮潜报到':[['08:50','到Troll集合处完成报到','计划提前40分钟，电子票优先']], '15:加油还车':[['21:00','按合同交车，提前确认接驳和柜台时间','原定还车时间']],
  '16:前往机场':[['05:00左右','带四箱到KEF航站楼','计划到达目标']], '16:值机安检':[['06:30前','完成值机托运','本班柜台计划关闭时间，当日通知优先']],
  '17:退房赴机场':[['10:00左右','到哥本哈根航站楼','计划到达目标']], '17:返程登机':[['18:35前','到CZ8172登机口附近','计划到达目标，按登机牌登机']]
 };
 const pay = {
  seljalandsfoss:['Check-it场地','https://www.checkit.is/en-gb/seljalandsfoss'], skogafoss:['Parka场地','https://parka.is/pay/skogafoss/'], reynisfjara:['Parka场地','https://parka.is/pay/reynisfjara/'],
  jokulsarlon:['Parka停车目录','https://api.parka.is/parking/'], diamond:['Parka停车目录','https://api.parka.is/parking/'], cave:['Parka停车目录','https://api.parka.is/parking/'], gullfoss:['Parka停车目录','https://api.parka.is/parking/'], geysir:['Parka停车目录','https://api.parka.is/parking/'], bruarfoss:['Parka停车目录','https://api.parka.is/parking/'],
  p5:['辛格维利尔停车说明','https://www.thingvellir.is/en/service/parking-service/'], silfra:['Check-it停车入口','https://www.checkit.is/en/pay'], tradarkot:['市政停车说明','https://reykjavik.is/en/parking'], harpa:['Harpa官网','https://www.harpa.is/en']
 };
 function placeParking(key) {
  const p=DATA.places[key]; if(!p)return null;
  const enriched=typeof PRACTICAL_TRAVEL==='undefined'?null:PRACTICAL_TRAVEL.parking(key);
  if(enriched)return {placeKey:key,text:enriched.where,links:enriched.sources.map(x=>({label:x.label,url:x.url})),action:null};
  const text=key==='sky'?'按园区访客停车指示停放，收费与规则看现场标牌或预约指引。':key==='p5'?'P5按辛格维利尔当日停车规则缴费；保存车牌和付款收据。':p.parking;
  if(!text)return null;
  const links=pay[key]?[{label:pay[key][0],url:pay[key][1]}]:[];
  return {placeKey:key,text,links,action:/Parka|Check-it|刷卡|付款|缴费/.test(text)?'看现场区域与车种，输入实际车牌；付款成功后保存收据。':null};
 }
 function formatMinutes(n){const h=Math.floor(n/60),m=Math.round(n%60);return h?(m?`${h}小时${m}分钟`:`${h}小时`):`${m}分钟`;}
 function row(day,r) {
  const key=day.id+':'+r.stepTitle, durations=(explicit[key]||[]).map(([kind,label])=>({kind,label,source:'原行程明确时长'}));
  // These branch-specific figures are explicit original guidance, not interval subtraction.
  if(day.id===10&&r.stepTitle==='前往温泉'&&r.text.includes('Blue'))durations.push({kind:'正常驾驶',label:'约20分钟',source:'原资料：Blue Lagoon官网正常车程'});
  if(day.id===10&&r.stepTitle==='前往市区'&&r.text.includes('40–50'))durations.push({kind:'正常驾驶',label:'约40–50分钟',source:'原资料：Blue Lagoon官网正常车程'});
  const w=typeof stepWindow==='function'?stepWindow(day,r):null;
  if(w&&w.end>w.start&&!/至/.test(r.time)) {
   const n=(w.end-w.start)/60000;
   if(n>0&&n<1440)durations.push({kind:w&&typeof stepTimeZones==='function'&&stepTimeZones(day,r).flight?'航班计划':'计划时段',label:formatMinutes(n),source:'原计划起止时间，已换算时区'});
  }
  const keys=[...(r.nav||[])].map(k=>k.startsWith('hotel:')?k.slice(6):k);
  // Booking reports and equipment waits refer to the same paid parking stop.
  if(day.id===12&&/前往柜台|快艇报到|更衣候船/.test(r.stepTitle))keys.push('jokulsarlon');
  if(day.id===13&&/前往冰湖|冰洞报到/.test(r.stepTitle))keys.push('cave');
  return {durations,reminder:actions[key]||'',critical:(deadlines[key]||[]).map(([time,action,basis])=>({time,action,basis})),parking:[...new Set(keys)].map(placeParking).filter(Boolean)};
 }
 const coverage=(date,breakfast='',lunch='',dinner='')=>({date,breakfast,lunch,dinner});
 const purchases=[
  {day:3,date:'2026-10-20',time:'13:00–13:30',title:'EUROSPAR · 观鲸前补给',place:'eurospar',coverage:[coverage('2026-10-20','','','酒店泡面备选'),coverage('2026-10-21','4人房间早餐','4人船上自带午餐','4人酒店泡面')],suggestions:['面包或卷饼、可即食的馅料与水果','能量棒、坚果、饮水与保温杯热饮','按晚餐选择购买泡面；回酒店确认烧水方式'],reminder:'船上午餐选可直接吃的食物，不依赖加热。'},
  {day:5,date:'2026-10-22',time:'18:00–18:45',title:'Joker Ballstad · 同村补给',place:'joker',coverage:[coverage('2026-10-22','','','4人晚餐食品'),coverage('2026-10-23','4人自行早餐','','')],suggestions:['面包、常温饮品或燕麦、水果','当晚简餐食品与饮水'],reminder:'交通与购物共留45分钟；晚餐按住宿设备选择。'},
  {day:7,date:'2026-10-24',time:'15:15–16:15左右返Å途中',title:'返Å途中 · 次日补给',place:'a',coverage:[coverage('2026-10-24','','','4人酒店泡面'),coverage('2026-10-25','4人自行早餐','4人即食午餐备份','')],suggestions:['泡面、早餐、即食午餐、零食和饮水'],reminder:'先看沿途门店周六营业时间；25日不依赖临时购物。'},
  {day:10,date:'2026-10-27',time:'晚餐后',title:'雷克雅未克 · 次日小补给',place:'oddsson',coverage:[coverage('2026-10-28','4人自行早餐','途中食品；也可现场简餐','')],suggestions:['次日早餐、便携午餐或零食、饮水'],reminder:'保留28日维克主要采购。'},
  {day:11,date:'2026-10-28',time:'17:30–18:30',title:'Krónan Vík · 四晚厨房采购',place:'kronan',coverage:[coverage('2026-10-28','','','4人厨房晚餐'),coverage('2026-10-29','4人公寓早餐','4人自带午餐','4人厨房晚餐'),coverage('2026-10-30','4人公寓早餐','4人冰洞随身午餐','4人厨房晚餐'),coverage('2026-10-31','4人耐储早餐','4人转场午餐','4人耐储食材晚餐'),coverage('2026-11-01','4人自行早餐','4人午餐食品；附近简餐可选','')],suggestions:['四晚晚餐共16人份：主食、蔬菜与蛋白质按食用日期分装','29/30日肉鱼仅在可靠冷藏下运输；不能保持冷链就选常温食品','31日晚用耐储主食、罐头与常温酱料','早餐面包或燕麦、常温奶、水果；按保质期准备到11月1日','29日快艇、30日冰洞与转场用便携午餐、能量食品、饮水','少量油盐与厨房用品，先看已有物品；保温袋、足量冰袋、密封袋'],reminder:'28日晚及时冷藏，29日退房用冷藏袋运输，到Hali立即放冰箱；不把后备箱当冰箱。'}
 ];
 function procurement(dayId){return purchases.filter(p=>p.day===Number(dayId));}
 return Object.freeze({row,placeParking,procurement,purchases});
})();

const WEATHER_SERVICE = (() => {
 const memory=new Map(),pending=new Map(),ttl=30*60*1000,timeout=8000;
 const airports={PKX:'pkx-airport',HEL:'hel-airport',OSL:'osl-airport',TOS:'tos-airport',LKN:'lkn-airport',SVJ:'svj-airport',BOO:'boo-airport',KEF:'kef-airport',CPH:'cph-airport'};
 const zones={PKX:'Asia/Shanghai',HEL:'Europe/Helsinki',OSL:'Europe/Oslo',TOS:'Europe/Oslo',LKN:'Europe/Oslo',SVJ:'Europe/Oslo',BOO:'Europe/Oslo',KEF:'Atlantic/Reykjavik',CPH:'Europe/Copenhagen'};
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function official(zone){return zone==='Atlantic/Reykjavik'?'https://en.vedur.is/':zone==='Europe/Oslo'?'https://www.yr.no/en':zone==='Europe/Helsinki'?'https://en.ilmatieteenlaitos.fi/':zone==='Europe/Copenhagen'?'https://www.dmi.dk/':'https://www.weather.com.cn/';}
 function choice(key,zone){const p=DATA.places[key]||DATA.hotels[key]||(key==='pkx-airport'?{name:'北京大兴机场',lat:39.5098,lon:116.4105}:null);if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return null;return {key,name:p.name,lat:p.lat,lon:p.lon,zone,official:official(zone)};}
 function choices(day,rows=day.timeline,now=new Date()){
  const out=[],add=(key,zone=day.tz)=>{if(!key)return;key=key.replace(/^hotel:/,'');const p=choice(key,zone);if(p&&!out.some(x=>x.key===key))out.push(p);};
  for(const f of day.flights||[]){add(airports[f[1]],zones[f[1]]);add(airports[f[4]],zones[f[4]]);}
  for(const r of rows)for(const k of r.nav||[])add(k,typeof stepTimeZones==='function'?stepTimeZones(day,r).start:day.tz);
  for(const k of (typeof selectedRoute==='function'?selectedRoute(day):day.route||[]))add(k);add(day.hotel);
  // Beijing is included in the original final-day flight but is not a photo/place card.
  if(out.length===0&&day.id===18)out.push({key:'PKX',name:'北京大兴机场',lat:39.5098,lon:116.4105,zone:'Asia/Shanghai',official:official('Asia/Shanghai')});
  return out;
 }
 function selected(day,rows=day.timeline,now=new Date()){
  const options=choices(day,rows,now);if(!options.length)return null;
  const elapsed=rows.map(r=>({r,w:typeof stepWindow==='function'?stepWindow(day,r):null})).filter(x=>x.w&&x.w.start<=+now).sort((a,b)=>b.w.start-a.w.start),active=elapsed[0];
  if(active){const f=typeof stepTimeZones==='function'?stepTimeZones(day,active.r).flight:null;
   if(f){const key=airports[(active.w.end!==null&&+now>=active.w.end)?f[4]:f[1]];const found=options.find(p=>p.key===key);if(found)return found;}
   const located=elapsed.find(x=>(x.r.nav||[]).some(k=>options.some(p=>p.key===k.replace(/^hotel:/,''))));
   // An unlocated luggage/meal step inherits the latest explicit place or flight arrival.
   const arrived=(day.flights||[]).map(f=>{const plus=/\+(\d+)\s*日/.exec(f[6]);return {f,at:tripLocalTimestamp(tripAddDate(day.date,plus?+plus[1]:0),f[6],zones[f[4]])};}).filter(x=>x.at<=+now).sort((a,b)=>b.at-a.at)[0];
   if(arrived&&(!located||arrived.at>located.w.start)){const found=options.find(p=>p.key===airports[arrived.f[4]]);if(found)return found;}
   if(located)for(const k of located.r.nav){const found=options.find(p=>p.key===k.replace(/^hotel:/,''));if(found)return found;}
  }
  return options[0];
 }
 function readCache(key){try{return memory.get(key)||JSON.parse(localStorage.getItem('nj-weather-v2:'+key)||'null');}catch{return memory.get(key)||null;}}
 function cache(key,result){memory.set(key,result);try{localStorage.setItem('nj-weather-v2:'+key,JSON.stringify(result));}catch{}}
 function codeText(code){return ({0:'晴',1:'大部晴',2:'多云',3:'阴',45:'雾',48:'雾',51:'毛毛雨',53:'毛毛雨',55:'毛毛雨',56:'冻毛毛雨',57:'冻毛毛雨',61:'雨',63:'雨',65:'雨',66:'冻雨',67:'冻雨',71:'雪',73:'雪',75:'雪',77:'雪粒',80:'阵雨',81:'阵雨',82:'阵雨',85:'阵雪',86:'阵雪',95:'雷雨',96:'雷雨伴冰雹',99:'雷雨伴冰雹'})[code]||'查看官方天气说明';}
 async function load(day,p,now=new Date()){
  if(!p)return {status:'unavailable',date:day.date,summary:'请打开当地气象网站查看天气。'};
  const base={date:day.date,place:p.name,official:p.official,source:'https://open-meteo.com/',zone:p.zone};
  const today=tripDateInZone(now,p.zone),distance=(Date.parse(day.date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
  if(distance<0)return {...base,status:'past',summary:'这一天已过去，天气预报不再适用。'};
  if(distance>15)return {...base,status:'outside',summary:'这一天尚未进入16天预报范围，请临近出行再查看。'};
  const key=`${day.date}:${p.lat}:${p.lon}:${p.zone}`,old=readCache(key);
  if(old&&+now-old.fetchedAt<ttl)return {...old,status:'cached'};
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return old?{...old,status:'stale',summary:old.summary+' · 离线缓存'}:{...base,status:'offline',summary:'当前离线；联网后加载天气，或打开当地气象网站。'};
  if(pending.has(key))return pending.get(key);
  const request=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
   try{const params=new URLSearchParams({latitude:p.lat,longitude:p.lon,timezone:p.zone,start_date:day.date,end_date:day.date,daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max',wind_speed_unit:'ms'});
    const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:controller.signal});if(!response.ok)throw new Error('weather HTTP '+response.status);
    const raw=await response.json(),daily=raw.daily,i=daily?.time?.indexOf(day.date);
    if(i==null||i<0||!Number.isFinite(daily.temperature_2m_min?.[i])||!Number.isFinite(daily.temperature_2m_max?.[i])||!Number.isFinite(daily.weather_code?.[i]))throw new Error('weather date or fields missing');
    const result={...base,status:'ready',fetchedAt:+now,updatedAt:new Date(+now).toISOString(),temperatureMin:daily.temperature_2m_min[i],temperatureMax:daily.temperature_2m_max[i],precipitationProbability:daily.precipitation_probability_max?.[i],windMax:daily.wind_speed_10m_max?.[i],gustMax:daily.wind_gusts_10m_max?.[i],weatherCode:daily.weather_code[i],summary:codeText(daily.weather_code[i])};cache(key,result);return result;
   }catch(error){return old?{...old,status:'stale',summary:old.summary+' · 上次保存的预报'}:{...base,status:'error',summary:'天气暂时无法加载，请查看当地气象网站。'};}
   finally{clearTimeout(timer);pending.delete(key);}
  })();pending.set(key,request);return request;
 }
 function weatherIcon(type){const cloud='<path d="M6 19h12a4.5 4.5 0 0 0 .3-9A6.5 6.5 0 0 0 6 8a5.5 5.5 0 0 0 0 11Z"/>';const shapes={cloud,sun:'<circle cx="12" cy="12" r="5"/><path d="M11 0h2v4h-2Zm0 20h2v4h-2ZM0 11h4v2H0Zm20 0h4v2h-4ZM3 2l3 3-1 2-3-3Zm15 16 3 3 1-2-3-3ZM2 20l3-3 2 1-3 3ZM18 6l3-3-1-1-3 3Z"/>',rain:cloud+'<path d="m7 20-1 3m7-3-1 3m7-3-1 3" fill="none" stroke="currentColor" stroke-width="2"/>',snow:'<path d="M11 0h2v24h-2ZM1 5l22 12-1 2L0 7Zm0 12L22 5l1 2L2 19Z"/>',fog:cloud+'<path d="M2 21h20v2H2Z"/>',unknown:'<path fill-rule="evenodd" d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm-1 4h2v3h-2Zm0 5h2v9h-2Z"/>'};return `<svg class="weather-main-icon" data-weather-icon="${type}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${shapes[type]||cloud}</svg>`;}
 function conditionIcon(summary){return /雨/.test(summary)?'rain':/雪/.test(summary)?'snow':/雾/.test(summary)?'fog':/晴/.test(summary)?'sun':'cloud';}
 function renderShell(day,rows=day.timeline,now=new Date()){
  const options=choices(day,rows,now),p=selected(day,rows,now);if(!p)return '';
  return `<div class="travel-weather" data-weather-day="${day.id}" data-weather-key="${e(p.key)}"><div class="weather-banner" style="--weather-map:url('${e(new URL('assets/weather-mountains-v1.webp',document.baseURI).href)}')"><div data-weather-result aria-live="polite">${weatherIcon("unknown")}<span class="weather-brief">${e(p.name)} · 正在获取预报…</span></div></div><details class="weather-options"><summary>天气地点与设置</summary><button class="small-link" data-weather-load>刷新天气</button><label>地区<select data-weather-place aria-label="选择天气地点"><option value="auto" selected>自动跟随行程</option>${options.map(x=>`<option value="${e(x.key)}" >${e(x.name)}</option>`).join('')}</select></label><a class="small-link" data-weather-official href="${e(p.official)}" target="_blank" rel="noopener noreferrer">当地气象网站</a></details><p class="weather-credit">天气数据 <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>。红色标记为特殊天气预报提示，官方预警请查看当地气象网站。</p></div>`;
 }
 function mount(element,day,rows=day.timeline,now=new Date()){
  if(!element||element.dataset.weatherMounted)return;element.dataset.weatherMounted='true';let version=0;
  const options=choices(day,rows,now),select=element.querySelector('[data-weather-place]'),button=element.querySelector('[data-weather-load]'),result=element.querySelector('[data-weather-result]'),link=element.querySelector('[data-weather-official]');if(!select||!button||!result)return;
  const picked=()=>select.value==='auto'?selected(day,rows,new Date()):options.find(p=>p.key===select.value)||options[0];
  select.addEventListener('change',()=>{element.dataset.userPlace=String(select.value!=='auto');version++;const p=picked();element.dataset.weatherKey=p.key;button.disabled=false;button.textContent='加载天气预报';result.innerHTML=`<p>${e(day.date)} · ${e(p.name)}</p><p>点击加载此地点的预报。</p>`;if(link)link.href=p.official;button.click();});
  button.addEventListener('click',async()=>{const token=++version;button.disabled=true;button.textContent='正在加载…';const p=picked();element.dataset.weatherKey=p.key;const r=await load(day,p);if(token!==version||!element.isConnected)return;if(link)link.href=p.official;
   const has=Number.isFinite(r.temperatureMin),fresh=has?` · ${new Intl.DateTimeFormat('zh-CN',{timeZone:p.zone,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(r.updatedAt))} ${r.status==='stale'?'保存':'获取'}`:'';
   const alert=has&&(/冻雨|雷雨|冰雹/.test(r.summary)),alertIcon=alert?'<svg class="weather-alert" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="特殊天气预报提示"><path fill-rule="evenodd" d="m12 1 12 22H0L12 1Zm-1 6h2v8h-2Zm0 10h2v3h-2Z"/></svg>':'';
   result.innerHTML=weatherIcon(has?conditionIcon(r.summary):'unknown')+`<span class="weather-brief">${e(r.place||p.name)} · ${has?e(r.temperatureMin)+'–'+e(r.temperatureMax)+'°C · ':''}${e(r.summary)}${has&&Number.isFinite(r.gustMax)?' · 阵风 '+e(r.gustMax)+' m/s':''}${r.status==='stale'?'（缓存）':''}</span>`+alertIcon;

   button.disabled=false;button.textContent='刷新';
  });
  button.click();
 }
 return Object.freeze({choices,selected,load,renderShell,mount});
})();

