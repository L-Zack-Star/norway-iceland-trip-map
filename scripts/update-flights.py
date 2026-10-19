"""Publish only itinerary flights from Avinor; retain timestamped prior observations."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
import json, os, re, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NORWAY = {'OSL', 'TOS', 'LKN', 'SVJ', 'BOO'}
ZONES = {**dict.fromkeys(NORWAY, 'Europe/Oslo'), 'HEL': 'Europe/Helsinki',
         'PKX': 'Asia/Shanghai', 'KEF': 'Atlantic/Reykjavik', 'CPH': 'Europe/Copenhagen'}

def read_url(url):
    with urlopen(Request(url, headers={'User-Agent': 'NordicJournal/1.0'}), timeout=20) as r:
        return r.read()

def instant(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))

def collect(xml, airport, flights, checked):
    root = ET.fromstring(xml)
    result = {}
    for node in root.findall('.//flight'):
        number = re.sub(r'\s+', '', node.findtext('flight_id', '')).upper()
        scheduled = node.findtext('schedule_time', '')
        direction = node.findtext('arr_dep', '')
        if not scheduled or direction not in ('A', 'D'):
            continue
        date = instant(scheduled).astimezone(ZoneInfo(ZONES[airport])).date().isoformat()
        for f in flights:
            if number != f['number'] or date != f['date']:
                continue
            own, other = (f['from'], f['to']) if direction == 'D' else (f['to'], f['from'])
            route = [node.findtext('airport', ''), *node.findtext('via_airport', '').split(',')]
            if airport != own or other not in [x.strip() for x in route]:
                continue
            status = node.find('status')
            code = status.get('code', '') if status is not None else ''
            time = status.get('time', '') if status is not None else ''
            if time:
                instant(time)  # Reject malformed timestamps rather than publishing them.
            result.setdefault(f['key'], {})['departure' if direction == 'D' else 'arrival'] = {
                'airport': airport, 'scheduled': scheduled, 'code': code, 'time': time,
                'gate': node.findtext('gate', '') if direction == 'D' else '',
                'belt': node.findtext('belt', '') if direction == 'A' else '',
                'delayed': node.findtext('delayed', '') == 'Y', 'checkedAt': checked,
                'sourceUpdatedAt': root.find('flights').get('lastUpdate', '')}
    return result

def main():
    now = datetime.now(timezone.utc)
    checked = now.isoformat().replace('+00:00', 'Z')
    source = (ROOT / 'dist/assets/data.js').read_text()
    data = json.JSONDecoder().raw_decode(source[source.index('const DATA=') + 11:])[0]
    flights = [{'key': d['date'] + ':' + f[0], 'date': d['date'], 'number': f[0],
                'from': f[1], 'to': f[4]} for d in data['days'] for f in d.get('flights', [])]
    # Scheduled jobs only deploy near a relevant flight, and stop after this trip.
    active = [f for f in flights if f['from'] in NORWAY or f['to'] in NORWAY]
    active = [f for f in active if abs((datetime.fromisoformat(f['date']).replace(tzinfo=timezone.utc) - now).total_seconds()) < 40*3600]
    if os.environ.get('GITHUB_EVENT_NAME') == 'schedule' and not active:
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as out: out.write('publish=false\n')
        return
    target = ROOT / 'dist/flight-status.json'
    previous = {}
    public = os.environ.get('SITE_URL', 'https://l-zack-star.github.io/norway-iceland-trip-map/').rstrip('/')
    try:
        previous = json.loads(read_url(public + '/flight-status.json'))
    except Exception:
        if target.exists(): previous = json.loads(target.read_text())
    allowed = {f['key'] for f in flights}
    records = {k: v for k, v in previous.get('flights', {}).items() if k in allowed}
    airports = sorted({a for f in active for a in (f['from'], f['to']) if a in NORWAY})
    def fetch(airport):
        try:
            xml = read_url('https://asrv.avinor.no/XmlFeed/v1.0?airport=' + airport + '&TimeFrom=36&TimeTo=48')
            return airport, collect(xml, airport, flights, checked), None
        except Exception as error:
            return airport, {}, type(error).__name__
    errors = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        for airport, found, error in pool.map(fetch, airports):
            if error: errors[airport] = error
            for key, sides in found.items(): records.setdefault(key, {}).update(sides)
    target.write_text(json.dumps({'generatedAt': checked, 'flights': records,
        'errors': errors, 'refreshMinutes': 5}, ensure_ascii=False, indent=2) + '\n')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as out: out.write('publish=true\n')
    print('Published observations for', len(records), 'itinerary flights; failed airports:', ','.join(errors) or 'none')

if __name__ == '__main__': main()
