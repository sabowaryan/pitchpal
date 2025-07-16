/**
 * Tests for IdeaValidationFeedback Component
 * 
 * This test suite covers all functionality of the IdeaValidationFeedback component:
 * - Character counter with visual indicators
 * - Validation error display
 * - Quality score visualization
 * - Improvement suggestions display
 * - Different validation states
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { IdeaValidationFeedback } from '../idea-validation-feedback'
import { ValidationResult, ValidationError, ValidationWarning, IdeaSuggestion } from '@/types/enhanced-errors'

// Mock validation result factory
const createValidationResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  isValid: true,
  score: 75,
  errors: [],
  warnings: [],
  suggestions: [],
  ...overrides
})

describe('IdeaValidationFeedback', () => {
  const defaultProps = {
    validationResult: createValidationResult(),
    currentLength: 50,
    maxLength: 500,
    minLength: 10
  }

  describe('Character Counter', () => {
    it('displays current length and max length', () => {
      render(<IdeaValidationFeedback {...defaultProps} />)
      
      expect(screen.getByText('50 / 500')).toBeInTheDocument()
    })

    it('shows "too short" status when below minimum length', () => {
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={5}
        />
      )
      
      expect(screen.getByText('5 caractères manquants')).toBeInTheDocument()
    })

    it('shows "optimal length" status for good length', () => {
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={100}
        />
      )
      
      expect(screen.getByText('Longueur optimale')).toBeInTheDocument()
    })

    it('shows "near limit" status when approaching max length', () => {
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={460} // 92% of 500
        />
      )
      
      expect(screen.getByText('Proche de la limite')).toBeInTheDocument()
    })

    it('shows "over limit" status when exceeding max length', () => {
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={520}
        />
      )
      
      expect(screen.getByText('20 caractères en trop')).toBeInTheDocument()
    })

    it('renders progress bar with correct width', () => {
      const { container } = render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={250} // 50% of 500
        />
      )
      
      const progressBar = container.querySelector('[style*="width: 50%"]')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Validation Errors', () => {
    it('displays validation errors when present', () => {
      const errors: ValidationError[] = [
        {
          field: 'idea',
          type: 'required',
          message: 'Une idée est requise'
        },
        {
          field: 'idea',
          type: 'minLength',
          message: 'L\'idée doit contenir au moins 10 caractères'
        }
      ]

      const validationResult = createValidationResult({
        isValid: false,
        errors
      })

      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Erreurs de validation')).toBeInTheDocument()
      expect(screen.getByText('Une idée est requise')).toBeInTheDocument()
      expect(screen.getByText('L\'idée doit contenir au moins 10 caractères')).toBeInTheDocument()
    })

    it('does not display error section when no errors', () => {
      render(<IdeaValidationFeedback {...defaultProps} />)
      
      expect(screen.queryByText('Erreurs de validation')).not.toBeInTheDocument()
    })
  })

  describe('Quality Score', () => {
    it('displays quality score for valid ideas with content', () => {
      const validationResult = createValidationResult({ score: 85 })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
          currentLength={100}
        />
      )
      
      expect(screen.getByText('Qualité de l\'idée')).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('/100')).toBeInTheDocument()
      expect(screen.getByText('Excellente')).toBeInTheDocument()
    })

    it('shows correct score labels for different score ranges', () => {
      const testCases = [
        { score: 90, label: 'Excellente' },
        { score: 70, label: 'Bonne' },
        { score: 50, label: 'Correcte' },
        { score: 30, label: 'À améliorer' }
      ]

      testCases.forEach(({ score, label }) => {
        const validationResult = createValidationResult({ score })
        const { rerender } = render(
          <IdeaValidationFeedback 
            {...defaultProps} 
            validationResult={validationResult}
            currentLength={100}
          />
        )
        
        expect(screen.getByText(label)).toBeInTheDocument()
        
        // Clean up for next iteration
        rerender(<div />)
      })
    })

    it('does not display quality score when there are errors', () => {
      const validationResult = createValidationResult({
        isValid: false,
        score: 0,
        errors: [{ field: 'idea', type: 'required', message: 'Required' }]
      })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.queryByText('Qualité de l\'idée')).not.toBeInTheDocument()
    })

    it('does not display quality score when no content', () => {
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          currentLength={0}
        />
      )
      
      expect(screen.queryByText('Qualité de l\'idée')).not.toBeInTheDocument()
    })
  })

  describe('Warnings', () => {
    it('displays warnings when present', () => {
      const warnings: ValidationWarning[] = [
        {
          field: 'idea',
          type: 'suggestion',
          message: 'Votre idée pourrait bénéficier de plus de détails'
        }
      ]

      const validationResult = createValidationResult({ warnings })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Suggestions d\'optimisation')).toBeInTheDocument()
      expect(screen.getByText('Votre idée pourrait bénéficier de plus de détails')).toBeInTheDocument()
    })
  })

  describe('Improvement Suggestions', () => {
    it('displays improvement suggestions with examples', () => {
      const suggestions: IdeaSuggestion[] = [
        {
          type: 'vague_problem',
          message: 'Décrivez clairement le problème',
          example: 'Ex: "Les petites entreprises ont du mal à..."',
          priority: 'high'
        },
        {
          type: 'missing_target',
          message: 'Précisez vos utilisateurs cibles',
          example: 'Ex: "destiné aux entrepreneurs..."',
          priority: 'medium'
        },
        {
          type: 'add_context',
          message: 'Ajoutez des éléments sur la monétisation',
          priority: 'low'
        }
      ]

      const validationResult = createValidationResult({ suggestions })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Suggestions d\'amélioration')).toBeInTheDocument()
      expect(screen.getByText('Décrivez clairement le problème')).toBeInTheDocument()
      expect(screen.getByText('Ex: "Les petites entreprises ont du mal à..."')).toBeInTheDocument()
      expect(screen.getByText('Précisez vos utilisateurs cibles')).toBeInTheDocument()
      expect(screen.getByText('Ajoutez des éléments sur la monétisation')).toBeInTheDocument()
    })

    it('displays priority indicators correctly', () => {
      const suggestions: IdeaSuggestion[] = [
        {
          type: 'vague_problem',
          message: 'High priority suggestion',
          priority: 'high'
        },
        {
          type: 'missing_target',
          message: 'Medium priority suggestion',
          priority: 'medium'
        },
        {
          type: 'add_context',
          message: 'Low priority suggestion',
          priority: 'low'
        }
      ]

      const validationResult = createValidationResult({ suggestions })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Priorité haute')).toBeInTheDocument()
      expect(screen.getByText('Priorité moyenne')).toBeInTheDocument()
      expect(screen.getByText('Priorité basse')).toBeInTheDocument()
    })

    it('handles suggestions without examples', () => {
      const suggestions: IdeaSuggestion[] = [
        {
          type: 'add_context',
          message: 'Suggestion without example',
          priority: 'medium'
        }
      ]

      const validationResult = createValidationResult({ suggestions })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Suggestion without example')).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('displays success message for high-quality valid ideas', () => {
      const validationResult = createValidationResult({
        isValid: true,
        score: 85
      })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.getByText('Excellente idée!')).toBeInTheDocument()
      expect(screen.getByText('Votre idée est bien structurée et prête pour la génération du pitch.')).toBeInTheDocument()
    })

    it('does not display success message for lower quality ideas', () => {
      const validationResult = createValidationResult({
        isValid: true,
        score: 70
      })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.queryByText('Excellente idée!')).not.toBeInTheDocument()
    })

    it('does not display success message for invalid ideas', () => {
      const validationResult = createValidationResult({
        isValid: false,
        score: 85,
        errors: [{ field: 'idea', type: 'required', message: 'Required' }]
      })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      expect(screen.queryByText('Excellente idée!')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and structure', () => {
      const validationResult = createValidationResult({
        errors: [{ field: 'idea', type: 'required', message: 'Required' }]
      })
      
      render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          validationResult={validationResult}
        />
      )
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 4, name: 'Erreurs de validation' })).toBeInTheDocument()
    })

    it('provides meaningful text for screen readers', () => {
      render(<IdeaValidationFeedback {...defaultProps} />)
      
      expect(screen.getByText('Longueur:')).toBeInTheDocument()
      expect(screen.getByText('50 / 500')).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className to root element', () => {
      const { container } = render(
        <IdeaValidationFeedback 
          {...defaultProps} 
          className="custom-class"
        />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})