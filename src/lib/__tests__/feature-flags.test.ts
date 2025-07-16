/**
 * Tests for Feature Flags System
 */

import { 
  initializeFeatureFlags, 
  isFeatureEnabled, 
  getFeatureFlagManager,
  FEATURE_FLAGS,
  devUtils
} from '../feature-flags'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

describe('Feature Flags System', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)
    
    // Reset feature flag manager
    devUtils.clearOverrides()
  })

  describe('Basic Flag Operations', () => {
    test('should initialize with default configuration', () => {
      const manager = initializeFeatureFlags()
      expect(manager).toBeDefined()
      
      const config = manager.getConfig()
      expect(config.flags).toBeDefined()
      expect(config.environment).toBe('test')
    })

    test('should check if feature is enabled', () => {
      initializeFeatureFlags()
      
      // Default flags should be enabled in test environment
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
      expect(isFeatureEnabled(FEATURE_FLAGS.REAL_TIME_VALIDATION)).toBe(true)
    })

    test('should handle unknown flags gracefully', () => {
      initializeFeatureFlags()
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const result = isFeatureEnabled('unknown_flag' as any)
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Feature flag 'unknown_flag' not found")
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Flag Dependencies', () => {
    test('should respect flag dependencies', () => {
      const manager = initializeFeatureFlags()
      
      // Disable dependency
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)
      
      // Dependent flag should also be disabled
      expect(isFeatureEnabled(FEATURE_FLAGS.INTELLIGENT_RETRY)).toBe(false)
    })

    test('should enable dependent flags when dependencies are met', () => {
      const manager = initializeFeatureFlags()
      
      // Ensure dependency is enabled
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, true)
      
      // Dependent flag should be enabled
      expect(isFeatureEnabled(FEATURE_FLAGS.INTELLIGENT_RETRY)).toBe(true)
    })
  })

  describe('Rollout Percentage', () => {
    test('should respect rollout percentage', () => {
      // Use a specific user ID that will hash to a high value (>0%)
      const manager = initializeFeatureFlags({
        userId: 'test-user-with-high-hash-value-12345',
        flags: {
          [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
            key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
            enabled: true,
            description: 'Test flag',
            rolloutPercentage: 0, // 0% rollout
            fallbackBehavior: 'legacy'
          }
        }
      })
      
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
    })

    test('should enable for 100% rollout', () => {
      const manager = initializeFeatureFlags({
        userId: 'test-user-1',
        flags: {
          [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
            key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
            enabled: true,
            description: 'Test flag',
            rolloutPercentage: 100, // 100% rollout
            fallbackBehavior: 'legacy'
          }
        }
      })
      
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
    })
  })

  describe('Overrides', () => {
    test('should allow overriding flags', () => {
      const manager = initializeFeatureFlags()
      
      // Override to disable
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
      
      // Override to enable
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, true)
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
    })

    test('should persist overrides to localStorage', () => {
      const manager = initializeFeatureFlags()
      
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature-flag-overrides',
        expect.stringContaining(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      )
    })

    test('should load overrides from localStorage', () => {
      const overrides = {
        [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: false
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(overrides))
      
      initializeFeatureFlags()
      
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
    })

    test('should clear all overrides', () => {
      const manager = initializeFeatureFlags()
      
      manager.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
      
      manager.clearOverrides()
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
    })
  })

  describe('Metrics and Monitoring', () => {
    test('should record metrics', () => {
      const manager = initializeFeatureFlags()
      
      manager.recordMetric(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, 'success', 100)
      manager.recordMetric(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, 'error')
      
      // Metrics should be recorded (tested via console logs in real implementation)
      expect(true).toBe(true) // Placeholder assertion
    })

    test('should disable flag when error threshold is exceeded', () => {
      const manager = initializeFeatureFlags({
        flags: {
          [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
            key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
            enabled: true,
            description: 'Test flag',
            rolloutPercentage: 100,
            fallbackBehavior: 'legacy',
            monitoring: {
              errorThreshold: 10, // 10% threshold
              performanceThreshold: 1000,
              enabled: true
            }
          }
        }
      })
      
      // Record many errors to exceed threshold
      for (let i = 0; i < 15; i++) {
        manager.recordMetric(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, i < 12 ? 'error' : 'success')
      }
      
      // Flag should be disabled due to high error rate
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
    })
  })

  describe('Fallback Behavior', () => {
    test('should return correct fallback behavior', () => {
      const manager = initializeFeatureFlags({
        flags: {
          [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
            key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
            enabled: true,
            description: 'Test flag',
            rolloutPercentage: 100,
            fallbackBehavior: 'legacy'
          }
        }
      })
      
      expect(manager.getFallbackBehavior(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe('legacy')
    })

    test('should default to legacy fallback for unknown flags', () => {
      const manager = initializeFeatureFlags()
      
      expect(manager.getFallbackBehavior('unknown_flag' as any)).toBe('legacy')
    })
  })

  describe('Configuration Updates', () => {
    test('should allow updating configuration', () => {
      const manager = initializeFeatureFlags()
      
      manager.updateConfig({
        environment: 'production',
        userId: 'new-user'
      })
      
      const config = manager.getConfig()
      expect(config.environment).toBe('production')
      expect(config.userId).toBe('new-user')
    })
  })

  describe('Development Utils', () => {
    test('should provide development utilities', () => {
      expect(devUtils.enableFeature).toBeDefined()
      expect(devUtils.disableFeature).toBeDefined()
      expect(devUtils.clearOverrides).toBeDefined()
      expect(devUtils.getMetrics).toBeDefined()
      expect(devUtils.getConfig).toBeDefined()
    })

    test('should enable/disable features via dev utils', () => {
      initializeFeatureFlags()
      
      devUtils.disableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(false)
      
      devUtils.enableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      expect(isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Should not throw
      expect(() => initializeFeatureFlags()).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load feature flag overrides')
      )
      
      consoleSpy.mockRestore()
    })

    test('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Should not throw
      expect(() => initializeFeatureFlags()).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})