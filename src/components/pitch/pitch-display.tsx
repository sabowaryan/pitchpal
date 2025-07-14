'use client'

import { Pitch } from '@/types/pitch'
import { PitchSections } from './pitch-sections'
import { PitchPreview } from './pitch-preview'
import { PitchExport } from './pitch-export'

interface PitchDisplayProps {
  pitch: Pitch
}

export function PitchDisplay({ pitch }: PitchDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Votre Pitch est prêt ! 🎉
        </h2>
        <p className="text-gray-600">
          Voici votre pitch professionnel généré par IA
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <PitchSections pitch={pitch} />
        <PitchPreview pitch={pitch} />
      </div>

      <PitchExport pitch={pitch} />
    </div>
  )
} 