/**
 * Unit Tests for Enhanced Error Handling System
 */

import {
  classifyError,
  ErrorHandler,
  recoveryStrategies,
  globalErrorHandler,
  handleError
} from '../error-handler'
import { ErrorType } from '@/types/enhanced-errors'

describe('Error Classification System', () => {
  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const networkError = new TypeError('Failed to fetch')
      const result = classifyError(networkError)

      expect(result.type).toBe(ErrorType.NETWORK)
      expect(result.message).toBe('Problème de connexion réseau')
      expect(result.retryable).toBe(true)
      expect(result.suggestedAction).toBe('Vérifiez votre connexion internet et réessayez')
      expect(result.helpUrl).toBe('/help/network-issues')
    })

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout')
      const result = classifyError(timeoutError)

      expect(result.type).toBe(ErrorType.TIMEOUT)
      expect(result.message).toBe('La requête a pris trop de temps')
      expect(result.retryable).toBe(true)
      expect(result.suggestedAction).toBe('Réessayez avec une idée plus courte')
    })

    it('should classify AbortError as timeout', () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      const result = classifyError(abortError)

      expect(result.type).toBe(ErrorType.TIMEOUT)
      expect(result.retryable).toBe(true)
    })

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Validation failed: invalid input')
      const result = classifyError(validationError)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.message).toBe('Les données saisies ne sont pas valides')
      expect(result.retryable).toBe(false)
      expect(result.suggestedAction).toBe('Vérifiez vos données et corrigez les erreurs')
    })

    it('should classify server errors correctly', () => {
      const serverError = new Error('Internal server error 500')
      const result = classifyError(serverError)

      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.message).toBe('Problème temporaire du serveur')
      expect(result.retryable).toBe(true)
      expect(result.suggestedAction).toBe('Réessayez dans quelques minutes')
    })

    it('should classify AI service errors correctly', () => {
      const aiError = new Error('AI model quota exceeded')
      const result = classifyError(aiError)

      expect(result.type).toBe(ErrorType.AI_SERVICE)
      expect(result.message).toBe('Service d\'IA temporairement indisponible')
      expect(result.retryable).toBe(true)
      expect(result.suggestedAction).toBe('Réessayez dans quelques instants')
    })

    it('should classify HTTP status errors correctly', () => {
      const httpError = { status: 404, statusText: 'Not Found' }
      const result = classifyError(httpError)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.message).toBe('Erreur de requête (404)')
      expect(result.retryable).toBe(false)
    })

    it('should classify 5xx HTTP errors as server errors', () => {
      const serverHttpError = { status: 503, statusText: 'Service Unavailable' }
      const result = classifyError(serverHttpError)

      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.message).toBe('Erreur serveur (503)')
      expect(result.retryable).toBe(true)
    })

    it('should classify unknown errors correctly', () => {
      const unknownError = new Error('Some random error')
      const result = classifyError(unknownError)

      expect(result.type).toBe(ErrorType.UNKNOWN)
      expect(result.message).toBe('Une erreur inattendue s\'est produite')
      expect(result.retryable).toBe(false)
    })

    it('should include context information', () => {
      const error = new Error('Test error')
      const context = {
        idea: 'Test idea',
        tone: 'professional',
        userId: 'user123'
      }
      const result = classifyError(error, context)

      expect(result.context.idea).toBe('Test idea')
      expect(result.context.tone).toBe('professional')
      expect(result.context.retryCount).toBe(0)
      expect(result.context.userAgent).toBeDefined()
    })

    it('should generate unique error IDs', () => {
      const error = new Error('Test')
      const result1 = classifyError(error)
      const result2 = classifyError(error)

      expect(result1.id).not.toBe(result2.id)
      expect(result1.id).toMatch(/^err_\d+_[a-z0-9]+$/)
    })

    it('should include original error information', () => {
      const originalError = new Error('Original message')
      originalError.stack = 'Stack trace here'
      const result = classifyError(originalError)

      expect(result.originalError).toBeDefined()
      expect(result.originalError?.name).toBe('Error')
      expect(result.originalError?.message).toBe('Original message')
      expect(result.originalError?.stack).toBe('Stack trace here')
    })
  })

  describe('Recovery Strategies', () => {
    it('should have correct network recovery strategy', () => {
      const strategy = recoveryStrategies[ErrorType.NETWORK]

      expect(strategy.autoRetry).toBe(true)
      expect(strategy.maxAttempts).toBe(3)
      expect(strategy.backoffMs).toEqual([1000, 2000, 4000])
      expect(strategy.userAction).toBe('Vérifiez votre connexion internet')
    })

    it('should have correct timeout recovery strategy', () => {
      const strategy = recoveryStrategies[ErrorType.TIMEOUT]

      expect(strategy.autoRetry).toBe(true)
      expect(strategy.maxAttempts).toBe(2)
      expect(strategy.backoffMs).toEqual([2000, 5000])
    })

    it('should have correct validation recovery strategy', () => {
      const strategy = recoveryStrategies[ErrorType.VALIDATION]

      expect(strategy.autoRetry).toBe(false)
      expect(strategy.maxAttempts).toBe(1)
      expect(strategy.backoffMs).toEqual([0])
    })

    it('should have strategies for all error types', () => {
      const errorTypes = Object.values(ErrorType)

      errorTypes.forEach(errorType => {
        expect(recoveryStrategies[errorType]).toBeDefined()
      })
    })
  })
})

