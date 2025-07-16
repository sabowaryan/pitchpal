/**
 * Feature Flag Monitoring and Analytics
 * 
 * This module provides monitoring capabilities for feature flags,
 * including error tracking, performance metrics, and automatic regression detection.
 */

import { FeatureFlagKey, getFeatureFlagManager } from './feature-flags'

export interface MonitoringEvent {
  flagKey: FeatureFlagKey
  eventType: 'error' | 'success' | 'performance' | 'usage'
  timestamp: Date
  data?: any
  userId?: string
  sessionId: string
  userAgent?: string
  url?: string
}

export interface PerformanceMetrics {
  responseTime: number
  memoryUsage?: number
  errorRate: number
  successRate: number
  totalUsage: number
}

export interface RegressionAlert {
  flagKey: FeatureFlagKey
  alertType: 'error_threshold' | 'performance_degradation' | 'usage_drop'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metrics: PerformanceMetrics
  timestamp: Date
}

class FeatureFlagMonitor {
  private events: MonitoringEvent[] = []
  private metrics: Map<FeatureFlagKey, PerformanceMetrics> = new Map()
  private alertCallbacks: ((alert: RegressionAlert) => void)[] = []
  private monitoringInterval?: NodeJS.Timeout

  constructor() {
    this.startMonitoring()
  }

