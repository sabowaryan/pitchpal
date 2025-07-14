import { Suspense } from 'react'
import { PitchGenerator } from '@/components/forms/pitch-generator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function GeneratePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Générateur de Pitch 🚀
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Transformez votre idée en pitch professionnel en quelques minutes
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>✅ Tagline percutante</span>
            <span>🎯 Problème & Solution</span>
            <span>👥 Marché cible</span>
            <span>💸 Business model</span>
          </div>
        </div>
        
        <Suspense fallback={<LoadingSpinner />}>
          <PitchGenerator />
        </Suspense>
      </div>
    </main>
  )
} 