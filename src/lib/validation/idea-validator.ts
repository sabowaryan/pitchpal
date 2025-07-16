/**
 * Real-time Idea Validation System
 * 
 * This module provides comprehensive validation for pitch ideas including:
 * - Length and format validation
 * - Content quality scoring (0-100)
 * - Contextual suggestions for improvement
 * - Real-time feedback for user input
 */

import { ValidationResult, ValidationError, ValidationWarning, IdeaSuggestion } from '@/types/enhanced-errors'

// Validation constants
const VALIDATION_CONSTANTS = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 500,
  OPTIMAL_MIN_LENGTH: 50,
  OPTIMAL_MAX_LENGTH: 200,
  MIN_WORDS: 3,
  OPTIMAL_MIN_WORDS: 10,
  SCORE_WEIGHTS: {
    LENGTH: 20,
    STRUCTURE: 25,
    CLARITY: 25,
    COMPLETENESS: 30
  }
} as const

// Keywords that indicate different aspects of a good pitch idea
const QUALITY_INDICATORS = {
  PROBLEM_KEYWORDS: [
    'problem', 'issue', 'challenge', 'difficulty', 'pain', 'struggle',
    'frustration', 'inefficient', 'expensive', 'slow', 'complicated'
  ],
  SOLUTION_KEYWORDS: [
    'solution', 'solve', 'fix', 'improve', 'optimize', 'streamline',
    'automate', 'simplify', 'reduce', 'increase', 'enhance'
  ],
  TARGET_KEYWORDS: [
    'users', 'customers', 'businesses', 'companies', 'people', 'market',
    'audience', 'clients', 'consumers', 'professionals'
  ],
  BUSINESS_KEYWORDS: [
    'revenue', 'profit', 'monetize', 'subscription', 'freemium', 'saas',
    'marketplace', 'platform', 'service', 'product'
  ]
} as const

/**
 * Main validation function that performs comprehensive idea validation
 */
export function validateIdea(idea: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: IdeaSuggestion[] = []

  // Basic format validation
  const formatValidation = validateFormat(idea)
  errors.push(...formatValidation.errors)
  warnings.push(...formatValidation.warnings)

  // Content quality validation
  const contentValidation = validateContent(idea)
  warnings.push(...contentValidation.warnings)
  suggestions.push(...contentValidation.suggestions)

  // Calculate overall score
  const score = calculateQualityScore(idea, errors, warnings)

  // Generate contextual suggestions
  const contextualSuggestions = generateContextualSuggestions(idea, score)
  suggestions.push(...contextualSuggestions)

  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
    suggestions: suggestions.slice(0, 5) // Limit to top 5 suggestions
  }
}

/**
 * Validates basic format requirements (length, characters, etc.)
 */
function validateFormat(idea: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const trimmedIdea = idea.trim()
  const wordCount = trimmedIdea.split(/\s+/).filter(word => word.length > 0).length

  // Required validations (errors)
  if (trimmedIdea.length === 0) {
    errors.push({
      field: 'idea',
      type: 'required',
      message: 'Une idée est requise pour générer un pitch'
    })
  } else if (trimmedIdea.length < VALIDATION_CONSTANTS.MIN_LENGTH) {
    errors.push({
      field: 'idea',
      type: 'minLength',
      message: `L'idée doit contenir au moins ${VALIDATION_CONSTANTS.MIN_LENGTH} caractères`
    })
  } else if (trimmedIdea.length > VALIDATION_CONSTANTS.MAX_LENGTH) {
    errors.push({
      field: 'idea',
      type: 'maxLength',
      message: `L'idée ne peut pas dépasser ${VALIDATION_CONSTANTS.MAX_LENGTH} caractères`
    })
  }

  if (wordCount > 0 && wordCount < VALIDATION_CONSTANTS.MIN_WORDS) {
    errors.push({
      field: 'idea',
      type: 'format',
      message: `L'idée doit contenir au moins ${VALIDATION_CONSTANTS.MIN_WORDS} mots`
    })
  }

  // Optimal length warnings
  if (trimmedIdea.length > 0 && trimmedIdea.length < VALIDATION_CONSTANTS.OPTIMAL_MIN_LENGTH) {
    warnings.push({
      field: 'idea',
      type: 'suggestion',
      message: 'Votre idée pourrait bénéficier de plus de détails pour un meilleur résultat'
    })
  } else if (trimmedIdea.length > VALIDATION_CONSTANTS.OPTIMAL_MAX_LENGTH) {
    warnings.push({
      field: 'idea',
      type: 'optimization',
      message: 'Une idée plus concise pourrait être plus efficace'
    })
  }

  return { errors, warnings }
}

/**
 * Validates content quality and structure
 */
