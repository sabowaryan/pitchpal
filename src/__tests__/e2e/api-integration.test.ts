/**
 * API Integration Tests
 * Tests all API endpoints with various scenarios
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/generate-pitch/route'
import healthHandler from '@/app/api/system-health/route'
import errorLogHandler from '@/app/api/log-error/route'

// Mock AI service
jest.mock('@/lib/ai/pitch-generator', () => ({
  generatePitch: jest.fn(),
}))

import { generatePitch } from '@/lib/ai/pitch-generator'
const mockGeneratePitch = generatePitch as jest.MockedFunction<typeof generatePitch>

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/generate-pitch', () => {
    it('should generate pitch successfully with valid input', async () => {
      const mockPitch = {
        id: 'test-pitch-1',
        title: 'AI Customer Support Platform',
        problem: 'Businesses struggle with 24/7 customer support',
        solution: 'AI-powered automated support system',
        market: 'Global customer service market worth $350B',
        competition: 'Traditional helpdesk solutions',
        businessModel: 'SaaS subscription with tiered pricing',
        team: 'Experienced team with AI and customer service background',
        financials: 'Projected $2M ARR by year 2',
        ask: 'Seeking $1M Series A funding'
      }

      mockGeneratePitch.mockResolvedValueOnce(mockPitch)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: 'Une plateforme IA pour automatiser le support client',
          tone: 'professional'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.pitch).toEqual(mockPitch)
    })

    it('should handle validation errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: '', // Empty idea
          tone: 'professional'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Idea is required')
    })

    it('should handle AI service errors', async () => {
      mockGeneratePitch.mockRejectedValueOnce(new Error('AI service unavailable'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: 'Test idea',
          tone: 'professional'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('AI service')
    })

    it('should handle rate limiting', async () => {
      // Simulate multiple rapid requests
      const requests = Array.from({ length: 10 }, () => 
        createMocks({
          method: 'POST',
          body: {
            idea: 'Test rate limiting',
            tone: 'professional'
          },
          headers: {
            'x-forwarded-for': '192.168.1.1'
          }
        })
      )

      mockGeneratePitch.mockResolvedValue({
        id: 'test',
        title: 'Test',
        problem: 'Test',
        solution: 'Test',
        market: 'Test',
        competition: 'Test',
        businessModel: 'Test',
        team: 'Test',
        financials: 'Test',
        ask: 'Test'
      })

      const responses = await Promise.all(
        requests.map(({ req, res }) => handler(req, res).then(() => res._getStatusCode()))
      )

      // Some requests should be rate limited (429)
      expect(responses.some(status => status === 429)).toBe(true)
    })

    it('should handle malformed JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'invalid json',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Method not allowed')
    })
  })

  describe('/api/system-health', () => {
    it('should return system health status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await healthHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.status).toBe('healthy')
      expect(data.timestamp).toBeDefined()
      expect(data.services).toBeDefined()
    })

    it('should detect unhealthy services', async () => {
      // Mock AI service failure
      mockGeneratePitch.mockRejectedValueOnce(new Error('Service down'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await healthHandler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.services.ai).toBe('unhealthy')
    })
  })

  describe('/api/log-error', () => {
    it('should log client errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          error: {
            message: 'Client error',
            stack: 'Error stack trace',
            type: 'network'
          },
          context: {
            url: '/generate',
            userAgent: 'Test browser',
            timestamp: new Date().toISOString()
          }
        },
      })

      await errorLogHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client Error:'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })

    it('should validate error log format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          error: {}
        },
      })

      await errorLogHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Invalid error format')
    })
  })

  describe('API Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Simulate database connection failure
      const originalEnv = process.env.DATABASE_URL
      delete process.env.DATABASE_URL

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: 'Test database error',
          tone: 'professional'
        },
      })

      await handler(req, res)

      // Should handle gracefully
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(500)

      // Restore environment
      if (originalEnv) {
        process.env.DATABASE_URL = originalEnv
      }
    })

    it('should handle timeout scenarios', async () => {
      // Mock slow AI service
      mockGeneratePitch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
      )

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: 'Test timeout',
          tone: 'professional'
        },
      })

      const startTime = Date.now()
      await handler(req, res)
      const duration = Date.now() - startTime

      // Should timeout before 35 seconds
      expect(duration).toBeLessThan(35000)
      expect(res._getStatusCode()).toBe(408) // Request Timeout
    })
  })

  describe('API Security', () => {
    it('should sanitize input data', async () => {
      const maliciousInput = '<script>alert("xss")</script>'
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: maliciousInput,
          tone: 'professional'
        },
      })

      await handler(req, res)

      // Should not execute malicious code
      expect(mockGeneratePitch).toHaveBeenCalledWith(
        expect.not.stringContaining('<script>'),
        'professional'
      )
    })

    it('should limit request size', async () => {
      const largeInput = 'A'.repeat(10000) // Very large input

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: largeInput,
          tone: 'professional'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(413) // Payload Too Large
    })

    it('should validate content type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'text/plain'
        },
        body: 'plain text body',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(415) // Unsupported Media Type
    })
  })

  describe('API Performance', () => {
    it('should respond within acceptable time limits', async () => {
      mockGeneratePitch.mockResolvedValueOnce({
        id: 'perf-test',
        title: 'Performance Test',
        problem: 'Test',
        solution: 'Test',
        market: 'Test',
        competition: 'Test',
        businessModel: 'Test',
        team: 'Test',
        financials: 'Test',
        ask: 'Test'
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          idea: 'Performance test idea',
          tone: 'professional'
        },
      })

      const startTime = Date.now()
      await handler(req, res)
      const duration = Date.now() - startTime

      // Should respond within 5 seconds under normal conditions
      expect(duration).toBeLessThan(5000)
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle concurrent requests efficiently', async () => {
      mockGeneratePitch.mockResolvedValue({
        id: 'concurrent-test',
        title: 'Concurrent Test',
        problem: 'Test',
        solution: 'Test',
        market: 'Test',
        competition: 'Test',
        businessModel: 'Test',
        team: 'Test',
        financials: 'Test',
        ask: 'Test'
      })

      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        createMocks({
          method: 'POST',
          body: {
            idea: `Concurrent test idea ${i}`,
            tone: 'professional'
          },
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(
        concurrentRequests.map(({ req, res }) => 
          handler(req, res).then(() => res._getStatusCode())
        )
      )
      const duration = Date.now() - startTime

      // All requests should succeed
      responses.forEach(status => {
        expect(status).toBe(200)
      })

      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(10000)
    })
  })
})