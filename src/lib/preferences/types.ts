/**
 * Types for the preferences system
 */
export interface PreferencesError {
  type: 'storage_unavailable' | 'parse_error' | 'quota_exceeded' | 'validation_error' | 'migration_error'
  message: string
  originalError?: Error
}

export interface UserPreferences {
  defaultTone: string
  autoSave: boolean
  showSuggestions: boolean
  enableRetry: boolean
  maxRetryAttempts: number
  ideaHistory: string[]
  lastUsed: Date
}

/**
 * Legacy preferences interface for migration purposes
 */
export interface LegacyPreferences {
  tone?: string
  autoSave?: boolean
  suggestions?: boolean
  retry?: boolean
  maxRetries?: number
  ideas?: string[]
  lastUsed?: string | Date
  settings?: any
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
export const PREFERENCES_STORAGE_KEY = 'user_preferences'

/**
 * Legacy storage keys for migration
 */
export const LEGACY_STORAGE_KEYS = [
  'preferences',
  'user_settings',
  'app_config',
  'old_preferences'
] as const