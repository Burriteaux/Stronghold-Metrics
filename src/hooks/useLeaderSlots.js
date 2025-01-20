import { useState, useEffect } from 'react';

export const useLeaderSlots = () => {
  const [leaderSlots, setLeaderSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderSlots = async () => {
      if (!process.env.REACT_APP_SVT_API_URL) {
        setError('SVT API URL is not configured');
        setLoading(false);
        return;
      }

      if (!process.env.REACT_APP_SVT_API_TOKEN) {
        setError('SVT API Token is not configured');
        setLoading(false);
        return;
      }

      try {
        const url = `${process.env.REACT_APP_SVT_API_URL}/validators/${process.env.REACT_APP_VALIDATOR_VOTE}?network=mainnet&select=leaderSlotsEpoch%2CleaderSlotsDone`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SVT_API_TOKEN}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.data && data.data[0]) {
          const completed = data.data[0].leaderSlotsDone || 0;
          const total = data.data[0].leaderSlotsEpoch || 0;
          
          setLeaderSlots({
            completed,
            total
          });
        } else {
          throw new Error('Invalid API response format');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leader slots:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLeaderSlots();
    const interval = setInterval(fetchLeaderSlots, 60000);
    return () => clearInterval(interval);
  }, []);

  return { leaderSlots, loading, error };
}; 