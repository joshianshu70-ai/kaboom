# Agent X-84 — final local collection v2

1,200 unique 1024×1024 PNGs and 1,200 matching metadata documents, IDs 1–1200. Built from the latest blank bodies, shaded universal expressions, mounted outfits, approved headgear and individual background charts. Facial alignment has been corrected: centered mouths and noses, evenly anchored eyes, with intentional expression differences preserved. Accessories are excluded. This supersedes the older `agent-x84-collection` export.

## Contents

- `images/1.png` through `images/1200.png`: full-resolution artwork.
- `metadata/1` through `metadata/1200`: local-preview metadata, intentionally without `.json` because the contract appends the numeric token ID directly to its base URI.
- `thumbnails/`: gallery previews.
- `gallery.html`: searchable, filterable gallery; serve over local HTTP.
- `layers/`: exact layer assets used in this collection. FOMO phrases are placed in the right background margin, chart panels in the left margin.
- `collection-plan.json`: fixed ID-to-trait mapping and deterministic seed output.
- `trait-counts.json`, `rarity.csv`: actual frequencies and descriptive rarity rankings.
- `checksums.json`, `validation.json`: per-image SHA-256 hashes and validation results.
- `review/`: visual review covering all 111 outfit/headgear combinations used.

Edition tiers: 600 Common, 360 Uncommon, 180 Rare, 48 Epic and 12 Ultra Rare Gold. These are assigned artwork tiers, not financial valuations. Gold body, gold aura and gold headphones occur together only in the 12 gold editions. Silver remains separate from gold. Rarity scores and ranks have been recalculated without accessory traits. Rarity score is the sum of negative log2 observed trait frequencies, excluding the assigned tier. Correlated traits can inflate the score; rank is descriptive.

Compatibility rules: the helmet is used only with Astronaut, Moon Explorer or Space Suit; helmet editions omit phrase badges. Accessories have been removed from all artwork, metadata and the layer studio. All full trait combinations and final PNG hashes are unique. Individual skins, outfits and other traits deliberately repeat.

## Local preview

The running site links to `http://127.0.0.1:4173/collection/gallery.html`. Its images, metadata and thumbnail folders are local symlinks to this collection folder. These symlinks are for local use; a future website deployment must upload/copy the actual files or use published storage URLs.

For a standalone preview, run Python's HTTP server in this folder and open `/gallery.html` at that server's address. The site studio now uses these corrected layers; its seeded drafts are separate from this fixed final edition. Use this folder's `collection-plan.json` and metadata as the canonical final mapping.

## Publishing later — not performed

1. Upload the contents of `images/` as one folder to your chosen IPFS storage provider. Record its folder CID and verify several images, including `1.png` and `1200.png`.
2. Run `python3 prepare_metadata.py --image-base ipfs://YOUR_REAL_IMAGE_FOLDER_CID/` from this folder. Replace the example URI with the actual uploaded folder URI. This creates `metadata-publish/` without modifying local-preview metadata.
3. Upload the contents of `metadata-publish/` as a second folder. Record its folder CID. Verify documents `/1` and `/1200` return valid JSON with working image URIs. Keep filenames extensionless.
4. From the current NFT owner's wallet on Base, use the existing admin page's metadata setting to submit `setBaseURI` with `ipfs://YOUR_REAL_METADATA_FOLDER_CID/`, including the trailing slash. Verify ownership before signing; the deployer address alone does not establish current ownership.
5. Verify the NFT contract's `tokenURI(id)` for minted IDs and refresh marketplace metadata if needed. Unminted token IDs may revert even though their prepared files exist.

Token: `0x44A76199e0BDa48E715b8204C2d231DD712C2693`.
NFT: `0x9aCAA832F7C9CBaBf2F001b7bB01bE7b1279C226`.

No files have been uploaded and no blockchain transaction has been submitted. Local metadata uses relative image paths; do not publish those files unchanged. Generated artwork and metadata are not evidence that an NFT has been minted.
