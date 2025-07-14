'use client'

import { Pitch } from '@/types/pitch'
import { Button } from '@/components/ui/button'

interface PitchExportProps {
  pitch: Pitch
}

export function PitchExport({ pitch }: PitchExportProps) {
  const exportAsMarkdown = () => {
    const markdown = `# ${pitch.tagline}

## Le Problème
${pitch.problem}

## La Solution
${pitch.solution}

## Marché Cible
${pitch.targetMarket}

## Business Model
${pitch.businessModel}

## Avantage Concurrentiel
${pitch.competitiveAdvantage}

## Pitch Deck

${pitch.pitchDeck.slides.map((slide, index) => `
### Slide ${index + 1}: ${slide.title}
${slide.content}
`).join('\n')}
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pitch-deck.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsPDF = async () => {
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pitch }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pitch-deck.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur export PDF:', error)
      alert('Erreur lors de l\'export PDF')
    }
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Exporter votre Pitch
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={exportAsMarkdown}
          variant="outline"
          className="flex-1"
        >
          📄 Exporter en Markdown
        </Button>
        
        <Button 
          onClick={exportAsPDF}
          variant="outline"
          className="flex-1"
        >
          📊 Exporter en PDF
        </Button>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        Téléchargez votre pitch au format Markdown ou PDF pour le partager facilement.
      </p>
    </div>
  )
} 