import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=f0751d28-271a-4b42-a667-3333a6c49d7c');

const useVoteAccountBalance = (voteAccountPubkey) => {
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!voteAccountPubkey) return;

      try {
        const pubkey = new PublicKey(voteAccountPubkey);
        const balance = await connection.getBalance(pubkey);
        const solBalance = balance / 1e9;
        
        setCurrentBalance(solBalance);
        
        // Add new balance point to history
        setBalanceHistory(prev => {
          const now = Date.now();
          const newPoint = { timestamp: now, balance: solBalance };
          
          // Keep last 24 hours of data points (144 points at 10 minute intervals)
          const cutoff = now - (24 * 60 * 60 * 1000);
          const filteredHistory = prev.filter(point => point.timestamp > cutoff);
          
          return [...filteredHistory, newPoint].sort((a, b) => a.timestamp - b.timestamp);
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching vote account balance:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchBalance();
    // Poll every 10 minutes
    const interval = setInterval(fetchBalance, 600000);

    return () => clearInterval(interval);
  }, [voteAccountPubkey]);

  return { balanceHistory, currentBalance, loading, error };
};

export default useVoteAccountBalance; 