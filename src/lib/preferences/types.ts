/**
 * Types for the preferences system
 */

export interface UserPreferences {
  defaultTone: string
  autoSave: boolean
  showSuggestions: boolean
  enableRetry: boolean
  maxRetryAttempts: number
  ideaHistory: string[]
  lastUsed: Date
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultTone: 'professional',
  autoSave: true,
  showSuggestions: true,
  enableRetry: true,
  maxRetryAttempts: 3,
  ideaHistory: [],
  lastUsed: new Date()
}

export const PREFERENCES_VERSION = '1.0.0'
export const MAX_IDEA_HISTORY = 10