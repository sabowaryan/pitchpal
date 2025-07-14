import OpenAI from 'openai'
import { AIProvider, GenerateRequest, GenerateResponse } from '../types'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required')
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
      })

      const content = response.choices[0].message.content
      
      if (!content) {
        throw new Error('No content generated')
      }

      return {
        content,
        provider: 'openai',
        model: 'gpt-4',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('OpenAI generation error:', error)
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }

  getModelInfo() {
    return {
      name: 'GPT-4',
      provider: 'openai',
      maxTokens: 8192,
      supportedLanguages: ['fr', 'en', 'es', 'de', 'it'],
    }
  }
}