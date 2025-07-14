import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf/generator'

export async function POST(request: NextRequest) {
  try {
    const { pitch } = await request.json()
    
    if (!pitch) {
      return NextResponse.json(
        { error: 'Pitch requis' },
        { status: 400 }
      )
    }

    const pdfBuffer = await generatePDF(pitch)
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="pitch-deck.pdf"',
      },
    })
  } catch (error) {
    console.error('Erreur export PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export PDF' },
      { status: 500 }
    )
  }
} 