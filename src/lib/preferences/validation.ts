/**
 * Validation utilities for user preferences
 * 
 * This module provides comprehensive validation for user preferences,
 * including data sanitization, format checking, and security validation.
 */

import { UserPreferences, PreferencesError, DEFAULT_PREFERENCES, MAX_IDEA_HISTORY } from './types'
import { ToneType } from '@/types/pitch'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: PreferencesError[]
  warnings: string[]
  sanitized?: UserPreferences
}

/**
 * Validation rules configuration
 */
export const VALIDATION_RULES = {
  maxRetryAttempts: {
    min: 1,
    max: 10
  },
  ideaHistory: {
    maxItems: MAX_IDEA_HISTORY,
    maxItemLength: 500,
    minItemLength: 1
  },
  tone: {
    validValues: ['professional', 'fun', 'tech', 'startup'] as ToneType[]
  }
} as const

/**
 * Creates a validation error
 */
function createValidationError(
  type: PreferencesError['type'],
  message: string,
  originalError?: Error
): PreferencesError {
  return { type, message, originalError }
}

/**
 * Validates a tone value
 */
function validateTone(tone: any): { isValid: boolean; error?: PreferencesError } {
  if (typeof tone !== 'string') {
    return {
      isValid: false,
      error: createValidationError('parse_error', 'Tone must be a string')
    }
  }

  if (!VALIDATION_RULES.tone.validValues.includes(tone as ToneType)) {
    return {
      isValid: false,
      error: createValidationError(
        'parse_error',
        `Invalid tone value: ${tone}. Must be one of: ${VALIDATION_RULES.tone.validValues.join(', ')}`
      )
    }
  }

  return { isValid: true }
}

/**
 * Validates boolean preferences
 */
function validateBoolean(value: any, fieldName: string): { isValid: boolean; error?: PreferencesError } {
  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      error: createValidationError('parse_error', `${fieldName} must be a boolean`)
    }
  }
  return { isValid: true }
}

/**
 * Validates retry attempts number
 */
function validateRetryAttempts(attempts: any): { 
  isValid: boolean
  sanitized?: number
  error?: PreferencesError 
} {
  if (typeof attempts !== 'number') {
    return {
      isValid: false,
      error: createValidationError('parse_error', 'maxRetryAttempts must be a number')
    }
  }

  if (!Number.isInteger(attempts)) {
    return {
      isValid: false,
      error: createValidationError('parse_error', 'maxRetryAttempts must be an integer')
    }
  }

  const sanitized = Math.max(
    VALIDATION_RULES.maxRetryAttempts.min,
    Math.min(attempts, VALIDATION_RULES.maxRetryAttempts.max)
  )

  return {
    isValid: true,
    sanitized
  }
}

/**
 * Validates and sanitizes idea history
 */
function validateIdeaHistory(history: any): {
  isValid: boolean
  sanitized?: string[]
  errors?: PreferencesError[]
  warnings?: string[]
} {
  const errors: PreferencesError[] = []
  const warnings: string[] = []

  if (!Array.isArray(history)) {
    return {
      isValid: false,
      errors: [createValidationError('parse_error', 'ideaHistory must be an array')]
    }
  }

  // Filter and validate each idea
  const validIdeas: string[] = []
  
  for (let i = 0; i < history.length; i++) {
    const idea = history[i]
    
    if (typeof idea !== 'string') {
      warnings.push(`Idea at index ${i} is not a string and will be removed`)
      continue
    }

    const trimmed = idea.trim()
    
    if (trimmed.length < VALIDATION_RULES.ideaHistory.minItemLength) {
      warnings.push(`Idea at index ${i} is too short and will be removed`)
      continue
    }

    if (trimmed.length > VALIDATION_RULES.ideaHistory.maxItemLength) {
      warnings.push(`Idea at index ${i} is too long and will be truncated`)
      validIdeas.push(trimmed.substring(0, VALIDATION_RULES.ideaHistory.maxItemLength))
      continue
    }

    // Check for potential XSS or malicious content
    if (containsSuspiciousContent(trimmed)) {
      warnings.push(`Idea at index ${i} contains suspicious content and will be removed`)
      continue
    }

    validIdeas.push(trimmed)
  }

  // Remove duplicates while preserving order
  const uniqueIdeas = validIdeas.filter((idea, index) => 
    validIdeas.indexOf(idea) === index
  )

  // Limit to maximum allowed items
  const sanitized = uniqueIdeas.slice(0, VALIDATION_RULES.ideaHistory.maxItems)

  if (sanitized.length < history.length) {
    warnings.push(`Idea history was truncated from ${history.length} to ${sanitized.length} items`)
  }

  return {
    isValid: true,
    sanitized,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Checks for suspicious content that might indicate XSS or other attacks
 */
function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /data:text\/html/gi
  ]

  return suspiciousPatterns.some(pattern => pattern.test(text))
}

/**
 * Validates a Date object
 */
function validateDate(date: any, fieldName: string): { 
  isValid: boolean
  sanitized?: Date
  error?: PreferencesError 
} {
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: createValidationError('parse_error', `${fieldName} is an invalid date`)
      }
    }
    return { isValid: true, sanitized: date }
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      return {
        isValid: false,
        error: createValidationError('parse_error', `${fieldName} cannot be parsed as a date`)
      }
    }
    return { isValid: true, sanitized: parsed }
  }

  return {
    isValid: false,
    error: createValidationError('parse_error', `${fieldName} must be a Date object or valid date string`)
  }
}

