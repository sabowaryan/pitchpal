'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { PitchDisplay } from '@/components/pitch/pitch-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Pitch } from '@/types/pitch'

// Separate the component that uses useSearchParams
function ResultsContent() {
  const searchParams = useSearchParams()
  const [pitch, setPitch] = useState<Pitch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pitchData = searchParams.get('data')
    
    if (pitchData) {
      try {
        const decodedPitch = JSON.parse(decodeURIComponent(pitchData))
        setPitch(decodedPitch)
      } catch (err) {
        setError('Erreur lors du chargement du pitch')
      }
    } else {
      setError('Aucune donnée de pitch trouvée')
    }
    
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Chargement de votre pitch...</p>
        </div>
      </div>
    )
  }

  if (error || !pitch) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Oups ! Quelque chose s'est mal passé
          </h1>
          <p className="text-neutral-600 mb-6">
            {error || 'Impossible de charger votre pitch'}
          </p>
          <Link href="/generate">
            <Button className="btn btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au générateur
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <main className="container-custom section relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-success-50 border border-success-200 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-success-600" />
              <span className="text-sm font-medium text-success-700">
                Pitch généré avec succès !
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Votre{' '}
              <span className="text-gradient-primary">pitch professionnel</span>
              {' '}est prêt ! 🎉
            </h1>
            
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Voici votre présentation complète générée par IA. Vous pouvez maintenant 
              l'exporter, la modifier ou créer un nouveau pitch.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Link href="/generate">
                <Button variant="outline" className="btn-lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Créer un nouveau pitch
                </Button>
              </Link>
            </div>
          </div>

          {/* Pitch Display */}
          <div className="animate-slide-up">
            <PitchDisplay pitch={pitch} />
          </div>
        </div>
      </main>
    </div>
  )
}

// Main component with Suspense boundary
export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Chargement de votre pitch...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}