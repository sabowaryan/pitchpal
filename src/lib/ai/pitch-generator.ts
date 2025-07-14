import OpenAI from 'openai'
import { PITCH_PROMPTS } from './pitch-prompts'
import { Pitch } from '@/types/pitch'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generatePitch(idea: string, tone: string): Promise<Pitch> {
  const prompt = PITCH_PROMPTS[tone as keyof typeof PITCH_PROMPTS]
  
  if (!prompt) {
    throw new Error('Ton non reconnu')
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: `Idée: ${idea}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0].message.content
  
  if (!content) {
    throw new Error('Pas de contenu généré')
  }

  try {
    // Parser la réponse JSON
    const pitchData = JSON.parse(content)
    
    // Valider la structure
    if (!pitchData.tagline || !pitchData.problem || !pitchData.solution) {
      throw new Error('Structure de pitch invalide')
    }

    return {
      ...pitchData,
      tone,
      createdAt: new Date(),
    }
  } catch (parseError) {
    console.error('Erreur parsing JSON:', parseError)
    throw new Error('Erreur lors du parsing de la réponse IA')
  }
} 