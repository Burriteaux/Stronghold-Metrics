import React from 'react';
import { useStakewizData } from '../hooks/useStakewizData';
import { useValidatorStatus } from '../hooks/useValidatorStatus';

const StakewizMetrics = () => {
  const { validatorInfo, loading: stakewizLoading, error: stakewizError } = useStakewizData();
  const { statusInfo, loading: statusLoading, error: statusError } = useValidatorStatus();

  if (stakewizLoading || statusLoading) {
    return (
      <div className="dashboard-panel status-panel">
        <h2>Status</h2>
        <div className="status-grid">
          <div className="status-item">Loading data...</div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage for next leader slot
  const progressPercentage = statusInfo?.leaderProgress || 0;
  const isImminent = progressPercentage > 90;

  return (
    <div className="dashboard-panel status-panel">
      <h2>Status</h2>
      <div className="status-grid">
        <div className="status-item">
          <label>Status</label>
          <value className={validatorInfo?.delinquent ? 'error' : 'success'}>
            Active
          </value>
        </div>
        <div className="status-item">
          <label>Stake</label>
          <value style={{ color: '#D1FB0E' }}>
            {(validatorInfo?.activated_stake || 0).toLocaleString()} SOL
          </value>
        </div>
        <div className="status-item">
          <label>Last Vote</label>
          <value>
            Slot {validatorInfo?.last_vote?.toLocaleString() || statusInfo?.slot || 'N/A'}
          </value>
        </div>
        <div className="status-item with-progress">
          <label>Next Leader</label>
          <value>
            {statusInfo?.next_leader_slot !== 'N/A' 
              ? `Slot ${statusInfo?.next_leader_slot} (${statusInfo?.time_until_leader})`
              : 'N/A'
            }
          </value>
          {statusInfo?.next_leader_slot !== 'N/A' && (
            <div className="leader-slot-progress">
              <div 
                className={`leader-slot-progress-fill${isImminent ? ' imminent' : ''}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakewizMetrics; 