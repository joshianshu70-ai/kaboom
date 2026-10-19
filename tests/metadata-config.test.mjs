import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../public/metadata-config.js',import.meta.url),'utf8');
const {readMetadataBaseURI,METADATA_BASE_URI}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('empty metadata keeps a launch unavailable',async()=>{assert.equal(await readMetadataBaseURI({getStorage:async()=> '0x'+'0'.repeat(64)},'nft'),'');});
test('decodes a short Solidity string',async()=>{const s='ipfs://short/';const b=Buffer.alloc(32);b.write(s);b[31]=Buffer.byteLength(s)*2;assert.equal(await readMetadataBaseURI({getStorage:async()=> '0x'+b.toString('hex')},'nft'),s);});
test('decodes the full production URL from long-string storage',async()=>{const data=Buffer.from(METADATA_BASE_URI);const start=BigInt('0xd7b6990105719101dabeb77144f2a3385c8033acd3af97e9423a695e81ad1eb5');const provider={async getStorage(_a,slot){if(slot===13)return '0x'+(BigInt(data.length)*2n+1n).toString(16).padStart(64,'0');const offset=Number(BigInt(slot)-start)*32;return '0x'+data.subarray(offset,offset+32).toString('hex').padEnd(64,'0');}};assert.equal(await readMetadataBaseURI(provider,'nft'),METADATA_BASE_URI);});
test('rejects an unexpected storage length',async()=>{await assert.rejects(readMetadataBaseURI({getStorage:async()=> '0x'+(10000n*2n+1n).toString(16).padStart(64,'0')},'nft'),/Unexpected/);});
