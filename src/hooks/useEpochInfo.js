import { useState, useEffect } from 'react';

const BASE_URL = 'https://api.stakewiz.com';

export const useEpochInfo = () => {
  const [epochInfo, setEpochInfo] = useState({
    progress: 0,
    timeRemaining: 'N/A',
    currentEpoch: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEpochInfo = async () => {
      try {
        const response = await fetch(`${BASE_URL}/epoch_info`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw epoch info:', data);

        // Calculate progress percentage
        const progress = (data.seconds_elapsed / data.epoch_duration) * 100;
        
        // Format time remaining
        const hours = Math.floor(data.seconds_remaining / 3600);
        const minutes = Math.floor((data.seconds_remaining % 3600) / 60);
        const seconds = Math.floor(data.seconds_remaining % 60);
        const timeRemaining = `${hours}h ${minutes}m ${seconds}s`;

        setEpochInfo({
          progress: progress.toFixed(2),
          timeRemaining,
          currentEpoch: data.epoch
        });
        setError(null);

      } catch (err) {
        console.error('Epoch info fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEpochInfo();
    const interval = setInterval(fetchEpochInfo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    epochInfo,
    loading,
    error
  };
}; 