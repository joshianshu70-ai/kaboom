from pathlib import Path
from html.parser import HTMLParser
import json,re
root=Path(__file__).resolve().parents[1];s=root/'public'
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.refs=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ['a','link','script','img']:
   u=d.get('href',d.get('src',''))
   if u.startswith('/') and not u.startswith('//'):self.refs.append(u.split('#')[0].split('?')[0])
for p in s.rglob('*.html'):
 h=p.read_text();q=Parser();q.feed(h)
 for u in q.refs:
  if not u or u.startswith('/collection/images/'):continue
  assert (s/u.lstrip('/')).exists(),(p,u)
for i in range(1,1201):
 m=json.loads((s/'collection/metadata'/str(i)).read_text());assert m['image']==f'https://kaboom.thehouseofjoshi.com/collection/images/{i}.png' or re.fullmatch(r'ipfs://[A-Za-z0-9]{32,}',m['image']), 'Invalid image URI for NFT '+str(i)
for p in s.rglob('*'):
 assert not p.is_symlink(),p
 if p.is_file():assert p.stat().st_size<95*1024*1024,p
print('Passed: local root links, 1,200 valid production metadata image URIs, no symlinks and no oversized Git files.')

# Fitted headgear asset registration contract
import hashlib,struct
lock=json.loads((s/'assets/headgear-fit-lock.json').read_text())
for name,digest in lock['files'].items():
 data=(s/name).read_bytes()
 assert hashlib.sha256(data).hexdigest()==digest, 'Fitted asset changed; re-review registration: '+name
 assert data[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24])==(1024,1024),name
print('Passed: fitted body, expression and headgear registration checks.')
