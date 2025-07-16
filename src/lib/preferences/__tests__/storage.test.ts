import {
  loadPreferences,
  savePreferences,
  addIdeaToHistory,
  updatePreferences,
  clearPreferences,
  getStorageInfo
} from '../storage'
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  MAX_IDEA_HISTORY
} from '../types'

// Simple localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  let shouldThrow = false

  return {
    getItem: jest.fn((key: string) => {
      if (shouldThrow) throw new Error('localStorage not available')
      return store[key] || null
    }),
    setItem: jest.fn((key: string, value: string) => {
      if (shouldThrow) throw new Error('localStorage not available')
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      if (shouldThrow) throw new Error('localStorage not available')
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    setShouldThrow: (value: boolean) => { shouldThrow = value },
    getStore: () => ({ ...store })
  }
}

const mockLocalStorage = createLocalStorageMock()

// Mock localStorage globally
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('Preferences Storage', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    mockLocalStorage.setShouldThrow(false)
    jest.clearAllMocks()
  })

  describe('loadPreferences', () => {
    it('should return default preferences when no stored data exists', () => {
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe('professional')
      expect(result.preferences.autoSave).toBe(true)
      expect(result.preferences.showSuggestions).toBe(true)
      expect(result.preferences.enableRetry).toBe(true)
      expect(result.preferences.maxRetryAttempts).toBe(3)
      expect(result.preferences.ideaHistory).toEqual([])
      expect(result.error).toBeUndefined()
    })

    it('should load stored preferences correctly', () => {
      const testPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'fun',
        autoSave: false,
        ideaHistory: ['test idea 1', 'test idea 2']
      }

      mockLocalStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(testPreferences))
      
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe('fun')
      expect(result.preferences.autoSave).toBe(false)
      expect(result.preferences.ideaHistory).toEqual(['test idea 1', 'test idea 2'])
      expect(result.error).toBeUndefined()
    })

    it('should handle corrupted JSON gracefully', () => {
      mockLocalStorage.setItem(PREFERENCES_STORAGE_KEY, 'invalid json')
      
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe(DEFAULT_PREFERENCES.defaultTone)
      expect(result.preferences.autoSave).toBe(DEFAULT_PREFERENCES.autoSave)
      expect(result.preferences.ideaHistory).toEqual(DEFAULT_PREFERENCES.ideaHistory)
      expect(result.error).toEqual({
        type: 'parse_error',
        message: 'Failed to parse stored preferences. Using defaults.',
        originalError: expect.any(Error)
      })
    })

    it('should validate and sanitize loaded preferences', () => {
      const invalidPreferences = {
        defaultTone: 'invalid_tone',
        maxRetryAttempts: -5,
        ideaHistory: ['valid idea', '', null, 'another valid idea'],
        autoSave: 'not_boolean'
      }

      mockLocalStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(invalidPreferences))
      
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe('professional') // fallback to default
      expect(result.preferences.maxRetryAttempts).toBe(3) // fallback to default
      expect(result.preferences.ideaHistory).toEqual(['valid idea', 'another valid idea']) // filtered
      expect(result.preferences.autoSave).toBe(true) // fallback to default
    })

    it('should migrate legacy preferences', () => {
      // Set up legacy preferences
      mockLocalStorage.setItem(LEGACY_STORAGE_KEYS[0], 'tech') // tone
      mockLocalStorage.setItem(LEGACY_STORAGE_KEYS[1], JSON.stringify(['legacy idea 1', 'legacy idea 2'])) // ideas
      mockLocalStorage.setItem(LEGACY_STORAGE_KEYS[2], JSON.stringify({ autoSave: false, suggestions: false })) // settings
      
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe('tech')
      expect(result.preferences.ideaHistory).toEqual(['legacy idea 1', 'legacy idea 2'])
      expect(result.preferences.autoSave).toBe(false)
      expect(result.preferences.showSuggestions).toBe(false)
      
      // Verify legacy keys were removed
      LEGACY_STORAGE_KEYS.forEach(key => {
        expect(mockLocalStorage.getItem(key)).toBeNull()
      })
    })

    it('should handle localStorage unavailability', () => {
      mockLocalStorage.setShouldThrow(true)
      
      const result = loadPreferences()
      
      expect(result.preferences.defaultTone).toBe(DEFAULT_PREFERENCES.defaultTone)
      expect(result.error).toEqual({
        type: 'storage_unavailable',
        message: 'localStorage is not available. Preferences will not be saved.'
      })
    })
  })

  describe('savePreferences', () => {
    it('should save preferences successfully', () => {
      const testPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'startup',
        ideaHistory: ['test idea']
      }
      
      const result = savePreferences(testPreferences)
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        PREFERENCES_STORAGE_KEY,
        expect.stringContaining('"defaultTone":"startup"')
      )
    })

    it('should sanitize preferences before saving', () => {
      // Create an array with more than MAX_IDEA_HISTORY valid items plus some invalid ones
      const validIdeas = Array(12).fill(0).map((_, i) => `valid idea ${i + 1}`)
      const testPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['first valid', '', '  ', 'second valid', ...validIdeas],
        maxRetryAttempts: 50 // too high
      }
      
      const result = savePreferences(testPreferences)
      
      expect(result.success).toBe(true)
      
      // Verify the preferences were saved and sanitized by loading them back
      const { preferences: loaded } = loadPreferences()
      expect(loaded.ideaHistory).toHaveLength(MAX_IDEA_HISTORY)
      // Should contain the last 10 valid items (after filtering out empty/whitespace)
      expect(loaded.ideaHistory).toContain('valid idea 12')
      expect(loaded.ideaHistory).toContain('valid idea 11')
      expect(loaded.ideaHistory).not.toContain('') // empty strings filtered out
      expect(loaded.ideaHistory).not.toContain('  ') // whitespace-only strings filtered out
      expect(loaded.maxRetryAttempts).toBe(10) // capped at 10
    })

    it('should handle localStorage unavailability', () => {
      mockLocalStorage.setShouldThrow(true)
      
      const result = savePreferences(DEFAULT_PREFERENCES)
      
      expect(result.success).toBe(false)
      expect(result.error).toEqual({
        type: 'storage_unavailable',
        message: 'localStorage is not available. Preferences cannot be saved.'
      })
    })
  })

  describe('addIdeaToHistory', () => {
    it('should add new idea to history', () => {
      const result = addIdeaToHistory('New innovative idea')
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.ideaHistory).toEqual(['New innovative idea'])
    })

    it('should add idea to beginning of existing history', () => {
      const initialPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['existing idea 1', 'existing idea 2']
      }
      savePreferences(initialPreferences)
      
      const result = addIdeaToHistory('newest idea')
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.ideaHistory).toEqual(['newest idea', 'existing idea 1', 'existing idea 2'])
    })

    it('should remove duplicate ideas', () => {
      const initialPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea 1', 'idea 2', 'idea 3']
      }
      savePreferences(initialPreferences)
      
      const result = addIdeaToHistory('idea 2')
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.ideaHistory).toEqual(['idea 2', 'idea 1', 'idea 3'])
    })

    it('should maintain maximum history limit', () => {
      const initialPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: Array(MAX_IDEA_HISTORY).fill(0).map((_, i) => `idea ${i + 1}`)
      }
      savePreferences(initialPreferences)
      
      const result = addIdeaToHistory('newest idea')
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.ideaHistory).toHaveLength(MAX_IDEA_HISTORY)
      expect(preferences.ideaHistory[0]).toBe('newest idea')
      expect(preferences.ideaHistory).not.toContain('idea 10') // oldest should be removed
    })

    it('should ignore empty or whitespace-only ideas', () => {
      const result1 = addIdeaToHistory('')
      const result2 = addIdeaToHistory('   ')
      const result3 = addIdeaToHistory('\t\n')
      
      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
      expect(result3.success).toBe(false)
      
      const { preferences } = loadPreferences()
      expect(preferences.ideaHistory).toEqual([])
    })
  })

  describe('updatePreferences', () => {
    it('should update specific preference fields', () => {
      const initialPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'professional',
        autoSave: true
      }
      savePreferences(initialPreferences)
      
      const result = updatePreferences({
        defaultTone: 'fun',
        showSuggestions: false
      })
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.defaultTone).toBe('fun')
      expect(preferences.showSuggestions).toBe(false)
      expect(preferences.autoSave).toBe(true) // unchanged
    })

    it('should update lastUsed timestamp', () => {
      const beforeUpdate = new Date()
      
      const result = updatePreferences({ defaultTone: 'tech' })
      
      expect(result.success).toBe(true)
      
      const { preferences } = loadPreferences()
      expect(preferences.lastUsed.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('clearPreferences', () => {
    it('should clear all preferences', () => {
      savePreferences({
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['test idea']
      })
      
      const result = clearPreferences()
      
      expect(result.success).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(PREFERENCES_STORAGE_KEY)
      
      const { preferences } = loadPreferences()
      expect(preferences.defaultTone).toBe(DEFAULT_PREFERENCES.defaultTone)
      expect(preferences.ideaHistory).toEqual([])
    })

    it('should clear legacy keys as well', () => {
      LEGACY_STORAGE_KEYS.forEach(key => {
        mockLocalStorage.setItem(key, 'test')
      })
      
      const result = clearPreferences()
      
      expect(result.success).toBe(true)
      LEGACY_STORAGE_KEYS.forEach(key => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key)
      })
    })

    it('should handle localStorage unavailability', () => {
      mockLocalStorage.setShouldThrow(true)
      
      const result = clearPreferences()
      
      expect(result.success).toBe(false)
      expect(result.error).toEqual({
        type: 'storage_unavailable',
        message: 'localStorage is not available.'
      })
    })
  })

  describe('getStorageInfo', () => {
    it('should return storage usage information', () => {
      const testPreferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['test idea 1', 'test idea 2']
      }
      savePreferences(testPreferences)
      
      const info = getStorageInfo()
      
      expect(info.available).toBe(true)
      expect(info.used).toBeGreaterThan(0)
    })

    it('should handle localStorage unavailability', () => {
      mockLocalStorage.setShouldThrow(true)
      
      const info = getStorageInfo()
      
      expect(info.available).toBe(false)
      expect(info.used).toBe(0)
    })
  })
})