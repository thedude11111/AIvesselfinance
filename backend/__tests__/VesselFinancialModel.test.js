const VesselFinancialModel = require('../models/VesselFinancialModel');

describe('VesselFinancialModel', () => {
  const validParameters = {
    vesselType: 'Panamax Bulk Carrier',
    age: 10,
    price: 25000000,
    dwt: 82000,
    currency: 'USD',
    downPaymentPercent: 30,
    loanTermYears: 7,
    interestRatePercent: 6.5,
    dailyCharterRate: 18000,
    opexPerDay: 4000,
    utilizationPercent: 85,
    scrapValue: 3750000
  };

  describe('Parameter Validation', () => {
    test('should accept valid parameters', () => {
      expect(() => new VesselFinancialModel(validParameters)).not.toThrow();
    });

    test('should throw error for missing required parameters', () => {
      const invalidParams = { ...validParameters };
      delete invalidParams.price;
      
      expect(() => new VesselFinancialModel(invalidParams))
        .toThrow('Missing required parameter: price');
    });

    test('should convert percentage values correctly', () => {
      const model = new VesselFinancialModel(validParameters);
      expect(model.parameters.downPaymentPercent).toBe(0.30);
      expect(model.parameters.interestRatePercent).toBe(0.065);
      expect(model.parameters.utilizationPercent).toBe(0.85);
    });

    test('should set default scrap value if not provided', () => {
      const paramsWithoutScrap = { ...validParameters };
      delete paramsWithoutScrap.scrapValue;
      
      const model = new VesselFinancialModel(paramsWithoutScrap);
      expect(model.parameters.scrapValue).toBe(validParameters.price * 0.15);
    });
  });

  describe('Financial Calculations', () => {
    let model;

    beforeEach(() => {
      model = new VesselFinancialModel(validParameters);
    });

    test('should calculate annual loan payment correctly', () => {
      const loanAmount = validParameters.price * (1 - validParameters.downPaymentPercent / 100);
      const annualPayment = model.calculateAnnualLoanPayment(loanAmount, validParameters.loanTermYears);
      
      expect(annualPayment).toBeGreaterThan(2000000);
      expect(annualPayment).toBeLessThan(3500000);
    });

    test('should handle zero interest rate', () => {
      const zeroInterestParams = { ...validParameters, interestRatePercent: 0 };
      const zeroInterestModel = new VesselFinancialModel(zeroInterestParams);
      const loanAmount = 17500000; // 70% of 25M
      
      const payment = zeroInterestModel.calculateAnnualLoanPayment(loanAmount, 7);
      expect(payment).toBe(loanAmount / 7);
    });

    test('should generate cash flows for analysis horizon', () => {
      const results = model.calculateFinancialMetrics();
      const cashFlows = results.cashFlows;
      
      expect(cashFlows).toHaveLength(model.analysisHorizon + 1); // +1 for year 0
      expect(cashFlows[0].year).toBe(0);
      expect(cashFlows[0].netCashFlow).toBeLessThan(0); // Initial investment
    });

    test('should calculate operating cash flows correctly', () => {
      const results = model.calculateFinancialMetrics();
      const year1CashFlow = results.cashFlows[1];
      
      const expectedRevenue = validParameters.dailyCharterRate * 365 * (validParameters.utilizationPercent / 100);
      const expectedOpex = validParameters.opexPerDay * 365;
      
      expect(year1CashFlow.revenue).toBeCloseTo(expectedRevenue, -3);
      expect(year1CashFlow.opex).toBeCloseTo(expectedOpex, -3);
      expect(year1CashFlow.ebitda).toBeCloseTo(expectedRevenue - expectedOpex, -3);
    });

    test('should include scrap value in final year', () => {
      const results = model.calculateFinancialMetrics();
      const finalYear = results.cashFlows[results.cashFlows.length - 1];
      
      expect(finalYear.terminalValue).toBe(validParameters.scrapValue);
    });

    test('should calculate NPV', () => {
      const results = model.calculateFinancialMetrics();
      expect(typeof results.npv).toBe('number');
      expect(results.npv).not.toBeNaN();
    });

    test('should calculate IRR', () => {
      const results = model.calculateFinancialMetrics();
      expect(typeof results.irr).toBe('number');
      expect(results.irr).not.toBeNaN();
      expect(results.irr).toBeGreaterThan(-1);
      expect(results.irr).toBeLessThan(10);
    });

    test('should calculate payback period', () => {
      const results = model.calculateFinancialMetrics();
      expect(typeof results.paybackPeriod === 'number' || results.paybackPeriod === null).toBe(true);
    });
  });

  describe('Amortization Schedule', () => {
    test('should generate complete amortization schedule', () => {
      const model = new VesselFinancialModel(validParameters);
      const schedule = model.calculateAmortizationSchedule();
      
      expect(schedule).toHaveLength(validParameters.loanTermYears);
      expect(schedule[0].year).toBe(1);
      expect(schedule[schedule.length - 1].year).toBe(validParameters.loanTermYears);
    });

    test('should have decreasing balance over time', () => {
      const model = new VesselFinancialModel(validParameters);
      const schedule = model.calculateAmortizationSchedule();
      
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].startingBalance).toBeLessThan(schedule[i - 1].startingBalance);
      }
    });

    test('should have final balance near zero', () => {
      const model = new VesselFinancialModel(validParameters);
      const schedule = model.calculateAmortizationSchedule();
      const finalBalance = schedule[schedule.length - 1].endingBalance;
      
      expect(Math.abs(finalBalance)).toBeLessThan(1000); // Within $1,000 of zero
    });
  });

  describe('Key Ratios', () => {
    test('should calculate debt service coverage ratio', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.keyRatios.debtServiceCoverageRatio).toBeGreaterThan(0);
      expect(typeof results.keyRatios.debtServiceCoverageRatio).toBe('number');
    });

    test('should calculate operating margin', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.keyRatios.operatingMargin).toBeGreaterThan(0);
      expect(results.keyRatios.operatingMargin).toBeLessThan(1);
    });

    test('should calculate return on investment', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.keyRatios.returnOnInvestment).toBeGreaterThan(0);
      expect(typeof results.keyRatios.returnOnInvestment).toBe('number');
    });
  });

  describe('Summary Generation', () => {
    test('should generate vessel description', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.summary.vesselDescription).toContain(validParameters.vesselType);
      expect(results.summary.vesselDescription).toContain(validParameters.age.toString());
      expect(results.summary.vesselDescription).toContain(validParameters.dwt.toLocaleString());
    });

    test('should include financing terms', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.summary.financingTerms).toContain(validParameters.loanTermYears.toString());
      expect(results.summary.financingTerms).toContain('6.50%');
    });

    test('should include operating assumptions', () => {
      const model = new VesselFinancialModel(validParameters);
      const results = model.calculateFinancialMetrics();
      
      expect(results.summary.operatingAssumptions.dailyRate).toBe(validParameters.dailyCharterRate);
      expect(results.summary.operatingAssumptions.utilization).toBe('85.0%');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very high utilization', () => {
      const highUtilParams = { ...validParameters, utilizationPercent: 100 };
      expect(() => new VesselFinancialModel(highUtilParams)).not.toThrow();
    });

    test('should handle minimal parameters', () => {
      const minimalParams = {
        price: 1000000,
        downPaymentPercent: 10,
        loanTermYears: 5,
        interestRatePercent: 5,
        dailyCharterRate: 5000,
        opexPerDay: 2000,
        utilizationPercent: 50
      };
      
      expect(() => new VesselFinancialModel(minimalParams)).not.toThrow();
      const model = new VesselFinancialModel(minimalParams);
      const results = model.calculateFinancialMetrics();
      expect(results.npv).not.toBeNaN();
    });

    test('should handle calculation errors gracefully', () => {
      // Create model with impossible parameters that might cause division by zero
      const problematicParams = {
        ...validParameters,
        dailyCharterRate: 0,
        opexPerDay: 1000
      };
      
      const model = new VesselFinancialModel(problematicParams);
      expect(() => model.calculateFinancialMetrics()).not.toThrow();
    });
  });
});