import { NextRequest, NextResponse } from 'next/server'
import { globalErrorHandler } from '@/lib/error-handler'
import { pitchGenerationLimiter } from '@/lib/rate-limiter'

/**
 * System Health and Monitoring Endpoint
 * Provides error statistics, rate limiting status, and system health information
 */
export async function GET(request: NextRequest) {
  try {
    // Get error statistics
    const errorStats = globalErrorHandler.getErrorStatistics()
    const retryStats = globalErrorHandler.getRetryStatistics()
    
    // Get rate limiting information
    const rateLimitConfig = pitchGenerationLimiter.getConfig()
    
    // System health metrics
    const healthData = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Error statistics
      errors: {
        statistics: errorStats,
        totalErrors: Object.values(errorStats).reduce((sum, stat) => sum + stat.count, 0),
        recentErrors: globalErrorHandler.getErrorLogs().slice(-10).map(log => ({
          id: log.errorId,
          type: log.error.type,
          message: log.error.message,
          timestamp: log.timestamp,
          retryable: log.error.retryable
        }))
      },
      
      // Retry system statistics
      retries: retryStats,
      
      // Rate limiting configuration
      rateLimiting: {
        config: {
          windowMs: rateLimitConfig.windowMs,
          maxRequests: rateLimitConfig.maxRequests,
          windowMinutes: Math.floor(rateLimitConfig.windowMs / 60000)
        }
      },
      
      // System metrics
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    }

    // Check if system is healthy based on error rates
    const recentErrorCount = Object.values(errorStats).reduce((sum, stat) => {
      const isRecent = new Date(stat.lastOccurrence).getTime() > Date.now() - (5 * 60 * 1000) // Last 5 minutes
      return sum + (isRecent ? stat.count : 0)
    }, 0)

    if (recentErrorCount > 10) {
      healthData.status = 'degraded'
    }

    return NextResponse.json(healthData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: 'Health check failed'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}