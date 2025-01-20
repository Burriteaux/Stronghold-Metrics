import { useState, useEffect } from 'react';

export const useLeaderSlots = () => {
  const [leaderSlots, setLeaderSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderSlots = async () => {
      try {
        const response = await fetch(
          `https://api.svt.one/validators/Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc?network=mainnet&select=leaderSlotsEpoch%2CleaderSlotsDone`,
          {
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJ1cnJpdG9TdHJvbmdob2xkMjAwMTI1IiwiaWF0IjoxNzM3MzY3Mzg2LCJleHAiOjE4MjM3NjczODZ9.Xt5M9QL8reJE8-UycwWFoM2eDOmsAosfPOa4sQ0BJ-4'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.data && data.data[0]) {
          setLeaderSlots({
            completed: data.data[0].leaderSlotsDone || 0,
            total: data.data[0].leaderSlotsEpoch || 0
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