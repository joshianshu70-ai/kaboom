import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base } from '@reown/appkit/networks';

export const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [base],
  defaultNetwork: base,
  projectId: '4fccd98dd84a730565d62668722ab201',
  metadata: {
    name: '$KABOOM · Agent X-84',
    description: 'The House of Joshi · Agent X-84 NFT drop on Base',
    url: window.location.origin,
    icons: [new URL('/assets/brand-icon-192.png', window.location.origin).href]
  },
  themeMode: 'dark',
  themeVariables: { '--w3m-accent': '#b7f56b', '--w3m-border-radius-master': '2px' },
  features: { analytics: false, email: false, socials: [], swaps: false, onramp: false }
});
