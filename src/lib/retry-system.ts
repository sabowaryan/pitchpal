/**
 * Intelligent Retry System with Exponential Backoff
 * 
 * This module provides sophisticated retry logic with exponential backoff,
 * cooldown management, and intelligent retry decisions based on error types.
 */

import { ErrorType, EnhancedError, RetryConfig } from '@/types/enhanced-errors'

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
    ErrorType.AI_SERVICE
  ]
}

/**
 * Retry configuration per error type
 */
export const ERROR_TYPE_RETRY_CONFIGS: Record<ErrorType, RetryConfig> = {
  [ErrorType.NETWORK]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.NETWORK]
  },
  [ErrorType.TIMEOUT]: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2.5,
    retryableErrors: [ErrorType.TIMEOUT]
  },
  [ErrorType.SERVER]: {
    maxAttempts: 2,
    baseDelay: 5000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.SERVER]
  },
  [ErrorType.AI_SERVICE]: {
    maxAttempts: 2,
    baseDelay: 3000,
    maxDelay: 12000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.AI_SERVICE]
  },
  [ErrorType.VALIDATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    retryableErrors: []
  },
  [ErrorType.UNKNOWN]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    retryableErrors: []
  }
}

/**
 * Interface for retry attempt tracking
 */
export interface RetryAttempt {
  attemptNumber: number
  timestamp: Date
  error: EnhancedError
  nextRetryAt?: Date
}

/**
 * Interface for retry state management
 */
export interface RetryState {
  attempts: RetryAttempt[]
  isRetrying: boolean
  nextRetryAt?: Date
  cooldownUntil?: Date
  totalAttempts: number
}

/**
 * Intelligent Retry Manager
 */
export class RetryManager {
  private retryStates = new Map<string, RetryState>()
  private cooldownTimers = new Map<string, NodeJS.Timeout>()

