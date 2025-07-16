/**
 * Validation Module Exports
 * 
 * This module provides comprehensive validation for pitch ideas including:
 * - Real-time validation with scoring
 * - Contextual suggestions for improvement
 * - Content analysis and completeness checking
 */

// Main validation functions
export { validateIdea, quickValidateIdea } from './idea-validator'

// Suggestion engine functions
export { 
  generateContextualSuggestions, 
  getExampleIdeas, 
  analyzeIdeaCompleteness 
} from './suggestion-engine'

// Re-export types for convenience
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  IdeaSuggestion
} from '@/types/enhanced-errors'