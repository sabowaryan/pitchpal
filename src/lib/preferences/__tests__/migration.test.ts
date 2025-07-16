/**
 * Tests for migration utilities
 */

import {
  migratePreferences,
  upgradePreferencesWithEncryption,
  decryptPreferences,
  performMigrationCheck,
  validatePreferences,
  PREFERENCES_VERSION
} from '../migration'
import { DEFAULT_PREFERENCES } from '../types'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

// Mock encryption functions
jest.mock('../encryption', () => ({
  encryptSensitiveArray: jest.fn().mockImplementation(async (data: string[]) => 
    data.map(item => `encrypted_${item}`)
  ),
  decryptSensitiveArray: jest.fn().mockImplementation(async (data: string[]) => 
    data.map(item => item.replace('encrypted_', ''))
  )
}))

describe('Migration Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-ignore
    global.localStorage = mockLocalStorage
  })

  afterEach(() => {
    // @ts-ignore
    delete global.localStorage
  })

  describe('validatePreferences', () => {
    it('should validate correct preferences', () => {
      const validPrefs = {
        ...DEFAULT_PREFERENCES,
        lastUsed: new Date()
      }
      
      expect(validatePreferences(validPrefs)).toBe(true)
    })

    it('should reject invalid preferences', () => {
      expect(validatePreferences(null)).toBe(false)
      expect(validatePreferences({})).toBe(false)
      expect(validatePreferences({ defaultTone: 'invalid' })).toBe(false)
    })

    it('should reject preferences with invalid tone', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'invalid_tone',
        lastUsed: new Date()
      }
      
      expect(validatePreferences(invalidPrefs)).toBe(false)
    })

    it('should reject preferences with invalid boolean fields', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        autoSave: 'not_boolean',
        lastUsed: new Date()
      }
      
      expect(validatePreferences(invalidPrefs)).toBe(false)
    })

    it('should reject preferences with invalid retry attempts', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        maxRetryAttempts: -1,
        lastUsed: new Date()
      }
      
      expect(validatePreferences(invalidPrefs)).toBe(false)
    })

    it('should reject preferences with invalid idea history', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: 'not_array',
        lastUsed: new Date()
      }
      
      expect(validatePreferences(invalidPrefs)).toBe(false)
    })

    it('should reject preferences with invalid date', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        lastUsed: 'not_date'
      }
      
      expect(validatePreferences(invalidPrefs)).toBe(false)
    })
  })

  describe('migratePreferences', () => {
    it('should return defaults when no migration needed', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'pitch_generator_preferences_version') {
          return PREFERENCES_VERSION
        }
        return null
      })

      const result = await migratePreferences()
      
      expect(result.preferences).toEqual(DEFAULT_PREFERENCES)
      expect(result.migrated).toBe(false)
    })

    it('should migrate legacy localStorage keys', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'pitch_generator_preferences_version':
            return null
          case 'pitch_tone':
            return 'professional'
          case 'pitch_ideas':
            return JSON.stringify(['idea1', 'idea2'])
          case 'pitch_settings':
            return JSON.stringify({ autoSave: false, suggestions: true })
          default:
            return null
        }
      })

      const result = await migratePreferences()
      
      expect(result.migrated).toBe(true)
      expect(result.preferences.defaultTone).toBe('professional')
      expect(result.preferences.autoSave).toBe(false)
      expect(result.preferences.showSuggestions).toBe(true)
    })

    it('should handle migration errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await migratePreferences()
      
      expect(result.preferences).toEqual(DEFAULT_PREFERENCES)
      expect(result.migrated).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should clean up legacy keys after migration', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'pitch_generator_preferences_version':
            return null
          case 'pitch_tone':
            return 'fun'
          default:
            return null
        }
      })

      await migratePreferences()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pitch_tone')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pitch_ideas')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pitch_settings')
    })
  })

  describe('upgradePreferencesWithEncryption', () => {
    it('should encrypt idea history', async () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea1', 'idea2']
      }

      const result = await upgradePreferencesWithEncryption(preferences)
      
      expect(result.ideaHistory).toEqual(['encrypted_idea1', 'encrypted_idea2'])
    })

    it('should skip encryption if already encrypted', async () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['b64:encrypted_data', 'very_long_encrypted_string_that_indicates_encryption']
      }

      const result = await upgradePreferencesWithEncryption(preferences)
      
      expect(result.ideaHistory).toEqual(preferences.ideaHistory)
    })

    it('should handle encryption errors gracefully', async () => {
      const { encryptSensitiveArray } = require('../encryption')
      encryptSensitiveArray.mockRejectedValueOnce(new Error('Encryption failed'))

      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea1', 'idea2']
      }

      const result = await upgradePreferencesWithEncryption(preferences)
      
      expect(result).toEqual(preferences)
    })
  })

  describe('decryptPreferences', () => {
    it('should decrypt idea history', async () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['encrypted_idea1', 'encrypted_idea2']
      }

      const result = await decryptPreferences(preferences)
      
      expect(result.ideaHistory).toEqual(['idea1', 'idea2'])
    })

    it('should handle decryption errors gracefully', async () => {
      const { decryptSensitiveArray } = require('../encryption')
      decryptSensitiveArray.mockRejectedValueOnce(new Error('Decryption failed'))

      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['encrypted_idea1', 'encrypted_idea2']
      }

      const result = await decryptPreferences(preferences)
      
      expect(result).toEqual(preferences)
    })
  })

  describe('performMigrationCheck', () => {
    it('should perform complete migration and upgrade', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'pitch_generator_preferences_version':
            return null
          case 'pitch_tone':
            return 'tech'
          default:
            return null
        }
      })

      const result = await performMigrationCheck()
      
      expect(result.success).toBe(true)
      expect(result.migrated).toBe(true)
    })

    it('should handle migration check errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await performMigrationCheck()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should skip migration when not needed', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'pitch_generator_preferences_version') {
          return PREFERENCES_VERSION
        }
        return null
      })

      const result = await performMigrationCheck()
      
      expect(result.success).toBe(true)
      expect(result.migrated).toBe(false)
      expect(result.upgraded).toBe(false)
    })
  })
})