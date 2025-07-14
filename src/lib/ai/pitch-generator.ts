import { aiGenerator } from './ai-generator'
import { PITCH_PROMPTS } from './pitch-prompts'
import { Pitch } from '@/types/pitch'

export async function generatePitch(idea: string, tone: string): Promise<Pitch> {
  if (!idea?.trim()) {
    throw new Error('L\'idée ne peut pas être vide')
  }

  if (!tone || typeof tone !== 'string') {
    throw new Error('Le ton doit être spécifié')
  }

  const prompt = PITCH_PROMPTS[tone as keyof typeof PITCH_PROMPTS]
  
  if (!prompt) {
    throw new Error(`Ton non reconnu: ${tone}. Tons disponibles: ${Object.keys(PITCH_PROMPTS).join(', ')}`)
  }

  try {
    console.log(`Generating pitch with tone: ${tone}`)
    
    const response = await aiGenerator.generate({
      systemPrompt: prompt,
      userPrompt: `Idée: ${idea.trim()}`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    console.log('AI response received, parsing JSON...')

    // Clean the response content
    let cleanContent = response.content.trim()
    
    // Remove any markdown code blocks
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Try to find JSON in the response if it's wrapped in other text
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanContent = jsonMatch[0]
    }

    // Parse the JSON response
    let pitchData
    try {
      pitchData = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content:', response.content)
      console.error('Cleaned content:', cleanContent)
      throw new Error('La réponse de l\'IA n\'est pas au format JSON valide')
    }
    
    // Validate the structure
    const requiredFields = ['tagline', 'problem', 'solution', 'targetMarket', 'businessModel', 'competitiveAdvantage']
    for (const field of requiredFields) {
      if (!pitchData[field] || typeof pitchData[field] !== 'string' || !pitchData[field].trim()) {
        throw new Error(`Structure de pitch invalide - champ manquant ou vide: ${field}`)
      }
    }

    if (!pitchData.pitchDeck || !Array.isArray(pitchData.pitchDeck.slides)) {
      throw new Error('Structure de pitch invalide - pitchDeck.slides manquant ou invalide')
    }

    if (pitchData.pitchDeck.slides.length === 0) {
      throw new Error('Structure de pitch invalide - aucune slide générée')
    }

    // Validate each slide
    for (let i = 0; i < pitchData.pitchDeck.slides.length; i++) {
      const slide = pitchData.pitchDeck.slides[i]
      if (!slide.title || !slide.content || typeof slide.order !== 'number') {
        throw new Error(`Slide ${i + 1} invalide - titre, contenu ou ordre manquant`)
      }
    }

    console.log('Pitch validation successful')

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
  } catch (error) {
    console.error('Error in generatePitch:', error)
    
    if (error instanceof Error) {
      // Re-throw known errors
      if (error.message.includes('All AI providers failed') || 
          error.message.includes('Structure de pitch invalide') ||
          error.message.includes('JSON valide') ||
          error.message.includes('Slide') ||
          error.message.includes('champ manquant')) {
        throw error
      }
    }
    
    // Generic error for unknown issues
    throw new Error('Erreur lors de la génération du pitch. Veuillez réessayer.')
  }
}