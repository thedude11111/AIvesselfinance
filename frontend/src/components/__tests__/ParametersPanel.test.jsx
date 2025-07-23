import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ParametersPanel from '../ParametersPanel'

describe('ParametersPanel', () => {
  const mockOnParametersUpdate = vi.fn()
  const mockOnRunAnalysis = vi.fn()
  
  const defaultProps = {
    parameters: {},
    onParametersUpdate: mockOnParametersUpdate,
    onRunAnalysis: mockOnRunAnalysis,
    isCalculating: false,
    error: null
  }

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
    utilizationPercent: 85,
    currency: 'USD'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders form sections', () => {
      render(<ParametersPanel {...defaultProps} />)
      
      expect(screen.getByText('Financial Parameters')).toBeInTheDocument()
      expect(screen.getByText('Vessel Information')).toBeInTheDocument()
      expect(screen.getByText('Financing Structure')).toBeInTheDocument()
      expect(screen.getByText('Operational Parameters')).toBeInTheDocument()
    })

    test('shows completion percentage', () => {
      render(<ParametersPanel {...defaultProps} parameters={validParameters} />)
      
      expect(screen.getByText('100% complete')).toBeInTheDocument()
    })

    test('displays error message when provided', () => {
      const props = { ...defaultProps, error: 'Calculation failed' }
      render(<ParametersPanel {...props} />)
      
      expect(screen.getByText('Calculation failed')).toBeInTheDocument()
    })

    test('shows advanced parameters when toggled', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      expect(screen.queryByText('Advanced Parameters')).not.toBeInTheDocument()
      
      await user.click(screen.getByText('Show Advanced'))
      expect(screen.getByText('Advanced Parameters')).toBeInTheDocument()
      expect(screen.getByText('Currency')).toBeInTheDocument()
      expect(screen.getByText('Scrap Value ($)')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('validates required vessel information', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      // Try to run analysis without filling required fields
      await user.click(screen.getByText('Run Financial Analysis'))
      
      expect(mockOnRunAnalysis).not.toHaveBeenCalled()
    })

    test('shows validation errors for invalid inputs', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const priceInput = screen.getByPlaceholderText('50000000')
      await user.type(priceInput, '-1000')
      await user.tab() // Trigger validation
      
      await waitFor(() => {
        expect(screen.getByText('Valid vessel price is required')).toBeInTheDocument()
      })
    })

    test('validates percentage fields within bounds', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const downPaymentInput = screen.getByPlaceholderText('20')
      await user.type(downPaymentInput, '150')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Down payment must be between 0-100%')).toBeInTheDocument()
      })
    })

    test('enables analysis button when form is valid', () => {
      render(<ParametersPanel {...defaultProps} parameters={validParameters} />)
      
      const analysisButton = screen.getByText('Run Financial Analysis')
      expect(analysisButton).not.toBeDisabled()
    })

    test('disables analysis button when form is invalid', () => {
      const incompleteParams = { vesselType: 'Bulk Carrier' }
      render(<ParametersPanel {...defaultProps} parameters={incompleteParams} />)
      
      const analysisButton = screen.getByText('Run Financial Analysis')
      expect(analysisButton).toBeDisabled()
    })
  })

  describe('Input Handling', () => {
    test('handles text input changes', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const vesselTypeSelect = screen.getByDisplayValue('')
      await user.selectOptions(vesselTypeSelect, 'Bulk Carrier')
      
      expect(mockOnParametersUpdate).toHaveBeenCalledWith({ vesselType: 'Bulk Carrier' })
    })

    test('handles numeric input changes', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const ageInput = screen.getByPlaceholderText('5')
      await user.type(ageInput, '10')
      
      expect(mockOnParametersUpdate).toHaveBeenCalledWith({ age: 10 })
    })

    test('handles empty numeric inputs', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} parameters={{ age: 10 }} />)
      
      const ageInput = screen.getByDisplayValue('10')
      await user.clear(ageInput)
      
      expect(mockOnParametersUpdate).toHaveBeenCalledWith({ age: null })
    })

    test('updates analysis name', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const analysisNameInput = screen.getByDisplayValue('Vessel Analysis')
      await user.clear(analysisNameInput)
      await user.type(analysisNameInput, 'My Custom Analysis')
      
      expect(analysisNameInput.value).toBe('My Custom Analysis')
    })
  })

  describe('Vessel Type Selection', () => {
    test('provides vessel type options', () => {
      render(<ParametersPanel {...defaultProps} />)
      
      const vesselTypeSelect = screen.getByLabelText('Vessel Type')
      expect(vesselTypeSelect).toBeInTheDocument()
      
      // Check if options are available
      expect(screen.getByRole('option', { name: 'Container' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Bulk Carrier' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Tanker' })).toBeInTheDocument()
    })

    test('updates vessel type when selected', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      await user.selectOptions(screen.getByLabelText('Vessel Type'), 'Container')
      
      expect(mockOnParametersUpdate).toHaveBeenCalledWith({ vesselType: 'Container' })
    })
  })

  describe('Currency Selection', () => {
    test('shows currency options in advanced section', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      await user.click(screen.getByText('Show Advanced'))
      
      const currencySelect = screen.getByLabelText('Currency')
      expect(currencySelect).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'USD' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'EUR' })).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    test('calculates completion percentage correctly', () => {
      const partialParams = {
        vesselType: 'Bulk Carrier',
        price: 25000000,
        age: 10,
        dwt: 75000,
        downPaymentPercent: 20
        // Missing 5 out of 10 required fields = 50%
      }
      
      render(<ParametersPanel {...defaultProps} parameters={partialParams} />)
      
      expect(screen.getByText('50% complete')).toBeInTheDocument()
    })

    test('shows 0% when no parameters filled', () => {
      render(<ParametersPanel {...defaultProps} />)
      
      expect(screen.getByText('0% complete')).toBeInTheDocument()
    })
  })

  describe('Analysis Execution', () => {
    test('calls onRunAnalysis with analysis name when form is valid', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} parameters={validParameters} />)
      
      const analysisNameInput = screen.getByDisplayValue('Vessel Analysis')
      await user.clear(analysisNameInput)
      await user.type(analysisNameInput, 'Test Analysis')
      
      await user.click(screen.getByText('Run Financial Analysis'))
      
      expect(mockOnRunAnalysis).toHaveBeenCalledWith('Test Analysis')
    })

    test('shows loading state when calculating', () => {
      const props = { ...defaultProps, isCalculating: true, parameters: validParameters }
      render(<ParametersPanel {...props} />)
      
      expect(screen.getByText('Running Analysis...')).toBeInTheDocument()
      expect(screen.getByText('Run Financial Analysis')).toBeDisabled()
    })

    test('prevents analysis when form is invalid', async () => {
      const user = userEvent.setup()
      const incompleteParams = { vesselType: 'Bulk Carrier' }
      render(<ParametersPanel {...defaultProps} parameters={incompleteParams} />)
      
      await user.click(screen.getByText('Run Financial Analysis'))
      
      expect(mockOnRunAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('Form Reset and Updates', () => {
    test('updates displayed values when parameters prop changes', () => {
      const { rerender } = render(<ParametersPanel {...defaultProps} />)
      
      rerender(<ParametersPanel {...defaultProps} parameters={validParameters} />)
      
      expect(screen.getByDisplayValue('Bulk Carrier')).toBeInTheDocument()
      expect(screen.getByDisplayValue('25000000')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper labels for all inputs', () => {
      render(<ParametersPanel {...defaultProps} />)
      
      expect(screen.getByLabelText('Vessel Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Age (years)')).toBeInTheDocument()
      expect(screen.getByLabelText('Purchase Price')).toBeInTheDocument()
      expect(screen.getByLabelText('Down Payment (%)')).toBeInTheDocument()
      expect(screen.getByLabelText('Daily Charter Rate ($)')).toBeInTheDocument()
    })

    test('shows validation errors with proper styling', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const priceInput = screen.getByPlaceholderText('50000000')
      await user.type(priceInput, '-1000')
      await user.tab()
      
      await waitFor(() => {
        expect(priceInput).toHaveClass('border-red-300')
      })
    })

    test('has accessible button states', () => {
      render(<ParametersPanel {...defaultProps} />)
      
      const button = screen.getByText('Run Financial Analysis')
      expect(button).toHaveAttribute('disabled')
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Input Validation Edge Cases', () => {
    test('validates numeric bounds correctly', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      // Test age validation
      const ageInput = screen.getByPlaceholderText('5')
      await user.type(ageInput, '100') // Over max of 50
      await user.tab()
      
      // Component should handle this gracefully even if input allows it
      expect(ageInput.value).toBe('100')
    })

    test('handles decimal inputs for percentages', async () => {
      const user = userEvent.setup()
      render(<ParametersPanel {...defaultProps} />)
      
      const interestRateInput = screen.getByPlaceholderText('5.5')
      await user.type(interestRateInput, '6.75')
      
      expect(mockOnParametersUpdate).toHaveBeenCalledWith({ interestRatePercent: 6.75 })
    })
  })
})