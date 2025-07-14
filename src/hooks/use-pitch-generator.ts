import { useState } from 'react'
import { Pitch } from '@/types/pitch'

export function usePitchGenerator() {
  const [isLoading, setIsLoading] = useState(false)
  const [pitch, setPitch] = useState<Pitch | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generatePitch = async (idea: string, tone: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea, tone }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération')
      }

      const data = await response.json()
      setPitch(data.pitch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    generatePitch,
    isLoading,
    pitch,
    error,
  }
} 