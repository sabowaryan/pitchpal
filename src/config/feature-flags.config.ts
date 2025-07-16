/**
 * Feature Flags Configuration
 * 
 * This file contains the configuration for all feature flags.
 * Modify this file to enable/disable features or adjust rollout percentages.
 */

import { FeatureFlagConfig, FEATURE_FLAGS } from '@/lib/feature-flags'

// Environment-specific configurations
const developmentConfig: Partial<FeatureFlagConfig> = {
  environment: 'development',
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
      enabled: true,
      description: 'Enhanced error handling with classification and recovery strategies',
      rolloutPercentage: 100,
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 10, // More lenient in development
        performanceThreshold: 3000,
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
        errorThreshold: 15,
        performanceThreshold: 6000,
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
        errorThreshold: 5,
        performanceThreshold: 2000,
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
        errorThreshold: 8,
        performanceThreshold: 1000,
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
        errorThreshold: 3,
        performanceThreshold: 500,
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
        errorThreshold: 10,
        performanceThreshold: 2500,
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
        errorThreshold: 5,
        performanceThreshold: 200,
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
        errorThreshold: 8,
        performanceThreshold: 4000,
        enabled: true
      }
    }
  }
}

const stagingConfig: Partial<FeatureFlagConfig> = {
  environment: 'staging',
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
      enabled: true,
      description: 'Enhanced error handling with classification and recovery strategies',
      rolloutPercentage: 100,
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 5,
        performanceThreshold: 2000,
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
  }
}

const productionConfig: Partial<FeatureFlagConfig> = {
  environment: 'production',
  flags: {
    // Start with conservative rollout in production
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
      enabled: true,
      description: 'Enhanced error handling with classification and recovery strategies',
      rolloutPercentage: 25, // Start with 25% rollout
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 3, // Strict thresholds in production
        performanceThreshold: 1500,
        enabled: true
      }
    },
    [FEATURE_FLAGS.INTELLIGENT_RETRY]: {
      key: FEATURE_FLAGS.INTELLIGENT_RETRY,
      enabled: true,
      description: 'Intelligent retry system with exponential backoff',
      rolloutPercentage: 25,
      dependencies: [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING],
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 5,
        performanceThreshold: 3000,
        enabled: true
      }
    },
    [FEATURE_FLAGS.REQUEST_CANCELLATION]: {
      key: FEATURE_FLAGS.REQUEST_CANCELLATION,
      enabled: true,
      description: 'Request cancellation with graceful cleanup',
      rolloutPercentage: 50, // Less risky feature, higher rollout
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 1,
        performanceThreshold: 800,
        enabled: true
      }
    },
    [FEATURE_FLAGS.REAL_TIME_VALIDATION]: {
      key: FEATURE_FLAGS.REAL_TIME_VALIDATION,
      enabled: true,
      description: 'Real-time idea validation with suggestions',
      rolloutPercentage: 50,
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 2,
        performanceThreshold: 300,
        enabled: true
      }
    },
    [FEATURE_FLAGS.USER_PREFERENCES]: {
      key: FEATURE_FLAGS.USER_PREFERENCES,
      enabled: true,
      description: 'User preferences persistence and history',
      rolloutPercentage: 75, // Low risk feature
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 0.5,
        performanceThreshold: 150,
        enabled: true
      }
    },
    [FEATURE_FLAGS.PITCH_PREVIEW]: {
      key: FEATURE_FLAGS.PITCH_PREVIEW,
      enabled: true,
      description: 'Pitch preview before final redirect',
      rolloutPercentage: 25, // UI-heavy feature, conservative rollout
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 3,
        performanceThreshold: 1200,
        enabled: true
      }
    },
    [FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS]: {
      key: FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS,
      enabled: true,
      description: 'Performance optimizations (debouncing, memoization, lazy loading)',
      rolloutPercentage: 75, // Performance improvements, higher rollout
      fallbackBehavior: 'disabled',
      monitoring: {
        errorThreshold: 1,
        performanceThreshold: 80,
        enabled: true
      }
    },
    [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
      key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
      enabled: true,
      description: 'Complete enhanced pitch generator system',
      rolloutPercentage: 10, // Very conservative for full system
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
        errorThreshold: 2,
        performanceThreshold: 2500,
        enabled: true
      }
    }
  }
}

/**
 * Get configuration based on environment
 */
export function getFeatureFlagConfig(): Partial<FeatureFlagConfig> {
  const env = process.env.NODE_ENV || 'development'
  const customEnv = process.env.CUSTOM_ENV // For staging and other custom environments

  // Check for custom environment first (like staging)
  if (customEnv === 'staging') {
    return stagingConfig
  }

  switch (env) {
    case 'production':
      return productionConfig
    case 'development':
    case 'test':
    default:
      return developmentConfig
  }
}

/**
 * Configuration presets for different deployment phases
 */
export const deploymentPhases = {
  // Phase 1: Initial canary deployment (5-10%)
  canary: {
    rolloutPercentage: 10,
    monitoring: {
      errorThreshold: 1,
      performanceThreshold: 1000,
      enabled: true
    }
  },

  // Phase 2: Limited rollout (25-30%)
  limited: {
    rolloutPercentage: 25,
    monitoring: {
      errorThreshold: 2,
      performanceThreshold: 1500,
      enabled: true
    }
  },

  // Phase 3: Expanded rollout (50-60%)
  expanded: {
    rolloutPercentage: 50,
    monitoring: {
      errorThreshold: 3,
      performanceThreshold: 2000,
      enabled: true
    }
  },

  // Phase 4: Wide rollout (75-80%)
  wide: {
    rolloutPercentage: 75,
    monitoring: {
      errorThreshold: 4,
      performanceThreshold: 2500,
      enabled: true
    }
  },

  // Phase 5: Full rollout (100%)
  full: {
    rolloutPercentage: 100,
    monitoring: {
      errorThreshold: 5,
      performanceThreshold: 3000,
      enabled: true
    }
  }
}

/**
 * Apply a deployment phase to all flags
 */
export function applyDeploymentPhase(
  phase: keyof typeof deploymentPhases,
  flags: string[] = Object.values(FEATURE_FLAGS)
): Partial<FeatureFlagConfig> {
  const config = getFeatureFlagConfig()
  const phaseConfig = deploymentPhases[phase]

  if (config.flags) {
    flags.forEach(flagKey => {
      if (config.flags![flagKey]) {
        config.flags![flagKey] = {
          ...config.flags![flagKey],
          rolloutPercentage: phaseConfig.rolloutPercentage,
          monitoring: {
            ...config.flags![flagKey].monitoring,
            ...phaseConfig.monitoring
          }
        }
      }
    })
  }

  return config
}

/**
 * Emergency rollback configuration (disables all enhanced features)
 */
export const emergencyRollbackConfig: Partial<FeatureFlagConfig> = {
  flags: Object.values(FEATURE_FLAGS).reduce((acc, flagKey) => {
    acc[flagKey] = {
      key: flagKey,
      enabled: false,
      description: 'Emergency rollback - feature disabled',
      rolloutPercentage: 0,
      fallbackBehavior: 'legacy',
      monitoring: {
        errorThreshold: 0,
        performanceThreshold: 0,
        enabled: false
      }
    }
    return acc
  }, {} as any)
}