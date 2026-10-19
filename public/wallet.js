import { createWalletBridge } from './wallet-bridge.js';

const bridge = createWalletBridge();
export const walletProvider = bridge.provider;
let sdkPromise, connecting;
function sdk() {
  if (!sdkPromise) sdkPromise = import('./vendor/appkit/wallet-sdk.js?v=appkit-1').then(({ modal }) => {
    const sync = () => {
      const account = modal.getAccount('eip155') || {};
      bridge.update(account.isConnected ? modal.getWalletProvider() : null,
        account.isConnected ? account.address : null, modal.getChainId());
    };
    modal.subscribeProviders(sync);
    modal.subscribeAccount(sync, 'eip155');
    modal.subscribeNetwork(sync);
    sync();
    return modal;
  }).catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}
export async function connectWallet() {
  if (connecting) return connecting;
  const modal = await sdk();
  if (connecting) return connecting;
  if (bridge.snapshot().connected) return [bridge.snapshot().address];
  connecting = new Promise((resolve, reject) => {
    let settled = false, opened = false, closeTimer;
    let unsubscribe = () => {};
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(closeTimer);
      walletProvider.removeListener('accountsChanged', onAccount);
      unsubscribe();
      connecting = null;
      if (error) reject(error); else resolve([bridge.snapshot().address]);
    };
    const onAccount = () => { if (bridge.snapshot().connected) finish(); };
    walletProvider.on('accountsChanged', onAccount);
    unsubscribe = modal.subscribeState(state => {
      if (state.open) { opened = true; clearTimeout(closeTimer); }
      else if (opened) closeTimer = setTimeout(() => {
        if (bridge.snapshot().connected) finish();
        else finish(new Error('Wallet connection cancelled.'));
      }, 400);
    });
    modal.open({ view: 'Connect' }).catch(finish);
  });
  return connecting;
}
export async function disconnectWallet() {
  const modal = await sdk();
  await modal.disconnect('eip155');
  bridge.update(null, null, null);
}
// Restore a previously approved session without opening a modal or requesting signatures.
sdk().catch(error => console.warn('Wallet connection unavailable:', error.message));
