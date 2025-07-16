/**
 * Tests for the retry system with backoff exponential
 */

import { renderHook, act } from '@testing-library/react'
import { useRetrySystem } from '../use-retry-system'
import { ErrorType } from '@/types/enhanced-errors'

// Mock timers for testing retry delays
jest.useFakeTimers()

describe('useRetrySystem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useRetrySystem())

    expect(result.current.retryCount).toBe(0)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.cooldownRemaining).toBe(0)
    expect(result.current.canRetry).toBe(true)
  })

  it('should determine if error is retryable', () => {
    const { result } = renderHook(() => useRetrySystem())

    // Network errors should be retryable
    expect(result.current.isErrorRetryable({ type: ErrorType.NETWORK })).toBe(true)
    
    // Timeout errors should be retryable
    expect(result.current.isErrorRetryable({ type: ErrorType.TIMEOUT })).toBe(true)
    
    // Server errors should be retryable
    expect(result.current.isErrorRetryable({ type: ErrorType.SERVER })).toBe(true)
    
    // Validation errors should not be retryable
    expect(result.current.isErrorRetryable({ type: ErrorType.VALIDATION })).toBe(false)
    
    // Unknown errors should not be retryable by default
    expect(result.current.isErrorRetryable({ type: ErrorType.UNKNOWN })).toBe(false)
    
    // Should respect the retryable flag if present
    expect(result.current.isErrorRetryable({ 
      type: ErrorType.UNKNOWN, 
      retryable: true 
    })).toBe(true)
  })

  it('should calculate backoff delay correctly', () => {
    const { result } = renderHook(() => useRetrySystem({
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }))

    // First retry: baseDelay * (backoffMultiplier ^ 0) = 1000 * 1 = 1000
    expect(result.current.calculateBackoffDelay(0)).toBe(1000)
    
    // Second retry: baseDelay * (backoffMultiplier ^ 1) = 1000 * 2 = 2000
    expect(result.current.calculateBackoffDelay(1)).toBe(2000)
    
    // Third retry: baseDelay * (backoffMultiplier ^ 2) = 1000 * 4 = 4000
    expect(result.current.calculateBackoffDelay(2)).toBe(4000)
    
    // Fourth retry: baseDelay * (backoffMultiplier ^ 3) = 1000 * 8 = 8000
    expect(result.current.calculateBackoffDelay(3)).toBe(8000)
    
    // Fifth retry: would be 16000, but maxDelay is 10000
    expect(result.current.calculateBackoffDelay(4)).toBe(10000)
  })

  it('should handle retry with callback', async () => {
    const mockCallback = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetrySystem({
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2
    }))

    // Start retry
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    expect(result.current.retryCount).toBe(1)
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should handle retry with cooldown', async () => {
    const mockCallback = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetrySystem({
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2
    }))

    // First retry
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    expect(result.current.retryCount).toBe(1)
    expect(result.current.cooldownRemaining).toBeGreaterThan(0)
    expect(result.current.canRetry).toBe(false)

    // Try to retry again immediately (should not work due to cooldown)
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    // Callback should not have been called again
    expect(mockCallback).toHaveBeenCalledTimes(1)

    // Fast forward through cooldown
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    expect(result.current.cooldownRemaining).toBe(0)
    expect(result.current.canRetry).toBe(true)

    // Now retry should work
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    expect(result.current.retryCount).toBe(2)
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })

  it('should respect max retry attempts', async () => {
    const mockCallback = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetrySystem({
      maxAttempts: 3
    }))

    // First retry
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    // Fast forward through cooldown
    await act(async () => {
      jest.runAllTimers()
    })

    // Second retry
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    // Fast forward through cooldown
    await act(async () => {
      jest.runAllTimers()
    })

    // Third retry
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    expect(result.current.retryCount).toBe(3)
    expect(result.current.canRetry).toBe(false)

    // Fast forward through cooldown
    await act(async () => {
      jest.runAllTimers()
    })

    // Try to retry again (should not work due to max attempts)
    await act(async () => {
      await result.current.retry(mockCallback)
    })

    // Callback should not have been called again
    expect(mockCallback).toHaveBeenCalledTimes(3)
  })

  it('should handle auto retry for retryable errors', async () => {
    const mockCallback = jest.fn()
      .mockRejectedValueOnce({ type: ErrorType.NETWORK })
      .mockResolvedValueOnce('success')
    
    const { result } = renderHook(() => useRetrySystem({
      baseDelay: 100,
      maxAttempts: 2
    }))

    let finalResult
    
    await act(async () => {
      finalResult = await result.current.executeWithRetry(mockCallback)
    })

    expect(mockCallback).toHaveBeenCalledTimes(2)
    expect(finalResult).toBe('success')
    expect(result.current.retryCount).toBe(1)
  })

  it('should reset retry state', () => {
    const { result } = renderHook(() => useRetrySystem())

    // Simulate some retries
    act(() => {
      result.current.setRetryCount(3)
    })

    expect(result.current.retryCount).toBe(3)

    // Reset state
    act(() => {
      result.current.resetRetry()
    })

    expect(result.current.retryCount).toBe(0)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.cooldownRemaining).toBe(0)
    expect(result.current.canRetry).toBe(true)
  })

  it('should handle retry failure with max attempts', async () => {
    const mockCallback = jest.fn().mockRejectedValue({ type: ErrorType.NETWORK })
    
    const { result } = renderHook(() => useRetrySystem({
      baseDelay: 100,
      maxAttempts: 3,
      autoRetry: true
    }))

    // This should eventually fail after 3 attempts
    await act(async () => {
      try {
        await result.current.executeWithRetry(mockCallback)
      } catch (error) {
        // Expected to fail
      }
    })

    // Fast forward through all retry delays
    await act(async () => {
      jest.runAllTimers()
    })

    expect(mockCallback).toHaveBeenCalledTimes(3)
    expect(result.current.retryCount).toBe(3)
    expect(result.current.canRetry).toBe(false)
  })
})