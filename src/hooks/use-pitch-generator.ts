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
    let progressInterval: NodeJS.Timeout | null = null
    
    const startProgress = () => {
      progressInterval = setInterval(() => {
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
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
        }
      }, 800)
    }

    startProgress()

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
    }
  }, [])

  const generatePitch = useCallback(async (idea: string, tone: string) => {
    if (!idea?.trim()) {
      const errorMessage = 'L\'idée ne peut pas être vide'
      setError(errorMessage)
      options.onError?.(errorMessage)
      return
    }

    if (idea.trim().length < 10) {
      const errorMessage = 'L\'idée doit contenir au moins 10 caractères'
      setError(errorMessage)
      options.onError?.(errorMessage)
      return
    }

    setIsLoading(true)
    setError(null)
    setPitch(null)
    
    // Start progress simulation
    const clearProgress = simulateProgress()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: idea.trim(), 
          tone: tone || 'professional' 
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data || !data.pitch) {
        throw new Error('Réponse invalide du serveur - aucun pitch généré')
      }

      // Validate pitch structure
      const requiredFields = ['tagline', 'problem', 'solution', 'targetMarket', 'businessModel', 'competitiveAdvantage']
      for (const field of requiredFields) {
        if (!data.pitch[field]) {
          throw new Error(`Pitch incomplet - champ manquant: ${field}`)
        }
      }

      if (!data.pitch.pitchDeck || !Array.isArray(data.pitch.pitchDeck.slides) || data.pitch.pitchDeck.slides.length === 0) {
        throw new Error('Pitch deck invalide ou vide')
      }

      // Add metadata to pitch
      const enrichedPitch: Pitch = {
        ...data.pitch,
        id: `pitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        originalIdea: idea.trim(),
        tone: tone || 'professional'
      }

      setPitch(enrichedPitch)
      setError(null)
      options.onSuccess?.(enrichedPitch)
      
    } catch (err) {
      console.error('Erreur génération pitch:', err)
      
      let errorMessage = 'Une erreur inattendue est survenue'
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'La génération a pris trop de temps. Veuillez réessayer.'
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      options.onError?.(errorMessage)
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