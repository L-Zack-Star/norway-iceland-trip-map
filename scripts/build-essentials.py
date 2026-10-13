"""Build a small standalone, printable roadbook from unchanged public DATA."""
from pathlib import Path
import json,html,re,hashlib

root=Path(__file__).resolve().parents[1]/'dist'
source=(root/'assets/data.js').read_text(encoding='utf-8')
data=json.JSONDecoder().raw_decode(source[source.index('const DATA=')+11:])[0]
esc=lambda v:html.escape(str(v or ''))
out=[]
for day in data['days']:
    out.append(f'<section id="day-{day["id"]}"><h2>{esc(day["date"])} · {esc(day["title"])}</h2><p>{esc(day["region"])} · 时区 {esc(day["tz"])}</p><p>{esc(day["alert"])}</p>')
    for flight in day.get('flights',[]):
        out.append(f'<p><strong>{esc(flight[0])}</strong> {esc(flight[1])} {esc(flight[3])} → {esc(flight[4])} {esc(flight[6])} · 均为当地时间</p>')
    def rows(items):
        return '<ol>'+''.join(f'<li><strong>{esc(row["time"])} · {esc(row.get("stepTitle"))}</strong><p>{esc(row["text"])}</p>'+(''.join(f'<p>地点：{esc(data["hotels"][key[6:]]["name"])} · {esc(data["hotels"][key[6:]]["address"])}</p>' if key.startswith('hotel:') else f'<p>地点：{esc(data["places"][key]["name"])} · {esc(data["places"][key].get("address",data["places"][key].get("en")))}</p>' for key in row.get('nav',[]) if key.startswith('hotel:') or key in data['places']))+'</li>' for row in items)+'</ol>'
    out.append(rows(day['timeline']))
    for key,branch in day.get('variants',{}).items():
        out.append(f'<h3>备选 {key} · {esc(branch["label"])}（根据实际情况选择）</h3>'+rows(branch['timeline']))
    for booking in data['bookings']:
        if booking['day']!=day['id']:continue
        out.append(f'<aside><h3>{esc(booking["name"])}</h3><p>{esc(booking["time"])} · {booking["people"]}位；路书报到目标 {esc(booking["report"])}</p><p>{esc(booking["place"])}</p><p>{esc(booking["note"])}</p><p>{esc(booking.get("walk"))}</p></aside>')
    if day.get('hotel'):
        hotel=data['hotels'][day['hotel']]
        out.append(f'<aside><h3>今晚住宿 · {esc(hotel["cn"])}</h3><p>{esc(hotel["name"])}</p><p>{esc(hotel["address"])}</p><p>{esc(hotel.get("phone"))}</p><p>{esc(hotel["note"])}</p></aside>')
    out.append(f'<p>餐饮：{esc(day.get("meal"))}</p><p>交通：{esc(day.get("drive"))}</p></section>')
head='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nordic Journal 2026 · 离线关键资料</title><style>body{font:16px/1.8 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#142b36;background:#f6f8f8;margin:0;padding:24px;max-width:900px;margin:auto}h1{font-size:30px}h2{font-size:24px;line-height:1.4}h3{font-size:19px}a{color:#24566b}section{border-top:1px solid #cad7dc;padding:24px 0}li{padding:10px 0}li p{margin:5px 0}aside{background:#e8eff1;padding:18px;margin:18px 0}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{padding:8px}button{font:inherit;padding:12px 18px;color:#fff;background:#24566b;border:0;min-height:44px}@media print{nav,button{display:none}body{background:white;font-size:12px;padding:0}section{break-before:page}li,aside{break-inside:avoid}}</style></head><body><h1>Nordic Journal 2026</h1><p>2026.10.18 — 11.04 · 离线关键资料</p><p>这是原始计划资料，时间均按注明的当地时区。私人凭证需自行保存；外部导航与动态状态查询需联网。保存本页面后请断网试开，微信内无法保存时改用系统浏览器。</p><button onclick="window.print()">打印 / 保存为 PDF</button>'''
nav='<nav>'+''.join(f'<a href="#day-{d["id"]}">{esc(d["date"][5:])}</a>' for d in data['days'])+'</nav>'
end='''<section><h2>应急电话（原路书资料）</h2><p>芬兰、冰岛、丹麦：112；挪威：医疗113、火警110、警方112。说明位置、路号和人数。</p><p>天气、道路、机场状态须向官方查询，离线页不包含实时状态。</p></section></body></html>'''
(root/'essentials.html').write_text(head+nav+''.join(out)+end,encoding='utf-8')
assets=['index.html','essentials.html','favicon.svg','assets/data.js','assets/app.js','assets/trip-model.js','assets/journal.js','assets/product-views.js','assets/product-map.js','assets/product.js','assets/share.js','share/poster-2026-v4.jpg','share/qr-2026.svg','assets/legacy.css','assets/journal.css','assets/product.css','assets/leaflet.js']
digest=hashlib.sha256(b''.join((root/file).read_bytes() for file in assets)).hexdigest()[:16]
(root/'offline-manifest.json').write_text(json.dumps({'version':digest,'assets':assets}),encoding='utf-8')
print('Standalone essentials:',(root/'essentials.html').stat().st_size,'bytes; offline version:',digest)

# A byte change makes browsers discover a new worker after each asset revision.
worker=root/'sw.js'
worker_text=re.sub(r'^/\* Roadbook revision: [^*]+\*/\n','',worker.read_text(encoding='utf-8'));worker_text=re.sub(r"const ROADBOOK_VERSION='[^']+';","const ROADBOOK_VERSION='"+digest+"';",worker_text)
worker.write_text('/* Roadbook revision: '+digest+' */\n'+worker_text,encoding='utf-8')

# A legacy /dist/ URL receives the same static metadata and resolves assets at root.
alias=root/'dist';alias.mkdir(exist_ok=True)
(alias/'index.html').write_text((root/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="../">',1),encoding='utf-8')
