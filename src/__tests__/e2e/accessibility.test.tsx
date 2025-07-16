/**
 * Accessibility Tests for Pitch Generator
 * Tests WCAG compliance, keyboard navigation, screen reader support
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock speech synthesis for screen reader tests
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
}

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
})

describe('Accessibility Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WCAG Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PitchGeneratorContainer />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should maintain accessibility during state changes', async () => {
      const { container } = render(<PitchGeneratorContainer />)
      
      // Test initial state
      let results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Test with validation errors
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'AI') // Too short
      
      await waitFor(async () => {
        results = await axe(container)
        expect(results).toHaveNoViolations()
      })
      
      // Test with valid input
      await user.clear(ideaInput)
      await user.type(ideaInput, 'Une plateforme complète pour automatiser les processus')
      
      await waitFor(async () => {
        results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })

    it('should maintain accessibility during loading states', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, pitch: { id: 'test' } })
        }), 1000))
      )

      const { container } = render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test accessibility during loading')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      // Test accessibility during loading
      await waitFor(async () => {
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      render(<PitchGeneratorContainer />)
      
      // Start navigation
      await user.tab()
      expect(screen.getByLabelText(/votre idée/i)).toHaveFocus()
      
      // Navigate to tone selector
      await user.tab()
      expect(screen.getByLabelText(/ton/i)).toHaveFocus()
      
      // Navigate to generate button
      await user.tab()
      expect(screen.getByRole('button', { name: /générer/i })).toHaveFocus()
      
      // Should be able to navigate back
      await user.tab({ shift: true })
      expect(screen.getByLabelText(/ton/i)).toHaveFocus()
    })

    it('should handle keyboard shortcuts', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.click(ideaInput)
      await user.type(ideaInput, 'Test keyboard shortcuts')
      
      // Test Ctrl+Enter to submit
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // Should trigger generation
      await waitFor(() => {
        expect(screen.getByText(/génération en cours/i)).toBeInTheDocument()
      })
    })

    it('should trap focus in modal dialogs', async () => {
      // Mock error state to show error dialog
      global.fetch = jest.fn().mockRejectedValue(new Error('Test error'))
      
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test focus trap')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      // Wait for error dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Focus should be trapped in dialog
      const dialog = screen.getByRole('dialog')
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      // Test tab cycling within dialog
      await user.tab()
      expect(document.activeElement).toBe(focusableElements[0])
    })

    it('should support arrow key navigation in lists', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test')
      
      // Should show suggestions
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
      
      const listbox = screen.getByRole('listbox')
      const options = screen.getAllByRole('option')
      
      // Focus first option
      await user.keyboard('{ArrowDown}')
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
      
      // Navigate to next option
      await user.keyboard('{ArrowDown}')
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
      
      // Navigate back up
      await user.keyboard('{ArrowUp}')
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PitchGeneratorContainer />)
      
      // Form should have proper role
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Inputs should have labels
      expect(screen.getByLabelText(/votre idée/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/ton/i)).toBeInTheDocument()
      
      // Button should have proper role and name
      const generateButton = screen.getByRole('button', { name: /générer/i })
      expect(generateButton).toHaveAttribute('type', 'submit')
    })

    it('should announce status changes', async () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'AI') // Too short
      
      // Should have aria-live region for status updates
      await waitFor(() => {
        const statusRegion = screen.getByRole('status')
        expect(statusRegion).toBeInTheDocument()
        expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should provide descriptive error messages', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test error messages')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive')
        expect(errorMessage).toHaveTextContent(/erreur réseau/i)
      })
    })

    it('should support screen reader navigation landmarks', () => {
      render(<PitchGeneratorContainer />)
      
      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Should have form landmark
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Should have proper heading structure
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      // Check heading hierarchy
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        expect(level).toBeGreaterThanOrEqual(1)
        expect(level).toBeLessThanOrEqual(6)
      })
    })

    it('should provide context for form controls', () => {
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Should have describedby for help text
      expect(ideaInput).toHaveAttribute('aria-describedby')
      
      const describedById = ideaInput.getAttribute('aria-describedby')
      if (describedById) {
        const helpText = document.getElementById(describedById)
        expect(helpText).toBeInTheDocument()
      }
    })
  })

  describe('Visual Accessibility', () => {
    it('should have sufficient color contrast', () => {
      const { container } = render(<PitchGeneratorContainer />)
      
      // This would typically be tested with automated tools
      // Here we check for common accessibility patterns
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        // Should not rely solely on color for information
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy()
      })
    })

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { container } = render(<PitchGeneratorContainer />)
      
      // Should apply high contrast styles
      const form = container.querySelector('form')
      expect(form).toHaveClass(/high-contrast|contrast/)
    })

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { container } = render(<PitchGeneratorContainer />)
      
      // Should respect reduced motion
      const animatedElements = container.querySelectorAll('[class*="animate"]')
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        // Should have reduced or no animation
        expect(styles.animationDuration).toMatch(/(0s|0ms|none)/)
      })
    })

    it('should be usable at 200% zoom', () => {
      // Mock viewport at 200% zoom
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2,
      })

      const { container } = render(<PitchGeneratorContainer />)
      
      // Content should still be accessible
      expect(screen.getByLabelText(/votre idée/i)).toBeVisible()
      expect(screen.getByRole('button', { name: /générer/i })).toBeVisible()
      
      // No horizontal scrolling should be required
      expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth)
    })
  })

  describe('Mobile Accessibility', () => {
    it('should support touch navigation', async () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
      })

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Should handle touch events
      fireEvent.touchStart(ideaInput)
      fireEvent.touchEnd(ideaInput)
      
      expect(ideaInput).toHaveFocus()
    })

    it('should have appropriate touch targets', () => {
      const { container } = render(<PitchGeneratorContainer />)
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect()
        // Touch targets should be at least 44x44px
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })
    })

    it('should support voice input', async () => {
      // Mock speech recognition
      const mockSpeechRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        abort: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      Object.defineProperty(window, 'SpeechRecognition', {
        value: jest.fn(() => mockSpeechRecognition),
      })

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      
      // Should support voice input if available
      if (window.SpeechRecognition) {
        expect(ideaInput).toHaveAttribute('x-webkit-speech')
      }
    })
  })

  describe('Internationalization Accessibility', () => {
    it('should support RTL languages', () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')

      const { container } = render(<PitchGeneratorContainer />)
      
      // Should adapt layout for RTL
      const form = container.querySelector('form')
      expect(form).toHaveStyle('direction: rtl')
      
      // Cleanup
      document.documentElement.removeAttribute('dir')
      document.documentElement.removeAttribute('lang')
    })

    it('should have proper language attributes', () => {
      render(<PitchGeneratorContainer />)
      
      // Should have lang attribute on text content
      const textElements = screen.getAllByText(/\w+/)
      textElements.forEach(element => {
        // Should inherit language from document or have explicit lang
        expect(
          element.getAttribute('lang') || 
          document.documentElement.getAttribute('lang')
        ).toBeTruthy()
      })
    })
  })

  describe('Cognitive Accessibility', () => {
    it('should provide clear instructions', () => {
      render(<PitchGeneratorContainer />)
      
      // Should have help text for complex inputs
      const ideaInput = screen.getByLabelText(/votre idée/i)
      const helpTextId = ideaInput.getAttribute('aria-describedby')
      
      if (helpTextId) {
        const helpText = document.getElementById(helpTextId)
        expect(helpText).toHaveTextContent(/décrivez votre idée/i)
      }
    })

    it('should show progress indicators', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, pitch: { id: 'test' } })
        }), 1000))
      )

      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test progress indicators')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      // Should show progress
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label')
      expect(progressBar).toHaveAttribute('aria-valuenow')
    })

    it('should provide error recovery options', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Test error'))
      
      render(<PitchGeneratorContainer />)
      
      const ideaInput = screen.getByLabelText(/votre idée/i)
      await user.type(ideaInput, 'Test error recovery')
      
      const generateButton = screen.getByRole('button', { name: /générer/i })
      await user.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
      })
      
      // Should provide clear recovery actions
      const retryButton = screen.getByRole('button', { name: /réessayer/i })
      expect(retryButton).toHaveAttribute('aria-describedby')
    })
  })
})