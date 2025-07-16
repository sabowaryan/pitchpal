/**
 * Tests for preferences manager
 */

import { PreferencesManager, defaultPreferencesManager } from '../manager'
import { DEFAULT_PREFERENCES } from '../types'

// Mock all the dependencies
jest.mock('../storage')
jest.mock('../encryption')
jest.mock('../migration')
jest.mock('../validation')
jest.mock('../cleanup')

describe('PreferencesManager', () => {
  let manager: PreferencesManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new PreferencesManager({ autoInitialize: false })
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const { performMigrationCheck } = require('../migration')
      const { initializeAutomaticCleanup } = require('../cleanup')
      
      performMigrationCheck.mockResolvedValue({
        success: true,
        migrated: false,
        upgraded: false
      })

      const result = await manager.initialize()
      
      expect(result.success).toBe(true)
      expect(performMigrationCheck).toHaveBeenCalled()
      expect(initializeAutomaticCleanup).toHaveBeenCalled()
    })

    it('should handle migration errors', async () => {
      const { performMigrationCheck } = require('../migration')
      
      performMigrationCheck.mockResolvedValue({
        success: false,
        error: new Error('Migration failed')
      })

      const result = await manager.initialize()
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('migration_error')
    })

    it('should report migration and upgrade status', async () => {
      const { performMigrationCheck } = require('../migration')
      
      performMigrationCheck.mockResolvedValue({
        success: true,
        migrated: true,
        upgraded: true
      })

      const result = await manager.initialize()
      
      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Preferences were migrated from legacy format')
      expect(result.warnings).toContain('Preferences were upgraded with encryption')
    })
  })

  describe('loadPreferences', () => {
    it('should load preferences with full processing', async () => {
      const { loadPreferences } = require('../storage')
      const { migratePreferences, decryptPreferences } = require('../migration')
      const { validatePreferences } = require('../validation')
      const { performAutomaticCleanup } = require('../cleanup')
      
      loadPreferences.mockReturnValue({
        preferences: DEFAULT_PREFERENCES
      })
      
      migratePreferences.mockResolvedValue({
        preferences: DEFAULT_PREFERENCES,
        migrated: false
      })
      
      decryptPreferences.mockResolvedValue(DEFAULT_PREFERENCES)
      
      validatePreferences.mockReturnValue({
        isValid: true,
        sanitized: DEFAULT_PREFERENCES
      })
      
      performAutomaticCleanup.mockResolvedValue({
        cleanupPerformed: false
      })

      // Initialize first
      await manager.initialize()
      
      const result = await manager.loadPreferences()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(DEFAULT_PREFERENCES)
    })

    it('should handle validation failures', async () => {
      const { loadPreferences } = require('../storage')
      const { validatePreferences } = require('../validation')
      
      loadPreferences.mockReturnValue({
        preferences: { invalid: 'data' }
      })
      
      validatePreferences.mockReturnValue({
        isValid: false,
        sanitized: DEFAULT_PREFERENCES,
        warnings: ['Invalid data fixed']
      })

      await manager.initialize()
      const result = await manager.loadPreferences()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(DEFAULT_PREFERENCES)
      expect(result.warnings).toContain('Some preferences were invalid and have been reset to defaults')
    })
  })

  describe('savePreferences', () => {
    it('should save preferences with validation and encryption', async () => {
      const { savePreferences } = require('../storage')
      const { validatePreferencesForSave } = require('../validation')
      const { encryptSensitiveArray, isEncryptionAvailable } = require('../encryption')
      
      validatePreferencesForSave.mockReturnValue({
        isValid: true,
        sanitized: DEFAULT_PREFERENCES
      })
      
      isEncryptionAvailable.mockReturnValue(true)
      encryptSensitiveArray.mockResolvedValue(['encrypted_idea'])
      
      savePreferences.mockReturnValue({ success: true })

      await manager.initialize()
      const result = await manager.savePreferences(DEFAULT_PREFERENCES)
      
      expect(result.success).toBe(true)
      expect(validatePreferencesForSave).toHaveBeenCalled()
      expect(encryptSensitiveArray).toHaveBeenCalled()
      expect(savePreferences).toHaveBeenCalled()
    })

    it('should handle validation failures', async () => {
      const { validatePreferencesForSave } = require('../validation')
      
      validatePreferencesForSave.mockReturnValue({
        isValid: false,
        errors: [{ type: 'parse_error', message: 'Invalid data' }]
      })

      await manager.initialize()
      const result = await manager.savePreferences(DEFAULT_PREFERENCES)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('parse_error')
    })
  })

  describe('updatePreferences', () => {
    it('should update specific fields', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      // Mock loadPreferences to return via manager's loadPreferences method
      manager.loadPreferences = jest.fn().mockResolvedValue({
        success: true,
        data: DEFAULT_PREFERENCES
      })
      
      manager.savePreferences = jest.fn().mockResolvedValue({
        success: true
      })

      const updates = { autoSave: false }
      const result = await manager.updatePreferences(updates)
      
      expect(result.success).toBe(true)
      expect(manager.loadPreferences).toHaveBeenCalled()
      expect(manager.savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ autoSave: false })
      )
    })
  })

  describe('addIdeaToHistory', () => {
    it('should add idea to history', async () => {
      manager.loadPreferences = jest.fn().mockResolvedValue({
        success: true,
        data: { ...DEFAULT_PREFERENCES, ideaHistory: ['existing idea'] }
      })
      
      manager.updatePreferences = jest.fn().mockResolvedValue({
        success: true,
        data: { ...DEFAULT_PREFERENCES, ideaHistory: ['new idea', 'existing idea'] }
      })

      const result = await manager.addIdeaToHistory('new idea')
      
      expect(result.success).toBe(true)
      expect(manager.updatePreferences).toHaveBeenCalledWith({
        ideaHistory: ['new idea', 'existing idea']
      })
    })

    it('should reject empty ideas', async () => {
      const result = await manager.addIdeaToHistory('')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('cannot be empty')
    })
  })

  describe('forceCleanup', () => {
    it('should perform forced cleanup', async () => {
      const mockForceCleanup = jest.fn().mockResolvedValue({
        success: true,
        itemsRemoved: 5,
        reasons: ['Removed duplicates']
      })
      
      // Mock dynamic import
      jest.doMock('../cleanup', () => ({
        forceCleanup: mockForceCleanup
      }))

      const result = await manager.forceCleanup()
      
      expect(result.success).toBe(true)
      expect(result.data?.itemsRemoved).toBe(5)
    })
  })

  describe('resetPreferences', () => {
    it('should reset all preferences', async () => {
      const mockClearPreferences = jest.fn().mockReturnValue({
        success: true
      })
      
      jest.doMock('../storage', () => ({
        clearPreferences: mockClearPreferences
      }))

      const result = await manager.resetPreferences()
      
      expect(result.success).toBe(true)
      expect(result.warnings).toContain('All preferences have been reset to defaults')
    })
  })

  describe('default manager instance', () => {
    it('should provide default manager instance', () => {
      expect(defaultPreferencesManager).toBeInstanceOf(PreferencesManager)
    })
  })
})