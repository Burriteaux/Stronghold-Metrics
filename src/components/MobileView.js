import React from 'react';
import ValidatorInfo from './ValidatorInfo';
import StakewizMetrics from './StakewizMetrics';
import VoteSuccessPanel from './VoteSuccessPanel';
import StakeHistoryPanel from './StakeHistoryPanel';
import UpcomingStakeChangesPanel from './UpcomingStakeChangesPanel';
import LeaderSlotsPanel from './LeaderSlotsPanel';
import EpochProgressBar from './EpochProgressBar';
import '../styles/MobileView.css';

const ErrorMessage = ({ message }) => (
  <div className="mobile-error-message">
    <span>{message}</span>
  </div>
);

const LoadingPlaceholder = () => (
  <div className="mobile-loading-placeholder">
    <div className="loading-pulse"></div>
  </div>
);

const MobileView = () => {
  return (
    <div className="mobile-dashboard">
      <EpochProgressBar />
      <div className="mobile-panels">
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load validator info" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ValidatorInfo />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load metrics" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <StakewizMetrics />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load vote success" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <VoteSuccessPanel />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load stake history" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <StakeHistoryPanel />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load stake changes" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <UpcomingStakeChangesPanel />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<ErrorMessage message="Failed to load leader slots" />}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <LeaderSlotsPanel />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default MobileView; 