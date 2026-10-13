"""Set public metadata and regenerate lightweight offline cache resources."""
from pathlib import Path
import os,re,subprocess,sys
site=os.environ['SITE_URL'].rstrip('/')+'/'
p=Path('dist/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('https://leizheqi-star.github.io/norway-iceland-trip-map/',site)
p.write_text(s,encoding='utf-8',newline='\n')
Path('dist/.nojekyll').touch()
subprocess.run([sys.executable,'scripts/build-essentials.py'],check=True)
print('Static Pages metadata configured for',site)
