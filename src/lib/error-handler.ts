/**
 * Enhanced Error Classification and Handling System
 * 
 * This module provides comprehensive error classification, recovery strategies,
 * and structured logging for the pitch generator application.
 */

import { 
  ErrorType, 
  EnhancedError, 
  RecoveryStrategies, 
  ErrorLog, 
  GenerationContext,
  RetryConfig 
} from '@/types/enhanced-errors'
import { 
  globalRetryManager 
} from './retry-system'

/**
 * Classifies errors automatically based on their characteristics
 */
export function classifyError(error: Error | unknown, context?: Partial<GenerationContext>): EnhancedError {
  const timestamp = new Date()
  const errorId = generateErrorId()
  
  // Default classification
  let type: ErrorType = ErrorType.UNKNOWN
  let message = 'Une erreur inattendue s\'est produite'
  let retryable = false
  let suggestedAction = 'Veuillez réessayer plus tard'
  let helpUrl: string | undefined

  if (error instanceof Error) {
    // Enhanced error classification with more specific patterns
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      type = ErrorType.NETWORK
      message = 'Problème de connexion réseau'
      retryable = true
      suggestedAction = 'Vérifiez votre connexion internet et réessayez'
      helpUrl = '/help/network-issues'
    }
    // Timeout errors (enhanced detection)
    else if (error.name === 'AbortError' || 
             error.message.includes('timeout') || 
             error.message.includes('Timeout') ||
             error.message.includes('trop de temps')) {
      type = ErrorType.TIMEOUT
      message = 'La requête a pris trop de temps'
      retryable = true
      suggestedAction = 'Réessayez avec une idée plus courte ou attendez quelques instants'
      helpUrl = '/help/timeout-issues'
    }
    // Validation errors (enhanced detection)
    else if (error.message.includes('validation') || 
             error.message.includes('invalid') ||
             error.message.includes('invalide') ||
             error.message.includes('requis') ||
             error.message.includes('required') ||
             error.message.includes('format')) {
      type = ErrorType.VALIDATION
      message = error.message // Use the specific validation message
      retryable = false
      suggestedAction = 'Vérifiez vos données et corrigez les erreurs indiquées'
      helpUrl = '/help/validation-guide'
    }
    // Rate limiting errors
    else if (error.message.includes('requêtes') || 
             error.message.includes('limite') ||
             error.message.includes('rate limit')) {
      type = ErrorType.VALIDATION
      message = 'Limite de requêtes dépassée'
      retryable = true
      suggestedAction = 'Attendez quelques minutes avant de réessayer'
      helpUrl = '/help/rate-limits'
    }
    // AI Service errors (enhanced detection)
    else if (error.message.includes('AI') || 
             error.message.includes('quota') || 
             error.message.includes('model') ||
             error.message.includes('OpenAI') ||
             error.message.includes('API key') ||
             error.message.includes('service unavailable')) {
      type = ErrorType.AI_SERVICE
      message = 'Service d\'IA temporairement indisponible'
      retryable = true
      suggestedAction = 'Le service d\'IA est surchargé, réessayez dans quelques instants'
      helpUrl = '/help/ai-service-issues'
    }
    // Server errors (enhanced detection)
    else if (error.message.includes('500') || 
             error.message.includes('server error') ||
             error.message.includes('Internal Server Error') ||
             error.message.includes('serveur')) {
      type = ErrorType.SERVER
      message = 'Problème temporaire du serveur'
      retryable = true
      suggestedAction = 'Problème technique temporaire, réessayez dans quelques minutes'
      helpUrl = '/help/server-issues'
    }
    // JSON parsing errors
    else if (error.message.includes('JSON') || 
             error.message.includes('parse') ||
             error.message.includes('Unexpected token')) {
      type = ErrorType.VALIDATION
      message = 'Format de données invalide'
      retryable = false
      suggestedAction = 'Vérifiez le format de vos données'
      helpUrl = '/help/data-format'
    }
    // Memory or resource errors
    else if (error.message.includes('memory') || 
             error.message.includes('heap') ||
             error.message.includes('resource')) {
      type = ErrorType.SERVER
      message = 'Ressources serveur temporairement insuffisantes'
      retryable = true
      suggestedAction = 'Réessayez avec une idée plus courte'
      helpUrl = '/help/resource-limits'
    }
  }

  // Handle HTTP Response errors with enhanced classification
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const httpError = error as { status: number; statusText?: string }
    
    switch (Math.floor(httpError.status / 100)) {
      case 4: // 4xx errors
        if (httpError.status === 400) {
          type = ErrorType.VALIDATION
          message = 'Données de requête invalides'
          suggestedAction = 'Vérifiez vos données et réessayez'
        } else if (httpError.status === 401) {
          type = ErrorType.VALIDATION
          message = 'Authentification requise'
          suggestedAction = 'Vérifiez vos permissions'
        } else if (httpError.status === 403) {
          type = ErrorType.VALIDATION
          message = 'Accès refusé'
          suggestedAction = 'Vous n\'avez pas les permissions nécessaires'
        } else if (httpError.status === 404) {
          type = ErrorType.VALIDATION
          message = 'Ressource non trouvée'
          suggestedAction = 'Vérifiez l\'URL ou contactez le support'
        } else if (httpError.status === 408) {
          type = ErrorType.TIMEOUT
          message = 'Délai d\'attente dépassé'
          suggestedAction = 'Réessayez avec une requête plus simple'
        } else if (httpError.status === 429) {
          type = ErrorType.VALIDATION
          message = 'Trop de requêtes'
          suggestedAction = 'Attendez avant de réessayer'
        } else {
          type = ErrorType.VALIDATION
          message = `Erreur de requête (${httpError.status})`
          suggestedAction = 'Vérifiez vos données'
        }
        retryable = httpError.status === 408 || httpError.status === 429
        break
        
      case 5: // 5xx errors
        type = ErrorType.SERVER
        retryable = true
        if (httpError.status === 500) {
          message = 'Erreur interne du serveur'
          suggestedAction = 'Problème technique temporaire, réessayez'
        } else if (httpError.status === 502) {
          message = 'Passerelle défaillante'
          suggestedAction = 'Problème de connexion serveur, réessayez'
        } else if (httpError.status === 503) {
          message = 'Service temporairement indisponible'
          suggestedAction = 'Service en maintenance, réessayez plus tard'
        } else if (httpError.status === 504) {
          message = 'Délai d\'attente de la passerelle'
          suggestedAction = 'Réessayez avec une requête plus simple'
        } else {
          message = `Erreur serveur (${httpError.status})`
          suggestedAction = 'Problème serveur temporaire'
        }
        break
    }
  }

  return {
    id: errorId,
    type,
    message,
    timestamp,
    context: {
      idea: context?.idea,
      tone: context?.tone,
      retryCount: 0,
      userAgent: context?.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'server')
    },
    originalError: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined,
    retryable,
    suggestedAction,
    helpUrl
  }
}

