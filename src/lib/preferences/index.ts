// Re-export all preferences functionality
export * from './types'
export * from './storage'
export * from './encryption'
export * from './migration'
export * from './validation'
export * from './cleanup'
export * from './manager'

// Convenience exports for common operations
export {
  loadPreferences,
  savePreferences,
  addIdeaToHistory,
  updatePreferences,
  clearPreferences,
  getStorageInfo
} from './storage'

// Encryption utilities
export {
  encryptSensitiveData,
  decryptSensitiveData,
  isEncryptionAvailable,
  encryptSensitiveArray,
  decryptSensitiveArray
} from './encryption'

// Migration utilities
export {
  validatePreferences as validatePreferencesSchema,
  migratePreferences,
  upgradePreferencesWithEncryption,
  decryptPreferences,
  performMigrationCheck,
  PREFERENCES_VERSION
} from './migration'

// Validation utilities
export {
  validatePreferences,
  validatePreferencesForSave,
  validatePreferenceField,
  VALIDATION_RULES
} from './validation'

// Cleanup utilities
export {
  performAutomaticCleanup,
  forceCleanup,
  getCleanupInfo,
  initializeAutomaticCleanup,
  CLEANUP_CONFIG
} from './cleanup'

export type {
  UserPreferences,
  PreferencesError
} from './types'

export {
  DEFAULT_PREFERENCES,
  MAX_IDEA_HISTORY
} from './types'