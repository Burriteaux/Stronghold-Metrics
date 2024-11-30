import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useStakeHistory = () => {
  const [stakeHistory, setStakeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStakeHistory = async () => {
      try {
        const url = `${BASE_URL}/validator_total_stakes/${VOTE_PUBKEY}?sort=-epoch&limit=30`;
        console.log('Fetching stake history from:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw stake history data:', data);

        // Data should already be in the correct format with epoch and stake
        setStakeHistory(data);
        setError(null);

      } catch (err) {
        console.error('Stake history fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStakeHistory();
    const interval = setInterval(fetchStakeHistory, 300000);
    return () => clearInterval(interval);
  }, []);

  return {
    stakeHistory,
    loading,
    error
  };
}; 