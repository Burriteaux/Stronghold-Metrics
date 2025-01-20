import React from 'react';
import ValidatorInfo from './ValidatorInfo';
import ValidatorStatus from './ValidatorStatus';
import UpcomingStakeChangesPanel from './UpcomingStakeChangesPanel';
import StakeHistoryPanel from './StakeHistoryPanel';
import LeaderSlotsPanel from './LeaderSlotsPanel';
import VoteSuccessPanel from './VoteSuccessPanel';
import MetricPanel from '../components/MetricPanel';
import EpochProgressBar from './EpochProgressBar';

const MobileLayout = ({ 
  isLoading, 
  epochData, 
  epochLeaderSlots, 
  setEpochLeaderSlots, 
  connection, 
  validatorIdentityKey,
  clusterTps,
  tpsHistory 
}) => {
  return (
    <div className="mobile-dashboard">
      <EpochProgressBar progress={epochData.progress} />
      <div className="mobile-panels">
        <ValidatorInfo />
        <ValidatorStatus />
        <UpcomingStakeChangesPanel />
        <StakeHistoryPanel />
        <LeaderSlotsPanel 
          currentEpoch={epochData.info?.epoch}
          epochLeaderSlots={epochLeaderSlots}
          setEpochLeaderSlots={setEpochLeaderSlots}
          connection={connection}
          validatorIdentityKey={validatorIdentityKey}
        />
        <VoteSuccessPanel />
        <MetricPanel 
          label="Cluster TPS" 
          value={clusterTps || "0"} 
          unit="TPS"
          data={tpsHistory}
          isTPS={true}
        />
      </div>
    </div>
  );
};

export default MobileLayout; 