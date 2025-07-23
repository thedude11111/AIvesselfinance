import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import ChatbotPanel from './ChatbotPanel';

/**
 * ResultsDashboard
 * Complete results visualization with charts, metrics, and analysis
 */
const ResultsDashboard = ({ results, parameters, onBackToAnalysis, conversationHistory, onChatMessage }) => {
  const [showChat, setShowChat] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  if (!results) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No results available</h3>
          <p className="text-gray-500 mt-1">Run an analysis to see results here</p>
        </div>
      </div>
    );
  }

  const { npv, irr, paybackPeriod, totalRevenue, totalCosts, netCashFlow, breakdownData, projectionData, summaryData } = results;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: parameters.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const keyMetrics = [
    {
      label: 'Net Present Value',
      value: formatCurrency(npv),
      trend: npv > 0 ? 'positive' : 'negative',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      label: 'Internal Rate of Return',
      value: formatPercent(irr),
      trend: irr > 0.1 ? 'positive' : irr > 0.05 ? 'neutral' : 'negative',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      label: 'Payback Period',
      value: `${paybackPeriod?.toFixed(1) || 'N/A'} years`,
      trend: paybackPeriod && paybackPeriod < 7 ? 'positive' : paybackPeriod < 10 ? 'neutral' : 'negative',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Total Revenue (20Y)',
      value: formatCurrency(totalRevenue),
      trend: 'neutral',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendBgColor = (trend) => {
    switch (trend) {
      case 'positive': return 'bg-green-50';
      case 'negative': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Results Panel */}
      <div className={`${showChat ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
        <div className="h-full flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <p className="text-gray-600 mt-1">
                  {parameters.vesselType} • {formatCurrency(parameters.price)} • {parameters.age} years old
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    showChat 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {showChat ? 'Hide Chat' : 'Ask AI'}
                  </div>
                </button>
                <button
                  onClick={onBackToAnalysis}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Analysis
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {keyMetrics.map((metric, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getTrendBgColor(metric.trend)}`}>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md ${getTrendColor(metric.trend)} bg-white`}>
                      {metric.icon}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className={`text-2xl font-semibold ${getTrendColor(metric.trend)}`}>
                        {metric.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts and Analysis */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Navigation tabs */}
            <div className="mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'cashflow', name: 'Cash Flow', icon: '💰' },
                  { id: 'breakdown', name: 'Cost Breakdown', icon: '📈' },
                  { id: 'sensitivity', name: 'Sensitivity', icon: '🎯' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedMetric(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedMetric === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon} {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {selectedMetric === 'overview' && (
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Summary</h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Investment Details</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Purchase Price</dt>
                          <dd className="text-sm font-medium">{formatCurrency(parameters.price)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Down Payment ({parameters.downPaymentPercent}%)</dt>
                          <dd className="text-sm font-medium">
                            {formatCurrency(parameters.price * parameters.downPaymentPercent / 100)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Loan Amount</dt>
                          <dd className="text-sm font-medium">
                            {formatCurrency(parameters.price * (100 - parameters.downPaymentPercent) / 100)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Loan Term</dt>
                          <dd className="text-sm font-medium">{parameters.loanTermYears} years</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Interest Rate</dt>
                          <dd className="text-sm font-medium">{parameters.interestRatePercent}%</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Operational Assumptions</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Daily Charter Rate</dt>
                          <dd className="text-sm font-medium">{formatCurrency(parameters.dailyCharterRate)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Daily OpEx</dt>
                          <dd className="text-sm font-medium">{formatCurrency(parameters.opexPerDay)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Utilization Rate</dt>
                          <dd className="text-sm font-medium">{parameters.utilizationPercent}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Annual Revenue</dt>
                          <dd className="text-sm font-medium">
                            {formatCurrency(parameters.dailyCharterRate * 365 * parameters.utilizationPercent / 100)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Annual OpEx</dt>
                          <dd className="text-sm font-medium">
                            {formatCurrency(parameters.opexPerDay * 365)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Investment Recommendation */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Recommendation</h3>
                  <div className={`p-4 rounded-md ${getTrendBgColor(npv > 0 ? 'positive' : 'negative')}`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {npv > 0 ? (
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.414l1.293-1.293a1 1 0 001.414 1.414L10 11.828l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 10 7.293 8.707a1 1 0 011.414-1.414L10 8.586l1.293-1.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${getTrendColor(npv > 0 ? 'positive' : 'negative')}`}>
                          {npv > 0 ? 'Recommended Investment' : 'Investment Not Recommended'}
                        </h3>
                        <div className={`mt-2 text-sm ${getTrendColor(npv > 0 ? 'positive' : 'negative')}`}>
                          <p>
                            The NPV of {formatCurrency(npv)} and IRR of {formatPercent(irr)} 
                            {npv > 0 ? ' indicate this is a financially attractive investment' : ' suggest this investment may not generate sufficient returns'}.
                            {paybackPeriod && ` The payback period is ${paybackPeriod.toFixed(1)} years.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'cashflow' && projectionData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">20-Year Cash Flow Projection</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="netCashFlow" 
                        stroke="#2563EB" 
                        strokeWidth={3}
                        name="Net Cash Flow"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeCashFlow" 
                        stroke="#059669" 
                        strokeWidth={2}
                        name="Cumulative Cash Flow"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {selectedMetric === 'breakdown' && breakdownData && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {breakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Costs</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdownData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                        <Bar dataKey="value" fill="#2563EB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'sensitivity' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sensitivity Analysis</h3>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Risk Factors</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Charter Rate Volatility</span>
                        <span className="text-sm text-red-600">High Risk</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Utilization Rate</span>
                        <span className="text-sm text-yellow-600">Medium Risk</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Operating Expenses</span>
                        <span className="text-sm text-yellow-600">Medium Risk</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Interest Rate</span>
                        <span className="text-sm text-green-600">Low Risk</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Scenario Analysis</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-green-900">Best Case (+20%)</span>
                          <span className="text-sm font-semibold text-green-900">
                            NPV: {formatCurrency(npv * 1.4)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Base Case</span>
                          <span className="text-sm font-semibold text-gray-900">
                            NPV: {formatCurrency(npv)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-red-900">Worst Case (-20%)</span>
                          <span className="text-sm font-semibold text-red-900">
                            NPV: {formatCurrency(npv * 0.6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-1/3 border-l border-gray-200">
          <ChatbotPanel
            onMessage={onChatMessage}
            conversationHistory={conversationHistory}
            currentParameters={parameters}
          />
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;