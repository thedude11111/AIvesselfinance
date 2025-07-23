const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini AI Integration for Vessel Parameter Extraction
 * As specified in the master plan
 */
class GeminiAIService {
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    this.systemPrompt = `You are a financial analyst specializing in maritime assets. 
    The user will describe a vessel purchase scenario. Your task is to extract the key 
    financial parameters from their message and return them as a JSON object. 
    
    The required parameters are: vesselType, age, price, dwt, currency, 
    downPaymentPercent, loanTermYears, interestRatePercent, dailyCharterRate, 
    opexPerDay, utilizationPercent, and scrapValue. 
    
    IMPORTANT: 
    - ONLY extract parameters that are explicitly mentioned in the current message
    - If a parameter is not mentioned in the current message, set its value to null (it will be preserved from existing values)
    - For vesselType: Extract ANY mention of vessel type (container vessel, bulk carrier, tanker, cargo ship, etc.)
    - Percentages should be returned as numbers (e.g., 30 for 30%, not 0.3)
    - Prices should ALWAYS be in actual dollars (e.g., 22000000 for $22 million, not 22)
    - Daily rates should be in actual dollars (e.g., 18000 for $18,000/day)
    - Always respond with ONLY a JSON object inside a \`\`\`json block, followed by a brief confirmation sentence
    
    Example response:
    \`\`\`json
    {
      "vesselType": "Panamax Bulk Carrier",
      "age": 10,
      "price": 25000000,
      "dwt": 82000,
      "currency": "USD",
      "downPaymentPercent": 30,
      "loanTermYears": 7,
      "interestRatePercent": 6.5,
      "dailyCharterRate": 18000,
      "opexPerDay": 4000,
      "utilizationPercent": 85,
      "scrapValue": null
    }
    \`\`\`
    I've extracted the vessel parameters from your description.`;
  }

  async extractParameters(userMessage, conversationHistory = [], currentParameters = {}) {
    try {
      let contextPrompt = this.systemPrompt;
      
      // Add current parameters context to preserve existing values
      if (currentParameters && Object.keys(currentParameters).length > 0) {
        const existingParams = Object.entries(currentParameters)
          .filter(([key, value]) => value !== null && value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        if (existingParams) {
          contextPrompt += `\n\nCURRENT PARAMETERS (preserve these unless explicitly changed):\n${existingParams}\n`;
        }
      }
      
      // Add conversation history for context
      if (conversationHistory.length > 0) {
        contextPrompt += "\n\nPrevious conversation context:\n";
        conversationHistory.slice(-3).forEach(msg => { // Last 3 messages for context
          contextPrompt += `${msg.role}: ${msg.content}\n`;
        });
      }
      
      contextPrompt += `\n\nUser message: ${userMessage}`;
      
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = this.parseParametersResponse(text);
      const validated = this.validateParameters(parsed.parameters);
      
      // Merge with existing parameters, only updating non-null values
      const mergedParameters = { ...currentParameters };
      for (const [key, value] of Object.entries(validated)) {
        if (value !== null && value !== undefined) {
          mergedParameters[key] = value;
        }
      }
      
      return {
        parameters: mergedParameters,
        confirmation: parsed.confirmation,
        rawResponse: text
      };
    } catch (error) {
      console.error('Gemini AI parameter extraction error:', error);
      throw new Error(`AI parameter extraction failed: ${error.message}`);
    }
  }

  parseParametersResponse(text) {
    try {
      // Extract JSON block from response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON block found in AI response');
      }

      const jsonString = jsonMatch[1].trim();
      const parameters = JSON.parse(jsonString);

      // Extract confirmation text (everything after the JSON block)
      const confirmationMatch = text.split('```')[2];
      const confirmation = confirmationMatch ? confirmationMatch.trim() : 'Parameters extracted successfully.';

      return { parameters, confirmation };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response. Please try rephrasing your vessel description.');
    }
  }

  validateParameters(parameters) {
    const validated = {};
    
    // Define parameter types and validation rules
    const parameterRules = {
      vesselType: { type: 'string', required: false },
      age: { type: 'number', min: 0, max: 50 },
      price: { type: 'number', min: 100000, max: 1000000000 },
      dwt: { type: 'number', min: 1000, max: 500000 },
      currency: { type: 'string', default: 'USD' },
      downPaymentPercent: { type: 'number', min: 0, max: 100 },
      loanTermYears: { type: 'number', min: 1, max: 30 },
      interestRatePercent: { type: 'number', min: 0, max: 20 },
      dailyCharterRate: { type: 'number', min: 1000, max: 100000 },
      opexPerDay: { type: 'number', min: 500, max: 20000 },
      utilizationPercent: { type: 'number', min: 1, max: 100 },
      scrapValue: { type: 'number', min: 0, max: 1000000000 }
    };

    // Validate each parameter
    for (const [key, rules] of Object.entries(parameterRules)) {
      let value = parameters[key];
      
      // Skip null/undefined values unless required
      if (value === null || value === undefined) {
        if (rules.required) {
          throw new Error(`Required parameter ${key} is missing`);
        }
        if (rules.default !== undefined) {
          validated[key] = rules.default;
        } else {
          validated[key] = null;
        }
        continue;
      }

      // Type conversion and validation
      if (rules.type === 'number') {
        value = parseFloat(value);
        if (isNaN(value)) {
          throw new Error(`Parameter ${key} must be a valid number`);
        }
        if (rules.min !== undefined && value < rules.min) {
          throw new Error(`Parameter ${key} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          throw new Error(`Parameter ${key} must be at most ${rules.max}`);
        }
      } else if (rules.type === 'string') {
        value = String(value).trim();
        if (value.length === 0 && rules.required) {
          throw new Error(`Parameter ${key} cannot be empty`);
        }
      }

      validated[key] = value;
    }

    return validated;
  }

  async answerResultsQuery(query, resultsData, conversationHistory = []) {
    try {
      const summary = this.createResultsSummary(resultsData);
      
      let contextPrompt = `You are a financial analyst specialized in vessel investment analysis. 
      A user is asking about their vessel analysis results. Provide clear, professional answers 
      with specific numbers and insights.
      
      ANALYSIS RESULTS SUMMARY:
      ${summary}
      
      Previous conversation context:`;
      
      if (conversationHistory.length > 0) {
        conversationHistory.slice(-5).forEach(msg => {
          contextPrompt += `\n${msg.role}: ${msg.content}`;
        });
      }
      
      contextPrompt += `\n\nUser question: ${query}\n\nProvide a clear, specific answer with relevant numbers and insights:`;
      
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini AI results query error:', error);
      throw new Error(`AI results query failed: ${error.message}`);
    }
  }

  createResultsSummary(resultsData) {
    const { npv, irr, paybackPeriod, keyRatios, summary, cashFlows } = resultsData;
    
    let summaryText = `VESSEL INVESTMENT ANALYSIS SUMMARY:
    
Vessel: ${summary.vesselDescription}
Purchase Price: $${summary.purchasePrice.toLocaleString()}
Financing: ${summary.financingTerms}
Operating: ${summary.operatingAssumptions.dailyRate.toLocaleString()}/day at ${summary.operatingAssumptions.utilization} utilization

KEY FINANCIAL METRICS:
- Net Present Value (NPV): $${npv.toLocaleString()} 
- Internal Rate of Return (IRR): ${(irr * 100).toFixed(2)}%
- Payback Period: ${paybackPeriod ? paybackPeriod.toFixed(1) + ' years' : 'Not achieved'}
- Debt Service Coverage Ratio: ${keyRatios.debtServiceCoverageRatio ? keyRatios.debtServiceCoverageRatio.toFixed(2) + 'x' : 'N/A'}
- Operating Margin: ${(keyRatios.operatingMargin * 100).toFixed(1)}%

CASH FLOW HIGHLIGHTS:`;

    if (cashFlows && cashFlows.length > 1) {
      const firstYear = cashFlows[1];
      const finalYear = cashFlows[cashFlows.length - 1];
      summaryText += `
- Year 1 Net Cash Flow: $${firstYear.netCashFlow.toLocaleString()}
- Final Year Net Cash Flow: $${finalYear.netCashFlow.toLocaleString()}
- Final Cumulative Cash Flow: $${finalYear.cumulativeCashFlow.toLocaleString()}`;
    }

    return summaryText;
  }

  async modifyScenario(modificationsRequest, currentParameters, conversationHistory = []) {
    try {
      let contextPrompt = `You are helping a user modify their vessel analysis parameters. 
      
      CURRENT PARAMETERS:
      ${JSON.stringify(currentParameters, null, 2)}
      
      The user wants to make changes. Extract ONLY the parameters they want to modify 
      and return them as a JSON object. Keep all other parameters as null.
      
      Previous conversation context:`;
      
      if (conversationHistory.length > 0) {
        conversationHistory.slice(-3).forEach(msg => {
          contextPrompt += `\n${msg.role}: ${msg.content}`;
        });
      }
      
      contextPrompt += `\n\nUser modification request: ${modificationsRequest}
      
      Return ONLY a JSON object with the modified parameters:`;
      
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = this.parseParametersResponse(text);
      const validated = this.validateParameters(parsed.parameters);
      
      // Merge with current parameters, only updating non-null values
      const updated = { ...currentParameters };
      for (const [key, value] of Object.entries(validated)) {
        if (value !== null && value !== undefined) {
          updated[key] = value;
        }
      }
      
      return {
        updatedParameters: updated,
        modifications: Object.fromEntries(
          Object.entries(validated).filter(([key, value]) => value !== null && value !== undefined)
        ),
        confirmation: parsed.confirmation
      };
    } catch (error) {
      console.error('Gemini AI scenario modification error:', error);
      throw new Error(`AI scenario modification failed: ${error.message}`);
    }
  }
}

module.exports = GeminiAIService;