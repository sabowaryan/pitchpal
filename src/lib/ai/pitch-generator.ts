import { aiGenerator } from './ai-generator'
import { PITCH_PROMPTS } from './pitch-prompts'
import { Pitch } from '@/types/pitch'


export async function generatePitch(idea: string, tone: string): Promise<Pitch> {
  const prompt = PITCH_PROMPTS[tone as keyof typeof PITCH_PROMPTS]
  
  if (!prompt) {
    throw new Error('Ton non reconnu')
  }

  try {
    const response = await aiGenerator.generate({
      systemPrompt: prompt,
      userPrompt: `Idée: ${idea}`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Parser la réponse JSON
    const pitchData = JSON.parse(response.content)
    
    // Valider la structure
    if (!pitchData.tagline || !pitchData.problem || !pitchData.solution) {
      throw new Error('Structure de pitch invalide')
    }

    return {
      ...pitchData,
      tone,
      createdAt: new Date(),
      generatedBy: {
        provider: response.provider,
        model: response.model,
        usage: response.usage,
      },
    }
  } catch (parseError) {
    if (parseError instanceof Error && parseError.message.includes('All AI providers failed')) {
      throw parseError
    }
    console.error('Erreur parsing JSON:', parseError)
    throw new Error('Erreur lors du parsing de la réponse IA')
  }
} 