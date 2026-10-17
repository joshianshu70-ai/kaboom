import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
await rm(new URL('../public/vendor/appkit/', import.meta.url), { recursive: true, force: true });
await build({
  entryPoints: ['src/wallet-sdk.js'],
  outdir: 'public/vendor/appkit',
  bundle: true, splitting: true, format: 'esm', platform: 'browser',
  target: ['es2022'], minify: true, legalComments: 'linked',
  define: { 'process.env.NODE_ENV': '"production"' },
  chunkNames: 'chunks/[name]-[hash]', logLevel: 'info'
});