/**
 * Recovery strategies for different error types
 */
export const recoveryStrategies: RecoveryStrategies = {
  [ErrorType.NETWORK]: {
    autoRetry: true,
    maxAttempts: 3,
    backoffMs: [1000, 2000, 4000],
    userAction: 'Vérifiez votre connexion internet'
  },
  [ErrorType.TIMEOUT]: {
    autoRetry: true,
    maxAttempts: 2,
    backoffMs: [2000, 5000],
    userAction: 'Réessayez avec une idée plus courte'
  },
  [ErrorType.SERVER]: {
    autoRetry: true,
    maxAttempts: 2,
    backoffMs: [5000, 10000],
    userAction: 'Réessayez dans quelques minutes'
  },
  [ErrorType.AI_SERVICE]: {
    autoRetry: true,
    maxAttempts: 2,
    backoffMs: [3000, 6000],
    userAction: 'Le service d\'IA est temporairement surchargé'
  },
  [ErrorType.VALIDATION]: {
    autoRetry: false,
    maxAttempts: 1,
    backoffMs: [0],
    userAction: 'Corrigez les erreurs de validation'
  },
  [ErrorType.UNKNOWN]: {
    autoRetry: false,
    maxAttempts: 1,
    backoffMs: [0],
    userAction: 'Contactez le support si le problème persiste'
  }
}

