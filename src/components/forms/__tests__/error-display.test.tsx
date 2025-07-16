import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorDisplay } from '../error-display'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
})

// Helper function to create mock errors
const createMockError = (type: ErrorType, overrides: Partial<EnhancedError> = {}): EnhancedError => ({
  id: 'test-error-id',
  type,
  message: 'Test error message',
  timestamp: new Date(),
  context: {
    retryCount: 0,
    userAgent: 'test-agent'
  },
  retryable: true,
  suggestedAction: 'Test suggested action',
  helpUrl: '/help/test',
  ...overrides
})

describe('ErrorDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error Type Display', () => {
    it('displays network error with correct styling and icon', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Problème de connexion')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('Vérifiez votre connexion internet et réessayez')).toBeInTheDocument()
    })

    it('displays validation error with correct styling', () => {
      const error = createMockError(ErrorType.VALIDATION)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Erreur de validation')).toBeInTheDocument()
      expect(screen.getByText('Corrigez les erreurs de saisie ci-dessus')).toBeInTheDocument()
    })

    it('displays timeout error with correct styling', () => {
      const error = createMockError(ErrorType.TIMEOUT)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Délai d\'attente dépassé')).toBeInTheDocument()
      expect(screen.getByText('Essayez avec une idée plus courte ou réessayez plus tard')).toBeInTheDocument()
    })

    it('displays server error with correct styling', () => {
      const error = createMockError(ErrorType.SERVER)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument()
      expect(screen.getByText('Nos serveurs rencontrent des difficultés temporaires')).toBeInTheDocument()
    })

    it('displays AI service error with correct styling', () => {
      const error = createMockError(ErrorType.AI_SERVICE)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Service IA indisponible')).toBeInTheDocument()
      expect(screen.getByText('Le service de génération IA est temporairement indisponible')).toBeInTheDocument()
    })

    it('displays unknown error with fallback styling', () => {
      const error = createMockError(ErrorType.UNKNOWN)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Erreur inattendue')).toBeInTheDocument()
      expect(screen.getByText('Une erreur inattendue s\'est produite')).toBeInTheDocument()
    })
  })

  describe('Suggested Actions', () => {
    it('displays suggested action when provided', () => {
      const error = createMockError(ErrorType.NETWORK, {
        suggestedAction: 'Custom suggested action'
      })
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('💡 Custom suggested action')).toBeInTheDocument()
    })

    it('does not display suggested action section when not provided', () => {
      const error = createMockError(ErrorType.NETWORK, {
        suggestedAction: undefined
      })
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByText(/💡/)).not.toBeInTheDocument()
    })
  })

  describe('Retry Functionality', () => {
    it('shows retry button for retryable errors', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      expect(retryButton).toBeInTheDocument()
      expect(retryButton).not.toBeDisabled()
    })

    it('calls onRetry when retry button is clicked', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      fireEvent.click(retryButton)
      
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('disables retry button when retryDisabled is true', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} retryDisabled={true} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      expect(retryButton).toBeDisabled()
    })

    it('does not show retry button for validation errors', () => {
      const error = createMockError(ErrorType.VALIDATION)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument()
    })
  })

  describe('Cooldown Functionality', () => {
    it('displays cooldown timer when cooldownSeconds is provided', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} cooldownSeconds={5} />)
      
      expect(screen.getByText('Nouvelle tentative possible dans 5 secondes')).toBeInTheDocument()
    })

    it('updates cooldown timer every second', async () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} cooldownSeconds={3} />)
      
      expect(screen.getByText('Nouvelle tentative possible dans 3 secondes')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Nouvelle tentative possible dans 2 secondes')).toBeInTheDocument()
      }, { timeout: 1500 })
    })

    it('disables retry button during cooldown', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} cooldownSeconds={5} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer \(5s\)/i })
      expect(retryButton).toBeDisabled()
    })

    it('enables retry button after cooldown expires', async () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} cooldownSeconds={1} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer \(1s\)/i })
      expect(retryButton).toBeDisabled()
      
      await waitFor(() => {
        const enabledButton = screen.getByRole('button', { name: /réessayer$/i })
        expect(enabledButton).not.toBeDisabled()
      }, { timeout: 1500 })
    })
  })

  describe('Help and Support Actions', () => {
    it('shows help button for all error types', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByRole('button', { name: /aide/i })).toBeInTheDocument()
    })

    it('opens help URL when help button is clicked', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      const helpButton = screen.getByRole('button', { name: /aide/i })
      fireEvent.click(helpButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/help/network-issues',
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('shows support button for server and AI service errors', () => {
      const serverError = createMockError(ErrorType.SERVER)
      const { rerender } = render(<ErrorDisplay error={serverError} />)
      
      expect(screen.getByRole('button', { name: /support/i })).toBeInTheDocument()
      
      const aiError = createMockError(ErrorType.AI_SERVICE)
      rerender(<ErrorDisplay error={aiError} />)
      
      expect(screen.getByRole('button', { name: /support/i })).toBeInTheDocument()
    })

    it('does not show support button for network errors', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByRole('button', { name: /support/i })).not.toBeInTheDocument()
    })

    it('opens support email when support button is clicked', () => {
      const error = createMockError(ErrorType.SERVER)
      render(<ErrorDisplay error={error} />)
      
      const supportButton = screen.getByRole('button', { name: /support/i })
      fireEvent.click(supportButton)
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@pitchgenerator.com'),
        '_blank'
      )
    })
  })

  describe('Dismiss Functionality', () => {
    it('shows dismiss button when onDismiss is provided', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onDismiss = jest.fn()
      render(<ErrorDisplay error={error} onDismiss={onDismiss} />)
      
      expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument()
    })

    it('calls onDismiss when dismiss button is clicked', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onDismiss = jest.fn()
      render(<ErrorDisplay error={error} onDismiss={onDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /fermer/i })
      fireEvent.click(dismissButton)
      
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not show dismiss button when onDismiss is not provided', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByRole('button', { name: /fermer/i })).not.toBeInTheDocument()
    })
  })

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true,
        writable: true
      })
    })

    it('shows technical details in development mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
        writable: true
      })
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Détails techniques (développement)')).toBeInTheDocument()
    })

    it('does not show technical details in production mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
        writable: true
      })
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByText('Détails techniques (développement)')).not.toBeInTheDocument()
    })

    it('expands technical details when clicked in development mode', () => {
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
        writable: true
      })
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      const detailsToggle = screen.getByText('Détails techniques (développement)')
      fireEvent.click(detailsToggle)
      
      expect(screen.getByText(/"id": "test-error-id"/)).toBeInTheDocument()
      expect(screen.getByText(/"type": "network"/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      // Check that buttons have proper roles and are accessible
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /aide/i })).toBeInTheDocument()
    })

    it('maintains focus management for interactive elements', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      retryButton.focus()
      expect(document.activeElement).toBe(retryButton)
    })
  })
})