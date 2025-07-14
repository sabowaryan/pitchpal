'use client'

import { useState } from 'react'
import { usePitchGenerator } from '@/hooks/use-pitch-generator'
import { IdeaForm } from './idea-form'
import { ToneSelector } from './tone-selector'
import { PitchDisplay } from '../pitch/pitch-display'
import { Button } from '../ui/button'
import { MIN_IDEA_LENGTH } from '@/lib/constants'

export function PitchGenerator() {
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('professional')
  const { generatePitch, isLoading, pitch, error } = usePitchGenerator()

  const handleGenerate = async () => {
    if (!idea.trim() || idea.length < MIN_IDEA_LENGTH) return
    await generatePitch(idea, tone)
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <IdeaForm 
          value={idea}
          onChange={setIdea}
          placeholder="Décrivez votre idée en 2 phrases..."
        />
        
        <div className="mt-6">
          <ToneSelector 
            value={tone}
            onChange={setTone}
          />
        </div>
        
        <Button 
          onClick={handleGenerate}
          disabled={isLoading || !idea.trim() || idea.length < MIN_IDEA_LENGTH}
          className="w-full mt-6"
        >
          {isLoading ? 'Génération en cours...' : 'Générer mon pitch 🚀'}
        </Button>
      </div>

      {pitch && (
        <PitchDisplay pitch={pitch} />
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
} 