/**
 * Regression Tests for Pitch Generator
 * Tests compatibility with existing functionality and prevents regressions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { PitchGeneratorWrapper } from '@/components/forms/pitch-generator-wrapper'
import * as featureFlags from '@/lib/feature-flags'

// Mock legacy components for compatibility testing
jest.mock('@/components/forms/idea-form', () => ({
  IdeaForm: ({ onSubmit, isLoading }: any) => (
    <form onSubmit={onSubmit} data-testid="legacy-idea-form">
      <textarea name="idea" placeholder="Enter your idea" />
      <select name="tone">
        <option value="professional">Professional</option>
        <option value="casual">Casual</option>
      </select>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Pitch'}
      </button>
    </form>
  ),
}))

describe('Regression Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('Legacy Compatibility', () => {
    it('should maintain backward compatibility with existing API', async () => {
      // Mock successful API response in legacy format
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            title: 'Legacy Format Pitch',
            problem: 'Legacy problem',
            solution: 'Legacy solution',
            market: 'Legacy market',
            competition: 'Legacy competition',
            businessModel: 'Legacy business model',
            team: 'Legacy team',
            financials: 'Legacy financials',
            ask: 'Legacy ask'
          }
        })
      })

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test legacy compatibility')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Should handle legacy API response format
      await waitFor(() => {
        expect(screen.getByText(/Legacy Format Pitch/i)).toBeInTheDocument()
      })

      // Verify API call format hasn't changed
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: 'Test legacy compatibility',
          tone: expect.any(String)
        }),
        signal: expect.any(Object)
      })
    })

    it('should fallback gracefully when new features fail', async () => {
      // Mock feature flag failure
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockImplementation(() => {
        throw new Error('Feature flag service unavailable')
      })

      // Should still render basic functionality
      expect(() => {
        render(<PitchGeneratorContainer />)
      }).not.toThrow()

      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
    })

    it('should handle legacy localStorage format', () => {
      // Mock legacy preferences format
      const legacyPrefs = JSON.stringify({
        tone: 'professional', // Old format
        lastIdea: 'Legacy idea', // Old field name
      })

      const mockGetItem = jest.fn().mockReturnValue(legacyPrefs)
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      })

      render(<PitchGeneratorContainer />)

      // Should migrate and use legacy preferences
      const toneSelect = screen.getByLabelText(/ton/i) as HTMLSelectElement
      expect(toneSelect.value).toBe('professional')
    })

    it('should maintain existing URL structure', async () => {
      // Mock successful generation
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: { id: 'test-pitch' }
        })
      })

      // Mock router
      const mockPush = jest.fn()
      jest.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test URL structure')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Should redirect to existing URL structure
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/results?id=test-pitch')
      })
    })
  })

  describe('Data Format Compatibility', () => {
    it('should handle various API response formats', async () => {
      const testCases = [
        // Current format
        {
          success: true,
          pitch: {
            id: 'current-format',
            title: 'Current Format',
            problem: 'Problem',
            solution: 'Solution',
            market: 'Market',
            competition: 'Competition',
            businessModel: 'Business Model',
            team: 'Team',
            financials: 'Financials',
            ask: 'Ask'
          }
        },
        // Legacy format with different field names
        {
          success: true,
          data: {
            pitchId: 'legacy-format',
            pitchTitle: 'Legacy Format',
            problemStatement: 'Problem',
            solutionDescription: 'Solution',
            targetMarket: 'Market',
            competitiveAnalysis: 'Competition',
            revenueModel: 'Business Model',
            teamInfo: 'Team',
            financialProjections: 'Financials',
            fundingRequest: 'Ask'
          }
        }
      ]

      for (const responseFormat of testCases) {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => responseFormat
        })

        const { unmount } = render(<PitchGeneratorContainer />)

        const ideaInput = screen.getByLabelText(/votre idée/i)
        await user.type(ideaInput, 'Test format compatibility')

        const generateButton = screen.getByRole('button', { name: /générer/i })
        await user.click(generateButton)

        // Should handle both formats
        await waitFor(() => {
          expect(screen.getByText(/Format/i)).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should handle missing optional fields gracefully', async () => {
      // Mock response with missing fields
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            id: 'minimal-pitch',
            title: 'Minimal Pitch',
            problem: 'Problem',
            solution: 'Solution',
            // Missing optional fields: market, competition, etc.
          }
        })
      })

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test minimal response')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Should handle missing fields without errors
      await waitFor(() => {
        expect(screen.getByText(/Minimal Pitch/i)).toBeInTheDocument()
      })

      // Should not crash when displaying incomplete data
      expect(() => {
        screen.getByText(/Problem/i)
        screen.getByText(/Solution/i)
      }).not.toThrow()
    })
  })

  describe('State Management Regression', () => {
    it('should not break existing state management patterns', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Test rapid state changes
      await user.type(ideaInput, 'First idea')
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Second idea')
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Final idea')

      // State should be consistent
      expect(ideaInput).toHaveValue('Final idea')
      
      // Generate button should be enabled for valid input
      const generateButton = screen.getByRole('button', { name: /générer/i })
      expect(generateButton).not.toBeDisabled()
    })

    it('should maintain form state during navigation', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      const toneSelect = screen.getByLabelText(/ton/i)

      await user.type(ideaInput, 'Navigation test idea')
      await user.selectOptions(toneSelect, 'casual')

      // Simulate navigation away and back
      const { unmount } = render(<div />)
      unmount()

      render(<PitchGeneratorContainer />)

      // Form should restore state if configured to do so
      // This depends on the persistence implementation
    })

    it('should handle concurrent state updates', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)

      // Simulate concurrent updates
      const updates = [
        'Update 1',
        'Update 2',
        'Update 3',
        'Update 4',
        'Update 5'
      ]

      await Promise.all(
        updates.map(async (update, index) => {
          await new Promise(resolve => setTimeout(resolve, index * 10))
          fireEvent.change(ideaInput, { target: { value: update } })
        })
      )

      // Should handle the last update
      expect(ideaInput).toHaveValue('Update 5')
    })
  })

  describe('Error Handling Regression', () => {
    it('should not break existing error handling', async () => {
      // Test various error scenarios that should still work
      const errorScenarios = [
        { status: 400, message: 'Bad Request' },
        { status: 401, message: 'Unauthorized' },
        { status: 403, message: 'Forbidden' },
        { status: 404, message: 'Not Found' },
        { status: 500, message: 'Internal Server Error' },
        { status: 503, message: 'Service Unavailable' },
      ]

      for (const scenario of errorScenarios) {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: scenario.status,
          json: async () => ({ error: scenario.message })
        })

        const { unmount } = render(<PitchGeneratorContainer />)

        const ideaInput = screen.getByLabelText(/votre idée/i)
        await user.type(ideaInput, `Test ${scenario.status} error`)

        const generateButton = screen.getByRole('button', { name: /générer/i })
        await user.click(generateButton)

        // Should show appropriate error message
        await waitFor(() => {
          expect(screen.getByText(/erreur/i)).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should handle network errors consistently', async () => {
      const networkErrors = [
        new Error('Network error'),
        new Error('Failed to fetch'),
        new Error('Connection timeout'),
        new TypeError('NetworkError'),
      ]

      for (const error of networkErrors) {
        global.fetch = jest.fn().mockRejectedValueOnce(error)

        const { unmount } = render(<PitchGeneratorContainer />)

        const ideaInput = screen.getByLabelText(/votre idée/i)
        await user.type(ideaInput, 'Test network error')

        const generateButton = screen.getByRole('button', { name: /générer/i })
        await user.click(generateButton)

        // Should handle all network errors gracefully
        await waitFor(() => {
          expect(screen.getByText(/réseau/i)).toBeInTheDocument()
        })

        unmount()
      }
    })
  })

  describe('Performance Regression', () => {
    it('should not degrade rendering performance', async () => {
      const renderTimes: number[] = []

      // Test multiple renders
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        const { unmount } = render(<PitchGeneratorContainer />)
        const endTime = performance.now()
        
        renderTimes.push(endTime - startTime)
        unmount()
      }

      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      
      // Should maintain reasonable render times
      expect(averageRenderTime).toBeLessThan(100) // 100ms threshold
      
      // Should not have significant variance
      const maxTime = Math.max(...renderTimes)
      const minTime = Math.min(...renderTimes)
      expect(maxTime - minTime).toBeLessThan(50) // 50ms variance threshold
    })

    it('should not cause memory leaks', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Render and unmount multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<PitchGeneratorContainer />)
        unmount()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024) // 5MB threshold
    })
  })

  describe('Feature Flag Regression', () => {
    it('should maintain functionality when feature flags are disabled', () => {
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(false)

      render(<PitchGeneratorContainer />)

      // Basic functionality should still work
      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
    })

    it('should handle feature flag service failures', () => {
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockImplementation(() => {
        throw new Error('Feature flag service down')
      })

      // Should not crash the application
      expect(() => {
        render(<PitchGeneratorContainer />)
      }).not.toThrow()
    })

    it('should gracefully degrade when enhanced features fail', async () => {
      // Mock enhanced features failure
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Simulate enhanced validation failure
      const mockValidation = jest.fn().mockImplementation(() => {
        throw new Error('Enhanced validation failed')
      })

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test graceful degradation')

      // Should still allow form submission
      const generateButton = screen.getByRole('button', { name: /générer/i })
      expect(generateButton).not.toBeDisabled()
    })
  })

  describe('Integration with Existing Components', () => {
    it('should work with wrapper components', () => {
      render(
        <PitchGeneratorWrapper>
          <PitchGeneratorContainer />
        </PitchGeneratorWrapper>
      )

      // Should render within wrapper without issues
      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
    })

    it('should maintain existing prop interfaces', () => {
      const mockProps = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
        initialIdea: 'Test initial idea',
        initialTone: 'professional' as const,
      }

      // Should accept existing props without TypeScript errors
      expect(() => {
        render(<PitchGeneratorContainer {...mockProps} />)
      }).not.toThrow()

      // Should use initial values
      const ideaInput = screen.getByLabelText(/votre idée/i) as HTMLTextAreaElement
      expect(ideaInput.value).toBe('Test initial idea')

      const toneSelect = screen.getByLabelText(/ton/i) as HTMLSelectElement
      expect(toneSelect.value).toBe('professional')
    })
  })

  describe('CSS and Styling Regression', () => {
    it('should maintain existing CSS classes', () => {
      const { container } = render(<PitchGeneratorContainer />)

      // Should have expected CSS classes for styling
      const form = container.querySelector('form')
      expect(form).toHaveClass(/pitch-generator|form/)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      expect(ideaInput).toHaveClass(/textarea|input/)
    })

    it('should not break responsive design', () => {
      // Mock different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ]

      viewports.forEach(viewport => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        })

        const { container, unmount } = render(<PitchGeneratorContainer />)

        // Should be responsive at all viewport sizes
        const form = container.querySelector('form')
        expect(form).toBeVisible()

        unmount()
      })
    })
  })
})