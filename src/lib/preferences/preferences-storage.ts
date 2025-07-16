/**
 * Preferences Storage System
 * 
 * This module provides secure storage and retrieval of user preferences
 * with encryption for sensitive data and automatic migration.
 */

import { UserPreferences, DEFAULT_PREFERENCES, PREFERENCES_VERSION, MAX_IDEA_HISTORY } from './types'
import { encryptSensitiveArray, decryptSensitiveArray, isEncryptionAvailable } from './encryption'

const PREFERENCES_KEY = 'pitchpal_preferences'
const VERSION_KEY = 'pitch_generator_preferences_version'

/**
 * Get localStorage instance (for testing compatibility)
 */
function getLocalStorage(): Storage | null {
  try {
    // In browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    
    // In Node.js test environment
    if (typeof global !== 'undefined' && (global as any).localStorage) {
      return (global as any).localStorage
    }
    
    // Fallback - try to access localStorage directly (might be globally available)
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * Save user preferences to localStorage with encryption for sensitive data
 */
export async function savePreferences(preferences: UserPreferences): Promise<void> {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      console.warn('localStorage not available')
      return
    }

    // Create a copy to avoid mutating the original
    const prefsToSave = { ...preferences }
    
    // Encrypt sensitive data (idea history)
    if (prefsToSave.ideaHistory && prefsToSave.ideaHistory.length > 0) {
      prefsToSave.ideaHistory = await encryptSensitiveArray(prefsToSave.ideaHistory)
    }
    
    // Update last used timestamp
    prefsToSave.lastUsed = new Date()
    
    // Save to localStorage
    storage.setItem(PREFERENCES_KEY, JSON.stringify(prefsToSave))
    storage.setItem(VERSION_KEY, PREFERENCES_VERSION)
    
  } catch (error) {
    console.warn('Failed to save preferences:', error)
    // Don't throw - gracefully handle storage failures
  }
}

/**
 * Load user preferences from localStorage with decryption
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      return { ...DEFAULT_PREFERENCES }
    }

    const saved = storage.getItem(PREFERENCES_KEY)
    
    if (!saved) {
      return { ...DEFAULT_PREFERENCES }
    }
    
    const parsed = JSON.parse(saved)
    
    // Decrypt sensitive data
    if (parsed.ideaHistory && Array.isArray(parsed.ideaHistory)) {
      parsed.ideaHistory = await decryptSensitiveArray(parsed.ideaHistory)
    }
    
    // Merge with defaults to handle missing properties
    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      lastUsed: parsed.lastUsed ? new Date(parsed.lastUsed) : new Date()
    }
    
    // Validate and clean up the preferences
    return validatePreferences(preferences)
    
  } catch (error) {
    console.warn('Failed to load preferences, using defaults:', error)
    return { ...DEFAULT_PREFERENCES }
  }
}

/**
 * Clear all preferences from localStorage
 */
export async function clearPreferences(): Promise<void> {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      return
    }
    
    storage.removeItem(PREFERENCES_KEY)
    storage.removeItem(VERSION_KEY)
  } catch (error) {
    console.warn('Failed to clear preferences:', error)
    // Don't throw - gracefully handle storage failures
  }
}

/**
 * Add an idea to the history
 */
export async function addToIdeaHistory(
  currentPreferences: UserPreferences, 
  idea: string
): Promise<UserPreferences> {
  // Don't add to history if auto-save is disabled
  if (!currentPreferences.autoSave) {
    return currentPreferences
  }
  
  const trimmedIdea = idea.trim()
  if (!trimmedIdea) {
    return currentPreferences
  }
  
  const updatedPrefs = { ...currentPreferences }
  let history = [...updatedPrefs.ideaHistory]
  
  // Remove existing instance if it exists
  history = history.filter(existingIdea => existingIdea !== trimmedIdea)
  
  // Add to the beginning
  history.unshift(trimmedIdea)
  
  // Limit to maximum size
  if (history.length > MAX_IDEA_HISTORY) {
    history = history.slice(0, MAX_IDEA_HISTORY)
  }
  
  updatedPrefs.ideaHistory = history
  updatedPrefs.lastUsed = new Date()
  
  return updatedPrefs
}

