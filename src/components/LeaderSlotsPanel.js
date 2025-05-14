import React from 'react';
// import { Line } from 'react-chartjs-2'; // Removed
// import { useLeaderHistory } from '../hooks/useLeaderHistory'; // Removed
import useLeaderSlots from '../hooks/useLeaderSlots';

const LeaderSlotsPanel = () => {
  // const { data, loading, error, currentEpoch } = useLeaderHistory(); // Removed
  const { leaderSlots, loading, error } = useLeaderSlots(); // Added loading and error for consistency

  if (loading) return null; // Or a loading indicator
  if (error) return null; // Or an error message

  // Calculate progress percentage
  const progressPercentage =
    leaderSlots && leaderSlots.total > 0
      ? (leaderSlots.completed / leaderSlots.total) * 100
      : 0;

  // Removed chart data and options logic

  return (
    <div className="dashboard-panel status-panel leader-slots-panel">
      <h2>LEADER SLOTS</h2>
      <div className="status-grid">
        <div className="status-value" style={{ paddingLeft: '0px' }}>
          {`${leaderSlots?.completed || 0}/${leaderSlots?.total || 0}`}
        </div>
        <div className="chart-wrapper" style={{ flexGrow: 1, width: 'auto' }}>
          <div className="leader-slot-progress">
            <div
              className="leader-slot-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderSlotsPanel; 