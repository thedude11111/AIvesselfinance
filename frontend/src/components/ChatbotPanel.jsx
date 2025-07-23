import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../config/firebase';

/**
 * ChatbotPanel
 * AI conversation interface for vessel analysis parameter extraction
 */
const ChatbotPanel = ({ onMessage, conversationHistory, currentParameters }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    // Check if user is authenticated
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('🤖 ChatbotPanel: Getting ID token...');
      const idToken = await auth.currentUser.getIdToken();
      
      console.log('🤖 ChatbotPanel: Making API request to /chatbot');
      console.log('📝 Message:', message);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message,
          context: {
            currentParameters,
            conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
          }
        }),
      });

      console.log('📡 ChatbotPanel: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ ChatbotPanel: API error:', errorText);
        throw new Error(`Failed to get AI response: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ ChatbotPanel: AI response received:', data);
      
      // Extract the correct fields from the API response
      const aiResponse = data.aiResponse || data.response || 'AI response received';
      const extractedParameters = data.parameters || data.extractedParameters || null;
      
      console.log('📝 Calling onMessage with:', { message, aiResponse, extractedParameters });
      onMessage(message, aiResponse, extractedParameters);
    } catch (error) {
      console.error('❌ ChatbotPanel: Chat error:', error);
      onMessage(message, 'Sorry, I encountered an error processing your message. Please try again.', null);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSuggestedQuestions = () => {
    const hasBasicInfo = currentParameters.vesselType && currentParameters.price;
    
    if (!hasBasicInfo) {
      return [
        "I'm looking at a container vessel worth $50 million",
        "Analyze a 5-year-old bulk carrier for $25M",
        "What parameters do I need for vessel analysis?"
      ];
    }
    
    const missingFinancing = !currentParameters.downPaymentPercent || !currentParameters.loanTermYears;
    const missingOperational = !currentParameters.dailyCharterRate || !currentParameters.opexPerDay;
    
    if (missingFinancing) {
      return [
        "I can put down 20% and finance for 10 years",
        "What's a typical financing structure?",
        "I need a 15-year loan at market rates"
      ];
    }
    
    if (missingOperational) {
      return [
        "Daily charter rate is $15,000 with 85% utilization",
        "Operating expenses are $8,000 per day",
        "What's the market rate for this vessel type?"
      ];
    }
    
    return [
      "Run the financial analysis",
      "What does this investment look like?",
      "Is this a good investment opportunity?"
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          AI Assistant
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Describe your vessel and financing needs in natural language
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {conversationHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
              <svg className="h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-2">Welcome to AI Vessel Analysis</h3>
              <p className="text-sm text-gray-600">
                I can help extract financial parameters from your descriptions. 
                Try describing your vessel investment opportunity!
              </p>
            </div>
          </div>
        )}

        {conversationHistory.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.parameters && Object.keys(message.parameters).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                  <div className="font-medium mb-1">Extracted parameters:</div>
                  <div className="space-y-1">
                    {Object.entries(message.parameters).map(([key, value]) => (
                      value !== null && value !== undefined && (
                        <div key={key} className="flex justify-between">
                          <span className="opacity-75">{key}:</span>
                          <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs opacity-75 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {conversationHistory.length === 0 || (!isTyping && inputMessage === '') && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="grid gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-left text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md px-3 py-2 transition-colors"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your vessel investment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="2"
              disabled={isTyping}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;