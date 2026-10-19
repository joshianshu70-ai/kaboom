import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
const code = await readFile(new URL('../public/wallet-bridge.js', import.meta.url), 'utf8');
const { createWalletBridge } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const alice = '0x' + '1'.repeat(40), bob = '0x' + '2'.repeat(40);
function mockProvider() {
  const p = new EventEmitter();
  p.calls = [];
  p.request = async args => { p.calls.push(args); return args.method === 'eth_accounts' ? [alice] : '0x2105'; };
  return p;
}
test('rejects signing and transactions before a wallet is selected', async () => {
  const b = createWalletBridge();
  assert.deepEqual(await b.provider.request({ method: 'eth_accounts' }), []);
  await assert.rejects(b.provider.request({ method: 'eth_sendTransaction' }), /Connect a wallet/);
});
test('uses the selected WalletConnect provider rather than any injected wallet', async () => {
  const b = createWalletBridge(), selected = mockProvider();
  globalThis.window = { ethereum: { request() { throw Error('Wrong injected provider'); } } };
  b.update(selected, alice, 8453);
  await b.provider.request({ method: 'eth_sendTransaction', params: [{ from: alice }] });
  assert.equal(selected.calls[0].method, 'eth_sendTransaction');
  assert.equal(b.snapshot().chain, '0x2105');
  delete globalThis.window;
});
test('account, chain and connector replacement invalidate existing reviews', () => {
  const b = createWalletBridge(), a = mockProvider(), c = mockProvider(), events = [];
  b.provider.on('accountsChanged', value => events.push(value));
  b.update(a, alice, 8453);
  a.emit('accountsChanged', [bob]);
  assert.equal(b.snapshot().address, bob);
  a.emit('chainChanged', '0x1');
  assert.equal(b.snapshot().chain, '0x1');
  b.update(c, bob, 8453);
  assert.equal(events.length, 3);
  a.emit('accountsChanged', [alice]);
  assert.equal(b.snapshot().address, bob);
  assert.equal(a.listenerCount('accountsChanged'), 0);
});
test('disconnect removes the session and blocks subsequent writes', async () => {
  const b = createWalletBridge(), p = mockProvider(); let disconnected = 0;
  b.provider.on('disconnect', () => disconnected++);
  b.update(p, alice, 8453);
  p.emit('disconnect');
  assert.equal(disconnected, 1);
  assert.equal(b.snapshot().connected, false);
  await assert.rejects(b.provider.request({ method: 'eth_sendTransaction' }), /Connect a wallet/);
  assert.equal(p.calls.length, 0);
});
test('AppKit controller connects, cancels, disconnects and restores a session', async () => {
  const accountCallbacks = new Set(), providerCallbacks = new Set(), stateCallbacks = new Set();
  let address, selected, open = false, openCalls = 0;
  const subscribe = set => fn => { set.add(fn); return () => set.delete(fn); };
  const modal = {
    getAccount: () => address ? { address, isConnected: true } : undefined,
    getWalletProvider: () => selected, getChainId: () => 8453,
    subscribeProviders: subscribe(providerCallbacks), subscribeAccount: subscribe(accountCallbacks),
    subscribeNetwork: () => () => {}, subscribeState: subscribe(stateCallbacks),
    async open() { openCalls++; open = true; stateCallbacks.forEach(fn => fn({ open })); },
    async disconnect() { address = undefined; selected = undefined; accountCallbacks.forEach(fn => fn()); }
  };
  globalThis.__walletTestModal = modal;
  const bridgeUrl = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  let controller = await readFile(new URL('../public/wallet.js', import.meta.url), 'utf8');
  controller = controller.replace("'./wallet-bridge.js'", JSON.stringify(bridgeUrl))
    .replace("import('./vendor/appkit/wallet-sdk.js?v=appkit-1')", 'Promise.resolve({modal:globalThis.__walletTestModal})');
  const load = suffix => import('data:text/javascript;base64,' + Buffer.from(controller + '\n//' + suffix).toString('base64'));
  const wallet = await load('first');
  await new Promise(resolve => setImmediate(resolve));
  const pending = wallet.connectWallet();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(openCalls, 1);
  address = alice; selected = mockProvider();
  providerCallbacks.forEach(fn => fn());
  assert.deepEqual(await pending, [alice]);
  await wallet.disconnectWallet();
  assert.deepEqual(await wallet.walletProvider.request({ method: 'eth_accounts' }), []);
  const cancelled = wallet.connectWallet();
  await new Promise(resolve => setImmediate(resolve));
  open = false; stateCallbacks.forEach(fn => fn({ open }));
  await assert.rejects(cancelled, /cancelled/);
  address = alice; selected = mockProvider();
  const restored = await load('restored');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(await restored.connectWallet(), [alice]);
  assert.equal(openCalls, 2, 'restoration must not reopen the modal');
  assert.equal(selected.calls.length, 0, 'connection must not request a signature or transaction');
  delete globalThis.__walletTestModal;
});

test('provider getter matches the installed AppKit SDK, including restored sessions', async () => {
  const {AppKit}=await import('@reown/appkit');
  assert.equal(typeof AppKit.prototype.getWalletProvider,'function');
  const controller=await readFile(new URL('../public/wallet.js',import.meta.url),'utf8');
  assert.ok(!controller.includes('.getProviders('),'Do not use a getter absent from the pinned SDK');
});
