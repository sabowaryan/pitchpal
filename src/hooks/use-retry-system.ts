/**
 * Retry System Hook with Exponential Backoff
 * 
 * This hook provides intelligent retry functionality with exponential backoff,
 * cooldown management, and configurable retry strategies.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ErrorType } from '@/types/enhanced-errors'

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  autoRetry: boolean
}

interface RetryableError {
  type: ErrorType
  retryable?: boolean
}

interface UseRetrySystemOptions extends Partial<RetryConfig> {}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  autoRetry: false
}

const RETRYABLE_ERROR_TYPES = [
  ErrorType.NETWORK,
  ErrorType.TIMEOUT,
  ErrorType.SERVER,
  ErrorType.AI_SERVICE
]

export function useRetrySystem(options: UseRetrySystemOptions = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  
  const [retryCount, setRetryCountState] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
    }
  }, [])

  // Calculate if we can retry based on attempts and cooldown
  const canRetry = retryCount < config.maxAttempts && cooldownRemaining === 0

  // Determine if an error is retryable
  const isErrorRetryable = useCallback((error: RetryableError): boolean => {
    // If error explicitly sets retryable flag, respect it
    if (typeof error.retryable === 'boolean') {
      return error.retryable
    }
    
    // Otherwise, check if error type is in retryable list
    return RETRYABLE_ERROR_TYPES.includes(error.type)
  }, [])

  // Calculate backoff delay for given attempt number
  const calculateBackoffDelay = useCallback((attemptNumber: number): number => {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber)
    return Math.min(delay, config.maxDelay)
  }, [config.baseDelay, config.backoffMultiplier, config.maxDelay])

  // Start cooldown timer
  const startCooldown = useCallback((delay: number) => {
    setCooldownRemaining(delay)
    
    // Update cooldown remaining every 100ms
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining(prev => {
        const newValue = Math.max(0, prev - 100)
        if (newValue === 0 && cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current)
          cooldownIntervalRef.current = null
        }
        return newValue
      })
    }, 100)

    // Clear cooldown after delay
    cooldownTimerRef.current = setTimeout(() => {
      setCooldownRemaining(0)
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
        cooldownIntervalRef.current = null
      }
    }, delay)
  }, [])

  // Execute retry with callback
  const retry = useCallback(async <T>(callback: () => Promise<T>): Promise<T | null> => {
    if (!canRetry) {
      return null
    }

    setIsRetrying(true)
    
    try {
      const result = await callback()
      
      // Success - start cooldown for next potential retry
      const delay = calculateBackoffDelay(retryCount)
      setRetryCountState(prev => prev + 1)
      startCooldown(delay)
      
      return result
    } catch (error) {
      // Failure - still start cooldown
      const delay = calculateBackoffDelay(retryCount)
      setRetryCountState(prev => prev + 1)
      startCooldown(delay)
      
      throw error
    } finally {
      setIsRetrying(false)
    }
  }, [canRetry, retryCount, calculateBackoffDelay, startCooldown])

  // Execute operation with automatic retry for retryable errors
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<T> => {
    const maxAttempts = maxRetries || config.maxAttempts
    let lastError: any
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await operation()
        if (attempt > 0) {
          setRetryCountState(attempt)
        }
        return result
      } catch (error: any) {
        lastError = error
        
        // Check if error is retryable and we have attempts left
        if (attempt < maxAttempts - 1 && isErrorRetryable(error)) {
          const delay = calculateBackoffDelay(attempt)
          setRetryCountState(attempt + 1)
          setIsRetrying(true)
          
          // Wait for backoff delay
          await new Promise<void>(resolve => {
            setTimeout(resolve, delay)
          })
          
          setIsRetrying(false)
        } else {
          // No more retries or error not retryable
          setRetryCountState(attempt + 1)
          setIsRetrying(false)
          break
        }
      }
    }
    
    throw lastError
  }, [config.maxAttempts, isErrorRetryable, calculateBackoffDelay])

  // Reset retry state
  const resetRetry = useCallback(() => {
    setRetryCountState(0)
    setIsRetrying(false)
    setCooldownRemaining(0)
    
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }
    
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current)
      cooldownIntervalRef.current = null
    }
  }, [])

  return {
    // State
    retryCount,
    isRetrying,
    cooldownRemaining,
    canRetry,
    
    // Actions
    retry,
    executeWithRetry,
    resetRetry,
    
    // Utilities
    isErrorRetryable,
    calculateBackoffDelay,
    
    // For testing - expose setState function
    setRetryCount: useCallback((count: number) => {
      setRetryCountState(count)
    }, [])
  }
}