import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useVoteSuccess = () => {
  const [voteSuccessData, setVoteSuccessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoteSuccess = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/validator_vote_success/${VOTE_PUBKEY}?sort=-created_at`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process the data - convert to percentages
        const processedData = data.map(item => ({
          success_rate: parseFloat(item.vote_success) * 100,
          timestamp: new Date(item.created_at).getTime(),
          created_at: item.created_at
        }));

        setVoteSuccessData(processedData);
        setError(null);
      } catch (err) {
        console.error('Vote success fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVoteSuccess();
    const interval = setInterval(fetchVoteSuccess, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    voteSuccessData,
    loading,
    error
  };
}; 