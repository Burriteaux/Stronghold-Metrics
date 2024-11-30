import React from 'react';
import strongholdLogo from '../stronghold-logo.svg';
import stakewizLogo from '../stakewiz-vector.svg';

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img src={strongholdLogo} alt="Stronghold Logo" className="loading-logo" />
        <div className="loading-spinner"></div>
        <img src={stakewizLogo} alt="Stakewiz Logo" className="stakewiz-logo" />
      </div>
    </div>
  );
};

export default LoadingOverlay; 