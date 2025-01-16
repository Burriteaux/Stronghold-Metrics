import React from 'react';
import ValidatorInfo from './ValidatorInfo';
import StakewizMetrics from './StakewizMetrics';
import VoteSuccessPanel from './VoteSuccessPanel';
import StakeHistoryPanel from './StakeHistoryPanel';
import UpcomingStakeChangesPanel from './UpcomingStakeChangesPanel';
import LeaderSlotsPanel from './LeaderSlotsPanel';
import EpochProgressBar from './EpochProgressBar';

const DashboardMetrics = () => {
  return (
    <>
      <EpochProgressBar />
      <div className="bento-grid">
        <div className="bento-cell validator-info">
          <ValidatorInfo />
        </div>
        <div className="bento-cell stakewiz">
          <StakewizMetrics />
        </div>
        <div className="bento-cell vote-success">
          <VoteSuccessPanel />
        </div>
        <div className="bento-cell stake-history">
          <StakeHistoryPanel />
        </div>
        <div className="bento-cell upcoming-changes">
          <UpcomingStakeChangesPanel />
        </div>
        <div className="bento-cell leader-slots">
          <LeaderSlotsPanel />
        </div>
      </div>
    </>
  );
};

export default DashboardMetrics; 