/**
 * Validates the complete preferences object
 */
export function validatePreferences(preferences: any): ValidationResult {
  const errors: PreferencesError[] = []
  const warnings: string[] = []
  
  if (!preferences || typeof preferences !== 'object') {
    return {
      isValid: false,
      errors: [createValidationError('parse_error', 'Preferences must be an object')],
      warnings
    }
  }

  // Start with default preferences as base
  const sanitized: UserPreferences = { ...DEFAULT_PREFERENCES }

  // Validate defaultTone
  const toneValidation = validateTone(preferences.defaultTone)
  if (toneValidation.isValid) {
    sanitized.defaultTone = preferences.defaultTone
  } else {
    errors.push(toneValidation.error!)
    warnings.push(`Using default tone: ${DEFAULT_PREFERENCES.defaultTone}`)
  }

  // Validate boolean fields
  const booleanFields: (keyof UserPreferences)[] = ['autoSave', 'showSuggestions', 'enableRetry']
  
  for (const field of booleanFields) {
    const validation = validateBoolean(preferences[field], field)
    if (validation.isValid) {
      (sanitized as any)[field] = preferences[field]
    } else {
      errors.push(validation.error!)
      warnings.push(`Using default value for ${field}: ${DEFAULT_PREFERENCES[field]}`)
    }
  }

  // Validate maxRetryAttempts
  const retryValidation = validateRetryAttempts(preferences.maxRetryAttempts)
  if (retryValidation.isValid) {
    sanitized.maxRetryAttempts = retryValidation.sanitized ?? preferences.maxRetryAttempts
    if (retryValidation.sanitized !== preferences.maxRetryAttempts) {
      warnings.push(`maxRetryAttempts was adjusted from ${preferences.maxRetryAttempts} to ${retryValidation.sanitized}`)
    }
  } else {
    errors.push(retryValidation.error!)
    warnings.push(`Using default maxRetryAttempts: ${DEFAULT_PREFERENCES.maxRetryAttempts}`)
  }

  // Validate ideaHistory
  const historyValidation = validateIdeaHistory(preferences.ideaHistory)
  if (historyValidation.isValid) {
    sanitized.ideaHistory = historyValidation.sanitized ?? []
    if (historyValidation.warnings) {
      warnings.push(...historyValidation.warnings)
    }
  } else {
    if (historyValidation.errors) {
      errors.push(...historyValidation.errors)
    }
    warnings.push('Using empty idea history due to validation errors')
  }

  // Validate lastUsed
  const dateValidation = validateDate(preferences.lastUsed, 'lastUsed')
  if (dateValidation.isValid) {
    sanitized.lastUsed = dateValidation.sanitized!
  } else {
    errors.push(dateValidation.error!)
    sanitized.lastUsed = new Date()
    warnings.push('Using current date for lastUsed due to validation error')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized
  }
}

/**
 * Validates preferences for saving (stricter validation)
 */
export function validatePreferencesForSave(preferences: UserPreferences): ValidationResult {
  const result = validatePreferences(preferences)
  
  // Additional validation for saving
  if (result.isValid && result.sanitized) {
    const additionalWarnings: string[] = []
    
    // Check if lastUsed is too far in the future
    const now = new Date()
    const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    
    if (result.sanitized.lastUsed > maxFutureDate) {
      result.sanitized.lastUsed = now
      additionalWarnings.push('lastUsed was in the future and has been reset to current time')
    }
    
    // Check if idea history contains duplicates
    const uniqueIdeas = [...new Set(result.sanitized.ideaHistory)]
    if (uniqueIdeas.length !== result.sanitized.ideaHistory.length) {
      result.sanitized.ideaHistory = uniqueIdeas
      additionalWarnings.push('Duplicate ideas were removed from history')
    }
    
    result.warnings = [...(result.warnings || []), ...additionalWarnings]
  }
  
  return result
}

/**
 * Quick validation for individual preference fields
 */
export function validatePreferenceField(
  field: keyof UserPreferences,
  value: any
): { isValid: boolean; error?: string; sanitized?: any } {
  switch (field) {
    case 'defaultTone':
      const toneResult = validateTone(value)
      return {
        isValid: toneResult.isValid,
        error: toneResult.error?.message,
        sanitized: toneResult.isValid ? value : undefined
      }
      
    case 'autoSave':
    case 'showSuggestions':
    case 'enableRetry':
      const boolResult = validateBoolean(value, field)
      return {
        isValid: boolResult.isValid,
        error: boolResult.error?.message,
        sanitized: boolResult.isValid ? value : undefined
      }
      
    case 'maxRetryAttempts':
      const retryResult = validateRetryAttempts(value)
      return {
        isValid: retryResult.isValid,
        error: retryResult.error?.message,
        sanitized: retryResult.sanitized
      }
      
    case 'ideaHistory':
      const historyResult = validateIdeaHistory(value)
      return {
        isValid: historyResult.isValid,
        error: historyResult.errors?.[0]?.message,
        sanitized: historyResult.sanitized
      }
      
    case 'lastUsed':
      const dateResult = validateDate(value, field)
      return {
        isValid: dateResult.isValid,
        error: dateResult.error?.message,
        sanitized: dateResult.sanitized
      }
      
    default:
      return {
        isValid: false,
        error: `Unknown preference field: ${field}`
      }
  }
}