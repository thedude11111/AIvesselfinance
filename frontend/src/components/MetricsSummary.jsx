import React from 'react';

/**
 * MetricsSummary Component
 * Displays key financial metrics as specified in the plan
 */
const MetricsSummary = ({ metrics }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="metrics-summary grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="metric-card bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Net Present Value</h3>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.npv)}</p>
      </div>
      
      <div className="metric-card bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Internal Rate of Return</h3>
        <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.irr)}</p>
      </div>
      
      <div className="metric-card bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Payback Period</h3>
        <p className="text-2xl font-bold text-purple-600">{metrics.paybackPeriod.toFixed(1)} years</p>
      </div>
    </div>
  );
};

export default MetricsSummary;