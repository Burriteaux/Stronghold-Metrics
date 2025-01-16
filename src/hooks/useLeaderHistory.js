import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';

const IDENTITY_PUBKEY = '91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt';
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=f0751d28-271a-4b42-a667-3333a6c49d7c');

export const useLeaderHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(null);

  useEffect(() => {
    const fetchLeaderHistory = async () => {
      try {
        const epochInfo = await connection.getEpochInfo();
        setCurrentEpoch(epochInfo.epoch);

        // Fetch leader schedules for current and next epoch
        const leaderSchedulePromises = [
          connection.getLeaderSchedule(epochInfo.epoch),
          connection.getLeaderSchedule(epochInfo.epoch - 1),
          connection.getLeaderSchedule(epochInfo.epoch - 2)
        ];

        const leaderSchedules = await Promise.all(leaderSchedulePromises);
        
        // Process each epoch's data
        const processedData = leaderSchedules.map((schedule, index) => {
          if (!schedule || !schedule[IDENTITY_PUBKEY]) {
            return {
              epoch: epochInfo.epoch - index,
              leaderSlots: [],
              totalSlots: 0
            };
          }

          const epochBaseSlot = (epochInfo.epoch - index) * epochInfo.slotsInEpoch;
          const slots = schedule[IDENTITY_PUBKEY].map(s => s + epochBaseSlot);

          return {
            epoch: epochInfo.epoch - index,
            leaderSlots: slots,
            totalSlots: slots.length
          };
        });

        setData(processedData);
        setError(null);

      } catch (err) {
        console.error('Leader history fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderHistory();
    const interval = setInterval(fetchLeaderHistory, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    error,
    currentEpoch
  };
}; 