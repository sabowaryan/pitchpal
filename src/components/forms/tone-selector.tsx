'use client'

import { TONES } from '@/lib/constants'
import { ToneType } from '@/types/pitch'

interface ToneSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Choisissez le ton de votre pitch
      </label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(TONES).map(([key, tone]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              value === key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{tone.icon}</span>
              <span className="font-medium">{tone.label}</span>
            </div>
            <p className="text-sm text-gray-600">{tone.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
} 