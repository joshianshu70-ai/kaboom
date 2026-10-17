# Fixed-canvas artwork fit

Revision: mounted-master-v8. The beanie, cowboy hat, trucker cap, silver headphones and pilot goggles were designed on the mint base head before creating the registered layers. Black and gold headphone variants use the same silhouette. Helmet and transparent None remain compatible.

Every layer is a full 1024×1024 RGBA canvas. Render at (0,0) in the fixed stacking order. Do not trim transparent margins, fit by bounding box, scale a trait independently or apply dynamic offsets. Browser rendering rejects mismatched layer dimensions. scripts/check.py verifies the reviewed body/expression/headgear hashes and PNG dimensions; build.py runs those checks before export.

To deliberately replace artwork, re-review all body colors, expressions and outfits, then regenerate the fit-lock manifest. The checksum is a regression guard, not a claim that artistic judgment can be automated. Source NFT originals remain outside Git. Contact shadows are neutral so they can be reused across all seven body colors; goggles use translucent neutral glass.
