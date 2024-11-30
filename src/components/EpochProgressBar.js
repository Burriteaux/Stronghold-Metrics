import React from 'react';
import { useEpochInfo } from '../hooks/useEpochInfo';

const EpochProgressBar = () => {
  const { epochInfo, loading, error } = useEpochInfo();

  if (loading || error) return null;

  return (
    <div className="epoch-progress-bar-container">
      <div className="epoch-info">
        <span className="epoch-number">Epoch {epochInfo.currentEpoch}</span>
        <span className="epoch-time">
          <span className="time-label">Time Remaining: </span>
          {epochInfo.timeRemaining}
        </span>
      </div>
      <div className="epoch-progress-bar">
        <div 
          className="epoch-progress-bar-fill"
          style={{ width: `${epochInfo.progress}%` }}
        />
      </div>
      <div className="epoch-percentage">
        {epochInfo.progress}%
      </div>
    </div>
  );
};

export default EpochProgressBar; 