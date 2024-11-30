import React from 'react';

const MetricRing = ({ value, label, size = 77, strokeWidth = 3.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="metric-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="metric-ring-bg"
          stroke="rgba(209, 251, 14, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="metric-ring-progress"
          stroke="#D1FB0E"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      <div className="metric-ring-label">
        <span className="metric-value">
          {value}%
        </span>
        <span className="metric-name">{label}</span>
      </div>
    </div>
  );
};

export default MetricRing; 