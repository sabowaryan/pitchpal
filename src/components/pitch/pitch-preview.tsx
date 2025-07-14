'use client'

import { Pitch } from '@/types/pitch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PitchPreviewProps {
  pitch: Pitch
}

export function PitchPreview({ pitch }: PitchPreviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Aperçu du Pitch Deck
      </h3>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {pitch.pitchDeck.slides.map((slide, index) => (
          <Card key={index} className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary-600">
                Slide {index + 1}: {slide.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: slide.content }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 