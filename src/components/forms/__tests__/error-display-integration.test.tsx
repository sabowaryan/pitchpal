/**
 * Integration tests for the ErrorDisplay component
 * Testing complete flows including error handling, retry, and user interactions
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
    idea: 'Test idea',
    tone: 'professional',
    retryCount: 0,
    userAgent: 'test-agent'
  },
  retryable: true,
  suggestedAction: 'Test suggested action',
  helpUrl: '/help/test',
  ...overrides
})

describe('ErrorDisplay Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Complete Error Handling Flow', () => {
    it('should handle the complete error display and retry flow', async () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      const onDismiss = jest.fn()
      
      const { rerender } = render(
        <ErrorDisplay 
          error={error} 
          onRetry={onRetry} 
          onDismiss={onDismiss} 
          cooldownSeconds={3} 
        />
      )

      // 1. Initial render with cooldown
      expect(screen.getByText('Problème de connexion')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('Nouvelle tentative possible dans 3 secondes')).toBeInTheDocument()
      
      const retryButton = screen.getByRole('button', { name: /réessayer \(3s\)/i })
      expect(retryButton).toBeDisabled()

      // 2. Advance timer to reduce cooldown
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      expect(screen.getByText('Nouvelle tentative possible dans 2 secondes')).toBeInTheDocument()
      
      // 3. Advance timer to end cooldown
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        const enabledButton = screen.getByRole('button', { name: /réessayer$/i })
        expect(enabledButton).not.toBeDisabled()
      })

      // 4. Click retry button
      fireEvent.click(screen.getByRole('button', { name: /réessayer$/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
      
      // 5. Simulate retry in progress with updated error
      const updatedError = {
        ...error,
        context: {
          ...error.context,
          retryCount: 1
        }
      }
      
      rerender(
        <ErrorDisplay 
          error={updatedError} 
          onRetry={onRetry} 
          onDismiss={onDismiss} 
          cooldownSeconds={5} // Longer cooldown after retry
          retryDisabled={true} // Disable during retry
        />
      )
      
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeDisabled()
      
      // 6. Dismiss the error
      fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should handle different error types with appropriate actions', () => {
      // 1. Test network error
      const networkError = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      const { rerender } = render(<ErrorDisplay error={networkError} onRetry={onRetry} />)
      
      expect(screen.getByText('Problème de connexion')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /aide/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /support/i })).not.toBeInTheDocument()
      
      // Click help button
      fireEvent.click(screen.getByRole('button', { name: /aide/i }))
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/help/network-issues',
        '_blank',
        'noopener,noreferrer'
      )
      
      // 2. Test server error
      const serverError = createMockError(ErrorType.SERVER)
      rerender(<ErrorDisplay error={serverError} onRetry={onRetry} />)
      
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /support/i })).toBeInTheDocument()
      
      // Click support button
      fireEvent.click(screen.getByRole('button', { name: /support/i }))
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@pitchgenerator.com'),
        '_blank'
      )
      
      // 3. Test validation error
      const validationError = createMockError(ErrorType.VALIDATION, { retryable: false })
      rerender(<ErrorDisplay error={validationError} onRetry={onRetry} />)
      
      expect(screen.getByText('Erreur de validation')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument()
    })
  })

  describe('Error Context and Debugging', () => {
    it('should display technical details in development mode', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV
      
      // Set to development mode
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
        writable: true
      })
      
      const error = createMockError(ErrorType.NETWORK, {
        context: {
          idea: 'Test idea with context',
          tone: 'professional',
          retryCount: 2,
          userAgent: 'test-agent'
        }
      })
      
      render(<ErrorDisplay error={error} />)
      
      // 1. Check for technical details section
      const detailsToggle = screen.getByText('Détails techniques (développement)')
      expect(detailsToggle).toBeInTheDocument()
      
      // 2. Expand technical details
      fireEvent.click(detailsToggle)
      
      // 3. Check for context information
      expect(screen.getByText(/"idea": "Test idea with context"/)).toBeInTheDocument()
      expect(screen.getByText(/"retryCount": 2/)).toBeInTheDocument()
      
      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true,
        writable: true
      })
    })

    it('should not display technical details in production mode', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV
      
      // Set to production mode
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
        writable: true
      })
      
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      // Check that technical details are not shown
      expect(screen.queryByText('Détails techniques')).not.toBeInTheDocument()
      
      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true,
        writable: true
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should maintain focus management for interactive elements', () => {
      const error = createMockError(ErrorType.NETWORK)
      const onRetry = jest.fn()
      render(<ErrorDisplay error={error} onRetry={onRetry} />)
      
      // 1. Focus retry button
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      retryButton.focus()
      expect(document.activeElement).toBe(retryButton)
      
      // 2. Test keyboard navigation
      fireEvent.keyDown(retryButton, { key: 'Tab' })
      const helpButton = screen.getByRole('button', { name: /aide/i })
      helpButton.focus()
      expect(document.activeElement).toBe(helpButton)
    })

    it('should have proper ARIA attributes for accessibility', () => {
      const error = createMockError(ErrorType.NETWORK)
      render(<ErrorDisplay error={error} />)
      
      // Check for proper role and aria attributes
      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive')
    })
  })
})