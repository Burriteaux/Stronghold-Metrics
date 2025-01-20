import React from 'react';
import { Line } from 'react-chartjs-2';
import { useLeaderHistory } from '../hooks/useLeaderHistory';
import useLeaderSlots from '../hooks/useLeaderSlots';

const LeaderSlotsPanel = () => {
  const { data, loading, error, currentEpoch } = useLeaderHistory();
  const { leaderSlots } = useLeaderSlots();

  if (loading) return null;
  if (error) return null;

  // Transform data into cumulative points within each epoch
  const transformedData = data.slice(0, 3).map(epochData => {
    const points = [];
    const epochStartSlot = epochData.epoch * 432000;
    const epochEndSlot = (epochData.epoch + 1) * 432000;
    
    // Start point for epoch
    points.push({
      x: epochStartSlot,
      y: 0
    });

    // Sort leader slots chronologically
    const sortedSlots = [...epochData.leaderSlots].sort((a, b) => a - b);

    // Add points for each leader slot with cumulative count
    sortedSlots.forEach((slot, index) => {
      points.push({
        x: slot,
        y: index + 1
      });
    });

    // Add end point for this epoch
    if (sortedSlots.length > 0) {
      points.push({
        x: epochEndSlot - 1,
        y: sortedSlots.length
      });
      
      // Add reset point for next epoch
      points.push({
        x: epochEndSlot,
        y: 0
      });
    }

    return points;
  }).flat();

  const chartData = {
    datasets: [{
      label: 'Leader Slots',
      data: transformedData,
      borderColor: '#D1FB0E',
      backgroundColor: 'rgba(209, 251, 14, 0.05)',
      fill: true,
      stepped: 'before', // This creates the sharp sawtooth pattern
      tension: 0,
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
        enabled: false
      }
    },
    scales: {
      x: {
        type: 'linear',
        display: false,
        grid: {
          display: false
        },
        min: (currentEpoch - 2) * 432000,
        max: (currentEpoch + 1) * 432000
      },
      y: {
        display: false,
        grid: {
          display: false
        },
        beginAtZero: true,
        suggestedMax: Math.max(...transformedData.map(d => d.y)) * 1.1
      }
    },
    elements: {
      line: {
        tension: 0
      }
    }
  };

  return (
    <div className="dashboard-panel status-panel leader-slots-panel">
      <h2>LEADER SLOTS</h2>
      <div className="status-grid">
        <div className="status-value">
          {`${leaderSlots?.completed || 0}/${leaderSlots?.total || 0}`}
        </div>
        <div className="chart-wrapper">
          <div className="chart-container" style={{ height: '120px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderSlotsPanel; 