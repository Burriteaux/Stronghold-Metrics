import React from 'react';
import { Line } from 'react-chartjs-2';
import { useStakeHistory } from '../hooks/useStakeHistory';

const StakeHistoryPanel = () => {
  const { stakeHistory, loading, error } = useStakeHistory();

  if (loading) return null;
  if (error) return null;

  const displayData = [...stakeHistory].reverse();

  const chartData = {
    labels: displayData.map(item => item.epoch),
    datasets: [{
      label: 'Active Stake',
      data: displayData.map(item => item.stake),
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
          title: function(context) {
            return `Epoch ${context[0].label}`;
          },
          label: function(context) {
            return `${context.raw.toLocaleString()} SOL`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 6,
          callback: function(value) {
            return `Epoch ${value}`;
          }
        }
      },
      y: {
        display: false,
        grid: {
          display: false
        },
        min: Math.min(...displayData.map(item => item.stake)) * 0.95,
        max: Math.max(...displayData.map(item => item.stake)) * 1.05
      }
    }
  };

  return (
    <div className="dashboard-panel stake-history-panel">
      <h2>Active Stake</h2>
      <div className="chart-wrapper">
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default StakeHistoryPanel; 