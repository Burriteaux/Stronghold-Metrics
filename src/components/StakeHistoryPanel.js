import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useStakeHistory } from '../hooks/useStakeHistory';
import { useStakewizData } from '../hooks/useStakewizData';

const StakeHistoryPanel = () => {
  const { stakeHistory, loading: stakeHistoryLoading, error: stakeHistoryError } = useStakeHistory();
  const { validatorInfo, loading: stakewizLoading, error: stakewizError } = useStakewizData();

  if (stakeHistoryLoading || stakewizLoading) return null;
  if (stakeHistoryError || stakewizError) return null;

  const displayData = [...stakeHistory].reverse().map(item => ({
    epoch: item.epoch,
    value: item.stake
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-epoch">E{label}</p>
          <p className="tooltip-value">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-panel stake-history-panel">
      <h2>Active Stake</h2>
      <div className="status-item stake-metric-item">
        <value className="stake-value-styling">
          {Math.round(validatorInfo?.activated_stake || 0).toLocaleString()} SOL
        </value>
      </div>
      <div className="chart-wrapper">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={displayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStake" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D1FB0E" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#D1FB0E" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="epoch"
                hide={true}
              />
              <Tooltip 
                content={<CustomTooltip />}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D1FB0E"
                strokeWidth={1.5}
                fill="url(#colorStake)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StakeHistoryPanel; 