import { Pitch } from '@/types/pitch'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateIdea(idea: string): ValidationResult {
  const errors: string[] = []
  
  if (!idea || !idea.trim()) {
    errors.push('L\'idée ne peut pas être vide')
  }
  
  if (idea.trim().length < 10) {
    errors.push('L\'idée doit contenir au moins 10 caractères')
  }
  
  if (idea.length > 500) {
    errors.push('L\'idée ne peut pas dépasser 500 caractères')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateTone(tone: string): ValidationResult {
  const validTones = ['professional', 'fun', 'tech', 'startup']
  const errors: string[] = []
  
  if (!tone) {
    errors.push('Le ton doit être spécifié')
  }
  
  if (!validTones.includes(tone)) {
    errors.push('Ton invalide. Valeurs acceptées: ' + validTones.join(', '))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePitch(pitch: any): ValidationResult {
  const errors: string[] = []
  
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
      errors.push(`Le champ '${field}' est requis`)
    }
  }
  
  if (!pitch.pitchDeck || !Array.isArray(pitch.pitchDeck.slides)) {
    errors.push('Le pitch deck doit contenir un tableau de slides')
  } else if (pitch.pitchDeck.slides.length === 0) {
    errors.push('Le pitch deck doit contenir au moins une slide')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}