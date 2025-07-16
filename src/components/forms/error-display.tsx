'use client'

import { useState, useEffect } from 'react'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'
import { 
  AlertTriangle, 
  Wifi, 
  Clock, 
  Server, 
  Bot, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink,
  MessageCircle
} from 'lucide-react'
import { Button } from '../ui/button'

interface ErrorDisplayProps {
  error: EnhancedError
  onRetry?: () => void
  onDismiss?: () => void
  retryDisabled?: boolean
  cooldownSeconds?: number
}

// Error type configurations with icons, colors, and help URLs
const ERROR_CONFIGS = {
  [ErrorType.NETWORK]: {
    icon: Wifi,
    title: 'Problème de connexion',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    helpUrl: '/help/network-issues',
    showRetry: true,
    showSupport: false
  },
  [ErrorType.VALIDATION]: {
    icon: AlertTriangle,
    title: 'Erreur de validation',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    helpUrl: '/help/validation-errors',
    showRetry: false,
    showSupport: false
  },
  [ErrorType.TIMEOUT]: {
    icon: Clock,
    title: 'Délai d\'attente dépassé',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    helpUrl: '/help/timeout-issues',
    showRetry: true,
    showSupport: false
  },
  [ErrorType.SERVER]: {
    icon: Server,
    title: 'Erreur serveur',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    helpUrl: '/help/server-errors',
    showRetry: true,
    showSupport: true
  },
  [ErrorType.AI_SERVICE]: {
    icon: Bot,
    title: 'Service IA indisponible',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    helpUrl: '/help/ai-service-issues',
    showRetry: true,
    showSupport: true
  },
  [ErrorType.UNKNOWN]: {
    icon: AlertTriangle,
    title: 'Erreur inattendue',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    helpUrl: '/help/general-issues',
    showRetry: true,
    showSupport: true
  }
}

// Contextual action messages based on error type
const ACTION_MESSAGES = {
  [ErrorType.NETWORK]: 'Vérifiez votre connexion internet et réessayez',
  [ErrorType.VALIDATION]: 'Corrigez les erreurs de saisie ci-dessus',
  [ErrorType.TIMEOUT]: 'Essayez avec une idée plus courte ou réessayez plus tard',
  [ErrorType.SERVER]: 'Nos serveurs rencontrent des difficultés temporaires',
  [ErrorType.AI_SERVICE]: 'Le service de génération IA est temporairement indisponible',
  [ErrorType.UNKNOWN]: 'Une erreur inattendue s\'est produite'
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  retryDisabled = false,
  cooldownSeconds = 0 
}: ErrorDisplayProps) {
  const [countdown, setCountdown] = useState(cooldownSeconds)
  
  const config = ERROR_CONFIGS[error.type] || ERROR_CONFIGS[ErrorType.UNKNOWN]
  const IconComponent = config.icon
  const actionMessage = ACTION_MESSAGES[error.type] || ACTION_MESSAGES[ErrorType.UNKNOWN]

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      setCountdown(cooldownSeconds)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownSeconds])

  const handleRetry = () => {
    if (onRetry && countdown === 0 && !retryDisabled) {
      onRetry()
    }
  }

  const handleHelpClick = () => {
    window.open(config.helpUrl, '_blank', 'noopener,noreferrer')
  }

  const handleSupportClick = () => {
    // Open support contact form or email
    window.open('mailto:support@pitchgenerator.com?subject=Erreur%20de%20génération&body=' + 
      encodeURIComponent(`Erreur ID: ${error.id}\nType: ${error.type}\nMessage: ${error.message}\nTimestamp: ${error.timestamp}`), 
      '_blank'
    )
  }

  const isRetryAvailable = config.showRetry && onRetry && countdown === 0 && !retryDisabled

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl p-6 animate-fade-in`}>
      <div className="flex items-start space-x-4">
        {/* Error Icon */}
        <div className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0 border ${config.borderColor}`}>
          <IconComponent className={`w-5 h-5 ${config.color}`} />
        </div>
        
        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* Error Title */}
          <h4 className={`font-semibold ${config.color} mb-2 text-lg`}>
            {config.title}
          </h4>
          
          {/* Error Message */}
          <p className={`${config.color.replace('600', '700')} mb-3 leading-relaxed`}>
            {error.message}
          </p>
          
          {/* Suggested Action */}
          {error.suggestedAction && (
            <p className={`text-sm ${config.color.replace('600', '600')} mb-4 font-medium`}>
              💡 {error.suggestedAction}
            </p>
          )}
          
          {/* Action Message */}
          <p className={`text-sm ${config.color.replace('600', '500')} mb-4`}>
            {actionMessage}
          </p>
          
          {/* Cooldown Display */}
          {countdown > 0 && (
            <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
              <Clock className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm ${config.color}`}>
                Nouvelle tentative possible dans {countdown} seconde{countdown > 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Retry Button */}
            {config.showRetry && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={!isRetryAvailable}
                variant={isRetryAvailable ? "default" : "secondary"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${countdown > 0 ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 ? `Réessayer (${countdown}s)` : 'Réessayer'}
                </span>
              </Button>
            )}
            
            {/* Help Button */}
            <Button
              onClick={handleHelpClick}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Aide</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
            
            {/* Support Button */}
            {config.showSupport && (
              <Button
                onClick={handleSupportClick}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Support</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            
            {/* Dismiss Button */}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className={`${config.color} hover:${config.bgColor}`}
              >
                Fermer
              </Button>
            )}
          </div>
          
          {/* Error Details (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className={`text-xs ${config.color} cursor-pointer hover:underline`}>
                Détails techniques (développement)
              </summary>
              <div className={`mt-2 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                <pre className={`text-xs ${config.color} whitespace-pre-wrap`}>
                  {JSON.stringify({
                    id: error.id,
                    type: error.type,
                    timestamp: error.timestamp,
                    retryCount: error.context.retryCount,
                    originalError: error.originalError
                  }, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}