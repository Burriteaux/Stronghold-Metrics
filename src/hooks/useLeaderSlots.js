import { useState, useEffect, useRef, useCallback } from 'react';

export const useLeaderSlots = () => {
  const [leaderSlots, setLeaderSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderSlots = useCallback(async () => {
    // console.log('Fetching leader slots...');
    if (!leaderSlots) {
        setLoading(true);
    }
    try {
      const response = await fetch(
        `https://api.svt.one/validators/Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc?network=mainnet&select=leaderSlotsEpoch%2CleaderSlotsDone`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SVT_ONE_BEARER_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.data && data.data[0]) {
        const newCompletedSlots = data.data[0].leaderSlotsDone || 0;
        const newTotalSlots = data.data[0].leaderSlotsEpoch || 0;

        setLeaderSlots({
          completed: newCompletedSlots,
          total: newTotalSlots
        });
      } else {
        throw new Error('Invalid API response format');
      }
      if (loading) {
        setLoading(false); 
      }
    } catch (err) {
      console.error('Error fetching leader slots:', err);
      setError(err.message);
    }
  }, [leaderSlots, loading]);

  useEffect(() => {
    fetchLeaderSlots();
    const intervalId = setInterval(fetchLeaderSlots, 30000);

    return () => clearInterval(intervalId);
  }, [fetchLeaderSlots]);

  return { leaderSlots, loading, error };
}; 