import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, GenerateRequest, GenerateResponse } from '../types'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI
  private model: any
  
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required')
    }
    
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.client.getGenerativeModel({ model: 'gemini-pro' })
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const prompt = `${request.systemPrompt}\n\nUser: ${request.userPrompt}`
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000,
        },
      })

      const response = await result.response
      const content = response.text()
      
      if (!content) {
        throw new Error('No content generated')
      }

      return {
        content,
        provider: 'gemini',
        model: 'gemini-pro',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      }
    } catch (error) {
      console.error('Gemini generation error:', error)
      throw new Error(`Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Test')
      return !!result
    } catch {
      return false
    }
  }

  getModelInfo() {
    return {
      name: 'Gemini Pro',
      provider: 'gemini',
      maxTokens: 30720,
      supportedLanguages: ['fr', 'en', 'es', 'de', 'it', 'ja', 'ko', 'zh'],
    }
  }
}