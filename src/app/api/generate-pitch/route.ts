import { NextRequest, NextResponse } from 'next/server'
import { generatePitch } from '@/lib/ai/pitch-generator'
import { validateIdea, validateTone } from '@/lib/utils/validation'

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400 }
      )
    }

    const { idea, tone } = body
    
    // Validate required fields
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "idea" est requis et doit être une chaîne de caractères' },
        { status: 400 }
      )
    }

    if (!tone || typeof tone !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "tone" est requis et doit être une chaîne de caractères' },
        { status: 400 }
      )
    }

    // Validate idea content
    const ideaValidation = validateIdea(idea)
    if (!ideaValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Idée invalide', 
          details: ideaValidation.errors 
        },
        { status: 400 }
      )
    }

    // Validate tone
    const toneValidation = validateTone(tone)
    if (!toneValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Ton invalide', 
          details: toneValidation.errors 
        },
        { status: 400 }
      )
    }

    // Generate pitch with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: La génération a pris trop de temps')), 45000)
    })

    const pitch = await Promise.race([
      generatePitch(idea.trim(), tone),
      timeoutPromise
    ])
    
    return NextResponse.json({ pitch })
    
  } catch (error) {
    console.error('Erreur génération pitch:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        return NextResponse.json(
          { error: 'La génération a pris trop de temps. Veuillez réessayer.' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('All AI providers failed')) {
        return NextResponse.json(
          { error: 'Service IA temporairement indisponible. Veuillez réessayer dans quelques minutes.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Erreur de configuration du service IA.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
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