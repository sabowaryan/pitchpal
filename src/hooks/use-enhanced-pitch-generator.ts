import { useReducer, useCallback, useRef, useEffect } from 'react'
import { Pitch } from '@/types/pitch'
import {
  EnhancedGenerationState,
  EnhancedError,
  ValidationResult,
  IdeaSuggestion,
  UserPreferences,
  EnhancedProgress,
  ErrorType
} from '@/types/enhanced-errors'
import { classifyError, ErrorHandler } from '@/lib/error-handler'
import { useMemoizedCallback, useCleanup } from '@/lib/performance-utils'
import { useFeatureFlags } from './use-feature-flags'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { recordMonitoringEvent, withPerformanceTracking } from '@/lib/feature-flag-monitoring'

// Action types for the reducer
type GenerationAction =
  | { type: 'GENERATION_START'; payload: { idea: string; tone: string } }
  | { type: 'GENERATION_PROGRESS'; payload: EnhancedProgress }
  | { type: 'GENERATION_SUCCESS'; payload: Pitch }
  | { type: 'GENERATION_ERROR'; payload: EnhancedError }
  | { type: 'GENERATION_CANCEL' }
  | { type: 'RETRY_START' }
  | { type: 'RETRY_DELAY'; payload: number }
  | { type: 'VALIDATION_UPDATE'; payload: ValidationResult }
  | { type: 'PREFERENCES_UPDATE'; payload: UserPreferences }
  | { type: 'RESET_STATE' }

// Initial state
const initialState: EnhancedGenerationState = {
  isLoading: false,
  pitch: null,
  error: null,
  progress: {
    step: 0,
    totalSteps: 4,
    message: '',
    isComplete: false,
    canCancel: false,
    currentOperation: 'validating'
  },
  canCancel: false,
  retryCount: 0,
  lastAttemptTime: 0,
  validationErrors: [],
  suggestions: [],
  preferences: {
    defaultTone: 'professional',
    autoSave: true,
    showSuggestions: true,
    enableRetry: true,
    maxRetryAttempts: 3,
    ideaHistory: [],
    lastUsed: new Date()
  }
}

// Reducer function
function generationReducer(state: EnhancedGenerationState, action: GenerationAction): EnhancedGenerationState {
  switch (action.type) {
    case 'GENERATION_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        pitch: null,
        canCancel: true,
        progress: {
          ...state.progress,
          step: 1,
          message: 'Analyse de votre idée en cours...',
          isComplete: false,
          canCancel: true,
          currentOperation: 'validating'
        },
        lastAttemptTime: Date.now()
      }

    case 'GENERATION_PROGRESS':
      return {
        ...state,
        progress: action.payload
      }

    case 'GENERATION_SUCCESS':
      return {
        ...state,
        isLoading: false,
        pitch: action.payload,
        error: null,
        canCancel: false,
        // Keep retry count for tracking purposes
        progress: {
          ...state.progress,
          step: state.progress.totalSteps,
          message: 'Pitch généré avec succès !',
          isComplete: true,
          canCancel: false,
          currentOperation: 'finalizing'
        }
      }

    case 'GENERATION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        canCancel: false,
        progress: {
          ...state.progress,
          canCancel: false
        }
      }

    case 'GENERATION_CANCEL':
      return {
        ...state,
        isLoading: false,
        canCancel: false,
        progress: {
          ...state.progress,
          message: 'Génération annulée',
          canCancel: false
        }
      }

    case 'RETRY_START':
      return {
        ...state,
        retryCount: state.retryCount + 1,
        error: null,
        isLoading: true,
        canCancel: true,
        progress: {
          ...state.progress,
          step: 1,
          message: `Nouvelle tentative (${state.retryCount + 1})...`,
          isComplete: false,
          canCancel: true,
          currentOperation: 'validating'
        }
      }

    case 'RETRY_DELAY':
      return {
        ...state,
        progress: {
          ...state.progress,
          message: `Nouvelle tentative dans ${Math.ceil(action.payload / 1000)}s...`,
          canCancel: false
        }
      }

    case 'VALIDATION_UPDATE':
      return {
        ...state,
        validationErrors: action.payload.errors,
        suggestions: action.payload.suggestions
      }

    case 'PREFERENCES_UPDATE':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      }

    case 'RESET_STATE':
      return {
        ...initialState,
        preferences: state.preferences // Keep preferences
      }

    default:
      return state
  }
}

