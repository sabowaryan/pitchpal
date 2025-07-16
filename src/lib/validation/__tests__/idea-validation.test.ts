/**
 * Tests for the idea validation system
 */

import { 
  validateIdea, 
  getSuggestions, 
  calculateIdeaScore,
  validateIdeaLength,
  validateIdeaFormat
} from '../idea-validation'

describe('Idea Validation System', () => {
  describe('validateIdea', () => {
    it('should validate empty ideas', () => {
      const result = validateIdea('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('required')
      expect(result.score).toBe(0)
    })

    it('should validate short ideas', () => {
      const result = validateIdea('App')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('minLength')
      expect(result.score).toBeLessThan(50)
    })

    it('should validate very long ideas', () => {
      const longIdea = 'Une application mobile '.repeat(50)
      const result = validateIdea(longIdea)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('maxLength')
    })

    it('should validate ideas with invalid characters', () => {
      const result = validateIdea('App with <script>alert("XSS")</script>')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('format')
    })

    it('should validate valid ideas', () => {
      const result = validateIdea('Une application mobile pour résoudre le problème de transport urbain')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.score).toBeGreaterThan(0)
    })

    it('should include warnings for suboptimal ideas', () => {
      const result = validateIdea('Une application mobile simple')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].type).toBe('quality')
    })
  })

  describe('getSuggestions', () => {
    it('should provide suggestions for vague ideas', () => {
      const suggestions = getSuggestions('Une application')
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.type === 'vague_problem')).toBe(true)
    })

    it('should provide suggestions for ideas missing target market', () => {
      const suggestions = getSuggestions('Une application pour résoudre les problèmes de comptabilité')
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.type === 'missing_target')).toBe(true)
    })

    it('should provide suggestions for ideas with unclear solution', () => {
      const suggestions = getSuggestions('Les entreprises ont des problèmes de comptabilité')
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.type === 'unclear_solution')).toBe(true)
    })

    it('should provide context suggestions for incomplete ideas', () => {
      const suggestions = getSuggestions('Une application de comptabilité')
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.type === 'add_context')).toBe(true)
    })

    it('should limit suggestions to maximum 5', () => {
      const suggestions = getSuggestions('app')
      
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should prioritize suggestions by importance', () => {
      const suggestions = getSuggestions('Une application')
      
      // High priority suggestions should come first
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high')
      const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium')
      
      if (highPrioritySuggestions.length > 0 && mediumPrioritySuggestions.length > 0) {
        const firstHighIndex = suggestions.findIndex(s => s.priority === 'high')
        const firstMediumIndex = suggestions.findIndex(s => s.priority === 'medium')
        expect(firstHighIndex).toBeLessThan(firstMediumIndex)
      }
    })

    it('should provide minimal suggestions for high quality ideas', () => {
      const suggestions = getSuggestions(
        'Une application mobile qui résout le problème de transport urbain en connectant les employés avec des solutions de covoiturage pour les entreprises de plus de 100 employés'
      )
      
      expect(suggestions.length).toBeLessThanOrEqual(2)
    })
  })

  describe('calculateIdeaScore', () => {
    it('should score empty ideas as 0', () => {
      expect(calculateIdeaScore('')).toBe(0)
    })

    it('should score short ideas with low scores', () => {
      expect(calculateIdeaScore('App')).toBeLessThan(30)
    })

    it('should score medium quality ideas appropriately', () => {
      const score = calculateIdeaScore('Une application mobile pour la comptabilité')
      expect(score).toBeGreaterThanOrEqual(30)
      expect(score).toBeLessThan(70)
    })

    it('should score high quality ideas with high scores', () => {
      const score = calculateIdeaScore(
        'Une application mobile de comptabilité qui automatise la saisie des factures pour les PME de moins de 50 employés'
      )
      expect(score).toBeGreaterThanOrEqual(70)
    })

    it('should consider idea length in scoring', () => {
      const shortIdea = 'Application de comptabilité'
      const longIdea = 'Une application mobile de comptabilité qui automatise la saisie des factures'
      
      expect(calculateIdeaScore(longIdea)).toBeGreaterThan(calculateIdeaScore(shortIdea))
    })

    it('should consider keyword presence in scoring', () => {
      const basicIdea = 'Une application de comptabilité'
      const ideaWithKeywords = 'Une application de comptabilité qui résout le problème de saisie manuelle pour les PME'
      
      expect(calculateIdeaScore(ideaWithKeywords)).toBeGreaterThan(calculateIdeaScore(basicIdea))
    })
  })

  describe('validateIdeaLength', () => {
    it('should validate minimum length', () => {
      expect(validateIdeaLength('', 10).isValid).toBe(false)
      expect(validateIdeaLength('Short', 10).isValid).toBe(false)
      expect(validateIdeaLength('Long enough text here', 10).isValid).toBe(true)
    })

    it('should validate maximum length', () => {
      const longText = 'Very long text '.repeat(50)
      expect(validateIdeaLength(longText, 10, 200).isValid).toBe(false)
    })

    it('should return appropriate error messages', () => {
      const tooShort = validateIdeaLength('Short', 10)
      expect(tooShort.isValid).toBe(false)
      expect(tooShort.errors[0].message).toContain('au moins 10 caractères')
      
      const tooLong = validateIdeaLength('Very long text '.repeat(50), 10, 200)
      expect(tooLong.isValid).toBe(false)
      expect(tooLong.errors[0].message).toContain('maximum 200 caractères')
    })
  })

  describe('validateIdeaFormat', () => {
    it('should validate ideas with script tags', () => {
      const result = validateIdeaFormat('App with <script>alert("XSS")</script>')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('caractères non autorisés')
    })

    it('should validate ideas with excessive special characters', () => {
      const result = validateIdeaFormat('App with @#$%^&*()_+{}|:"<>?~`')
      expect(result.isValid).toBe(false)
    })

    it('should allow normal punctuation and accented characters', () => {
      const result = validateIdeaFormat('Une application de comptabilité pour les PME, avec des fonctionnalités avancées! Idéal pour les équipes françaises.')
      expect(result.isValid).toBe(true)
    })
  })
})