import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import strongholdLogo from './stronghold-vector.svg';
import './SolanaDashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StakewizMetrics from './components/StakewizMetrics';
import ValidatorInfo from './components/ValidatorInfo';
import logo from './stronghold-logo.svg';
import StakeHistoryPanel from './components/StakeHistoryPanel';
import UpcomingStakeChangesPanel from './components/UpcomingStakeChangesPanel';
import { useEpochInfo } from './hooks/useEpochInfo';
import VoteSuccessPanel from './components/VoteSuccessPanel';
import LoadingOverlay from './components/LoadingOverlay';
import { useLoadingState } from './hooks/useLoadingState';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=f0751d28-271a-4b42-a667-3333a6c49d7c');

function SolanaDashboard() {
  const isLoading = useLoadingState();
  const [epochData, setEpochData] = useState({ info: null, progress: 0 });
  const [validatorData, setValidatorData] = useState({ info: null, status: null });
  const [error, setError] = useState(null);
  const [leaderSlotsCount, setLeaderSlotsCount] = useState(0);
  const [lastFlashedProgress, setLastFlashedProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [clusterTps, setClusterTps] = useState(0);
  const [votePercentage, setVotePercentage] = useState(100);
  const [tpsHistory, setTpsHistory] = useState(Array(20).fill(null));
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

  const epochProgressRef = useRef(null);

  const validatorIdentityKey = useMemo(() => new PublicKey('91oPXTs2oq8VvJpQ5TnvXakFGnnJSpEB6HFWDtSctwMt'), []);
  const validatorVoteKey = useMemo(() => new PublicKey('Ac1beBKixfNdrTAac7GRaTsJTxLyvgGvJjvy4qQfvyfc'), []);

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
    
    if (tpsHistory.length === 0) {
      setTpsHistory(new Array(totalSlots).fill(null));
      setVoteHistory(new Array(totalSlots).fill(null));
      setLeaderHistory(new Array(totalSlots).fill(null));
      setStakeHistory(new Array(totalSlots).fill(null));
    }
  }, [tpsHistory.length]);

  const fetchClusterTPS = useCallback(async () => {
    try {
      const performance = await connection.getRecentPerformanceSamples(1);
      if (performance && performance.length > 0) {
        const latestSample = performance[0];
        const tps = Math.round(
          (latestSample.numTransactions) / latestSample.samplePeriodSecs
        );
        
        setTpsHistory(prev => {
          const newHistory = [...prev.slice(1), tps];
          console.log('TPS History:', newHistory);
          return newHistory;
        });
        setClusterTps(tps);
      }
    } catch (error) {
      console.error('Error fetching TPS:', error);
    }
  }, [connection]);

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

      setEpochData(prev => ({ ...prev, info: epoch, progress: parseFloat(newProgress) }));

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
    const interval = setInterval(fetchMainData, 10000);
    return () => clearInterval(interval);
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
        circle.style.strokeDashoffset = `${circumference * (1 - epochData.progress / 100)}`;
      }
    }
  }, [epochData.progress]);

  useEffect(() => {
    updateProgress();
  }, [updateProgress]);

  useEffect(() => {
    if (!initialLoadComplete) return;
    
    fetchClusterTPS();
    const interval = setInterval(fetchClusterTPS, 3000);
    return () => clearInterval(interval);
  }, [fetchClusterTPS, initialLoadComplete]);

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

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="solana-dashboard">
        <header className="app-header">
          <img src={logo} alt="Stronghold Logo" />
        </header>
        <EpochProgressBar progress={epochData.progress} />
        <div className="dashboard-grid">
          <ValidatorInfo />
          <div className="left-panels">
            <StakewizMetrics />
            <LeaderSlotsPanel 
              currentEpoch={epochData.info?.epoch}
              epochLeaderSlots={epochLeaderSlots}
              setEpochLeaderSlots={setEpochLeaderSlots}
              connection={connection}
              validatorIdentityKey={validatorIdentityKey}
            />
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
            <MetricPanel 
              label="Cluster TPS" 
              value={clusterTps || "0"} 
              unit="TPS"
              data={tpsHistory}
              isTPS={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const MetricPanel = memo(({ label, value, unit, data, isTPS, isStake }) => {
  const validData = data.filter(d => d !== null);
  
  const chartData = {
    labels: Array(validData.length).fill(''),
    datasets: [{
      data: validData,
      borderColor: '#D1FB0E',
      backgroundColor: 'rgba(209, 251, 14, 0.1)',
      fill: true,
      tension: 0.2,
      borderWidth: 1.5,
      stepped: isStake,
      pointRadius: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(30, 32, 34, 0.9)',
        titleColor: '#D1FB0E',
        bodyColor: '#fff',
        borderColor: '#D1FB0E',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const value = isStake ? 
              Math.round(context.raw).toLocaleString() :
              context.raw;
            return `${value}${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        display: false,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        },
        beginAtZero: !isStake,
        min: validData.length > 0 ? Math.min(...validData) * 0.95 : 0,
        max: validData.length > 0 ? Math.max(...validData) * 1.05 : 100
      }
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 0,
        right: 0
      }
    }
  };

  return (
    <div className="dashboard-panel status-panel metric-panel">
      <h2>{label}</h2>
      <div className="status-grid">
        <div className="status-item">
          <label>Current</label>
          <value>{value.toLocaleString()}{unit && <span className="metric-unit">{unit}</span>}</value>
        </div>
        <div className="chart-wrapper">
          <div className="chart-container">
            <Line 
              data={chartData} 
              options={chartOptions}
            />
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

const LeaderSlotsPanel = memo(({ 
  currentEpoch,
  epochLeaderSlots,
  setEpochLeaderSlots,
  connection,
  validatorIdentityKey
}) => {
  // Keep track of the last processed slot
  const lastProcessedSlot = useRef(0);
  const [currentSlot, setCurrentSlot] = useState(null);

  useEffect(() => {
    if (!currentEpoch || !connection) return;

    const fetchEpochSlots = async () => {
      try {
        const epochInfo = await connection.getEpochInfo();
        const schedule = await connection.getLeaderSchedule(null, {
          epoch: currentEpoch,
          commitment: 'confirmed'
        });

        setCurrentSlot(epochInfo.absoluteSlot);

        if (!schedule) {
          console.log('No schedule found for current epoch');
          return;
        }

        const validatorSlots = schedule[validatorIdentityKey.toBase58()] || [];
        const baseSlot = currentEpoch * epochInfo.slotsInEpoch;
        
        // Create cumulative data points for completed slots
        const completedData = validatorSlots.map((slot, index) => ({
          x: baseSlot + slot,
          y: index + 1
        }));

        // Update last processed slot
        lastProcessedSlot.current = epochInfo.absoluteSlot;

        // Update state with the new data
        setEpochLeaderSlots(prev => ({
          current: completedData,
          total: validatorSlots.length
        }));

      } catch (error) {
        console.error('Error processing epoch slots:', error);
      }
    };

    fetchEpochSlots();
    const interval = setInterval(fetchEpochSlots, 6000);
    return () => clearInterval(interval);
  }, [currentEpoch, connection, validatorIdentityKey]);

  const chartData = {
    datasets: [
      {
        label: 'Leader Slots',
        data: epochLeaderSlots.current || [],
        borderColor: '#D1FB0E',
        backgroundColor: 'rgba(209, 251, 14, 0.1)',
        fill: true,
        stepped: false,
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(30, 32, 34, 0.9)',
        titleColor: '#D1FB0E',
        bodyColor: '#fff',
        borderColor: '#D1FB0E',
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: function(context) {
            return `Slot ${context.raw.x}`;
          }
        }
      },
      annotation: {
        annotations: {
          currentSlotLine: {
            type: 'line',
            xMin: currentSlot,
            xMax: currentSlot,
            borderColor: '#FFFFFF',
            borderWidth: 1,
            borderDash: [3, 3],
            label: {
              enabled: false
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        display: false,
        offset: false,
        bounds: 'data'
      },
      y: {
        display: false,
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        }
      }
    }
  };

  const totalSlots = epochLeaderSlots.current?.length || 0;

  return (
    <div className="dashboard-panel status-panel leader-slots-panel">
      <h2>Leader Slots</h2>
      <div className="status-grid">
        <div className="status-item">
          <label>Total Slots</label>
          <value>{totalSlots}</value>
        </div>
        <div className="chart-wrapper">
          <div className="chart-container" style={{ height: '60px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
});

const EpochProgressBar = memo(({ progress }) => {
  const { epochInfo } = useEpochInfo();

  return (
    <div className="epoch-progress-bar-container">
      <div className="epoch-info">
        <span className="epoch-number">{epochInfo?.currentEpoch || '...'}</span>
      </div>
      <div className="epoch-progress-bar">
        <div 
          className="epoch-progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="epoch-progress-text">
        {progress.toFixed(2)}% Complete
      </div>
    </div>
  );
});

export default memo(SolanaDashboard);