/**
 * Feature Flag Wrapper for Pitch Generator
 * 
 * This component handles the progressive rollout of enhanced features
 * with automatic fallback to legacy implementations.
 */

'use client'

import { useEffect, useState } from 'react'
import { useFeatureFlags, useFeatureFlagInit } from '@/hooks/use-feature-flags'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { PitchGeneratorContainer } from './pitch-generator-container'
import { ErrorBoundary } from '../ui/error-boundary'

// Legacy pitch generator (simplified version without enhancements)
function LegacyPitchGenerator() {
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('professional')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!idea.trim() || idea.length < 50) {
      setError('Veuillez saisir une idée d\'au moins 50 caractères')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), tone })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du pitch')
      }

      const data = await response.json()

      // Simple redirect to results
      const encodedPitch = encodeURIComponent(JSON.stringify(data.pitch))
      window.location.href = `/results?data=${encodedPitch}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-white/95 backdrop-blur-sm border-2 border-white/80 shadow-2xl">
        <div className="card-body space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Décrivez votre idée d'entreprise
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex: Une application mobile qui connecte les dog-sitters avec les propriétaires de chiens..."
                className="w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="text-sm text-neutral-500 mt-1">
                {idea.length}/500 caractères (minimum 50)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Ton du pitch
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="professional">Professionnel</option>
                <option value="casual">Décontracté</option>
                <option value="enthusiastic">Enthousiaste</option>
                <option value="technical">Technique</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !idea.trim() || idea.length < 50}
            className="w-full py-3 px-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Génération en cours...' : 'Générer mon pitch'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Feature flag monitoring component
function FeatureFlagMonitor() {
  const { flags, recordMetric } = useFeatureFlags([
    FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
    FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
    FEATURE_FLAGS.INTELLIGENT_RETRY,
    FEATURE_FLAGS.REQUEST_CANCELLATION,
    FEATURE_FLAGS.REAL_TIME_VALIDATION,
    FEATURE_FLAGS.USER_PREFERENCES,
    FEATURE_FLAGS.PITCH_PREVIEW,
    FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS
  ])

  useEffect(() => {
    // Log feature flag status for monitoring
    console.log('Feature Flags Status:', flags)

    // Record metrics for enabled features
    Object.entries(flags).forEach(([flagKey, enabled]) => {
      if (enabled) {
        recordMetric(flagKey as any, 'success')
      }
    })
  }, [flags, recordMetric])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
      <div className="font-semibold mb-2">Feature Flags</div>
      {Object.entries(flags).map(([key, enabled]) => (
        <div key={key} className="flex justify-between">
          <span className="truncate mr-2">{key.replace('_', ' ')}</span>
          <span className={enabled ? 'text-green-400' : 'text-red-400'}>
            {enabled ? '✓' : '✗'}
          </span>
        </div>
      ))}
    </div>
  )
}

// Main wrapper component
export function PitchGeneratorWrapper() {
  // Initialize feature flags
  useFeatureFlagInit()

  const { flags, recordMetric } = useFeatureFlags([FEATURE_FLAGS.FULL_ENHANCED_SYSTEM])
  const [hasError, setHasError] = useState(false)

  const handleError = (error: Error) => {
    console.error('Enhanced pitch generator error:', error)
    recordMetric(FEATURE_FLAGS.FULL_ENHANCED_SYSTEM, 'error')
    setHasError(true)
  }

  const handleReset = () => {
    setHasError(false)
  }

  // If enhanced system is disabled or has errors, use legacy
  if (!flags[FEATURE_FLAGS.FULL_ENHANCED_SYSTEM] || hasError) {
    return (
      <>
        <LegacyPitchGenerator />
        <FeatureFlagMonitor />
        {hasError && (
          <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <span>Mode de compatibilité activé</span>
              <button
                onClick={handleReset}
                className="ml-4 text-yellow-800 hover:text-yellow-900"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Use enhanced system with error boundary
  return (
    <ErrorBoundary
      fallback={
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Oops! Une erreur est survenue
          </h2>
          <p className="text-neutral-600 mb-6">
            Nous basculons vers le mode de compatibilité...
          </p>
          <LegacyPitchGenerator />
        </div>
      }
      onError={handleError}
    >
      <PitchGeneratorContainer />
      <FeatureFlagMonitor />
    </ErrorBoundary>
  )
}