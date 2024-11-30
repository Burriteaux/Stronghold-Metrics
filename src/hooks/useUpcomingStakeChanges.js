import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useUpcomingStakeChanges = () => {
  const [upcomingChanges, setUpcomingChanges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingChanges = async () => {
      try {
        const response = await fetch(`${BASE_URL}/validator_epoch_stakes/${VOTE_PUBKEY}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw upcoming changes data:', data);
        
        // Calculate net change
        const netChange = (data.activating_stake || 0) - (data.deactivating_stake || 0);
        
        setUpcomingChanges({
          ...data,
          net_change: netChange
        });
        setError(null);

      } catch (err) {
        console.error('Upcoming changes fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingChanges();
    const interval = setInterval(fetchUpcomingChanges, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    upcomingChanges,
    loading,
    error
  };
}; 