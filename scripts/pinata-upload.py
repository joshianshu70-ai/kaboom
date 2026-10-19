"""Resumable local-only Pinata upload. Credentials are read from a private JSON file."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode
import argparse,hashlib,json,subprocess,threading,time,sys
API='https://api.pinata.cloud'
def digest(data):return hashlib.sha256(data).hexdigest()
def _request(credentials,path,fields=None):
 key,secret=credentials
 config=f'url = "{API}{path}"\nheader = "pinata_api_key: {key}"\nheader = "pinata_secret_api_key: {secret}"\n'
 args=['curl','--silent','--show-error','--max-time','180','--config','-','--write-out','\n%{http_code}']
 for k,v in fields or []:args+=['--form',k+'='+v]
 r=subprocess.run(args,input=config,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(f'Network error (curl {r.returncode}); resume to reconcile the last request.')
 body,code=r.stdout.rsplit('\n',1)
 if code!='200':
  # Do not log response bodies: auth services can return account details.
  raise RuntimeError(f'Pinata HTTP {code} on {path.split("?")[0]}; upload stopped without changing plans or accounts.')
 return json.loads(body)
RATE_LOCK=threading.Lock()
NEXT_REQUEST=0.0
PAUSED_UNTIL=0.0
def request(credentials,path,fields=None):
 global NEXT_REQUEST,PAUSED_UNTIL
 for attempt in range(4):
  with RATE_LOCK:
   time.sleep(max(0,NEXT_REQUEST-time.monotonic(),PAUSED_UNTIL-time.monotonic()))
   NEXT_REQUEST=time.monotonic()+.5
  try:return _request(credentials,path,fields)
  except RuntimeError as e:
   if 'HTTP 429 ' not in str(e) or attempt==3:raise
   with RATE_LOCK:PAUSED_UNTIL=max(PAUSED_UNTIL,time.monotonic()+65)
   print('Pinata rate limit: pausing 65 seconds, then retrying the same account.',flush=True)
 raise RuntimeError('Request retry exhausted')
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--collection',required=True);p.add_argument('--output',required=True)
 p.add_argument('--accounts-file',help='Private JSON array of five [API key, API secret] pairs; never put it under public/')
 p.add_argument('--parallel-per-account',type=int,default=4);p.add_argument('--upload',action='store_true');p.add_argument('--first-only',action='store_true');a=p.parse_args()
 root=Path(a.collection).resolve();out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
 plan=[]
 for i in range(1,1201):
  image=root/'images'/f'{i}.png';meta=root/'metadata'/str(i)
  if not image.is_file() or not meta.is_file():raise RuntimeError(f'Missing image or metadata #{i}')
  json.loads(meta.read_text())
  plan.append({'id':i,'account':(i-1)//240+1,'image':str(image),'metadata':str(meta),'sha256':digest(image.read_bytes())})
 batches=[{'account':j,'images':240,'metadata':240,'files':480,'image_bytes':sum(Path(r['image']).stat().st_size for r in plan if r['account']==j)} for j in range(1,6)]
 for b in batches:
  if b['image_bytes']+5_000_000>=1_000_000_000:raise RuntimeError('Batch exceeds conservative 1GB budget')
 (out/'batch-plan.json').write_text(json.dumps({'batches':batches,'tokens':plan},indent=2)+'\n')
 print(json.dumps(batches,indent=2),flush=True)
 if not a.upload:print('Dry run only. No network requests or uploads.');return
 if not a.accounts_file:raise RuntimeError('--accounts-file is required for upload')
 credentials=json.loads(Path(a.accounts_file).read_text())
 if len(credentials)!=5 or len({x[0] for x in credentials})!=5:raise RuntimeError('Five distinct account credentials required')
 statefile=out/'state.json';state=json.loads(statefile.read_text()) if statefile.exists() else {'tokens':{}}
 lock=threading.Lock();stop=threading.Event();errors=[];existing_ids=set(state['tokens'])
 def save():
  tmp=out/'state.tmp';tmp.write_text(json.dumps(state,indent=2)+'\n');tmp.replace(statefile)
 for b in batches:
  usage=request(credentials[b['account']-1],'/data/userPinnedDataTotal')
  completed=sum(bool(t.get(k)) for t in state['tokens'].values() if t['account']==b['account'] for k in ['image','metadata'])
  if usage['pin_count']+(480-completed)>500 or usage['pin_size_total']+b['image_bytes']+5_000_000>=1_000_000_000:
   raise RuntimeError(f'Account {b["account"]} does not have enough free capacity; no uploads started')
 def upload(r,kind,data,filename,mime):
  sha=digest(data);name=f'agent-x84-{kind}-{r["id"]}-{sha[:20]}'
  cred=credentials[r['account']-1]
  # Reconcile a prior timed-out upload before issuing another POST.
  listed=request(cred,'/data/pinList?'+urlencode({'status':'pinned','metadata[name]':name,'pageLimit':10})) if str(r['id']) in existing_ids else {'rows':[]}
  for row in listed.get('rows',[]):
   m=row.get('metadata') or {}
   if m.get('name')==name and (m.get('keyvalues') or {}).get('sha256')==sha:return {'cid':row['ipfs_pin_hash'],'sha256':sha}
  local=out/'pending'/filename;local.parent.mkdir(parents=True,exist_ok=True);local.write_bytes(data)
  response=request(cred,'/pinning/pinFileToIPFS',[
   ('file',f'@{local};filename={filename};type={mime}'),
   ('pinataMetadata',json.dumps({'name':name,'keyvalues':{'sha256':sha,'token_id':str(r['id']),'kind':kind}})),
   ('pinataOptions',json.dumps({'cidVersion':1}))])
  cid=response.get('IpfsHash')
  if not isinstance(cid,str) or not cid.isalnum():raise RuntimeError('Unexpected upload response; stopped')
  local.unlink(missing_ok=True)
  return {'cid':cid,'sha256':sha}
 def worker(account,records):
  try:
   for r in records:
    if stop.is_set():return
    id=str(r['id']);image=Path(r['image']).read_bytes()
    with lock:t=state['tokens'].setdefault(id,{'account':account})
    if t['account']!=account:raise RuntimeError('Account assignment changed; stopped')
    if t.get('image') and t['image']['sha256']!=digest(image):raise RuntimeError('Artwork changed after upload; stopped')
    if not t.get('image'):
     result=upload(r,'image',image,f'{id}.png','image/png')
     with lock:t['image']=result;save()
    meta=json.loads(Path(r['metadata']).read_text());meta['image']='ipfs://'+t['image']['cid'];data=(json.dumps(meta,indent=2)+'\n').encode()
    target=out/'metadata'/id;target.parent.mkdir(exist_ok=True);target.write_bytes(data)
    if t.get('metadata') and t['metadata']['sha256']!=digest(data):raise RuntimeError('Metadata changed after upload; stopped')
    if not t.get('metadata'):
     result=upload(r,'metadata',data,id,'application/json')
     with lock:t['metadata']=result;save()
    with lock:
     count=sum(bool(t.get('metadata')) for t in state['tokens'].values())
     print(f'Uploaded and checkpointed #{id}; total {count}/1200',flush=True)
    time.sleep(.4)
  except Exception as e:
   stop.set()
   with lock:errors.append({'account':account,'error':str(e)});print(json.dumps(errors[-1]),flush=True)
 parallel=max(1,min(a.parallel_per_account,4))
 records=[plan[:1]] if a.first_only else [[r for r in plan if r['account']==j][offset::parallel] for j in range(1,6) for offset in range(parallel)]
 with ThreadPoolExecutor(max_workers=20) as pool:list(pool.map(lambda rs:worker(rs[0]['account'],rs),records))
 report={'completed_images':sum(bool(t.get('image')) for t in state['tokens'].values()),'completed_metadata':sum(bool(t.get('metadata')) for t in state['tokens'].values()),'errors':errors,'base_uri':'https://kaboom.thehouseofjoshi.com/collection/metadata/','published_to_vercel':False,'contract_updated':False}
 (out/'upload-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
 if errors:sys.exit(1)
if __name__=='__main__':main()
