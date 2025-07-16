/**
 * Comprehensive preferences manager
 * 
 * This module provides a high-level interface for managing user preferences
 * with encryption, validation, migration, and automatic cleanup.
 */

import { UserPreferences, PreferencesError, DEFAULT_PREFERENCES } from './types'
import { loadPreferences as loadRaw, savePreferences as saveRaw } from './storage'
import { encryptSensitiveArray, decryptSensitiveArray, isEncryptionAvailable } from './encryption'
import {
  migratePreferences,
  upgradePreferencesWithEncryption,
  decryptPreferences as decryptPrefs,
  performMigrationCheck
} from './migration'
import { validatePreferences, validatePreferencesForSave } from './validation'
import { performAutomaticCleanup, initializeAutomaticCleanup } from './cleanup'

/**
 * Enhanced preferences manager result
 */
export interface PreferencesManagerResult<T = UserPreferences> {
  success: boolean
  data?: T
  error?: PreferencesError
  warnings?: string[]
  migrated?: boolean
  cleaned?: boolean
}

/**
 * Preferences manager configuration
 */
export interface PreferencesManagerConfig {
  enableEncryption: boolean
  enableAutoCleanup: boolean
  enableMigration: boolean
  enableValidation: boolean
  autoInitialize: boolean
}

/**
 * Default configuration for preferences manager
 */
export const DEFAULT_MANAGER_CONFIG: PreferencesManagerConfig = {
  enableEncryption: true,
  enableAutoCleanup: true,
  enableMigration: true,
  enableValidation: true,
  autoInitialize: true
}

/**
 * Preferences manager class
 */
export class PreferencesManager {
  private config: PreferencesManagerConfig
  private initialized = false

  constructor(config: Partial<PreferencesManagerConfig> = {}) {
    this.config = { ...DEFAULT_MANAGER_CONFIG, ...config }

    if (this.config.autoInitialize) {
      this.initialize().catch(error => {
        console.warn('Failed to auto-initialize preferences manager:', error)
      })
    }
  }

