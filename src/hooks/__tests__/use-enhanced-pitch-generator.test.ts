import { renderHook, act, waitFor } from '@testing-library/react'
import { useEnhancedPitchGenerator } from '../use-enhanced-pitch-generator'

// Mock fetch
global.fetch = jest.fn()

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

describe('useEnhancedPitchGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.pitch).toBe(null)
    expect(result.current.state.error).toBe(null)
    expect(result.current.state.retryCount).toBe(0)
    expect(result.current.state.canCancel).toBe(false)
  })

  it('should validate idea correctly', () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    // Test empty idea
    const emptyValidation = result.current.validateIdea('')
    expect(emptyValidation.isValid).toBe(false)
    expect(emptyValidation.errors).toHaveLength(1)
    expect(emptyValidation.errors[0].message).toBe('L\'idée ne peut pas être vide')

    // Test short idea
    const shortValidation = result.current.validateIdea('test')
    expect(shortValidation.isValid).toBe(false)
    expect(shortValidation.errors).toHaveLength(1)
    expect(shortValidation.errors[0].message).toBe('L\'idée doit contenir au moins 10 caractères')

    // Test valid idea
    const validValidation = result.current.validateIdea('Une application mobile pour résoudre le problème de transport urbain')
    expect(validValidation.isValid).toBe(true)
    expect(validValidation.errors).toHaveLength(0)
    expect(validValidation.score).toBeGreaterThan(0)
  })

  it('should provide suggestions for incomplete ideas', () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    const suggestions = result.current.getSuggestions('Une application mobile')
    expect(suggestions.length).toBeGreaterThan(0)
    
    const problemSuggestion = suggestions.find(s => s.type === 'vague_problem')
    expect(problemSuggestion).toBeDefined()
    expect(problemSuggestion?.priority).toBe('high')
  })

  it('should handle generation start correctly', async () => {
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

    await act(async () => {
      await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
    })

    expect(result.current.state.pitch).toBeDefined()
    expect(result.current.state.error).toBe(null)
    expect(result.current.state.isLoading).toBe(false)
  })

  it('should handle validation errors', async () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    await act(async () => {
      await result.current.generatePitch('', 'professional')
    })

    expect(result.current.state.error).toBeDefined()
    expect(result.current.state.error?.type).toBe('validation')
    expect(result.current.state.pitch).toBe(null)
  })

  it('should handle cancellation', () => {
    const onCancel = jest.fn()
    const { result } = renderHook(() => useEnhancedPitchGenerator({ onCancel }))

    act(() => {
      result.current.cancelGeneration()
    })

    expect(onCancel).toHaveBeenCalled()
  })

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    act(() => {
      result.current.resetState()
    })

    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.pitch).toBe(null)
    expect(result.current.state.error).toBe(null)
    expect(result.current.state.retryCount).toBe(0)
  })

  it('should save and load preferences', () => {
    const { result } = renderHook(() => useEnhancedPitchGenerator())

    const newPreferences = {
      defaultTone: 'fun' as const,
      enableRetry: false,
      maxRetryAttempts: 5
    }

    act(() => {
      result.current.savePreferences(newPreferences)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pitchpal_preferences',
      expect.stringContaining('"defaultTone":"fun"')
    )
  })

  it('should handle network errors with retry logic', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    
    // Mock preferences to disable auto-retry for this test
    const { result } = renderHook(() => useEnhancedPitchGenerator())
    
    act(() => {
      result.current.savePreferences({ enableRetry: false })
    })

    await act(async () => {
      await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
    })

    expect(result.current.state.error).toBeDefined()
    expect(result.current.state.error?.type).toBe('network')
    expect(result.current.state.error?.retryable).toBe(true)
  })

  it('should handle timeout errors correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    const abortError = new Error('Request timeout')
    abortError.name = 'AbortError'
    mockFetch.mockRejectedValueOnce(abortError)

    const { result } = renderHook(() => useEnhancedPitchGenerator())
    
    // Disable auto-retry for this test
    act(() => {
      result.current.savePreferences({ enableRetry: false })
    })

    await act(async () => {
      await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
    })

    expect(result.current.state.error).toBeDefined()
    expect(result.current.state.error?.type).toBe('timeout')
    expect(result.current.state.error?.retryable).toBe(true)
  })

  it('should increment retry count on retry', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    
    // First mock a network error
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    
    const { result } = renderHook(() => useEnhancedPitchGenerator())
    
    // Disable auto-retry to control the retry manually
    act(() => {
      result.current.savePreferences({ enableRetry: false })
    })

    // First, create an error state with a valid idea (so retry has context)
    await act(async () => {
      await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
    })

    expect(result.current.state.retryCount).toBe(0)
    expect(result.current.state.error).toBeDefined()

    // Mock a successful response for retry
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

    // Manually trigger retry
    await act(async () => {
      await result.current.retryGeneration()
    })

    expect(result.current.state.retryCount).toBe(1)
  })

  it('should handle progress updates correctly', async () => {
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
    expect(result.current.state.progress.step).toBeGreaterThan(0)

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

  describe('Advanced Hook Scenarios', () => {
    it('should handle auto-retry with exponential backoff', async () => {
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

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Fast forward through retry delays
      await act(async () => {
        jest.runAllTimers()
      })

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(result.current.state.pitch).toBeDefined()
      })
      
      expect(result.current.state.retryCount).toBeGreaterThan(0)
    })

    it('should respect max retry attempts', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Always fail
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      // Enable auto-retry with low max attempts
      act(() => {
        result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 2 })
      })

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Fast forward through all retry delays
      await act(async () => {
        jest.runAllTimers()
      })

      // Should stop retrying after max attempts
      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe('network')
      expect(result.current.state.retryCount).toBeLessThanOrEqual(2)
    })

    it('should handle server errors correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server is temporarily unavailable' })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe('server')
      expect(result.current.state.error?.retryable).toBe(true)
    })

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
      expect(result.current.state.error?.message).toContain('Réponse invalide du serveur')
    })

    it('should handle incomplete pitch data', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pitch: {
            tagline: 'Test tagline',
            problem: 'Test problem',
            // Missing required fields
          }
        })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.message).toContain('Pitch incomplet')
    })

    it('should handle request timeout', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock a request that never resolves
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      // Fast forward past the 60 second timeout
      act(() => {
        jest.advanceTimersByTime(61000)
      })

      await waitFor(() => {
        expect(result.current.state.error).toBeDefined()
      })
    })

    it('should cancel generation during progress', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock a slow request
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
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
        } as Response), 5000))
      )

      const onCancel = jest.fn()
      const { result } = renderHook(() => useEnhancedPitchGenerator({ onCancel }))

      // Start generation
      act(() => {
        result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.isLoading).toBe(true)
      expect(result.current.state.canCancel).toBe(true)

      // Cancel during generation
      act(() => {
        result.current.cancelGeneration()
      })

      expect(result.current.state.isLoading).toBe(false)
      expect(result.current.state.canCancel).toBe(false)
      expect(onCancel).toHaveBeenCalled()
    })

    it('should load preferences on mount', () => {
      const savedPreferences = {
        defaultTone: 'startup',
        autoSave: false,
        showSuggestions: false,
        enableRetry: false,
        maxRetryAttempts: 5,
        ideaHistory: ['saved idea 1', 'saved idea 2'],
        lastUsed: new Date().toISOString()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      expect(result.current.state.preferences.defaultTone).toBe('startup')
      expect(result.current.state.preferences.autoSave).toBe(false)
      expect(result.current.state.preferences.ideaHistory).toEqual(['saved idea 1', 'saved idea 2'])
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Should still initialize with default preferences
      expect(result.current.state.preferences.defaultTone).toBe('professional')
      expect(result.current.state.preferences.autoSave).toBe(true)
    })

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Should fallback to default preferences
      expect(result.current.state.preferences.defaultTone).toBe('professional')
      expect(result.current.state.preferences.autoSave).toBe(true)
    })

    it('should not save to history when autoSave is disabled', async () => {
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

      // Disable auto-save
      act(() => {
        result.current.savePreferences({ autoSave: false })
      })

      const testIdea = 'Une application mobile pour résoudre le problème de transport urbain'

      await act(async () => {
        await result.current.generatePitch(testIdea, 'professional')
      })

      // Should not save idea to history
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]
      const savedData = JSON.parse(lastCall[1])
      expect(savedData.ideaHistory).not.toContain(testIdea)
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

    it('should handle edge cases in validation', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Test whitespace-only idea
      const whitespaceValidation = result.current.validateIdea('   \n\t   ')
      expect(whitespaceValidation.isValid).toBe(false)
      expect(whitespaceValidation.errors[0].type).toBe('required')

      // Test very long idea
      const longIdea = 'Une application mobile '.repeat(30) + 'pour les entreprises'
      const longValidation = result.current.validateIdea(longIdea)
      expect(longValidation.warnings.length).toBeGreaterThan(0)

      // Test idea with special characters
      const specialCharsIdea = 'Une application mobile avec des caractères spéciaux: éàù, çñ, etc. pour les entreprises'
      const specialValidation = result.current.validateIdea(specialCharsIdea)
      expect(specialValidation.isValid).toBe(true)
    })

    it('should limit suggestions to maximum 5', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const minimalIdea = result.current.validateIdea('Une app')
      expect(minimalIdea.suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should prioritize high-priority suggestions', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const vagueIdea = result.current.validateIdea('Une application mobile simple')
      const highPrioritySuggestions = vagueIdea.suggestions.filter(s => s.priority === 'high')
      const lowPrioritySuggestions = vagueIdea.suggestions.filter(s => s.priority === 'low')
      
      // High priority suggestions should come first
      if (highPrioritySuggestions.length > 0 && lowPrioritySuggestions.length > 0) {
        const firstHighIndex = vagueIdea.suggestions.findIndex(s => s.priority === 'high')
        const firstLowIndex = vagueIdea.suggestions.findIndex(s => s.priority === 'low')
        expect(firstHighIndex).toBeLessThan(firstLowIndex)
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should classify different error types correctly', async () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      // Network error
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error?.type).toBe('network')
      expect(result.current.state.error?.retryable).toBe(true)
    })

    it('should handle AI service errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'AI model quota exceeded' })
      } as Response)

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      act(() => {
        result.current.savePreferences({ enableRetry: false })
      })

      await act(async () => {
        await result.current.generatePitch('Une application mobile pour résoudre le problème de transport urbain', 'professional')
      })

      expect(result.current.state.error).toBeDefined()
      expect(result.current.state.error?.type).toBe('ai_service')
    })

    it('should provide helpful error messages and suggested actions', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
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

  describe('Preferences Persistence', () => {
    it('should update preferences and persist them', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const newPreferences = {
        defaultTone: 'startup' as const,
        autoSave: false,
        showSuggestions: false,
        enableRetry: false,
        maxRetryAttempts: 5
      }

      act(() => {
        result.current.savePreferences(newPreferences)
      })

      expect(result.current.state.preferences.defaultTone).toBe('startup')
      expect(result.current.state.preferences.autoSave).toBe(false)
      expect(result.current.state.preferences.showSuggestions).toBe(false)
      expect(result.current.state.preferences.enableRetry).toBe(false)
      expect(result.current.state.preferences.maxRetryAttempts).toBe(5)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"startup"')
      )
    })

    it('should handle partial preference updates', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Set initial preferences
      act(() => {
        result.current.savePreferences({
          defaultTone: 'professional',
          autoSave: true,
          showSuggestions: true
        })
      })

      // Update only one preference
      act(() => {
        result.current.savePreferences({ defaultTone: 'fun' })
      })

      expect(result.current.state.preferences.defaultTone).toBe('fun')
      expect(result.current.state.preferences.autoSave).toBe(true) // Should remain unchanged
      expect(result.current.state.preferences.showSuggestions).toBe(true) // Should remain unchanged
    })

    it('should update lastUsed timestamp when saving preferences', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const beforeUpdate = new Date()

      act(() => {
        result.current.savePreferences({ defaultTone: 'tech' })
      })

      expect(result.current.state.preferences.lastUsed.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should handle localStorage save errors gracefully', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage quota exceeded')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      act(() => {
        result.current.savePreferences({ defaultTone: 'fun' })
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save preferences:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should maintain idea history correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
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

      // Generate multiple pitches
      const ideas = [
        'Première idée d\'application mobile',
        'Deuxième idée pour startup',
        'Troisième idée innovante'
      ]

      for (const idea of ideas) {
        await act(async () => {
          await result.current.generatePitch(idea, 'professional')
        })
      }

      // Check that ideas are saved in reverse order (newest first)
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1][1])
      expect(savedData.ideaHistory[0]).toBe('Troisième idée innovante')
      expect(savedData.ideaHistory[1]).toBe('Deuxième idée pour startup')
      expect(savedData.ideaHistory[2]).toBe('Première idée d\'application mobile')
    })
  })
})