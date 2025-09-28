'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { blockdagPrimordial } from '../chains';

// Use a fallback projectId for development/demo purposes
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id-for-hackathon';

const metadata = {
  name: 'CryptoPredictor Dashboard',
  description: 'AI-Powered Cryptocurrency Price Predictions',
  url: 'https://cryptopredictor.demo', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [blockdagPrimordial] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// Only create Web3Modal if we have a valid projectId
if (projectId && projectId !== 'demo-project-id-for-hackathon') {
  createWeb3Modal({ wagmiConfig: config, projectId });
}

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
} 