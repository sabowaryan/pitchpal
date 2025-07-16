import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenerationProgress } from '../generation-progress'
import { EnhancedProgress } from '@/types/enhanced-errors'

// Mock the Button component
jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

describe('GenerationProgress', () => {
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockProgress = (overrides: Partial<EnhancedProgress> = {}): EnhancedProgress => ({
    step: 1,
    totalSteps: 4,
    message: 'Analyse de votre idée en cours...',
    isComplete: false,
    canCancel: true,
    currentOperation: 'validating',
    ...overrides
  })

  describe('Basic Rendering', () => {
    it('should render progress information correctly', () => {
      const progress = createMockProgress()
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Génération en cours...')).toBeInTheDocument()
      expect(screen.getByText('Analyse de votre idée en cours...')).toBeInTheDocument()
      expect(screen.getByText('Notre IA travaille sur votre pitch professionnel')).toBeInTheDocument()
    })

    it('should display correct progress percentage', () => {
      const progress = createMockProgress({ step: 2, totalSteps: 4 })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument()
    })

    it('should show current operation status', () => {
      const progress = createMockProgress({ currentOperation: 'generating' })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('• Génération')).toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('should show cancel button when canCancel is true and onCancel is provided', () => {
      const progress = createMockProgress({ canCancel: true })
      render(<GenerationProgress progress={progress} onCancel={mockOnCancel} />)

      expect(screen.getByText('Annuler')).toBeInTheDocument()
    })

    it('should not show cancel button when canCancel is false', () => {
      const progress = createMockProgress({ canCancel: false })
      render(<GenerationProgress progress={progress} onCancel={mockOnCancel} />)

      expect(screen.queryByText('Annuler')).not.toBeInTheDocument()
    })

    it('should not show cancel button when onCancel is not provided', () => {
      const progress = createMockProgress({ canCancel: true })
      render(<GenerationProgress progress={progress} />)

      expect(screen.queryByText('Annuler')).not.toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', () => {
      const progress = createMockProgress({ canCancel: true })
      render(<GenerationProgress progress={progress} onCancel={mockOnCancel} />)

      fireEvent.click(screen.getByText('Annuler'))
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Retry Functionality', () => {
    it('should show retry indicator when isRetrying is true', () => {
      const progress = createMockProgress()
      render(<GenerationProgress progress={progress} isRetrying={true} retryCount={1} />)

      expect(screen.getByText('Nouvelle tentative (1)...')).toBeInTheDocument()
      expect(screen.getByText('Tentative automatique en cours... (1/3)')).toBeInTheDocument()
    })

    it('should not show retry indicator when isRetrying is false', () => {
      const progress = createMockProgress()
      render(<GenerationProgress progress={progress} isRetrying={false} />)

      expect(screen.queryByText(/Nouvelle tentative/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tentative automatique/)).not.toBeInTheDocument()
    })

    it('should show correct retry count', () => {
      const progress = createMockProgress()
      render(<GenerationProgress progress={progress} isRetrying={true} retryCount={2} />)

      expect(screen.getByText('Nouvelle tentative (2)...')).toBeInTheDocument()
      expect(screen.getByText('Tentative automatique en cours... (2/3)')).toBeInTheDocument()
    })
  })

  describe('Time Estimation', () => {
    it('should show estimated time remaining', () => {
      const progress = createMockProgress({ step: 1, estimatedTimeRemaining: 25 })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Temps estimé restant: 25s')).toBeInTheDocument()
    })

    it('should format time correctly for minutes and seconds', () => {
      const progress = createMockProgress({ step: 1, estimatedTimeRemaining: 90 })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Temps estimé restant: 1m 30s')).toBeInTheDocument()
    })

    it('should format time correctly for minutes only', () => {
      const progress = createMockProgress({ step: 1, estimatedTimeRemaining: 120 })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Temps estimé restant: 2m')).toBeInTheDocument()
    })

    it('should not show time remaining when progress is complete', () => {
      const progress = createMockProgress({ 
        step: 4, 
        isComplete: true, 
        estimatedTimeRemaining: 10 
      })
      render(<GenerationProgress progress={progress} />)

      expect(screen.queryByText(/Temps estimé restant/)).not.toBeInTheDocument()
    })
  })

  describe('Progress Steps', () => {
    it('should show all progress steps', () => {
      const progress = createMockProgress()
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Analyse de votre idée')).toBeInTheDocument()
      expect(screen.getByText('Structuration du pitch')).toBeInTheDocument()
      expect(screen.getByText('Génération du contenu')).toBeInTheDocument()
      expect(screen.getByText('Finalisation')).toBeInTheDocument()
    })

    it('should highlight active step correctly', () => {
      const progress = createMockProgress({ step: 2 })
      render(<GenerationProgress progress={progress} />)

      // Find the step container by looking for the step title and going up to the step container
      const stepTitles = screen.getAllByText('Structuration du pitch')
      const stepTitle = stepTitles.find(el => el.tagName === 'H4')
      const activeStep = stepTitle?.closest('.relative')
      expect(activeStep).toHaveClass('bg-primary-50', 'border-primary-300')
    })

    it('should show completed steps with checkmarks', () => {
      const progress = createMockProgress({ step: 3 })
      render(<GenerationProgress progress={progress} />)

      // Find step containers by looking for step titles and going up to the step container
      const step1Title = screen.getAllByText('Analyse de votre idée').find(el => el.tagName === 'H4')
      const step2Title = screen.getAllByText('Structuration du pitch').find(el => el.tagName === 'H4')
      
      const step1 = step1Title?.closest('.relative')
      const step2 = step2Title?.closest('.relative')
      
      expect(step1).toHaveClass('bg-success-50', 'border-success-200')
      expect(step2).toHaveClass('bg-success-50', 'border-success-200')
    })
  })

  describe('Operation-Specific Feedback', () => {
    it('should show operation-specific feedback for validating', () => {
      const progress = createMockProgress({ currentOperation: 'validating' })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('Analyse en cours')).toBeInTheDocument()
      expect(screen.getByText('Notre IA analyse votre idée et identifie les éléments clés')).toBeInTheDocument()
    })

    it('should show operation-specific feedback for generating', () => {
      const progress = createMockProgress({ currentOperation: 'generating' })
      render(<GenerationProgress progress={progress} />)

      // Use getAllByText to handle multiple instances and check the specific one in the feedback section
      const structurationTexts = screen.getAllByText('Structuration du pitch')
      expect(structurationTexts.length).toBeGreaterThan(0)
      expect(screen.getByText('Création de la structure optimale pour votre présentation')).toBeInTheDocument()
    })

    it('should show operation-specific feedback for processing', () => {
      const progress = createMockProgress({ currentOperation: 'processing' })
      render(<GenerationProgress progress={progress} />)

      // Use getAllByText to handle multiple instances and check the specific one in the feedback section
      const contentTexts = screen.getAllByText('Génération du contenu')
      expect(contentTexts.length).toBeGreaterThan(0)
      expect(screen.getByText('Rédaction du contenu personnalisé selon votre ton')).toBeInTheDocument()
    })

    it('should show operation-specific feedback for finalizing', () => {
      const progress = createMockProgress({ currentOperation: 'finalizing' })
      render(<GenerationProgress progress={progress} />)

      // Use getAllByText to handle multiple instances and check the specific one in the feedback section
      const finalizationTexts = screen.getAllByText('Finalisation')
      expect(finalizationTexts.length).toBeGreaterThan(0)
      expect(screen.getByText('Préparation finale de votre pitch professionnel')).toBeInTheDocument()
    })

    it('should not show operation feedback when progress is complete', () => {
      const progress = createMockProgress({ 
        isComplete: true, 
        currentOperation: 'finalizing' 
      })
      render(<GenerationProgress progress={progress} />)

      // When complete, the operation-specific feedback section should not be rendered
      // But the step titles will still be there, so we check for the specific feedback text
      expect(screen.queryByText('Préparation finale de votre pitch professionnel')).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar Styling', () => {
    it('should use retry styling when isRetrying is true', () => {
      const progress = createMockProgress({ step: 2 })
      render(<GenerationProgress progress={progress} isRetrying={true} />)

      const progressBar = document.querySelector('.bg-gradient-to-r.from-amber-400.to-amber-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('should use normal styling when not retrying', () => {
      const progress = createMockProgress({ step: 2 })
      render(<GenerationProgress progress={progress} isRetrying={false} />)

      const progressBar = document.querySelector('.bg-gradient-to-r.from-primary-500.to-primary-600')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button accessibility for cancel button', () => {
      const progress = createMockProgress({ canCancel: true })
      render(<GenerationProgress progress={progress} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /annuler/i })
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).toBeEnabled()
    })

    it('should have proper progress information for screen readers', () => {
      const progress = createMockProgress({ step: 2, totalSteps: 4 })
      render(<GenerationProgress progress={progress} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument()
    })
  })
})