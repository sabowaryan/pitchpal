/**
 * Migration utilities for user preferences
 * 
 * This module handles migration from old preference formats to new ones,
 * including data validation and cleanup of legacy storage.
 */

import { UserPreferences, LegacyPreferences, DEFAULT_PREFERENCES, LEGACY_STORAGE_KEYS, MAX_IDEA_HISTORY } from './types'
import { ToneType } from '@/types/pitch'
import { encryptSensitiveArray, decryptSensitiveArray } from './encryption'

/**
 * Version information for preferences schema
 */
export const PREFERENCES_VERSION = '2.0.0'
export const VERSION_KEY = 'pitch_generator_preferences_version'

/**
 * Versioned preferences interface
 */
interface VersionedPreferences extends UserPreferences {
  version: string
}

/**
 * Legacy preference formats for different versions
 */
interface LegacyPreferencesV1 {
  tone?: string
  ideas?: string[]
  settings?: {
    autoSave?: boolean
    suggestions?: boolean
  }
}

/**
 * Safely parses JSON with error handling and type validation
 */
function safeJsonParse<T>(json: string, validator?: (obj: any) => obj is T): { result: T | null; error?: Error } {
  try {
    const parsed = JSON.parse(json)
    if (validator && !validator(parsed)) {
      return { result: null, error: new Error('Invalid data format') }
    }
    return { result: parsed as T }
  } catch (error) {
    return { result: null, error: error as Error }
  }
}

/**
 * Validates if a tone is valid
 */
function isValidTone(tone: any): tone is ToneType {
  return typeof tone === 'string' && ['professional', 'fun', 'tech', 'startup'].includes(tone)
}

/**
 * Validates if an array contains only valid strings
 */
function isValidStringArray(arr: any): arr is string[] {
  return Array.isArray(arr) && arr.every(item => typeof item === 'string')
}

/**
 * Migrates preferences from version 1.x to 2.0
 */
async function migrateFromV1(legacyData: LegacyPreferencesV1): Promise<Partial<UserPreferences>> {
  const migrated: Partial<UserPreferences> = {}
  
  try {
    // Migrate tone preference
    if (legacyData.tone && isValidTone(legacyData.tone)) {
      migrated.defaultTone = legacyData.tone
    }

    // Migrate and encrypt idea history
    if (legacyData.ideas && isValidStringArray(legacyData.ideas)) {
      const validIdeas = legacyData.ideas
        .filter(idea => typeof idea === 'string' && idea.trim().length > 0)
        .slice(-MAX_IDEA_HISTORY)
      
      // Encrypt sensitive idea history
      migrated.ideaHistory = await encryptSensitiveArray(validIdeas)
    }

    // Migrate settings
    if (legacyData.settings) {
      if (typeof legacyData.settings.autoSave === 'boolean') {
        migrated.autoSave = legacyData.settings.autoSave
      }
      if (typeof legacyData.settings.suggestions === 'boolean') {
        migrated.showSuggestions = legacyData.settings.suggestions
      }
    }

    return migrated
  } catch (error) {
    console.warn('Failed to migrate v1 preferences:', error)
    return {}
  }
}

/**
 * Migrates legacy localStorage keys to new format
 */
async function migrateLegacyKeys(): Promise<Partial<UserPreferences>> {
  const migrated: Partial<UserPreferences> = {}
  
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      return migrated
    }

    // Migrate individual legacy keys
    const legacyTone = localStorage.getItem(LEGACY_STORAGE_KEYS[0])
    if (legacyTone && isValidTone(legacyTone)) {
      migrated.defaultTone = legacyTone
    }

    // Migrate idea history
    const legacyIdeas = localStorage.getItem(LEGACY_STORAGE_KEYS[1])
    if (legacyIdeas) {
      const { result: ideas } = safeJsonParse<string[]>(legacyIdeas, isValidStringArray)
      if (ideas) {
        const validIdeas = ideas
          .filter(idea => typeof idea === 'string' && idea.trim().length > 0)
          .slice(-MAX_IDEA_HISTORY)
        
        // Encrypt sensitive idea history
        migrated.ideaHistory = await encryptSensitiveArray(validIdeas)
      }
    }

    // Migrate settings
    const legacySettings = localStorage.getItem(LEGACY_STORAGE_KEYS[2])
    if (legacySettings) {
      const { result: settings } = safeJsonParse<LegacyPreferencesV1['settings']>(legacySettings)
      if (settings) {
        if (typeof settings.autoSave === 'boolean') {
          migrated.autoSave = settings.autoSave
        }
        if (typeof settings.suggestions === 'boolean') {
          migrated.showSuggestions = settings.suggestions
        }
      }
    }

    return migrated
  } catch (error) {
    console.warn('Failed to migrate legacy keys:', error)
    return {}
  }
}

/**
 * Cleans up legacy storage keys after successful migration
 */
