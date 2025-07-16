/**
 * Contextual Suggestion Engine
 * 
 * This module provides intelligent suggestions to help users improve their pitch ideas
 * based on content analysis, industry patterns, and best practices.
 */

import { IdeaSuggestion } from '@/types/enhanced-errors'

// Industry-specific keywords and patterns
const INDUSTRY_PATTERNS = {
  TECH: {
    keywords: ['app', 'software', 'platform', 'ai', 'ml', 'saas', 'api', 'cloud', 'mobile', 'web'],
    suggestions: [
      'Mentionnez la technologie utilisée (IA, blockchain, etc.)',
      'Précisez si c\'est une app mobile, web, ou les deux',
      'Indiquez le type d\'architecture (SaaS, marketplace, etc.)'
    ]
  },
  ECOMMERCE: {
    keywords: ['vente', 'boutique', 'marketplace', 'commerce', 'achat', 'produit', 'livraison'],
    suggestions: [
      'Décrivez votre catalogue de produits',
      'Mentionnez votre stratégie de livraison',
      'Précisez votre modèle de revenus (commission, abonnement, etc.)'
    ]
  },
  SERVICE: {
    keywords: ['service', 'consultation', 'accompagnement', 'formation', 'conseil'],
    suggestions: [
      'Détaillez les services proposés',
      'Mentionnez votre expertise ou certification',
      'Précisez votre modèle tarifaire'
    ]
  },
  HEALTH: {
    keywords: ['santé', 'médical', 'bien-être', 'fitness', 'nutrition', 'thérapie'],
    suggestions: [
      'Mentionnez les bénéfices santé spécifiques',
      'Précisez si vous avez des certifications médicales',
      'Indiquez votre approche (préventive, curative, etc.)'
    ]
  }
} as const

// Common pitch improvement patterns
const IMPROVEMENT_PATTERNS = [
  {
    trigger: (idea: string) => !idea.toLowerCase().includes('différent') && !idea.toLowerCase().includes('unique'),
    suggestion: {
      type: 'add_context' as const,
      message: 'Expliquez ce qui rend votre solution unique',
      example: 'Ex: "contrairement aux solutions existantes, nous..."',
      priority: 'medium' as const
    }
  },
  {
    trigger: (idea: string) => !idea.toLowerCase().includes('marché') && !idea.toLowerCase().includes('taille'),
    suggestion: {
      type: 'add_context' as const,
      message: 'Mentionnez la taille ou le potentiel de votre marché',
      example: 'Ex: "sur un marché de X millions d\'euros..."',
      priority: 'low' as const
    }
  },
  {
    trigger: (idea: string) => {
      const lowerIdea = idea.toLowerCase()
      return !lowerIdea.includes('€') && !lowerIdea.includes('euro') && 
             !lowerIdea.includes('prix') && !lowerIdea.includes('coût')
    },
    suggestion: {
      type: 'add_context' as const,
      message: 'Indiquez votre stratégie de prix ou modèle économique',
      example: 'Ex: "avec un abonnement mensuel de X€..."',
      priority: 'medium' as const
    }
  },
  {
    trigger: (idea: string) => {
      const sentences = idea.split(/[.!?]+/).filter(s => s.trim().length > 0)
      return sentences.length === 1 && idea.length > 100
    },
    suggestion: {
      type: 'unclear_solution' as const,
      message: 'Structurez votre idée en plusieurs phrases pour plus de clarté',
      example: 'Séparez le problème, la solution, et les bénéfices',
      priority: 'medium' as const
    }
  }
]

/**
 * Generate contextual suggestions based on idea content and patterns
 */
export function generateContextualSuggestions(idea: string, currentScore: number): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []
  const lowerIdea = idea.toLowerCase()

  // Industry-specific suggestions
  const industrySuggestions = getIndustrySuggestions(lowerIdea)
  suggestions.push(...industrySuggestions)

  // Pattern-based suggestions
  const patternSuggestions = getPatternSuggestions(idea)
  suggestions.push(...patternSuggestions)

  // Score-based suggestions
  const scoreSuggestions = getScoreBasedSuggestions(idea, currentScore)
  suggestions.push(...scoreSuggestions)

  // Content analysis suggestions
  const contentSuggestions = getContentAnalysisSuggestions(lowerIdea)
  suggestions.push(...contentSuggestions)

  // Remove duplicates and sort by priority
  const uniqueSuggestions = removeDuplicateSuggestions(suggestions)
  return sortSuggestionsByPriority(uniqueSuggestions).slice(0, 5)
}

/**
 * Get industry-specific suggestions based on detected keywords
 */
function getIndustrySuggestions(lowerIdea: string): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []

  for (const [industry, config] of Object.entries(INDUSTRY_PATTERNS)) {
    const hasIndustryKeywords = config.keywords.some(keyword => 
      lowerIdea.includes(keyword)
    )

    if (hasIndustryKeywords) {
      // Add random suggestion from industry-specific suggestions
      const randomSuggestion = config.suggestions[Math.floor(Math.random() * config.suggestions.length)]
      suggestions.push({
        type: 'add_context',
        message: randomSuggestion,
        priority: 'medium'
      })
      break // Only add one industry suggestion
    }
  }

  return suggestions
}

/**
 * Get suggestions based on improvement patterns
 */
function getPatternSuggestions(idea: string): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []

  for (const pattern of IMPROVEMENT_PATTERNS) {
    if (pattern.trigger(idea)) {
      suggestions.push(pattern.suggestion)
    }
  }

  return suggestions
}

/**
 * Get suggestions based on current quality score
 */
