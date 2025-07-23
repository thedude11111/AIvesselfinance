import React, { useState, useEffect } from 'react';

/**
 * ParametersPanel
 * Financial parameters input form with validation and analysis trigger
 */
const ParametersPanel = ({ parameters, onParametersUpdate, onRunAnalysis, isCalculating, error }) => {
  const [analysisName, setAnalysisName] = useState('Vessel Analysis');
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    validateParameters();
  }, [parameters]);

  const validateParameters = () => {
    const errors = {};
    
    // Required fields
    if (!parameters.vesselType) errors.vesselType = 'Vessel type is required';
    if (!parameters.price || parameters.price <= 0) errors.price = 'Valid vessel price is required';
    if (!parameters.age && parameters.age !== 0) errors.age = 'Vessel age is required';
    if (!parameters.dwt || parameters.dwt <= 0) errors.dwt = 'Valid DWT is required';
    
    // Financing validation
    if (!parameters.downPaymentPercent || parameters.downPaymentPercent < 0 || parameters.downPaymentPercent > 100) {
      errors.downPaymentPercent = 'Down payment must be between 0-100%';
    }
    if (!parameters.loanTermYears || parameters.loanTermYears <= 0) {
      errors.loanTermYears = 'Loan term must be positive';
    }
    if (!parameters.interestRatePercent || parameters.interestRatePercent < 0) {
      errors.interestRatePercent = 'Interest rate must be positive';
    }
    
    // Operational validation
    if (!parameters.dailyCharterRate || parameters.dailyCharterRate <= 0) {
      errors.dailyCharterRate = 'Daily charter rate must be positive';
    }
    if (!parameters.opexPerDay || parameters.opexPerDay <= 0) {
      errors.opexPerDay = 'Operating expenses must be positive';
    }
    if (!parameters.utilizationPercent || parameters.utilizationPercent < 0 || parameters.utilizationPercent > 100) {
      errors.utilizationPercent = 'Utilization must be between 0-100%';
    }
    
    setValidationErrors(errors);
  };

  const handleInputChange = (field, value) => {
    const numericFields = ['price', 'age', 'dwt', 'downPaymentPercent', 'loanTermYears', 
                          'interestRatePercent', 'dailyCharterRate', 'opexPerDay', 
                          'utilizationPercent', 'scrapValue'];
    
    const processedValue = numericFields.includes(field) 
      ? (value === '' ? null : parseFloat(value)) 
      : value;
    
    onParametersUpdate({ [field]: processedValue });
  };

  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0 && 
           parameters.vesselType && parameters.price && 
           parameters.downPaymentPercent !== null && parameters.loanTermYears &&
           parameters.interestRatePercent !== null && parameters.dailyCharterRate &&
           parameters.opexPerDay && parameters.utilizationPercent !== null;
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['vesselType', 'price', 'age', 'dwt', 'downPaymentPercent', 
                           'loanTermYears', 'interestRatePercent', 'dailyCharterRate', 
                           'opexPerDay', 'utilizationPercent'];
    const completedFields = requiredFields.filter(field => parameters[field] !== null && parameters[field] !== undefined);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const vesselTypes = ['Container', 'Bulk Carrier', 'Tanker', 'General Cargo', 'Car Carrier', 'LNG Carrier', 'Chemical Tanker', 'Offshore'];
  const currencies = ['USD', 'EUR', 'GBP', 'NOK', 'SGD'];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Financial Parameters
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getCompletionPercentage()}% complete • Review and adjust parameters
            </p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Vessel Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Vessel Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Type</label>
                <select
                  value={parameters.vesselType || ''}
                  onChange={(e) => handleInputChange('vesselType', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.vesselType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select vessel type</option>
                  {vesselTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {validationErrors.vesselType && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.vesselType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={parameters.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.age ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5"
                />
                {validationErrors.age && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={parameters.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`w-full px-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="50000000"
                  />
                  <div className="absolute left-3 top-2 text-gray-500">$</div>
                </div>
                {validationErrors.price && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DWT (tonnes)</label>
                <input
                  type="number"
                  min="0"
                  value={parameters.dwt || ''}
                  onChange={(e) => handleInputChange('dwt', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.dwt ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="75000"
                />
                {validationErrors.dwt && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dwt}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Financing Structure</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={parameters.downPaymentPercent || ''}
                  onChange={(e) => handleInputChange('downPaymentPercent', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.downPaymentPercent ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="20"
                />
                {validationErrors.downPaymentPercent && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.downPaymentPercent}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (years)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={parameters.loanTermYears || ''}
                  onChange={(e) => handleInputChange('loanTermYears', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.loanTermYears ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10"
                />
                {validationErrors.loanTermYears && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.loanTermYears}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={parameters.interestRatePercent || ''}
                  onChange={(e) => handleInputChange('interestRatePercent', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.interestRatePercent ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5.5"
                />
                {validationErrors.interestRatePercent && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.interestRatePercent}</p>
                )}
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Operational Parameters</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Charter Rate ($)</label>
                <input
                  type="number"
                  min="0"
                  value={parameters.dailyCharterRate || ''}
                  onChange={(e) => handleInputChange('dailyCharterRate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.dailyCharterRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="15000"
                />
                {validationErrors.dailyCharterRate && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dailyCharterRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily OpEx ($)</label>
                <input
                  type="number"
                  min="0"
                  value={parameters.opexPerDay || ''}
                  onChange={(e) => handleInputChange('opexPerDay', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.opexPerDay ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="8000"
                />
                {validationErrors.opexPerDay && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.opexPerDay}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilization Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={parameters.utilizationPercent || ''}
                  onChange={(e) => handleInputChange('utilizationPercent', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.utilizationPercent ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="85"
                />
                {validationErrors.utilizationPercent && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.utilizationPercent}</p>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Parameters */}
          {showAdvanced && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Advanced Parameters</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={parameters.currency || 'USD'}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scrap Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={parameters.scrapValue || ''}
                    onChange={(e) => handleInputChange('scrapValue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Name</label>
          <input
            type="text"
            value={analysisName}
            onChange={(e) => setAnalysisName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Vessel Analysis"
          />
        </div>

        <button
          onClick={() => onRunAnalysis(analysisName)}
          disabled={!isFormValid() || isCalculating}
          className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCalculating ? (
            <div className="flex items-center">
              <div className="spinner mr-3"></div>
              Running Analysis...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Run Financial Analysis
            </div>
          )}
        </button>

        {!isFormValid() && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            Complete all required fields to run analysis
          </p>
        )}
      </div>
    </div>
  );
};

export default ParametersPanel;