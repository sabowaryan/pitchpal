import { Suspense } from 'react'
import { PitchGeneratorContainer } from '@/components/forms/pitch-generator-container'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sparkles, Target, Clock, Shield } from 'lucide-react'

export default function GeneratePage() {
  const features = [
    {
      icon: Clock,
      text: 'Résultats en 2 minutes',
      color: 'text-primary-600'
    },
    {
      icon: Target,
      text: 'IA avancée GPT-4',
      color: 'text-accent-600'
    },
    {
      icon: Shield,
      text: '100% gratuit et sécurisé',
      color: 'text-success-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <main className="container-custom section relative">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                Générateur de Pitch IA
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Créez votre{' '}
              <span className="text-gradient-primary">pitch parfait</span>
              {' '}maintenant
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Transformez votre idée en présentation professionnelle avec notre IA avancée. 
              Structuré, convaincant et prêt à impressionner vos investisseurs.
            </p>
            
            {/* Features */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                    <span className="font-medium text-neutral-700">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Generator Section */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <PitchGeneratorContainer />
          </Suspense>
        </div>
      </main>
    </div>
  )
}