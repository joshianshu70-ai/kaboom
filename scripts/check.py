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

# One registered release for the generator, gallery and mint metadata.
release=json.loads((s/'artwork-release.json').read_text())
for name,digest in release['files'].items():
 assert hashlib.sha256((s/name).read_bytes()).hexdigest()==digest, 'Artwork release mismatch: '+name
editions=json.loads((s/'collection/artwork-plan.json').read_text())['editions']
assert [e['id'] for e in editions]==list(range(1,1201))
for e in editions:
 assert e['selection'] and len(e['sha256'])==64, 'Incomplete mint artwork plan'
print('Passed: shared artwork release and all 1,200 fixed mint editions.')

# The admin studio previews an isolated unpublished release, never live mint metadata.
from collections import Counter
candidate=s/'draft'
if candidate.exists():
 release=json.loads((candidate/'artwork-release.json').read_text())
 for name,digest in release['files'].items():
  assert hashlib.sha256((candidate/name).read_bytes()).hexdigest()==digest,'Draft asset mismatch: '+name
 plan=json.loads((candidate/'collection/artwork-plan.json').read_text())['editions']
 config=json.loads((candidate/'rarity-config.json').read_text())
 assert [e['id'] for e in plan]==list(range(1,1201))
 for b in config['brackets']:
  assert Counter(e['rarity'] for e in plan if b['start']<=e['id']<=b['end'])==dict(zip(config['tiers'],b['counts']))
 for e in plan:
  selection=e['selection'];m=json.loads((candidate/'collection/metadata'/str(e['id'])).read_text());a={x['trait_type']:x['value'] for x in m['attributes']}
  assert a['Serial Number']==e['id'] and a['Agent Class']==e['agentClass'] and a['Rarity Tier']==e['rarity']
  assert (selection['10-house-branding']!='none') == (selection['04-outfits'] in ['grey-hoodie', 'purple-hoodie', 'puffer-jacket', 'cyberpunk-jacket', 'tactical-agent', 'trading-suit'])
  assert not(selection['07-charts']!='none' and selection['09-fomo-phrases']!='none')
  assert m['image']==f"../images/{e['id']}.png",'Draft export image path mismatch'
 assert plan[0]['rarity']=='Ultra Rare Gold' and plan[0]['specialEdition']=='Genesis Prime'
 print('Passed: isolated draft assets, all bracket quotas, Genesis Prime #1 and 1,200 matching draft metadata files.')
