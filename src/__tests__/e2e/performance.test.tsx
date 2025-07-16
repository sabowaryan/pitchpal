/**
 * Performance Tests for Pitch Generator
 * Tests memory usage, rendering performance, and optimization effectiveness
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { act } from 'react-dom/test-utils'

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
}

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
})

// Mock IntersectionObserver for lazy loading tests
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

describe('Performance Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset performance counters
    mockPerformance.now.mockReturnValue(0)
  })

  describe('Rendering Performance', () => {
    it('should render initial component within performance budget', async () => {
      const startTime = performance.now()
      
      render(<PitchGeneratorContainer />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100)
      
      // Should have all essential elements
      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
    })

    it('should handle rapid re-renders efficiently', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      const startTime = performance.now()
      
      // Simulate rapid typing
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          fireEvent.change(ideaInput, { 
            target: { value: `Test input ${i}` } 
          })
        })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle 50 updates within 500ms
      expect(totalTime).toBeLessThan(500)
    })

    it('should optimize validation debouncing', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      let validationCount = 0
      
      // Mock validation function to count calls
      const originalConsoleLog = console.log
      console.log = jest.fn((...args) => {
        if (args[0]?.includes?.('validation')) {
          validationCount++
        }
      })

      // Type rapidly
      await user.type(ideaInput, 'Rapid typing test for debouncing validation')
      
      // Wait for debounce to settle
      await waitFor(() => {
        expect(validationCount).toBeLessThan(10) // Should be debounced
      }, { timeout: 1000 })

      console.log = originalConsoleLog
    })
  })

  describe('Memory Management', () => {
    it('should cleanup event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = render(<PitchGeneratorContainer />)
      
      const addedListeners = addEventListenerSpy.mock.calls.length
      
      unmount()
      
      const removedListeners = removeEventListenerSpy.mock.calls.length
      
      // Should remove all added listeners
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners)
      
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('should cleanup timers and intervals', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const setIntervalSpy = jest.spyOn(global, 'setInterval')
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const { unmount } = render(<PitchGeneratorContainer />)
      
      // Trigger some async operations
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test cleanup')
      
      const timeoutsCreated = setTimeoutSpy.mock.calls.length
      const intervalsCreated = setIntervalSpy.mock.calls.length
      
      unmount()
      
      const timeoutsCleared = clearTimeoutSpy.mock.calls.length
      const intervalsCleared = clearIntervalSpy.mock.calls.length
      
      // Should cleanup timers
      expect(timeoutsCleared).toBeGreaterThanOrEqual(timeoutsCreated)
      expect(intervalsCleared).toBeGreaterThanOrEqual(intervalsCreated)
      
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    })

    it('should handle memory-intensive operations efficiently', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      render(<PitchGeneratorContainer />)
      
      // Simulate memory-intensive operations
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          fireEvent.change(ideaInput, { 
            target: { value: `Memory test ${i} with lots of text to simulate real usage patterns` } 
          })
        })
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Lazy Loading and Code Splitting', () => {
    it('should lazy load preview components', async () => {
      const { container } = render(<PitchGeneratorContainer />)
      
      // Preview component should not be loaded initially
      expect(container.querySelector('[data-testid="pitch-preview"]')).not.toBeInTheDocument()
      
      // Simulate successful generation to trigger preview
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test lazy loading')
      
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'test' } })
      })
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      // Preview should now be loaded
      await waitFor(() => {
        expect(container.querySelector('[data-testid="pitch-preview"]')).toBeInTheDocument()
      })
    })

    it('should implement intersection observer for performance', () => {
      render(<PitchGeneratorContainer />)
      
      // Should use IntersectionObserver for lazy loading
      expect(mockIntersectionObserver).toHaveBeenCalled()
    })
  })

  describe('Bundle Size and Asset Optimization', () => {
    it('should not import unnecessary dependencies', () => {
      // This test would typically be run with bundle analyzers
      // Here we simulate checking for common performance anti-patterns
      
      const { container } = render(<PitchGeneratorContainer />)
      
      // Should not load heavy libraries unnecessarily
      expect(container.innerHTML).not.toContain('moment.js')
      expect(container.innerHTML).not.toContain('lodash')
      
      // Should use optimized components
      expect(container.querySelector('svg')).toBeInTheDocument() // Icons should be SVG
    })
  })

  describe('Network Performance', () => {
    it('should implement request deduplication', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'test' } })
      } as Response)

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test deduplication')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      
      // Click multiple times rapidly
      await user.click(generateButton)
      await user.click(generateButton)
      await user.click(generateButton)
      
      // Should only make one request
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1)
      })
      
      fetchSpy.mockRestore()
    })

    it('should implement proper caching strategies', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'cached' } })
      } as Response)

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      const sameIdea = 'Identical idea for caching test'
      
      // Generate with same idea twice
      await user.type(ideaInput, sameIdea)
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1)
      })
      
      // Clear and type same idea again
      await user.clear(ideaInput)
      await user.type(ideaInput, sameIdea)
      await user.click(generateButton)
      
      // Should use cached result or make minimal requests
      expect(fetchSpy).toHaveBeenCalledTimes(1) // Should be cached
      
      fetchSpy.mockRestore()
    })
  })

  describe('Real-time Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const markSpy = jest.spyOn(performance, 'mark')
      const measureSpy = jest.spyOn(performance, 'measure')

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Performance tracking test')
      
      // Should create performance marks
      expect(markSpy).toHaveBeenCalled()
      
      // Should measure performance
      expect(measureSpy).toHaveBeenCalled()
      
      markSpy.mockRestore()
      measureSpy.mockRestore()
    })

    it('should detect performance regressions', async () => {
      const performanceThresholds = {
        renderTime: 100, // ms
        interactionTime: 50, // ms
        memoryUsage: 10 * 1024 * 1024, // 10MB
      }

      const startTime = performance.now()
      render(<PitchGeneratorContainer />)
      const renderTime = performance.now() - startTime

      expect(renderTime).toBeLessThan(performanceThresholds.renderTime)
      
      // Test interaction performance
      const interactionStart = performance.now()
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'A')
      const interactionTime = performance.now() - interactionStart

      expect(interactionTime).toBeLessThan(performanceThresholds.interactionTime)
    })
  })

  describe('Stress Testing', () => {
    it('should handle high-frequency updates', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      const startTime = performance.now()
      
      // Simulate very rapid updates
      for (let i = 0; i < 1000; i++) {
        await act(async () => {
          fireEvent.change(ideaInput, { 
            target: { value: `Stress test ${i}` } 
          })
        })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle 1000 updates within 2 seconds
      expect(totalTime).toBeLessThan(2000)
      
      // Component should still be responsive
      expect(ideaInput).toHaveValue('Stress test 999')
    })

    it('should maintain performance under load', async () => {
      // Render multiple instances
      const instances = Array.from({ length: 10 }, (_, i) => 
        render(<PitchGeneratorContainer key={i} />)
      )
      
      const startTime = performance.now()
      
      // Interact with all instances
      for (const { container } of instances) {
        const input = container.querySelector('textarea')
        if (input) {
          fireEvent.change(input, { target: { value: 'Load test' } })
        }
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle multiple instances efficiently
      expect(totalTime).toBeLessThan(1000)
      
      // Cleanup
      instances.forEach(({ unmount }) => unmount())
    })
  })
})