'use client'

import { CheckCircle, Clock, Sparkles, Target, FileText, Download, X, RotateCcw, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { EnhancedProgress } from '@/types/enhanced-errors'

interface GenerationProgressProps {
  progress: EnhancedProgress
  onCancel?: () => void
  isRetrying?: boolean
  retryCount?: number
}

export function GenerationProgress({ 
  progress, 
  onCancel, 
  isRetrying = false, 
  retryCount = 0 
}: GenerationProgressProps) {
  const steps = [
    {
      id: 1,
      icon: Sparkles,
      title: 'Analyse de votre idée',
      description: 'L\'IA comprend votre concept',
      estimatedDuration: 5
    },
    {
      id: 2,
      icon: Target,
      title: 'Structuration du pitch',
      description: 'Création de la structure optimale',
      estimatedDuration: 8
    },
    {
      id: 3,
      icon: FileText,
      title: 'Génération du contenu',
      description: 'Rédaction du pitch complet',
      estimatedDuration: 15
    },
    {
      id: 4,
      icon: Download,
      title: 'Finalisation',
      description: 'Préparation de votre présentation',
      estimatedDuration: 3
    }
  ]

  // Calculate estimated time remaining
  const calculateTimeRemaining = () => {
    if (progress.estimatedTimeRemaining) {
      return progress.estimatedTimeRemaining
    }
    
    const remainingSteps = steps.slice(progress.step)
    const totalEstimated = remainingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
    return totalEstimated
  }

  const timeRemaining = calculateTimeRemaining()
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-6 animate-fade-in">
      {/* Header with Status and Cancel Button */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-center flex-1">
          <div className="inline-flex items-center space-x-2 bg-primary-100 rounded-full px-4 py-2 mb-3">
            {isRetrying ? (
              <>
                <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-sm font-medium text-amber-700">
                  Nouvelle tentative ({retryCount})...
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-primary-600 animate-pulse" />
                <span className="text-sm font-medium text-primary-700">
                  Génération en cours...
                </span>
              </>
            )}
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {progress.message}
          </h3>
          <p className="text-sm text-neutral-600">
            Notre IA travaille sur votre pitch professionnel
          </p>
          
          {/* Time Remaining Display */}
          {timeRemaining > 0 && !progress.isComplete && (
            <div className="mt-3 inline-flex items-center space-x-1 text-xs text-neutral-500">
              <Clock className="w-3 h-3" />
              <span>Temps estimé restant: {formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        {/* Cancel Button */}
        {progress.canCancel && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="ml-4 text-neutral-600 hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Annuler
          </Button>
        )}
      </div>

      {/* Retry Indicator Banner */}
      {isRetrying && retryCount > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Tentative automatique en cours... ({retryCount}/{3})
            </span>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = progress.step === step.id
          const isCompleted = progress.step > step.id
          
          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-success-50 border-success-200'
                  : isActive
                  ? 'bg-primary-50 border-primary-300 shadow-lg'
                  : 'bg-white/50 border-neutral-200'
              }`}
            >
              {/* Step Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 mx-auto transition-all duration-300 ${
                isCompleted
                  ? 'bg-success-100'
                  : isActive
                  ? 'bg-primary-100 animate-pulse'
                  : 'bg-neutral-100'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-success-600" />
                ) : (
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-primary-600' : 'text-neutral-500'
                  }`} />
                )}
              </div>

              {/* Step Content */}
              <div className="text-center">
                <h4 className={`font-medium text-sm mb-1 ${
                  isCompleted
                    ? 'text-success-800'
                    : isActive
                    ? 'text-primary-800'
                    : 'text-neutral-600'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-xs ${
                  isCompleted
                    ? 'text-success-600'
                    : isActive
                    ? 'text-primary-600'
                    : 'text-neutral-500'
                }`}>
                  {step.description}
                </p>
              </div>

              {/* Active Step Indicator */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Enhanced Progress Bar with Operation Details */}
      <div className="mt-6">
        <div className="flex justify-between items-center text-xs text-neutral-600 mb-2">
          <div className="flex items-center space-x-2">
            <span>Progression</span>
            {progress.currentOperation && (
              <span className="text-primary-600 font-medium">
                • {progress.currentOperation === 'validating' && 'Validation'}
                {progress.currentOperation === 'generating' && 'Génération'}
                {progress.currentOperation === 'processing' && 'Traitement'}
                {progress.currentOperation === 'finalizing' && 'Finalisation'}
              </span>
            )}
          </div>
          <span className="font-medium">{Math.round((progress.step / progress.totalSteps) * 100)}%</span>
        </div>
        
        {/* Main Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              isRetrying 
                ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600'
            }`}
            style={{ width: `${(progress.step / progress.totalSteps) * 100}%` }}
          >
            {/* Animated shine effect */}
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Detailed Step Progress */}
        <div className="mt-3 flex justify-between text-xs text-neutral-500">
          <span>Étape {progress.step} sur {progress.totalSteps}</span>
          {!progress.isComplete && timeRemaining > 0 && (
            <span>≈ {formatTime(timeRemaining)} restant</span>
          )}
        </div>
      </div>

      {/* Operation-Specific Feedback */}
      {!progress.isComplete && (
        <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {progress.currentOperation === 'validating' && <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />}
              {progress.currentOperation === 'generating' && <Target className="w-4 h-4 text-primary-500 animate-pulse" />}
              {progress.currentOperation === 'processing' && <FileText className="w-4 h-4 text-primary-500 animate-pulse" />}
              {progress.currentOperation === 'finalizing' && <Download className="w-4 h-4 text-primary-500 animate-pulse" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-700 font-medium mb-1">
                {progress.currentOperation === 'validating' && 'Analyse en cours'}
                {progress.currentOperation === 'generating' && 'Structuration du pitch'}
                {progress.currentOperation === 'processing' && 'Génération du contenu'}
                {progress.currentOperation === 'finalizing' && 'Finalisation'}
              </p>
              <p className="text-xs text-neutral-600">
                {progress.currentOperation === 'validating' && 'Notre IA analyse votre idée et identifie les éléments clés'}
                {progress.currentOperation === 'generating' && 'Création de la structure optimale pour votre présentation'}
                {progress.currentOperation === 'processing' && 'Rédaction du contenu personnalisé selon votre ton'}
                {progress.currentOperation === 'finalizing' && 'Préparation finale de votre pitch professionnel'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}