  /**
   * Initializes the preferences manager
   */
  async initialize(): Promise<PreferencesManagerResult<void>> {
    try {
      if (this.initialized) {
        return { success: true }
      }

      const warnings: string[] = []

      // Perform migration check if enabled
      if (this.config.enableMigration) {
        const migrationResult = await performMigrationCheck()
        if (!migrationResult.success) {
          return {
            success: false,
            error: {
              type: 'migration_error',
              message: 'Failed to perform migration check',
              originalError: migrationResult.error
            }
          }
        }

        if (migrationResult.migrated) {
          warnings.push('Preferences were migrated from legacy format')
        }

        if (migrationResult.upgraded) {
          warnings.push('Preferences were upgraded with encryption')
        }
      }

      // Initialize automatic cleanup if enabled
      if (this.config.enableAutoCleanup) {
        initializeAutomaticCleanup()
        warnings.push('Automatic cleanup initialized')
      }

      this.initialized = true

      return {
        success: true,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to initialize preferences manager',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Loads preferences with full processing pipeline
   */
  async loadPreferences(): Promise<PreferencesManagerResult<UserPreferences>> {
    try {
      // Ensure manager is initialized
      if (!this.initialized) {
        const initResult = await this.initialize()
        if (!initResult.success) {
          return initResult as PreferencesManagerResult<UserPreferences>
        }
      }

      const warnings: string[] = []
      let migrated = false
      let cleaned = false

      // Load raw preferences
      const { preferences: rawPreferences, error: loadError } = loadRaw()

      if (loadError && loadError.type !== 'storage_unavailable') {
        return {
          success: false,
          error: loadError
        }
      }

      let preferences = rawPreferences

      // Perform migration if needed and enabled
      if (this.config.enableMigration) {
        const migrationResult = await migratePreferences()
        if (migrationResult.migrated) {
          preferences = migrationResult.preferences
          migrated = true
          warnings.push('Preferences migrated from legacy format')
        }
      }

      // Decrypt sensitive data if encryption is enabled
      if (this.config.enableEncryption) {
        try {
          preferences = await decryptPrefs(preferences)
        } catch (error) {
          warnings.push('Failed to decrypt some preference data')
        }
      }

      // Validate preferences if enabled
      if (this.config.enableValidation) {
        const validationResult = validatePreferences(preferences)
        if (!validationResult.isValid) {
          // Use sanitized version if validation failed
          preferences = validationResult.sanitized || DEFAULT_PREFERENCES
          warnings.push('Some preferences were invalid and have been reset to defaults')

          if (validationResult.warnings) {
            warnings.push(...validationResult.warnings)
          }
        }
      }

      // Perform automatic cleanup if enabled
      if (this.config.enableAutoCleanup) {
        const cleanupResult = await performAutomaticCleanup()
        if (cleanupResult.cleanupPerformed) {
          cleaned = true
          warnings.push(`Automatic cleanup removed ${cleanupResult.itemsRemoved} items`)
        }
      }

      return {
        success: true,
        data: preferences,
        warnings: warnings.length > 0 ? warnings : undefined,
        migrated,
        cleaned
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'parse_error',
          message: 'Failed to load preferences',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Saves preferences with full processing pipeline
   */
  async savePreferences(preferences: UserPreferences): Promise<PreferencesManagerResult<void>> {
    try {
      // Ensure manager is initialized
      if (!this.initialized) {
        const initResult = await this.initialize()
        if (!initResult.success) {
          return initResult as PreferencesManagerResult<void>
        }
      }

      const warnings: string[] = []
      let processedPreferences = { ...preferences }

      // Validate preferences before saving if enabled
      if (this.config.enableValidation) {
        const validationResult = validatePreferencesForSave(processedPreferences)
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              type: 'parse_error',
              message: 'Preferences validation failed',
              originalError: new Error(validationResult.errors.map(e => e.message).join(', '))
            }
          }
        }

        if (validationResult.sanitized) {
          processedPreferences = validationResult.sanitized
        }

        if (validationResult.warnings) {
          warnings.push(...validationResult.warnings)
        }
      }

      // Encrypt sensitive data if encryption is enabled
      if (this.config.enableEncryption && isEncryptionAvailable()) {
        try {
          const encryptedHistory = await encryptSensitiveArray(processedPreferences.ideaHistory)
          processedPreferences = {
            ...processedPreferences,
            ideaHistory: encryptedHistory
          }
        } catch (error) {
          warnings.push('Failed to encrypt some preference data')
        }
      }

      // Save processed preferences
      const saveResult = saveRaw(processedPreferences)
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        }
      }

      return {
        success: true,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to save preferences',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Updates specific preference fields
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<PreferencesManagerResult<UserPreferences>> {
    try {
      // Load current preferences
      const loadResult = await this.loadPreferences()
      if (!loadResult.success || !loadResult.data) {
        return loadResult
      }

      // Merge updates
      const updatedPreferences: UserPreferences = {
        ...loadResult.data,
        ...updates,
        lastUsed: new Date()
      }

      // Save updated preferences
      const saveResult = await this.savePreferences(updatedPreferences)
      if (!saveResult.success) {
        return saveResult as PreferencesManagerResult<UserPreferences>
      }

      return {
        success: true,
        data: updatedPreferences,
        warnings: [...(loadResult.warnings || []), ...(saveResult.warnings || [])]
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to update preferences',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Adds an idea to the history with full processing
   */
  async addIdeaToHistory(idea: string): Promise<PreferencesManagerResult<UserPreferences>> {
    if (!idea.trim()) {
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Idea cannot be empty'
        }
      }
    }

    try {
      // Load current preferences
      const loadResult = await this.loadPreferences()
      if (!loadResult.success || !loadResult.data) {
        return loadResult
      }

      const preferences = loadResult.data

      // Remove duplicate if exists and add to beginning
      const filteredHistory = preferences.ideaHistory.filter(existing => existing !== idea.trim())
      const updatedHistory = [idea.trim(), ...filteredHistory].slice(0, 10) // MAX_IDEA_HISTORY

      // Update preferences
      return await this.updatePreferences({
        ideaHistory: updatedHistory
      })
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to add idea to history',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Forces cleanup of preferences
   */
  async forceCleanup(): Promise<PreferencesManagerResult<{ itemsRemoved: number; reasons: string[] }>> {
    try {
      const { forceCleanup } = await import('./cleanup')
      const cleanupResult = await forceCleanup()

      if (!cleanupResult.success) {
        return {
          success: false,
          error: {
            type: 'storage_unavailable',
            message: 'Failed to perform cleanup',
            originalError: cleanupResult.error
          }
        }
      }

      return {
        success: true,
        data: {
          itemsRemoved: cleanupResult.itemsRemoved,
          reasons: cleanupResult.reasons
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to perform cleanup',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Gets comprehensive preferences information
   */
  async getPreferencesInfo(): Promise<PreferencesManagerResult<{
    preferences: UserPreferences
    encryptionAvailable: boolean
    storageSize: number
    cleanupInfo: any
  }>> {
    try {
      const loadResult = await this.loadPreferences()
      if (!loadResult.success || !loadResult.data) {
        return loadResult as any
      }

      const { getStorageInfo } = await import('./storage')
      const { getCleanupInfo } = await import('./cleanup')

      const storageInfo = getStorageInfo()
      const cleanupInfo = getCleanupInfo()

      return {
        success: true,
        data: {
          preferences: loadResult.data,
          encryptionAvailable: isEncryptionAvailable(),
          storageSize: storageInfo.used,
          cleanupInfo
        },
        warnings: loadResult.warnings
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to get preferences info',
          originalError: error as Error
        }
      }
    }
  }

  /**
   * Resets all preferences to defaults
   */
  async resetPreferences(): Promise<PreferencesManagerResult<void>> {
    try {
      const { clearPreferences } = await import('./storage')
      const clearResult = clearPreferences()

      if (!clearResult.success) {
        return {
          success: false,
          error: clearResult.error
        }
      }

      return {
        success: true,
        warnings: ['All preferences have been reset to defaults']
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage_unavailable',
          message: 'Failed to reset preferences',
          originalError: error as Error
        }
      }
    }
  }
}

/**
 * Default preferences manager instance
 */
export const defaultPreferencesManager = new PreferencesManager()

/**
 * Convenience functions using the default manager
 */
export const loadPreferences = () => defaultPreferencesManager.loadPreferences()
export const savePreferences = (preferences: UserPreferences) => defaultPreferencesManager.savePreferences(preferences)
export const updatePreferences = (updates: Partial<UserPreferences>) => defaultPreferencesManager.updatePreferences(updates)
export const addIdeaToHistory = (idea: string) => defaultPreferencesManager.addIdeaToHistory(idea)
export const forceCleanup = () => defaultPreferencesManager.forceCleanup()
export const getPreferencesInfo = () => defaultPreferencesManager.getPreferencesInfo()
export const resetPreferences = () => defaultPreferencesManager.resetPreferences()