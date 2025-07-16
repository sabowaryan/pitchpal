/**
 * Comprehensive Integration Test
 * Validates all requirements from the specification are met
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import * as featureFlags from '@/lib/feature-flags'

// Mock all external dependencies
global.fetch = jest.fn()
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('Comprehensive Integration Tests - All Requirements', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(true)
  })

  describe('Requirement 1.1 - Error Handling and User Feedback', () => {
    it('should display specific and actionable error messages', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test error handling requirement')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      })

      // ✅ Requirement 1.1 satisfied: Specific error message with retry action
    })

    it('should handle server errors with appropriate messaging', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test server error')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/problème temporaire/i)).toBeInTheDocument()
      })

      // ✅ Requirement 1.1 satisfied: Server error with temporary problem message
    })
  })

  describe('Requirement 2.1 - Visual Progress Feedback', () => {
    it('should display clear progress indicators during generation', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, pitch: { id: 'test' } })
        } as Response), 1000))
      )

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test progress feedback')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByText(/génération en cours/i)).toBeInTheDocument()
      })

      // Should show progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // ✅ Requirement 2.1 satisfied: Clear progress indicators with steps
    })

    it('should update progress visually as steps complete', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'test' } })
      } as Response)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test progress updates')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow')
      })

      // ✅ Requirement 2.1 satisfied: Visual progress updates
    })
  })

  describe('Requirement 3.1 - Generation Cancellation', () => {
    it('should allow cancellation of ongoing generation', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementationOnce(() => 
        new Promise(() => {}) // Never resolves to simulate long request
      )

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test cancellation')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Cancel button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /annuler/i })
      await user.click(cancelButton)

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
        expect(screen.queryByText(/génération en cours/i)).not.toBeInTheDocument()
      })

      // ✅ Requirement 3.1 satisfied: Cancellation functionality
    })
  })

  describe('Requirement 4.1 - Real-time Validation', () => {
    it('should validate idea input in real-time', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Test minimum length validation
      await user.type(ideaInput, 'AI')
      
      await waitFor(() => {
        expect(screen.getByText(/trop courte/i)).toBeInTheDocument()
      })

      // Test valid input
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Une plateforme complète pour automatiser les processus métier')
      
      await waitFor(() => {
        expect(screen.getByText(/idée valide/i)).toBeInTheDocument()
      })

      // ✅ Requirement 4.1 satisfied: Real-time validation with feedback
    })

    it('should show character counter for input length', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test character counting')

      await waitFor(() => {
        expect(screen.getByText(/caractères/i)).toBeInTheDocument()
      })

      // ✅ Requirement 4.1 satisfied: Character counter display
    })
  })

  describe('Requirement 5.1 - User Preferences Persistence', () => {
    it('should save and restore user preferences', async () => {
      render(<PitchGeneratorContainer />)

      const toneSelect = screen.getByLabelText(/ton/i)
      await user.selectOptions(toneSelect, 'casual')

      // Should save preference
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'pitchpal_preferences',
          expect.stringContaining('casual')
        )
      })

      // ✅ Requirement 5.1 satisfied: Preference persistence
    })

    it('should maintain idea history', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'test' } })
      } as Response)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      const testIdea = 'Test idea for history'
      await user.type(ideaInput, testIdea)

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'pitchpal_preferences',
          expect.stringContaining(testIdea)
        )
      })

      // ✅ Requirement 5.1 satisfied: Idea history maintenance
    })
  })

  describe('Requirement 6.1 - Contextual Suggestions', () => {
    it('should provide improvement suggestions for vague ideas', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Une app')

      await waitFor(() => {
        expect(screen.getByText(/ajouter plus de détails/i)).toBeInTheDocument()
      })

      // ✅ Requirement 6.1 satisfied: Contextual suggestions for improvement
    })

    it('should show positive validation for well-structured ideas', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Une plateforme SaaS pour automatiser la gestion des ressources humaines dans les PME, avec IA pour optimiser les processus de recrutement')

      await waitFor(() => {
        expect(screen.getByText(/bien structurée/i)).toBeInTheDocument()
      })

      // ✅ Requirement 6.1 satisfied: Positive validation for good ideas
    })
  })

  describe('Requirement 7.1 - Pitch Preview and Modification', () => {
    it('should show preview before final redirection', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            id: 'preview-test',
            title: 'Preview Test Pitch',
            problem: 'Test problem',
            solution: 'Test solution',
            market: 'Test market',
            competition: 'Test competition',
            businessModel: 'Test business model',
            team: 'Test team',
            financials: 'Test financials',
            ask: 'Test ask'
          }
        })
      } as Response)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test preview functionality')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Preview Test Pitch/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument()
      })

      // ✅ Requirement 7.1 satisfied: Preview with modification options
    })
  })

  describe('Cross-Requirement Integration Tests', () => {
    it('should handle complete user journey with all features', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      
      // First attempt fails (error handling)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            id: 'integration-test',
            title: 'Complete Integration Test',
            problem: 'Integration problem',
            solution: 'Integration solution',
            market: 'Integration market',
            competition: 'Integration competition',
            businessModel: 'Integration business model',
            team: 'Integration team',
            financials: 'Integration financials',
            ask: 'Integration ask'
          }
        })
      } as Response)

      render(<PitchGeneratorContainer />)

      // Step 1: Input validation (Requirement 4.1)
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'AI') // Too short
      
      await waitFor(() => {
        expect(screen.getByText(/trop courte/i)).toBeInTheDocument()
      })

      // Step 2: Valid input with suggestions (Requirement 6.1)
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Une plateforme complète pour automatiser les processus')
      
      await waitFor(() => {
        expect(screen.getByText(/validation/i)).toBeInTheDocument()
      })

      // Step 3: Preference selection and persistence (Requirement 5.1)
      const toneSelect = screen.getByLabelText(/ton/i)
      await user.selectOptions(toneSelect, 'professional')

      // Step 4: First generation attempt fails (Requirement 1.1)
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument()
      })

      // Step 5: Retry after error (Requirement 1.1)
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      await user.click(retryButton)

      // Step 6: Progress feedback (Requirement 2.1)
      await waitFor(() => {
        expect(screen.getByText(/génération en cours/i)).toBeInTheDocument()
      })

      // Step 7: Success with preview (Requirement 7.1)
      await waitFor(() => {
        expect(screen.getByText(/Complete Integration Test/i)).toBeInTheDocument()
      })

      // Step 8: Verify preferences were saved (Requirement 5.1)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('professional')
      )

      // ✅ All requirements integrated successfully
    })

    it('should maintain accessibility throughout the journey', async () => {
      render(<PitchGeneratorContainer />)

      // Should have proper ARIA labels
      expect(screen.getByLabelText(/votre idée/i)).toHaveAttribute('aria-required', 'true')
      
      // Should support keyboard navigation
      await user.tab()
      expect(screen.getByLabelText(/votre idée/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/ton/i)).toHaveFocus()

      // Should have status regions for screen readers
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test accessibility')

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      // ✅ Accessibility maintained throughout
    })

    it('should handle feature flag fallbacks gracefully', async () => {
      // Disable enhanced features
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(false)

      render(<PitchGeneratorContainer />)

      // Basic functionality should still work
      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()

      // ✅ Graceful degradation working
    })

    it('should maintain performance under load', async () => {
      const startTime = performance.now()

      // Render multiple instances
      const instances = Array.from({ length: 5 }, (_, i) => 
        render(<PitchGeneratorContainer key={i} />)
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render efficiently
      expect(renderTime).toBeLessThan(500) // 500ms for 5 instances

      // Cleanup
      instances.forEach(({ unmount }) => unmount())

      // ✅ Performance maintained under load
    })
  })

  describe('Error Boundary Integration', () => {
    it('should catch and handle component errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error boundary')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText(/quelque chose s'est mal passé/i)).toBeInTheDocument()
      
      consoleSpy.mockRestore()

      // ✅ Error boundary working correctly
    })
  })

  describe('Non-Regression Validation', () => {
    it('should maintain backward compatibility with existing API', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            title: 'Compatibility Test',
            problem: 'Test problem',
            solution: 'Test solution',
            market: 'Test market',
            competition: 'Test competition',
            businessModel: 'Test business model',
            team: 'Test team',
            financials: 'Test financials',
            ask: 'Test ask'
          }
        })
      } as Response)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test backward compatibility')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Verify API call format hasn't changed
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: 'Test backward compatibility',
          tone: expect.any(String)
        }),
        signal: expect.any(Object)
      })

      // ✅ Backward compatibility maintained
    })
  })
})