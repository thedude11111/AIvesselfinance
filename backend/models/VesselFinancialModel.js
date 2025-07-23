/**
 * Vessel Financial Analysis Model
 * Implements the financial calculations specified in the master plan
 */

class VesselFinancialModel {
  constructor(parameters) {
    this.parameters = this.validateParameters(parameters);
    this.discountRate = 0.10; // 10% discount rate for NPV
    this.analysisHorizon = this.parameters.loanTermYears || 10; // Default 10 years
  }

  validateParameters(params) {
    const required = ['price', 'downPaymentPercent', 'loanTermYears', 'interestRatePercent', 
                     'dailyCharterRate', 'opexPerDay', 'utilizationPercent'];
    
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }

    return {
      vesselType: params.vesselType || 'Unknown',
      age: params.age || 0,
      price: parseFloat(params.price),
      dwt: params.dwt || 0,
      currency: params.currency || 'USD',
      downPaymentPercent: parseFloat(params.downPaymentPercent) / 100,
      loanTermYears: parseInt(params.loanTermYears),
      interestRatePercent: parseFloat(params.interestRatePercent) / 100,
      dailyCharterRate: parseFloat(params.dailyCharterRate),
      opexPerDay: parseFloat(params.opexPerDay),
      utilizationPercent: parseFloat(params.utilizationPercent) / 100,
      scrapValue: parseFloat(params.scrapValue) || (params.price * 0.15) // Default 15% of price
    };
  }

  calculateFinancialMetrics() {
    try {
      const cashFlows = this.calculateCashFlows();
      const amortizationSchedule = this.calculateAmortizationSchedule();
      
      const results = {
        npv: this.calculateNPV(cashFlows),
        irr: this.calculateIRR(cashFlows),
        paybackPeriod: this.calculatePaybackPeriod(cashFlows),
        cashFlows: cashFlows,
        amortizationSchedule: amortizationSchedule,
        keyRatios: this.calculateKeyRatios(cashFlows),
        summary: this.generateSummary()
      };

      return results;
    } catch (error) {
      throw new Error(`Financial calculation error: ${error.message}`);
    }
  }

  calculateCashFlows() {
    const cashFlows = [];
    const { price, downPaymentPercent, loanTermYears, dailyCharterRate, 
            opexPerDay, utilizationPercent, scrapValue } = this.parameters;

    const initialInvestment = price * downPaymentPercent;
    const loanAmount = price * (1 - downPaymentPercent);
    const annualLoanPayment = this.calculateAnnualLoanPayment(loanAmount, loanTermYears);
    
    // Year 0 - Initial Investment
    cashFlows.push({
      year: 0,
      revenue: 0,
      opex: 0,
      debtPayment: 0,
      netCashFlow: -initialInvestment,
      cumulativeCashFlow: -initialInvestment
    });

    let cumulativeCashFlow = -initialInvestment;

    // Operating years
    for (let year = 1; year <= this.analysisHorizon; year++) {
      const annualRevenue = dailyCharterRate * 365 * utilizationPercent;
      const annualOpex = opexPerDay * 365;
      const ebitda = annualRevenue - annualOpex;
      
      // Debt payment only for loan term years
      const debtPayment = year <= loanTermYears ? annualLoanPayment : 0;
      
      // Add scrap value in final year
      const terminalValue = year === this.analysisHorizon ? scrapValue : 0;
      
      const netCashFlow = ebitda - debtPayment + terminalValue;
      cumulativeCashFlow += netCashFlow;

      cashFlows.push({
        year,
        revenue: annualRevenue,
        opex: annualOpex,
        ebitda,
        debtPayment,
        terminalValue,
        netCashFlow,
        cumulativeCashFlow
      });
    }

    return cashFlows;
  }

  calculateAnnualLoanPayment(loanAmount, termYears) {
    const monthlyRate = this.parameters.interestRatePercent / 12;
    const numPayments = termYears * 12;
    
    if (monthlyRate === 0) {
      return loanAmount / termYears; // No interest case
    }
    
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return monthlyPayment * 12; // Annual payment
  }

  calculateAmortizationSchedule() {
    const { price, downPaymentPercent, loanTermYears, interestRatePercent } = this.parameters;
    const loanAmount = price * (1 - downPaymentPercent);
    const monthlyRate = interestRatePercent / 12;
    const numPayments = loanTermYears * 12;
    
    if (loanAmount === 0) return [];
    
    const monthlyPayment = this.calculateAnnualLoanPayment(loanAmount, loanTermYears) / 12;
    const schedule = [];
    let remainingBalance = loanAmount;

    for (let year = 1; year <= loanTermYears; year++) {
      let annualInterest = 0;
      let annualPrincipal = 0;
      let yearStartBalance = remainingBalance;

      // Calculate monthly payments for the year
      for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
        
        annualInterest += interestPayment;
        annualPrincipal += principalPayment;
        remainingBalance -= principalPayment;
      }

      schedule.push({
        year,
        startingBalance: yearStartBalance,
        payment: annualInterest + annualPrincipal,
        principal: annualPrincipal,
        interest: annualInterest,
        endingBalance: remainingBalance
      });
    }

    return schedule;
  }

  calculateNPV(cashFlows) {
    return cashFlows.reduce((npv, cf, index) => {
      const discountFactor = Math.pow(1 + this.discountRate, index);
      return npv + (cf.netCashFlow / discountFactor);
    }, 0);
  }

  calculateIRR(cashFlows) {
    // Newton-Raphson method for IRR calculation
    let irr = 0.1; // Initial guess
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0; // Derivative of NPV

      cashFlows.forEach((cf, year) => {
        const factor = Math.pow(1 + irr, year);
        npv += cf.netCashFlow / factor;
        dnpv -= (year * cf.netCashFlow) / Math.pow(1 + irr, year + 1);
      });

      if (Math.abs(npv) < tolerance) {
        return irr;
      }

      if (dnpv === 0) break; // Avoid division by zero
      irr = irr - npv / dnpv;

      // Bounds checking
      if (irr < -0.99) irr = -0.99;
      if (irr > 10) irr = 10;
    }

    return irr;
  }

  calculatePaybackPeriod(cashFlows) {
    let cumulativeCashFlow = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCashFlow += cashFlows[i].netCashFlow;
      
      if (cumulativeCashFlow >= 0 && i > 0) {
        // Linear interpolation for more precise payback period
        const previousCumulative = cumulativeCashFlow - cashFlows[i].netCashFlow;
        const fraction = -previousCumulative / cashFlows[i].netCashFlow;
        return i - 1 + fraction;
      }
    }
    
    return null; // Payback period not achieved within analysis horizon
  }

  calculateKeyRatios(cashFlows) {
    const operatingCashFlows = cashFlows.slice(1); // Exclude year 0
    const totalRevenue = operatingCashFlows.reduce((sum, cf) => sum + cf.revenue, 0);
    const totalOpex = operatingCashFlows.reduce((sum, cf) => sum + cf.opex, 0);
    const totalDebtPayments = operatingCashFlows.reduce((sum, cf) => sum + cf.debtPayment, 0);
    const avgAnnualEbitda = (totalRevenue - totalOpex) / operatingCashFlows.length;
    const avgAnnualDebtService = totalDebtPayments / this.parameters.loanTermYears;

    // Calculate average DSCR (Debt Service Coverage Ratio)
    const avgDSCR = avgAnnualDebtService > 0 ? avgAnnualEbitda / avgAnnualDebtService : null;

    return {
      totalRevenue,
      totalOpex,
      avgAnnualEbitda,
      avgAnnualDebtService,
      debtServiceCoverageRatio: avgDSCR,
      operatingMargin: totalRevenue > 0 ? ((totalRevenue - totalOpex) / totalRevenue) : 0,
      returnOnInvestment: (this.parameters.price * this.parameters.downPaymentPercent) > 0 ? 
        (avgAnnualEbitda / (this.parameters.price * this.parameters.downPaymentPercent)) : 0
    };
  }

  generateSummary() {
    const { vesselType, age, price, dwt, loanTermYears, interestRatePercent, 
            dailyCharterRate, utilizationPercent } = this.parameters;
    
    return {
      vesselDescription: `${age}-year-old ${vesselType} (${dwt.toLocaleString()} DWT)`,
      purchasePrice: price,
      financingTerms: `${loanTermYears} years at ${(interestRatePercent * 100).toFixed(2)}%`,
      operatingAssumptions: {
        dailyRate: dailyCharterRate,
        utilization: `${(utilizationPercent * 100).toFixed(1)}%`,
        annualOperatingDays: Math.round(365 * utilizationPercent)
      }
    };
  }
}

module.exports = VesselFinancialModel;