import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useVoteSuccess } from '../hooks/useVoteSuccess';

const VoteSuccessPanel = () => {
  const { voteSuccessData, loading, error } = useVoteSuccess();
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days

  if (loading) return null;
  if (error) return null;

  // Filter data based on selected time range
  const now = Date.now();
  const filteredData = voteSuccessData.filter(item => {
    const daysDiff = (now - item.timestamp) / (1000 * 60 * 60 * 24);
    return daysDiff <= timeRange;
  });

  const chartData = {
    labels: filteredData.map(item => item.timestamp),
    datasets: [{
      data: filteredData.map(item => item.success_rate),
      borderColor: '#D1FB0E',
      backgroundColor: 'rgba(209, 251, 14, 0.1)',
      fill: true,
      tension: 0.2,
      borderWidth: 1.5,
      pointRadius: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }
    },
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
            if (!context.raw && context.raw !== 0) return null;
            return `Success Rate: ${context.raw.toFixed(2)}%`;
          },
          title: function(context) {
            if (!context || !context[0] || typeof context[0].dataIndex === 'undefined') {
              return '';
            }
            const dataPoint = filteredData[context[0].dataIndex];
            if (!dataPoint) return '';
            const date = new Date(dataPoint.created_at);
            return date.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        display: false,
        grid: {
          display: false
        },
        offset: false,
        bounds: 'data'
      },
      y: {
        display: false,
        min: Math.min(...filteredData.map(d => d.success_rate)) * 0.99,
        max: 100,
        grid: {
          display: false,
        },
        offset: false,
        bounds: 'data'
      }
    }
  };

  return (
    <div className="dashboard-panel status-panel">
      <div className="panel-header">
        <h2>Vote Success</h2>
        <div className="time-range-selector">
          <button 
            className={`time-range-button ${timeRange === 7 ? 'active' : ''}`}
            onClick={() => setTimeRange(7)}
          >
            7D
          </button>
          <button 
            className={`time-range-button ${timeRange === 14 ? 'active' : ''}`}
            onClick={() => setTimeRange(14)}
          >
            14D
          </button>
          <button 
            className={`time-range-button ${timeRange === 30 ? 'active' : ''}`}
            onClick={() => setTimeRange(30)}
          >
            30D
          </button>
        </div>
      </div>
      <div className="chart-wrapper" style={{ margin: '0 -5px' }}>
        <div className="chart-container" style={{ height: '60px', padding: '0 5px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default VoteSuccessPanel; 