/**
 * Enhanced Error Handler class
 */
export class ErrorHandler {
  private errorLogs: ErrorLog[] = []
  private maxLogSize = 100

  /**
   * Handles an error with automatic classification and recovery strategy
   */
  handleError(
    error: Error | unknown, 
    context?: Partial<GenerationContext>
  ): { 
    enhancedError: EnhancedError
    shouldRetry: boolean
    retryDelay: number
  } {
    const enhancedError = classifyError(error, context)
    const strategy = recoveryStrategies[enhancedError.type]
    
    // Log the error
    this.logError(enhancedError, context)
    
    // Determine retry logic
    const shouldRetry = strategy.autoRetry && enhancedError.retryable
    const retryDelay = strategy.backoffMs[0] || 0

    return {
      enhancedError,
      shouldRetry,
      retryDelay
    }
  }

  /**
   * Determines if an error should be retried based on attempt count
   */
  shouldRetry(error: EnhancedError, attemptCount: number): boolean {
    const strategy = recoveryStrategies[error.type]
    return strategy.autoRetry && 
           error.retryable && 
           attemptCount < strategy.maxAttempts
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  getRetryDelay(error: EnhancedError, attemptCount: number): number {
    const strategy = recoveryStrategies[error.type]
    const delayIndex = Math.min(attemptCount, strategy.backoffMs.length - 1)
    return strategy.backoffMs[delayIndex] || strategy.backoffMs[strategy.backoffMs.length - 1]
  }

  /**
   * Logs error with structured format and enhanced context
   */
  private logError(error: EnhancedError, context?: Partial<GenerationContext>): void {
    const errorLog: ErrorLog = {
      errorId: error.id,
      timestamp: error.timestamp,
      userId: context?.userId,
      sessionId: context?.sessionId || generateSessionId(),
      error,
      context: {
        idea: context?.idea || '',
        tone: context?.tone || '',
        timestamp: new Date(),
        sessionId: context?.sessionId || generateSessionId(),
        userId: context?.userId,
        userAgent: context?.userAgent,
        clientIp: context?.clientIp,
        referer: context?.referer
      },
      userAgent: context?.userAgent || error.context.userAgent,
      url: typeof window !== 'undefined' ? window.location.href : context?.referer || ''
    }

    // Add to in-memory log (in production, this would go to a logging service)
    this.errorLogs.push(errorLog)
    
    // Maintain log size limit
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogSize)
    }

