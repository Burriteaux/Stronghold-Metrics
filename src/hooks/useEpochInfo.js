import { useState, useEffect } from 'react';

const BASE_URL = 'https://api.stakewiz.com';

export const useEpochInfo = () => {
  const [epochInfo, setEpochInfo] = useState({
    currentEpoch: null,
    progress: 0,
    timeRemaining: 'N/A',
    startSlot: null,
    slotHeight: null,
    elapsedSeconds: 0,
    remainingSeconds: 0
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
        
        // Ensure progress is calculated as a number
        const progress = parseFloat(
          ((data.elapsed_seconds / data.duration_seconds) * 100).toFixed(2)
        );
        
        // Format time remaining
        const hours = Math.floor(data.remaining_seconds / 3600);
        const minutes = Math.floor((data.remaining_seconds % 3600) / 60);
        const timeRemaining = `${hours}h ${minutes}m`;

        setEpochInfo({
          currentEpoch: data.epoch,
          progress: progress,
          timeRemaining,
          startSlot: data.start_slot,
          slotHeight: data.slot_height,
          elapsedSeconds: data.elapsed_seconds,
          remainingSeconds: data.remaining_seconds
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
    const interval = setInterval(fetchEpochInfo, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    epochInfo,
    loading,
    error
  };
}; 