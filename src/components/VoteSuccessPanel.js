import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useVoteSuccess } from '../hooks/useVoteSuccess';

const VoteSuccessPanel = () => {
  const { voteSuccessData, loading, error } = useVoteSuccess();
  const [timeRange, setTimeRange] = useState(30);

  if (loading || error) return null;

  const now = Date.now();
  const filteredData = voteSuccessData
    .filter(item => {
      const itemDate = new Date(item.created_at).getTime();
      const daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= timeRange;
    })
    .map(item => ({
      name: new Date(item.created_at).getTime(),
      value: item.success_rate
    }))
    .sort((a, b) => a.name - b.name);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-value">{payload[0].value.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-panel status-panel vote-success-panel">
      <div className="panel-header">
        <h2>Vote Success</h2>
        <div className="time-range-selector">
          <button 
            className={`time-range-button ${timeRange === 7 ? 'active' : ''}`}
            onClick={() => setTimeRange(7)}
          >7D</button>
          <button 
            className={`time-range-button ${timeRange === 14 ? 'active' : ''}`}
            onClick={() => setTimeRange(14)}
          >14D</button>
          <button 
            className={`time-range-button ${timeRange === 30 ? 'active' : ''}`}
            onClick={() => setTimeRange(30)}
          >30D</button>
        </div>
      </div>
      <div className="chart-wrapper">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={filteredData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVote" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorVote)"
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

export default VoteSuccessPanel; 