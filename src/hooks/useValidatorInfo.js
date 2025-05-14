import { useState, useEffect } from 'react';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const BASE_URL = 'https://api.stakewiz.com';

export const useValidatorInfo = () => {
  const [validatorInfo, setValidatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValidatorInfo = async () => {
      try {
        const response = await fetch(`${BASE_URL}/validator/${VOTE_PUBKEY}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw validator data:', data);

        // Convert APY to percentage if needed
        let baseApy = data.apy_estimate || 7.5;
        if (baseApy < 1) baseApy *= 100;

        // Check different possible MEV APY keys in the response
        const mevApy = data.jito_apy || data.mev_apy || data.mev_estimate || 0;
        console.log('MEV APY:', mevApy);

        setValidatorInfo({
          identity: data.identity || '91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt',
          name: data.name || 'Stronghold 3% +MEV',
          version: data.version || '2.0.16',
          commission: data.commission ?? 3,
          apy_estimate: baseApy,
          mev_apy: mevApy
        });
        setError(null);

      } catch (err) {
        console.error('Validator info fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchValidatorInfo();
    const interval = setInterval(fetchValidatorInfo, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    validatorInfo,
    loading,
    error
  };
}; 