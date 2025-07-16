import { Pitch } from '@/types/pitch'
import { ValidationResult, ValidationError } from '@/types/enhanced-errors'

// Keep backward compatibility with simple validation result
export interface SimpleValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateIdea(idea: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: any[] = []
  const suggestions: any[] = []
  
  if (!idea || !idea.trim()) {
    errors.push({
      field: 'idea',
      type: 'required',
      message: 'L\'idée ne peut pas être vide'
    })
  }
  
  if (idea && idea.trim().length < 10) {
    errors.push({
      field: 'idea',
      type: 'minLength',
      message: 'L\'idée doit contenir au moins 10 caractères'
    })
  }
  
  if (idea && idea.length > 500) {
    errors.push({
      field: 'idea',
      type: 'maxLength',
      message: 'L\'idée ne peut pas dépasser 500 caractères'
    })
  }
  
  // Calculate quality score
  let score = 0
  if (idea && idea.trim().length >= 10) score += 30
  if (idea && idea.trim().length >= 50) score += 30
  if (idea && idea.includes(' ')) score += 20 // Contains multiple words
  if (idea && /[.!?]/.test(idea)) score += 20 // Contains punctuation
  
  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
    suggestions
  }
}

export function validateTone(tone: string): ValidationResult {
  const validTones = ['professional', 'fun', 'tech', 'startup']
  const errors: ValidationError[] = []
  const warnings: any[] = []
  const suggestions: any[] = []
  
  if (!tone) {
    errors.push({
      field: 'tone',
      type: 'required',
      message: 'Le ton doit être spécifié'
    })
  }
  
  if (tone && !validTones.includes(tone)) {
    errors.push({
      field: 'tone',
      type: 'format',
      message: 'Ton invalide. Valeurs acceptées: ' + validTones.join(', ')
    })
  }
  
  return {
    isValid: errors.length === 0,
    score: errors.length === 0 ? 100 : 0,
    errors,
    warnings,
    suggestions
  }
}

export function validatePitch(pitch: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: any[] = []
  const suggestions: any[] = []
  
  const requiredFields = [
    'tagline',
    'problem',
    'solution',
    'targetMarket',
    'businessModel',
    'competitiveAdvantage'
  ]
  
  for (const field of requiredFields) {
    if (!pitch[field] || typeof pitch[field] !== 'string' || !pitch[field].trim()) {
      errors.push({
        field,
        type: 'required',
        message: `Le champ '${field}' est requis`
      })
    }
  }
  
  if (!pitch.pitchDeck || !Array.isArray(pitch.pitchDeck.slides)) {
    errors.push({
      field: 'pitchDeck',
      type: 'format',
      message: 'Le pitch deck doit contenir un tableau de slides'
    })
  } else if (pitch.pitchDeck.slides.length === 0) {
    errors.push({
      field: 'pitchDeck',
      type: 'required',
      message: 'Le pitch deck doit contenir au moins une slide'
    })
  }
  
  return {
    isValid: errors.length === 0,
    score: errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length * 20)),
    errors,
    warnings,
    suggestions
  }
}

// Backward compatibility function for simple validation
export function validateIdeaSimple(idea: string): SimpleValidationResult {
  const result = validateIdea(idea)
  return {
    isValid: result.isValid,
    errors: result.errors.map(e => e.message)
  }
}

export function validateToneSimple(tone: string): SimpleValidationResult {
  const result = validateTone(tone)
  return {
    isValid: result.isValid,
    errors: result.errors.map(e => e.message)
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}