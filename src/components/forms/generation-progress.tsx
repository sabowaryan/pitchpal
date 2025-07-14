'use client'

import { CheckCircle, Clock, Sparkles, Target, FileText, Download } from 'lucide-react'

interface GenerationProgressProps {
  progress: {
    step: number
    message: string
    isComplete: boolean
  }
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const steps = [
    {
      id: 1,
      icon: Sparkles,
      title: 'Analyse de votre idée',
      description: 'L\'IA comprend votre concept'
    },
    {
      id: 2,
      icon: Target,
      title: 'Structuration du pitch',
      description: 'Création de la structure optimale'
    },
    {
      id: 3,
      icon: FileText,
      title: 'Génération du contenu',
      description: 'Rédaction du pitch complet'
    },
    {
      id: 4,
      icon: Download,
      title: 'Finalisation',
      description: 'Préparation de votre présentation'
    }
  ]

  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-primary-100 rounded-full px-4 py-2 mb-3">
          <Clock className="w-4 h-4 text-primary-600 animate-pulse" />
          <span className="text-sm font-medium text-primary-700">
            Génération en cours...
          </span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {progress.message}
        </h3>
        <p className="text-sm text-neutral-600">
          Notre IA travaille sur votre pitch professionnel
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = progress.step === step.id
          const isCompleted = progress.step > step.id
          
          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-success-50 border-success-200'
                  : isActive
                  ? 'bg-primary-50 border-primary-300 shadow-lg'
                  : 'bg-white/50 border-neutral-200'
              }`}
            >
              {/* Step Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 mx-auto transition-all duration-300 ${
                isCompleted
                  ? 'bg-success-100'
                  : isActive
                  ? 'bg-primary-100 animate-pulse'
                  : 'bg-neutral-100'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-success-600" />
                ) : (
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-primary-600' : 'text-neutral-500'
                  }`} />
                )}
              </div>

              {/* Step Content */}
              <div className="text-center">
                <h4 className={`font-medium text-sm mb-1 ${
                  isCompleted
                    ? 'text-success-800'
                    : isActive
                    ? 'text-primary-800'
                    : 'text-neutral-600'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-xs ${
                  isCompleted
                    ? 'text-success-600'
                    : isActive
                    ? 'text-primary-600'
                    : 'text-neutral-500'
                }`}>
                  {step.description}
                </p>
              </div>

              {/* Active Step Indicator */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-neutral-600 mb-2">
          <span>Progression</span>
          <span>{Math.round((progress.step / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(progress.step / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}