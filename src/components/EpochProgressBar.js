import React from 'react';
import { useEpochInfo } from '../hooks/useEpochInfo';

const EpochProgressBar = () => {
  const { epochInfo, loading, error } = useEpochInfo();

  if (loading || error) return null;

  return (
    <div className="epoch-progress-bar-container">
      <div className="epoch-info">
        <span className="epoch-number">Epoch {epochInfo.currentEpoch}</span>
      </div>
      <div className="epoch-progress-bar">
        <div 
          className="epoch-progress-bar-fill"
          style={{ width: `${epochInfo.progress}%` }}
        />
      </div>
    </div>
  );
};

export default EpochProgressBar; 