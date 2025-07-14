import { NextResponse } from 'next/server'
import { aiGenerator } from '@/lib/ai/ai-generator'

export async function GET() {
  try {
    const availableProviders = await aiGenerator.getAvailableProviders()
    const providersInfo = aiGenerator.getAllProvidersInfo()
    const config = aiGenerator.getConfig()

    return NextResponse.json({
      availableProviders,
      providersInfo,
      config: {
        preferredProvider: config.preferredProvider,
        fallbackProviders: config.fallbackProviders,
      },
      status: 'healthy',
    })
  } catch (error) {
    console.error('AI status check failed:', error)
    return NextResponse.json(
      { 
        error: 'AI status check failed',
        status: 'unhealthy',
        availableProviders: [],
      },
      { status: 500 }
    )
  }
}