import importlib.util,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('uploader',Path(__file__).resolve().parents[1]/'scripts/pinata-upload.py');u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)
class UploadTests(unittest.TestCase):
 def test_upload_resume_and_image_links(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);collection=root/'collection';(collection/'images').mkdir(parents=True);(collection/'metadata').mkdir()
   for i in range(1,1201):
    (collection/'images'/f'{i}.png').write_bytes(b'PNG'+str(i).encode());(collection/'metadata'/str(i)).write_text(json.dumps({'name':f'#{i}','image':'../images/'+str(i)+'.png','attributes':[]}))
   credentials=root/'credentials.json';credentials.write_text(json.dumps([[f'key{i}','secret'] for i in range(5)]));calls=[]
   def mock_request(cred,path,fields=None):
    calls.append((path,fields))
    if path=='/data/userPinnedDataTotal':return {'pin_count':0,'pin_size_total':0}
    if path.startswith('/data/pinList?'):return {'rows':[]}
    return {'IpfsHash':'bafy'+str(len(calls))}
   args=['upload','--collection',str(collection),'--output',str(root/'out'),'--accounts-file',str(credentials),'--upload','--first-only']
   with patch.object(sys,'argv',args),patch.object(u,'request',mock_request),patch.object(u.time,'sleep',lambda _:None):u.main()
   self.assertEqual(sum(p=='/pinning/pinFileToIPFS' for p,_ in calls),2)
   state=json.loads((root/'out/state.json').read_text());metadata=json.loads((root/'out/metadata/1').read_text())
   self.assertEqual(metadata['image'],'ipfs://'+state['tokens']['1']['image']['cid'])
   self.assertEqual(json.loads((collection/'metadata/1').read_text())['image'],'../images/1.png')
   calls.clear()
   with patch.object(sys,'argv',args),patch.object(u,'request',mock_request),patch.object(u.time,'sleep',lambda _:None):u.main()
   self.assertEqual(sum(p=='/pinning/pinFileToIPFS' for p,_ in calls),0)
   plan=json.loads((root/'out/batch-plan.json').read_text());self.assertTrue(all(b['files']==480 for b in plan['batches']))
if __name__=='__main__':unittest.main()
