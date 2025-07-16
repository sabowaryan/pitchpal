/**
 * Feature Flags System for Progressive Deployment
 * 
 * This system allows enabling/disabling new features progressively
 * with automatic fallback to legacy implementations.
 */

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  rolloutPercentage?: number
  dependencies?: string[]
  fallbackBehavior: 'legacy' | 'disabled' | 'error'
  monitoring?: {
    errorThreshold: number
    performanceThreshold: number
    enabled: boolean
  }
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>
  environment: 'development' | 'staging' | 'production'
  userId?: string
  sessionId: string
  version: string
}

// Available feature flags for pitch generator improvements
export const FEATURE_FLAGS = {
  // Enhanced error handling system
  ENHANCED_ERROR_HANDLING: 'enhanced_error_handling',
  
  // Intelligent retry system with backoff
  INTELLIGENT_RETRY: 'intelligent_retry',
  
  // Request cancellation functionality
  REQUEST_CANCELLATION: 'request_cancellation',
  
  // Real-time idea validation
  REAL_TIME_VALIDATION: 'real_time_validation',
  
  // User preferences persistence
  USER_PREFERENCES: 'user_preferences',
  
  // Pitch preview before redirect
  PITCH_PREVIEW: 'pitch_preview',
  
  // Performance optimizations
  PERFORMANCE_OPTIMIZATIONS: 'performance_optimizations',
  
  // Complete enhanced system
  FULL_ENHANCED_SYSTEM: 'full_enhanced_system'
} as const

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

// Default feature flag configuration
const DEFAULT_CONFIG: FeatureFlagConfig = {
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
      enabled: true,
      description: 'Enhanced error handling with classification and recovery strategies',
      rolloutPercentage: 100,
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 5, // 5% error rate threshold
        performanceThreshold: 2000, // 2s response time threshold
        enabled: true
      }
    },
    [FEATURE_FLAGS.INTELLIGENT_RETRY]: {
      key: FEATURE_FLAGS.INTELLIGENT_RETRY,
      enabled: true,
      description: 'Intelligent retry system with exponential backoff',
      rolloutPercentage: 100,
      dependencies: [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING],
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 10,
        performanceThreshold: 5000,
        enabled: true
      }
    },
    [FEATURE_FLAGS.REQUEST_CANCELLATION]: {
      key: FEATURE_FLAGS.REQUEST_CANCELLATION,
      enabled: true,
      description: 'Request cancellation with graceful cleanup',
      rolloutPercentage: 100,
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 2,
        performanceThreshold: 1000,
        enabled: true
      }
    },
    [FEATURE_FLAGS.REAL_TIME_VALIDATION]: {
      key: FEATURE_FLAGS.REAL_TIME_VALIDATION,
      enabled: true,
      description: 'Real-time idea validation with suggestions',
      rolloutPercentage: 100,
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 3,
        performanceThreshold: 500,
        enabled: true
      }
    },
    [FEATURE_FLAGS.USER_PREFERENCES]: {
      key: FEATURE_FLAGS.USER_PREFERENCES,
      enabled: true,
      description: 'User preferences persistence and history',
      rolloutPercentage: 100,
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 1,
        performanceThreshold: 200,
        enabled: true
      }
    },
    [FEATURE_FLAGS.PITCH_PREVIEW]: {
      key: FEATURE_FLAGS.PITCH_PREVIEW,
      enabled: true,
      description: 'Pitch preview before final redirect',
      rolloutPercentage: 100,
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 5,
        performanceThreshold: 1500,
        enabled: true
      }
    },
    [FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS]: {
      key: FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS,
      enabled: true,
      description: 'Performance optimizations (debouncing, memoization, lazy loading)',
      rolloutPercentage: 100,
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 2,
        performanceThreshold: 100,
        enabled: true
      }
    },
    [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
      key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
      enabled: true,
      description: 'Complete enhanced pitch generator system',
      rolloutPercentage: 100,
      dependencies: [
        FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
        FEATURE_FLAGS.INTELLIGENT_RETRY,
        FEATURE_FLAGS.REQUEST_CANCELLATION,
        FEATURE_FLAGS.REAL_TIME_VALIDATION,
        FEATURE_FLAGS.USER_PREFERENCES,
        FEATURE_FLAGS.PITCH_PREVIEW
      ],
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 3,
        performanceThreshold: 3000,
        enabled: true
      }
    }
  },
  environment: (process.env.NODE_ENV as any) || 'development',
  sessionId: '',
  version: '1.0.0'
}

// Feature flag manager class
class FeatureFlagManager {
  private config: FeatureFlagConfig
  private overrides: Record<string, boolean> = {}
  private metrics: Record<string, { errors: number; responseTime: number; uses: number }> = {}

