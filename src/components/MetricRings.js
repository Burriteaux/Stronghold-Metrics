import React from 'react';
import { useStakewizData } from '../hooks/useStakewizData';

const MetricRing = ({ value, label, color = '#D1FB0E' }) => {
  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="metric-ring-container">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="metric-ring"
      >
        <circle
          stroke="#1E2022"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="metric-ring-label">
        <span className="metric-value">{value}%</span>
        <span className="metric-name">{label}</span>
      </div>
    </div>
  );
};

const MetricRings = () => {
  const { validatorInfo, loading, error } = useStakewizData();

  if (loading || error) return null;

  const uptime = validatorInfo?.uptime || 100;
  const voteRate = 100 - (validatorInfo?.skip_rate || 0);
  const skipRate = validatorInfo?.skip_rate || 0;

  return (
    <div className="dashboard-panel metric-rings-panel">
      <h2>Performance Metrics</h2>
      <div className="metric-rings-grid">
        <MetricRing 
          value={uptime} 
          label="Uptime"
          color="#D1FB0E"
        />
        <MetricRing 
          value={voteRate} 
          label="Vote Rate"
          color="#D1FB0E"
        />
        <MetricRing 
          value={100 - skipRate} 
          label="Skip Rate"
          color={skipRate > 5 ? '#ff6b6b' : '#D1FB0E'}
        />
      </div>
    </div>
  );
};

export default MetricRings; 