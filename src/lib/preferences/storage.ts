import { 
  UserPreferences, 
  LegacyPreferences, 
  PreferencesError, 
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  MAX_IDEA_HISTORY
} from './types'
import { ToneType } from '@/types/pitch'

/**
 * Checks if localStorage is available and functional
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Creates a PreferencesError with proper typing
 */
function createPreferencesError(
  type: PreferencesError['type'], 
  message: string, 
  originalError?: Error
): PreferencesError {
  return { type, message, originalError }
}

/**
 * Safely parses JSON with error handling
 */
function safeJsonParse<T>(json: string, fallback: T): { result: T; error?: Error } {
  try {
    return { result: JSON.parse(json) as T }
  } catch (error) {
    return { result: fallback, error: error as Error }
  }
}

/**
 * Migrates legacy preferences to new format
 */
function migrateLegacyPreferences(): Partial<UserPreferences> {
  const migrated: Partial<UserPreferences> = {}
  
  try {
    // Migrate tone preference
    const legacyTone = localStorage.getItem(LEGACY_STORAGE_KEYS[0])
    if (legacyTone && ['professional', 'fun', 'tech', 'startup'].includes(legacyTone)) {
      migrated.defaultTone = legacyTone as ToneType
    }

    // Migrate idea history
    const legacyIdeas = localStorage.getItem(LEGACY_STORAGE_KEYS[1])
    if (legacyIdeas) {
      const { result: ideas } = safeJsonParse<string[]>(legacyIdeas, [])
      migrated.ideaHistory = ideas.slice(-MAX_IDEA_HISTORY)
    }

    // Migrate settings
    const legacySettings = localStorage.getItem(LEGACY_STORAGE_KEYS[2])
    if (legacySettings) {
      const { result: settings } = safeJsonParse<LegacyPreferences['settings']>(legacySettings, {})
      if (settings && settings.autoSave !== undefined) {
        migrated.autoSave = settings.autoSave
      }
      if (settings && settings.suggestions !== undefined) {
        migrated.showSuggestions = settings.suggestions
      }
    }

    // Clean up legacy keys after migration
    LEGACY_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })

    return migrated
  } catch (error) {
    console.warn('Failed to migrate legacy preferences:', error)
    return {}
  }
}

/**
 * Loads user preferences from localStorage with migration support
 */
export function loadPreferences(): { preferences: UserPreferences; error?: PreferencesError } {
  if (!isLocalStorageAvailable()) {
    return {
      preferences: DEFAULT_PREFERENCES,
      error: createPreferencesError(
        'storage_unavailable',
        'localStorage is not available. Preferences will not be saved.'
      )
    }
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    
    if (!stored) {
      // Check for legacy preferences to migrate
      const migrated = migrateLegacyPreferences()
      const preferences = { ...DEFAULT_PREFERENCES, ...migrated, lastUsed: new Date() }
      
      // Try to save migrated preferences, but don't fail if it doesn't work
      try {
        const saveResult = savePreferences(preferences)
        if (saveResult.error) {
          return { preferences, error: saveResult.error }
        }
      } catch {
        // Ignore save errors during migration
      }
      
      return { preferences }
    }

    const { result: parsed, error: parseError } = safeJsonParse<Partial<UserPreferences>>(stored, {})
    
    if (parseError) {
      return {
        preferences: DEFAULT_PREFERENCES,
        error: createPreferencesError(
          'parse_error',
          'Failed to parse stored preferences. Using defaults.',
          parseError
        )
      }
    }
    
    // Ensure all required fields are present and valid
    const preferences: UserPreferences = {
      defaultTone: parsed.defaultTone && ['professional', 'fun', 'tech', 'startup'].includes(parsed.defaultTone) 
        ? parsed.defaultTone 
        : DEFAULT_PREFERENCES.defaultTone,
      autoSave: typeof parsed.autoSave === 'boolean' ? parsed.autoSave : DEFAULT_PREFERENCES.autoSave,
      showSuggestions: typeof parsed.showSuggestions === 'boolean' ? parsed.showSuggestions : DEFAULT_PREFERENCES.showSuggestions,
      enableRetry: typeof parsed.enableRetry === 'boolean' ? parsed.enableRetry : DEFAULT_PREFERENCES.enableRetry,
      maxRetryAttempts: typeof parsed.maxRetryAttempts === 'number' && parsed.maxRetryAttempts > 0 
        ? Math.min(parsed.maxRetryAttempts, 10) 
        : DEFAULT_PREFERENCES.maxRetryAttempts,
      ideaHistory: Array.isArray(parsed.ideaHistory) 
        ? parsed.ideaHistory.slice(-MAX_IDEA_HISTORY).filter(idea => typeof idea === 'string' && idea.trim().length > 0)
        : DEFAULT_PREFERENCES.ideaHistory,
      lastUsed: parsed.lastUsed ? new Date(parsed.lastUsed) : new Date()
    }

    return { preferences }
  } catch (error) {
    return {
      preferences: DEFAULT_PREFERENCES,
      error: createPreferencesError(
        'parse_error',
        'Failed to parse stored preferences. Using defaults.',
        error as Error
      )
    }
  }
}

