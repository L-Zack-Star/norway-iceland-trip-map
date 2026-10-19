"""Publish only itinerary flights from official airport sources; retain timestamped prior observations."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError
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
                'sourceUpdatedAt': root.find('flights').get('lastUpdate', ''),
                'source': 'Avinor', 'sourceUrl': 'https://www.avinor.no/'}
    return result

def collect_cph(rows, flights, direction, checked):
    result = {}
    for row in rows:
        number = re.sub(r'\s+', '', row.get('Iata', '')).upper()
        scheduled = row.get('ScheduledDateTime', '')
        if not scheduled: continue
        date = instant(scheduled).astimezone(ZoneInfo(ZONES['CPH'])).date().isoformat()
        for f in flights:
            own, other = (f['from'], f['to']) if direction == 'D' else (f['to'], f['from'])
            if own != 'CPH' or row.get('IataDestination') != other or f['number'] != number or f['date'] != date:
                continue
            status = row.get('Status', '').strip()
            state = status.casefold()
            # Status strings come directly from the English airport display feed.
            code = ('C' if 'cancel' in state else 'D' if direction == 'D' and state == 'departed'
                    else 'A' if direction == 'A' and state in ('landed', 'arrived')
                    else 'H' if direction == 'A' and state == 'baggage'
                    else 'B' if direction == 'D' and state == 'boarding'
                    else 'G' if direction == 'D' and state in ('closed', 'closing')
                    else 'T' if direction == 'D' and state == 'to gate' else 'E')
            time = row.get('ExpectedDateTime', '')
            if time: instant(time)
            result.setdefault(f['key'], {})['departure' if direction == 'D' else 'arrival'] = {
                'airport': 'CPH', 'scheduled': scheduled, 'code': code, 'time': time,
                'gate': row.get('Gate', '') if direction == 'D' else '', 'belt': '',
                'delayed': bool(time and instant(time) > instant(scheduled)), 'checkedAt': checked,
                'source': 'Copenhagen Airport', 'sourceUrl': 'https://www.cph.dk/en/flight-information',
                'statusText': status,
                'scheduleOnly': not status and (instant(scheduled) - instant(checked)).total_seconds() > 48*3600}
    return result

def main():
    now = datetime.now(timezone.utc)
    checked = now.isoformat().replace('+00:00', 'Z')
    source = (ROOT / 'dist/assets/data.js').read_text()
    data = json.JSONDecoder().raw_decode(source[source.index('const DATA=') + 11:])[0]
    flights = [{'key': d['date'] + ':' + f[0], 'date': d['date'], 'number': f[0],
                'from': f[1], 'to': f[4]} for d in data['days'] for f in d.get('flights', [])]
    # Scheduled jobs only deploy near a relevant flight, and stop after this trip.
    active = flights
    active = [f for f in active if abs((datetime.fromisoformat(f['date']).replace(tzinfo=timezone.utc) - now).total_seconds()) < 40*3600]
    if os.environ.get('GITHUB_EVENT_NAME') == 'schedule' and not active:
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as out: out.write('publish=false\n')
        return
    target = ROOT / 'dist/flight-status.json'
    seed = json.loads(target.read_text()) if target.exists() else {}
    previous = {}
    public = os.environ.get('SITE_URL', 'https://l-zack-star.github.io/norway-iceland-trip-map/').rstrip('/')
    try:
        previous = json.loads(read_url(public + '/flight-status.json'))
    except Exception:
        if target.exists(): previous = json.loads(target.read_text())
    allowed = {f['key'] for f in flights}
    records = {}
    # Preserve the newest verified observation per side, including the shipped seed.
    for snapshot in (seed, previous):
        for key, sides in snapshot.get('flights', {}).items():
            if key not in allowed: continue
            for side, observation in sides.items():
                old = records.setdefault(key, {}).get(side)
                if not old or instant(observation['checkedAt']) >= instant(old['checkedAt']):
                    records[key][side] = observation
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
    # CPH's own public website feed; only request this itinerary's flights.
    cph_flights = active if os.environ.get('GITHUB_EVENT_NAME') == 'schedule' else flights
    tasks = {(f['date'], 'D' if f['from'] == 'CPH' else 'A', f['number'])
             for f in cph_flights if 'CPH' in (f['from'], f['to'])}
    def fetch_cph(task):
        date, direction, number = task
        query = urlencode({'direction': direction, 'userQuery': number,
            'startDateTime': date + 'T00:00:00', 'endDateTime': date + 'T23:59:59', 'language': 'en'})
        try:
            rows = json.loads(read_url('https://www.cph.dk/api/FlightInformation/GetFlightInfoTable?' + query))
            if not isinstance(rows, list): raise ValueError('Unexpected CPH response')
            return collect_cph(rows, flights, direction, checked), None
        except Exception as error:
            return {}, ('HTTP ' + str(error.code)) if isinstance(error, HTTPError) else type(error).__name__
    with ThreadPoolExecutor(max_workers=3) as pool:
        for found, error in pool.map(fetch_cph, tasks):
            if error: errors['CPH'] = error
            for key, sides in found.items(): records.setdefault(key, {}).update(sides)
    coverage = {a: {'connected': a in NORWAY or a == 'CPH', 'available': a not in errors and (a in NORWAY or a == 'CPH')} for a in ZONES}
    target.write_text(json.dumps({'generatedAt': checked, 'flights': records,
        'errors': errors, 'coverage': coverage, 'refreshMinutes': 5}, ensure_ascii=False, indent=2) + '\n')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as out: out.write('publish=true\n')
    print('Published observations for', len(records), 'itinerary flights; failed airports:', ','.join(errors) or 'none')

if __name__ == '__main__': main()
