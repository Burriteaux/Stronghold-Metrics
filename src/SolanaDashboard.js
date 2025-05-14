import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import strongholdLogo from './stronghold-vector.svg';
import './SolanaDashboard.css';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import ValidatorInfo from './components/ValidatorInfo';
import logo from './stronghold-logo.svg';
import StakeHistoryPanel from './components/StakeHistoryPanel';
import UpcomingStakeChangesPanel from './components/UpcomingStakeChangesPanel';
import { useEpochInfo } from './hooks/useEpochInfo';
import VoteSuccessPanel from './components/VoteSuccessPanel';
import LoadingOverlay from './components/LoadingOverlay';
import { useLoadingState } from './hooks/useLoadingState';
import { useLeaderSlots } from './hooks/useLeaderSlots';
import { useValidatorStatus } from './hooks/useValidatorStatus';
import EpochProgressBar from './components/EpochProgressBar';
import MetricRings from './components/MetricRings';
const connection = new Connection(process.env.REACT_APP_HELIUS_RPC_URL);

function SolanaDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [validatorData, setValidatorData] = useState({ info: null, status: null });
  const [leaderSlotsCount, setLeaderSlotsCount] = useState(0);
  const [votePercentage, setVotePercentage] = useState(100);
  const [voteHistory, setVoteHistory] = useState(Array(20).fill(null));
  const [leaderHistory, setLeaderHistory] = useState(Array(30).fill(0));
  const [stakeHistory, setStakeHistory] = useState(Array(20).fill(null));
  const [slotsInEpoch, setSlotsInEpoch] = useState(0);
  const [startSlot, setStartSlot] = useState(0);
  const MAX_TPS_HISTORY = 60;
  const [tpsBreakdown, setTpsBreakdown] = useState({
    nonVoteSuccess: Array(30).fill(0),
    nonVoteFail: Array(30).fill(0),
    voteTps: Array(30).fill(0)
  });
  const [currentSlot, setCurrentSlot] = useState(null);
  const [nextLeaderSlot, setNextLeaderSlot] = useState(null);
  const [leaderSlotHistory, setLeaderSlotHistory] = useState([]);
  const [epochLeaderSlots, setEpochLeaderSlots] = useState({
    current: [],
    previous: [],
    twoBefore: []
  });
  const [error, setError] = useState(null);
  const [lastFlashedProgress, setLastFlashedProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const epochProgressRef = useRef(null);

  const validatorIdentityKey = useMemo(() => new PublicKey('91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt'), []);
  const validatorVoteKey = useMemo(() => new PublicKey('Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc'), []);

  const { epochInfo } = useEpochInfo();

  const updateValidatorInfo = useCallback((validator) => {
    setValidatorData(prev => ({
      ...prev,
      info: validator,
      status: validator.delinquent ? 'Delinquent' : 'Validating'
    }));
  }, []);

  const fetchWithRetry = useCallback(async (fetchFunction, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchFunction();
      } catch (error) {
        if (error.message.includes('429') && i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        } else {
          throw error;
        }
      }
    }
  }, []);

  const initializeHistoryArrays = useCallback((epochInfo) => {
    const totalSlots = epochInfo.slotsInEpoch;
    setSlotsInEpoch(totalSlots);
    setStartSlot(epochInfo.absoluteSlot - epochInfo.slotIndex);

    if (voteHistory.length === 0) { 
      setVoteHistory(new Array(totalSlots).fill(null));
    }
    if (leaderHistory.length === 0) {
      setLeaderHistory(new Array(totalSlots).fill(null));
    }
    if (stakeHistory.length === 0) {
      setStakeHistory(new Array(totalSlots).fill(null));
    }
  }, [voteHistory.length, leaderHistory.length, stakeHistory.length]);

  const calculateVotePercentage = useCallback((validator) => {
    if (!validator) return 100;
    const { epochVoteAccount, epochCredits } = validator;
    if (!epochVoteAccount || !epochCredits || epochCredits.length < 2) return 100;
    
    const [currentEpochCredits, prevEpochCredits] = epochCredits.slice(-2);
    const votesDiff = currentEpochCredits[1] - prevEpochCredits[1];
    const slotsDiff = currentEpochCredits[0] - prevEpochCredits[0];
    
    const percentage = slotsDiff > 0 ? Math.round((votesDiff / slotsDiff) * 100) : 100;
    
    setVoteHistory(prev => {
      const newHistory = [...prev.slice(1), percentage];
      console.log('Vote History:', newHistory);
      return newHistory;
    });
    
    return percentage;
  }, []);

  const findNextLeaderSlot = useCallback((leaderSchedule, currentSlot) => {
    if (!leaderSchedule) return null;
    
    const validatorSlots = [];
    const identityKey = validatorIdentityKey.toBase58();
    
    if (leaderSchedule[identityKey]) {
      const baseSlot = Math.floor(currentSlot / 432000) * 432000;
      validatorSlots.push(...leaderSchedule[identityKey].map(slot => baseSlot + slot));
    }
    
    console.log('Base slot:', Math.floor(currentSlot / 432000) * 432000);
    console.log('Current slot:', currentSlot);
    console.log('Absolute leader slots:', validatorSlots);
    
    const nextSlot = validatorSlots
      .sort((a, b) => a - b)
      .find(slot => slot > currentSlot);
    
    console.log('Next leader slot:', nextSlot);
    
    return nextSlot || null;
  }, [validatorIdentityKey]);

  const fetchMainData = useCallback(async () => {
    try {
      // Get epoch info first
      const epoch = await fetchWithRetry(() => connection.getEpochInfo());
      setCurrentSlot(epoch.absoluteSlot);

      // Get leader schedule specifically for this epoch
      const [voteAccounts, leaderSchedule] = await Promise.all([
        fetchWithRetry(() => connection.getVoteAccounts()),
        fetchWithRetry(() => connection.getLeaderSchedule(epoch.absoluteSlot))  // Pass current slot
      ]);

      console.log('Leader Schedule:', leaderSchedule);
      console.log('Validator Identity:', validatorIdentityKey.toBase58());

      // Find next leader slot
      const nextSlot = findNextLeaderSlot(leaderSchedule, epoch.absoluteSlot);
      console.log('Current Slot:', epoch.absoluteSlot);
      console.log('Next Leader Slot:', nextSlot);
      setNextLeaderSlot(nextSlot);

      initializeHistoryArrays(epoch);

      const progress = (epoch.slotIndex / epoch.slotsInEpoch) * 100;
      const newProgress = Math.min(Math.max(progress, 0), 100).toFixed(2);

      if (parseFloat(newProgress) > lastFlashedProgress) {
        const epochProgressElement = epochProgressRef.current;
        if (epochProgressElement) {
          epochProgressElement.classList.add('flash');
          setTimeout(() => {
            epochProgressElement.classList.remove('flash');
          }, 600);
        }
        setLastFlashedProgress(parseFloat(newProgress));
      }

      let totalSlots = 0;
      [validatorIdentityKey, validatorVoteKey].forEach(key => {
        const keyString = key.toBase58();
        if (leaderSchedule && leaderSchedule[keyString]) {
          totalSlots += leaderSchedule[keyString].length;
        }
      });

      setLeaderSlotsCount(totalSlots);

      const currentValidator = voteAccounts.current.find(
        (account) => account.nodePubkey === validatorIdentityKey.toBase58()
      );
      const delinquentValidator = voteAccounts.delinquent.find(
        (account) => account.nodePubkey === validatorIdentityKey.toBase58()
      );

      const validator = currentValidator || delinquentValidator;

      if (validator) {
        updateValidatorInfo({
          ...validator,
          delinquent: !!delinquentValidator
        });
        setVotePercentage(calculateVotePercentage(validator));
        setError(null);
      } else {
        setError('Validator not found');
      }

      const currentSlotIndex = epoch.slotIndex;
      setVoteHistory(prev => [...prev.slice(1), votePercentage]);
      setLeaderHistory(prev => [...prev.slice(1), leaderSlotsCount]);
      setStakeHistory(prev => [
        ...prev.slice(1), 
        Math.round(validatorData.info?.activatedStake / 1e9) || prev[prev.length - 1]
      ]);
    } catch (error) {
      console.error('Error fetching main data:', error);
    } finally {
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    }
  }, [fetchWithRetry, initializeHistoryArrays, initialLoadComplete, lastFlashedProgress, 
      validatorIdentityKey, validatorVoteKey, updateValidatorInfo, calculateVotePercentage, findNextLeaderSlot]);

  useEffect(() => {
    fetchMainData();
  }, [fetchMainData]);

  useEffect(() => {
    if (error === 'Error fetching data: failed to fetch' && retryCount < 3) {
      const retryTimeout = setTimeout(() => {
        console.log(`Retrying fetch attempt ${retryCount + 1}`);
        fetchMainData();
      }, 2000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(retryTimeout);
    }
  }, [error, retryCount, fetchMainData]);

  const updateProgress = useCallback(() => {
    if (epochProgressRef.current) {
      const circle = epochProgressRef.current.querySelector('.progress-ring__circle--progress');
      if (circle) {
        const circumference = 2 * Math.PI * 160;
        circle.style.strokeDashoffset = `${circumference * (1 - epochInfo.progress / 100)}`;
      }
    }
  }, [epochInfo.progress]);

  useEffect(() => {
    updateProgress();
  }, [updateProgress]);

  useEffect(() => {
    if (!initialLoadComplete) return;
    
  }, [initialLoadComplete]);

  const fetchEpochLeaderSlots = useCallback(async (epochNumber) => {
    try {
      console.log(`Fetching leader slots for epoch ${epochNumber}`);
      
      // Get the current slot and epoch info to ensure we're looking at the right range
      const epochInfo = await connection.getEpochInfo();
      const slotsPerEpoch = epochInfo.slotsInEpoch;
      const firstSlotInEpoch = epochNumber * slotsPerEpoch;
      
      console.log(`Epoch ${epochNumber} slot range: ${firstSlotInEpoch} - ${firstSlotInEpoch + slotsPerEpoch}`);
      
      // Get leader schedule for this specific epoch
      const leaderSchedule = await connection.getLeaderSchedule(firstSlotInEpoch);
      
      if (leaderSchedule) {
        const identityKey = validatorIdentityKey.toBase58();
        const slots = leaderSchedule[identityKey] || [];
        
        // Filter slots to only include those within this epoch
        const epochSlots = slots.filter(slot => {
          const absoluteSlot = firstSlotInEpoch + slot;
          return absoluteSlot >= firstSlotInEpoch && absoluteSlot < (firstSlotInEpoch + slotsPerEpoch);
        });
        
        console.log(`Epoch ${epochNumber} found ${epochSlots.length} leader slots`);
        console.log(`Sample slots:`, epochSlots.slice(0, 5));
        
        return epochSlots;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching leader slots for epoch ${epochNumber}:`, error);
      return [];
    }
  }, [validatorIdentityKey]);

  const processCumulativeLeaderSlots = useCallback((slots, epochNumber) => {
    const baseSlot = epochNumber * 432000;
    return slots
      .map(slot => baseSlot + slot)
      .sort((a, b) => a - b)
      .map((slot, index) => ({
        x: slot,
        y: index + 1
      }));
  }, []);

  const fetchStakeHistory = useCallback(async () => {
    try {
      const voteAccounts = await connection.getVoteAccounts();
      const validator = voteAccounts.current.find(
        (account) => account.nodePubkey === validatorIdentityKey.toBase58()
      ) || voteAccounts.delinquent.find(
        (account) => account.nodePubkey === validatorIdentityKey.toBase58()
      );

      if (validator) {
        const currentStake = validator.activatedStake / 1e9;
        setStakeHistory(prev => {
          const newHistory = [...prev.slice(1), currentStake];
          return newHistory;
        });
      }
    } catch (error) {
      console.error('Error fetching stake history:', error);
    }
  }, [validatorIdentityKey]);

  useEffect(() => {
    if (initialLoadComplete) {
      fetchStakeHistory();
      // Fetch every 5 minutes since stake changes are infrequent
      const interval = setInterval(fetchStakeHistory, 300000);
      return () => clearInterval(interval);
    }
  }, [initialLoadComplete, fetchStakeHistory]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [voteAccounts, epochInfo, performance] = await Promise.all([
          connection.getVoteAccounts(),
          connection.getEpochInfo(),
          connection.getRecentPerformanceSamples(1)
        ]);
        // Process data...
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setInitialLoadComplete(true);
        }, 1500);
      }
    };

    fetchInitialData();
  }, []);

  // Add batch fetching for multiple data points
  const fetchBatchData = useCallback(async () => {
    const [voteAccounts, epochInfo, performance] = await Promise.all([
      connection.getVoteAccounts(),
      connection.getEpochInfo(),
      connection.getRecentPerformanceSamples(1)
    ]);
    // Process all data at once
    return { voteAccounts, epochInfo, performance };
  }, [connection]);

  const fetchCriticalData = async () => {
    try {
      const [voteAccounts, epochInfo] = await Promise.all([
        connection.getVoteAccounts(),
        connection.getEpochInfo(),
      ]);
      return { voteAccounts, epochInfo };
    } catch (error) {
      console.error('Error fetching critical data:', error);
      throw error;
    }
  };

  const fetchNonCriticalData = async () => {
    try {
      const performance = await connection.getRecentPerformanceSamples(1);
      return { performance };
    } catch (error) {
      console.error('Error fetching non-critical data:', error);
      return {};
    }
  };

  const setInitialData = (data) => {
    if (data.voteAccounts) {
      // Handle vote accounts data
    }
    if (data.epochInfo) {
      // Handle epoch info data
    }
  };

  const setAdditionalData = (data) => {
    if (data.performance) {
      // Handle performance data
    }
  };

  // Update your useEffect for progressive loading
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load critical data first
        const criticalData = await fetchCriticalData();
        setInitialData(criticalData);
        
        // Then load non-critical data
        const nonCriticalData = await fetchNonCriticalData();
        setAdditionalData(nonCriticalData);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="solana-dashboard">
      <LoadingOverlay isLoading={isLoading} />
      <header className="app-header">
        <a href="https://strongholdsol.com/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="Stronghold Logo" />
        </a>
      </header>
      <EpochProgressBar />
      <div className="dashboard-grid">
        <ValidatorInfo />
        <div className="left-panels">
          <LeaderSlotsPanel />
          <VoteSuccessPanel />
        </div>
        <div className="main-feature">
          <div 
            ref={epochProgressRef}
            className="epoch-progress"
          >
            <svg viewBox="0 0 360 360" className="progress-ring">
              <circle
                className="progress-ring__circle progress-ring__circle--bg"
                stroke="#1E2022"
                strokeWidth="21"
                fill="transparent"
                r="160"
                cx="180"
                cy="180"
              />
              <circle
                className="progress-ring__circle progress-ring__circle--progress"
                stroke="#D1FB0E"
                strokeWidth="21"
                fill="transparent"
                r="160"
                cx="180"
                cy="180"
                strokeLinecap="butt"
                strokeDasharray={`${2 * Math.PI * 160}`}
              />
            </svg>
            <img
              src={strongholdLogo}
              alt="Stronghold Logo"
              className="stronghold-logo"
            />
          </div>
        </div>
        <div className="right-panels">
          <StakeHistoryPanel />
          <UpcomingStakeChangesPanel />
        </div>
      </div>
    </div>
  );
}

const MetricPanel = memo(({ label, value, unit, data, isTPS }) => {
  const chartData = data.map((value, index) => ({
    time: index,
    value: value || 0
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-value">
            {payload[0].value.toLocaleString()}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-panel status-panel metric-panel">
      <h2>{label}</h2>
      <div className="status-grid">
        <div className="status-item">
          <value>{value.toLocaleString()}{unit && <span className="metric-unit">{unit}</span>}</value>
        </div>
        <div className="chart-wrapper">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D1FB0E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D1FB0E" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#D1FB0E"
                  strokeWidth={1.5}
                  fill="url(#colorValue)"
                  isAnimationActive={false}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});

const MetricItem = memo(({ label, value }) => (
  <div className="metric-item">
    <h4>{label}</h4>
    <p>{value}</p>
  </div>
));

const EpochInfoItem = memo(({ label, value }) => (
  <div className="epoch-info-box">
    <h4>{label}</h4>
    <p>{value}</p>
  </div>
));

const LeaderSlotsPanel = memo(() => {
  const { leaderSlots, loading: leaderSlotsLoading, error: leaderSlotsError } = useLeaderSlots();
  
  const { statusInfo, loading: statusInfoLoading, error: statusInfoError } = useValidatorStatus({ 
    /* onNextLeaderSlotReached: handleNextLeaderSlotReached  // This line is removed */
  });

  // Loading and error handling for both hooks
  if (leaderSlotsLoading && !leaderSlots) { // Only show initial loading for leader slots
    // Potentially return a specific loading indicator for this panel or part of it
    // For now, consistent with previous, null if initial leaderSlots not loaded
    return null; 
  }
  if (statusInfoLoading && !statusInfo.slot) { // Similar for statusInfo if needed
    // return null; // Or a combined loading state
  }

  if (leaderSlotsError) {
    console.error('LeaderSlotsPanel: Error fetching leader slots:', leaderSlotsError);
    // Optionally render an error message for leader slots part
  }
  if (statusInfoError) {
    console.error('LeaderSlotsPanel: Error fetching validator status:', statusInfoError);
    // Optionally render an error message for status info part
  }
  
  const leaderSlotsProgressPercentage =
    leaderSlots && leaderSlots.total > 0
      ? (leaderSlots.completed / leaderSlots.total) * 100
      : 0;

  const nextLeaderProgressPercentage = statusInfo?.leaderProgress || 0;
  const isImminent = nextLeaderProgressPercentage > 90;

  return (
    <div className="dashboard-panel status-panel leader-slots-panel">
      <h2>LEADER SLOTS</h2>
      <div className="status-grid"> 
        {/* Row 1: TOTAL Leader Slots Count (left) AND Main Leader Slots Progress Bar (right) */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '5px' }}>
          <div className="status-item" style={{ marginRight: '10px', marginBottom: '0px' }}>
            <label>TOTAL</label>
            <div className="status-value" style={{ paddingLeft: '0px' }}>
              {`${leaderSlots?.completed || 0}/${leaderSlots?.total || 0}`}
            </div>
          </div>
          <div className="chart-wrapper" style={{ flexGrow: 1, width: 'auto' }}>
            <div className="leader-slot-progress" style={{ height: '3px' }}> 
              <div
                className="leader-slot-progress-fill"
                style={{ width: `${leaderSlotsProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Next Leader Info - Time and Bar on the same line */}
        {statusInfo && (
          <div className="status-item with-progress" style={{ marginTop: '5px' }}>
            <label>Next Leader</label>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <value style={{ marginRight: '10px' }}>
                {statusInfo.time_until_leader && statusInfo.time_until_leader !== 'N/A' 
                  ? statusInfo.time_until_leader 
                  : 'N/A'}
              </value>
              {statusInfo.next_leader_slot !== 'N/A' && (
                <div className="leader-slot-progress" style={{ flexGrow: 1 }}> 
                  <div
                    className={`leader-slot-progress-fill${isImminent ? ' imminent' : ''}`}
                    style={{ width: `${nextLeaderProgressPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default memo(SolanaDashboard);