/**
 * Integration tests for the enhanced pitch generator
 * Testing complete flows including success, failures, cancellation, and preferences
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useEnhancedPitchGenerator } from '../use-enhanced-pitch-generator'
import { ErrorType } from '@/types/enhanced-errors'

// Mock fetch
global.fetch = jest.fn()

// Mock AbortController
const mockAbort = jest.fn()
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: { aborted: false },
  abort: mockAbort
}))

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123')
  }
})

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

// Mock timers for testing retry delays
jest.useFakeTimers()

describe('Enhanced Pitch Generator Integration Tests', () => {
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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Validate idea before submission
      const validationResult = result.current.validateIdea('Une application mobile pour résoudre le problème de transport urbain')
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)

      // 2. Generate pitch
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 3. Verify state transitions
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBeDefined()
      expect(result.current.state.error).toBe(null)
      expect(result.current.state.pitch?.tagline).toBe('Test tagline')
      expect(result.current.state.pitch?.problem).toBe('Test problem')

      // 4. Verify idea was saved to history
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('Une application mobile pour résoudre le problème de transport urbain')
      )
    })

    it('should handle real-time validation feedback during input', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Empty input
      const emptyResult = result.current.validateIdea('')
      expect(emptyResult.isValid).toBe(false)
      expect(emptyResult.errors[0].type).toBe('required')
      expect(emptyResult.score).toBe(0)

      // 2. Too short input
      const shortResult = result.current.validateIdea('App')
      expect(shortResult.isValid).toBe(false)
      expect(shortResult.errors[0].type).toBe('minLength')
      expect(shortResult.score).toBeLessThan(50)

      // 3. Vague idea with suggestions
      const vagueResult = result.current.validateIdea('Une application mobile')
      expect(vagueResult.isValid).toBe(true) // Valid but low quality
      expect(vagueResult.warnings).toHaveLength(1)
      expect(vagueResult.suggestions.length).toBeGreaterThan(0)
      expect(vagueResult.score).toBeLessThan(50)

      // 4. Better idea with context
      const betterResult = result.current.validateIdea('Une application mobile pour la gestion des transports')
      expect(betterResult.isValid).toBe(true)
      expect(betterResult.score).toBeGreaterThan(vagueResult.score)

      // 5. High quality idea
      const highQualityResult = result.current.validateIdea(
        'Une application mobile qui optimise les trajets quotidiens des employés en entreprise en proposant des solutions de covoiturage intelligent'
      )
      expect(highQualityResult.isValid).toBe(true)
      expect(highQualityResult.score).toBeGreaterThan(70)
      expect(highQualityResult.suggestions.length).toBeLessThanOrEqual(2) // Fewer suggestions for good ideas
    })
  })

  describe('Complete Generation Flow - Failures', () => {
    it('should handle network errors with retry', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // First attempt fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Enable auto-retry
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 3 })
      })

      // 1. Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Verify error state after first attempt
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)
      expect(result.current.state.retryCount).toBe(0)

      // 3. Fast forward through retry delay
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // 4. Verify success after retry
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
        expect(result.current.state.error).toBe(null)
      })

      expect(result.current.state.retryCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle server errors with appropriate messages', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server is temporarily unavailable' })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Disable auto-retry through preferences
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      // 1. Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Verify error state
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
      expect(result.current.state.error?.message).toContain('serveur')
      expect(result.current.state.error?.retryable).toBe(true)
      expect(result.current.state.error?.suggestedAction).toBeDefined()
    })

    it('should handle validation errors without retrying', async () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Enable auto-retry through preferences (but validation errors should still not retry)
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 3 })
      })

      // 1. Try to generate with empty idea
      await act(async () => {
        await result.current.generatePitch('', 'professional')
      })

      // 2. Verify error state
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe(ErrorType.VALIDATION)
      expect(result.current.state.error?.retryable).toBe(false)

      // 3. Fast forward through potential retry delay
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // 4. Verify no retry was attempted
      expect(result.current.state.retryCount).toBe(0)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle timeout errors with retry', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // First attempt times out, second succeeds
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({
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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Enable auto-retry
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 3 })
      })

      // 1. Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Verify error state after first attempt
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe(ErrorType.TIMEOUT)

      // 3. Fast forward through retry delay
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // 4. Verify success after retry
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
        expect(result.current.state.error).toBe(null)
      })
    })

    it('should handle malformed API responses', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalidResponse: true })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Verify error state
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.message).toContain('Réponse invalide')
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

      const onCancel = jest.fn()
      const { result } = renderHook(() => useEnhancedPitchGenerator({ onCancel }))

      // 1. Start generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Verify loading state
      expect(result.current.state.isLoading).toBe(true)
      expect(result.current.state.canCancel).toBe(true)

      // 3. Cancel the request
      act(() => {
        result.current.cancelGeneration()
      })

      // 4. Verify cancellation
      expect(mockAbort).toHaveBeenCalled()
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.canCancel).toBe(false)
      expect(onCancel).toHaveBeenCalled()

      // 5. Resolve the promise (should have no effect since we cancelled)
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

      // 6. Verify state remains cancelled
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
    })

    it('should clean up resources after cancellation', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockReturnValueOnce(new Promise(() => { })) // Never resolves

      const { result, unmount } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Start generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Unmount component (should trigger cleanup)
      unmount()

      // 3. Verify abort was called
      expect(mockAbort).toHaveBeenCalled()
    })

    it('should be able to restart generation after cancellation', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // First request will be cancelled
      mockFetch.mockReturnValueOnce(new Promise(() => { }))

      // Second request will succeed
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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Start first generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 2. Cancel the request
      act(() => {
        result.current.cancelGeneration()
      })

      // 3. Start second generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // 4. Verify success
      expect(result.current.state.pitch).toBeDefined()
      expect(result.current.state.error).toBe(null)
    })
  })

  describe('Preferences Persistence', () => {
    it('should save and restore preferences', async () => {
      // 1. Setup initial preferences
      const initialPrefs = {
        defaultTone: 'fun' as const,
        autoSave: false,
        showSuggestions: false,
        enableRetry: true,
        maxRetryAttempts: 5,
        ideaHistory: []
      }

      // Mock localStorage to simulate saved preferences
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify(initialPrefs)
        }
        return null
      })

      // 2. First render should load preferences
      const { result, rerender } = renderHook(() => useEnhancedPitchGenerator())

      expect(result.current.state.preferences.defaultTone).toBe('fun')
      expect(result.current.state.preferences.autoSave).toBe(false)
      expect(result.current.state.preferences.enableRetry).toBe(true)

      // 3. Update preferences
      act(() => {
        result.current.savePreferences({ defaultTone: 'tech', maxRetryAttempts: 3 })
      })

      expect(result.current.state.preferences.defaultTone).toBe('tech')
      expect(result.current.state.preferences.maxRetryAttempts).toBe(3)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"tech"')
      )

      // 4. Simulate component remount
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify({
            ...initialPrefs,
            defaultTone: 'tech',
            maxRetryAttempts: 3
          })
        }
        return null
      })

      // Rerender to simulate remount
      rerender()

      // 5. Verify preferences were restored
      expect(result.current.state.preferences.defaultTone).toBe('tech')
      expect(result.current.state.preferences.maxRetryAttempts).toBe(3)
      expect(result.current.state.preferences.autoSave).toBe(false)
    })

    it('should handle localStorage errors gracefully', async () => {
      // 1. Setup localStorage to throw error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      // 2. Component should still render with default preferences
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      expect(result.current.state.preferences.defaultTone).toBe('professional')
      expect(result.current.state.preferences.autoSave).toBe(true)

      // 3. Saving preferences should not throw
      act(() => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error('localStorage not available')
        })

        // Should not throw
        result.current.savePreferences({ defaultTone: 'tech' })
      })

      // 4. In-memory state should still update
      expect(result.current.state.preferences.defaultTone).toBe('tech')
    })

    it('should save idea to history on successful generation', async () => {
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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Enable auto-save
      act(() => {
        result.current.savePreferences({ autoSave: true })
      })

      const testIdea = 'Une application mobile pour résoudre le problème de transport urbain'

      // 2. Generate pitch
      await act(async () => {
        await result.current.generatePitch(testIdea, 'professional')
      })

      // 3. Verify idea was saved to history
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining(testIdea)
      )

      // 4. Disable auto-save
      act(() => {
        result.current.savePreferences({ autoSave: false })
      })

      const secondIdea = 'Une autre application innovante'

      // 5. Generate another pitch
      await act(async () => {
        await result.current.generatePitch(secondIdea, 'professional')
      })

      // 6. Verify second idea was not saved to history
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]
      const savedData = JSON.parse(lastCall[1])
      expect(savedData.ideaHistory).not.toContain(secondIdea)
    })

    it('should limit history to maximum size', async () => {
      // 1. Setup initial preferences with 10 ideas
      const initialIdeas = Array.from({ length: 10 }, (_, i) => `Existing idea ${i + 1}`)

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify({
            defaultTone: 'professional',
            autoSave: true,
            showSuggestions: true,
            enableRetry: true,
            maxRetryAttempts: 3,
            ideaHistory: initialIdeas
          })
        }
        return null
      })

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

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 2. Verify initial history loaded
      expect(result.current.state.preferences.ideaHistory).toHaveLength(10)
      expect(result.current.state.preferences.ideaHistory[0]).toBe('Existing idea 1')

      const newIdea = 'Brand new idea'

      // 3. Generate pitch with new idea
      await act(async () => {
        await result.current.generatePitch(newIdea, 'professional')
      })

      // 4. Verify history was updated correctly
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]
      const savedData = JSON.parse(lastCall[1])

      expect(savedData.ideaHistory).toHaveLength(10) // Still 10 items
      expect(savedData.ideaHistory[0]).toBe(newIdea) // New idea at front
      expect(savedData.ideaHistory).not.toContain('Existing idea 10') // Last item removed
    })
  })

  describe('Real-time Validation with Feedback', () => {
    it('should provide contextual suggestions based on idea content', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Test vague problem suggestion
      const vagueIdea = 'Une application pour les entreprises'
      const vagueResult = result.current.validateIdea(vagueIdea)
      const problemSuggestions = vagueResult.suggestions.filter(s => s.type === 'vague_problem')

      expect(vagueResult.isValid).toBe(true) // Valid but low quality
      expect(problemSuggestions.length).toBeGreaterThan(0)
      expect(vagueResult.score).toBeLessThan(50)

      // 2. Test missing target market suggestion
      const noTargetIdea = 'Une solution qui résout les problèmes de comptabilité'
      const noTargetResult = result.current.validateIdea(noTargetIdea)
      const targetSuggestions = noTargetResult.suggestions.filter(s => s.type === 'missing_target')

      expect(noTargetResult.isValid).toBe(true)
      expect(targetSuggestions.length).toBeGreaterThan(0)

      // 3. Test missing solution suggestion
      const problemOnlyIdea = 'Il y a un problème avec la comptabilité des entreprises'
      const problemOnlyResult = result.current.validateIdea(problemOnlyIdea)
      const solutionSuggestions = problemOnlyResult.suggestions.filter(s => s.type === 'unclear_solution')

      expect(problemOnlyResult.isValid).toBe(true)
      expect(solutionSuggestions.length).toBeGreaterThan(0)

      // 4. Test high quality idea
      const highQualityIdea = 'Une application mobile qui résout le problème de transport urbain en connectant les employés avec des solutions de covoiturage pour les entreprises de plus de 100 employés'
      const highQualityResult = result.current.validateIdea(highQualityIdea)

      expect(highQualityResult.isValid).toBe(true)
      expect(highQualityResult.score).toBeGreaterThan(70)
      expect(highQualityResult.suggestions.length).toBeLessThanOrEqual(2) // Fewer suggestions for good ideas
    })

    it('should validate edge cases correctly', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // 1. Test whitespace-only idea
      const whitespaceValidation = result.current.validateIdea('   \n\t   ')
      expect(whitespaceValidation.isValid).toBe(false)
      expect(whitespaceValidation.errors[0].type).toBe('required')

      // 2. Test very long idea
      const longIdea = 'Une application mobile '.repeat(30) + 'pour les entreprises'
      const longValidation = result.current.validateIdea(longIdea)
      expect(longValidation.warnings.length).toBeGreaterThan(0)

      // 3. Test idea with special characters
      const specialCharsIdea = 'Une application mobile avec des caractères spéciaux: éàù, çñ, etc. pour les entreprises'
      const specialValidation = result.current.validateIdea(specialCharsIdea)
      expect(specialValidation.isValid).toBe(true)

      // 4. Test idea with potentially harmful content
      const harmfulIdea = 'Une application avec <script>alert("XSS")</script>'
      const harmfulValidation = result.current.validateIdea(harmfulIdea)
      expect(harmfulValidation.isValid).toBe(false)
      expect(harmfulValidation.errors[0].type).toBe('format')
    })

    it('should prioritize suggestions by importance', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const vagueIdea = 'Une application mobile'
      const suggestions = result.current.getSuggestions(vagueIdea)

      // High priority suggestions should come first
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high')
      const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium')

      if (highPrioritySuggestions.length > 0 && mediumPrioritySuggestions.length > 0) {
        const firstHighIndex = suggestions.findIndex(s => s.priority === 'high')
        const firstMediumIndex = suggestions.findIndex(s => s.priority === 'medium')
        expect(firstHighIndex).toBeLessThan(firstMediumIndex)
      }
    })
  })
})