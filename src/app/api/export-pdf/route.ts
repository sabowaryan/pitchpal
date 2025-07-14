import { NextRequest, NextResponse } from 'next/server'
import { generatePDF, PDFOptions } from '@/lib/pdf/generator'
import { validatePitch } from '@/lib/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const { pitch, options = {} } = await request.json()
    
    // Validate pitch data
    if (!pitch) {
      return NextResponse.json(
        { error: 'Pitch data is required' },
        { status: 400 }
      )
    }

    const validation = validatePitch(pitch)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid pitch data', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Validate PDF options
    const pdfOptions: PDFOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'high',
      includeBackground: options.includeBackground !== false
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(pitch, pdfOptions)
    
    // Set appropriate headers
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pitch-deck-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    return new NextResponse(pdfBuffer, { headers })
    
  } catch (error) {
    console.error('PDF export error:', error)
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'PDF generation timeout. Please try again.' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('memory')) {
        return NextResponse.json(
          { error: 'Insufficient memory for PDF generation. Try reducing quality.' },
          { status: 507 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
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