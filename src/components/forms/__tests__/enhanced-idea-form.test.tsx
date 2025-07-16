/**
 * Tests for EnhancedIdeaForm Component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EnhancedIdeaForm } from '../enhanced-idea-form'

// Mock the validation functions
jest.mock('@/lib/validation/idea-validator', () => ({
  validateIdea: jest.fn((idea: string) => ({
    isValid: idea.length >= 10,
    score: idea.length >= 10 ? 75 : 0,
    errors: idea.length < 10 ? [{ field: 'idea', type: 'minLength', message: 'Too short' }] : [],
    warnings: [],
    suggestions: idea.length >= 10 ? [{ type: 'add_context', message: 'Add more context', priority: 'medium' }] : []
  }))
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  MAX_IDEA_LENGTH: 500,
  MIN_IDEA_LENGTH: 10
}))

describe('EnhancedIdeaForm', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders the form with all elements', () => {
    render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Décrivez votre idée')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('Longueur:')).toBeInTheDocument()
  })

  it('calls onChange when textarea value changes', () => {
    render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
      />
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New idea text' } })

    expect(mockOnChange).toHaveBeenCalledWith('New idea text')
  })

  it('displays validation feedback by default', () => {
    render(
      <EnhancedIdeaForm
        value="Short text that meets minimum requirements for validation"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Longueur:')).toBeInTheDocument()
    expect(screen.getByText('Add more context')).toBeInTheDocument()
  })

  it('hides validation feedback when showValidationFeedback is false', () => {
    render(
      <EnhancedIdeaForm
        value="Short text that meets minimum requirements for validation"
        onChange={mockOnChange}
        showValidationFeedback={false}
      />
    )

    expect(screen.queryByText('Longueur:')).not.toBeInTheDocument()
  })

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = 'Custom placeholder text'
    render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
        placeholder={customPlaceholder}
      />
    )

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-describedby', 'idea-validation-feedback')
  })

  it('respects maxLength attribute', () => {
    render(
      <EnhancedIdeaForm
        value=""
        onChange={mockOnChange}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('maxLength', '500')
  })

  it('shows validation errors for short text', () => {
    render(
      <EnhancedIdeaForm
        value="Short"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('shows quality score for valid text', () => {
    render(
      <EnhancedIdeaForm
        value="This is a longer text that meets the minimum requirements"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
    expect(screen.getByText('Qualité de l\'idée')).toBeInTheDocument()
  })
})