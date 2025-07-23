# Testing Guide for AI Vessel Finance

This document describes the comprehensive test suite for the AI Vessel Finance application.

## Test Coverage

### Frontend Tests (React + Vitest)
- ✅ Component rendering and user interactions
- ✅ Form validation and state management
- ✅ API integration and error handling
- ✅ Accessibility compliance
- ✅ Responsive design behavior

### Backend Tests (Node.js + Jest)
- ✅ Financial calculation accuracy
- ✅ API endpoint validation and security
- ✅ Service layer functionality
- ✅ Database operations
- ✅ Error handling and edge cases

## Running Tests

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Watch mode for development
npm test -- --watch
```

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Run All Tests
```bash
# From project root
npm run test:all  # If configured
```

## Test Structure

### Frontend Test Files
```
frontend/src/
├── components/
│   └── __tests__/
│       ├── ChatbotPanel.test.jsx
│       ├── ParametersPanel.test.jsx
│       ├── CashFlowChart.test.jsx
│       ├── MetricsSummary.test.jsx
│       └── ResultsDashboard.test.jsx
└── test/
    └── setup.js  # Test configuration
```

### Backend Test Files
```
backend/
├── __tests__/
│   ├── VesselFinancialModel.test.js
│   ├── GeminiAIService.test.js
│   ├── FirestoreService.test.js
│   └── api.test.js
├── jest.config.js  # Jest configuration
└── jest.setup.js   # Test setup and utilities
```

## Test Categories

### Unit Tests
- **VesselFinancialModel**: NPV, IRR, cash flow calculations
- **GeminiAIService**: Parameter extraction, validation
- **FirestoreService**: Database operations, data sanitization
- **React Components**: Rendering, props handling, user interactions

### Integration Tests
- **API Endpoints**: Request/response validation, authentication
- **Component Integration**: Props flow, event handling
- **Service Integration**: Database + AI service coordination

### End-to-End Tests
- **User Workflows**: Complete vessel analysis process
- **Authentication Flow**: Google OAuth integration
- **Data Persistence**: Analysis saving and retrieval

## Test Data

### Sample Vessel Parameters
```javascript
const validParameters = {
  vesselType: 'Bulk Carrier',
  age: 10,
  price: 25000000,
  dwt: 75000,
  downPaymentPercent: 20,
  loanTermYears: 10,
  interestRatePercent: 5.5,
  dailyCharterRate: 15000,
  opexPerDay: 8000,
  utilizationPercent: 85
}
```

### Expected Financial Results
- **NPV**: Should be positive for profitable investments
- **IRR**: Typically 8-15% for vessel investments
- **Payback Period**: Usually 6-12 years
- **DSCR**: Should be > 1.2 for bankable deals

## Mocking Strategy

### Frontend Mocks
- **Firebase Auth**: Mock user authentication
- **API Calls**: Mock fetch requests with realistic responses
- **Environment Variables**: Mock configuration values

### Backend Mocks
- **Firebase Admin**: Mock Firestore and Auth services
- **Google Generative AI**: Mock AI responses
- **External Services**: Mock all external API calls

## Coverage Requirements

### Minimum Coverage Thresholds
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Critical Path Coverage
- Financial calculations: 95%+
- Authentication flows: 90%+
- Data validation: 85%+
- Error handling: 80%+

## Testing Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Test names should describe expected behavior
3. **Single Responsibility**: One assertion per test when possible
4. **Edge Cases**: Test boundary conditions and error scenarios
5. **Real Data**: Use realistic test data that reflects actual usage

### Test Maintenance
1. **Update with Changes**: Keep tests current with code changes
2. **Remove Obsolete Tests**: Delete tests for removed functionality
3. **Refactor Duplicates**: Extract common test utilities
4. **Monitor Coverage**: Maintain coverage thresholds
5. **Review Test Quality**: Ensure tests provide value

## Debugging Tests

### Common Issues
- **Async Operations**: Ensure proper async/await usage
- **Mock Configuration**: Verify mocks are set up correctly
- **Environment Variables**: Check test environment configuration
- **Timing Issues**: Use proper waiting strategies

### Debug Commands
```bash
# Frontend debugging
npm test -- --reporter=verbose

# Backend debugging with inspect
node --inspect-brk node_modules/.bin/jest --runInBand

# Coverage debugging
npm run test:coverage -- --verbose
```

## Continuous Integration

### GitHub Actions Integration
- Run tests on every pull request
- Generate coverage reports
- Block merges if tests fail
- Cache dependencies for faster runs

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No critical security vulnerabilities
- Linting and formatting checks pass

## Performance Testing

### Frontend Performance
- Component render times
- Bundle size analysis
- User interaction responsiveness
- Memory usage monitoring

### Backend Performance
- API response times
- Database query performance
- Memory usage under load
- Concurrent request handling

## Security Testing

### Authentication Tests
- Token validation and expiration
- Unauthorized access prevention
- User data isolation
- Session management

### Data Security Tests
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Future Enhancements

### Planned Improvements
- [ ] Visual regression testing with Playwright
- [ ] Load testing with Artillery
- [ ] Accessibility testing automation
- [ ] Component screenshot testing
- [ ] API contract testing

### Monitoring Integration
- [ ] Test result tracking
- [ ] Performance regression detection
- [ ] Coverage trend analysis
- [ ] Automated test health reporting