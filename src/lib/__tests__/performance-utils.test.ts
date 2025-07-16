/**
 * Performance Utilities Tests
 * 
 * Tests for debouncing, memoization, cleanup, and lazy loading utilities
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { 
  useDebounce, 
  useDebouncedValue, 
  useThrottle, 
  useMemoizedCallback, 
  useCleanup,
  usePerformanceMonitor,
  useIntersectionObserver
} from '../performance-utils'

// Mock timers
jest.useFakeTimers()

describe('Performance Utils', () => {
  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  describe('useDebounce', () => {
    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const { result } = renderHook(() => useDebounce(mockFn, 500))

      // Call the debounced function multiple times
      act(() => {
        result.current('test1')
        result.current('test2')
        result.current('test3')
      })

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should have been called once with the last value
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test3')
    })

    it('should reset timer on new calls', () => {
      const mockFn = jest.fn()
      const { result } = renderHook(() => useDebounce(mockFn, 500))

      act(() => {
        result.current('test1')
      })

      // Advance time partially
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Call again - should reset timer
      act(() => {
        result.current('test2')
      })

      // Advance remaining time from first call
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Advance full delay from second call
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test2')
    })

    it('should cleanup timeout on unmount', () => {
      const mockFn = jest.fn()
      const { result, unmount } = renderHook(() => useDebounce(mockFn, 500))

      act(() => {
        result.current('test')
      })

      unmount()

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(mockFn).not.toHaveBeenCalled()
    })
  })

  describe('useDebouncedValue', () => {
    it('should debounce value updates', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      )

      expect(result.current).toBe('initial')

      // Update value multiple times
      rerender({ value: 'update1', delay: 300 })
      rerender({ value: 'update2', delay: 300 })
      rerender({ value: 'final', delay: 300 })

      // Value should still be initial
      expect(result.current).toBe('initial')

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current).toBe('final')
      })
    })
  })

  describe('useThrottle', () => {
    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const { result } = renderHook(() => useThrottle(mockFn, 500))

      // First call should execute immediately
      act(() => {
        result.current('test1')
      })

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test1')

      // Subsequent calls within delay should be throttled
      act(() => {
        result.current('test2')
        result.current('test3')
      })

      expect(mockFn).toHaveBeenCalledTimes(1)

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Last call should execute after delay
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('test3')
    })
  })

  describe('useMemoizedCallback', () => {
    it('should memoize callback results', () => {
      const expensiveCalculation = jest.fn((x: number) => x * 2)
      const { result } = renderHook(() => 
        useMemoizedCallback(expensiveCalculation, [])
      )

      // First call
      const result1 = result.current(5)
      expect(result1).toBe(10)
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)

      // Second call with same argument - should use cache
      const result2 = result.current(5)
      expect(result2).toBe(10)
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)

      // Call with different argument
      const result3 = result.current(10)
      expect(result3).toBe(20)
      expect(expensiveCalculation).toHaveBeenCalledTimes(2)
    })

    it('should clear cache when dependencies change', () => {
      const expensiveCalculation = jest.fn((x: number) => x * 2)
      const { result, rerender } = renderHook(
        ({ dep }) => useMemoizedCallback(expensiveCalculation, [dep]),
        { initialProps: { dep: 'a' } }
      )

      // First call
      result.current(5)
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)

      // Same call - should use cache
      result.current(5)
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)

      // Change dependency
      rerender({ dep: 'b' })

      // Same call after dependency change - should recalculate
      result.current(5)
      expect(expensiveCalculation).toHaveBeenCalledTimes(2)
    })

    it('should limit cache size to prevent memory leaks', () => {
      const expensiveCalculation = jest.fn((x: number) => x * 2)
      const { result } = renderHook(() => 
        useMemoizedCallback(expensiveCalculation, [])
      )

      // Fill cache beyond limit (100 items)
      for (let i = 0; i < 105; i++) {
        result.current(i)
      }

      expect(expensiveCalculation).toHaveBeenCalledTimes(105)

      // First few calls should have been evicted from cache
      result.current(0) // Should recalculate
      expect(expensiveCalculation).toHaveBeenCalledTimes(106)

      // Recent calls should still be cached
      result.current(104) // Should use cache
      expect(expensiveCalculation).toHaveBeenCalledTimes(106)
    })
  })

  describe('useCleanup', () => {
    it('should manage timers and cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup())

      const mockTimer = setTimeout(() => {}, 1000) as any
      const mockInterval = setInterval(() => {}, 1000) as any

      act(() => {
        result.current.addTimer(mockTimer)
        result.current.addInterval(mockInterval)
      })

      // Spy on clearTimeout and clearInterval
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimer)
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockInterval)

      clearTimeoutSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    })

    it('should manage AbortControllers and cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup())

      const mockController = new AbortController()
      const abortSpy = jest.spyOn(mockController, 'abort')

      act(() => {
        result.current.addAbortController(mockController)
      })

      unmount()

      expect(abortSpy).toHaveBeenCalled()
    })

    it('should allow manual cleanup', () => {
      const { result } = renderHook(() => useCleanup())

      const mockTimer = setTimeout(() => {}, 1000) as any
      const mockController = new AbortController()
      const abortSpy = jest.spyOn(mockController, 'abort')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      act(() => {
        result.current.addTimer(mockTimer)
        result.current.addAbortController(mockController)
      })

      act(() => {
        result.current.cleanup()
      })

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimer)
      expect(abortSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should allow individual resource removal', () => {
      const { result } = renderHook(() => useCleanup())

      const mockTimer = setTimeout(() => {}, 1000) as any
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      act(() => {
        result.current.addTimer(mockTimer)
      })

      act(() => {
        result.current.removeTimer(mockTimer)
      })

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimer)

      clearTimeoutSpy.mockRestore()
    })
  })

  describe('usePerformanceMonitor', () => {
    it('should track render count', () => {
      const { result, rerender } = renderHook(() => 
        usePerformanceMonitor('TestComponent', true)
      )

      expect(result.current.renderCount).toBe(1)

      rerender()
      expect(result.current.renderCount).toBe(2)

      rerender()
      expect(result.current.renderCount).toBe(3)
    })

    it('should not track when disabled', () => {
      const { result, rerender } = renderHook(() => 
        usePerformanceMonitor('TestComponent', false)
      )

      expect(result.current.renderCount).toBe(0)

      rerender()
      expect(result.current.renderCount).toBe(0)
    })

    it('should provide logPerformance function', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { result } = renderHook(() => 
        usePerformanceMonitor('TestComponent', true)
      )

      const startTime = performance.now()
      
      act(() => {
        result.current.logPerformance('test operation', startTime)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] TestComponent test operation:')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('useIntersectionObserver', () => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = jest.fn()
    const mockObserve = jest.fn()
    const mockUnobserve = jest.fn()

    beforeEach(() => {
      mockIntersectionObserver.mockReturnValue({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: jest.fn()
      })
      
      // @ts-ignore
      global.IntersectionObserver = mockIntersectionObserver
    })

    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useIntersectionObserver())

      expect(result.current.isIntersecting).toBe(false)
      expect(result.current.hasIntersected).toBe(false)
      expect(result.current.elementRef.current).toBe(null)
    })

    it('should observe element when ref is set', () => {
      const { result } = renderHook(() => useIntersectionObserver())

      const mockElement = document.createElement('div')
      
      act(() => {
        result.current.elementRef.current = mockElement
      })

      // Trigger useEffect by re-rendering
      const { rerender } = renderHook(() => useIntersectionObserver())
      rerender()

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.1 })
      )
    })
  })
})