/**
 * Tests for Feature Flag React Hooks
 */

import { renderHook, act } from '@testing-library/react'
import { 
  useFeatureFlag, 
  useFeatureFlags, 
  useConditionalFeature,
  useProgressiveFeature,
  useFeatureFlagInit
} from '../use-feature-flags'
import { FEATURE_FLAGS, initializeFeatureFlags, devUtils } from '@/lib/feature-flags'

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

describe('Feature Flag Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)
    devUtils.clearOverrides()
    
    // Initialize with test configuration
    initializeFeatureFlags({
      environment: 'development', // Changed from 'test' to an allowed value
      sessionId: 'test-session'
    })
  })

  describe('useFeatureFlag', () => {
    test('should return flag status and utilities', () => {
      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      )
      
      expect(result.current.enabled).toBe(true)
      expect(result.current.recordMetric).toBeDefined()
      expect(result.current.fallbackBehavior).toBe('legacy')
    })

    test('should update when flag status changes', () => {
      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      )
      
      expect(result.current.enabled).toBe(true)
      
      act(() => {
        devUtils.disableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      })
      
      // Re-render to trigger useEffect
      const { result: newResult } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      )
      
      expect(newResult.current.enabled).toBe(false)
    })

    test('should record metrics', () => {
      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      )
      
      act(() => {
        result.current.recordMetric('success', 100)
      })
      
      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('useFeatureFlags', () => {
    test('should return multiple flag statuses', () => {
      const flags = [
        FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
        FEATURE_FLAGS.REAL_TIME_VALIDATION
      ]
      
      const { result } = renderHook(() => useFeatureFlags(flags))
      
      expect(result.current.flags[FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]).toBe(true)
      expect(result.current.flags[FEATURE_FLAGS.REAL_TIME_VALIDATION]).toBe(true)
      expect(result.current.isEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)).toBe(true)
      expect(result.current.recordMetric).toBeDefined()
    })

    test('should update when any flag changes', () => {
      const flags = [
        FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
        FEATURE_FLAGS.REAL_TIME_VALIDATION
      ]
      
      const { result } = renderHook(() => useFeatureFlags(flags))
      
      expect(result.current.flags[FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]).toBe(true)
      
      act(() => {
        devUtils.disableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      })
      
      // Re-render to trigger useEffect
      const { result: newResult } = renderHook(() => useFeatureFlags(flags))
      
      expect(newResult.current.flags[FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]).toBe(false)
      expect(newResult.current.flags[FEATURE_FLAGS.REAL_TIME_VALIDATION]).toBe(true)
    })
  })

  describe('useConditionalFeature', () => {
    test('should render enhanced component when flag is enabled', () => {
      const enhancedComponent = jest.fn(() => 'enhanced')
      const fallbackComponent = jest.fn(() => 'fallback')
      
      const { result } = renderHook(() => 
        useConditionalFeature(
          FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
          enhancedComponent,
          fallbackComponent
        )
      )
      
      expect(result.current.enabled).toBe(true)
      
      const rendered = result.current.renderComponent()
      expect(rendered).toBe('enhanced')
      expect(enhancedComponent).toHaveBeenCalled()
      expect(fallbackComponent).not.toHaveBeenCalled()
    })

    test('should render fallback component when flag is disabled', () => {
      const enhancedComponent = jest.fn(() => 'enhanced')
      const fallbackComponent = jest.fn(() => 'fallback')
      
      // Disable the flag
      devUtils.disableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      
      const { result } = renderHook(() => 
        useConditionalFeature(
          FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
          enhancedComponent,
          fallbackComponent
        )
      )
      
      expect(result.current.enabled).toBe(false)
      
      const rendered = result.current.renderComponent()
      expect(rendered).toBe('fallback')
      expect(enhancedComponent).not.toHaveBeenCalled()
      expect(fallbackComponent).toHaveBeenCalled()
    })

    test('should return null when flag is disabled and no fallback', () => {
      const enhancedComponent = jest.fn(() => 'enhanced')
      
      // Disable the flag
      devUtils.disableFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)
      
      const { result } = renderHook(() => 
        useConditionalFeature(
          FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
          enhancedComponent
        )
      )
      
      const rendered = result.current.renderComponent()
      expect(rendered).toBeNull()
      expect(enhancedComponent).not.toHaveBeenCalled()
    })

    test('should handle errors and fallback', () => {
      const enhancedComponent = jest.fn(() => {
        throw new Error('Component error')
      })
      const fallbackComponent = jest.fn(() => 'fallback')
      const onError = jest.fn()
      
      const { result } = renderHook(() => 
        useConditionalFeature(
          FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
          enhancedComponent,
          fallbackComponent,
          onError
        )
      )
      
      expect(() => result.current.renderComponent()).toThrow('Component error')
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('useProgressiveFeature', () => {
    test('should track feature usage', () => {
      const onEnabled = jest.fn()
      const onDisabled = jest.fn()
      
      const { result } = renderHook(() => 
        useProgressiveFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, {
          onEnabled,
          onDisabled,
          trackingId: 'test-tracking'
        })
      )
      
      expect(result.current.enabled).toBe(true)
      expect(onEnabled).toHaveBeenCalled()
      expect(onDisabled).not.toHaveBeenCalled()
    })

    test('should track events', () => {
      const { result } = renderHook(() => 
        useProgressiveFeature(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, {
          trackingId: 'test-tracking'
        })
      )
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      act(() => {
        result.current.trackEvent('interaction', { action: 'click' })
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Feature'),
        expect.objectContaining({
          trackingId: 'test-tracking',
          eventType: 'interaction',
          enabled: true
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('useFeatureFlagInit', () => {
    test('should initialize feature flags with user ID', () => {
      const { result } = renderHook(() => 
        useFeatureFlagInit('test-user-123')
      )
      
      expect(result.current.override).toBeDefined()
      expect(result.current.clearOverrides).toBeDefined()
      expect(result.current.getConfig).toBeDefined()
    })

    test('should provide manager utilities', () => {
      const { result } = renderHook(() => 
        useFeatureFlagInit('test-user-123')
      )
      
      act(() => {
        result.current.override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)
      })
      
      const config = result.current.getConfig()
      expect(config).toBeDefined()
      expect(config.userId).toBe('test-user-123')
    })
  })

  describe('Error Handling', () => {
    test('should handle hook errors gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // This should not throw even with invalid flag
      const { result } = renderHook(() => 
        useFeatureFlag('invalid_flag' as any)
      )
      
      expect(result.current.enabled).toBe(false)
      
      consoleErrorSpy.mockRestore()
    })
  })
})