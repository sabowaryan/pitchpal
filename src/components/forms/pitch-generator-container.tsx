'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedPitchGenerator } from '@/hooks/use-enhanced-pitch-generator'
import { IdeaForm } from './idea-form'
import { ToneSelector } from './tone-selector'
import { GenerationProgress } from './generation-progress'
import { IdeaValidationFeedback } from './idea-validation-feedback'
import { ErrorDisplay } from './error-display'
import { Button } from '../ui/button'
import { AIStatusIndicator } from '../ui/ai-status'
import { MIN_IDEA_LENGTH } from '@/lib/constants'
import { useDebouncedValue, createLazyComponent } from '@/lib/performance-utils'
import { Sparkles, Zap, Eye } from 'lucide-react'
import { Pitch } from '@/types/pitch'

// Performance optimization: Lazy load PitchPreview component
const LazyPitchPreview = createLazyComponent(
  () => import('./pitch-preview'),
  () => (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-white/95 backdrop-blur-sm border-2 border-white/80 shadow-2xl p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-lg text-neutral-600">Chargement de l'aperçu...</span>
        </div>
      </div>
    </div>
  )
)

export function PitchGeneratorContainer() {
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('professional')
  const [showPreview, setShowPreview] = useState(false)
  const [previewPitch, setPreviewPitch] = useState<Pitch | null>(null)
  const router = useRouter()
  
  // Enhanced pitch generator hook with all new features
  const {
    generatePitch,
    cancelGeneration,
    retryGeneration,
    resetState,
    state,
    validateIdea,
    getSuggestions,
    savePreferences,
    loadPreferences
  } = useEnhancedPitchGenerator({
    onSuccess: (pitch) => {
      // Show preview instead of immediate redirect
      setPreviewPitch(pitch)
      setShowPreview(true)
    },
    onError: (error) => {
      console.error('Pitch generation failed:', error)
    },
    onCancel: () => {
      console.log('Generation cancelled by user')
    }
  })

  // Performance optimization: Debounce idea input for validation
  const debouncedIdea = useDebouncedValue(idea, 300) // 300ms debounce

  // Load user preferences on mount and set initial tone
  useEffect(() => {
    const preferences = loadPreferences()
    if (preferences?.defaultTone) {
      setTone(preferences.defaultTone)
    }
  }, [loadPreferences])

  // Real-time validation with debouncing
  const validationResult = useMemo(() => {
    return validateIdea(debouncedIdea)
  }, [debouncedIdea, validateIdea])

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    if (!validationResult.isValid) {
      return
    }

    // Save preferences
    savePreferences({ 
      defaultTone: tone as any,
      lastUsed: new Date()
    })

    try {
      await generatePitch(idea.trim(), tone)
    } catch (err) {
      console.error('Error in handleGenerate:', err)
    }
  }, [idea, tone, validationResult.isValid, generatePitch, savePreferences])

  // Handle cancellation
  const handleCancel = useCallback(() => {
    cancelGeneration()
  }, [cancelGeneration])

  // Handle retry
  const handleRetry = useCallback(() => {
    retryGeneration()
  }, [retryGeneration])

  // Handle preview actions
  const handlePreviewSave = useCallback((updatedPitch: Pitch) => {
    setPreviewPitch(updatedPitch)
  }, [])

  const handlePreviewContinue = useCallback(() => {
    if (previewPitch) {
      try {
        // Redirect to results page with pitch data
        const encodedPitch = encodeURIComponent(JSON.stringify(previewPitch))
        router.push(`/results?data=${encodedPitch}`)
      } catch (encodeError) {
        console.error('Error encoding pitch data:', encodeError)
        // Fallback: show error message
        alert('Pitch généré avec succès, mais erreur lors de la redirection. Veuillez réessayer.')
      }
    }
  }, [previewPitch, router])

  const handlePreviewRegenerate = useCallback(async (sectionKey: string) => {
    // For now, just return a placeholder - this would integrate with a section-specific API
    return `Contenu régénéré pour ${sectionKey}`
  }, [])

  // Form validation state
  const isFormValid = validationResult.isValid
  const { isLoading, error, progress, canCancel } = state

  // Show preview if available
  if (showPreview && previewPitch) {
    return (
      <LazyPitchPreview
        pitch={previewPitch}
        onSave={handlePreviewSave}
        onContinue={handlePreviewContinue}
        onRegenerateSection={handlePreviewRegenerate}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Form Card */}
      <div className="card bg-white/95 backdrop-blur-sm border-2 border-white/80 shadow-2xl hover-glow animate-scale-in">
        <div className="card-body space-y-8">
          {/* AI Status */}
          <div className="pb-4 border-b border-neutral-200">
            <AIStatusIndicator />
          </div>
          
          {/* Idea Form */}
          <div className="space-y-6">
            <IdeaForm 
              value={idea}
              onChange={setIdea}
              placeholder="Ex: Une application mobile qui connecte les dog-sitters avec les propriétaires de chiens dans leur quartier, en utilisant l'IA pour matcher les profils et géolocaliser les services..."
            />
            
            {/* Real-time Validation Feedback */}
            {idea.length > 0 && (
              <IdeaValidationFeedback
                validationResult={validationResult}
                currentLength={idea.length}
                minLength={MIN_IDEA_LENGTH}
                maxLength={500}
              />
            )}
            
            <ToneSelector 
              value={tone}
              onChange={setTone}
            />
          </div>
          
          {/* Generation Progress with Cancellation */}
          {isLoading && (
            <div className="space-y-4">
              <GenerationProgress progress={progress} />
              {canCancel && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>Annuler la génération</span>
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Error Display */}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={() => resetState()}
              retryDisabled={isLoading}
              cooldownSeconds={state.retryCount > 0 ? Math.max(0, 5 - Math.floor((Date.now() - state.lastAttemptTime) / 1000)) : 0}
            />
          )}
          
          {/* Generate Button */}
          <div className="pt-4 border-t border-neutral-200">
            <Button 
              onClick={handleGenerate}
              disabled={isLoading || !isFormValid}
              className="w-full btn-xl hover-lift hover-glow group relative overflow-hidden"
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 group-hover:from-primary-700 group-hover:to-primary-800 transition-all duration-300"></div>
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Génération en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                    <span>Générer mon pitch professionnel</span>
                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </>
                )}
              </div>
            </Button>
            
            {/* Form Validation Message */}
            {!isFormValid && idea && idea.length > 0 && (
              <p className="text-sm text-warning-600 mt-2 text-center">
                Validation en cours... Vérifiez les suggestions ci-dessus
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Tips Section with User Preferences */}
      <div className="mt-8 space-y-6">
        {/* Idea History (if available) */}
        {state.preferences.ideaHistory.length > 0 && (
          <div className="card bg-white/60 backdrop-blur-sm border border-white/80 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Vos idées récentes</span>
            </h3>
            <div className="grid gap-3">
              {state.preferences.ideaHistory.slice(0, 3).map((historicIdea, index) => (
                <button
                  key={index}
                  onClick={() => setIdea(historicIdea)}
                  className="text-left p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors border border-neutral-200 hover:border-primary-300"
                >
                  <p className="text-sm text-neutral-700 line-clamp-2">
                    {historicIdea}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tips Grid */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in delay-300">
          {[
            {
              icon: '💡',
              title: 'Soyez précis',
              description: 'Décrivez clairement le problème que vous résolvez'
            },
            {
              icon: '🎯',
              title: 'Mentionnez votre cible',
              description: 'Précisez qui sont vos utilisateurs potentiels'
            },
            {
              icon: '🚀',
              title: 'Pensez impact',
              description: 'Expliquez pourquoi votre solution est unique'
            }
          ].map((tip, index) => (
            <div key={index} className="card bg-white/60 backdrop-blur-sm border border-white/80 p-6 text-center hover-lift">
              <div className="text-3xl mb-3">{tip.icon}</div>
              <h3 className="font-semibold text-neutral-900 mb-2">{tip.title}</h3>
              <p className="text-sm text-neutral-600">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}