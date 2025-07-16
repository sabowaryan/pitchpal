/**
 * Error Classification System
 * 
 * This module provides intelligent error classification, context extraction,
 * and suggested actions for different types of errors.
 */

import { ErrorType, EnhancedError } from '@/types/enhanced-errors'

/**
 * Context information that can be extracted from errors
 */
interface ErrorContext {
    idea?: string
    tone?: string
    retryCount: number
    userAgent: string
    timestamp?: Date
    sessionId?: string
    userId?: string
    url?: string
}

/**
 * Classify an error based on its type, message, and properties
 */
export function classifyError(
    error: any,
    context: Partial<ErrorContext> = {}
): EnhancedError {
    const errorType = determineErrorType(error)
    const message = extractErrorMessage(error)
    const retryable = isErrorRetryable(errorType, error)
    const originalError = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
    } : undefined

    return createEnhancedError(
        errorType,
        message,
        retryable,
        originalError,
        context,
        getSuggestedAction(errorType),
        getErrorHelpUrl(errorType)
    )
}

/**
 * Create an enhanced error object with all required fields
 */
export function createEnhancedError(
    type: ErrorType,
    message: string,
    retryable: boolean,
    originalError?: { name: string; message: string; stack?: string } | null,
    context: Partial<ErrorContext> = {},
    suggestedAction?: string,
    helpUrl?: string
): EnhancedError {
    const timestamp = new Date()
    const id = `error_${timestamp.getTime()}_${Math.random().toString(36).slice(2, 10)}`

    return {
        id,
        type,
        message,
        timestamp,
        context: {
            retryCount: 0,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            ...context
        },
        originalError: originalError || undefined,
        retryable,
        suggestedAction,
        helpUrl
    }
}

/**
 * Determine the error type based on error characteristics
 */
function determineErrorType(error: any): ErrorType {
    if (!error) {
        return ErrorType.UNKNOWN
    }

    // Handle string errors
    if (typeof error === 'string') {
        if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
            return ErrorType.NETWORK
        }
        if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('abort')) {
            return ErrorType.TIMEOUT
        }
        if (error.toLowerCase().includes('validation')) {
            return ErrorType.VALIDATION
        }
        return ErrorType.UNKNOWN
    }

    // Handle Error objects
    if (error instanceof Error || (error && typeof error === 'object')) {
        const errorName = error.name?.toLowerCase() || ''
        const errorMessage = error.message?.toLowerCase() || ''

        // Network errors
        if (
            errorName.includes('typeerror') && errorMessage.includes('fetch') ||
            errorName.includes('networkerror') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network request failed') ||
            errorMessage.includes('connection refused') ||
            errorMessage.includes('dns')
        ) {
            return ErrorType.NETWORK
        }

        // Timeout errors
        if (
            errorName.includes('aborterror') ||
            errorName.includes('timeouterror') ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('timed out')
        ) {
            return ErrorType.TIMEOUT
        }

        // Validation errors
        if (
            errorName.includes('validationerror') ||
            errorMessage.includes('validation') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('required')
        ) {
            return ErrorType.VALIDATION
        }

        // Server errors (HTTP status codes)
        if (error.status) {
            const status = parseInt(error.status)
            if (status >= 500) {
                return ErrorType.SERVER
            }
            if (status === 429 || status === 402) {
                return ErrorType.AI_SERVICE
            }
        }

        // AI Service errors
        if (
            errorMessage.includes('quota') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('ai model') ||
            errorMessage.includes('openai') ||
            errorMessage.includes('anthropic')
        ) {
            return ErrorType.AI_SERVICE
        }

        // Server errors by message
        if (
            errorMessage.includes('internal server error') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('bad gateway')
        ) {
            return ErrorType.SERVER
        }
    }

    return ErrorType.UNKNOWN
}

/**
 * Extract a meaningful error message from various error types
 */