/**
 * Clean up old history entries beyond the maximum limit
 */
export async function cleanupOldHistory(
  currentPreferences: UserPreferences,
  maxItems: number = MAX_IDEA_HISTORY
): Promise<UserPreferences> {
  const updatedPrefs = { ...currentPreferences }
  
  if (updatedPrefs.ideaHistory.length > maxItems) {
    updatedPrefs.ideaHistory = updatedPrefs.ideaHistory.slice(0, maxItems)
  }
  
  return updatedPrefs
}

/**
 * Validate and sanitize preferences
 */
function validatePreferences(preferences: UserPreferences): UserPreferences {
  const validated = { ...preferences }
  
  // Validate defaultTone
  const validTones = ['professional', 'casual', 'tech', 'fun', 'formal']
  if (!validTones.includes(validated.defaultTone)) {
    validated.defaultTone = DEFAULT_PREFERENCES.defaultTone
  }
  
  // Validate boolean fields
  if (typeof validated.autoSave !== 'boolean') {
    validated.autoSave = DEFAULT_PREFERENCES.autoSave
  }
  
  if (typeof validated.showSuggestions !== 'boolean') {
    validated.showSuggestions = DEFAULT_PREFERENCES.showSuggestions
  }
  
  if (typeof validated.enableRetry !== 'boolean') {
    validated.enableRetry = DEFAULT_PREFERENCES.enableRetry
  }
  
  // Validate maxRetryAttempts
  if (typeof validated.maxRetryAttempts !== 'number' || 
      validated.maxRetryAttempts < 1 || 
      validated.maxRetryAttempts > 10) {
    validated.maxRetryAttempts = DEFAULT_PREFERENCES.maxRetryAttempts
  }
  
  // Validate ideaHistory
  if (!Array.isArray(validated.ideaHistory)) {
    validated.ideaHistory = []
  } else {
    // Filter out invalid entries and limit size
    validated.ideaHistory = validated.ideaHistory
      .filter(idea => typeof idea === 'string' && idea.trim().length > 0)
      .slice(0, MAX_IDEA_HISTORY)
  }
  
  // Validate lastUsed
  if (!(validated.lastUsed instanceof Date) || isNaN(validated.lastUsed.getTime())) {
    validated.lastUsed = new Date()
  }
  
  return validated
}

/**
 * Migrate preferences from older versions
 */
export async function migratePreferences(): Promise<void> {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      return
    }

    const currentVersion = storage.getItem(VERSION_KEY)
    
    if (currentVersion === PREFERENCES_VERSION) {
      return // No migration needed
    }
    
    // Load current preferences
    const preferences = await loadPreferences()
    
    // Perform any necessary migrations here
    // For now, just save with the new version
    await savePreferences(preferences)
    
  } catch (error) {
    console.warn('Failed to migrate preferences:', error)
  }
}

/**
 * Get preferences storage info for debugging
 */
export function getStorageInfo(): {
  hasPreferences: boolean
  version: string | null
  encryptionAvailable: boolean
  storageSize: number
} {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      return {
        hasPreferences: false,
        version: null,
        encryptionAvailable: false,
        storageSize: 0
      }
    }

    const hasPreferences = storage.getItem(PREFERENCES_KEY) !== null
    const version = storage.getItem(VERSION_KEY)
    const encryptionAvailable = isEncryptionAvailable()
    
    // Calculate approximate storage size
    let storageSize = 0
    try {
      const prefsData = storage.getItem(PREFERENCES_KEY)
      if (prefsData) {
        storageSize = new Blob([prefsData]).size
      }
    } catch (error) {
      // Ignore size calculation errors
    }
    
    return {
      hasPreferences,
      version,
      encryptionAvailable,
      storageSize
    }
  } catch (error) {
    return {
      hasPreferences: false,
      version: null,
      encryptionAvailable: false,
      storageSize: 0
    }
  }
}