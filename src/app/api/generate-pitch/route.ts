import { NextRequest, NextResponse } from 'next/server'
import { generatePitch } from '@/lib/ai/pitch-generator'
import { validateIdea, validateTone } from '@/lib/utils/validation'
import { classifyError, globalErrorHandler } from '@/lib/error-handler'
import { pitchGenerationLimiter } from '@/lib/rate-limiter'
import { ErrorType, GenerationContext } from '@/types/enhanced-errors'

/**
 * Generate a unique session ID for request tracking
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Extract client information from request
 */
function getClientInfo(request: NextRequest) {
  return {
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    referer: request.headers.get('referer') || 'unknown'
  }
}

/**
 * Create structured error response with enhanced information
 */
function createErrorResponse(
  error: any,
  context: Partial<GenerationContext>,
  clientInfo: ReturnType<typeof getClientInfo>
) {
  const enhancedError = classifyError(error, context)
  
  // Log the error with full context including client info
  globalErrorHandler.handleError(error, {
    ...context,
    sessionId: context.sessionId || generateSessionId(),
    userAgent: clientInfo.userAgent,
    clientIp: clientInfo.ip,
    referer: clientInfo.referer
  })

  // Determine appropriate HTTP status code
  let statusCode = 500
  let suggestedAction = 'Veuillez réessayer plus tard'
  let retryAfter: number | undefined

  switch (enhancedError.type) {
    case ErrorType.VALIDATION:
      statusCode = 400
      suggestedAction = 'Vérifiez vos données et corrigez les erreurs'
      break
    case ErrorType.TIMEOUT:
      statusCode = 408
      suggestedAction = 'Réessayez avec une idée plus courte'
      retryAfter = 30 // seconds
      break
    case ErrorType.SERVER:
      statusCode = 500
      suggestedAction = 'Réessayez dans quelques minutes'
      retryAfter = 300 // 5 minutes
      break
    case ErrorType.AI_SERVICE:
      statusCode = 503
      suggestedAction = 'Service IA temporairement indisponible'
      retryAfter = 180 // 3 minutes
      break
    case ErrorType.NETWORK:
      statusCode = 502
      suggestedAction = 'Problème de connexion, réessayez'
      retryAfter = 60 // 1 minute
      break
    default:
      statusCode = 500
      suggestedAction = 'Erreur inattendue, contactez le support si cela persiste'
  }

  const response = {
    error: {
      id: enhancedError.id,
      type: enhancedError.type,
      message: enhancedError.message,
      suggestedAction,
      retryable: enhancedError.retryable,
      helpUrl: enhancedError.helpUrl,
      timestamp: enhancedError.timestamp.toISOString()
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString()
  }

  return NextResponse.json(response, { 
    status: statusCode,
    headers
  })
}

export async function POST(request: NextRequest) {
  const sessionId = generateSessionId()
  const clientInfo = getClientInfo(request)
  let context: Partial<GenerationContext> = {
    sessionId,
    timestamp: new Date()
  }

  try {
    // Rate limiting check
    const rateLimitResult = pitchGenerationLimiter.checkLimit(request)
    
    if (!rateLimitResult.allowed) {
      // Get rate limit config from the limiter
      const rateLimitConfig = pitchGenerationLimiter.getConfig()
      const windowMinutes = Math.floor(rateLimitConfig.windowMs / 60000)
      
      const error = new Error(`Trop de requêtes. Limite: ${rateLimitConfig.maxRequests} requêtes par ${windowMinutes} minutes`)
      
      const response = NextResponse.json({
        error: {
          id: `rate_limit_${Date.now()}`,
          type: ErrorType.VALIDATION,
          message: 'Limite de requêtes dépassée',
          suggestedAction: `Attendez ${rateLimitResult.retryAfter} secondes avant de réessayer`,
          retryable: true,
          retryAfter: rateLimitResult.retryAfter,
          timestamp: new Date().toISOString()
        }
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '300',
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString()
        }
      })
      
      return response
    }

    // Parse request body with enhanced error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      const error = new Error('Format de requête JSON invalide')
      return createErrorResponse(error, context, clientInfo)
    }

    const { idea, tone } = body
    
    // Update context with request data
    context = {
      ...context,
      idea: typeof idea === 'string' ? idea.substring(0, 100) : undefined, // Truncate for logging
      tone: typeof tone === 'string' ? tone : undefined
    }

    // Enhanced validation with detailed error messages
    if (!idea || typeof idea !== 'string') {
      const error = new Error('Le champ "idea" est requis et doit être une chaîne de caractères non vide')
      return createErrorResponse(error, context, clientInfo)
    }

    if (!tone || typeof tone !== 'string') {
      const error = new Error('Le champ "tone" est requis et doit être une chaîne de caractères valide')
      return createErrorResponse(error, context, clientInfo)
    }

    // Validate idea content with enhanced feedback
    const ideaValidation = validateIdea(idea)
    if (!ideaValidation.isValid) {
      const errorMessages = ideaValidation.errors.map(e => e.message).join(', ')
      const error = new Error(`Idée invalide: ${errorMessages}`)
      return createErrorResponse(error, context, clientInfo)
    }

    // Validate tone with enhanced feedback
    const toneValidation = validateTone(tone)
    if (!toneValidation.isValid) {
      const errorMessages = toneValidation.errors.map(e => e.message).join(', ')
      const error = new Error(`Ton invalide: ${errorMessages}`)
      return createErrorResponse(error, context, clientInfo)
    }

    // Generate pitch with enhanced timeout and error handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: La génération a pris trop de temps (45 secondes)'))
      }, 45000)
    })

    const pitch = await Promise.race([
      generatePitch(idea.trim(), tone),
      timeoutPromise
    ])
    
    // Log successful generation for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Pitch generated successfully [${sessionId}]`, {
        ideaLength: idea.length,
        tone,
        timestamp: new Date().toISOString()
      })
    }

    // Return success response with rate limit headers
    const rateLimitConfig = pitchGenerationLimiter.getConfig()
    return NextResponse.json({ 
      pitch,
      meta: {
        sessionId,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString()
      }
    })
    
  } catch (error) {
    return createErrorResponse(error, context, clientInfo)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}