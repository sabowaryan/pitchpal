import { NextRequest, NextResponse } from 'next/server'
import { ErrorLog } from '@/types/enhanced-errors'

/**
 * API endpoint for logging client-side errors
 * In production, this would integrate with external logging services
 */
export async function POST(request: NextRequest) {
  try {
    const errorLog: ErrorLog = await request.json()
    
    // Validate the error log structure
    if (!errorLog.errorId || !errorLog.error || !errorLog.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error log format' },
        { status: 400 }
      )
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Client Error Log - ${errorLog.errorId}`)
      console.log('Timestamp:', errorLog.timestamp)
      console.log('Error Type:', errorLog.error.type)
      console.log('Message:', errorLog.error.message)
      console.log('Context:', errorLog.context)
      console.log('User Agent:', errorLog.userAgent)
      console.log('URL:', errorLog.url)
      if (errorLog.error.originalError) {
        console.log('Original Error:', errorLog.error.originalError)
      }
      console.groupEnd()
    }

    // In production, you would send this to your logging service
    // Examples: Sentry, LogRocket, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example integration with external logging service
      await sendToLoggingService(errorLog)
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Failed to log error:', error)
    
    // Don't fail the client request if logging fails
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

/**
 * Send error log to external logging service
 * This is a placeholder for actual service integration
 */
async function sendToLoggingService(errorLog: ErrorLog): Promise<void> {
  try {
    // Example: Send to Sentry
    // Sentry.captureException(errorLog.error.originalError, {
    //   tags: {
    //     errorType: errorLog.error.type,
    //     sessionId: errorLog.context.sessionId
    //   },
    //   extra: errorLog
    // })

    // Example: Send to custom logging endpoint
    // await fetch(process.env.LOGGING_SERVICE_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // })

    // For now, just simulate the call
    console.log('Error log would be sent to external service:', errorLog.errorId)
    
  } catch (loggingError) {
    console.error('Failed to send to logging service:', loggingError)
    // Don't throw - logging failures shouldn't break the application
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