  /**
   * Determines if an error should be retried
   */
  shouldRetry(
    error: EnhancedError, 
    attemptCount: number, 
    config?: Partial<RetryConfig>
  ): boolean {
    const retryConfig = this.getRetryConfig(error.type, config)
    
    // Check if error type is retryable
    if (!retryConfig.retryableErrors.includes(error.type)) {
      return false
    }

    // Check if we haven't exceeded max attempts
    if (attemptCount >= retryConfig.maxAttempts) {
      return false
    }

    // Check if we're in cooldown period
    if (this.isInCooldown(error.id)) {
      return false
    }

    // Additional logic for specific error types
    switch (error.type) {
      case ErrorType.VALIDATION:
        // Never retry validation errors
        return false
      
      case ErrorType.NETWORK:
        // Retry network errors unless it's a DNS or certificate error
        return !error.message.includes('certificate') && 
               !error.message.includes('DNS');
      
      case ErrorType.SERVER:
        // Don't retry 4xx errors, only 5xx
        if (error.originalError?.message.includes('4')) {
          return false
        }
        return true
      
      case ErrorType.AI_SERVICE:
        // Don't retry if quota exceeded permanently
        return !error.message.includes('quota exceeded permanently')
      
      default:
        return true
    }
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  calculateRetryDelay(
    error: EnhancedError, 
    attemptCount: number, 
    config?: Partial<RetryConfig>
  ): number {
    const retryConfig = this.getRetryConfig(error.type, config)
    
    // Calculate exponential backoff
    const exponentialDelay = retryConfig.baseDelay * 
      Math.pow(retryConfig.backoffMultiplier, attemptCount - 1)
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay
    const delayWithJitter = exponentialDelay + jitter
    
    // Cap at maximum delay
    const finalDelay = Math.min(delayWithJitter, retryConfig.maxDelay)
    
    return Math.round(finalDelay)
  }

  /**
   * Executes a function with intelligent retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorHandler: (error: unknown) => EnhancedError,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const operationId = this.generateOperationId()
    let lastError: EnhancedError | null = null
    
    for (let attempt = 1; attempt <= (config?.maxAttempts || DEFAULT_RETRY_CONFIG.maxAttempts); attempt++) {
      try {
        const result = await operation()
        
        // Mark operation as successful and update total attempts for statistics
        const retryState = this.retryStates.get(operationId)
        if (retryState) {
          retryState.isRetrying = false
          retryState.totalAttempts = Math.max(retryState.totalAttempts, attempt)
          this.retryStates.set(operationId, retryState)
        } else if (attempt === 1) {
          // First attempt succeeded, still track it for statistics
          this.retryStates.set(operationId, {
            attempts: [],
            isRetrying: false,
            totalAttempts: 1
          })
        }
        
        return result
      } catch (error) {
        const enhancedError = errorHandler(error)
        lastError = enhancedError
        
        // Update retry state
        this.updateRetryState(operationId, enhancedError, attempt)
        
        // Check if we should retry
        if (!this.shouldRetry(enhancedError, attempt, config)) {
          break
        }
        
        // Calculate and wait for retry delay
        const retryDelay = this.calculateRetryDelay(enhancedError, attempt, config)
        
        if (retryDelay > 0) {
          await this.sleep(retryDelay)
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError
  }

  /**
   * Sets up cooldown period for an error
   */
  setCooldown(errorId: string, cooldownMs: number): void {
    const cooldownUntil = new Date(Date.now() + cooldownMs)
    
    const retryState = this.retryStates.get(errorId) || {
      attempts: [],
      isRetrying: false,
      totalAttempts: 0
    }
    
    retryState.cooldownUntil = cooldownUntil
    this.retryStates.set(errorId, retryState)
    
    // Set timer to clear cooldown
    const timer = setTimeout(() => {
      const state = this.retryStates.get(errorId)
      if (state) {
        delete state.cooldownUntil
        this.retryStates.set(errorId, state)
      }
      this.cooldownTimers.delete(errorId)
    }, cooldownMs)
    
    this.cooldownTimers.set(errorId, timer)
  }

  /**
   * Checks if an error is in cooldown period
   */
  isInCooldown(errorId: string): boolean {
    const retryState = this.retryStates.get(errorId)
    if (!retryState?.cooldownUntil) {
      return false
    }
    
    return new Date() < retryState.cooldownUntil
  }

  /**
   * Gets remaining cooldown time in milliseconds
   */
  getCooldownRemaining(errorId: string): number {
    const retryState = this.retryStates.get(errorId)
    if (!retryState?.cooldownUntil) {
      return 0
    }
    
    const remaining = retryState.cooldownUntil.getTime() - Date.now()
    return Math.max(0, remaining)
  }

  /**
   * Gets retry state for an error
   */
  getRetryState(errorId: string): RetryState | undefined {
    return this.retryStates.get(errorId)
  }

  /**
   * Clears retry state for an error
   */
  clearRetryState(errorId: string): void {
    this.retryStates.delete(errorId)
    
    const timer = this.cooldownTimers.get(errorId)
    if (timer) {
      clearTimeout(timer)
      this.cooldownTimers.delete(errorId)
    }
  }

  /**
   * Clears all retry states
   */
  clearAllRetryStates(): void {
    this.retryStates.clear()
    
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer)
    }
    this.cooldownTimers.clear()
  }

  /**
   * Gets retry statistics
   */
  getRetryStatistics(): {
    totalOperations: number
    operationsWithRetries: number
    averageRetries: number
    errorTypeDistribution: Record<ErrorType, number>
  } {
    const states = Array.from(this.retryStates.values())
    const totalOperations = states.length
    const operationsWithRetries = states.filter(s => s.totalAttempts > 1).length
    
    const totalRetries = states.reduce((sum, state) => sum + (state.totalAttempts - 1), 0)
    const averageRetries = totalOperations > 0 ? totalRetries / totalOperations : 0
    
    const errorTypeDistribution: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.TIMEOUT]: 0,
      [ErrorType.SERVER]: 0,
      [ErrorType.AI_SERVICE]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.UNKNOWN]: 0
    }
    
    states.forEach(state => {
      state.attempts.forEach(attempt => {
        errorTypeDistribution[attempt.error.type]++
      })
    })
    
    return {
      totalOperations,
      operationsWithRetries,
      averageRetries,
      errorTypeDistribution
    }
  }

  /**
   * Private helper methods
   */
  private getRetryConfig(errorType: ErrorType, config?: Partial<RetryConfig>): RetryConfig {
    const baseConfig = ERROR_TYPE_RETRY_CONFIGS[errorType] || DEFAULT_RETRY_CONFIG
    return { ...baseConfig, ...config }
  }

  private updateRetryState(operationId: string, error: EnhancedError, attemptNumber: number): void {
    const existingState = this.retryStates.get(operationId) || {
      attempts: [],
      isRetrying: false,
      totalAttempts: 0
    }
    
    const attempt: RetryAttempt = {
      attemptNumber,
      timestamp: new Date(),
      error
    }
    
    existingState.attempts.push(attempt)
    existingState.totalAttempts = attemptNumber
    existingState.isRetrying = true
    
    this.retryStates.set(operationId, existingState)
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Global retry manager instance
 */
export const globalRetryManager = new RetryManager()

/**
 * Convenience function for executing operations with retry
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  errorHandler: (error: unknown) => EnhancedError,
  config?: Partial<RetryConfig>
): Promise<T> {
  return globalRetryManager.executeWithRetry(operation, errorHandler, config)
}

/**
 * Convenience function to check if should retry
 */
export function shouldRetry(
  error: EnhancedError, 
  attemptCount: number, 
  config?: Partial<RetryConfig>
): boolean {
  return globalRetryManager.shouldRetry(error, attemptCount, config)
}

/**
 * Convenience function to calculate retry delay
 */
export function calculateRetryDelay(
  error: EnhancedError, 
  attemptCount: number, 
  config?: Partial<RetryConfig>
): number {
  return globalRetryManager.calculateRetryDelay(error, attemptCount, config)
}