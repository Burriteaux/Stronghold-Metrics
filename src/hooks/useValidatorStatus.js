import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const VOTE_PUBKEY = 'Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc';
const IDENTITY_PUBKEY = '91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt';
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=f0751d28-271a-4b42-a667-3333a6c49d7c');

export const useValidatorStatus = () => {
  const [statusInfo, setStatusInfo] = useState({
    slot: 'N/A',
    next_leader_slot: 'N/A',
    time_until_leader: 'N/A',
    vote_status: 'unknown',
    leaderProgress: 0
  });
  const [nextLeaderData, setNextLeaderData] = useState(null);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for fetching data every 10 seconds
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const slot = await connection.getSlot('confirmed');
        
        const voteAccounts = await connection.getVoteAccounts();
        const validator = voteAccounts.current.find(
          account => account.votePubkey === VOTE_PUBKEY
        ) || voteAccounts.delinquent.find(
          account => account.votePubkey === VOTE_PUBKEY
        );

        const currentEpoch = await connection.getEpochInfo();
        const leaderSchedulePromises = [
          connection.getLeaderSchedule(currentEpoch.epoch),
          connection.getLeaderSchedule(currentEpoch.epoch + 1)
        ];

        const leaderSchedules = await Promise.all(leaderSchedulePromises);
        
        let allLeaderSlots = [];
        leaderSchedules.forEach((schedule, index) => {
          if (schedule && schedule[IDENTITY_PUBKEY]) {
            const epochBaseSlot = (currentEpoch.epoch + index) * currentEpoch.slotsInEpoch;
            const slots = schedule[IDENTITY_PUBKEY].map(s => s + epochBaseSlot);
            allLeaderSlots = [...allLeaderSlots, ...slots];
          }
        });

        let nextSlot = null;
        let previousSlot = null;
        if (allLeaderSlots.length > 0) {
          nextSlot = allLeaderSlots.find(s => s > slot);
          previousSlot = [...allLeaderSlots].reverse().find(s => s <= slot);
        }

        // Calculate progress percentage
        let progress = 0;
        if (nextSlot && previousSlot) {
          const totalDistance = nextSlot - previousSlot;
          const currentDistance = slot - previousSlot;
          progress = Math.min(100, Math.max(0, (currentDistance / totalDistance) * 100));
        }

        // Store next leader slot data for countdown updates
        if (nextSlot) {
          setNextLeaderData({
            currentSlot: slot,
            nextLeaderSlot: nextSlot,
            previousLeaderSlot: previousSlot,
            fetchTime: Date.now()
          });
        } else {
          setNextLeaderData(null);
        }

        setStatusInfo({
          slot: slot.toLocaleString(),
          next_leader_slot: nextSlot ? nextSlot.toLocaleString() : 'N/A',
          time_until_leader: nextSlot ? calculateTimeUntil(slot, nextSlot) : 'N/A',
          vote_status: validator ? (voteAccounts.delinquent.includes(validator) ? 'delinquent' : 'active') : 'unknown',
          leaderProgress: progress
        });

        setCurrentSlot(slot);
        setError(null);

      } catch (err) {
        console.error('Status fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
    const fetchInterval = setInterval(fetchStatusData, 10000);

    return () => clearInterval(fetchInterval);
  }, []);

  // Effect for updating countdown and progress every second
  useEffect(() => {
    const updateCountdown = () => {
      if (nextLeaderData) {
        const { currentSlot, nextLeaderSlot, previousLeaderSlot, fetchTime } = nextLeaderData;
        const elapsedSeconds = (Date.now() - fetchTime) / 1000;
        const newCurrentSlot = currentSlot + (elapsedSeconds / 0.4); // 0.4s per slot
        
        // Calculate new progress
        const totalDistance = nextLeaderSlot - previousLeaderSlot;
        const currentDistance = newCurrentSlot - previousLeaderSlot;
        const progress = Math.min(100, Math.max(0, (currentDistance / totalDistance) * 100));
        
        setStatusInfo(prev => ({
          ...prev,
          time_until_leader: calculateTimeUntil(newCurrentSlot, nextLeaderSlot),
          leaderProgress: progress
        }));
      }
    };

    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [nextLeaderData]);

  const calculateTimeUntil = (currentSlot, targetSlot) => {
    const timeUntilSeconds = (targetSlot - currentSlot) * 0.4;
    const minutes = Math.floor(timeUntilSeconds / 60);
    const seconds = Math.floor(timeUntilSeconds % 60);
    return `${minutes}mins:${seconds.toString().padStart(2, '0')}sec`;
  };

  return {
    statusInfo,
    currentSlot,
    loading,
    error
  };
}; 