import React, { createContext, useContext } from 'react';
import { Connection } from '@solana/web3.js';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const connection = new Connection(process.env.REACT_APP_HELIUS_RPC_URL);

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