  constructor(config?: Partial<FeatureFlagConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.loadOverrides()
    this.initializeMetrics()
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: FeatureFlagKey): boolean {
    // Check for local overrides first (for testing/debugging)
    if (this.overrides[flagKey] !== undefined) {
      return this.overrides[flagKey]
    }

    const flag = this.config.flags[flagKey]
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found, defaulting to false`)
      return false
    }

    // Check if flag is explicitly disabled
    if (!flag.enabled) {
      return false
    }

    // Check dependencies
    if (flag.dependencies) {
      const dependenciesMet = flag.dependencies.every(dep => this.isEnabled(dep as FeatureFlagKey))
      if (!dependenciesMet) {
        return false
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.config.userId || this.config.sessionId)
      return hash < flag.rolloutPercentage
    }

    // Check monitoring thresholds
    if (flag.monitoring?.enabled && this.shouldDisableForMonitoring(flagKey)) {
      console.warn(`Feature flag '${flagKey}' disabled due to monitoring thresholds`)
      return false
    }

    return true
  }

  /**
   * Get fallback behavior for a feature flag
   */
  getFallbackBehavior(flagKey: FeatureFlagKey): 'legacy' | 'disabled' | 'error' {
    const flag = this.config.flags[flagKey]
    return flag?.fallbackBehavior || 'legacy'
  }

  /**
   * Record metrics for monitoring
   */
  recordMetric(flagKey: FeatureFlagKey, type: 'error' | 'success', responseTime?: number) {
    if (!this.metrics[flagKey]) {
      this.metrics[flagKey] = { errors: 0, responseTime: 0, uses: 0 }
    }

    const metric = this.metrics[flagKey]
    metric.uses++

    if (type === 'error') {
      metric.errors++
    }

    if (responseTime !== undefined) {
      metric.responseTime = (metric.responseTime + responseTime) / 2 // Moving average
    }

    // Log metrics periodically
    if (metric.uses % 10 === 0) {
      this.logMetrics(flagKey)
    }
  }

  /**
   * Override a feature flag (for testing/debugging)
   */
  override(flagKey: FeatureFlagKey, enabled: boolean) {
    this.overrides[flagKey] = enabled
    this.saveOverrides()
  }

  /**
   * Clear all overrides
   */
  clearOverrides() {
    this.overrides = {}
    this.saveOverrides()
  }

  /**
   * Get current configuration
   */
  getConfig(): FeatureFlagConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<FeatureFlagConfig>) {
    this.config = { ...this.config, ...updates }
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100
  }

  private shouldDisableForMonitoring(flagKey: FeatureFlagKey): boolean {
    const flag = this.config.flags[flagKey]
    const metric = this.metrics[flagKey]

    if (!flag.monitoring?.enabled || !metric || metric.uses < 10) {
      return false
    }

    const errorRate = (metric.errors / metric.uses) * 100

    return (
      errorRate > flag.monitoring.errorThreshold ||
      metric.responseTime > flag.monitoring.performanceThreshold
    )
  }

  private loadOverrides() {
    try {
      const stored = localStorage.getItem('feature-flag-overrides')
      if (stored) {
        this.overrides = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load feature flag overrides:', error)
    }
  }

  private saveOverrides() {
    try {
      localStorage.setItem('feature-flag-overrides', JSON.stringify(this.overrides))
    } catch (error) {
      console.warn('Failed to save feature flag overrides:', error)
    }
  }

  private initializeMetrics() {
    Object.keys(this.config.flags).forEach(flagKey => {
      this.metrics[flagKey] = { errors: 0, responseTime: 0, uses: 0 }
    })
  }

  private logMetrics(flagKey: FeatureFlagKey) {
    const metric = this.metrics[flagKey]
    const errorRate = metric.uses > 0 ? (metric.errors / metric.uses) * 100 : 0

    console.log(`Feature Flag Metrics [${flagKey}]:`, {
      uses: metric.uses,
      errors: metric.errors,
      errorRate: `${errorRate.toFixed(2)}%`,
      avgResponseTime: `${metric.responseTime.toFixed(0)}ms`
    })
  }
}

// Global feature flag manager instance
let featureFlagManager: FeatureFlagManager

/**
 * Initialize the feature flag system
 */
export function initializeFeatureFlags(config?: Partial<FeatureFlagConfig>): FeatureFlagManager {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManager({
      ...config,
      sessionId: config?.sessionId || generateSessionId()
    })
  }
  return featureFlagManager
}

/**
 * Get the feature flag manager instance
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    return initializeFeatureFlags()
  }
  return featureFlagManager
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return getFeatureFlagManager().isEnabled(flagKey)
}

/**
 * Record a metric for monitoring
 */
export function recordFeatureMetric(flagKey: FeatureFlagKey, type: 'error' | 'success', responseTime?: number) {
  getFeatureFlagManager().recordMetric(flagKey, type, responseTime)
}

/**
 * Get fallback behavior for a feature
 */
export function getFeatureFallback(flagKey: FeatureFlagKey): 'legacy' | 'disabled' | 'error' {
  return getFeatureFlagManager().getFallbackBehavior(flagKey)
}

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Development utilities
export const devUtils = {
  enableFeature: (flagKey: FeatureFlagKey) => getFeatureFlagManager().override(flagKey, true),
  disableFeature: (flagKey: FeatureFlagKey) => getFeatureFlagManager().override(flagKey, false),
  clearOverrides: () => getFeatureFlagManager().clearOverrides(),
  getMetrics: () => getFeatureFlagManager()['metrics'],
  getConfig: () => getFeatureFlagManager().getConfig()
}

// Make dev utils available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).featureFlags = devUtils
}