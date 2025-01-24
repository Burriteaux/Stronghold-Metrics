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

  // Separate fetch function for last vote only
  const fetchLastVote = async () => {
    try {
      const response = await fetch(`${BASE_URL}/validator/${VOTE_PUBKEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Only update the lastVote field
      setValidatorInfo(prev => ({
        ...prev,
        lastVote: data.last_vote
      }));
    } catch (err) {
      console.error('Last vote fetch error:', err);
    }
  };

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
      setLoading(false);
    }
  };

  // Effect for frequent last vote updates
  useEffect(() => {
    fetchLastVote(); // Initial fetch
    const lastVoteInterval = setInterval(fetchLastVote, 3000); // Update every 3 seconds
    return () => clearInterval(lastVoteInterval);
  }, []);

  // Effect for less frequent full data updates
  useEffect(() => {
    fetchAllData(); // Initial fetch
    const fullDataInterval = setInterval(fetchAllData, 300000); // Update every 5 minutes
    return () => clearInterval(fullDataInterval);
  }, []);

  return {
    validatorInfo,
    loading,
    error
  };
}; 