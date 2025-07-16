/**
 * Basic Rate Limiting System
 * 
 * This module provides simple rate limiting functionality to prevent abuse
 * and protect the API from excessive requests.
 */

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Function to generate rate limit key
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number // Seconds to wait before next request
}

interface RateLimitEntry {
  count: number
  resetTime: Date
}

/**
 * Simple in-memory rate limiter
 * In production, this should use Redis or another distributed cache
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Get the current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config }
  }

  /**
   * Check if a request should be rate limited
   */
  checkLimit(request: Request): RateLimitResult {
    const key = this.config.keyGenerator ?
      this.config.keyGenerator(request) :
      this.getDefaultKey(request)

    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    let entry = this.store.get(key)

    // If no entry exists or it's expired, create a new one
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + this.config.windowMs)
      }
    }

    // Check if limit is exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      }
    }

    // Increment counter and store
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Get default key from request (IP address)
   */
  private getDefaultKey(request: Request): string {
    // Try to get real IP from headers (for proxied requests)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    if (realIp) {
      return realIp
    }

    // Fallback to a generic key if IP can't be determined
    return 'unknown'
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date()

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

/**
 * Default rate limiter configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // General API rate limiting
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  },

  // Pitch generation specific (more restrictive)
  PITCH_GENERATION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10 // 10 pitch generations per 5 minutes
  },

  // Strict rate limiting for suspicious activity
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5 // 5 requests per minute
  }
}

/**
 * Global rate limiter instances
 */
export const pitchGenerationLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.PITCH_GENERATION)
export const generalApiLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.API_GENERAL)