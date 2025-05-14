import React from 'react';
import { useValidatorInfo } from '../hooks/useValidatorInfo';
import { useStakewizData } from '../hooks/useStakewizData';
import { useVoteSuccess } from '../hooks/useVoteSuccess';
import MetricRing from './MetricRing';

const ValidatorInfo = () => {
  const { validatorInfo, loading: infoLoading, error: infoError } = useValidatorInfo();
  const { validatorInfo: stakewizInfo, loading: stakewizLoading, error: stakewizError } = useStakewizData();

  if (infoLoading || stakewizLoading) return null;
  if (infoError || stakewizError) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(validatorInfo?.identity);
      const button = document.querySelector('.copy-button');
      button.textContent = '✓';
      setTimeout(() => button.textContent = '📋', 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const uptime = stakewizInfo?.uptime?.toFixed(1) || 0;
  const voteRate = stakewizInfo?.vote_success_rate?.toFixed(1) || 100;
  const skipRate = stakewizInfo?.skip_rate?.toFixed(1) || 0;

  const formatAPY = () => {
    const baseApy = validatorInfo?.apy_estimate || 7.5;
    const mevApy = validatorInfo?.mev_apy || 0;
    const totalApy = baseApy + mevApy;
    return `${totalApy.toFixed(1)}%`;
  };

  return (
    <div className="dashboard-panel status-panel validator-info-header">
      <div className="validator-info-content">
        <div className="status-grid">
          <div className="status-item">
            <label>Status</label>
            <value className={stakewizInfo?.delinquent ? 'error' : 'success'}>
              <span 
                className={`status-indicator-circle ${stakewizInfo?.delinquent ? 'status-delinquent' : 'status-active'}`}
              ></span>
              {stakewizInfo?.delinquent ? 'Delinquent' : 'Active'}
            </value>
          </div>
          <div className="status-item">
            <label>Name</label>
            <value>{validatorInfo?.name}</value>
          </div>
          <div className="status-item">
            <label>Identity</label>
            <div className="pubkey-container">
              <value className="pubkey">
                {validatorInfo?.identity?.slice(0, 12)}...
              </value>
              <button 
                className="copy-button"
                onClick={handleCopy}
                title="Copy full identity"
              >
                📋
              </button>
            </div>
          </div>
          <div className="status-item">
            <label>Version</label>
            <value>{validatorInfo?.version}</value>
          </div>
          <div className="status-item">
            <label>Commission</label>
            <value>{validatorInfo?.commission}%</value>
          </div>
          <div className="status-item">
            <label>APY</label>
            <value className="apy-value">
              {formatAPY()}
            </value>
          </div>
        </div>
        <div className="metric-rings-container">
          <MetricRing value={uptime} label="UPTIME" />
          <MetricRing value={voteRate} label="VOTE RATE" />
          <MetricRing value={skipRate} label="SKIP RATE" />
        </div>
      </div>
    </div>
  );
};

export default ValidatorInfo; 