import { NextRequest, NextResponse } from 'next/server'
import { generatePitch } from '@/lib/ai/pitch-generator'

export async function POST(request: NextRequest) {
  try {
    const { idea, tone } = await request.json()
    
    if (!idea || !tone) {
      return NextResponse.json(
        { error: 'Idée et ton requis' },
        { status: 400 }
      )
    }

    const pitch = await generatePitch(idea, tone)
    
    return NextResponse.json({ pitch })
  } catch (error) {
    console.error('Erreur génération pitch:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération' },
      { status: 500 }
    )
  }
} 