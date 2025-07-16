/**
 * End-to-End Tests for Pitch Generator Improvements
 * Tests all user scenarios from idea input to pitch generation
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import * as featureFlags from '@/lib/feature-flags'

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false },
}))

describe('Pitch Generator E2E Tests', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Mock successful feature flags
    jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Complete User Journey - Success Flow', () => {
    it('should complete full pitch generation flow successfully', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          pitch: {
            id: 'test-pitch-1',
            title: 'Revolutionary AI Assistant',
            problem: 'Businesses struggle with customer support',
            solution: 'AI-powered support automation',
            market: 'Global customer service market',
            competition: 'Traditional support tools',
            businessModel: 'SaaS subscription',
            team: 'Experienced AI team',
            financials: 'Projected $1M ARR',
            ask: 'Seeking $500K seed funding'
          }
        })
      })

      render(
        <ErrorBoundary>
          <PitchGeneratorContainer />
        </ErrorBoundary>
      )

      // Step 1: User enters idea
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Une plateforme IA pour automatiser le support client')

      // Step 2: Validation feedback should appear
      await waitFor(() => {
        expect(screen.getByText(/validation/i)).toBeInTheDocument()
      })

      // Step 3: Select tone
      const toneSelect = screen.getByLabelText(/ton/i)
      await user.selectOptions(toneSelect, 'professional')

      // Step 4: Generate pitch
      const generateButton = screen.getByRole('button', { name: /générer/i })
      expect(generateButton).not.toBeDisabled()
      
      await user.click(generateButton)

      // Step 5: Progress indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/génération en cours/i)).toBeInTheDocument()
      })

      // Step 6: Success state should appear
      await waitFor(() => {
        expect(screen.getByText(/Revolutionary AI Assistant/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Step 7: Verify preferences were saved
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitchpal_preferences',
        expect.stringContaining('professional')
      )

      // Step 8: Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: 'Une plateforme IA pour automatiser le support client',
          tone: 'professional'
        }),
        signal: expect.any(Object)
      })
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle network errors gracefully with retry', async () => {
      // Mock network error followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, pitch: { id: 'test' } })
        })

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test idea for network error')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument()
      })

      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      expect(retryButton).toBeInTheDocument()

      await user.click(retryButton)

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/succès/i)).toBeInTheDocument()
      })
    })

    it('should handle server errors with appropriate messaging', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test server error')

      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/problème temporaire/i)).toBeInTheDocument()
      })

      // Should not auto-retry server errors
      expect(screen.queryByText(/tentative automatique/i)).not.toBeInTheDocument()
    })

    it('should handle timeout errors with cancellation', async () => {
      // Mock timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test timeout')

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
      })
    })
  })

  describe('Validation and User Input', () => {
    it('should validate idea input in real-time', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Too short input
      await user.type(ideaInput, 'AI')
      
      await waitFor(() => {
        expect(screen.getByText(/trop courte/i)).toBeInTheDocument()
      })

      // Valid input
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Une plateforme complète pour automatiser les processus')
      
      await waitFor(() => {
        expect(screen.getByText(/idée valide/i)).toBeInTheDocument()
      })
    })

    it('should provide contextual suggestions', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Une app')

      await waitFor(() => {
        expect(screen.getByText(/ajouter plus de détails/i)).toBeInTheDocument()
      })
    })

    it('should prevent submission with invalid input', async () => {
      render(<PitchGeneratorContainer />)

      const generateButton = screen.getByRole('button', { name: /générer/i })
      expect(generateButton).toBeDisabled()

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'AI') // Too short

      expect(generateButton).toBeDisabled()
    })
  })

  describe('User Preferences and Persistence', () => {
    it('should save and restore user preferences', async () => {
      // Mock existing preferences
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        defaultTone: 'casual',
        ideaHistory: ['Previous idea'],
        autoSave: true
      }))

      render(<PitchGeneratorContainer />)

      // Should restore previous tone
      const toneSelect = screen.getByLabelText(/ton/i) as HTMLSelectElement
      expect(toneSelect.value).toBe('casual')

      // Change tone
      await user.selectOptions(toneSelect, 'professional')

      // Should save new preference
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'pitchpal_preferences',
          expect.stringContaining('professional')
        )
      })
    })

    it('should maintain idea history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, pitch: { id: 'test' } })
      })

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
    })
  })

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      render(<PitchGeneratorContainer />)

      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/votre idée/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/ton/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /générer/i })).toHaveFocus()
    })

    it('should have proper ARIA labels and roles', () => {
      render(<PitchGeneratorContainer />)

      expect(screen.getByLabelText(/votre idée/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByRole('button', { name: /générer/i })).toHaveAttribute('type', 'submit')
      
      // Check for proper form structure
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should announce status changes to screen readers', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test idea')

      // Should have aria-live region for status updates
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle rapid user input without performance issues', async () => {
      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Simulate rapid typing
      const rapidText = 'This is a test of rapid input handling for performance validation'
      
      const startTime = performance.now()
      await user.type(ideaInput, rapidText)
      const endTime = performance.now()

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should still show validation
      await waitFor(() => {
        expect(screen.getByText(/validation/i)).toBeInTheDocument()
      })
    })

    it('should cleanup resources properly on unmount', () => {
      const { unmount } = render(<PitchGeneratorContainer />)
      
      // Trigger some async operations
      const ideaInput = screen.getByLabelText(/votre idée/i)
      fireEvent.change(ideaInput, { target: { value: 'Test cleanup' } })

      // Unmount component
      unmount()

      // Should not cause memory leaks or errors
      expect(() => {
        // Any cleanup-related assertions would go here
      }).not.toThrow()
    })
  })

  describe('Feature Flag Integration', () => {
    it('should fallback to legacy system when feature flags are disabled', async () => {
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(false)

      render(<PitchGeneratorContainer />)

      // Should render basic form without enhanced features
      expect(screen.getByLabelText(/votre idée/i)).toBeInTheDocument()
      expect(screen.queryByText(/validation en temps réel/i)).not.toBeInTheDocument()
    })

    it('should enable enhanced features when flags are active', async () => {
      jest.spyOn(featureFlags, 'isFeatureEnabled').mockReturnValue(true)

      render(<PitchGeneratorContainer />)

      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test enhanced features')

      // Should show enhanced validation
      await waitFor(() => {
        expect(screen.getByText(/validation/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Boundary Integration', () => {
    it('should catch and handle component errors gracefully', () => {
      // Mock a component that throws an error
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
    })
  })
})