/**
 * Saves user preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): { success: boolean; error?: PreferencesError } {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: createPreferencesError(
        'storage_unavailable',
        'localStorage is not available. Preferences cannot be saved.'
      )
    }
  }

  try {
    // Validate and sanitize preferences before saving
    const sanitized: UserPreferences = {
      ...preferences,
      ideaHistory: preferences.ideaHistory
        .filter(idea => typeof idea === 'string' && idea.trim().length > 0)
        .slice(-MAX_IDEA_HISTORY),
      maxRetryAttempts: Math.max(1, Math.min(preferences.maxRetryAttempts, 10)),
      lastUsed: new Date()
    }

    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(sanitized))
    return { success: true }
  } catch (error) {
    const errorType = (error as Error).name === 'QuotaExceededError' 
      ? 'quota_exceeded' as const
      : 'storage_unavailable' as const
    
    return {
      success: false,
      error: createPreferencesError(
        errorType,
        errorType === 'quota_exceeded' 
          ? 'Storage quota exceeded. Please clear some browser data.'
          : 'Failed to save preferences to localStorage.',
        error as Error
      )
    }
  }
}

/**
 * Adds an idea to the history, maintaining the maximum limit
 */
export function addIdeaToHistory(idea: string): { success: boolean; error?: PreferencesError } {
  if (!idea.trim()) {
    return { success: false }
  }

  const { preferences, error: loadError } = loadPreferences()
  if (loadError && loadError.type !== 'storage_unavailable') {
    return { success: false, error: loadError }
  }

  // Remove duplicate if exists and add to beginning
  const filteredHistory = preferences.ideaHistory.filter(existing => existing !== idea.trim())
  const updatedHistory = [idea.trim(), ...filteredHistory].slice(0, MAX_IDEA_HISTORY)

  const updatedPreferences: UserPreferences = {
    ...preferences,
    ideaHistory: updatedHistory
  }

  return savePreferences(updatedPreferences)
}

/**
 * Updates specific preference fields
 */
export function updatePreferences(updates: Partial<UserPreferences>): { success: boolean; error?: PreferencesError } {
  const { preferences, error: loadError } = loadPreferences()
  if (loadError && loadError.type !== 'storage_unavailable') {
    return { success: false, error: loadError }
  }

  const updatedPreferences: UserPreferences = {
    ...preferences,
    ...updates,
    lastUsed: new Date()
  }

  return savePreferences(updatedPreferences)
}

/**
 * Clears all preferences and resets to defaults
 */
export function clearPreferences(): { success: boolean; error?: PreferencesError } {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: createPreferencesError(
        'storage_unavailable',
        'localStorage is not available.'
      )
    }
  }

  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY)
    // Also clean up any remaining legacy keys
    LEGACY_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: createPreferencesError(
        'storage_unavailable',
        'Failed to clear preferences.',
        error as Error
      )
    }
  }
}

/**
 * Gets the current storage usage information
 */
export function getStorageInfo(): { used: number; available: boolean } {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: false }
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    return {
      used: stored ? new Blob([stored]).size : 0,
      available: true
    }
  } catch {
    return { used: 0, available: false }
  }
}