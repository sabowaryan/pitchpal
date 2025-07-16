/**
 * Comprehensive tests for the useEnhancedPitchGenerator hook
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

describe('useEnhancedPitchGenerator Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('State Management with useReducer', () => {
    it('should handle state transitions correctly', async () => {
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

      // Initial state
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
      expect(result.current.state.error).toBe(null)

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Check state transitions
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBeDefined()
      expect(result.current.state.error).toBe(null)
    })

    it('should handle multiple state updates in sequence', async () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Initial state
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.pitch).toBe(null)
      expect(result.current.state.error).toBe(null)

      // Reset state (this method exists)
      act(() => {
        result.current.resetState()
      })
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.error).toBe(null)
      expect(result.current.state.pitch).toBe(null)
    })
  })

  describe('Cancellation with AbortController', () => {
    it('should cancel ongoing requests', async () => {
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
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Check that loading state is set
      expect(result.current.state.isLoading).toBe(true)
      expect(result.current.state.canCancel).toBe(true)

      // Cancel the request
      act(() => {
        result.current.cancelGeneration()
      })

      // Check that abort was called
      expect(mockAbort).toHaveBeenCalled()

      // Check that state was reset properly
      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.canCancel).toBe(false)
    })

    it('should clean up AbortController on unmount', () => {
      const { result, unmount } = renderHook(() => useEnhancedPitchGenerator())

      // Start generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Unmount the component
      unmount()

      // Check that abort was called
      expect(mockAbort).toHaveBeenCalled()
    })

    it('should handle multiple cancellations gracefully', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Start generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Cancel multiple times
      act(() => {
        result.current.cancelGeneration()
        result.current.cancelGeneration() // Should not cause errors
      })

      expect(mockAbort).toHaveBeenCalledTimes(1)
    })
  })

  describe('Retry System with Backoff', () => {
    it('should implement exponential backoff for retries', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // Mock multiple failures then success
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
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

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // First retry should happen after baseDelay (default 1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // Second retry should happen after baseDelay * backoffMultiplier (default 2000ms)
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
      })

      expect(result.current.state.retryCount).toBe(2)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should respect maxRetryAttempts setting', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // Always fail
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Enable auto-retry with low max attempts
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 2 })
      })

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Fast forward through all retry delays
      await act(async () => {
        jest.runAllTimers()
      })

      // Should stop retrying after max attempts
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.retryCount).toBeLessThanOrEqual(2)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle retry delays appropriately', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // Mock failure then success
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
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 2 })
      })

      // Start generation
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Fast forward through retry delay
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
      })

      expect(result.current.state.retryCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Classification and Handling', () => {
    it('should classify different error types correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>

      // Test network error
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { result, rerender } = renderHook(() => useEnhancedPitchGenerator())

      // Disable auto-retry through preferences
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)

      // Reset state
      act(() => {
        result.current.resetState()
      })

      // Test timeout error
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error?.type).toBe(ErrorType.TIMEOUT)

      // Reset state
      act(() => {
        result.current.resetState()
      })

      // Test server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      } as Response)

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
    })

    it('should provide helpful error messages and suggested actions', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Disable auto-retry through preferences
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error?.message).toBeDefined()
      expect(result.current.state.error?.suggestedAction).toBeDefined()
      expect(result.current.state.error?.helpUrl).toBeDefined()
    })

    it('should track error context for debugging', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Disable auto-retry through preferences
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      const testIdea = 'Une application mobile pour résoudre le problème de transport urbain'
      const testTone = 'professional'

      await act(async () => {
        await result.current.generatePitch(testIdea, testTone)
      })

      expect(result.current.state.error?.context).toBeDefined()
      expect(result.current.state.error?.context.idea).toBe(testIdea)
      expect(result.current.state.error?.context.tone).toBe(testTone)
      expect(result.current.state.error?.context.retryCount).toBe(0)
    })
  })

  describe('Real-time Validation System', () => {
    it('should validate ideas with different quality scores', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Low quality idea
      const lowQuality = result.current.validateIdea('Une application mobile simple')
      expect(lowQuality.isValid).toBe(true)
      expect(lowQuality.score).toBeLessThan(50)

      // Medium quality idea
      const mediumQuality = result.current.validateIdea('Une application mobile qui résout le problème de transport urbain pour les entreprises')
      expect(mediumQuality.isValid).toBe(true)
      expect(mediumQuality.score).toBeGreaterThan(50)

      // High quality idea
      const highQuality = result.current.validateIdea('Une application mobile qui résout le problème de transport urbain en connectant les employés avec des solutions de covoiturage pour les entreprises de plus de 100 employés')
      expect(highQuality.isValid).toBe(true)
      expect(highQuality.score).toBeGreaterThan(70)
    })

    it('should provide contextual suggestions based on content', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Test vague problem suggestion
      const vagueIdea = result.current.validateIdea('Une application pour les entreprises')
      const problemSuggestions = vagueIdea.suggestions.filter(s => s.type === 'vague_problem')
      expect(problemSuggestions.length).toBeGreaterThan(0)

      // Test missing solution suggestion
      const problemOnlyIdea = result.current.validateIdea('Il y a un problème avec la comptabilité des entreprises')
      const solutionSuggestions = problemOnlyIdea.suggestions.filter(s => s.type === 'unclear_solution')
      expect(solutionSuggestions.length).toBeGreaterThan(0)

      // Test missing target suggestion
      const noTargetIdea = result.current.validateIdea('Une solution qui résout les problèmes de comptabilité')
      const targetSuggestions = noTargetIdea.suggestions.filter(s => s.type === 'missing_target')
      expect(targetSuggestions.length).toBeGreaterThan(0)
    })
  })

  describe('Preferences Persistence', () => {
    it('should save and load preferences', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const newPreferences = {
        defaultTone: 'fun' as const,
        autoSave: false,
        showSuggestions: false,
        enableRetry: false,
        maxRetryAttempts: 5
      }

      act(() => {
        result.current.savePreferences(newPreferences)
      })

      expect(result.current.state.preferences.defaultTone).toBe('fun')
      expect(result.current.state.preferences.autoSave).toBe(false)
      expect(result.current.state.preferences.showSuggestions).toBe(false)
      expect(result.current.state.preferences.enableRetry).toBe(false)
      expect(result.current.state.preferences.maxRetryAttempts).toBe(5)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"fun"')
      )
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

      const testIdea = 'Une application mobile pour résoudre le problème de transport urbain'

      await act(async () => {
        await result.current.generatePitch(testIdea, 'professional')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining(testIdea)
      )
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available')
      })

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Should not throw when localStorage fails
      act(() => {
        result.current.savePreferences({ defaultTone: 'tech' })
      })

      // Should still update in-memory state
      expect(result.current.state.preferences.defaultTone).toBe('tech')
    })
  })

  describe('Progress Tracking', () => {
    it('should track generation progress correctly', async () => {
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
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Check initial progress
      expect(result.current.state.progress.step).toBeGreaterThan(0)
      expect(result.current.state.progress.isComplete).toBe(false)

      // Progress is automatically updated by the hook during generation
      // We can observe the progress state changes
      expect(result.current.state.progress.step).toBeGreaterThan(0)
      expect(result.current.state.progress.message).toBeDefined()
      expect(result.current.state.progress.currentOperation).toBeDefined()

      // Resolve the promise to complete generation
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

      // Wait for the promise to resolve
      await act(async () => {
        await controlledPromise
      })
    })

    it('should track progress during generation', async () => {
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

      // Start generation and observe progress
      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Progress should be complete after successful generation
      expect(result.current.state.progress.isComplete).toBe(true)
      expect(result.current.state.progress.step).toBe(result.current.state.progress.totalSteps)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed API responses', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalidResponse: true })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.message).toContain('Réponse invalide')
    })

    it('should handle JSON parsing errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        text: jest.fn(),
        json: async () => { throw new SyntaxError('Invalid JSON') }
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
    })

    it('should handle incomplete pitch data', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pitch: {
            tagline: 'Test tagline',
            // Missing required fields
          }
        })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.message).toContain('incomplet')
    })
  })
})