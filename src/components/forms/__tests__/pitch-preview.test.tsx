/**
 * PitchPreview Component Tests
 * 
 * Tests for the pitch preview component including:
 * - Preview display functionality
 * - Inline editing capabilities
 * - Quality validation and scoring
 * - Partial regeneration features
 * - Save and continue workflow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PitchPreview } from '../pitch-preview'
import { Pitch } from '@/types/pitch'

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={props['data-testid']}
      {...props}
    >
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}))

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ defaultValue, placeholder, id, ...props }: any) => (
    <textarea 
      defaultValue={defaultValue}
      placeholder={placeholder}
      id={id}
      data-testid={`textarea-${id}`}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />
}))

// Mock icons
jest.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Edit3: () => <span data-testid="edit-icon">Edit</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  X: () => <span data-testid="x-icon">X</span>,
  RefreshCw: ({ className }: any) => <span data-testid="refresh-icon" className={className}>Refresh</span>,
  Star: () => <span data-testid="star-icon">Star</span>,
  AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
  ChevronRight: () => <span data-testid="chevron-icon">Chevron</span>,
  Save: ({ className }: any) => <span data-testid="save-icon" className={className}>Save</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>
}))

describe('PitchPreview', () => {
  const mockPitch: Pitch = {
    id: 'test-pitch-1',
    tagline: 'Révolutionnez votre gestion comptable',
    problem: 'Les petites entreprises perdent du temps avec la comptabilité manuelle et font des erreurs coûteuses.',
    solution: 'Une application mobile qui automatise la comptabilité en se connectant aux comptes bancaires.',
    targetMarket: 'Petites entreprises de 1 à 50 employés en France, particulièrement les services et commerces.',
    businessModel: 'Abonnement mensuel de 29€ avec période d\'essai gratuite de 30 jours.',
    competitiveAdvantage: 'Interface ultra-simple, IA pour catégorisation automatique, support client français.',
    pitchDeck: {
      slides: [
        { title: 'Problème', content: 'Test content', order: 1 },
        { title: 'Solution', content: 'Test content', order: 2 }
      ]
    },
    tone: 'professional',
    createdAt: new Date(),
    generatedBy: {
      provider: 'openai',
      model: 'gpt-4',
      usage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      }
    }
  }

  const defaultProps = {
    pitch: mockPitch,
    onSave: jest.fn(),
    onContinue: jest.fn(),
    onRegenerateSection: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the pitch preview with all sections', () => {
      render(<PitchPreview {...defaultProps} />)
      
      expect(screen.getByText('Aperçu de votre Pitch')).toBeInTheDocument()
      expect(screen.getByText('Tagline')).toBeInTheDocument()
      expect(screen.getByText('Problème')).toBeInTheDocument()
      expect(screen.getByText('Solution')).toBeInTheDocument()
      expect(screen.getByText('Marché Cible')).toBeInTheDocument()
      expect(screen.getByText('Modèle Économique')).toBeInTheDocument()
      expect(screen.getByText('Avantage Concurrentiel')).toBeInTheDocument()
    })

    it('displays pitch content correctly', () => {
      render(<PitchPreview {...defaultProps} />)
      
      expect(screen.getByText(mockPitch.tagline)).toBeInTheDocument()
      expect(screen.getByText(mockPitch.problem)).toBeInTheDocument()
      expect(screen.getByText(mockPitch.solution)).toBeInTheDocument()
      expect(screen.getByText(mockPitch.targetMarket)).toBeInTheDocument()
      expect(screen.getByText(mockPitch.businessModel)).toBeInTheDocument()
      expect(screen.getByText(mockPitch.competitiveAdvantage)).toBeInTheDocument()
    })

    it('shows quality score and metrics', () => {
      render(<PitchPreview {...defaultProps} />)
      
      expect(screen.getByText('Qualité du Pitch')).toBeInTheDocument()
      expect(screen.getByText('Complétude')).toBeInTheDocument()
      expect(screen.getByText('Clarté')).toBeInTheDocument()
      expect(screen.getByText('Engagement')).toBeInTheDocument()
    })

    it('displays continue button', () => {
      render(<PitchPreview {...defaultProps} />)
      
      expect(screen.getByText('Continuer vers le pitch complet')).toBeInTheDocument()
    })
  })

  describe('Quality Scoring', () => {
    it('calculates quality score based on content completeness', () => {
      const shortPitch = {
        ...mockPitch,
        tagline: 'Short',
        problem: 'Too short',
        solution: 'Brief'
      }
      
      render(<PitchPreview {...defaultProps} pitch={shortPitch} />)
      
      // Should show lower quality score for incomplete content
      expect(screen.getByText(/\/100/)).toBeInTheDocument()
    })

    it('shows quality suggestions for improvement', () => {
      const incompletePitch = {
        ...mockPitch,
        tagline: 'Short',
        problem: 'Brief problem',
        solution: 'Brief solution'
      }
      
      render(<PitchPreview {...defaultProps} pitch={incompletePitch} />)
      
      // Should show suggestions for improvement
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })

    it('displays high quality indicator for complete pitches', () => {
      render(<PitchPreview {...defaultProps} />)
      
      // With the mock pitch having good content, should show positive indicators
      const qualitySection = screen.getByText('Qualité du Pitch').closest('div')
      expect(qualitySection).toBeInTheDocument()
    })
  })

  describe('Section Editing', () => {
    it('enables editing mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<PitchPreview {...defaultProps} />)
      
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      expect(screen.getByTestId('textarea-edit-tagline')).toBeInTheDocument()
      expect(screen.getByText('Sauvegarder')).toBeInTheDocument()
      expect(screen.getByText('Annuler')).toBeInTheDocument()
    })

    it('saves section changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<PitchPreview {...defaultProps} />)
      
      // Enter edit mode
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      // Modify content
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'New tagline content')
      
      // Save changes
      await user.click(screen.getByText('Sauvegarder'))
      
      expect(screen.getByText('New tagline content')).toBeInTheDocument()
      expect(screen.getByText('Sauvegarder les modifications')).toBeInTheDocument()
    })

    it('cancels editing without saving changes', async () => {
      const user = userEvent.setup()
      render(<PitchPreview {...defaultProps} />)
      
      // Enter edit mode
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      // Modify content
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'New content that should not be saved')
      
      // Cancel changes
      await user.click(screen.getByText('Annuler'))
      
      // Should show original content
      expect(screen.getByText(mockPitch.tagline)).toBeInTheDocument()
      expect(screen.queryByText('New content that should not be saved')).not.toBeInTheDocument()
    })
  })

  describe('Section Regeneration', () => {
    it('calls onRegenerateSection when regenerate button is clicked', async () => {
      const user = userEvent.setup()
      const mockRegenerate = jest.fn().mockResolvedValue('New regenerated content')
      
      render(<PitchPreview {...defaultProps} onRegenerateSection={mockRegenerate} />)
      
      const regenerateButtons = screen.getAllByText('Régénérer')
      await user.click(regenerateButtons[0])
      
      expect(mockRegenerate).toHaveBeenCalledWith('tagline', mockPitch.tagline)
    })

    it('updates section content after successful regeneration', async () => {
      const user = userEvent.setup()
      const mockRegenerate = jest.fn().mockResolvedValue('Newly regenerated tagline')
      
      render(<PitchPreview {...defaultProps} onRegenerateSection={mockRegenerate} />)
      
      const regenerateButtons = screen.getAllByText('Régénérer')
      await user.click(regenerateButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Newly regenerated tagline')).toBeInTheDocument()
      })
    })

    it('shows loading state during regeneration', async () => {
      const user = userEvent.setup()
      const mockRegenerate = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<PitchPreview {...defaultProps} onRegenerateSection={mockRegenerate} />)
      
      const regenerateButtons = screen.getAllByText('Régénérer')
      await user.click(regenerateButtons[0])
      
      expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin')
    })

    it('handles regeneration errors gracefully', async () => {
      const user = userEvent.setup()
      const mockRegenerate = jest.fn().mockRejectedValue(new Error('Regeneration failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<PitchPreview {...defaultProps} onRegenerateSection={mockRegenerate} />)
      
      const regenerateButtons = screen.getAllByText('Régénérer')
      await user.click(regenerateButtons[0])
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to regenerate section:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Save and Continue Workflow', () => {
    it('shows save button when changes are made', async () => {
      const user = userEvent.setup()
      render(<PitchPreview {...defaultProps} />)
      
      // Make a change
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'Modified content')
      await user.click(screen.getByText('Sauvegarder'))
      
      expect(screen.getByText('Sauvegarder les modifications')).toBeInTheDocument()
    })

    it('calls onSave with updated pitch when save button is clicked', async () => {
      const user = userEvent.setup()
      const mockSave = jest.fn().mockResolvedValue(undefined)
      
      render(<PitchPreview {...defaultProps} onSave={mockSave} />)
      
      // Make a change
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'Updated tagline')
      await user.click(screen.getByText('Sauvegarder'))
      
      // Save changes
      await user.click(screen.getByText('Sauvegarder les modifications'))
      
      expect(mockSave).toHaveBeenCalledWith({
        ...mockPitch,
        tagline: 'Updated tagline'
      })
    })

    it('calls onContinue when continue button is clicked', async () => {
      const user = userEvent.setup()
      const mockContinue = jest.fn()
      
      render(<PitchPreview {...defaultProps} onContinue={mockContinue} />)
      
      await user.click(screen.getByText('Continuer vers le pitch complet'))
      
      expect(mockContinue).toHaveBeenCalled()
    })

    it('shows loading state during save operation', async () => {
      const user = userEvent.setup()
      const mockSave = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<PitchPreview {...defaultProps} onSave={mockSave} />)
      
      // Make a change to show save button
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')
      await user.click(screen.getByText('Sauvegarder'))
      
      // Click save
      await user.click(screen.getByText('Sauvegarder les modifications'))
      
      expect(screen.getByText('Sauvegarde...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels and structure', () => {
      render(<PitchPreview {...defaultProps} />)
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /aperçu de votre pitch/i })).toBeInTheDocument()
      
      // Check for proper button labels
      expect(screen.getAllByRole('button', { name: /modifier/i })).toHaveLength(6)
      expect(screen.getAllByRole('button', { name: /régénérer/i })).toHaveLength(6)
    })

    it('maintains focus management during editing', async () => {
      const user = userEvent.setup()
      render(<PitchPreview {...defaultProps} />)
      
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      const textarea = screen.getByTestId('textarea-edit-tagline')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing pitch data gracefully', () => {
      const incompletePitch = {
        ...mockPitch,
        tagline: '',
        problem: '',
        solution: ''
      }
      
      render(<PitchPreview {...defaultProps} pitch={incompletePitch} />)
      
      expect(screen.getByText('Tagline')).toBeInTheDocument()
      expect(screen.getByText('Problème')).toBeInTheDocument()
      expect(screen.getByText('Solution')).toBeInTheDocument()
    })

    it('handles save errors gracefully', async () => {
      const user = userEvent.setup()
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'))
      
      render(<PitchPreview {...defaultProps} onSave={mockSave} />)
      
      // Make a change
      const editButtons = screen.getAllByText('Modifier')
      await user.click(editButtons[0])
      
      const textarea = screen.getByTestId('textarea-edit-tagline')
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')
      await user.click(screen.getByText('Sauvegarder'))
      
      // Try to save
      await user.click(screen.getByText('Sauvegarder les modifications'))
      
      // Should handle error gracefully (component should not crash)
      expect(screen.getByText('Continuer vers le pitch complet')).toBeInTheDocument()
    })
  })
})