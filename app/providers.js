// app/providers.jsx
"use client";

import React, { useState } from 'react';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, zora, sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Setup the wagmi config using RainbowKit's getDefaultConfig
const config = getDefaultConfig({
  appName: 'CineVault Movie Rental',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, // Your WalletConnect Project ID
  chains: [mainnet, polygon, optimism, arbitrum, base, zora, sepolia],
  ssr: true, // Enable SSR for Next.js App Router
});

export function Providers({ children }) {
  // Use state to ensure QueryClient is only created once on the client
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}