interface UseEnhancedPitchGeneratorOptions {
  onSuccess?: (pitch: Pitch) => void
  onError?: (error: EnhancedError) => void
  onCancel?: () => void
}

export function useEnhancedPitchGenerator(options: UseEnhancedPitchGeneratorOptions = {}) {
  const [state, dispatch] = useReducer(generationReducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorHandler = useRef(new ErrorHandler())

  // Feature flags integration
  const { flags, recordMetric } = useFeatureFlags([
    FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
    FEATURE_FLAGS.INTELLIGENT_RETRY,
    FEATURE_FLAGS.REQUEST_CANCELLATION,
    FEATURE_FLAGS.REAL_TIME_VALIDATION,
    FEATURE_FLAGS.USER_PREFERENCES,
    FEATURE_FLAGS.PERFORMANCE_OPTIMIZATIONS
  ])

  // Performance optimization: Use cleanup manager for automatic resource management
  const { cleanup, addTimer, addAbortController, removeTimer } = useCleanup()

  // Load preferences on mount
  useEffect(() => {
    const savedPreferences = loadPreferences()
    if (savedPreferences) {
      dispatch({ type: 'PREFERENCES_UPDATE', payload: savedPreferences })
    }
  }, [])

  // Cleanup on unmount - now handled by useCleanup hook
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Progress simulation with automatic cleanup
  const simulateProgress = useCallback(() => {
    const steps = [
      { step: 1, message: 'Analyse de votre idée en cours...', operation: 'validating' as const, delay: 500 },
      { step: 2, message: 'Structuration du pitch...', operation: 'generating' as const, delay: 1000 },
      { step: 3, message: 'Génération du contenu...', operation: 'processing' as const, delay: 1500 },
      { step: 4, message: 'Finalisation de votre présentation...', operation: 'finalizing' as const, delay: 500 }
    ]

    let currentStep = 0

    const startProgress = () => {
      const progressInterval = addTimer(setInterval(() => {
        if (currentStep < steps.length) {
          const step = steps[currentStep]
          dispatch({
            type: 'GENERATION_PROGRESS',
            payload: {
              step: step.step,
              totalSteps: steps.length,
              message: step.message,
              isComplete: false,
              canCancel: true,
              currentOperation: step.operation
            }
          })
          currentStep++
        } else {
          removeTimer(progressInterval)
        }
      }, 800))

      return progressInterval
    }

    const progressInterval = startProgress()

    return () => {
      removeTimer(progressInterval)
    }
  }, [addTimer, removeTimer])

  // Performance optimization: Memoized validation function to avoid recalculating for same inputs
  const validateIdea = useMemoizedCallback((idea: string): ValidationResult => {
    const errors: any[] = []
    const warnings: any[] = []
    const suggestions: IdeaSuggestion[] = []
    let score = 0

    // Basic validation
    if (!idea?.trim()) {
      errors.push({
        field: 'idea',
        type: 'required',
        message: 'L\'idée ne peut pas être vide'
      })
    } else {
      score += 20

      if (idea.trim().length < 10) {
        errors.push({
          field: 'idea',
          type: 'minLength',
          message: 'L\'idée doit contenir au moins 10 caractères'
        })
      } else {
        score += 20
      }

      if (idea.trim().length > 500) {
        warnings.push({
          field: 'idea',
          type: 'maxLength',
          message: 'L\'idée est très longue, considérez la raccourcir'
        })
      } else {
        score += 10
      }

      // Content analysis for suggestions
      const lowerIdea = idea.toLowerCase()

      if (!lowerIdea.includes('problème') && !lowerIdea.includes('problem')) {
        suggestions.push({
          type: 'vague_problem',
          message: 'Décrivez clairement le problème que vous résolvez',
          example: 'Ex: "Les entrepreneurs perdent du temps à créer des pitches"',
          priority: 'high'
        })
      } else {
        score += 15
      }

      if (!lowerIdea.includes('solution') && !lowerIdea.includes('résout')) {
        suggestions.push({
          type: 'unclear_solution',
          message: 'Expliquez votre solution de manière claire',
          example: 'Ex: "Notre IA génère des pitches personnalisés en 2 minutes"',
          priority: 'high'
        })
      } else {
        score += 15
      }

      if (!lowerIdea.includes('marché') && !lowerIdea.includes('client') && !lowerIdea.includes('utilisateur')) {
        suggestions.push({
          type: 'missing_target',
          message: 'Précisez votre marché cible ou vos utilisateurs',
          example: 'Ex: "Pour les startups en phase de levée de fonds"',
          priority: 'medium'
        })
      } else {
        score += 10
      }

      if (idea.trim().length < 50) {
        suggestions.push({
          type: 'add_context',
          message: 'Ajoutez plus de contexte pour un meilleur résultat',
          example: 'Incluez le secteur, la taille du marché, ou votre avantage concurrentiel',
          priority: 'low'
        })
      } else {
        score += 10
      }
    }

    return {
      isValid: errors.length === 0,
      score: Math.min(score, 100),
      errors,
      warnings,
      suggestions
    }
  }, [])

  // Preferences management
  const savePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    try {
      const currentPrefs = state.preferences
      const updatedPrefs = { ...currentPrefs, ...prefs, lastUsed: new Date() }
      localStorage.setItem('pitchpal_preferences', JSON.stringify(updatedPrefs))
      dispatch({ type: 'PREFERENCES_UPDATE', payload: updatedPrefs })
    } catch (error) {
      console.warn('Failed to save preferences:', error)
    }
  }, [state.preferences])

  const loadPreferences = useCallback((): UserPreferences | null => {
    try {
      const saved = localStorage.getItem('pitchpal_preferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...initialState.preferences,
          ...parsed,
          lastUsed: new Date(parsed.lastUsed || Date.now())
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error)
    }
    return null
  }, [])

  // Main generation function with retry logic and feature flag integration
  const generatePitch = useCallback(async (idea: string, tone: string) => {
    const startTime = performance.now()

    // Record usage for monitoring
    recordMonitoringEvent(FEATURE_FLAGS.FULL_ENHANCED_SYSTEM, 'usage', { idea: idea.length, tone })

    // Validate input (with feature flag check)
    const validation = flags[FEATURE_FLAGS.REAL_TIME_VALIDATION]
      ? validateIdea(idea)
      : { isValid: idea.trim().length >= 10, score: 50, errors: [], warnings: [], suggestions: [] }

    dispatch({ type: 'VALIDATION_UPDATE', payload: validation })

    if (!validation.isValid) {
      const validationError = flags[FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]
        ? classifyError(
          new Error(`validation failed: ${validation.errors[0]?.message || 'Invalid input'}`),
          { idea, tone, timestamp: new Date(), sessionId: 'session_' + Date.now() }
        )
        : {
          id: `error_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          type: ErrorType.VALIDATION,
          message: validation.errors[0]?.message || 'Invalid input',
          timestamp: new Date(),
          retryable: false,
          context: {
            idea,
            tone,
            retryCount: 0,
            userAgent: navigator.userAgent || 'unknown'
          }
        }

      dispatch({ type: 'GENERATION_ERROR', payload: validationError })
      recordMetric(FEATURE_FLAGS.REAL_TIME_VALIDATION, 'error')
      options.onError?.(validationError)
      return
    }

    // Start generation
    dispatch({ type: 'GENERATION_START', payload: { idea, tone } })

    // Create new AbortController with automatic cleanup
    abortControllerRef.current = addAbortController(new AbortController())

    // Start progress simulation
    const clearProgress = simulateProgress()

    try {
      const timeoutId = addTimer(setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }, 60000)) // 60 second timeout

      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.trim(),
          tone: tone || state.preferences.defaultTone
        }),
        signal: abortControllerRef.current.signal
      })

      removeTimer(timeoutId)

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`

        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data || !data.pitch) {
        throw new Error('Réponse invalide du serveur - aucun pitch généré')
      }

      // Validate pitch structure
      const requiredFields = ['tagline', 'problem', 'solution', 'targetMarket', 'businessModel', 'competitiveAdvantage']
      for (const field of requiredFields) {
        if (!data.pitch[field]) {
          throw new Error(`Pitch incomplet - champ manquant: ${field}`)
        }
      }

      if (!data.pitch.pitchDeck || !Array.isArray(data.pitch.pitchDeck.slides) || data.pitch.pitchDeck.slides.length === 0) {
        throw new Error('Pitch deck invalide ou vide')
      }

      // Add metadata to pitch - Performance optimization: Use crypto.randomUUID() instead of deprecated substr
      const enrichedPitch: Pitch = {
        ...data.pitch,
        id: `pitch_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`,
        createdAt: new Date(),
        originalIdea: idea.trim(),
        tone: tone || state.preferences.defaultTone
      }

      // Save to history if auto-save is enabled
      if (state.preferences.autoSave) {
        const updatedHistory = [idea.trim(), ...state.preferences.ideaHistory.slice(0, 9)]
        savePreferences({ ideaHistory: updatedHistory })
      }

      dispatch({ type: 'GENERATION_SUCCESS', payload: enrichedPitch })
      options.onSuccess?.(enrichedPitch)

    } catch (err) {
      console.error('Erreur génération pitch:', err)

      const enhancedError = classifyError(err, {
        idea: idea.trim(),
        tone: tone || state.preferences.defaultTone,
        timestamp: new Date(),
        sessionId: crypto.randomUUID()
      })

      // Check if we should retry automatically
      if (state.preferences.enableRetry &&
        errorHandler.current.shouldRetry(enhancedError, state.retryCount)) {

        const retryDelay = errorHandler.current.getRetryDelay(enhancedError, state.retryCount)

        dispatch({ type: 'RETRY_DELAY', payload: retryDelay })

        // Performance optimization: Use cleanup manager for retry timeout
        retryTimeoutRef.current = addTimer(setTimeout(() => {
          retryGeneration()
        }, retryDelay))

        return
      }

      dispatch({ type: 'GENERATION_ERROR', payload: enhancedError })
      options.onError?.(enhancedError)
    } finally {
      clearProgress()
      abortControllerRef.current = null
    }
  }, [state.retryCount, state.preferences, validateIdea, simulateProgress, savePreferences, options, addTimer, addAbortController, removeTimer])

  // Cancel generation with automatic cleanup
  const cancelGeneration = useCallback(() => {
    // Performance optimization: Use cleanup manager to handle all resource cleanup
    cleanup()

    // Reset refs
    abortControllerRef.current = null
    retryTimeoutRef.current = null

    dispatch({ type: 'GENERATION_CANCEL' })
    options.onCancel?.()
  }, [options, cleanup])

  // Manual retry
  const retryGeneration = useCallback(async () => {
    if (!state.error) return

    const context = state.error.context
    if (context?.idea && context?.tone) {
      dispatch({ type: 'RETRY_START' })

      // Call generatePitch with the same parameters but don't reset retry count
      const idea = context.idea
      const tone = context.tone

      // Validate input
      const validation = validateIdea(idea)
      dispatch({ type: 'VALIDATION_UPDATE', payload: validation })

      if (!validation.isValid) {
        const validationError = classifyError(
          new Error(`validation failed: ${validation.errors[0]?.message || 'Invalid input'}`),
          { idea, tone, timestamp: new Date(), sessionId: crypto.randomUUID() }
        )
        dispatch({ type: 'GENERATION_ERROR', payload: validationError })
        options.onError?.(validationError)
        return
      }

      // Create new AbortController with automatic cleanup
      abortControllerRef.current = addAbortController(new AbortController())

      // Start progress simulation
      const clearProgress = simulateProgress()

      try {
        const timeoutId = addTimer(setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
        }, 60000)) // 60 second timeout

        const response = await fetch('/api/generate-pitch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: idea.trim(),
            tone: tone || state.preferences.defaultTone
          }),
          signal: abortControllerRef.current.signal
        })

        removeTimer(timeoutId)

        if (!response.ok) {
          let errorMessage = `Erreur ${response.status}: ${response.statusText}`

          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (parseError) {
            console.warn('Could not parse error response:', parseError)
          }

          throw new Error(errorMessage)
        }

        const data = await response.json()

        if (!data || !data.pitch) {
          throw new Error('Réponse invalide du serveur - aucun pitch généré')
        }

        // Validate pitch structure
        const requiredFields = ['tagline', 'problem', 'solution', 'targetMarket', 'businessModel', 'competitiveAdvantage']
        for (const field of requiredFields) {
          if (!data.pitch[field]) {
            throw new Error(`Pitch incomplet - champ manquant: ${field}`)
          }
        }

        if (!data.pitch.pitchDeck || !Array.isArray(data.pitch.pitchDeck.slides) || data.pitch.pitchDeck.slides.length === 0) {
          throw new Error('Pitch deck invalide ou vide')
        }

        // Performance optimization: Use crypto.randomUUID() instead of deprecated substr
        const enrichedPitch: Pitch = {
          ...data.pitch,
          id: `pitch_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`,
          createdAt: new Date(),
          originalIdea: idea.trim(),
          tone: tone || state.preferences.defaultTone
        }

        // Save to history if auto-save is enabled
        if (state.preferences.autoSave) {
          const updatedHistory = [idea.trim(), ...state.preferences.ideaHistory.slice(0, 9)]
          savePreferences({ ideaHistory: updatedHistory })
        }

        dispatch({ type: 'GENERATION_SUCCESS', payload: enrichedPitch })
        options.onSuccess?.(enrichedPitch)

      } catch (err) {
        console.error('Erreur génération pitch:', err)

        const enhancedError = classifyError(err, {
          idea: idea.trim(),
          tone: tone || state.preferences.defaultTone,
          timestamp: new Date(),
          sessionId: crypto.randomUUID()
        })

        dispatch({ type: 'GENERATION_ERROR', payload: enhancedError })
        options.onError?.(enhancedError)
      } finally {
        clearProgress()
        abortControllerRef.current = null
      }
    }
  }, [state.error, state.retryCount, state.preferences, validateIdea, simulateProgress, savePreferences, options, addTimer, addAbortController, removeTimer])

  // Reset state with automatic cleanup
  const resetState = useCallback(() => {
    // Performance optimization: Use cleanup manager to handle all resource cleanup
    cleanup()

    // Reset refs
    abortControllerRef.current = null
    retryTimeoutRef.current = null

    dispatch({ type: 'RESET_STATE' })
  }, [cleanup])

  // Get suggestions for current idea
  const getSuggestions = useCallback((idea: string): IdeaSuggestion[] => {
    const validation = validateIdea(idea)
    return validation.suggestions
  }, [validateIdea])

  return {
    // Actions
    generatePitch,
    cancelGeneration,
    retryGeneration,
    resetState,

    // State
    state,

    // Validation
    validateIdea,
    getSuggestions,

    // Preferences
    savePreferences,
    loadPreferences
  }
}