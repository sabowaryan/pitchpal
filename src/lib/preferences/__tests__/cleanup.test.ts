/**
 * Tests for cleanup utilities
 */

import {
  performAutomaticCleanup,
  forceCleanup,
  getCleanupInfo,
  initializeAutomaticCleanup,
  CLEANUP_CONFIG
} from '../cleanup'
import { DEFAULT_PREFERENCES } from '../types'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Mock the storage module
jest.mock('../storage', () => ({
  loadPreferences: jest.fn(),
  savePreferences: jest.fn()
}))

describe('Cleanup Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-ignore
    global.localStorage = mockLocalStorage
  })

  describe('performAutomaticCleanup', () => {
    it('should skip cleanup when not needed', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      // Mock recent preferences with clean history
      loadPreferences.mockReturnValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ideaHistory: ['good idea 1', 'good idea 2'],
          lastUsed: new Date()
        }
      })

      // Mock recent cleanup metadata with specific key
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pitch_generator_cleanup_metadata') {
          return JSON.stringify({
            lastCleanup: new Date().toISOString(),
            totalCleanupsPerformed: 1,
            itemsRemovedLastCleanup: 0
          })
        }
        return null
      })

      const result = await performAutomaticCleanup()
      
      expect(result.success).toBe(true)
      expect(result.cleanupPerformed).toBe(false)
      expect(result.reasons).toContain('No cleanup needed')
      expect(savePreferences).not.toHaveBeenCalled()
    })

    it('should perform cleanup when needed', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      // Mock preferences with issues
      loadPreferences.mockReturnValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ideaHistory: [
            'good idea',
            'test', // Low quality
            '', // Empty
            'good idea', // Duplicate
            'another good idea'
          ],
          lastUsed: new Date()
        }
      })

      savePreferences.mockReturnValue({ success: true })

      // Mock old cleanup metadata
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        lastCleanup: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        totalCleanupsPerformed: 0,
        itemsRemovedLastCleanup: 0
      }))

      const result = await performAutomaticCleanup()
      
      expect(result.success).toBe(true)
      expect(result.cleanupPerformed).toBe(true)
      expect(result.itemsRemoved).toBeGreaterThan(0)
      expect(savePreferences).toHaveBeenCalled()
    })

    it('should handle load errors', async () => {
      const { loadPreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: DEFAULT_PREFERENCES,
        error: { type: 'parse_error', message: 'Failed to load' }
      })

      const result = await performAutomaticCleanup()
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Failed to load preferences')
    })

    it('should handle save errors', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ideaHistory: Array(15).fill('test') // Over limit
        }
      })

      savePreferences.mockReturnValue({
        success: false,
        error: { type: 'quota_exceeded', message: 'Storage full' }
      })

      // Mock old cleanup to force cleanup
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        lastCleanup: new Date(0).toISOString(),
        totalCleanupsPerformed: 0,
        itemsRemovedLastCleanup: 0
      }))

      const result = await performAutomaticCleanup()
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Failed to save cleaned preferences')
    })
  })

  describe('forceCleanup', () => {
    it('should always perform cleanup regardless of conditions', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ideaHistory: ['good idea', 'test', 'another good idea']
        }
      })

      savePreferences.mockReturnValue({ success: true })

      const result = await forceCleanup()
      
      expect(result.success).toBe(true)
      expect(savePreferences).toHaveBeenCalled()
    })

    it('should report when no cleanup is needed', async () => {
      const { loadPreferences, savePreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ideaHistory: ['good idea 1', 'good idea 2']
        }
      })

      savePreferences.mockReturnValue({ success: true })

      const result = await forceCleanup()
      
      expect(result.success).toBe(true)
      expect(result.reasons).toContain('No items needed cleanup')
    })
  })

  describe('getCleanupInfo', () => {
    it('should return cleanup information', () => {
      const { loadPreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: DEFAULT_PREFERENCES
      })

      // Mock the specific cleanup metadata key
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pitch_generator_cleanup_metadata') {
          return JSON.stringify({
            lastCleanup: new Date().toISOString(),
            totalCleanupsPerformed: 5,
            itemsRemovedLastCleanup: 3
          })
        }
        return null
      })

      const info = getCleanupInfo()
      
      expect(info.metadata.totalCleanupsPerformed).toBe(5)
      expect(info.metadata.itemsRemovedLastCleanup).toBe(3)
      expect(info.nextScheduledCleanup).toBeInstanceOf(Date)
      expect(info.canPerformCleanup).toBe(true)
    })

    it('should handle missing metadata', () => {
      const { loadPreferences } = require('../storage')
      
      loadPreferences.mockReturnValue({
        preferences: DEFAULT_PREFERENCES
      })

      mockLocalStorage.getItem.mockReturnValue(null)

      const info = getCleanupInfo()
      
      expect(info.metadata.totalCleanupsPerformed).toBe(0)
      expect(info.metadata.lastCleanup.getTime()).toBe(0)
    })
  })

  describe('initializeAutomaticCleanup', () => {
    it('should initialize without errors', () => {
      expect(() => initializeAutomaticCleanup()).not.toThrow()
    })
  })

  describe('CLEANUP_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(CLEANUP_CONFIG.maxIdeaAge).toBeGreaterThan(0)
      expect(CLEANUP_CONFIG.maxIdeas).toBeGreaterThan(0)
      expect(CLEANUP_CONFIG.cleanupInterval).toBeGreaterThan(0)
      expect(CLEANUP_CONFIG.maxStorageSize).toBeGreaterThan(0)
      expect(Array.isArray(CLEANUP_CONFIG.lowQualityPatterns)).toBe(true)
    })
  })
})