function getScoreBasedSuggestions(idea: string, score: number): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []

  if (score < 30) {
    suggestions.push({
      type: 'vague_problem',
      message: 'Votre idée manque de détails essentiels',
      example: 'Décrivez clairement: le problème, votre solution, et vos utilisateurs',
      priority: 'high'
    })
  } else if (score < 50) {
    suggestions.push({
      type: 'unclear_solution',
      message: 'Développez davantage votre solution',
      example: 'Expliquez comment votre solution fonctionne concrètement',
      priority: 'high'
    })
  } else if (score < 70) {
    suggestions.push({
      type: 'add_context',
      message: 'Ajoutez des éléments de différenciation',
      example: 'Mentionnez vos avantages concurrentiels ou votre expertise',
      priority: 'medium'
    })
  } else if (score >= 80) {
    suggestions.push({
      type: 'add_context',
      message: 'Excellente idée! Vous pourriez ajouter des métriques ou objectifs',
      example: 'Ex: "avec pour objectif de toucher X utilisateurs en Y mois"',
      priority: 'low'
    })
  }

  return suggestions
}

/**
 * Get suggestions based on content analysis
 */
function getContentAnalysisSuggestions(lowerIdea: string): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []

  // Check for emotional connection
  const emotionalWords = ['frustrant', 'difficile', 'compliqué', 'ennuyeux', 'stressant', 'pénible']
  const hasEmotionalContext = emotionalWords.some(word => lowerIdea.includes(word))
  
  if (!hasEmotionalContext && lowerIdea.length > 50) {
    suggestions.push({
      type: 'vague_problem',
      message: 'Ajoutez une dimension émotionnelle au problème',
      example: 'Ex: "ce qui est frustrant pour les utilisateurs..." ou "ce qui leur fait perdre du temps..."',
      priority: 'low'
    })
  }

  // Check for quantifiable elements
  const hasNumbers = /\d+/.test(lowerIdea)
  const hasPercentage = lowerIdea.includes('%')
  
  if (!hasNumbers && !hasPercentage && lowerIdea.length > 80) {
    suggestions.push({
      type: 'add_context',
      message: 'Ajoutez des données chiffrées pour renforcer votre argumentaire',
      example: 'Ex: "économise 30% de temps" ou "réduit les coûts de 50%"',
      priority: 'low'
    })
  }

  // Check for action verbs
  const actionVerbs = ['créer', 'développer', 'construire', 'lancer', 'proposer', 'offrir']
  const hasActionVerbs = actionVerbs.some(verb => lowerIdea.includes(verb))
  
  if (!hasActionVerbs) {
    suggestions.push({
      type: 'unclear_solution',
      message: 'Utilisez des verbes d\'action pour décrire votre solution',
      example: 'Ex: "nous développons", "nous proposons", "nous créons"',
      priority: 'medium'
    })
  }

  return suggestions
}

/**
 * Remove duplicate suggestions based on message content
 */
function removeDuplicateSuggestions(suggestions: IdeaSuggestion[]): IdeaSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter(suggestion => {
    const key = suggestion.message.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Sort suggestions by priority (high -> medium -> low)
 */
function sortSuggestionsByPriority(suggestions: IdeaSuggestion[]): IdeaSuggestion[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

/**
 * Get example ideas for inspiration
 */
export function getExampleIdeas(): string[] {
  return [
    "Une application mobile qui aide les petites entreprises à gérer leur comptabilité de manière simple et automatisée, en se connectant directement à leurs comptes bancaires pour catégoriser les transactions.",
    "Une plateforme SaaS qui permet aux restaurants de réduire le gaspillage alimentaire en prédisant la demande grâce à l'IA et en optimisant les commandes d'ingrédients.",
    "Un service de livraison de repas sains et personnalisés pour les travailleurs en télétravail, avec des menus adaptés à leurs objectifs nutritionnels et contraintes alimentaires.",
    "Une marketplace qui connecte les propriétaires d'espaces inutilisés (garages, caves, greniers) avec des particuliers cherchant des solutions de stockage temporaire à prix abordable.",
    "Un outil de formation en ligne qui utilise la réalité virtuelle pour enseigner les gestes de premiers secours, permettant une pratique immersive sans risque."
  ]
}

/**
 * Analyze idea completeness and return missing elements
 */
export function analyzeIdeaCompleteness(idea: string): {
  hasProblem: boolean
  hasSolution: boolean
  hasTarget: boolean
  hasBusiness: boolean
  missingElements: string[]
} {
  const lowerIdea = idea.toLowerCase()
  
  const problemKeywords = ['problème', 'difficulté', 'challenge', 'issue', 'manque', 'besoin']
  const solutionKeywords = ['solution', 'résout', 'aide', 'permet', 'propose', 'offre']
  const targetKeywords = ['utilisateurs', 'clients', 'entreprises', 'personnes', 'marché', 'restaurateurs', 'restaurants', 'entrepreneurs', 'professionnels', 'particuliers']
  const businessKeywords = ['revenus', 'monétisation', 'abonnement', 'vente', 'prix']

  const hasProblem = problemKeywords.some(keyword => lowerIdea.includes(keyword))
  const hasSolution = solutionKeywords.some(keyword => lowerIdea.includes(keyword))
  const hasTarget = targetKeywords.some(keyword => lowerIdea.includes(keyword))
  const hasBusiness = businessKeywords.some(keyword => lowerIdea.includes(keyword))

  const missingElements: string[] = []
  if (!hasProblem) missingElements.push('Description du problème')
  if (!hasSolution) missingElements.push('Explication de la solution')
  if (!hasTarget) missingElements.push('Identification des utilisateurs cibles')
  if (!hasBusiness) missingElements.push('Modèle économique ou monétisation')

  return {
    hasProblem,
    hasSolution,
    hasTarget,
    hasBusiness,
    missingElements
  }
}