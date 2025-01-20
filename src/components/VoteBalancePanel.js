import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import useVoteAccountBalance from '../hooks/useVoteAccountBalance';

const VoteBalancePanel = ({ voteAccountPubkey }) => {
  const { balanceHistory, currentBalance, loading, error } = useVoteAccountBalance(voteAccountPubkey);

  if (loading) return null;
  if (error) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBalance = (balance) => {
    if (balance === undefined) return '';
    return `${balance.toFixed(4)} SOL`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>{formatDate(payload[0].payload.timestamp)}</p>
          <p className="tooltip-value">{formatBalance(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-panel status-panel vote-balance-panel">
      <h2>Vote Account Balance</h2>
      <div className="status-grid">
        <div className="status-item">
          <span className="value">
            {currentBalance ? formatBalance(currentBalance) : '0 SOL'}
          </span>
        </div>
        <div className="chart-wrapper">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart 
                data={balanceHistory}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVoteBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D1FB0E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D1FB0E" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="timestamp" 
                  hide={true}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#D1FB0E"
                  strokeWidth={1.5}
                  fill="url(#colorVoteBalance)"
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
};

export default VoteBalancePanel; 