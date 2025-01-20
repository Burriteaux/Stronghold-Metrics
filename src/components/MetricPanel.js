import React, { memo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

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

export default MetricPanel; 