import { useState, useEffect } from 'react';
import { useStakewizData } from './useStakewizData';
import { useValidatorInfo } from './useValidatorInfo';
import { useVoteSuccess } from './useVoteSuccess';
import { useStakeHistory } from './useStakeHistory';
import { useStakeChanges } from './useStakeChanges';
import { useEpochInfo } from './useEpochInfo';

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  const { loading: stakewizLoading } = useStakewizData();
  const { loading: validatorLoading } = useValidatorInfo();
  const { loading: voteSuccessLoading } = useVoteSuccess();
  const { loading: stakeHistoryLoading } = useStakeHistory();
  const { loading: stakeChangesLoading } = useStakeChanges();
  const { loading: epochInfoLoading } = useEpochInfo();

  useEffect(() => {
    const allLoaded = !stakewizLoading && 
                     !validatorLoading && 
                     !voteSuccessLoading && 
                     !stakeHistoryLoading && 
                     !stakeChangesLoading &&
                     !epochInfoLoading;

    if (allLoaded) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    stakewizLoading,
    validatorLoading,
    voteSuccessLoading,
    stakeHistoryLoading,
    stakeChangesLoading,
    epochInfoLoading
  ]);

  return isLoading;
}; 