describe('ErrorHandler Class', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    errorHandler = new ErrorHandler()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('handleError', () => {
    it('should handle error and return correct response', () => {
      const error = new TypeError('Failed to fetch')
      const context = { idea: 'Test idea', tone: 'casual' }

      const result = errorHandler.handleError(error, context)

      expect(result.enhancedError.type).toBe(ErrorType.NETWORK)
      expect(result.shouldRetry).toBe(true)
      expect(result.retryDelay).toBe(1000)
    })

    it('should not retry validation errors', () => {
      const error = new Error('validation failed: invalid input')
      const result = errorHandler.handleError(error)

      expect(result.enhancedError.type).toBe(ErrorType.VALIDATION)
      expect(result.shouldRetry).toBe(false)
      expect(result.retryDelay).toBe(0)
    })

    it('should log errors', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation(() => { })
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => { })

      // Set NODE_ENV to development for console logging
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      const error = new Error('Test error')
      errorHandler.handleError(error)

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Message:', 'Une erreur inattendue s\'est produite')
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })

      // Restore console methods
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('shouldRetry', () => {
    it('should return true for retryable errors within attempt limit', () => {
      const error = classifyError(new TypeError('Failed to fetch'))

      expect(errorHandler.shouldRetry(error, 0)).toBe(true)
      expect(errorHandler.shouldRetry(error, 1)).toBe(true)
      expect(errorHandler.shouldRetry(error, 2)).toBe(true)
    })

    it('should return false when max attempts exceeded', () => {
      const error = classifyError(new TypeError('Failed to fetch'))

      expect(errorHandler.shouldRetry(error, 3)).toBe(false)
      expect(errorHandler.shouldRetry(error, 5)).toBe(false)
    })

    it('should return false for non-retryable errors', () => {
      const error = classifyError(new Error('Validation failed'))

      expect(errorHandler.shouldRetry(error, 0)).toBe(false)
      expect(errorHandler.shouldRetry(error, 1)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should return correct delay for network errors', () => {
      const error = classifyError(new TypeError('Failed to fetch'))

      expect(errorHandler.getRetryDelay(error, 0)).toBe(1000)
      expect(errorHandler.getRetryDelay(error, 1)).toBe(2000)
      expect(errorHandler.getRetryDelay(error, 2)).toBe(4000)
    })

    it('should return last delay for attempts beyond array length', () => {
      const error = classifyError(new TypeError('Failed to fetch'))

      expect(errorHandler.getRetryDelay(error, 5)).toBe(4000)
      expect(errorHandler.getRetryDelay(error, 10)).toBe(4000)
    })

    it('should return correct delay for timeout errors', () => {
      const error = classifyError(new Error('Request timeout'))

      expect(errorHandler.getRetryDelay(error, 0)).toBe(2000)
      expect(errorHandler.getRetryDelay(error, 1)).toBe(5000)
    })
  })

  describe('error logging', () => {
    it('should store error logs', () => {
      const error = new Error('Test error')
      errorHandler.handleError(error)

      const logs = errorHandler.getErrorLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].error.message).toBe('Une erreur inattendue s\'est produite')
    })

    it('should maintain log size limit', () => {
      // Create more than 100 errors to test log size limit
      for (let i = 0; i < 105; i++) {
        errorHandler.handleError(new Error(`Error ${i}`))
      }

      const logs = errorHandler.getErrorLogs()
      expect(logs).toHaveLength(100)
    })

    it('should clear error logs', () => {
      errorHandler.handleError(new Error('Test error'))
      expect(errorHandler.getErrorLogs()).toHaveLength(1)

      errorHandler.clearErrorLogs()
      expect(errorHandler.getErrorLogs()).toHaveLength(0)
    })
  })

  describe('production logging', () => {
    beforeEach(() => {
      // Mock fetch globally for these tests
      global.fetch = jest.fn()
    })

    afterEach(() => {
      // Clean up fetch mock
      delete (global as any).fetch
    })

    it('should attempt to send logs to service in production', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })

      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response)

      const error = new Error('Production error')
      errorHandler.handleError(error)

      // Wait for async logging with longer timeout
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(fetchMock).toHaveBeenCalledWith('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('Production error')
      })

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })

    it('should handle logging service failures gracefully', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })

      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
      fetchMock.mockRejectedValue(
        new Error('Logging service down')
      )

      const error = new Error('Test error')

      // Should not throw even if logging fails
      expect(() => errorHandler.handleError(error)).not.toThrow()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })
})