function validateContent(idea: string): { warnings: ValidationWarning[], suggestions: IdeaSuggestion[] } {
  const warnings: ValidationWarning[] = []
  const suggestions: IdeaSuggestion[] = []
  const lowerIdea = idea.toLowerCase()

  // Check for problem identification
  const hasProblemIndicators = QUALITY_INDICATORS.PROBLEM_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )

  if (!hasProblemIndicators) {
    suggestions.push({
      type: 'vague_problem',
      message: 'Décrivez clairement le problème que votre idée résout',
      example: 'Ex: "Les petites entreprises ont du mal à gérer leur comptabilité..."',
      priority: 'high'
    })
  }

  // Check for solution clarity
  const hasSolutionIndicators = QUALITY_INDICATORS.SOLUTION_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )

  if (!hasSolutionIndicators) {
    suggestions.push({
      type: 'unclear_solution',
      message: 'Expliquez comment votre idée résout le problème identifié',
      example: 'Ex: "Mon application automatise la saisie comptable..."',
      priority: 'high'
    })
  }

  // Check for target market
  const hasTargetIndicators = QUALITY_INDICATORS.TARGET_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )

  if (!hasTargetIndicators) {
    suggestions.push({
      type: 'missing_target',
      message: 'Précisez qui sont vos utilisateurs cibles',
      example: 'Ex: "destiné aux entrepreneurs et PME..."',
      priority: 'medium'
    })
  }

  // Check for business context
  const hasBusinessIndicators = QUALITY_INDICATORS.BUSINESS_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )

  if (!hasBusinessIndicators) {
    suggestions.push({
      type: 'add_context',
      message: 'Ajoutez des éléments sur le modèle économique ou la monétisation',
      example: 'Ex: "avec un modèle freemium..." ou "génère des revenus via..."',
      priority: 'low'
    })
  }

  return { warnings, suggestions }
}

/**
 * Calculates a quality score from 0-100 based on various factors
 */
function calculateQualityScore(idea: string, errors: ValidationError[], warnings: ValidationWarning[]): number {
  if (errors.length > 0) {
    return 0 // Invalid ideas get 0 score
  }

  const trimmedIdea = idea.trim()
  const wordCount = trimmedIdea.split(/\s+/).filter(word => word.length > 0).length
  const lowerIdea = trimmedIdea.toLowerCase()

  let score = 0

  // Length score (20 points)
  const lengthScore = calculateLengthScore(trimmedIdea.length)
  score += lengthScore * (VALIDATION_CONSTANTS.SCORE_WEIGHTS.LENGTH / 100)

  // Structure score (25 points)
  const structureScore = calculateStructureScore(wordCount, lowerIdea)
  score += structureScore * (VALIDATION_CONSTANTS.SCORE_WEIGHTS.STRUCTURE / 100)

  // Clarity score (25 points)
  const clarityScore = calculateClarityScore(lowerIdea)
  score += clarityScore * (VALIDATION_CONSTANTS.SCORE_WEIGHTS.CLARITY / 100)

  // Completeness score (30 points)
  const completenessScore = calculateCompletenessScore(lowerIdea)
  score += completenessScore * (VALIDATION_CONSTANTS.SCORE_WEIGHTS.COMPLETENESS / 100)

  // Apply warning penalties
  const warningPenalty = Math.min(warnings.length * 5, 20) // Max 20 point penalty
  score = Math.max(0, score - warningPenalty)

  return Math.round(score)
}

/**
 * Calculate score based on text length (0-100)
 */
function calculateLengthScore(length: number): number {
  if (length < VALIDATION_CONSTANTS.MIN_LENGTH) return 0
  if (length >= VALIDATION_CONSTANTS.OPTIMAL_MIN_LENGTH && length <= VALIDATION_CONSTANTS.OPTIMAL_MAX_LENGTH) return 100
  if (length < VALIDATION_CONSTANTS.OPTIMAL_MIN_LENGTH) {
    return (length - VALIDATION_CONSTANTS.MIN_LENGTH) / (VALIDATION_CONSTANTS.OPTIMAL_MIN_LENGTH - VALIDATION_CONSTANTS.MIN_LENGTH) * 100
  }
  if (length > VALIDATION_CONSTANTS.OPTIMAL_MAX_LENGTH) {
    const penalty = Math.min((length - VALIDATION_CONSTANTS.OPTIMAL_MAX_LENGTH) / 100, 0.5)
    return Math.max(50, 100 - penalty * 100)
  }
  return 100
}

/**
 * Calculate score based on text structure and word count
 */
function calculateStructureScore(wordCount: number, lowerIdea: string): number {
  let score = 0

  // Word count score (50% of structure score)
  if (wordCount >= VALIDATION_CONSTANTS.OPTIMAL_MIN_WORDS) {
    score += 50
  } else if (wordCount >= VALIDATION_CONSTANTS.MIN_WORDS) {
    score += (wordCount / VALIDATION_CONSTANTS.OPTIMAL_MIN_WORDS) * 50
  }

  // Sentence structure score (50% of structure score)
  const sentences = lowerIdea.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length >= 2) {
    score += 50
  } else if (sentences.length === 1 && sentences[0].length > 20) {
    score += 25
  }

  return Math.min(100, score)
}

