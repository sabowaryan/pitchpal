/**
 * Tests for the Intelligent Retry System
 */

import { 
  RetryManager, 
  globalRetryManager, 
  executeWithRetry, 
  shouldRetry, 
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  ERROR_TYPE_RETRY_CONFIGS 
} from '../retry-system'
import { ErrorType, EnhancedError } from '@/types/enhanced-errors'

// Mock timers for testing
jest.useFakeTimers()

// Increase timeout for async tests
jest.setTimeout(10000)

describe('RetryManager', () => {
  let retryManager: RetryManager

  beforeEach(() => {
    retryManager = new RetryManager()
    jest.clearAllTimers()
  })

  afterEach(() => {
    retryManager.clearAllRetryStates()
  })

  describe('shouldRetry', () => {
    it('should return true for retryable network errors within attempt limit', () => {
      const networkError: EnhancedError = {
        id: 'test-error-1',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      // Network errors have maxAttempts: 3, so attempts 1 and 2 should be retryable
      expect(retryManager.shouldRetry(networkError, 1)).toBe(true)
      expect(retryManager.shouldRetry(networkError, 2)).toBe(true)
      expect(retryManager.shouldRetry(networkError, 3)).toBe(false) // At max attempts
      expect(retryManager.shouldRetry(networkError, 4)).toBe(false)
    })

    it('should return false for validation errors', () => {
      const validationError: EnhancedError = {
        id: 'test-error-2',
        type: ErrorType.VALIDATION,
        message: 'Validation error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: false
      }

      expect(retryManager.shouldRetry(validationError, 1)).toBe(false)
    })

    it('should return false for errors in cooldown', () => {
      const networkError: EnhancedError = {
        id: 'test-error-3',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      retryManager.setCooldown('test-error-3', 5000)
      expect(retryManager.shouldRetry(networkError, 1)).toBe(false)
    })

    it('should handle certificate and DNS errors correctly', () => {
      const certificateError: EnhancedError = {
        id: 'test-error-4',
        type: ErrorType.NETWORK,
        message: 'certificate error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      const dnsError: EnhancedError = {
        id: 'test-error-5',
        type: ErrorType.NETWORK,
        message: 'DNS error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      expect(retryManager.shouldRetry(certificateError, 1)).toBe(false)
      expect(retryManager.shouldRetry(dnsError, 1)).toBe(false)
    })
  })

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const networkError: EnhancedError = {
        id: 'test-error-6',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      const delay1 = retryManager.calculateRetryDelay(networkError, 1)
      const delay2 = retryManager.calculateRetryDelay(networkError, 2)
      const delay3 = retryManager.calculateRetryDelay(networkError, 3)

      // Should increase exponentially (with jitter, so we check ranges)
      expect(delay1).toBeGreaterThanOrEqual(1000)
      expect(delay1).toBeLessThanOrEqual(1100) // 1000 + 10% jitter
      
      expect(delay2).toBeGreaterThanOrEqual(2000)
      expect(delay2).toBeLessThanOrEqual(2200) // 2000 + 10% jitter
      
      expect(delay3).toBeGreaterThanOrEqual(4000)
      expect(delay3).toBeLessThanOrEqual(4400) // 4000 + 10% jitter
    })

    it('should respect maximum delay limits', () => {
      const timeoutError: EnhancedError = {
        id: 'test-error-7',
        type: ErrorType.TIMEOUT,
        message: 'Timeout error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      }

      const delay = retryManager.calculateRetryDelay(timeoutError, 10) // Very high attempt
      expect(delay).toBeLessThanOrEqual(ERROR_TYPE_RETRY_CONFIGS[ErrorType.TIMEOUT].maxDelay)
    })
  })

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const successOperation = jest.fn().mockResolvedValue('success')
      const errorHandler = jest.fn()

      const result = await retryManager.executeWithRetry(
        successOperation,
        errorHandler
      )

      expect(result).toBe('success')
      expect(successOperation).toHaveBeenCalledTimes(1)
      expect(errorHandler).not.toHaveBeenCalled()
    })

    it('should retry on retryable errors', async () => {
      const failThenSucceedOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      const errorHandler = jest.fn().mockReturnValue({
        id: 'test-error-8',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      })

      // Mock the retry delay to be 0 for faster tests
      const originalCalculateRetryDelay = retryManager.calculateRetryDelay
      retryManager.calculateRetryDelay = jest.fn().mockReturnValue(0)

      const result = await retryManager.executeWithRetry(
        failThenSucceedOperation,
        errorHandler
      )

      expect(result).toBe('success')
      expect(failThenSucceedOperation).toHaveBeenCalledTimes(2)
      expect(errorHandler).toHaveBeenCalledTimes(1)

      // Restore original method
      retryManager.calculateRetryDelay = originalCalculateRetryDelay
    })

    it('should not retry on non-retryable errors', async () => {
      const failOperation = jest.fn().mockRejectedValue(new Error('Validation error'))
      const errorHandler = jest.fn().mockReturnValue({
        id: 'test-error-9',
        type: ErrorType.VALIDATION,
        message: 'Validation error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: false
      })

      try {
        await retryManager.executeWithRetry(
          failOperation,
          errorHandler
        )
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeDefined()
      }

      expect(failOperation).toHaveBeenCalledTimes(1)
      expect(errorHandler).toHaveBeenCalledTimes(1)
    })

    it('should respect max attempts limit', async () => {
      const alwaysFailOperation = jest.fn().mockRejectedValue(new Error('Network error'))
      const errorHandler = jest.fn().mockReturnValue({
        id: 'test-error-10',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      })

      // Mock the retry delay to be 0 for faster tests
      const originalCalculateRetryDelay = retryManager.calculateRetryDelay
      retryManager.calculateRetryDelay = jest.fn().mockReturnValue(0)

      try {
        await retryManager.executeWithRetry(
          alwaysFailOperation,
          errorHandler,
          { maxAttempts: 2 }
        )
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeDefined()
      }

      expect(alwaysFailOperation).toHaveBeenCalledTimes(2)
      expect(errorHandler).toHaveBeenCalledTimes(2)

      // Restore original method
      retryManager.calculateRetryDelay = originalCalculateRetryDelay
    })
  })

  describe('cooldown management', () => {
    it('should set and check cooldown correctly', () => {
      const errorId = 'test-error-11'
      
      expect(retryManager.isInCooldown(errorId)).toBe(false)
      
      retryManager.setCooldown(errorId, 5000)
      expect(retryManager.isInCooldown(errorId)).toBe(true)
      
      const remaining = retryManager.getCooldownRemaining(errorId)
      expect(remaining).toBeGreaterThan(4000)
      expect(remaining).toBeLessThanOrEqual(5000)
    })

    it('should clear cooldown after timeout', () => {
      const errorId = 'test-error-12'
      
      retryManager.setCooldown(errorId, 1000)
      expect(retryManager.isInCooldown(errorId)).toBe(true)
      
      // Fast forward time
      jest.advanceTimersByTime(1100)
      
      expect(retryManager.isInCooldown(errorId)).toBe(false)
      expect(retryManager.getCooldownRemaining(errorId)).toBe(0)
    })
  })

  describe('retry statistics', () => {
    it('should track retry statistics correctly', async () => {
      // Create a fresh retry manager for this test to avoid interference
      const testRetryManager = new RetryManager()
      
      const failThenSucceedOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      const errorHandler = jest.fn().mockReturnValue({
        id: 'test-error-13',
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: new Date(),
        context: { retryCount: 0, userAgent: 'test' },
        retryable: true
      })

      // Mock the retry delay to be 0 for faster tests
      const originalCalculateRetryDelay = testRetryManager.calculateRetryDelay
      testRetryManager.calculateRetryDelay = jest.fn().mockReturnValue(0)

      await testRetryManager.executeWithRetry(failThenSucceedOperation, errorHandler)

      const stats = testRetryManager.getRetryStatistics()
      expect(stats.totalOperations).toBeGreaterThan(0)
      expect(stats.operationsWithRetries).toBeGreaterThan(0)
      expect(stats.errorTypeDistribution[ErrorType.NETWORK]).toBeGreaterThan(0)

      // Restore original method
      testRetryManager.calculateRetryDelay = originalCalculateRetryDelay
    })
  })
})