describe('Global Error Handler', () => {
  it('should provide global error handler instance', () => {
    expect(globalErrorHandler).toBeInstanceOf(ErrorHandler)
  })

  it('should provide convenience handleError function', () => {
    const error = new Error('Test error')
    const result = handleError(error)

    expect(result.enhancedError).toBeDefined()
    expect(result.shouldRetry).toBeDefined()
    expect(result.retryDelay).toBeDefined()
  })
})

describe('Edge Cases', () => {
  it('should handle null/undefined errors', () => {
    const result1 = classifyError(null)
    const result2 = classifyError(undefined)

    expect(result1.type).toBe(ErrorType.UNKNOWN)
    expect(result2.type).toBe(ErrorType.UNKNOWN)
  })

  it('should handle non-Error objects', () => {
    const stringError = 'String error'
    const objectError = { message: 'Object error' }

    const result1 = classifyError(stringError)
    const result2 = classifyError(objectError)

    expect(result1.type).toBe(ErrorType.UNKNOWN)
    expect(result2.type).toBe(ErrorType.UNKNOWN)
  })

  it('should handle errors without context', () => {
    const error = new Error('Test error')
    const result = classifyError(error)

    expect(result.context.idea).toBeUndefined()
    expect(result.context.tone).toBeUndefined()
    expect(result.context.retryCount).toBe(0)
  })

  it('should handle browser vs server environment', () => {
    const error = new Error('Test error')

    // Test that user agent is properly set in current environment
    const result = classifyError(error)
    expect(result.context.userAgent).toBeDefined()

    // In jsdom environment, we should get a user agent string
    if (typeof window !== 'undefined') {
      expect(result.context.userAgent).not.toBe('server')
      expect(result.context.userAgent).toContain('jsdom')
    } else {
      expect(result.context.userAgent).toBe('server')
    }
  })
})