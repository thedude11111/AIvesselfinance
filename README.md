# AI Vessel Finance

An intelligent financial analysis platform for vessel investments, powered by AI for natural language parameter extraction and comprehensive financial modeling.

## Features

### 🤖 AI-Powered Analysis
- Natural language processing for investment parameters
- Conversational interface for complex financial scenarios
- Context-aware suggestions and guidance

### 📊 Financial Modeling
- Net Present Value (NPV) calculations with 10% discount rate
- Internal Rate of Return (IRR) using Newton-Raphson method
- 20-year cash flow projections
- Payback period analysis
- Comprehensive cost breakdown

### 🚢 Vessel-Specific Parameters
- Vessel type classification (Container, Bulk Carrier, Tanker, etc.)
- Age, DWT, and purchase price inputs
- Daily charter rates and utilization assumptions
- Operating expense modeling
- Scrap value considerations

### 💰 Financing Structure
- Flexible down payment percentages
- Loan term and interest rate modeling
- Multi-currency support (USD, EUR, GBP, NOK, SGD)
- Debt service calculations

### 📈 Interactive Visualizations
- Real-time cash flow charts
- Cost breakdown pie charts
- Sensitivity analysis
- Investment recommendations
- Scenario modeling (best/base/worst case)

### 🔐 Secure Authentication
- Firebase Authentication with Google OAuth
- User-specific analysis history
- Secure data storage in Firestore

## Technology Stack

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Recharts** for interactive data visualization
- **Firebase SDK** for authentication and data

### Backend
- **Node.js** with Express.js
- **Google Gemini AI** for natural language processing
- **Firebase Admin SDK** for authentication
- **Firestore** for data persistence
- **Comprehensive financial modeling**

### Architecture
- RESTful API design
- Real-time authentication state management
- Responsive mobile-first design
- Progressive Web App capabilities

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd AIvesselfinance
   ```

2. **Follow Setup Guide**
   See [SETUP.md](SETUP.md) for detailed configuration instructions

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   ```

4. **Configure Environment**
   - Set up Firebase project
   - Get Google AI API key
   - Create .env files (see SETUP.md)

5. **Run Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access Application**
   Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `POST /api/auth/google` - Google authentication
- `POST /api/chatbot` - AI conversation and parameter extraction
- `POST /api/calculate` - Financial analysis calculations
- `GET /api/analyses` - User's analysis history
- `GET /api/analyses/:id` - Specific analysis details

## Financial Model Details

### NPV Calculation
- 20-year projection period
- 10% discount rate (configurable)
- Includes operational cash flows and financing costs
- Accounts for vessel depreciation and scrap value

### IRR Calculation
- Newton-Raphson iterative method
- Handles complex cash flow patterns
- Converges with 0.0001 tolerance
- Maximum 1000 iterations for stability

### Cash Flow Components
- **Revenue**: Daily charter rate × utilization × days
- **Operating Expenses**: Daily OpEx × 365 days
- **Financing Costs**: Loan principal and interest payments
- **Capital Expenditures**: Purchase price and major repairs
- **Residual Value**: Scrap value at end of analysis period

## AI Integration

### Natural Language Processing
- Extracts vessel specifications from conversational input
- Identifies financing terms and operational assumptions
- Provides contextual suggestions and recommendations
- Maintains conversation history for context

### Parameter Extraction
- Vessel type, age, and size
- Purchase price and financing structure
- Operational assumptions (charter rates, expenses, utilization)
- Market conditions and risk factors

## Security & Privacy

- Firebase Authentication for secure user management
- Firestore security rules for data protection
- API authentication with JWT tokens
- No sensitive data stored in client-side code
- Secure environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue in the repository or contact the development team.

## Roadmap

- [ ] Advanced sensitivity analysis
- [ ] Multi-scenario modeling
- [ ] Integration with market data APIs
- [ ] Export functionality (PDF, Excel)
- [ ] Portfolio analysis features
- [ ] Advanced risk metrics
- [ ] Machine learning price predictions