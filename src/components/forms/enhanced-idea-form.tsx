/**
 * Enhanced Idea Form with Real-time Validation Feedback
 * 
 * This component integrates the IdeaValidationFeedback component
 * with the existing idea form to provide comprehensive validation
 * and suggestions in real-time.
 */

'use client'

import React, { useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { IdeaValidationFeedback } from './idea-validation-feedback'
import { validateIdea } from '@/lib/validation/idea-validator'
import { MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from '@/lib/constants'
import { Lightbulb } from 'lucide-react'

interface EnhancedIdeaFormProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showValidationFeedback?: boolean
  className?: string
}

export function EnhancedIdeaForm({ 
  value, 
  onChange, 
  placeholder,
  showValidationFeedback = true,
  className = ''
}: EnhancedIdeaFormProps) {
  // Real-time validation
  const validationResult = useMemo(() => {
    return validateIdea(value)
  }, [value])

  const defaultPlaceholder = "Ex: Une application mobile qui aide les petites entreprises à gérer leur comptabilité de manière simple et automatisée, en se connectant directement à leurs comptes bancaires pour catégoriser les transactions."

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-primary-600" />
          <label className="text-lg font-semibold text-neutral-900">
            Décrivez votre idée
          </label>
        </div>
        
        <p className="text-neutral-600 leading-relaxed">
          Expliquez votre concept en détail. Plus vous êtes précis sur le problème, 
          la solution et votre marché cible, plus le pitch sera pertinent et convaincant.
        </p>
      </div>
      
      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className="min-h-[160px] resize-none text-base leading-relaxed border-2 focus:border-primary-400 focus:ring-primary-400/20 transition-all duration-200"
          maxLength={MAX_IDEA_LENGTH}
          aria-describedby="idea-validation-feedback"
        />
      </div>
      
      {/* Validation Feedback */}
      {showValidationFeedback && (
        <div id="idea-validation-feedback">
          <IdeaValidationFeedback
            validationResult={validationResult}
            currentLength={value.length}
            maxLength={MAX_IDEA_LENGTH}
            minLength={MIN_IDEA_LENGTH}
          />
        </div>
      )}
    </div>
  )
}

export default EnhancedIdeaForm