// One selected EIP-1193 provider for injected wallets and WalletConnect alike.
// Never replace window.ethereum: AppKit uses it to discover installed wallets.
export function createWalletBridge() {
  let selected = null, address = null, chain = null, detach = () => {};
  const listeners = new Map();
  const emit = (name, value) => {
    for (const fn of listeners.get(name) || []) fn(value);
  };
  const hex = id => id == null ? null : '0x' + BigInt(id).toString(16);
  function update(next, nextAddress, nextChain) {
    nextAddress = nextAddress || null;
    nextChain = hex(nextChain);
    const changed = selected !== next;
    const hadAddress = address;
    if (changed) {
      detach();
      selected = next || null;
      if (selected) {
        const current = selected;
        const accounts = values => { if (selected === current) update(current, values[0], chain); };
        const network = value => { if (selected === current) update(current, address, value); };
        const disconnected = () => { if (selected === current) update(null, null, null); };
        current.on?.('accountsChanged', accounts);
        current.on?.('chainChanged', network);
        current.on?.('disconnect', disconnected);
        detach = () => {
          current.removeListener?.('accountsChanged', accounts);
          current.removeListener?.('chainChanged', network);
          current.removeListener?.('disconnect', disconnected);
        };
      } else detach = () => {};
    }
    const accountChanged = address?.toLowerCase() !== nextAddress?.toLowerCase();
    const chainChanged = chain !== nextChain;
    address = nextAddress;
    chain = nextChain;
    // Replacing the connector must invalidate reviewed transactions, even for the same address.
    if (changed || accountChanged) emit('accountsChanged', address ? [address] : []);
    if (chainChanged) emit('chainChanged', chain);
    if (hadAddress && !address) emit('disconnect', { code: 4900, message: 'Wallet disconnected' });
  }
  const provider = {
    async request(args) {
      if (!selected || !address) {
        if (args.method === 'eth_accounts') return [];
        throw new Error('Connect a wallet with Reown AppKit first.');
      }
      return selected.request(args);
    },
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return provider;
    },
    removeListener(name, fn) { listeners.get(name)?.delete(fn); return provider; }
  };
  return { provider, update, snapshot: () => ({ address, chain, connected: !!(address && selected) }) };
}
