from pathlib import Path
import argparse,shutil,json,subprocess,sys,hashlib
p=argparse.ArgumentParser();p.add_argument('--nft-source',help='Folder containing 1.png through 1200.png for a complete Hostinger export');a=p.parse_args()
root=Path(__file__).resolve().parents[1];dest=root/'dist'
subprocess.run([sys.executable,str(root/'scripts/check.py')],check=True)
if dest.exists():shutil.rmtree(dest)
shutil.copytree(root/'public',dest)
if a.nft_source:
 source=Path(a.nft_source).expanduser().resolve();target=dest/'collection/images';target.mkdir(parents=True,exist_ok=True)
 approved={e['id']:e['sha256'] for e in json.loads((root/'public/collection/artwork-plan.json').read_text())['editions']}
 for i in range(1,1201):
  image=source/(str(i)+'.png')
  if not image.is_file():raise SystemExit('Missing NFT image: '+str(image))
  assert hashlib.sha256(image.read_bytes()).hexdigest()==approved[i], 'Mint original differs from approved generator edition: '+str(i)
  shutil.copy2(image,target/image.name)
 print('Complete export: 1,200 NFT images included.')
else:print('Website-only export. NFT originals are excluded. Upload collection/images separately or rebuild with --nft-source.')
print('Build directory:',dest)
