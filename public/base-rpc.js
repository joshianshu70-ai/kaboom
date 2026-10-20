import {FallbackProvider,JsonRpcProvider} from './vendor/ethers.min.js';
// Separate requests avoid public RPC batch limits. All providers are read-only.
export function createBaseRpc(){
  const urls=['https://mainnet.base.org','https://base-rpc.publicnode.com','https://base.drpc.org'];
  return new FallbackProvider(urls.map((url,i)=>({provider:new JsonRpcProvider(url,8453,{staticNetwork:true,batchMaxCount:1}),priority:i+1,stallTimeout:1200,weight:1})),8453,{quorum:1});
}
