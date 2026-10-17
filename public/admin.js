import {walletProvider,connectWallet,disconnectWallet} from './wallet.js';
import {BrowserProvider, Contract, formatUnits, parseUnits} from './vendor/ethers.min.js';
const ADMIN='0x6736d2ea9807297f0e56967361b9410854b86a5f';
const NFT='0x9acaa832f7c9cbabf2f001b7bb01be7b1279c226';
const TOKEN='0x44a76199e0bda48e715b8204c2d231dd712c2693';
const nftABI=['function owner() view returns(address)','function pendingOwner() view returns(address)','function acceptOwnership()','function kaboom() view returns(address)','function nftMintPrice() view returns(uint256)','function totalMinted() view returns(uint256)','function availableBudget() view returns(uint256)','function totalBurned() view returns(uint256)','function totalRewarded() view returns(uint256)','function FULL_COLLECTION_BUDGET() view returns(uint256)','function tokenURI(uint256) view returns(string)','function setNftMintPrice(uint256)','function setBaseURI(string)','function fundEcosystemBudget(uint256)'];
const tokenABI=['function totalSupply() view returns(uint256)','function developmentAndOperationsWallet() view returns(address)','function wifeAndIWallet() view returns(address)','function foundersReserveWallet() view returns(address)','function strategicPartnershipsWallet() view returns(address)','function ecosystemTreasuryWallet() view returns(address)','function liquidityReserveWallet() view returns(address)','function decimals() view returns(uint8)','function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)'];
const $=id=>document.getElementById(id);let account,provider,nft,token,ready=false,busy=false,pending=null,capacity=0n,balance=0n,epoch=0;
$('allowed').textContent=ADMIN;
for(const [id,address] of [['nftLink',NFT],['tokenLink',TOKEN]]){$(id).textContent=address;$(id).href='https://basescan.org/address/'+address;}
const say=s=>$('status').textContent=s;
const lock=()=>document.querySelectorAll('.write').forEach(b=>b.disabled=!ready||busy);
function invalidate(){epoch++;ready=false;$('accept').disabled=true;pending=null;$('review').hidden=true;lock();}
function error(e){return e.shortMessage||e.reason||e.message||String(e);}
async function check(){
 invalidate();
 const chain=await walletProvider.request({method:'eth_chainId'});
 const accounts=await walletProvider.request({method:'eth_accounts'});account=accounts[0]?.toLowerCase();
 if(chain!=='0x2105')throw Error('Select Base mainnet (chain ID 8453) in your wallet.');
 if(account!==ADMIN)throw Error('Connect the allowed admin wallet: '+ADMIN);
 provider=new BrowserProvider(walletProvider);const signer=await provider.getSigner();
 nft=new Contract(NFT,nftABI,signer);token=new Contract(TOKEN,tokenABI,signer);
 const [nftCode,tokenCode]=await Promise.all([provider.getCode(NFT),provider.getCode(TOKEN)]);
 if(nftCode==='0x'||tokenCode==='0x')throw Error('Contract bytecode not found on Base. Check deployment addresses.');
 const [owner,linked,decimals,price,minted,budget,burned,rewarded,full,walletBalance]=await Promise.all([nft.owner(),nft.kaboom(),token.decimals(),nft.nftMintPrice(),nft.totalMinted(),nft.availableBudget(),nft.totalBurned(),nft.totalRewarded(),nft.FULL_COLLECTION_BUDGET(),token.balanceOf(account)]);
 $('owner').textContent=owner;const nominee=await nft.pendingOwner();$('pendingOwner').textContent=nominee;$('accept').disabled=nominee.toLowerCase()!==ADMIN||busy;
 if(linked.toLowerCase()!==TOKEN||decimals!==18n)throw Error('Contract token configuration differs from the expected $KABOOM deployment.');
 await loadToken();
 $('price').textContent=formatUnits(price,18);$('minted').textContent=String(minted)+' / 1,200';$('budget').textContent=formatUnits(budget,18);$('balance').textContent=formatUnits(walletBalance,18);
 capacity=full-burned-rewarded-budget;balance=walletBalance;$('capacity').textContent='Remaining funding capacity: '+formatUnits(capacity>0n?capacity:0n,18)+' $KABOOM';
 $('uri').textContent=minted>0n?await nft.tokenURI(1):'Unavailable until first mint';
 if(owner.toLowerCase()!==ADMIN)throw Error('This wallet is not the current NFT owner. Owner-only updates are disabled.');
 ready=true;$('access').textContent='Verified admin wallet and NFT ownership on Base.';$('connect').textContent='Admin connected';lock();
}
async function refresh(){try{await check();}catch(e){$('access').textContent=error(e);say(error(e));}}
$('connect').onclick=async()=>{try{await connectWallet();if(await walletProvider.request({method:'eth_chainId'})!=='0x2105')await walletProvider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x2105'}]});await refresh();}catch(e){say(error(e));}};
$('refresh').onclick=refresh;
walletProvider?.on('accountsChanged',()=>{invalidate();$('access').textContent='Wallet changed. Refresh to verify access.';});
walletProvider.on('chainChanged',()=>{invalidate();$('access').textContent='Network changed. Refresh to verify Base access.';});
walletProvider.on('disconnect',()=>{invalidate();$('connect').textContent='Connect wallet';$('access').textContent='Wallet disconnected. Reconnect to verify admin access.';});
function review(action,value,details){if(!ready||busy)return;pending={action,value,epoch};$('details').textContent='Network: Base mainnet (8453)\nFrom: '+ADMIN+'\nNFT contract: '+NFT+'\n'+details;$('review').hidden=false;$('review').scrollIntoView({behavior:'smooth'});}
$('priceForm').onsubmit=e=>{e.preventDefault();try{const v=$('newPrice').value.trim();if(!/^[0-9]+$/.test(v)||BigInt(v)<=0n||BigInt(v)>((2n**256n-1n)/10n**18n))throw Error('Enter a positive whole-token price.');review('price',v,'Set mint price to '+v+' $KABOOM.');}catch(e){say(error(e));}};
$('uriForm').onsubmit=e=>{e.preventDefault();const uri=$('newURI').value.trim();if(!/^(ipfs:\/\/|https:\/\/|ar:\/\/)/.test(uri)||!uri.endsWith('/'))return say('Use an ipfs://, ar:// or https:// folder URI ending with /.');review('uri',uri,'Set metadata base URI to '+uri+'\nToken #1 will resolve to '+uri+'1 (no .json suffix).');};
$('fundForm').onsubmit=e=>{e.preventDefault();try{const v=$('fundAmount').value.trim();if(!/^\d+(\.\d{1,18})?$/.test(v))throw Error('Enter a positive token amount with up to 18 decimal places.');const amount=parseUnits(v,18);if(amount<=0n||amount>capacity||amount>balance)throw Error('Amount exceeds your balance or remaining funding capacity, or is zero.');review('fund',v,'Fund vault with '+v+' $KABOOM.\nMay require two wallet transactions: exact token approval, then vault funding.');}catch(e){say(error(e));}};
$('cancel').onclick=()=>{pending=null;$('review').hidden=true;};
async function send(contract,method,args){
 const chain=await walletProvider.request({method:'eth_chainId'});const accounts=await walletProvider.request({method:'eth_accounts'});
 if(chain!=='0x2105'||accounts[0]?.toLowerCase()!==ADMIN||(await nft.owner()).toLowerCase()!==ADMIN)throw Error('Wallet, network or ownership changed. Reconnect and review again.');
 await contract[method].staticCall(...args);say('Confirm '+method+' in your wallet.');const tx=await contract[method](...args);
 const link=document.createElement('a');link.href='https://basescan.org/tx/'+tx.hash;link.target='_blank';link.rel='noopener';link.textContent=method+' · Pending · '+tx.hash;$('transactions').prepend(link);say('Transaction submitted. Waiting for confirmation…');
 try{const receipt=await tx.wait();if(receipt.status!==1)throw Error('Transaction reverted.');link.textContent=method+' · Confirmed · '+tx.hash;}catch(e){link.textContent=method+' · Confirmation needs checking · '+tx.hash;throw e;}
}
$('confirm').onclick=async()=>{if(!pending||busy||!ready)return;const task=pending;pending=null;$('review').hidden=true;busy=true;lock();$('confirm').disabled=true;
 try{if(task.epoch!==epoch)throw Error('Session changed. Review again.');await check();busy=true;lock();
 if(task.action==='price')await send(nft,'setNftMintPrice',[BigInt(task.value)]);
 if(task.action==='uri')await send(nft,'setBaseURI',[task.value]);
 if(task.action==='fund'){const amount=parseUnits(task.value,18);if(amount>capacity||amount>balance)throw Error('Funding capacity or wallet balance changed. Review again.');const allowance=await token.allowance(ADMIN,NFT);if(allowance<amount)await send(token,'approve',[NFT,amount]);await send(nft,'fundEcosystemBudget',[amount]);}
 say('Confirmed on Base.');await refresh();
 }catch(e){say(error(e));}finally{busy=false;$('confirm').disabled=false;lock();}};

$('accept').onclick=async()=>{if(busy)return;busy=true;$('accept').disabled=true;lock();try{const chain=await walletProvider.request({method:'eth_chainId'});const accounts=await walletProvider.request({method:'eth_accounts'});if(chain!=='0x2105'||accounts[0]?.toLowerCase()!==ADMIN||(await nft.pendingOwner()).toLowerCase()!==ADMIN)throw Error('This wallet is not the nominated owner on Base.');await nft.acceptOwnership.staticCall();say('Confirm ownership acceptance in your wallet.');const tx=await nft.acceptOwnership();const link=document.createElement('a');link.href='https://basescan.org/tx/'+tx.hash;link.textContent='Ownership acceptance · '+tx.hash;link.target='_blank';link.rel='noopener';$('transactions').prepend(link);const receipt=await tx.wait();if(receipt.status!==1)throw Error('Ownership acceptance failed.');say('Ownership accepted on Base.');}catch(e){say(error(e));}finally{busy=false;await refresh();lock();}};

async function loadToken(){
 $('tokenSupply').textContent=formatUnits(await token.totalSupply(),18)+' $KABOOM';
 const rows=[['opsWallet','developmentAndOperationsWallet'],['familyWallet','wifeAndIWallet'],['partnerWallet','strategicPartnershipsWallet'],['treasuryWallet','ecosystemTreasuryWallet'],['liquidityWallet','liquidityReserveWallet']];
 await Promise.all(rows.map(async([id,method])=>{try{let address;try{address=await token[method]();}catch(e){if(method!=='wifeAndIWallet')throw e;address=await token.foundersReserveWallet();}$(id).textContent=address;}catch(e){$(id).textContent='Getter unavailable in deployed token';}}));
}
