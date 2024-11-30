import React from 'react';
import { useValidatorStatus } from '../hooks/useValidatorStatus';

const ValidatorStatus = () => {
  const { statusInfo, loading, error } = useValidatorStatus();

  if (loading) return <div>Loading status...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard-panel status-panel">
      <h2>Status</h2>
      <div className="status-grid">
        <div className="status-item">
          <label>Slot</label>
          <value>{statusInfo?.slot}</value>
        </div>
        <div className="status-item">
          <label>Time until leader</label>
          <value>{statusInfo?.time_until_leader}</value>
        </div>
        <div className="status-item">
          <label>Vote Status</label>
          <value className={statusInfo?.vote_status === 'delinquent' ? 'error' : 'success'}>
            {statusInfo?.vote_status}
          </value>
        </div>
        <div className="status-item">
          <label>Next leader slot</label>
          <value>{statusInfo?.next_leader_slot}</value>
        </div>
      </div>
    </div>
  );
};

export default ValidatorStatus; 