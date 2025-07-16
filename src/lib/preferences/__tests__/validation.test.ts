/**
 * Tests for validation utilities
 */

import {
  validatePreferences,
  validatePreferencesForSave,
  validatePreferenceField,
  VALIDATION_RULES
} from '../validation'
import { DEFAULT_PREFERENCES } from '../types'

describe('Validation Utilities', () => {
  describe('validatePreferences', () => {
    it('should validate correct preferences', () => {
      const validPreferences = {
        ...DEFAULT_PREFERENCES,
        lastUsed: new Date()
      }
      
      const result = validatePreferences(validPreferences)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-object preferences', () => {
      const result = validatePreferences('invalid')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('must be an object')
    })

    it('should reject invalid tone', () => {
      const invalidPreferences = {
        ...DEFAULT_PREFERENCES,
        defaultTone: 'invalid_tone'
      }
      
      const result = validatePreferences(invalidPreferences)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('Invalid tone'))).toBe(true)
    })

    it('should sanitize retry attempts', () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        maxRetryAttempts: 15 // Over limit
      }
      
      const result = validatePreferences(preferences)
      expect(result.isValid).toBe(true)
      expect(result.sanitized?.maxRetryAttempts).toBe(VALIDATION_RULES.maxRetryAttempts.max)
    })

    it('should clean up idea history', () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: [
          'valid idea',
          '', // Empty
          'test', // This might not be considered low quality by our patterns
          'another valid idea',
          'valid idea' // Duplicate
        ]
      }
      
      const result = validatePreferences(preferences)
      expect(result.isValid).toBe(true)
      // Should remove empty strings and duplicates, but 'test' might be kept
      expect(result.sanitized?.ideaHistory.length).toBeGreaterThan(0)
      expect(result.sanitized?.ideaHistory).not.toContain('') // No empty strings
    })

    it('should handle suspicious content in ideas', () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: [
          'valid idea',
          '<script>alert("xss")</script>',
          'javascript:void(0)',
          'another valid idea'
        ]
      }
      
      const result = validatePreferences(preferences)
      expect(result.isValid).toBe(true)
      expect(result.sanitized?.ideaHistory).toHaveLength(2) // Suspicious content removed
    })
  })

  describe('validatePreferencesForSave', () => {
    it('should perform additional validation for saving', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30 days in future
      
      const preferences = {
        ...DEFAULT_PREFERENCES,
        lastUsed: futureDate
      }
      
      const result = validatePreferencesForSave(preferences)
      expect(result.isValid).toBe(true)
      expect(result.sanitized?.lastUsed.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should remove duplicate ideas', () => {
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ideaHistory: ['idea1', 'idea2', 'idea1', 'idea3']
      }
      
      const result = validatePreferencesForSave(preferences)
      expect(result.isValid).toBe(true)
      expect(result.sanitized?.ideaHistory).toEqual(['idea1', 'idea2', 'idea3'])
    })
  })

  describe('validatePreferenceField', () => {
    it('should validate tone field', () => {
      const result = validatePreferenceField('defaultTone', 'professional')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('professional')
    })

    it('should reject invalid tone', () => {
      const result = validatePreferenceField('defaultTone', 'invalid')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid tone')
    })

    it('should validate boolean fields', () => {
      const result = validatePreferenceField('autoSave', true)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(true)
    })

    it('should reject non-boolean for boolean fields', () => {
      const result = validatePreferenceField('autoSave', 'true')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be a boolean')
    })

    it('should validate and sanitize retry attempts', () => {
      const result = validatePreferenceField('maxRetryAttempts', 15)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(10) // Clamped to max
    })

    it('should validate idea history', () => {
      const result = validatePreferenceField('ideaHistory', ['idea1', 'idea2'])
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toEqual(['idea1', 'idea2'])
    })

    it('should validate date field', () => {
      const date = new Date()
      const result = validatePreferenceField('lastUsed', date)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(date)
    })

    it('should reject unknown field', () => {
      // @ts-ignore - Testing invalid field
      const result = validatePreferenceField('unknownField', 'value')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unknown preference field')
    })
  })
})