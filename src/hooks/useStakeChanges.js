import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useStakeChanges = () => {
  const [stakeChanges, setStakeChanges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStakeChanges = async () => {
      try {
        const response = await fetch(`${BASE_URL}/validator_epoch_stakes/${VOTE_PUBKEY}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw stake changes data:', data);

        const changes = data[0];
        
        const activatingStake = parseFloat(changes.activating_stake) * 1e9;
        const deactivatingStake = parseFloat(changes.deactivating_stake) * 1e9;
        
        setStakeChanges({
          activating_stake: activatingStake,
          activating_accounts: changes.activating_count,
          deactivating_stake: deactivatingStake,
          deactivating_accounts: changes.deactivating_count
        });
        setError(null);

      } catch (err) {
        console.error('Stake changes fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStakeChanges();
    const interval = setInterval(fetchStakeChanges, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    stakeChanges,
    loading,
    error
  };
}; 