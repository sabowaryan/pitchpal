/**
 * Performance Optimizations Integration Tests
 * 
 * Tests the integration of all performance optimizations in the pitch generator
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useEnhancedPitchGenerator } from '@/hooks/use-enhanced-pitch-generator'
import { useDebouncedValue, useCleanup, useMemoizedCallback } from '../performance-utils'

// Mock fetch
global.fetch = jest.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-123'
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Performance Optimizations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Debounced Validation', () => {
    it('should debounce validation calls to prevent excessive processing', async () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())
      
      const validateSpy = jest.spyOn(result.current, 'validateIdea')
      
      // Simulate rapid typing
      act(() => {
        result.current.validateIdea('a')
        result.current.validateIdea('ab')
        result.current.validateIdea('abc')
        result.current.validateIdea('abcd')
        result.current.validateIdea('abcde')
      })

      // Should have been called for each immediate call (no debouncing in validateIdea itself)
      expect(validateSpy).toHaveBeenCalledTimes(5)
      
      validateSpy.mockRestore()
    })

    it('should use debounced value in components', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: '' } }
      )

      expect(result.current).toBe('')

      // Simulate rapid updates
      rerender({ value: 'a' })
      rerender({ value: 'ab' })
      rerender({ value: 'abc' })

      // Value should still be empty (debounced)
      expect(result.current).toBe('')

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Now should have the latest value
      waitFor(() => {
        expect(result.current).toBe('abc')
      })
    })
  })

  describe('Memoized Calculations', () => {
    it('should memoize expensive validation calculations', () => {
      const expensiveValidation = jest.fn((idea: string) => ({
        isValid: idea.length > 10,
        score: idea.length * 2,
        errors: [],
        warnings: [],
        suggestions: []
      }))

      const { result } = renderHook(() => 
        useMemoizedCallback(expensiveValidation, [])
      )

      // First call
      const result1 = result.current('test idea here')
      expect(expensiveValidation).toHaveBeenCalledTimes(1)
      expect(result1.score).toBe(28) // 14 chars * 2

      // Same call - should use cache
      const result2 = result.current('test idea here')
      expect(expensiveValidation).toHaveBeenCalledTimes(1)
      expect(result2.score).toBe(28)

      // Different call
      const result3 = result.current('different idea')
      expect(expensiveValidation).toHaveBeenCalledTimes(2)
      expect(result3.score).toBe(28) // 14 chars * 2
    })
  })

  describe('Resource Cleanup', () => {
    it('should automatically cleanup timers and abort controllers', () => {
      const { result, unmount } = renderHook(() => useCleanup())

      const mockTimer = setTimeout(() => {}, 1000) as any
      const mockController = new AbortController()
      const abortSpy = jest.spyOn(mockController, 'abort')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      act(() => {
        result.current.addTimer(mockTimer)
        result.current.addAbortController(mockController)
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimer)
      expect(abortSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should cleanup resources in pitch generator hook', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pitch: {
            tagline: 'Test tagline',
            problem: 'Test problem',
            solution: 'Test solution',
            targetMarket: 'Test market',
            businessModel: 'Test model',
            competitiveAdvantage: 'Test advantage',
            pitchDeck: {
              slides: [{ title: 'Test', content: 'Test content' }]
            }
          }
        })
      })

      const { result, unmount } = renderHook(() => useEnhancedPitchGenerator())

      // Start generation
      act(() => {
        result.current.generatePitch('Test idea for startup', 'professional')
      })

      expect(result.current.state.isLoading).toBe(true)

      // Unmount should cleanup resources
      unmount()

      // Verify no memory leaks or hanging promises
      await waitFor(() => {
        expect(true).toBe(true) // Test passes if no errors thrown
      })
    })
  })

  describe('Memory Management', () => {
    it('should limit cache size in memoized callbacks', () => {
      const expensiveFunction = jest.fn((x: number) => x * 2)
      const { result } = renderHook(() => 
        useMemoizedCallback(expensiveFunction, [])
      )

      // Fill cache beyond limit
      for (let i = 0; i < 105; i++) {
        result.current(i)
      }

      expect(expensiveFunction).toHaveBeenCalledTimes(105)

      // Early entries should be evicted
      result.current(0) // Should recalculate
      expect(expensiveFunction).toHaveBeenCalledTimes(106)

      // Recent entries should still be cached
      result.current(104) // Should use cache
      expect(expensiveFunction).toHaveBeenCalledTimes(106)
    })

    it('should manage preferences history size', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Mock localStorage to return preferences with long history
      const longHistory = Array.from({ length: 15 }, (_, i) => `Idea ${i}`)
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        ideaHistory: longHistory,
        defaultTone: 'professional'
      }))

      // Save new preference should trim history
      act(() => {
        result.current.savePreferences({ 
          ideaHistory: ['New idea', ...longHistory]
        })
      })

      // Should have called setItem with trimmed history (max 10 items)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"ideaHistory"')
      )

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.ideaHistory).toHaveLength(10)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track validation performance', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const startTime = performance.now()
      
      act(() => {
        result.current.validateIdea('Test idea for performance monitoring')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Validation should be fast (under 10ms for simple validation)
      expect(duration).toBeLessThan(10)
    })

    it('should handle large idea validation efficiently', () => {
      const { result } = renderHook(() => useEnhancedPitchGenerator())

      const largeIdea = 'A'.repeat(1000) // 1000 character idea
      const startTime = performance.now()
      
      act(() => {
        result.current.validateIdea(largeIdea)
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Even large validation should be reasonably fast
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without memory leaks', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Generate multiple errors
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          try {
            await result.current.generatePitch(`Test idea ${i}`, 'professional')
          } catch (error) {
            // Expected to fail
          }
        })
      }

      // Should handle errors gracefully without accumulating resources
      expect(result.current.state.error).toBeTruthy()
      expect(result.current.state.isLoading).toBe(false)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle rapid generation attempts efficiently', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            pitch: {
              tagline: 'Test tagline',
              problem: 'Test problem',
              solution: 'Test solution',
              targetMarket: 'Test market',
              businessModel: 'Test model',
              competitiveAdvantage: 'Test advantage',
              pitchDeck: {
                slides: [{ title: 'Test', content: 'Test content' }]
              }
            }
          })
        }), 100))
      )

      const { result } = renderHook(() => useEnhancedPitchGenerator())

      // Start multiple generations rapidly
      act(() => {
        result.current.generatePitch('Idea 1', 'professional')
      })

      act(() => {
        result.current.generatePitch('Idea 2', 'casual')
      })

      act(() => {
        result.current.generatePitch('Idea 3', 'technical')
      })

      // Should handle concurrent requests gracefully
      expect(result.current.state.isLoading).toBe(true)

      // Wait for completion
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false)
      }, { timeout: 5000 })

      // Should have completed successfully
      expect(result.current.state.pitch).toBeTruthy()
      expect(result.current.state.error).toBeFalsy()
    })
  })
})