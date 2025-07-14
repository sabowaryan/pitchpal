export interface Pitch {
  id?: string
  tagline: string
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  competitiveAdvantage: string
  pitchDeck: {
    slides: PitchSlide[]
  }
  tone: string
  createdAt?: Date
  generatedBy?: {
    provider: string
    model: string
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface PitchSlide {
  title: string
  content: string
  order: number
}

export type ToneType = 'professional' | 'fun' | 'tech' | 'startup' 