import React, { createContext, useContext } from 'react';
import { Connection } from '@solana/web3.js';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=f0751d28-271a-4b42-a667-3333a6c49d7c');

  return (
    <ConnectionContext.Provider value={connection}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
} 