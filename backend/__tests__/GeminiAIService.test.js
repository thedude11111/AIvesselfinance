const GeminiAIService = require('../utils/GeminiAIService');

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

describe('GeminiAIService', () => {
  let geminiService;
  let mockModel;

  beforeEach(() => {
    // Set up environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Create service instance
    geminiService = new GeminiAIService();
    mockModel = geminiService.model;
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Initialization', () => {
    test('should initialize with valid API key', () => {
      expect(() => new GeminiAIService()).not.toThrow();
    });

    test('should throw error without API key', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => new GeminiAIService()).toThrow('GEMINI_API_KEY environment variable is required');
    });

    test('should have correct system prompt', () => {
      expect(geminiService.systemPrompt).toContain('financial analyst specializing in maritime assets');
      expect(geminiService.systemPrompt).toContain('JSON object');
    });
  });

  describe('Parameter Extraction', () => {
    test('should extract parameters successfully', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "vesselType": "Panamax Bulk Carrier",
  "age": 10,
  "price": 22000000,
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
I've extracted the vessel parameters from your description.`
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.extractParameters('I want to analyze a 10-year-old Panamax bulk carrier worth $22M');

      expect(result.parameters.vesselType).toBe('Panamax Bulk Carrier');
      expect(result.parameters.price).toBe(22000000);
      expect(result.parameters.age).toBe(10);
      expect(result.confirmation).toContain('extracted');
    });

    test('should include conversation history in context', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{"vesselType": "Container", "price": null, "age": null, "dwt": null, "currency": "USD", "downPaymentPercent": null, "loanTermYears": null, "interestRatePercent": null, "dailyCharterRate": null, "opexPerDay": null, "utilizationPercent": null, "scrapValue": null}
\`\`\`
I need more details about the vessel.`
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user', content: 'I want to analyze a container vessel' },
        { role: 'assistant', content: 'What is the price of the vessel?' }
      ];

      await geminiService.extractParameters('It costs $50 million', conversationHistory);

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Previous conversation context:')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('user: I want to analyze a container vessel')
      );
    });

    test('should handle AI response errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(geminiService.extractParameters('test message'))
        .rejects.toThrow('AI parameter extraction failed: API rate limit exceeded');
    });

    test('should handle malformed JSON responses', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid response without JSON block'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.extractParameters('test message'))
        .rejects.toThrow('Failed to parse AI response');
    });
  });

  describe('Parameter Validation', () => {
    test('should validate parameter types and ranges', () => {
      const testParams = {
        vesselType: 'Bulk Carrier',
        age: 15,
        price: 25000000,
        dwt: 75000,
        downPaymentPercent: 20,
        loanTermYears: 10,
        interestRatePercent: 5.5,
        dailyCharterRate: 15000,
        opexPerDay: 8000,
        utilizationPercent: 85,
        scrapValue: 5000000
      };

      const validated = geminiService.validateParameters(testParams);

      expect(validated.age).toBe(15);
      expect(validated.price).toBe(25000000);
      expect(validated.downPaymentPercent).toBe(20);
    });

    test('should handle null values correctly', () => {
      const testParams = {
        vesselType: 'Bulk Carrier',
        age: null,
        price: 25000000,
        dwt: null,
        downPaymentPercent: 20,
        loanTermYears: 10,
        interestRatePercent: 5.5,
        dailyCharterRate: 15000,
        opexPerDay: 8000,
        utilizationPercent: 85,
        scrapValue: null
      };

      const validated = geminiService.validateParameters(testParams);

      expect(validated.age).toBeNull();
      expect(validated.dwt).toBeNull();
      expect(validated.scrapValue).toBeNull();
      expect(validated.price).toBe(25000000);
    });

    test('should apply default values', () => {
      const testParams = {
        vesselType: null,
        currency: null,
        age: 10,
        price: 25000000,
        dwt: 75000,
        downPaymentPercent: 20,
        loanTermYears: 10,
        interestRatePercent: 5.5,
        dailyCharterRate: 15000,
        opexPerDay: 8000,
        utilizationPercent: 85,
        scrapValue: null
      };

      const validated = geminiService.validateParameters(testParams);

      expect(validated.currency).toBe('USD');
    });

    test('should throw error for out-of-range values', () => {
      const testParams = {
        age: 100, // Over max of 50
        price: 25000000,
        dwt: 75000,
        downPaymentPercent: 150, // Over max of 100
        loanTermYears: 10,
        interestRatePercent: 5.5,
        dailyCharterRate: 15000,
        opexPerDay: 8000,
        utilizationPercent: 85
      };

      expect(() => geminiService.validateParameters(testParams))
        .toThrow('Parameter age must be at most 50');
    });

    test('should convert string numbers to floats', () => {
      const testParams = {
        age: '10',
        price: '25000000',
        downPaymentPercent: '20.5',
        loanTermYears: '10',
        interestRatePercent: '5.5',
        dailyCharterRate: '15000',
        opexPerDay: '8000',
        utilizationPercent: '85'
      };

      const validated = geminiService.validateParameters(testParams);

      expect(validated.age).toBe(10);
      expect(validated.price).toBe(25000000);
      expect(validated.downPaymentPercent).toBe(20.5);
    });
  });

  describe('Results Query Answering', () => {
    test('should answer results queries with analysis data', async () => {
      const mockResponse = {
        response: {
          text: () => 'The NPV of this investment is $5,234,567, which indicates a positive return.'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const resultsData = {
        npv: 5234567,
        irr: 0.12,
        paybackPeriod: 8.5,
        keyRatios: { debtServiceCoverageRatio: 1.8 },
        summary: { vesselDescription: '10-year-old Bulk Carrier' }
      };

      const answer = await geminiService.answerResultsQuery(
        'What is the NPV of this investment?',
        resultsData
      );

      expect(answer).toContain('NPV');
      expect(answer).toContain('5,234,567');
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('ANALYSIS RESULTS SUMMARY:')
      );
    });

    test('should include conversation history in results queries', async () => {
      const mockResponse = {
        response: {
          text: () => 'Based on our previous discussion, the IRR is 12%.'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const resultsData = { npv: 1000000, irr: 0.12 };
      const conversationHistory = [
        { role: 'user', content: 'What is the IRR?' },
        { role: 'assistant', content: 'The IRR is 12%.' }
      ];

      await geminiService.answerResultsQuery(
        'Is this a good investment?',
        resultsData,
        conversationHistory
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('user: What is the IRR?')
      );
    });
  });

  describe('Scenario Modification', () => {
    test('should modify scenario parameters correctly', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "vesselType": null,
  "age": null,
  "price": 30000000,
  "dwt": null,
  "currency": null,
  "downPaymentPercent": null,
  "loanTermYears": null,
  "interestRatePercent": null,
  "dailyCharterRate": null,
  "opexPerDay": null,
  "utilizationPercent": null,
  "scrapValue": null
}
\`\`\`
I've updated the vessel price to $30 million.`
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const currentParameters = {
        vesselType: 'Bulk Carrier',
        price: 25000000,
        age: 10,
        downPaymentPercent: 20
      };

      const result = await geminiService.modifyScenario(
        'Change the price to $30 million',
        currentParameters
      );

      expect(result.updatedParameters.price).toBe(30000000);
      expect(result.updatedParameters.vesselType).toBe('Bulk Carrier'); // Unchanged
      expect(result.modifications.price).toBe(30000000);
      expect(result.confirmation).toContain('updated');
    });

    test('should preserve non-modified parameters', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "vesselType": null,
  "age": null,
  "price": null,
  "dwt": null,
  "currency": null,
  "downPaymentPercent": 25,
  "loanTermYears": null,
  "interestRatePercent": null,
  "dailyCharterRate": null,
  "opexPerDay": null,
  "utilizationPercent": null,
  "scrapValue": null
}
\`\`\`
Down payment updated to 25%.`
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const currentParameters = {
        vesselType: 'Container',
        price: 50000000,
        downPaymentPercent: 20,
        loanTermYears: 10
      };

      const result = await geminiService.modifyScenario(
        'Increase down payment to 25%',
        currentParameters
      );

      expect(result.updatedParameters.vesselType).toBe('Container');
      expect(result.updatedParameters.price).toBe(50000000);
      expect(result.updatedParameters.downPaymentPercent).toBe(25);
      expect(result.updatedParameters.loanTermYears).toBe(10);
    });
  });

  describe('Results Summary Creation', () => {
    test('should create comprehensive results summary', () => {
      const resultsData = {
        npv: 5234567,
        irr: 0.125,
        paybackPeriod: 8.5,
        keyRatios: {
          debtServiceCoverageRatio: 1.8,
          operatingMargin: 0.65
        },
        summary: {
          vesselDescription: '10-year-old Bulk Carrier (75,000 DWT)',
          purchasePrice: 25000000,
          financingTerms: '10 years at 5.50%',
          operatingAssumptions: {
            dailyRate: 15000,
            utilization: '85.0%'
          }
        },
        cashFlows: [
          { year: 0, netCashFlow: -5000000 },
          { year: 1, netCashFlow: 2000000 },
          { year: 10, netCashFlow: 2500000, cumulativeCashFlow: 10000000 }
        ]
      };

      const summary = geminiService.createResultsSummary(resultsData);

      expect(summary).toContain('VESSEL INVESTMENT ANALYSIS SUMMARY:');
      expect(summary).toContain('10-year-old Bulk Carrier');
      expect(summary).toContain('$25,000,000');
      expect(summary).toContain('NPV): $5,234,567');
      expect(summary).toContain('IRR): 12.50%');
      expect(summary).toContain('8.5 years');
      expect(summary).toContain('1.8x');
      expect(summary).toContain('65.0%');
    });

    test('should handle missing cash flows gracefully', () => {
      const resultsData = {
        npv: 1000000,
        irr: 0.1,
        paybackPeriod: null,
        keyRatios: { debtServiceCoverageRatio: null },
        summary: {
          vesselDescription: 'Test Vessel',
          purchasePrice: 10000000,
          financingTerms: '5 years at 6.00%',
          operatingAssumptions: { dailyRate: 10000, utilization: '80.0%' }
        }
      };

      const summary = geminiService.createResultsSummary(resultsData);

      expect(summary).toContain('Not achieved');
      expect(summary).toContain('N/A');
      expect(summary).not.toContain('Year 1 Net Cash Flow:');
    });
  });

  describe('JSON Parsing', () => {
    test('should parse valid JSON responses', () => {
      const text = `Here are the parameters:
\`\`\`json
{
  "vesselType": "Tanker",
  "price": 40000000
}
\`\`\`
Parameters extracted successfully.`;

      const result = geminiService.parseParametersResponse(text);

      expect(result.parameters.vesselType).toBe('Tanker');
      expect(result.parameters.price).toBe(40000000);
      expect(result.confirmation).toContain('Parameters extracted successfully');
    });

    test('should handle responses without confirmation text', () => {
      const text = `\`\`\`json
{
  "vesselType": "Tanker",
  "price": 40000000
}
\`\`\``;

      const result = geminiService.parseParametersResponse(text);

      expect(result.parameters.vesselType).toBe('Tanker');
      expect(result.confirmation).toBe('Parameters extracted successfully.');
    });

    test('should throw error for invalid JSON', () => {
      const text = `\`\`\`json
{
  "vesselType": "Tanker"
  "price": 40000000  // Missing comma
}
\`\`\``;

      expect(() => geminiService.parseParametersResponse(text))
        .toThrow('Failed to parse AI response');
    });

    test('should throw error for missing JSON block', () => {
      const text = 'I cannot extract parameters from this message.';

      expect(() => geminiService.parseParametersResponse(text))
        .toThrow('No JSON block found in AI response');
    });
  });
});