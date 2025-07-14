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
}

export interface PitchSlide {
  title: string
  content: string
  order: number
}

export type ToneType = 'professional' | 'fun' | 'tech' | 'startup' 