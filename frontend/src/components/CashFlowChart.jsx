import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * CashFlowChart Component
 * Displays annual cash flow projections as specified in the plan
 */
const CashFlowChart = ({ data }) => {
  return (
    <div className="cash-flow-chart">
      <h3 className="text-lg font-semibold mb-4">Annual Cash Flow</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="netCashFlow" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="cumulativeCashFlow" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;