  /**
   * Record a monitoring event
   */
  recordEvent(event: Omit<MonitoringEvent, 'timestamp' | 'sessionId' | 'userAgent' | 'url'>) {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.events.push(fullEvent)
    this.updateMetrics(fullEvent)
    this.checkForRegressions(event.flagKey)

    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * Get performance metrics for a feature flag
   */
  getMetrics(flagKey: FeatureFlagKey): PerformanceMetrics | undefined {
    return this.metrics.get(flagKey)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, PerformanceMetrics> {
    const result: Record<string, PerformanceMetrics> = {}
    this.metrics.forEach((metrics, flagKey) => {
      result[flagKey] = metrics
    })
    return result
  }

  /**
   * Subscribe to regression alerts
   */
  onAlert(callback: (alert: RegressionAlert) => void) {
    this.alertCallbacks.push(callback)
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get recent events for a feature flag
   */
  getRecentEvents(flagKey: FeatureFlagKey, limit = 50): MonitoringEvent[] {
    return this.events
      .filter(event => event.flagKey === flagKey)
      .slice(-limit)
      .reverse()
  }

  /**
   * Export monitoring data for analysis
   */
  exportData(): {
    events: MonitoringEvent[]
    metrics: Record<string, PerformanceMetrics>
    timestamp: Date
  } {
    return {
      events: [...this.events],
      metrics: this.getAllMetrics(),
      timestamp: new Date()
    }
  }

  /**
   * Clear monitoring data
   */
  clearData() {
    this.events = []
    this.metrics.clear()
  }

  private updateMetrics(event: MonitoringEvent) {
    const current = this.metrics.get(event.flagKey) || {
      responseTime: 0,
      errorRate: 0,
      successRate: 0,
      totalUsage: 0
    }

    current.totalUsage++

    if (event.eventType === 'error') {
      const errorCount = Math.floor(current.errorRate * (current.totalUsage - 1)) + 1
      current.errorRate = errorCount / current.totalUsage
    } else if (event.eventType === 'success') {
      const successCount = Math.floor(current.successRate * (current.totalUsage - 1)) + 1
      current.successRate = successCount / current.totalUsage
    }

    if (event.eventType === 'performance' && event.data?.responseTime) {
      // Moving average for response time
      current.responseTime = (current.responseTime + event.data.responseTime) / 2
    }

    if (event.data?.memoryUsage) {
      current.memoryUsage = event.data.memoryUsage
    }

    this.metrics.set(event.flagKey, current)
  }

  private checkForRegressions(flagKey: FeatureFlagKey) {
    const metrics = this.metrics.get(flagKey)
    if (!metrics || metrics.totalUsage < 10) {
      return // Need minimum data points
    }

    const manager = getFeatureFlagManager()
    const flagConfig = manager.getConfig().flags[flagKey]
    
    if (!flagConfig?.monitoring?.enabled) {
      return
    }

    const alerts: RegressionAlert[] = []

    // Check error rate threshold
    if (metrics.errorRate * 100 > flagConfig.monitoring.errorThreshold) {
      alerts.push({
        flagKey,
        alertType: 'error_threshold',
        severity: metrics.errorRate > 0.1 ? 'critical' : 'high',
        message: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${flagConfig.monitoring.errorThreshold}%)`,
        metrics,
        timestamp: new Date()
      })
    }

    // Check performance threshold
    if (metrics.responseTime > flagConfig.monitoring.performanceThreshold) {
      alerts.push({
        flagKey,
        alertType: 'performance_degradation',
        severity: metrics.responseTime > flagConfig.monitoring.performanceThreshold * 2 ? 'high' : 'medium',
        message: `Response time (${metrics.responseTime.toFixed(0)}ms) exceeds threshold (${flagConfig.monitoring.performanceThreshold}ms)`,
        metrics,
        timestamp: new Date()
      })
    }

    // Check for usage drops (potential issues)
    const recentEvents = this.getRecentEvents(flagKey, 20)
    const recentUsage = recentEvents.length
    if (recentUsage < 5 && metrics.totalUsage > 50) {
      alerts.push({
        flagKey,
        alertType: 'usage_drop',
        severity: 'medium',
        message: `Usage drop detected: only ${recentUsage} events in recent activity`,
        metrics,
        timestamp: new Date()
      })
    }

    // Trigger alerts
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert)
        } catch (error) {
          console.error('Error in alert callback:', error)
        }
      })
    })
  }

  private startMonitoring() {
    // Periodic monitoring check every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000)
  }

  private performHealthCheck() {
    // Check overall system health
    const allMetrics = this.getAllMetrics()
    const totalErrors = Object.values(allMetrics).reduce((sum, m) => sum + m.errorRate, 0)
    const avgErrorRate = totalErrors / Object.keys(allMetrics).length

    if (avgErrorRate > 0.05) { // 5% overall error rate
      console.warn('High overall error rate detected:', avgErrorRate)
    }

    // Log metrics summary
    if (process.env.NODE_ENV === 'development') {
      console.log('Feature Flag Health Check:', {
        totalFlags: Object.keys(allMetrics).length,
        avgErrorRate: `${(avgErrorRate * 100).toFixed(2)}%`,
        totalEvents: this.events.length
      })
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('feature-flag-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('feature-flag-session-id', sessionId)
    }
    return sessionId
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
  }
}

// Global monitor instance
let monitor: FeatureFlagMonitor

/**
 * Get the feature flag monitor instance
 */
export function getFeatureFlagMonitor(): FeatureFlagMonitor {
  if (!monitor) {
    monitor = new FeatureFlagMonitor()
  }
  return monitor
}

/**
 * Record a monitoring event
 */
export function recordMonitoringEvent(
  flagKey: FeatureFlagKey,
  eventType: 'error' | 'success' | 'performance' | 'usage',
  data?: any,
  userId?: string
) {
  getFeatureFlagMonitor().recordEvent({
    flagKey,
    eventType,
    data,
    userId
  })
}

/**
 * Performance tracking decorator
 */
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  flagKey: FeatureFlagKey,
  fn: T
): T {
  return ((...args: any[]) => {
    const startTime = performance.now()
    
    try {
      const result = fn(...args)
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            const endTime = performance.now()
            recordMonitoringEvent(flagKey, 'performance', { responseTime: endTime - startTime })
            recordMonitoringEvent(flagKey, 'success')
            return value
          })
          .catch(error => {
            const endTime = performance.now()
            recordMonitoringEvent(flagKey, 'performance', { responseTime: endTime - startTime })
            recordMonitoringEvent(flagKey, 'error', { error: error.message })
            throw error
          })
      } else {
        const endTime = performance.now()
        recordMonitoringEvent(flagKey, 'performance', { responseTime: endTime - startTime })
        recordMonitoringEvent(flagKey, 'success')
        return result
      }
    } catch (error) {
      const endTime = performance.now()
      recordMonitoringEvent(flagKey, 'performance', { responseTime: endTime - startTime })
      recordMonitoringEvent(flagKey, 'error', { error: (error as Error).message })
      throw error
    }
  }) as T
}

/**
 * React hook for monitoring integration
 */
export function useFeatureFlagMonitoring(flagKey: FeatureFlagKey) {
  const monitor = getFeatureFlagMonitor()
  
  return {
    recordEvent: (eventType: 'error' | 'success' | 'performance' | 'usage', data?: any) => {
      recordMonitoringEvent(flagKey, eventType, data)
    },
    getMetrics: () => monitor.getMetrics(flagKey),
    getRecentEvents: (limit?: number) => monitor.getRecentEvents(flagKey, limit)
  }
}

// Development utilities
export const monitoringDevUtils = {
  getMonitor: () => getFeatureFlagMonitor(),
  exportData: () => getFeatureFlagMonitor().exportData(),
  clearData: () => getFeatureFlagMonitor().clearData(),
  getAllMetrics: () => getFeatureFlagMonitor().getAllMetrics()
}

// Make monitoring utils available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).featureFlagMonitoring = monitoringDevUtils
}