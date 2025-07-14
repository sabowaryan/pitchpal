'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePitchGenerator } from '@/hooks/use-pitch-generator'
import { IdeaForm } from './idea-form'
import { ToneSelector } from './tone-selector'
import { GenerationProgress } from './generation-progress'
import { Button } from '../ui/button'
import { AIStatusIndicator } from '../ui/ai-status'
import { MIN_IDEA_LENGTH } from '@/lib/constants'
import { Sparkles, Zap } from 'lucide-react'

export function PitchGeneratorContainer() {
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('professional')
  const router = useRouter()
  
  const { generatePitch, isLoading, error, progress } = usePitchGenerator({
    onSuccess: (pitch) => {
      // Redirect to results page with pitch data
      const encodedPitch = encodeURIComponent(JSON.stringify(pitch))
      router.push(`/results?data=${encodedPitch}`)
    }
  })

  const handleGenerate = async () => {
    if (!idea.trim() || idea.length < MIN_IDEA_LENGTH) return
    await generatePitch(idea, tone)
  }

  const isFormValid = idea.trim().length >= MIN_IDEA_LENGTH

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
            
            <ToneSelector 
              value={tone}
              onChange={setTone}
            />
          </div>
          
          {/* Generation Progress */}
          {isLoading && (
            <GenerationProgress progress={progress} />
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-error-50 border-2 border-error-200 rounded-xl p-6 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center">
                  <span className="text-error-600 text-sm">⚠️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-error-800 mb-1">
                    Erreur de génération
                  </h4>
                  <p className="text-error-700">{error}</p>
                </div>
              </div>
            </div>
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
            {!isFormValid && idea.length > 0 && (
              <p className="text-sm text-warning-600 mt-2 text-center">
                Minimum {MIN_IDEA_LENGTH} caractères requis
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 grid md:grid-cols-3 gap-6 animate-fade-in delay-300">
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
  )
}