/**
 * Integration tests for Error Handler with Retry System
 */

import { ErrorHandler, globalErrorHandler, classifyError } from '../error-handler'
import { ErrorType, GenerationContext } from '@/types/enhanced-errors'

// Mock fetch for logging
global.fetch = jest.fn()

describe('ErrorHandler with Retry System Integration', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    errorHandler = new ErrorHandler()
    jest.clearAllMocks()
  })

  afterEach(() => {
    errorHandler.clearErrorLogs()
  })

  describe('executeWithRetry integration', () => {
    it('should successfully execute operation with retry on network failure', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('fetch failed')
          error.name = 'TypeError'
          throw error
        }
        return Promise.resolve('Success!')
      })

      const result = await errorHandler.executeWithRetry(operation, context)

      expect(result).toBe('Success!')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries on persistent network error', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const networkError = new Error('fetch failed')
      networkError.name = 'TypeError'
      const operation = jest.fn().mockRejectedValue(networkError)

      try {
        await errorHandler.executeWithRetry(operation, context, { maxAttempts: 2 })
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeDefined()
      }

      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry validation errors', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const operation = jest.fn().mockRejectedValue(new Error('validation failed'))

      try {
        await errorHandler.executeWithRetry(operation, context)
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeDefined()
      }

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect cooldown periods', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      // Test cooldown functionality directly
      const errorId = 'test-cooldown-error'
      
      // Set cooldown
      errorHandler.setCooldown(errorId, 5000)
      
      // Check that cooldown is active
      expect(errorHandler.isInCooldown(errorId)).toBe(true)
      
      // Check remaining time
      const remaining = errorHandler.getCooldownRemaining(errorId)
      expect(remaining).toBeGreaterThan(4000)
      expect(remaining).toBeLessThanOrEqual(5000)
    })
  })

  describe('cooldown management integration', () => {
    it('should set and check cooldown through error handler', () => {
      const errorId = 'integration-test-error'
      
      expect(errorHandler.isInCooldown(errorId)).toBe(false)
      
      errorHandler.setCooldown(errorId, 3000)
      expect(errorHandler.isInCooldown(errorId)).toBe(true)
      
      const remaining = errorHandler.getCooldownRemaining(errorId)
      expect(remaining).toBeGreaterThan(2000)
      expect(remaining).toBeLessThanOrEqual(3000)
    })
  })

  describe('retry statistics integration', () => {
    it('should provide retry statistics through error handler', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('fetch failed')
          error.name = 'TypeError'
          throw error
        }
        return Promise.resolve('Success!')
      })

      await errorHandler.executeWithRetry(operation, context)

      const stats = errorHandler.getRetryStatistics()
      expect(stats.totalOperations).toBeGreaterThan(0)
      expect(stats.operationsWithRetries).toBeGreaterThan(0)
      expect(stats.errorTypeDistribution[ErrorType.NETWORK]).toBeGreaterThan(0)
    })
  })

  describe('error classification with retry decisions', () => {
    it('should classify network errors as retryable', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'TypeError'
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(networkError, context)
      
      expect(enhancedError.type).toBe(ErrorType.NETWORK)
      expect(enhancedError.retryable).toBe(true)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(true)
    })

    it('should classify validation errors as non-retryable', () => {
      const validationError = new Error('validation failed')
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(validationError, context)
      
      expect(enhancedError.type).toBe(ErrorType.VALIDATION)
      expect(enhancedError.retryable).toBe(false)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(false)
    })

    it('should classify timeout errors as retryable with appropriate delay', () => {
      const timeoutError = new Error('timeout')
      timeoutError.name = 'AbortError'
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(timeoutError, context)
      
      expect(enhancedError.type).toBe(ErrorType.TIMEOUT)
      expect(enhancedError.retryable).toBe(true)
      
      const delay = errorHandler.getRetryDelayWithManager(enhancedError, 1)
      expect(delay).toBeGreaterThanOrEqual(2000) // Timeout base delay
    })

    it('should classify server errors as retryable', () => {
      const serverError = new Error('server error 500')
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(serverError, context)
      
      expect(enhancedError.type).toBe(ErrorType.SERVER)
      expect(enhancedError.retryable).toBe(true)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(true)
    })

    it('should classify AI service errors as retryable', () => {
      const aiError = new Error('AI quota exceeded')
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(aiError, context)
      
      expect(enhancedError.type).toBe(ErrorType.AI_SERVICE)
      expect(enhancedError.retryable).toBe(true)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(true)
    })
  })

  describe('HTTP status code handling with retry', () => {
    it('should not retry 4xx errors', () => {
      const httpError = { status: 400, statusText: 'Bad Request' }
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(httpError, context)
      
      expect(enhancedError.type).toBe(ErrorType.VALIDATION)
      expect(enhancedError.retryable).toBe(false)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(false)
    })

    it('should retry 5xx errors', () => {
      const httpError = { status: 500, statusText: 'Internal Server Error' }
      
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      const enhancedError = classifyError(httpError, context)
      
      expect(enhancedError.type).toBe(ErrorType.SERVER)
      expect(enhancedError.retryable).toBe(true)
      expect(errorHandler.shouldRetryWithManager(enhancedError, 1)).toBe(true)
    })
  })

  describe('global error handler integration', () => {
    it('should use global error handler with retry capabilities', async () => {
      const context: Partial<GenerationContext> = {
        idea: 'Test idea',
        tone: 'professional'
      }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('fetch failed')
          error.name = 'TypeError'
          throw error
        }
        return Promise.resolve('Global success!')
      })

      const result = await globalErrorHandler.executeWithRetry(operation, context)

      expect(result).toBe('Global success!')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should provide retry statistics from global handler', () => {
      const stats = globalErrorHandler.getRetryStatistics()
      expect(stats).toHaveProperty('totalOperations')
      expect(stats).toHaveProperty('operationsWithRetries')
      expect(stats).toHaveProperty('averageRetries')
      expect(stats).toHaveProperty('errorTypeDistribution')
    })
  })
})