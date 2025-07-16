/**
 * Integration tests for the Pitch Generator
 * Testing complete flows including generation, cancellation, error handling, and preferences
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { ErrorDisplay } from '@/components/forms/error-display'
import { IdeaValidationFeedback } from '@/components/forms/idea-validation-feedback'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { useEnhancedPitchGenerator } from '@/hooks/use-enhanced-pitch-generator'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'

// Mock fetch
global.fetch = jest.fn()

// Mock AbortController
const mockAbort = jest.fn()
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: { aborted: false },
  abort: mockAbort
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123')
  }
})

// Mock components for testing
jest.mock('@/components/forms/error-display', () => ({
  ErrorDisplay: jest.fn(({ error, onRetry, onDismiss, cooldownSeconds, retryDisabled }) => (
    <div data-testid="error-display">
      <div data-testid="error-type">{error?.type}</div>
      <div data-testid="error-message">{error?.message}</div>
      <div data-testid="cooldown-seconds">{cooldownSeconds || 0}</div>
      <button 
        data-testid="retry-button" 
        onClick={onRetry}
        disabled={retryDisabled || cooldownSeconds > 0}
      >
        Réessayer {cooldownSeconds > 0 ? `(${cooldownSeconds}s)` : ''}
      </button>
      <button data-testid="dismiss-button" onClick={onDismiss}>Fermer</button>
    </div>
  ))
}))

jest.mock('@/components/forms/idea-validation-feedback', () => ({
  IdeaValidationFeedback: jest.fn(({ validationResult, currentLength, minLength, maxLength }) => (
    <div data-testid="validation-feedback">
      <div data-testid="validation-score">{validationResult?.score}</div>
      <div data-testid="validation-valid">{validationResult?.isValid ? 'valid' : 'invalid'}</div>
      <div data-testid="validation-suggestions">{validationResult?.suggestions?.length || 0}</div>
      <div data-testid="current-length">{currentLength || 0}</div>
      <div data-testid="min-length">{minLength || 0}</div>
      <div data-testid="max-length">{maxLength || 0}</div>
    </div>
  ))
}))

// Mock the PitchGeneratorContainer component
jest.mock('@/components/forms/pitch-generator-container', () => ({
  PitchGeneratorContainer: () => (
    <div data-testid="pitch-generator-container">
      <div data-testid="pitch-generator-form">Mocked Pitch Generator</div>
    </div>
  )
}))

// Mock timers for testing retry delays
jest.useFakeTimers()

describe('Pitch Generator Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Complete Generation Flow - Success', () => {
    it('should handle the complete generation flow successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pitch: {
            tagline: 'Test tagline',
            problem: 'Test problem',
            solution: 'Test solution',
            targetMarket: 'Test market',
            businessModel: 'Test model',
            competitiveAdvantage: 'Test advantage',
            pitchDeck: {
              slides: [{ title: 'Test', content: 'Test', order: 1 }]
            }
          }
        })
      } as Response)

      const onSuccess = jest.fn()
      const { result } = renderHook(() => useEnhancedPitchGenerator({
        onSuccess
      }))

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Test idea for complete flow', 'professional')
      })

      // Verify final state
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBeDefined()
      expect(result.current.state.pitch?.tagline).toBe('Test tagline')
      expect(result.current.state.pitch?.problem).toBe('Test problem')
      expect(result.current.state.error).toBe(null)
      expect(onSuccess).toHaveBeenCalledWith(result.current.state.pitch)

      // Verify localStorage was called to save preferences
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('Test idea for complete flow')
      )
    })

    it('should handle complete flow with preferences persistence', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pitch: {
            tagline: 'Success tagline',
            problem: 'Success problem',
            solution: 'Success solution',
            targetMarket: 'Success market',
            businessModel: 'Success model',
            competitiveAdvantage: 'Success advantage',
            pitchDeck: {
              slides: [{ title: 'Success', content: 'Success', order: 1 }]
            }
          }
        })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Set preferences before generation
      act(() => {
        result.current.savePreferences({
          defaultTone: 'startup',
          autoSave: true,
          enableRetry: true,
          maxRetryAttempts: 2
        })
      })

      // Generate pitch
      await act(async () => {
        await result.current.generatePitch('Complete flow test idea', 'startup')
      })

      // Verify success state
      expect(result.current.state.pitch).toBeDefined()
      expect(result.current.state.error).toBe(null)
      
      // Verify preferences were saved with idea history
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('Complete flow test idea')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"startup"')
      )
    })
  })

  describe('Error Handling and Retry', () => {
    it('should handle network errors with automatic retry', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // First attempt fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            pitch: {
              tagline: 'Retry success tagline',
              problem: 'Retry success problem',
              solution: 'Retry success solution',
              targetMarket: 'Retry success market',
              businessModel: 'Retry success model',
              competitiveAdvantage: 'Retry success advantage',
              pitchDeck: {
                slides: [{ title: 'Retry', content: 'Retry', order: 1 }]
              }
            }
          })
        } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Enable auto-retry
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 3 })
      })

      // Start generation (will fail first time)
      await act(async () => {
        result.current.generatePitch('Network retry test idea', 'professional')
      })

      // Wait for first attempt to fail
      await waitFor(() => {
        expect(result.current.state.error).toBeDefined()
      })

      // Fast forward through retry delay
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for second attempt to succeed
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
        expect(result.current.state.error).toBe(null)
      })
      
      // Verify retry count and fetch calls
      expect(result.current.state.retryCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle manual retry after error', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // First attempt fails, manual retry succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            pitch: {
              tagline: 'Manual retry success',
              problem: 'Manual retry problem',
              solution: 'Manual retry solution',
              targetMarket: 'Manual retry market',
              businessModel: 'Manual retry model',
              competitiveAdvantage: 'Manual retry advantage',
              pitchDeck: {
                slides: [{ title: 'Manual', content: 'Manual', order: 1 }]
              }
            }
          })
        } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Disable auto-retry
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      // Generate pitch (will fail)
      await act(async () => {
        await result.current.generatePitch('Manual retry test idea', 'professional')
      })

      // Verify error state
      expect(result.current.state.error).toBeDefined()

      // Manual retry
      await act(async () => {
        await result.current.retryGeneration()
      })

      // Wait for retry to succeed
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
        expect(result.current.state.error).toBe(null)
      })
      
      // Verify retry count and fetch calls
      expect(result.current.state.retryCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Request Cancellation', () => {
    it('should cancel ongoing requests when requested', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(controlledPromise as any)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Start generation
      act(() => {
        result.current.generatePitch('Cancellation test idea', 'professional')
      })

      // Verify loading state
      expect(result.current.state.isLoading).toBe(true)
      expect(result.current.state.canCancel).toBe(true)

      // Cancel the request
      act(() => {
        result.current.cancelGeneration()
      })

      // Verify cancellation
      expect(mockAbort).toHaveBeenCalled()
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.canCancel).toBe(false)

      // Resolve the promise (should have no effect since we cancelled)
      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({
            pitch: {
              tagline: 'Test tagline',
              problem: 'Test problem',
              solution: 'Test solution',
              targetMarket: 'Test market',
              businessModel: 'Test model',
              competitiveAdvantage: 'Test advantage',
              pitchDeck: {
                slides: [{ title: 'Test', content: 'Test', order: 1 }]
              }
            }
          })
        })
      })

      // Verify state remains cancelled
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
    })

    it('should handle cancellation during retry attempts', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // First attempt fails, then we'll cancel during retry
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Enable auto-retry
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 3 })
      })

      // Start generation (will fail first time)
      await act(async () => {
        result.current.generatePitch('Retry cancellation test', 'professional')
      })

      // Wait for first attempt to fail and retry to be scheduled
      await waitFor(() => {
        expect(result.current.state.error).toBeDefined()
      })

      // Cancel during retry delay
      act(() => {
        result.current.cancelGeneration()
      })

      // Verify cancellation stopped the retry
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.canCancel).toBe(false)
      
      // Fast forward through what would have been retry delay
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Verify no additional fetch calls were made
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Preferences Persistence', () => {
    it('should save and restore preferences', async () => {
      // Setup initial preferences
      const initialPrefs = {
        defaultTone: 'fun',
        autoSave: false,
        showSuggestions: false,
        enableRetry: true,
        maxRetryAttempts: 5,
        ideaHistory: ['Previous idea 1', 'Previous idea 2']
      }

      // Mock localStorage to simulate saved preferences
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify(initialPrefs)
        }
        return null
      })

      // Render the hook
      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Verify preferences loaded
      expect(result.current.state.preferences.defaultTone).toBe('fun')
      expect(result.current.state.preferences.autoSave).toBe(false)
      expect(result.current.state.preferences.ideaHistory).toHaveLength(2)

      // Update preferences
      act(() => {
        result.current.savePreferences({ defaultTone: 'tech', maxRetryAttempts: 3 })
      })

      // Verify preferences updated
      expect(result.current.state.preferences.defaultTone).toBe('tech')
      expect(result.current.state.preferences.maxRetryAttempts).toBe(3)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"tech"')
      )
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Should not throw when saving preferences fails
      expect(() => {
        act(() => {
          result.current.savePreferences({ defaultTone: 'startup' })
        })
      }).not.toThrow()

      // State should still be updated even if localStorage fails
      expect(result.current.state.preferences.defaultTone).toBe('startup')
    })
  })

  describe('Real-time Validation with Feedback', () => {
    it('should validate ideas in real-time and provide feedback', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Get validation results for different ideas
      const emptyValidation = result.current.validateIdea('')
      const shortValidation = result.current.validateIdea('App')
      const vagueValidation = result.current.validateIdea('Une application mobile')
      const betterValidation = result.current.validateIdea('Une application mobile qui résout le problème de transport urbain')
      const completeValidation = result.current.validateIdea(
        'Une application mobile qui optimise les trajets quotidiens des employés en entreprise en proposant des solutions de covoiturage intelligent pour les entreprises de plus de 100 employés'
      )
      
      // Test validation results directly
      expect(emptyValidation.isValid).toBe(false)
      expect(emptyValidation.score).toBe(0)
      
      expect(shortValidation.isValid).toBe(false)
      expect(shortValidation.score).toBeLessThan(30)
      
      expect(vagueValidation.isValid).toBe(true)
      expect(vagueValidation.score).toBeGreaterThan(30)
      expect(vagueValidation.suggestions.length).toBeGreaterThan(0)
      
      expect(betterValidation.isValid).toBe(true)
      expect(betterValidation.score).toBeGreaterThan(vagueValidation.score)
      
      expect(completeValidation.isValid).toBe(true)
      expect(completeValidation.score).toBeGreaterThan(70)
      expect(completeValidation.suggestions.length).toBeLessThanOrEqual(2)

      // Test validation feedback component rendering
      const { rerender, getByTestId } = render(
        <IdeaValidationFeedback 
          validationResult={emptyValidation}
          currentLength={0}
          minLength={20}
          maxLength={500}
        />
      )
      
      expect(getByTestId('validation-valid').textContent).toBe('invalid')
      expect(getByTestId('validation-score').textContent).toBe('0')
      expect(getByTestId('current-length').textContent).toBe('0')
      
      // Test with better validation
      rerender(
        <IdeaValidationFeedback 
          validationResult={completeValidation}
          currentLength={200}
          minLength={20}
          maxLength={500}
        />
      )
      
      expect(getByTestId('validation-valid').textContent).toBe('valid')
      expect(parseInt(getByTestId('validation-score').textContent || '0')).toBeGreaterThan(70)
      expect(getByTestId('current-length').textContent).toBe('200')
    })

    it('should provide contextual suggestions based on idea content', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Test different types of suggestions
      const vagueIdea = result.current.getSuggestions('Une app')
      const problemFocusedIdea = result.current.getSuggestions('Une application qui résout un problème')
      const targetFocusedIdea = result.current.getSuggestions('Une application pour les entreprises qui optimise les processus')
      
      // Vague idea should get multiple suggestions
      expect(vagueIdea.length).toBeGreaterThan(2)
      expect(vagueIdea.some(s => s.type === 'missing_target')).toBe(true)
      expect(vagueIdea.some(s => s.type === 'vague_problem')).toBe(true)
      
      // Problem-focused idea should get target suggestions
      expect(problemFocusedIdea.some(s => s.type === 'missing_target')).toBe(true)
      
      // Target-focused idea should get fewer suggestions
      expect(targetFocusedIdea.length).toBeLessThan(vagueIdea.length)
    })
  })

  describe('Complete Generation Flow - Failures', () => {
    it('should handle complete flow with server errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error'
        })
      } as Response)

      const onError = jest.fn()
      const { result } = renderHook(() => useEnhancedPitchGenerator({
        onError
      }))

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Server error test idea', 'professional')
      })

      // Verify error state
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
      expect(result.current.state.error).toBeDefined()
      expect(onError).toHaveBeenCalledWith(result.current.state.error)
    })

    it('should handle complete flow with validation errors', async () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Try to generate with invalid idea
      await act(async () => {
        await result.current.generatePitch('', 'professional')
      })

      // Verify validation prevented generation
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
      expect(result.current.state.error).toBeDefined()
    })
  })

  describe('Component Integration Tests', () => {
    it('should render PitchGeneratorContainer without errors', () => {
      const { getByTestId } = render(<PitchGeneratorContainer />)
      expect(getByTestId('pitch-generator-container')).toBeInTheDocument()
    })

    it('should render ErrorDisplay with proper error handling', () => {
      const mockError: EnhancedError = {
        id: 'test-error',
        type: ErrorType.NETWORK,
        message: 'Test network error',
        timestamp: new Date(),
        context: {
          idea: 'Test idea',
          tone: 'professional',
          retryCount: 0,
          userAgent: 'test'
        },
        retryable: true,
        suggestedAction: 'Check your connection'
      }

      const onRetry = jest.fn()
      const onDismiss = jest.fn()

      const { getByTestId } = render(
        <ErrorDisplay 
          error={mockError}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      )

      expect(getByTestId('error-display')).toBeInTheDocument()
      expect(getByTestId('error-type').textContent).toBe(ErrorType.NETWORK)
      expect(getByTestId('error-message').textContent).toBe('Test network error')

      // Test retry functionality
      fireEvent.click(getByTestId('retry-button'))
      expect(onRetry).toHaveBeenCalledTimes(1)

      // Test dismiss functionality
      fireEvent.click(getByTestId('dismiss-button'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should render IdeaValidationFeedback with validation results', () => {
      const mockValidation = {
        isValid: true,
        score: 85,
        errors: [],
        warnings: [],
        suggestions: [
          {
            type: 'add_context' as const,
            message: 'Consider adding more market context',
            priority: 'medium' as const
          }
        ]
      }

      const { getByTestId } = render(
        <IdeaValidationFeedback 
          validationResult={mockValidation}
          currentLength={150}
          minLength={20}
          maxLength={500}
        />
      )

      expect(getByTestId('validation-feedback')).toBeInTheDocument()
      expect(getByTestId('validation-valid').textContent).toBe('valid')
      expect(getByTestId('validation-score').textContent).toBe('85')
      expect(getByTestId('validation-suggestions').textContent).toBe('1')
      expect(getByTestId('current-length').textContent).toBe('150')
    })
  })
})