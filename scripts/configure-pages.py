"""GitHub project subpaths use relative assets; only metadata needs absolute URLs."""
from pathlib import Path
import os
site=os.environ['SITE_URL'].rstrip('/')+'/'
p=Path('dist/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('https://nordic-journal-2026.lovelyokapi32.chatgpt.site/',site)
p.write_text(s,encoding='utf-8')
Path('dist/.nojekyll').touch()
print('Static Pages metadata configured for',site)
