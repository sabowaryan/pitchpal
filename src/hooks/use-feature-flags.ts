/**
 * React hooks for feature flags integration
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  FeatureFlagKey,
  isFeatureEnabled,
  recordFeatureMetric,
  getFeatureFallback,
  getFeatureFlagManager,
  initializeFeatureFlags
} from '@/lib/feature-flags'

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(flagKey: FeatureFlagKey) {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flagKey))

  useEffect(() => {
    // Re-check flag status (useful for dynamic updates)
    setEnabled(isFeatureEnabled(flagKey))
  }, [flagKey])

  const recordMetric = useCallback((type: 'error' | 'success', responseTime?: number) => {
    recordFeatureMetric(flagKey, type, responseTime)
  }, [flagKey])

  const fallbackBehavior = useMemo(() => getFeatureFallback(flagKey), [flagKey])

  return {
    enabled,
    recordMetric,
    fallbackBehavior
  }
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(flagKeys: FeatureFlagKey[]) {
  // Memoize the flag keys to prevent unnecessary re-renders
  const memoizedFlagKeys = useMemo(() => flagKeys, [flagKeys.join(',')])

  // Use useMemo to compute flags instead of useState + useEffect to avoid infinite loops
  const flags = useMemo(() =>
    memoizedFlagKeys.reduce((acc, key) => {
      acc[key] = isFeatureEnabled(key)
      return acc
    }, {} as Record<FeatureFlagKey, boolean>)
    , [memoizedFlagKeys])

  const recordMetric = useCallback((flagKey: FeatureFlagKey, type: 'error' | 'success', responseTime?: number) => {
    recordFeatureMetric(flagKey, type, responseTime)
  }, [])

  return {
    flags,
    recordMetric,
    isEnabled: (flagKey: FeatureFlagKey) => flags[flagKey] || false
  }
}

/**
 * Hook for conditional rendering based on feature flags
 */
export function useConditionalFeature<T>(
  flagKey: FeatureFlagKey,
  enhancedComponent: () => T,
  fallbackComponent?: () => T,
  onError?: (error: Error) => void
) {
  const { enabled, recordMetric, fallbackBehavior } = useFeatureFlag(flagKey)

  const renderComponent = useCallback(() => {
    if (!enabled) {
      if (fallbackBehavior === 'error') {
        const error = new Error(`Feature ${flagKey} is disabled`)
        onError?.(error)
        throw error
      }

      if (fallbackBehavior === 'disabled' || !fallbackComponent) {
        return null
      }

      // fallbackBehavior === 'legacy'
      return fallbackComponent()
    }

    try {
      const startTime = performance.now()
      const result = enhancedComponent()
      const endTime = performance.now()

      recordMetric('success', endTime - startTime)
      return result
    } catch (error) {
      recordMetric('error')

      if (fallbackComponent && fallbackBehavior === 'legacy') {
        console.warn(`Feature ${flagKey} failed, falling back to legacy:`, error)
        return fallbackComponent()
      }

      onError?.(error as Error)
      throw error
    }
  }, [enabled, enhancedComponent, fallbackComponent, fallbackBehavior, flagKey, recordMetric, onError])

  return {
    enabled,
    renderComponent,
    recordMetric
  }
}

/**
 * Hook for progressive feature rollout with A/B testing
 */
export function useProgressiveFeature(
  flagKey: FeatureFlagKey,
  options: {
    onEnabled?: () => void
    onDisabled?: () => void
    trackingId?: string
  } = {}
) {
  const { enabled, recordMetric } = useFeatureFlag(flagKey)
  const [hasTracked, setHasTracked] = useState(false)

  useEffect(() => {
    if (!hasTracked) {
      if (enabled) {
        options.onEnabled?.()
      } else {
        options.onDisabled?.()
      }
      setHasTracked(true)
    }
  }, [enabled, hasTracked, options])

  const trackEvent = useCallback((eventType: 'interaction' | 'conversion' | 'error', data?: any) => {
    recordMetric(eventType === 'error' ? 'error' : 'success')

    // Additional tracking logic could go here
    if (options.trackingId) {
      console.log(`Feature ${flagKey} event:`, {
        trackingId: options.trackingId,
        eventType,
        enabled,
        data
      })
    }
  }, [flagKey, enabled, recordMetric, options.trackingId])

  return {
    enabled,
    trackEvent,
    recordMetric
  }
}

/**
 * Hook to initialize feature flags system
 */
export function useFeatureFlagInit(userId?: string) {
  useEffect(() => {
    initializeFeatureFlags({
      userId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    })
  }, [userId])

  const manager = getFeatureFlagManager()

  return {
    override: manager.override.bind(manager),
    clearOverrides: manager.clearOverrides.bind(manager),
    getConfig: manager.getConfig.bind(manager)
  }
}

/**
 * Higher-order component for feature flag conditional rendering
 */
export function withFeatureFlag<P extends object>(
  flagKey: FeatureFlagKey,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlagWrapper(props: P) {
    const { enabled, recordMetric, fallbackBehavior } = useFeatureFlag(flagKey)

    if (!enabled) {
      if (fallbackBehavior === 'disabled' || !FallbackComponent) {
        return null
      }
      return React.createElement(FallbackComponent, props)
    }

    try {
      recordMetric('success')
      return React.createElement(Component, props)
    } catch (error) {
      recordMetric('error')

      if (FallbackComponent && fallbackBehavior === 'legacy') {
        console.warn(`Feature ${flagKey} component failed, falling back:`, error)
        return React.createElement(FallbackComponent, props)
      }

      throw error
    }
  }
}