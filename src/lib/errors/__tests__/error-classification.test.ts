/**
 * Tests for the error classification system
 */

import { 
  classifyError, 
  createEnhancedError,
  getErrorContext,
  getErrorHelpUrl,
  getSuggestedAction
} from '../error-classification'
import { ErrorType } from '@/types/enhanced-errors'

describe('Error Classification System', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const networkError = new TypeError('Failed to fetch')
      const classified = classifyError(networkError)
      
      expect(classified.type).toBe(ErrorType.NETWORK)
      expect(classified.retryable).toBe(true)
    })

    it('should classify timeout errors', () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      const classified = classifyError(abortError)
      
      expect(classified.type).toBe(ErrorType.TIMEOUT)
      expect(classified.retryable).toBe(true)
    })

    it('should classify validation errors', () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      const classified = classifyError(validationError)
      
      expect(classified.type).toBe(ErrorType.VALIDATION)
      expect(classified.retryable).toBe(false)
    })

    it('should classify server errors', () => {
      const serverError = new Error('Internal Server Error')
      serverError.name = 'HttpError'
      // @ts-ignore
      serverError.status = 500
      const classified = classifyError(serverError)
      
      expect(classified.type).toBe(ErrorType.SERVER)
      expect(classified.retryable).toBe(true)
    })

    it('should classify AI service errors', () => {
      const aiError = new Error('AI model quota exceeded')
      // @ts-ignore
      aiError.status = 429
      const classified = classifyError(aiError)
      
      expect(classified.type).toBe(ErrorType.AI_SERVICE)
      expect(classified.retryable).toBe(true)
    })

    it('should classify unknown errors', () => {
      const unknownError = new Error('Something went wrong')
      const classified = classifyError(unknownError)
      
      expect(classified.type).toBe(ErrorType.UNKNOWN)
      expect(classified.retryable).toBe(false)
    })

    it('should preserve original error information', () => {
      const originalError = new Error('Original message')
      originalError.name = 'OriginalError'
      originalError.stack = 'Stack trace'
      
      const classified = classifyError(originalError)
      
      expect(classified.originalError).toBeDefined()
      expect(classified.originalError?.name).toBe('OriginalError')
      expect(classified.originalError?.message).toBe('Original message')
      expect(classified.originalError?.stack).toBe('Stack trace')
    })

    it('should handle non-Error objects', () => {
      const nonError = { message: 'Not an error' }
      const classified = classifyError(nonError)
      
      expect(classified.type).toBe(ErrorType.UNKNOWN)
      expect(classified.message).toContain('Not an error')
    })

    it('should handle string errors', () => {
      const stringError = 'String error message'
      const classified = classifyError(stringError)
      
      expect(classified.type).toBe(ErrorType.UNKNOWN)
      expect(classified.message).toBe('String error message')
    })

    it('should handle null/undefined errors', () => {
      const nullError = classifyError(null)
      expect(nullError.type).toBe(ErrorType.UNKNOWN)
      expect(nullError.message).toContain('Erreur inconnue')
      
      const undefinedError = classifyError(undefined)
      expect(undefinedError.type).toBe(ErrorType.UNKNOWN)
      expect(undefinedError.message).toContain('Erreur inconnue')
    })
  })

  describe('createEnhancedError', () => {
    it('should create enhanced error with all required fields', () => {
      const enhanced = createEnhancedError(
        ErrorType.NETWORK,
        'Network error message',
        true
      )
      
      expect(enhanced.id).toBeDefined()
      expect(enhanced.type).toBe(ErrorType.NETWORK)
      expect(enhanced.message).toBe('Network error message')
      expect(enhanced.timestamp).toBeInstanceOf(Date)
      expect(enhanced.retryable).toBe(true)
      expect(enhanced.context).toBeDefined()
    })

    it('should include original error when provided', () => {
      const originalError = new Error('Original error')
      const enhanced = createEnhancedError(
        ErrorType.NETWORK,
        'Network error message',
        true,
        originalError
      )
      
      expect(enhanced.originalError).toBeDefined()
      expect(enhanced.originalError?.message).toBe('Original error')
    })

    it('should include context when provided', () => {
      const context = { idea: 'Test idea', tone: 'professional' }
      const enhanced = createEnhancedError(
        ErrorType.NETWORK,
        'Network error message',
        true,
        null,
        context
      )
      
      expect(enhanced.context.idea).toBe('Test idea')
      expect(enhanced.context.tone).toBe('professional')
    })

    it('should include suggested action when provided', () => {
      const enhanced = createEnhancedError(
        ErrorType.NETWORK,
        'Network error message',
        true,
        null,
        {},
        'Try again later'
      )
      
      expect(enhanced.suggestedAction).toBe('Try again later')
    })

    it('should include help URL when provided', () => {
      const enhanced = createEnhancedError(
        ErrorType.NETWORK,
        'Network error message',
        true,
        null,
        {},
        'Try again later',
        '/help/network'
      )
      
      expect(enhanced.helpUrl).toBe('/help/network')
    })
  })

  describe('getErrorContext', () => {
    it('should extract context from error object', () => {
      const error = new Error('Test error')
      // @ts-ignore
      error.idea = 'Test idea'
      // @ts-ignore
      error.tone = 'professional'
      
      const context = getErrorContext(error)
      
      expect(context.idea).toBe('Test idea')
      expect(context.tone).toBe('professional')
    })

    it('should handle missing context', () => {
      const error = new Error('Test error')
      const context = getErrorContext(error)
      
      expect(context).toBeDefined()
      expect(context.userAgent).toBeDefined()
    })
  })

  describe('getSuggestedAction', () => {
    it('should provide action for network errors', () => {
      const action = getSuggestedAction(ErrorType.NETWORK)
      expect(action).toContain('connexion')
    })

    it('should provide action for timeout errors', () => {
      const action = getSuggestedAction(ErrorType.TIMEOUT)
      expect(action).toContain('plus courte')
    })

    it('should provide action for server errors', () => {
      const action = getSuggestedAction(ErrorType.SERVER)
      expect(action).toContain('plus tard')
    })

    it('should provide action for AI service errors', () => {
      const action = getSuggestedAction(ErrorType.AI_SERVICE)
      expect(action).toContain('plus tard')
    })

    it('should provide action for validation errors', () => {
      const action = getSuggestedAction(ErrorType.VALIDATION)
      expect(action).toContain('erreurs')
    })

    it('should provide generic action for unknown errors', () => {
      const action = getSuggestedAction(ErrorType.UNKNOWN)
      expect(action).toContain('support')
    })
  })

  describe('getErrorHelpUrl', () => {
    it('should provide help URL for network errors', () => {
      const url = getErrorHelpUrl(ErrorType.NETWORK)
      expect(url).toContain('network')
    })

    it('should provide help URL for timeout errors', () => {
      const url = getErrorHelpUrl(ErrorType.TIMEOUT)
      expect(url).toContain('timeout')
    })

    it('should provide help URL for server errors', () => {
      const url = getErrorHelpUrl(ErrorType.SERVER)
      expect(url).toContain('server')
    })

    it('should provide help URL for AI service errors', () => {
      const url = getErrorHelpUrl(ErrorType.AI_SERVICE)
      expect(url).toContain('ai')
    })

    it('should provide help URL for validation errors', () => {
      const url = getErrorHelpUrl(ErrorType.VALIDATION)
      expect(url).toContain('validation')
    })

    it('should provide generic help URL for unknown errors', () => {
      const url = getErrorHelpUrl(ErrorType.UNKNOWN)
      expect(url).toContain('help')
    })
  })
})