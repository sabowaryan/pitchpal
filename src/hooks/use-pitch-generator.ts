import { useState, useCallback } from 'react'
import { Pitch } from '@/types/pitch'

interface UsePitchGeneratorOptions {
  onSuccess?: (pitch: Pitch) => void
  onError?: (error: string) => void
}

interface GenerationProgress {
  step: number
  message: string
  isComplete: boolean
}

export function usePitchGenerator(options: UsePitchGeneratorOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [pitch, setPitch] = useState<Pitch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 0,
    message: '',
    isComplete: false
  })

  const simulateProgress = useCallback(() => {
    const steps = [
      { step: 1, message: 'Analyse de votre idée en cours...', delay: 500 },
      { step: 2, message: 'Structuration du pitch...', delay: 1000 },
      { step: 3, message: 'Génération du contenu...', delay: 1500 },
      { step: 4, message: 'Finalisation de votre présentation...', delay: 500 }
    ]

    let currentStep = 0
    
    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress({
          step: steps[currentStep].step,
          message: steps[currentStep].message,
          isComplete: false
        })
        currentStep++
      } else {
        setProgress({
          step: steps.length,
          message: 'Pitch généré avec succès !',
          isComplete: true
        })
        clearInterval(progressInterval)
      }
    }, 800)

    return () => clearInterval(progressInterval)
  }, [])

  const generatePitch = useCallback(async (idea: string, tone: string) => {
    if (!idea.trim()) {
      setError('L\'idée ne peut pas être vide')
      return
    }

    setIsLoading(true)
    setError(null)
    setPitch(null)
    
    // Start progress simulation
    const clearProgress = simulateProgress()
    
    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim(), tone }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.pitch) {
        throw new Error('Réponse invalide du serveur')
      }

      // Add metadata to pitch
      const enrichedPitch: Pitch = {
        ...data.pitch,
        id: `pitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        originalIdea: idea.trim(),
        tone
      }

      setPitch(enrichedPitch)
      options.onSuccess?.(enrichedPitch)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue'
      setError(errorMessage)
      options.onError?.(errorMessage)
      console.error('Erreur génération pitch:', err)
    } finally {
      clearProgress()
      setIsLoading(false)
    }
  }, [options, simulateProgress])

  const resetState = useCallback(() => {
    setIsLoading(false)
    setPitch(null)
    setError(null)
    setProgress({
      step: 0,
      message: '',
      isComplete: false
    })
  }, [])

  return {
    generatePitch,
    isLoading,
    pitch,
    error,
    progress,
    resetState
  }
}