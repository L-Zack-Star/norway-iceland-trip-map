"""Set public metadata and regenerate lightweight offline cache resources."""
from pathlib import Path
import os,re,subprocess,sys
site=os.environ['SITE_URL'].rstrip('/')+'/'
p=Path('dist/index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'https://[A-Za-z0-9-]+\.github\.io/norway-iceland-trip-map/',lambda _:site,s)
p.write_text(s,encoding='utf-8',newline='\n')
Path('dist/.nojekyll').touch()
subprocess.run([sys.executable,'scripts/build-essentials.py'],check=True)
print('Static Pages metadata configured for',site)
