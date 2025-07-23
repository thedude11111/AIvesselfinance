import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import ChatbotPanel from './ChatbotPanel';
import ParametersPanel from './ParametersPanel';
import ResultsDashboard from './ResultsDashboard';

/**
 * MainApp
 * Main workspace with ChatbotPanel and ParametersPanel
 */
const MainApp = ({ user, onSignOut }) => {
  const [currentView, setCurrentView] = useState('analysis'); // analysis, results, history
  const [parameters, setParameters] = useState({
    vesselType: null,
    age: null,
    price: null,
    dwt: null,
    currency: 'USD',
    downPaymentPercent: null,
    loanTermYears: null,
    interestRatePercent: null,
    dailyCharterRate: null,
    opexPerDay: null,
    utilizationPercent: null,
    scrapValue: null
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    // Only load analyses when user is authenticated and has a valid auth state
    if (user && auth.currentUser) {
      console.log('🔍 MainApp: User authenticated, loading analyses...', user.uid);
      loadUserAnalyses();
    } else {
      console.log('🔍 MainApp: User not ready yet', { user: !!user, currentUser: !!auth.currentUser });
    }
  }, [user]);

  const loadUserAnalyses = async () => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('❌ No authenticated user, skipping analyses load');
        return;
      }

      console.log('🔑 Getting ID token for user:', auth.currentUser.uid);
      const idToken = await auth.currentUser.getIdToken();
      
      console.log('📡 Making API request to /api/analyses');
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/analyses`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analyses loaded successfully:', data.analyses.length, 'items');
        setAnalyses(data.analyses);
      } else {
        const errorText = await response.text();
        console.log('❌ Failed to load analyses:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error loading analyses:', error);
    }
  };

  const handleParametersUpdate = (newParameters) => {
    setParameters(prev => ({ ...prev, ...newParameters }));
    setError(null);
  };

  const handleRunAnalysis = async (analysisName = 'Vessel Analysis') => {
    try {
      setIsCalculating(true);
      setError(null);

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          parameters,
          analysisName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Calculation failed');
      }

      const data = await response.json();
      setAnalysisResults(data.results);
      setCurrentView('results');
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        role: 'system',
        content: 'Analysis completed successfully',
        timestamp: new Date().toISOString(),
        type: 'calculation'
      }]);

      // Reload analyses list
      loadUserAnalyses();
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleChatMessage = (message, response, extractedParameters) => {
    console.log('💬 MainApp: handleChatMessage called with:', { message, response, extractedParameters });
    
    // Add user message
    setConversationHistory(prev => {
      const newHistory = [...prev, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }];
      console.log('📝 Adding user message to history');
      return newHistory;
    });

    // Add AI response
    setConversationHistory(prev => {
      const newHistory = [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        parameters: extractedParameters
      }];
      console.log('🤖 Adding AI response to history');
      return newHistory;
    });

    // Update parameters if extracted
    if (extractedParameters) {
      console.log('⚡ Updating parameters:', extractedParameters);
      handleParametersUpdate(extractedParameters);
    } else {
      console.log('⚠️ No parameters to update');
    }
  };

  const handleLoadAnalysis = async (analysisId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/analyses/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParameters(data.analysis.parameters);
        setAnalysisResults(data.analysis.results);
        setCurrentView('results');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setError('Failed to load analysis');
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Vessel Finance</h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('analysis')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'analysis'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setCurrentView('results')}
                disabled={!analysisResults}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'results' && analysisResults
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
                }`}
              >
                Results
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'history'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                History
              </button>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.displayName || user?.email}
              </span>
              <img
                className="h-8 w-8 rounded-full"
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email)}`}
                alt="User avatar"
              />
              <button
                onClick={onSignOut}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'analysis' && (
          <div className="h-full flex">
            {/* Left Panel - Chat */}
            <div className="w-1/2 border-r border-gray-200">
              <ChatbotPanel
                onMessage={handleChatMessage}
                conversationHistory={conversationHistory}
                currentParameters={parameters}
              />
            </div>

            {/* Right Panel - Parameters */}
            <div className="w-1/2">
              <ParametersPanel
                parameters={parameters}
                onParametersUpdate={handleParametersUpdate}
                onRunAnalysis={handleRunAnalysis}
                isCalculating={isCalculating}
                error={error}
              />
            </div>
          </div>
        )}

        {currentView === 'results' && analysisResults && (
          <ResultsDashboard
            results={analysisResults}
            parameters={parameters}
            onBackToAnalysis={() => setCurrentView('analysis')}
            conversationHistory={conversationHistory}
            onChatMessage={handleChatMessage}
          />
        )}

        {currentView === 'history' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis History</h2>
              
              {analyses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first vessel analysis.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setCurrentView('analysis')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      New Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleLoadAnalysis(analysis.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {analysis.analysisName}
                          </h3>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Vessel: {analysis.summary?.vesselType || 'Not specified'}</p>
                            <p>Price: ${analysis.summary?.price?.toLocaleString() || 'Not specified'}</p>
                            <p>Created: {analysis.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {analysis.summary?.npv !== undefined && (
                            <div className="text-sm">
                              <div className={`font-semibold ${analysis.summary.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                NPV: ${analysis.summary.npv.toLocaleString()}
                              </div>
                              {analysis.summary?.irr !== undefined && (
                                <div className="text-gray-600">
                                  IRR: {(analysis.summary.irr * 100).toFixed(2)}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'results' && !analysisResults && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
              <p className="mt-1 text-sm text-gray-500">Run an analysis to see results here.</p>
              <div className="mt-6">
                <button
                  onClick={() => setCurrentView('analysis')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainApp;