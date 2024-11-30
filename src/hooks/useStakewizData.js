import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useStakewizData = () => {
  const [validatorInfo, setValidatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all validator data
  useEffect(() => {
    const fetchStakewizData = async () => {
      try {
        // Fetch both validator info and vote success data
        const [validatorResponse, voteSuccessResponse] = await Promise.all([
          fetch(`${BASE_URL}/validator/${VOTE_PUBKEY}`),
          fetch(`${BASE_URL}/validator_vote_success/${VOTE_PUBKEY}?sort=-created_at&limit=1`)
        ]);
        
        if (!validatorResponse.ok || !voteSuccessResponse.ok) {
          throw new Error(`HTTP error! status: ${validatorResponse.status}`);
        }

        const validatorData = await validatorResponse.json();
        const voteSuccessData = await voteSuccessResponse.json();
        
        // Get latest vote success rate
        const voteSuccessRate = voteSuccessData[0]?.vote_success || 1;

        const validatedData = {
          skip_rate: validatorData.skip_rate || 0,
          activated_stake: validatorData.activated_stake || 0,
          commission: validatorData.commission || 3,
          delinquent: validatorData.delinquent || false,
          version: validatorData.version || '2.0.16',
          uptime: validatorData.uptime || 100,
          vote_success_rate: parseFloat(voteSuccessRate) * 100 // Convert to percentage
        };

        setValidatorInfo(validatedData);
        setError(null);

      } catch (err) {
        console.error('Stakewiz fetch error:', err);
        setError(err.message || 'Error fetching Stakewiz data');
      } finally {
        setLoading(false);
      }
    };

    fetchStakewizData();
    const fullDataInterval = setInterval(fetchStakewizData, 120000);
    return () => clearInterval(fullDataInterval);
  }, []);

  return {
    validatorInfo,
    loading,
    error
  };
}; 