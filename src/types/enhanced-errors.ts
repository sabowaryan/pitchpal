/**
 * Enhanced Error Handling Types
 * 
 * This file contains all types and interfaces for the improved error handling system
 * including error classification, validation, retry logic, and user preferences.
 */

import { Pitch } from './pitch'

// Error Classification
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  AI_SERVICE = 'ai_service',
  UNKNOWN = 'unknown'
}

// Enhanced Error Interface
export interface EnhancedError {
  id: string
  type: ErrorType
  message: string
  timestamp: Date
  context: {
    idea?: string
    tone?: string
    retryCount: number
    userAgent: string
  }
  originalError?: {
    name: string
    message: string
    stack?: string
  }
  retryable: boolean
  suggestedAction?: string
  helpUrl?: string
}

// Validation Types
export interface ValidationError {
  field: string
  type: 'required' | 'minLength' | 'maxLength' | 'format'
  message: string
}

export interface ValidationWarning {
  field: string
  type: 'suggestion' | 'improvement' | 'optimization'
  message: string
}

export interface IdeaSuggestion {
  type: 'missing_target' | 'vague_problem' | 'unclear_solution' | 'add_context'
  message: string
  example?: string
  priority: 'high' | 'medium' | 'low'
}

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: IdeaSuggestion[]
}

// User Preferences
export interface UserPreferences {
  defaultTone: string
  autoSave: boolean
  showSuggestions: boolean
  enableRetry: boolean
  maxRetryAttempts: number
  ideaHistory: string[]
  lastUsed: Date
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

// Enhanced Progress Tracking
export interface EnhancedProgress {
  step: number
  totalSteps: number
  message: string
  isComplete: boolean
  canCancel: boolean
  estimatedTimeRemaining?: number
  currentOperation: 'validating' | 'generating' | 'processing' | 'finalizing'
}

// Enhanced Generation State
export interface EnhancedGenerationState {
  // Existing states
  isLoading: boolean
  pitch: Pitch | null
  error: EnhancedError | null
  progress: EnhancedProgress
  
  // New enhanced states
  canCancel: boolean
  retryCount: number
  lastAttemptTime: number
  validationErrors: ValidationError[]
  suggestions: IdeaSuggestion[]
  preferences: UserPreferences
}

// Generation Context for logging
export interface GenerationContext {
  idea: string
  tone: string
  timestamp: Date
  sessionId: string
  userId?: string
  userAgent?: string
  clientIp?: string
  referer?: string
}

// Error Log for monitoring
export interface ErrorLog {
  errorId: string
  timestamp: Date
  userId?: string
  sessionId: string
  error: EnhancedError
  context: GenerationContext
  userAgent: string
  url: string
}

// Recovery Strategies
export interface RecoveryStrategy {
  autoRetry: boolean
  maxAttempts: number
  backoffMs: number[]
  userAction: string
}

export type RecoveryStrategies = {
  [K in ErrorType]: RecoveryStrategy
}