'use client'

import { useState } from 'react'
import { ErrorDisplay } from './error-display'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'
import { Button } from '../ui/button'

// Demo error examples for each error type
const DEMO_ERRORS: Record<ErrorType, EnhancedError> = {
  [ErrorType.NETWORK]: {
    id: 'demo-network-error',
    type: ErrorType.NETWORK,
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    timestamp: new Date(),
    context: {
      idea: 'Une application mobile innovante',
      tone: 'professional',
      retryCount: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: true,
    suggestedAction: 'Vérifiez que vous êtes connecté à internet et réessayez',
    helpUrl: '/help/network-issues'
  },
  [ErrorType.VALIDATION]: {
    id: 'demo-validation-error',
    type: ErrorType.VALIDATION,
    message: 'L\'idée saisie ne respecte pas les critères de validation requis.',
    timestamp: new Date(),
    context: {
      idea: 'App',
      tone: 'professional',
      retryCount: 0,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: false,
    suggestedAction: 'Ajoutez plus de détails à votre idée (minimum 10 caractères)',
    helpUrl: '/help/validation-errors'
  },
  [ErrorType.TIMEOUT]: {
    id: 'demo-timeout-error',
    type: ErrorType.TIMEOUT,
    message: 'La génération du pitch a pris trop de temps et a été interrompue.',
    timestamp: new Date(),
    context: {
      idea: 'Une plateforme révolutionnaire qui transforme complètement la façon dont les entreprises gèrent leurs processus internes avec une approche innovante basée sur l\'intelligence artificielle et l\'apprentissage automatique pour optimiser les performances et réduire les coûts opérationnels',
      tone: 'professional',
      retryCount: 2,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: true,
    suggestedAction: 'Essayez avec une idée plus concise ou réessayez plus tard',
    helpUrl: '/help/timeout-issues'
  },
  [ErrorType.SERVER]: {
    id: 'demo-server-error',
    type: ErrorType.SERVER,
    message: 'Nos serveurs rencontrent actuellement des difficultés techniques temporaires.',
    timestamp: new Date(),
    context: {
      idea: 'Une application de livraison de nourriture',
      tone: 'casual',
      retryCount: 0,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: true,
    suggestedAction: 'Nos équipes techniques travaillent à résoudre le problème',
    helpUrl: '/help/server-errors'
  },
  [ErrorType.AI_SERVICE]: {
    id: 'demo-ai-service-error',
    type: ErrorType.AI_SERVICE,
    message: 'Le service de génération IA est temporairement indisponible en raison d\'une maintenance.',
    timestamp: new Date(),
    context: {
      idea: 'Un service de coaching personnalisé',
      tone: 'inspirational',
      retryCount: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: true,
    suggestedAction: 'Le service sera rétabli sous peu, veuillez réessayer dans quelques minutes',
    helpUrl: '/help/ai-service-issues'
  },
  [ErrorType.UNKNOWN]: {
    id: 'demo-unknown-error',
    type: ErrorType.UNKNOWN,
    message: 'Une erreur inattendue s\'est produite lors de la génération de votre pitch.',
    timestamp: new Date(),
    context: {
      idea: 'Une solution innovante',
      tone: 'professional',
      retryCount: 0,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    retryable: true,
    suggestedAction: 'Si le problème persiste, contactez notre support technique',
    helpUrl: '/help/general-issues'
  }
}

export function ErrorDisplayDemo() {
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType>(ErrorType.NETWORK)
  const [showCooldown, setShowCooldown] = useState(false)
  const [retryDisabled, setRetryDisabled] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(5)

  const handleRetry = () => {
    console.log('Retry clicked for error type:', selectedErrorType)
    alert(`Retry action triggered for ${selectedErrorType} error`)
  }

  const handleDismiss = () => {
    console.log('Dismiss clicked for error type:', selectedErrorType)
    alert(`Error dismissed for ${selectedErrorType} error`)
  }

  const currentError = DEMO_ERRORS[selectedErrorType]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Démonstration ErrorDisplay
        </h1>
        <p className="text-gray-600">
          Testez les différents types d'erreurs et leurs fonctionnalités
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Contrôles de démonstration</h2>
        
        {/* Error Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type d'erreur
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(ErrorType).map((errorType) => (
              <Button
                key={errorType}
                onClick={() => setSelectedErrorType(errorType)}
                variant={selectedErrorType === errorType ? "default" : "outline"}
                size="sm"
                className="justify-start"
              >
                {errorType.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Options d'état</h3>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={retryDisabled}
                onChange={(e) => setRetryDisabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Désactiver le retry</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCooldown}
                onChange={(e) => setShowCooldown(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Afficher le cooldown</span>
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configuration cooldown</h3>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Durée du cooldown (secondes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display Preview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Aperçu</h2>
        
        <ErrorDisplay
          error={currentError}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
          retryDisabled={retryDisabled}
          cooldownSeconds={showCooldown ? cooldownSeconds : 0}
        />
      </div>

      {/* Error Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Détails de l'erreur actuelle
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
            <dl className="space-y-1">
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">Type:</dt>
                <dd className="text-gray-900">{currentError.type}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">ID:</dt>
                <dd className="text-gray-900 font-mono text-xs">{currentError.id}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">Retryable:</dt>
                <dd className="text-gray-900">{currentError.retryable ? 'Oui' : 'Non'}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Contexte</h4>
            <dl className="space-y-1">
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">Idée:</dt>
                <dd className="text-gray-900 truncate">{currentError.context.idea}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">Ton:</dt>
                <dd className="text-gray-900">{currentError.context.tone}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-600 w-20">Tentatives:</dt>
                <dd className="text-gray-900">{currentError.context.retryCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Instructions d'utilisation
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Sélectionnez un type d'erreur</strong> pour voir l'affichage correspondant</p>
          <p>• <strong>Activez le cooldown</strong> pour tester la fonctionnalité de temporisation</p>
          <p>• <strong>Désactivez le retry</strong> pour voir l'état désactivé du bouton</p>
          <p>• <strong>Cliquez sur les boutons</strong> pour tester les actions (alertes de démonstration)</p>
          <p>• <strong>Ouvrez la console</strong> pour voir les logs des actions</p>
        </div>
      </div>
    </div>
  )
}