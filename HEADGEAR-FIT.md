# Shared mint artwork

`public/assets/layers` contains the approved fixed-canvas layers. `public/artwork-release.json` records every layer's SHA-256; the renderer uses these hashes in image URLs to invalidate old cached assets. Do not crop, scale, reposition or substitute layers during rendering.

`public/collection/artwork-plan.json` fixes all 1,200 edition IDs, traits and original PNG hashes. The studio loads this plan rather than creating a separate seeded draft collection. Custom builder previews do not change the next token ID minted by the contract.

Gallery detail images and metadata exports resolve through `collection/metadata/{id}`, the same metadata used for minting. Preserve the published IPFS URLs when updating the site. Publishing a new layer also requires rebuilding affected original PNGs, updating thumbnails, publishing their image metadata, and updating the fixed plan's image hashes.

Run `python3 scripts/check.py` before deploying. It verifies the approved fit lock, shared release hashes and complete fixed edition plan. The current release was additionally checked by compositing all 1,200 editions and comparing each result pixel for pixel with its mint original.
