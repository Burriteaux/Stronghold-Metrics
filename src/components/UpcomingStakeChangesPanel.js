import React from 'react';
import { useStakeChanges } from '../hooks/useStakeChanges';

const UpcomingStakeChangesPanel = () => {
  const { stakeChanges, loading, error } = useStakeChanges();

  if (loading) return null;
  if (error) return null;

  const formatSOL = (lamports) => {
    if (!lamports) return '0';
    return Math.round(lamports / 1e9).toLocaleString();
  };

  const netChange = (stakeChanges?.activating_stake || 0) - (stakeChanges?.deactivating_stake || 0);

  return (
    <div className="dashboard-panel upcoming-changes-panel">
      <h2>Upcoming Stake Changes</h2>
      <div className="status-grid">
        <div className="status-item">
          <label>Activating</label>
          <value className="success">
            {formatSOL(stakeChanges?.activating_stake)} SOL
          </value>
        </div>
        <div className="status-item">
          <label>Deactivating</label>
          <value className="deactivating">
            {formatSOL(stakeChanges?.deactivating_stake)} SOL
          </value>
        </div>
        <div className="status-item net-change">
          <label>Expected Net Change</label>
          <value>
            {netChange > 0 ? '+' : ''}
            {formatSOL(netChange)} SOL
          </value>
        </div>
      </div>
    </div>
  );
};

export default UpcomingStakeChangesPanel; 