describe('Global retry manager and convenience functions', () => {
  beforeEach(() => {
    globalRetryManager.clearAllRetryStates()
  })

  it('should use global retry manager for convenience functions', () => {
    const networkError: EnhancedError = {
      id: 'test-error-14',
      type: ErrorType.NETWORK,
      message: 'Network error',
      timestamp: new Date(),
      context: { retryCount: 0, userAgent: 'test' },
      retryable: true
    }

    expect(shouldRetry(networkError, 1)).toBe(true)
    expect(calculateRetryDelay(networkError, 1)).toBeGreaterThan(0)
  })

  it('should execute with retry using convenience function', async () => {
    const successOperation = jest.fn().mockResolvedValue('success')
    const errorHandler = jest.fn()

    const result = await executeWithRetry(successOperation, errorHandler)
    expect(result).toBe('success')
  })
})

describe('Error type specific configurations', () => {
  it('should have correct configurations for each error type', () => {
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.NETWORK].maxAttempts).toBe(3)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.TIMEOUT].maxAttempts).toBe(2)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.SERVER].maxAttempts).toBe(2)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.AI_SERVICE].maxAttempts).toBe(2)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.VALIDATION].maxAttempts).toBe(1)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.UNKNOWN].maxAttempts).toBe(1)
  })

  it('should have appropriate base delays for each error type', () => {
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.NETWORK].baseDelay).toBe(1000)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.TIMEOUT].baseDelay).toBe(2000)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.SERVER].baseDelay).toBe(5000)
    expect(ERROR_TYPE_RETRY_CONFIGS[ErrorType.AI_SERVICE].baseDelay).toBe(3000)
  })
})