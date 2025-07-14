'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Cpu } from 'lucide-react'

interface AIStatus {
  availableProviders: string[]
  providersInfo: Record<string, any>
  config: {
    preferredProvider: string
    fallbackProviders: string[]
  }
  status: 'healthy' | 'unhealthy'
}

export function AIStatusIndicator() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai-status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check AI status:', error)
      setStatus({
        availableProviders: [],
        providersInfo: {},
        config: { preferredProvider: '', fallbackProviders: [] },
        status: 'unhealthy'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-neutral-500">
        <Cpu className="w-4 h-4 animate-spin" />
        <span>Vérification IA...</span>
      </div>
    )
  }

  if (!status) return null

  const getStatusIcon = () => {
    if (status.status === 'healthy' && status.availableProviders.length > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (status.availableProviders.length > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    if (status.availableProviders.length === 0) {
      return 'Aucune IA disponible'
    } else if (status.availableProviders.length === 1) {
      return `${status.availableProviders[0].toUpperCase()} disponible`
    } else {
      return `${status.availableProviders.length} IA disponibles`
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getStatusIcon()}
      <span className="text-neutral-600">{getStatusText()}</span>
      
      {status.availableProviders.length > 0 && (
        <div className="flex items-center space-x-1 ml-2">
          {status.availableProviders.map((provider) => (
            <span
              key={provider}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                provider === status.config.preferredProvider
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {provider.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}