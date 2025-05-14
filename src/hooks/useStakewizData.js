import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useStakewizData = () => {
  const [validatorInfo, setValidatorInfo] = useState({
    lastVote: null,
    version: null,
    commission: null,
    uptime: 0,
    skip_rate: 0,
    vote_success_rate: 100,
    delinquent: false,
    activated_stake: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main data fetch function
  const fetchAllData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/validator/${VOTE_PUBKEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw validator data:', data);

      setValidatorInfo({
        lastVote: data.last_vote,
        version: data.version || '2.0.16',
        commission: data.commission || 3,
        uptime: data.uptime || 100,
        skip_rate: data.skip_rate || 0,
        vote_success_rate: data.vote_success || 100,
        delinquent: data.delinquent || false,
        activated_stake: data.activated_stake || 0
      });
      setError(null);

    } catch (err) {
      console.error('Stakewiz fetch error:', err);
      setError(err.message);
    } finally {
      // Set loading to false only after the first successful fetch of all data.
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Effect for less frequent full data updates
  useEffect(() => {
    fetchAllData(); // Initial fetch
    const fullDataInterval = setInterval(fetchAllData, 300000); // Update every 5 minutes
    return () => clearInterval(fullDataInterval);
  }, []); // Removed fetchAllData from dependency array as it's stable

  return {
    validatorInfo,
    loading,
    error
  };
}; 