function cleanupLegacyStorage(): void {
  try {
    if (typeof localStorage === 'undefined') {
      return
    }

    LEGACY_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })

    // Also remove any other known legacy keys
    const additionalLegacyKeys = [
      'pitch_generator_tone',
      'pitch_generator_ideas',
      'pitch_generator_settings',
      'pitchpal_preferences'
    ]

    additionalLegacyKeys.forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to cleanup legacy storage:', error)
  }
}

/**
 * Determines the current version of stored preferences
 */
function getStoredVersion(): string | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null
    }
    return localStorage.getItem(VERSION_KEY)
  } catch {
    return null
  }
}

/**
 * Sets the current version of preferences
 */
function setStoredVersion(version: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VERSION_KEY, version)
    }
  } catch (error) {
    console.warn('Failed to set preferences version:', error)
  }
}

/**
 * Validates loaded preferences against current schema
 */
export function validatePreferences(preferences: any): preferences is UserPreferences {
  if (!preferences || typeof preferences !== 'object') {
    return false
  }

  return (
    isValidTone(preferences.defaultTone) &&
    typeof preferences.autoSave === 'boolean' &&
    typeof preferences.showSuggestions === 'boolean' &&
    typeof preferences.enableRetry === 'boolean' &&
    typeof preferences.maxRetryAttempts === 'number' &&
    preferences.maxRetryAttempts > 0 &&
    preferences.maxRetryAttempts <= 10 &&
    isValidStringArray(preferences.ideaHistory) &&
    preferences.lastUsed instanceof Date
  )
}

/**
 * Migrates preferences from any legacy format to current version
 */
export async function migratePreferences(): Promise<{
  preferences: UserPreferences
  migrated: boolean
  error?: Error
}> {
  try {
    const currentVersion = getStoredVersion()
    
    // If already on current version, no migration needed
    if (currentVersion === PREFERENCES_VERSION) {
      return {
        preferences: DEFAULT_PREFERENCES,
        migrated: false
      }
    }

    let migrated: Partial<UserPreferences> = {}

    // Check for legacy localStorage keys (pre-versioning)
    if (!currentVersion) {
      migrated = await migrateLegacyKeys()
    }

    // Apply version-specific migrations
    if (currentVersion && currentVersion.startsWith('1.')) {
      // Migration from v1.x would go here
      // For now, we'll treat it as legacy key migration
      migrated = await migrateLegacyKeys()
    }

    // Create final preferences with defaults for missing values
    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...migrated,
      lastUsed: new Date()
    }

    // Clean up legacy storage
    cleanupLegacyStorage()

    // Set current version
    setStoredVersion(PREFERENCES_VERSION)

    return {
      preferences,
      migrated: Object.keys(migrated).length > 0
    }
  } catch (error) {
    return {
      preferences: DEFAULT_PREFERENCES,
      migrated: false,
      error: error as Error
    }
  }
}

/**
 * Upgrades preferences to include encryption for sensitive data
 */
export async function upgradePreferencesWithEncryption(
  preferences: UserPreferences
): Promise<UserPreferences> {
  try {
    // Check if idea history is already encrypted (contains encrypted markers)
    const isAlreadyEncrypted = preferences.ideaHistory.some(idea => 
      idea.includes('b64:') || idea.length > 100 // Encrypted data is typically longer
    )

    if (isAlreadyEncrypted) {
      return preferences
    }

    // Encrypt the idea history
    const encryptedHistory = await encryptSensitiveArray(preferences.ideaHistory)

    return {
      ...preferences,
      ideaHistory: encryptedHistory,
      lastUsed: new Date()
    }
  } catch (error) {
    console.warn('Failed to upgrade preferences with encryption:', error)
    return preferences
  }
}

/**
 * Decrypts preferences for use in the application
 */
export async function decryptPreferences(
  preferences: UserPreferences
): Promise<UserPreferences> {
  try {
    // Decrypt the idea history
    const decryptedHistory = await decryptSensitiveArray(preferences.ideaHistory)

    return {
      ...preferences,
      ideaHistory: decryptedHistory
    }
  } catch (error) {
    console.warn('Failed to decrypt preferences:', error)
    return preferences
  }
}

/**
 * Performs a complete migration check and upgrade
 */
export async function performMigrationCheck(): Promise<{
  success: boolean
  migrated: boolean
  upgraded: boolean
  error?: Error
}> {
  try {
    // First, migrate from legacy formats
    const migrationResult = await migratePreferences()
    
    if (migrationResult.error) {
      return {
        success: false,
        migrated: false,
        upgraded: false,
        error: migrationResult.error
      }
    }

    // Then, upgrade with encryption if needed
    const upgradedPreferences = await upgradePreferencesWithEncryption(migrationResult.preferences)
    const upgraded = upgradedPreferences !== migrationResult.preferences

    return {
      success: true,
      migrated: migrationResult.migrated,
      upgraded
    }
  } catch (error) {
    return {
      success: false,
      migrated: false,
      upgraded: false,
      error: error as Error
    }
  }
}