    // Enhanced structured logging for different environments
    const logLevel = this.getLogLevel(error.type)
    const logData = {
      errorId: error.id,
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.timestamp.toISOString(),
      context: {
        sessionId: errorLog.sessionId,
        userId: context?.userId,
        ideaLength: context?.idea?.length || 0,
        tone: context?.tone,
        userAgent: context?.userAgent,
        clientIp: context?.clientIp ? this.maskIp(context.clientIp) : undefined,
        referer: context?.referer
      },
      originalError: error.originalError ? {
        name: error.originalError.name,
        message: error.originalError.message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error.originalError.stack })
      } : undefined,
      suggestedAction: error.suggestedAction,
      helpUrl: error.helpUrl
    }
    
    // Console logging for non-production environments with enhanced formatting
    if (process.env.NODE_ENV !== 'production') {
      console.group(`🚨 ${logLevel.toUpperCase()} [${error.type}] - ${error.id}`)
      console.error('Message:', error.message)
      console.error('Retryable:', error.retryable)
      console.error('Context:', logData.context)
      console.error('Suggested Action:', error.suggestedAction)
      if (error.originalError) {
        console.error('Original Error:', error.originalError)
      }
      console.groupEnd()
    } else {
      // Production logging - structured JSON format
      console.log(JSON.stringify({
        level: logLevel,
        service: 'pitch-generator-api',
        ...logData
      }))
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      // Don't await this to avoid blocking the main flow
      this.sendToLoggingService(errorLog).catch(() => {
        // Silently fail logging to avoid recursive errors
      })
    }

    // Update error statistics for monitoring
    this.updateErrorStatistics(error.type)
  }

  /**
   * Determines appropriate log level based on error type
   */
  private getLogLevel(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return 'warn'
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return 'error'
      case ErrorType.SERVER:
      case ErrorType.AI_SERVICE:
        return 'error'
      case ErrorType.UNKNOWN:
        return 'error'
      default:
        return 'error'
    }
  }

  /**
   * Masks IP address for privacy (keeps first 3 octets for IPv4)
   */
  private maskIp(ip: string): string {
    if (ip.includes('.')) {
      // IPv4
      const parts = ip.split('.')
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
      }
    } else if (ip.includes(':')) {
      // IPv6 - mask last 4 groups
      const parts = ip.split(':')
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + ':xxxx:xxxx:xxxx:xxxx'
      }
    }
    return 'xxx.xxx.xxx.xxx'
  }

  /**
   * Updates error statistics for monitoring
   */
  private errorStats = new Map<ErrorType, { count: number; lastOccurrence: Date }>()
  
  private updateErrorStatistics(errorType: ErrorType): void {
    const current = this.errorStats.get(errorType) || { count: 0, lastOccurrence: new Date() }
    this.errorStats.set(errorType, {
      count: current.count + 1,
      lastOccurrence: new Date()
    })
  }

  /**
   * Gets error statistics for monitoring dashboard
   */
  getErrorStatistics(): Record<string, { count: number; lastOccurrence: string }> {
    const stats: Record<string, { count: number; lastOccurrence: string }> = {}
    
    for (const [type, data] of this.errorStats.entries()) {
      stats[type] = {
        count: data.count,
        lastOccurrence: data.lastOccurrence.toISOString()
      }
    }
    
    return stats
  }

  /**
   * Retrieves error logs (for debugging/monitoring)
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs]
  }

  /**
   * Clears error logs
   */
  clearErrorLogs(): void {
    this.errorLogs = []
  }

  /**
   * Executes an operation with intelligent retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Partial<GenerationContext>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    return globalRetryManager.executeWithRetry(
      operation,
      (error) => classifyError(error, context),
      config
    )
  }

  /**
   * Uses intelligent retry manager for retry decisions
   */
  shouldRetryWithManager(error: EnhancedError, attemptCount: number, config?: Partial<RetryConfig>): boolean {
    return globalRetryManager.shouldRetry(error, attemptCount, config)
  }

  /**
   * Uses intelligent retry manager for delay calculation
   */
  getRetryDelayWithManager(error: EnhancedError, attemptCount: number, config?: Partial<RetryConfig>): number {
    return globalRetryManager.calculateRetryDelay(error, attemptCount, config)
  }

  /**
   * Sets cooldown for an error to prevent immediate retries
   */
  setCooldown(errorId: string, cooldownMs: number): void {
    globalRetryManager.setCooldown(errorId, cooldownMs)
  }

  /**
   * Checks if an error is in cooldown period
   */
  isInCooldown(errorId: string): boolean {
    return globalRetryManager.isInCooldown(errorId)
  }

  /**
   * Gets remaining cooldown time for an error
   */
  getCooldownRemaining(errorId: string): number {
    return globalRetryManager.getCooldownRemaining(errorId)
  }

  /**
   * Gets retry statistics for monitoring
   */
  getRetryStatistics() {
    return globalRetryManager.getRetryStatistics()
  }

  /**
   * Sends error log to external logging service
   */
  private async sendToLoggingService(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real implementation, this would send to a service like Sentry, LogRocket, etc.
      // For now, we'll just simulate the call
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorLog)
      }).catch(() => {
        // Silently fail logging to avoid recursive errors
      })
    } catch {
      // Silently fail logging to avoid recursive errors
    }
  }
}

/**
 * Utility functions
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler()

/**
 * Convenience function for quick error handling
 */
export function handleError(error: Error | unknown, context?: Partial<GenerationContext>) {
  return globalErrorHandler.handleError(error, context)
}