function extractErrorMessage(error: any): string {
    if (!error) {
        return 'Erreur inconnue - aucune information disponible'
    }

    if (typeof error === 'string') {
        return error
    }

    if (error instanceof Error) {
        return error.message || 'Erreur sans message'
    }

    if (error && typeof error === 'object') {
        if (error.message) {
            return error.message
        }
        if (error.error) {
            return error.error
        }
        if (error.details) {
            return error.details
        }
        return JSON.stringify(error)
    }

    return 'Erreur inconnue'
}

/**
 * Determine if an error type is retryable
 */
function isErrorRetryable(errorType: ErrorType, error: any): boolean {
    switch (errorType) {
        case ErrorType.NETWORK:
        case ErrorType.TIMEOUT:
        case ErrorType.SERVER:
        case ErrorType.AI_SERVICE:
            return true
        case ErrorType.VALIDATION:
        case ErrorType.UNKNOWN:
        default:
            return false
    }
}

/**
 * Extract context information from error object
 */
export function getErrorContext(error: any): ErrorContext {
    const context: ErrorContext = {
        retryCount: 0,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }

    if (error && typeof error === 'object') {
        if (error.idea) context.idea = error.idea
        if (error.tone) context.tone = error.tone
        if (error.retryCount) context.retryCount = error.retryCount
        if (error.sessionId) context.sessionId = error.sessionId
        if (error.userId) context.userId = error.userId
        if (error.url) context.url = error.url
    }

    return context
}

/**
 * Get suggested action for error type
 */
export function getSuggestedAction(errorType: ErrorType): string {
    switch (errorType) {
        case ErrorType.NETWORK:
            return 'Vérifiez votre connexion internet et réessayez'
        case ErrorType.TIMEOUT:
            return 'Réessayez avec une idée plus courte ou patientez quelques instants'
        case ErrorType.SERVER:
            return 'Le serveur rencontre des difficultés. Réessayez plus tard'
        case ErrorType.AI_SERVICE:
            return 'Service IA temporairement indisponible. Réessayez plus tard'
        case ErrorType.VALIDATION:
            return 'Corrigez les erreurs de saisie et réessayez'
        case ErrorType.UNKNOWN:
        default:
            return 'Une erreur inattendue s\'est produite. Contactez le support si le problème persiste'
    }
}

/**
 * Get help URL for error type
 */
export function getErrorHelpUrl(errorType: ErrorType): string {
    const baseUrl = '/help'

    switch (errorType) {
        case ErrorType.NETWORK:
            return `${baseUrl}/network-issues`
        case ErrorType.TIMEOUT:
            return `${baseUrl}/timeout-issues`
        case ErrorType.SERVER:
            return `${baseUrl}/server-issues`
        case ErrorType.AI_SERVICE:
            return `${baseUrl}/ai-service-issues`
        case ErrorType.VALIDATION:
            return `${baseUrl}/validation-help`
        case ErrorType.UNKNOWN:
        default:
            return `${baseUrl}/general-help`
    }
}

/**
 * Check if error should trigger automatic retry
 */
export function shouldAutoRetry(error: EnhancedError, retryCount: number, maxRetries: number): boolean {
    if (retryCount >= maxRetries) {
        return false
    }

    if (!error.retryable) {
        return false
    }

    // Don't auto-retry validation errors
    if (error.type === ErrorType.VALIDATION) {
        return false
    }

    // Be more conservative with AI service errors
    if (error.type === ErrorType.AI_SERVICE && retryCount >= 2) {
        return false
    }

    return true
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const delay = baseDelay * Math.pow(2, retryCount)
    return Math.min(delay, maxDelay)
}

/**
 * Log error for monitoring and debugging
 */
export function logError(error: EnhancedError, context?: any): void {
    const logData = {
        errorId: error.id,
        type: error.type,
        message: error.message,
        timestamp: error.timestamp,
        retryable: error.retryable,
        context: error.context,
        additionalContext: context
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
        console.error('[Error Classification]', logData)
    }

    // In production, you would send this to your monitoring service
    // Example: sendToMonitoring(logData)
}