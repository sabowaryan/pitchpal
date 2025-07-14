import { OpenAIProvider } from './providers/openai'
import { GeminiProvider } from './providers/gemini'
import { AIProvider, AIProviderType, GenerateRequest, GenerateResponse, AIConfig } from './types'

export class AIGenerator {
  private providers: Map<AIProviderType, AIProvider>
  private config: AIConfig

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      preferredProvider: 'openai',
      fallbackProviders: ['gemini'],
      retryAttempts: 3,
      timeout: 30000,
      ...config,
    }

    this.providers = new Map()
    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      this.providers.set('openai', new OpenAIProvider())
    } catch (error) {
      console.warn('OpenAI provider initialization failed:', error)
    }

    try {
      this.providers.set('gemini', new GeminiProvider())
    } catch (error) {
      console.warn('Gemini provider initialization failed:', error)
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const providersToTry = [
      this.config.preferredProvider,
      ...this.config.fallbackProviders,
    ]

    let lastError: Error | null = null

    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType)
      
      if (!provider) {
        console.warn(`Provider ${providerType} not available`)
        continue
      }

      // Check if provider is available
      const isAvailable = await provider.isAvailable()
      if (!isAvailable) {
        console.warn(`Provider ${providerType} is not available`)
        continue
      }

      // Try generation with retries
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          console.log(`Attempting generation with ${providerType} (attempt ${attempt}/${this.config.retryAttempts})`)
          
          const response = await this.generateWithTimeout(provider, request)
          
          console.log(`Successfully generated with ${providerType}`)
          return response
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          console.warn(`Generation attempt ${attempt} failed with ${providerType}:`, lastError.message)
          
          // Wait before retry (exponential backoff)
          if (attempt < this.config.retryAttempts) {
            await this.delay(Math.pow(2, attempt) * 1000)
          }
        }
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  private async generateWithTimeout(provider: AIProvider, request: GenerateRequest): Promise<GenerateResponse> {
    return Promise.race([
      provider.generate(request),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Generation timeout')), this.config.timeout)
      ),
    ])
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAvailableProviders(): Promise<AIProviderType[]> {
    const available: AIProviderType[] = []
    
    for (const [type, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(type)
      }
    }
    
    return available
  }

  getProviderInfo(providerType: AIProviderType) {
    const provider = this.providers.get(providerType)
    return provider?.getModelInfo()
  }

  getAllProvidersInfo() {
    const info: Record<string, any> = {}
    
    for (const [type, provider] of this.providers) {
      info[type] = provider.getModelInfo()
    }
    
    return info
  }

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
  }

  getConfig(): AIConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const aiGenerator = new AIGenerator()