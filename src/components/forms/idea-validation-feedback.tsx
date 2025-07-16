/**
 * IdeaValidationFeedback Component
 * 
 * This component provides real-time validation feedback for pitch ideas including:
 * - Real-time validation error display
 * - Smart character counter with visual indicators
 * - Improvement suggestions with examples
 * - Visual quality score indicators
 */

'use client'

import React, { useMemo } from 'react'
import { ValidationResult } from '@/types/enhanced-errors'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Lightbulb, 
  TrendingUp,
  Target,
  MessageSquare,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdeaValidationFeedbackProps {
  validationResult: ValidationResult
  currentLength: number
  maxLength: number
  minLength: number
  className?: string
}

export const IdeaValidationFeedback = React.memo(function IdeaValidationFeedback({
  validationResult,
  currentLength,
  maxLength,
  minLength,
  className = ''
}: IdeaValidationFeedbackProps) {
  const { isValid, score, errors, warnings, suggestions } = validationResult

  // Performance optimization: Memoize character counter status calculation
  const characterStatus = useMemo(() => {
    if (currentLength === 0) return 'empty'
    if (currentLength < minLength) return 'too-short'
    if (currentLength > maxLength) return 'over-limit'
    if (currentLength > maxLength * 0.9) return 'near-limit'
    return 'good'
  }, [currentLength, minLength, maxLength])

  // Performance optimization: Memoize score visualization functions
  const scoreStyles = useMemo(() => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600'
      if (score >= 60) return 'text-yellow-600'
      if (score >= 40) return 'text-orange-600'
      return 'text-red-600'
    }

    const getScoreBackground = (score: number) => {
      if (score >= 80) return 'bg-green-100'
      if (score >= 60) return 'bg-yellow-100'
      if (score >= 40) return 'bg-orange-100'
      return 'bg-red-100'
    }

    const getScoreLabel = (score: number) => {
      if (score >= 80) return 'Excellente'
      if (score >= 60) return 'Bonne'
      if (score >= 40) return 'Correcte'
      return 'À améliorer'
    }

    return {
      color: getScoreColor(score),
      background: getScoreBackground(score),
      label: getScoreLabel(score)
    }
  }, [score])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Character Counter */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-neutral-600">Longueur:</span>
          <span className={cn(
            'font-medium',
            characterStatus === 'empty' && 'text-neutral-400',
            characterStatus === 'too-short' && 'text-red-600',
            characterStatus === 'good' && 'text-green-600',
            characterStatus === 'near-limit' && 'text-yellow-600',
            characterStatus === 'over-limit' && 'text-red-600'
          )}>
            {currentLength} / {maxLength}
          </span>
        </div>
        
        {/* Character status indicator */}
        <div className="flex items-center space-x-1">
          {characterStatus === 'too-short' && currentLength > 0 && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 text-xs">
                {minLength - currentLength} caractères manquants
              </span>
            </>
          )}
          {characterStatus === 'good' && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 text-xs">Longueur optimale</span>
            </>
          )}
          {characterStatus === 'near-limit' && (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600 text-xs">Proche de la limite</span>
            </>
          )}
          {characterStatus === 'over-limit' && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 text-xs">
                {currentLength - maxLength} caractères en trop
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar for character count */}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            characterStatus === 'too-short' && 'bg-red-400',
            characterStatus === 'good' && 'bg-green-400',
            characterStatus === 'near-limit' && 'bg-yellow-400',
            characterStatus === 'over-limit' && 'bg-red-500'
          )}
          style={{ width: `${Math.min((currentLength / maxLength) * 100, 100)}%` }}
        />
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-red-800">Erreurs de validation</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-700 text-sm">
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quality Score - Only show if no errors and has content */}
      {errors.length === 0 && currentLength > 0 && (
        <div className={cn(
          'border rounded-lg p-4 transition-all duration-300',
          scoreStyles.background,
          score >= 80 && 'border-green-200',
          score >= 60 && score < 80 && 'border-yellow-200',
          score >= 40 && score < 60 && 'border-orange-200',
          score < 40 && 'border-red-200'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Star className={cn('w-5 h-5', scoreStyles.color)} />
              <h4 className="font-medium text-neutral-800">Qualité de l'idée</h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn('text-2xl font-bold', scoreStyles.color)}>
                {score}
              </span>
              <span className="text-neutral-600">/100</span>
            </div>
          </div>
          
          {/* Score bar */}
          <div className="w-full bg-white/50 rounded-full h-3 mb-2">
            <div 
              className={cn(
                'h-3 rounded-full transition-all duration-500',
                score >= 80 && 'bg-green-500',
                score >= 60 && score < 80 && 'bg-yellow-500',
                score >= 40 && score < 60 && 'bg-orange-500',
                score < 40 && 'bg-red-500'
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          
          <p className={cn('text-sm font-medium', scoreStyles.color)}>
            {scoreStyles.label}
          </p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-800">Suggestions d'optimisation</h4>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-700 text-sm">
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">Suggestions d'amélioration</h4>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        suggestion.priority === 'high' && 'bg-red-400',
                        suggestion.priority === 'medium' && 'bg-yellow-400',
                        suggestion.priority === 'low' && 'bg-green-400'
                      )} />
                      <div className="space-y-1">
                        <p className="text-blue-700 text-sm font-medium">
                          {suggestion.message}
                        </p>
                        {suggestion.example && (
                          <p className="text-blue-600 text-xs italic bg-blue-100 rounded px-2 py-1">
                            {suggestion.example}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Priority legend */}
              <div className="flex items-center space-x-4 text-xs text-blue-600 pt-2 border-t border-blue-200">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span>Priorité haute</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Priorité moyenne</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Priorité basse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success state for high-quality ideas */}
      {isValid && score >= 80 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <h4 className="font-medium text-green-800">Excellente idée!</h4>
              <p className="text-green-700 text-sm">
                Votre idée est bien structurée et prête pour la génération du pitch.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default IdeaValidationFeedback