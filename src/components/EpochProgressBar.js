import React from 'react';
import { useEpochInfo } from '../hooks/useEpochInfo';

const EpochProgressBar = () => {
  const { epochInfo, loading, error } = useEpochInfo();

  if (loading) return <div>Loading epoch data...</div>;
  if (error) return null;

  // Ensure progress is a number and handle potential undefined/null cases
  const progress = parseFloat(epochInfo.progress) || 0;

  return (
    <div className="epoch-progress-bar-container">
      <div className="epoch-info">
        <span className="epoch-number">{epochInfo.currentEpoch}</span>
      </div>
      <div className="epoch-progress-bar">
        <div 
          className="epoch-progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default EpochProgressBar; 