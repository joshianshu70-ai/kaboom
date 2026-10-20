# KABOOM · Agent X-84

Static Base NFT drop website for https://kaboom.thehouseofjoshi.com.

## Start locally
Requires Python 3.10+; Node/npm is optional for convenience scripts. No install step or secret keys are needed.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
```
Open http://127.0.0.1:4173/. Clean URLs use directory index files. Public pages include /mint/, /contact/, /how-to-mint/ and policy pages. Artwork tools are under /admin/, /admin/gallery/ and /admin/studio/.

## Check and build
```sh
python3 scripts/check.py
python3 scripts/build.py
```
Equivalent commands: `npm run check`, `npm run build`, `npm run dev`.

## NFT originals are deliberately outside Git
The 1,200 full PNGs occupy approximately 2.17 GB and are not included in this repository. Thumbnails, layers and 1,200 metadata files are included. The metadata image URLs already point to the production subdomain. For a complete local deployment export, use your existing originals:

```sh
python3 scripts/build.py --nft-source "/absolute/path/to/agent-x84-final-1200-v2/images"
```
This writes actual image files into `dist/collection/images/`, without symlinks. Keep dist out of Git. A website-only build does not make the original NFT URLs available; upload the originals separately or use the complete build. Do not set the contract base URI until the public metadata and images have been verified.

## Hostinger
Create kaboom.thehouseofjoshi.com and enable HTTPS. Upload the **contents** of dist to the subdomain document root. Preserve hidden .htaccess and extensionless metadata filenames. Do not replace the main thehouseofjoshi.com website. Confirm `/contact/`, `/collection/metadata/1` and `/collection/images/1.png` work over HTTPS. Return metadata with an application/json content type; configure the host if it returns downloads or HTML instead.

Expected NFT base URI after successful hosting:
`https://kaboom.thehouseofjoshi.com/collection/metadata/`

Updating the on-chain URI is a separate owner-authorized Base transaction. No DNS change, upload or wallet transaction is performed by these scripts.

## GitHub push
Create an empty GitHub repository, then run these commands **inside this folder**:

```sh
git init
git add .
git commit -m "Add KABOOM drop website"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Replace YOUR_GITHUB_REPOSITORY_URL with your own repository URL. Never commit wallet seed phrases, private keys, hosting passwords or API tokens. This folder is not automatically published or pushed anywhere.

## Contracts
Base chain ID 8453.
- Token: 0x44A76199e0BDa48E715b8204C2d231DD712C2693
- NFT: 0x9aCAA832F7C9CBaBf2F001b7bB01bE7b1279C226
- Owner last checked: 0x6736d2ea9807297f0e56967361b9410854b86a5f

Project Solidity source is in contracts/. It is not an independent audit. The website can call existing contract functions, not rewrite deployed bytecode.

## Before public launch
Confirm legal operator identity and final NFT artwork license; current pages explicitly mark them pending. Verify hosting, metadata, current owner, mint price and budget. Test an owner-approved mint and marketplace display. Last read-only chain snapshot is not a guarantee of current state.

## Access and licensing
Hiding preview links or adding robots.txt does not protect artwork. Static admin tools and assets are publicly accessible on hosting unless server-side access control is added. Contract writes still require appropriate wallet authority. Do not publish a public GitHub repository if collection secrecy is required.

No new license is granted for artwork by this repository. Individual source-file license notices remain in effect. Contact support@thehouseofjoshi.com.

## Reown AppKit wallet connections
Home, mint and admin pages use the official Ethers adapter on Base (8453), including WalletConnect QR/mobile and installed wallets. Project ID: `4fccd98dd84a730565d62668722ab201` (public frontend identifier, not a private key).

In the Reown Dashboard, allow `https://kaboom.thehouseofjoshi.com` and your development origin (`http://127.0.0.1:4173` or `http://localhost:4173`). Metadata uses the current origin so it matches the page. Dashboard ownership, project validity and origin permissions must be checked in your account.

The compiled SDK is included in public/vendor/appkit so Hostinger needs no Node runtime. To rebuild after source/dependency changes, use Node 22+, `npm ci`, `npm run build:wallet`, `npm run test:wallet`, then the usual Python build. Commit the generated bundle and lockfile together. No server secret is needed.

The app uses the provider chosen in AppKit for every signature and transaction, retains exact token approvals and Base/account checks, and clears reviews on account, chain, connector or disconnect changes. Connecting does not mint, approve tokens or request a signature.

## Current hosting: Vercel and IPFS
Vercel is the current hosting choice; earlier Hostinger notes describe the previous option. Use this repository root as the Vercel project root. vercel.json serves the precompiled public folder and sets JSON content type for extensionless metadata files. No Node install or build command is needed for this static deployment.

The local-only scripts/pinata-upload.py uploader accepts a private accounts-file outside the repository; see its --help. It assigns 240 images and 240 metadata files per supplied account and checks available capacity before starting. It uses authenticated HTTPS, checkpoints each uploaded file, reconciles interrupted uploads, and backs off on rate limiting without changing accounts or plans. Account authorization and provider plan terms remain the account holder's responsibility.

The upload does not change the contract URI or deploy the site. Published metadata must use actual uploaded IPFS CIDs; do not replace it with placeholder CIDs. Keep upload credentials out of public/, archives and Git. Revoke any keys shared in chat after the upload is complete. Pinning availability must be maintained after keys are revoked.

## Mint launch readiness
The live contract is funded for 1,200 mints at the current 500,000 KABOOM price (last checked 2026-10-19). Its metadata base string was empty at launch verification. The mint interface checks the on-chain string from the non-proxy AgentX84 storage layout (slot 13) and enables mint reviews only when it matches the prepared production metadata URL. Account/network/price/funding checks remain in place.

The owner must open /admin/?setup=metadata, connect the current owner wallet on Base, review the prefilled URL and sign setBaseURI. This is a separate wallet transaction. Refresh the mint page once confirmed. The website never changes the contract URI automatically or signs for the owner.

## Published bracketed collection — 20 October 2026

The reviewed 1,200-piece bracketed collection is now the production artwork release. `public/collection/publication.json` records all image and metadata CIDs and SHA-256 hashes. The studio, gallery and mint metadata share this plan: Genesis #1–120, Vanguard #121–600, Main Collection #601–1200, including Genesis Prime #1 and twelve gold editions. Images and metadata are pinned to IPFS. The existing contract metadata base URL remains unchanged; publication requires no new contract or wallet transaction. The preserved `/draft/` files are a historical workspace, not the active mint source. Production checks verify all metadata hashes against the release manifest.
