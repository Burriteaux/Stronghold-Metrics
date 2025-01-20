import React, { createContext, useContext } from 'react';
import { PublicKey } from '@solana/web3.js';

const ValidatorIdentityContext = createContext();

export function ValidatorIdentityProvider({ children }) {
  const validatorIdentityKey = new PublicKey('91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt');

  return (
    <ValidatorIdentityContext.Provider value={{ validatorIdentityKey }}>
      {children}
    </ValidatorIdentityContext.Provider>
  );
}

export function useValidatorIdentity() {
  const context = useContext(ValidatorIdentityContext);
  if (context === undefined) {
    throw new Error('useValidatorIdentity must be used within a ValidatorIdentityProvider');
  }
  return context;
} 