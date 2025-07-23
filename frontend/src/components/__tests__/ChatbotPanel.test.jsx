import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatbotPanel from '../ChatbotPanel'

describe('ChatbotPanel', () => {
  const mockOnMessage = vi.fn()
  const defaultProps = {
    onMessage: mockOnMessage,
    conversationHistory: [],
    currentParameters: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Rendering', () => {
    test('renders welcome message when no conversation history', () => {
      render(<ChatbotPanel {...defaultProps} />)
      
      expect(screen.getByText('Welcome to AI Vessel Analysis')).toBeInTheDocument()
      expect(screen.getByText(/I can help extract financial parameters/)).toBeInTheDocument()
    })

    test('renders conversation history', () => {
      const conversationHistory = [
        {
          role: 'user',
          content: 'I want to analyze a bulk carrier',
          timestamp: Date.now()
        },
        {
          role: 'assistant',
          content: 'I can help you with that',
          timestamp: Date.now()
        }
      ]

      render(<ChatbotPanel {...defaultProps} conversationHistory={conversationHistory} />)
      
      expect(screen.getByText('I want to analyze a bulk carrier')).toBeInTheDocument()
      expect(screen.getByText('I can help you with that')).toBeInTheDocument()
    })

    test('displays extracted parameters in message', () => {
      const conversationHistory = [
        {
          role: 'assistant',
          content: 'Parameters extracted',
          parameters: { vesselType: 'Bulk Carrier', price: 25000000 },
          timestamp: Date.now()
        }
      ]

      render(<ChatbotPanel {...defaultProps} conversationHistory={conversationHistory} />)
      
      expect(screen.getByText('Extracted parameters:')).toBeInTheDocument()
      expect(screen.getByText('vesselType:')).toBeInTheDocument()
      expect(screen.getByText('Bulk Carrier')).toBeInTheDocument()
      expect(screen.getByText('25,000,000')).toBeInTheDocument()
    })
  })

  describe('Suggested Questions', () => {
    test('shows basic vessel questions when no parameters', () => {
      render(<ChatbotPanel {...defaultProps} />)
      
      expect(screen.getByText('"I\'m looking at a container vessel worth $50 million"')).toBeInTheDocument()
      expect(screen.getByText('"Analyze a 5-year-old bulk carrier for $25M"')).toBeInTheDocument()
    })

    test('shows financing questions when vessel info present but financing missing', () => {
      const currentParameters = {
        vesselType: 'Bulk Carrier',
        price: 25000000
      }

      render(<ChatbotPanel {...defaultProps} currentParameters={currentParameters} />)
      
      expect(screen.getByText('"I can put down 20% and finance for 10 years"')).toBeInTheDocument()
    })

    test('shows operational questions when financing present but operational missing', () => {
      const currentParameters = {
        vesselType: 'Bulk Carrier',
        price: 25000000,
        downPaymentPercent: 20,
        loanTermYears: 10
      }

      render(<ChatbotPanel {...defaultProps} currentParameters={currentParameters} />)
      
      expect(screen.getByText('"Daily charter rate is $15,000 with 85% utilization"')).toBeInTheDocument()
    })

    test('shows analysis questions when all basic parameters present', () => {
      const currentParameters = {
        vesselType: 'Bulk Carrier',
        price: 25000000,
        downPaymentPercent: 20,
        loanTermYears: 10,
        dailyCharterRate: 15000,
        opexPerDay: 5000
      }

      render(<ChatbotPanel {...defaultProps} currentParameters={currentParameters} />)
      
      expect(screen.getByText('"Run the financial analysis"')).toBeInTheDocument()
    })

    test('clicking suggested question fills input', async () => {
      const user = userEvent.setup()
      render(<ChatbotPanel {...defaultProps} />)
      
      const suggestion = screen.getByText('"I\'m looking at a container vessel worth $50 million"')
      await user.click(suggestion)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      expect(textarea.value).toBe('I\'m looking at a container vessel worth $50 million')
    })
  })

  describe('Message Input', () => {
    test('allows typing in textarea', async () => {
      const user = userEvent.setup()
      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      
      expect(textarea.value).toBe('Test message')
    })

    test('sends message on send button click', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'AI response',
          extractedParameters: { vesselType: 'Test' }
        })
      })

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      const sendButton = screen.getByRole('button')
      
      await user.type(textarea, 'Test message')
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(mockOnMessage).toHaveBeenCalledWith(
          'Test message',
          'AI response',
          { vesselType: 'Test' }
        )
      })
    })

    test('sends message on Enter key press', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'AI response',
          extractedParameters: {}
        })
      })

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message{enter}')
      
      await waitFor(() => {
        expect(mockOnMessage).toHaveBeenCalled()
      })
    })

    test('does not send on Shift+Enter', async () => {
      const user = userEvent.setup()
      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message{shift>}{enter}{/shift}')
      
      expect(mockOnMessage).not.toHaveBeenCalled()
      expect(textarea.value).toBe('Test message\n')
    })

    test('disables input when typing', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ response: 'Response', extractedParameters: {} })
          }), 100)
        )
      )

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      const sendButton = screen.getByRole('button')
      
      await user.type(textarea, 'Test message')
      await user.click(sendButton)
      
      expect(textarea).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })
  })

  describe('API Integration', () => {
    test('makes correct API call', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'AI response',
          extractedParameters: {}
        })
      })

      const conversationHistory = [{ role: 'user', content: 'Previous message' }]
      const currentParameters = { vesselType: 'Test' }

      render(
        <ChatbotPanel 
          {...defaultProps} 
          conversationHistory={conversationHistory}
          currentParameters={currentParameters}
        />
      )
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            message: 'Test message',
            context: {
              currentParameters,
              conversationHistory: conversationHistory.slice(-10)
            }
          })
        })
      })
    })

    test('handles API error gracefully', async () => {
      const user = userEvent.setup()
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(mockOnMessage).toHaveBeenCalledWith(
          'Test message',
          'Sorry, I encountered an error processing your message. Please try again.',
          null
        )
      })
    })

    test('handles non-ok response', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(mockOnMessage).toHaveBeenCalledWith(
          'Test message',
          'Sorry, I encountered an error processing your message. Please try again.',
          null
        )
      })
    })
  })

  describe('Typing Indicator', () => {
    test('shows typing indicator when processing', async () => {
      const user = userEvent.setup()
      
      // Mock delayed response
      let resolvePromise
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          resolvePromise = resolve
        })
      )

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button'))
      
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
      
      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({ response: 'Response', extractedParameters: {} })
      })
      
      await waitFor(() => {
        expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      const sendButton = screen.getByRole('button')
      
      expect(textarea).toBeInTheDocument()
      expect(sendButton).toBeInTheDocument()
    })

    test('focuses input after sending message', async () => {
      const user = userEvent.setup()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', extractedParameters: {} })
      })

      render(<ChatbotPanel {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Describe your vessel investment...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(textarea.value).toBe('')
      })
    })
  })
})