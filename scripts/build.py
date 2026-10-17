from pathlib import Path
import argparse,shutil,json
p=argparse.ArgumentParser();p.add_argument('--nft-source',help='Folder containing 1.png through 1200.png for a complete Hostinger export');a=p.parse_args()
root=Path(__file__).resolve().parents[1];dest=root/'dist'
if dest.exists():shutil.rmtree(dest)
shutil.copytree(root/'public',dest)
if a.nft_source:
 source=Path(a.nft_source).expanduser().resolve();target=dest/'collection/images';target.mkdir(parents=True,exist_ok=True)
 for i in range(1,1201):
  image=source/(str(i)+'.png')
  if not image.is_file():raise SystemExit('Missing NFT image: '+str(image))
  shutil.copy2(image,target/image.name)
 print('Complete export: 1,200 NFT images included.')
else:print('Website-only export. NFT originals are excluded. Upload collection/images separately or rebuild with --nft-source.')
print('Build directory:',dest)
