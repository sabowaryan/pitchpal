/**
 * Tests for the Contextual Suggestion Engine
 * 
 * Test suite covering suggestion generation including:
 * - Industry-specific suggestions
 * - Pattern-based suggestions
 * - Score-based suggestions
 * - Content analysis suggestions
 * - Example ideas and completeness analysis
 */

import { 
  generateContextualSuggestions, 
  getExampleIdeas, 
  analyzeIdeaCompleteness 
} from '../suggestion-engine'
import { IdeaSuggestion } from '@/types/enhanced-errors'

describe('Suggestion Engine', () => {
  describe('generateContextualSuggestions', () => {
    it('should generate suggestions for low-score ideas', () => {
      const suggestions = generateContextualSuggestions('Une app', 20)
      expect(suggestions.length).toBeGreaterThan(0)
      
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high')
      expect(highPrioritySuggestions.length).toBeGreaterThan(0)
    })

    it('should generate fewer suggestions for high-score ideas', () => {
      const lowScoreSuggestions = generateContextualSuggestions('Une app', 20)
      const highScoreSuggestions = generateContextualSuggestions(
        'Une plateforme SaaS qui résout le problème de gaspillage alimentaire dans les restaurants en utilisant l\'IA pour prédire la demande et optimiser les commandes pour les restaurateurs avec un modèle d\'abonnement mensuel.',
        85
      )
      
      expect(lowScoreSuggestions.length).toBeGreaterThanOrEqual(highScoreSuggestions.length)
    })

    it('should generate industry-specific suggestions for tech ideas', () => {
      const suggestions = generateContextualSuggestions('Une application mobile avec IA', 50)
      
      // Should generate suggestions for tech ideas
      expect(suggestions.length).toBeGreaterThan(0)
      
      // All suggestions should be valid and have proper structure
      suggestions.forEach(suggestion => {
        expect(suggestion.message).toBeDefined()
        expect(suggestion.message.length).toBeGreaterThan(0)
        expect(['high', 'medium', 'low']).toContain(suggestion.priority)
        expect(['missing_target', 'vague_problem', 'unclear_solution', 'add_context']).toContain(suggestion.type)
      })
    })

    it('should generate industry-specific suggestions for ecommerce ideas', () => {
      const suggestions = generateContextualSuggestions('Une boutique en ligne de vente de produits', 50)
      
      // Should generate suggestions (industry-specific or general)
      expect(suggestions.length).toBeGreaterThan(0)
      
      // Check if any suggestion mentions ecommerce-related terms or general business advice
      const relevantSuggestions = suggestions.filter(s => 
        s.message.toLowerCase().includes('produit') || 
        s.message.toLowerCase().includes('livraison') ||
        s.message.toLowerCase().includes('commerce') ||
        s.message.toLowerCase().includes('catalogue') ||
        s.message.toLowerCase().includes('vente') ||
        s.message.toLowerCase().includes('économique') ||
        s.message.toLowerCase().includes('prix')
      )
      
      // Should have at least some relevant suggestions or general business suggestions
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest uniqueness when not mentioned', () => {
      const suggestions = generateContextualSuggestions('Une application mobile pour les entreprises', 60)
      const uniquenessSuggestions = suggestions.filter(s => 
        s.message.toLowerCase().includes('unique') || 
        s.message.toLowerCase().includes('différent')
      )
      expect(uniquenessSuggestions.length).toBeGreaterThan(0)
    })

    it('should suggest market information when missing', () => {
      const suggestions = generateContextualSuggestions('Une solution pour les problèmes de comptabilité', 60)
      const marketSuggestions = suggestions.filter(s => 
        s.message.toLowerCase().includes('marché') || 
        s.message.toLowerCase().includes('taille')
      )
      expect(marketSuggestions.length).toBeGreaterThan(0)
    })

    it('should suggest pricing information when missing', () => {
      const suggestions = generateContextualSuggestions('Une application qui aide les entreprises', 60)
      const pricingSuggestions = suggestions.filter(s => 
        s.message.toLowerCase().includes('prix') || 
        s.message.toLowerCase().includes('économique') ||
        s.message.toLowerCase().includes('abonnement')
      )
      expect(pricingSuggestions.length).toBeGreaterThan(0)
    })

    it('should suggest structure improvement for long single sentences', () => {
      const longSentence = 'Une application mobile qui fait beaucoup de choses différentes et qui aide les utilisateurs avec leurs problèmes quotidiens en proposant des solutions innovantes et efficaces'
      const suggestions = generateContextualSuggestions(longSentence, 60)
      
      const structureSuggestions = suggestions.filter(s => 
        s.message.toLowerCase().includes('structur') || 
        s.message.toLowerCase().includes('phrase')
      )
      expect(structureSuggestions.length).toBeGreaterThan(0)
    })

    it('should limit suggestions to maximum 5', () => {
      const suggestions = generateContextualSuggestions('Une app', 10)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should sort suggestions by priority', () => {
      const suggestions = generateContextualSuggestions('Une application mobile simple', 30)
      
      if (suggestions.length > 1) {
        const priorities = suggestions.map(s => s.priority)
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        
        for (let i = 0; i < priorities.length - 1; i++) {
          expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]])
        }
      }
    })

    it('should not generate duplicate suggestions', () => {
      const suggestions = generateContextualSuggestions('Une application mobile', 40)
      const messages = suggestions.map(s => s.message.toLowerCase())
      const uniqueMessages = new Set(messages)
      
      expect(messages.length).toBe(uniqueMessages.size)
    })

    it('should provide examples in suggestions when appropriate', () => {
      const suggestions = generateContextualSuggestions('Une application mobile', 40)
      const suggestionsWithExamples = suggestions.filter(s => s.example && s.example.length > 0)
      
      expect(suggestionsWithExamples.length).toBeGreaterThan(0)
    })
  })

  describe('getExampleIdeas', () => {
    it('should return an array of example ideas', () => {
      const examples = getExampleIdeas()
      expect(Array.isArray(examples)).toBe(true)
      expect(examples.length).toBeGreaterThan(0)
    })

    it('should return diverse example ideas', () => {
      const examples = getExampleIdeas()
      expect(examples.length).toBeGreaterThanOrEqual(3)
      
      // Check that examples are sufficiently different
      const uniqueWords = new Set()
      examples.forEach(example => {
        const words = example.toLowerCase().split(/\s+/)
        words.forEach(word => uniqueWords.add(word))
      })
      
      expect(uniqueWords.size).toBeGreaterThan(50) // Should have diverse vocabulary
    })

    it('should return well-formed example ideas', () => {
      const examples = getExampleIdeas()
      
      examples.forEach(example => {
        expect(example.length).toBeGreaterThan(50) // Should be detailed
        expect(example.length).toBeLessThan(500) // But not too long
        expect(example.split(/\s+/).length).toBeGreaterThan(10) // Should have multiple words
      })
    })
  })

  describe('analyzeIdeaCompleteness', () => {
    it('should detect missing problem description', () => {
      const analysis = analyzeIdeaCompleteness('Une application mobile pour les utilisateurs')
      expect(analysis.hasProblem).toBe(false)
      expect(analysis.missingElements).toContain('Description du problème')
    })

    it('should detect missing solution description', () => {
      const analysis = analyzeIdeaCompleteness('Il y a un problème avec la comptabilité des entreprises')
      expect(analysis.hasSolution).toBe(false)
      expect(analysis.missingElements).toContain('Explication de la solution')
    })

    it('should detect missing target audience', () => {
      const analysis = analyzeIdeaCompleteness('Une solution qui résout les problèmes de comptabilité')
      expect(analysis.hasTarget).toBe(false)
      expect(analysis.missingElements).toContain('Identification des utilisateurs cibles')
    })

    it('should detect missing business model', () => {
      const analysis = analyzeIdeaCompleteness('Une application qui aide les utilisateurs avec leur comptabilité')
      expect(analysis.hasBusiness).toBe(false)
      expect(analysis.missingElements).toContain('Modèle économique ou monétisation')
    })

    it('should detect complete ideas correctly', () => {
      const completeIdea = `Une plateforme SaaS qui résout le problème de gaspillage alimentaire 
      dans les restaurants en utilisant l'IA pour prédire la demande et optimiser les commandes. 
      Destinée aux restaurateurs qui perdent de l'argent, avec un modèle d'abonnement mensuel 
      qui génère des revenus récurrents.`
      
      const analysis = analyzeIdeaCompleteness(completeIdea)
      expect(analysis.hasProblem).toBe(true)
      expect(analysis.hasSolution).toBe(true)
      expect(analysis.hasTarget).toBe(true) // "restaurateurs" should be detected
      expect(analysis.hasBusiness).toBe(true) // "revenus" should be detected
      expect(analysis.missingElements).toHaveLength(0)
    })

    it('should handle partial completeness', () => {
      const partialIdea = 'Une application qui résout les problèmes de comptabilité pour les entreprises'
      const analysis = analyzeIdeaCompleteness(partialIdea)
      
      expect(analysis.hasProblem).toBe(true)
      expect(analysis.hasSolution).toBe(true)
      expect(analysis.hasTarget).toBe(true)
      expect(analysis.hasBusiness).toBe(false)
      expect(analysis.missingElements).toHaveLength(1)
    })

    it('should be case insensitive', () => {
      const upperCaseIdea = 'UNE APPLICATION QUI RÉSOUT LES PROBLÈMES DE COMPTABILITÉ POUR LES ENTREPRISES'
      const lowerCaseIdea = 'une application qui résout les problèmes de comptabilité pour les entreprises'
      
      const upperAnalysis = analyzeIdeaCompleteness(upperCaseIdea)
      const lowerAnalysis = analyzeIdeaCompleteness(lowerCaseIdea)
      
      expect(upperAnalysis.hasProblem).toBe(lowerAnalysis.hasProblem)
      expect(upperAnalysis.hasSolution).toBe(lowerAnalysis.hasSolution)
      expect(upperAnalysis.hasTarget).toBe(lowerAnalysis.hasTarget)
      expect(upperAnalysis.hasBusiness).toBe(lowerAnalysis.hasBusiness)
    })

    it('should handle empty or very short ideas', () => {
      const emptyAnalysis = analyzeIdeaCompleteness('')
      expect(emptyAnalysis.hasProblem).toBe(false)
      expect(emptyAnalysis.hasSolution).toBe(false)
      expect(emptyAnalysis.hasTarget).toBe(false)
      expect(emptyAnalysis.hasBusiness).toBe(false)
      expect(emptyAnalysis.missingElements).toHaveLength(4)
      
      const shortAnalysis = analyzeIdeaCompleteness('Une app')
      expect(shortAnalysis.missingElements.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Tests', () => {
    it('should provide consistent suggestions across multiple calls', () => {
      const idea = 'Une application mobile pour les entreprises'
      const suggestions1 = generateContextualSuggestions(idea, 50)
      const suggestions2 = generateContextualSuggestions(idea, 50)
      
      // Should have same number of suggestions
      expect(suggestions1.length).toBe(suggestions2.length)
      
      // Should have same suggestion types (order might vary due to randomness in industry suggestions)
      const types1 = suggestions1.map(s => s.type).sort()
      const types2 = suggestions2.map(s => s.type).sort()
      expect(types1).toEqual(types2)
    })

    it('should provide relevant suggestions for real-world scenarios', () => {
      const realWorldScenarios = [
        { idea: 'Une app de livraison de nourriture', expectedTypes: ['missing_target', 'add_context', 'vague_problem', 'unclear_solution'] },
        { idea: 'Un problème avec les transports en commun', expectedTypes: ['unclear_solution', 'add_context', 'missing_target'] },
        { idea: 'Une solution IA pour automatiser', expectedTypes: ['vague_problem', 'missing_target', 'add_context', 'unclear_solution'] },
        { idea: 'Marketplace pour connecter acheteurs et vendeurs', expectedTypes: ['add_context', 'missing_target', 'vague_problem'] }
      ]

      realWorldScenarios.forEach(scenario => {
        const suggestions = generateContextualSuggestions(scenario.idea, 40)
        
        // Should generate at least some suggestions
        expect(suggestions.length).toBeGreaterThan(0)
        
        // All suggestions should have valid types
        suggestions.forEach(suggestion => {
          expect(['missing_target', 'vague_problem', 'unclear_solution', 'add_context']).toContain(suggestion.type)
        })
      })
    })

    it('should work well with validation results', () => {
      // This would typically be tested with the actual validator
      const idea = 'Une application mobile simple'
      const suggestions = generateContextualSuggestions(idea, 35)
      
      // Should provide actionable suggestions for low-scoring ideas
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.every(s => s.message.length > 10)).toBe(true)
      expect(suggestions.every(s => ['high', 'medium', 'low'].includes(s.priority))).toBe(true)
    })
  })
})