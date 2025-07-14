export interface GenerateRequest {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface GenerateResponse {
  content: string
  provider: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  generate(request: GenerateRequest): Promise<GenerateResponse>
  isAvailable(): Promise<boolean>
  getModelInfo(): {
    name: string
    provider: string
    maxTokens: number
    supportedLanguages: string[]
  }
}

export type AIProviderType = 'openai' | 'gemini'

export interface AIConfig {
  preferredProvider: AIProviderType
  fallbackProviders: AIProviderType[]
  retryAttempts: number
  timeout: number
}