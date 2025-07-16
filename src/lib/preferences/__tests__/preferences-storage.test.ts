/**
 * Tests for the preferences storage system
 */

import {
  savePreferences,
  loadPreferences,
  clearPreferences,
  addToIdeaHistory,
  cleanupOldHistory
} from '../preferences-storage'
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
  ),
  isEncryptionAvailable: jest.fn().mockReturnValue(true)
}))

describe('Preferences Storage System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-ignore
    global.localStorage = mockLocalStorage
  })

  afterEach(() => {
    // @ts-ignore
    delete global.localStorage
  })

  describe('savePreferences', () => {
    it('should save preferences to localStorage', async () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'fun',
        autoSave: false
      }
      
      await savePreferences(prefs)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"defaultTone":"fun"')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"autoSave":false')
      )
    })

    it('should encrypt sensitive data', async () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea1', 'idea2']
      }
      
      await savePreferences(prefs)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('"ideaHistory":["encrypted_idea1","encrypted_idea2"]')
      )
    })

    it('should handle localStorage errors', async () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      
      const prefs = { ...DEFAULT_PREFERENCES }
      
      // Should not throw
      await expect(savePreferences(prefs)).resolves.not.toThrow()
    })

    it('should update preferences version', async () => {
      const prefs = { ...DEFAULT_PREFERENCES }
      
      await savePreferences(prefs)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitch_generator_preferences_version',
        expect.any(String)
      )
    })
  })

  describe('loadPreferences', () => {
    it('should load preferences from localStorage', async () => {
      const savedPrefs = {
        defaultTone: 'tech',
        autoSave: false,
        showSuggestions: true,
        enableRetry: true,
        maxRetryAttempts: 5,
        ideaHistory: ['encrypted_idea1', 'encrypted_idea2'],
        lastUsed: new Date().toISOString()
      }
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify(savedPrefs)
        }
        return null
      })
      
      const loadedPrefs = await loadPreferences()
      
      expect(loadedPrefs.defaultTone).toBe('tech')
      expect(loadedPrefs.autoSave).toBe(false)
      expect(loadedPrefs.showSuggestions).toBe(true)
      expect(loadedPrefs.ideaHistory).toEqual(['idea1', 'idea2'])
    })

    it('should return default preferences when none are saved', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const loadedPrefs = await loadPreferences()
      
      expect(loadedPrefs).toEqual(DEFAULT_PREFERENCES)
    })

    it('should handle corrupted preferences data', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return 'invalid json'
        }
        return null
      })
      
      const loadedPrefs = await loadPreferences()
      
      expect(loadedPrefs).toEqual(DEFAULT_PREFERENCES)
    })

    it('should handle localStorage errors', async () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      
      const loadedPrefs = await loadPreferences()
      
      expect(loadedPrefs).toEqual(DEFAULT_PREFERENCES)
    })

    it('should decrypt sensitive data', async () => {
      const savedPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['encrypted_idea1', 'encrypted_idea2']
      }
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'pitchpal_preferences') {
          return JSON.stringify(savedPrefs)
        }
        return null
      })
      
      const loadedPrefs = await loadPreferences()
      
      expect(loadedPrefs.ideaHistory).toEqual(['idea1', 'idea2'])
    })
  })

  describe('clearPreferences', () => {
    it('should remove preferences from localStorage', async () => {
      await clearPreferences()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pitchpal_preferences')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pitch_generator_preferences_version')
    })

    it('should handle localStorage errors', async () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      
      // Should not throw
      await expect(clearPreferences()).resolves.not.toThrow()
    })
  })

  describe('addToIdeaHistory', () => {
    it('should add idea to history', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['existing idea']
      }
      
      const newIdea = 'new idea'
      const updatedPrefs = await addToIdeaHistory(currentPrefs, newIdea)
      
      expect(updatedPrefs.ideaHistory).toContain(newIdea)
      expect(updatedPrefs.ideaHistory).toContain('existing idea')
    })

    it('should add idea to the beginning of history', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['older idea']
      }
      
      const newIdea = 'newer idea'
      const updatedPrefs = await addToIdeaHistory(currentPrefs, newIdea)
      
      expect(updatedPrefs.ideaHistory[0]).toBe(newIdea)
    })

    it('should not add duplicate ideas', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['existing idea', 'another idea']
      }
      
      const duplicateIdea = 'existing idea'
      const updatedPrefs = await addToIdeaHistory(currentPrefs, duplicateIdea)
      
      // Should move to front but not duplicate
      expect(updatedPrefs.ideaHistory).toHaveLength(2)
      expect(updatedPrefs.ideaHistory[0]).toBe(duplicateIdea)
    })

    it('should limit history to maximum size', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: Array.from({ length: 10 }, (_, i) => `idea ${i}`)
      }
      
      const newIdea = 'new idea'
      const updatedPrefs = await addToIdeaHistory(currentPrefs, newIdea)
      
      expect(updatedPrefs.ideaHistory).toHaveLength(10)
      expect(updatedPrefs.ideaHistory[0]).toBe(newIdea)
      expect(updatedPrefs.ideaHistory).not.toContain('idea 9')
    })

    it('should not add idea when autoSave is disabled', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        autoSave: false,
        ideaHistory: ['existing idea']
      }
      
      const newIdea = 'new idea'
      const updatedPrefs = await addToIdeaHistory(currentPrefs, newIdea)
      
      expect(updatedPrefs.ideaHistory).not.toContain(newIdea)
      expect(updatedPrefs.ideaHistory).toEqual(currentPrefs.ideaHistory)
    })
  })

  describe('cleanupOldHistory', () => {
    it('should remove old ideas beyond the maximum limit', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: Array.from({ length: 15 }, (_, i) => `idea ${i}`)
      }
      
      const cleanedPrefs = await cleanupOldHistory(currentPrefs, 10)
      
      expect(cleanedPrefs.ideaHistory).toHaveLength(10)
      expect(cleanedPrefs.ideaHistory[0]).toBe('idea 0')
      expect(cleanedPrefs.ideaHistory).not.toContain('idea 10')
    })

    it('should not modify history if under the limit', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea 1', 'idea 2', 'idea 3']
      }
      
      const cleanedPrefs = await cleanupOldHistory(currentPrefs, 10)
      
      expect(cleanedPrefs.ideaHistory).toEqual(currentPrefs.ideaHistory)
    })

    it('should handle empty history', async () => {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: []
      }
      
      const cleanedPrefs = await cleanupOldHistory(currentPrefs, 10)
      
      expect(cleanedPrefs.ideaHistory).toEqual([])
    })
  })
})