/**
 * Calculate score based on clarity indicators
 */
function calculateClarityScore(lowerIdea: string): number {
  let score = 60 // Base score for valid text

  // Bonus for clear problem statement
  const hasProblemClarity = QUALITY_INDICATORS.PROBLEM_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )
  if (hasProblemClarity) score += 20

  // Bonus for solution clarity
  const hasSolutionClarity = QUALITY_INDICATORS.SOLUTION_KEYWORDS.some(keyword => 
    lowerIdea.includes(keyword)
  )
  if (hasSolutionClarity) score += 20

  return Math.min(100, score)
}

/**
 * Calculate score based on completeness of the idea
 */
function calculateCompletenessScore(lowerIdea: string): number {
  let score = 0
  const maxScore = 100
  const componentScore = maxScore / 4 // 4 main components

  // Problem identification
  if (QUALITY_INDICATORS.PROBLEM_KEYWORDS.some(keyword => lowerIdea.includes(keyword))) {
    score += componentScore
  }

  // Solution description
  if (QUALITY_INDICATORS.SOLUTION_KEYWORDS.some(keyword => lowerIdea.includes(keyword))) {
    score += componentScore
  }

  // Target market
  if (QUALITY_INDICATORS.TARGET_KEYWORDS.some(keyword => lowerIdea.includes(keyword))) {
    score += componentScore
  }

  // Business context
  if (QUALITY_INDICATORS.BUSINESS_KEYWORDS.some(keyword => lowerIdea.includes(keyword))) {
    score += componentScore
  }

  return Math.min(100, score)
}

/**
 * Generate contextual suggestions based on the idea content and score
 */
function generateContextualSuggestions(idea: string, score: number): IdeaSuggestion[] {
  const suggestions: IdeaSuggestion[] = []
  const lowerIdea = idea.toLowerCase()

  // Score-based suggestions
  if (score < 30) {
    suggestions.push({
      type: 'add_context',
      message: 'Votre idée a besoin de plus de détails pour être convaincante',
      example: 'Décrivez le problème, la solution, et les utilisateurs cibles',
      priority: 'high'
    })
  } else if (score < 60) {
    suggestions.push({
      type: 'add_context',
      message: 'Ajoutez plus de contexte pour améliorer votre pitch',
      example: 'Mentionnez le marché cible ou le modèle économique',
      priority: 'medium'
    })
  }

  // Content-specific suggestions
  if (!lowerIdea.includes('pourquoi') && !lowerIdea.includes('because') && !lowerIdea.includes('car')) {
    suggestions.push({
      type: 'add_context',
      message: 'Expliquez pourquoi votre solution est nécessaire',
      example: 'Ex: "car les solutions actuelles sont trop complexes..."',
      priority: 'medium'
    })
  }

  return suggestions
}

/**
 * Quick validation for real-time feedback (optimized for performance)
 */
export function quickValidateIdea(idea: string): { isValid: boolean, score: number, mainIssue?: string } {
  const trimmedIdea = idea.trim()
  
  if (trimmedIdea.length === 0) {
    return { isValid: false, score: 0, mainIssue: 'Idée requise' }
  }
  
  if (trimmedIdea.length < VALIDATION_CONSTANTS.MIN_LENGTH) {
    return { 
      isValid: false, 
      score: 0, 
      mainIssue: `${VALIDATION_CONSTANTS.MIN_LENGTH - trimmedIdea.length} caractères manquants` 
    }
  }
  
  if (trimmedIdea.length > VALIDATION_CONSTANTS.MAX_LENGTH) {
    return { 
      isValid: false, 
      score: 0, 
      mainIssue: `${trimmedIdea.length - VALIDATION_CONSTANTS.MAX_LENGTH} caractères en trop` 
    }
  }

  const wordCount = trimmedIdea.split(/\s+/).filter(word => word.length > 0).length
  if (wordCount < VALIDATION_CONSTANTS.MIN_WORDS) {
    return { 
      isValid: false, 
      score: 0, 
      mainIssue: `${VALIDATION_CONSTANTS.MIN_WORDS - wordCount} mots manquants` 
    }
  }

  // Quick score calculation for valid ideas
  const score = Math.min(100, Math.round(
    (trimmedIdea.length / VALIDATION_CONSTANTS.OPTIMAL_MIN_LENGTH) * 60 + 
    (wordCount / VALIDATION_CONSTANTS.OPTIMAL_MIN_WORDS) * 40
  ))

  return { isValid: true, score }
}