'use client'

import { Pitch } from '@/types/pitch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PitchSectionsProps {
  pitch: Pitch
}

export function PitchSections({ pitch }: PitchSectionsProps) {
  const sections = [
    {
      title: '🎯 Tagline',
      content: pitch.tagline,
      className: 'bg-gradient-to-r from-blue-50 to-indigo-50'
    },
    {
      title: '❌ Le Problème',
      content: pitch.problem,
      className: 'bg-gradient-to-r from-red-50 to-pink-50'
    },
    {
      title: '✅ La Solution',
      content: pitch.solution,
      className: 'bg-gradient-to-r from-green-50 to-emerald-50'
    },
    {
      title: '👥 Marché Cible',
      content: pitch.targetMarket,
      className: 'bg-gradient-to-r from-purple-50 to-violet-50'
    },
    {
      title: '💸 Business Model',
      content: pitch.businessModel,
      className: 'bg-gradient-to-r from-yellow-50 to-orange-50'
    },
    {
      title: '🚀 Avantage Concurrentiel',
      content: pitch.competitiveAdvantage,
      className: 'bg-gradient-to-r from-cyan-50 to-blue-50'
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Sections du Pitch
      </h3>
      
      {sections.map((section, index) => (
        <Card key={index} className={section.className}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {section.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 