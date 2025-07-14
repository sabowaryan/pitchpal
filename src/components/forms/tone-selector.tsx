'use client'

import { TONES } from '@/lib/constants'
import { ToneType } from '@/types/pitch'
import { 
  Palette, 
  CheckCircle, 
  Briefcase, 
  Sparkles, 
  Zap, 
  Rocket,
  Users,
  TrendingUp,
  Code,
  Heart
} from 'lucide-react'

interface ToneSelectorProps {
  value: string
  onChange: (value: string) => void
}

// Map icon names to actual Lucide components
const iconMap = {
  briefcase: Briefcase,
  sparkles: Sparkles,
  zap: Zap,
  rocket: Rocket,
  users: Users,
  trending: TrendingUp,
  code: Code,
  heart: Heart
}

// Color mapping for each tone
const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    hover: 'hover:border-blue-300 hover:bg-blue-25'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    hover: 'hover:border-purple-300 hover:bg-purple-25'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: 'text-green-600',
    hover: 'hover:border-green-300 hover:bg-green-25'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-700',
    icon: 'text-orange-600',
    hover: 'hover:border-orange-300 hover:bg-orange-25'
  }
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Label with Icon */}
      <div className="flex items-center space-x-2">
        <Palette className="w-5 h-5 text-primary-600" />
        <label className="text-lg font-semibold text-neutral-900">
          Choisissez le ton de votre pitch
        </label>
      </div>
      
      {/* Description */}
      <p className="text-neutral-600 leading-relaxed">
        Adaptez le style de communication à votre audience pour maximiser l'impact de votre présentation.
      </p>
      
      {/* Tone Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(TONES).map(([key, tone]) => {
          const isSelected = value === key
          const IconComponent = iconMap[tone.icon as keyof typeof iconMap]
          const colors = colorMap[tone.color as keyof typeof colorMap]
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left hover-lift ${
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-lg`
                  : `border-neutral-200 bg-white ${colors.hover}`
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className={`w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.border}`}>
                    <CheckCircle className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                </div>
              )}
              
              {/* Tone Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? `${colors.bg} border-2 ${colors.border} group-hover:scale-110` 
                    : 'bg-neutral-100 border-2 border-neutral-200 group-hover:scale-105'
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    isSelected ? colors.icon : 'text-neutral-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    isSelected ? colors.text : 'text-neutral-900'
                  }`}>
                    {tone.label}
                  </h3>
                  <div className={`text-xs font-medium uppercase tracking-wide ${
                    isSelected ? colors.icon : 'text-neutral-500'
                  }`}>
                    {tone.color} theme
                  </div>
                </div>
              </div>
              
              {/* Tone Description */}
              <p className={`text-sm leading-relaxed ${
                isSelected ? colors.text : 'text-neutral-600'
              }`}>
                {tone.description}
              </p>

              {/* Usage Examples */}
              <div className="mt-4 pt-3 border-t border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isSelected ? colors.border.replace('border-', 'bg-') : 'bg-neutral-300'
                  }`}></div>
                  <span className={`text-xs ${
                    isSelected ? colors.text : 'text-neutral-500'
                  }`}>
                    {getUsageExample(key)}
                  </span>
                </div>
              </div>
              
              {/* Hover Effect Overlay */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-200 ${
                isSelected 
                  ? colors.border.replace('border-', 'bg-').replace('-500', '-500')
                  : 'bg-neutral-900'
              }`}></div>
            </button>
          )
        })}
      </div>
      
      {/* Selected Tone Info */}
      {value && TONES[value as keyof typeof TONES] && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            {(() => {
              const selectedTone = TONES[value as keyof typeof TONES]
              const IconComponent = iconMap[selectedTone.icon as keyof typeof iconMap]
              const colors = colorMap[selectedTone.color as keyof typeof colorMap]
              
              return (
                <>
                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center border ${colors.border}`}>
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-primary-800">
                      Ton sélectionné : {selectedTone.label}
                    </span>
                    <div className="text-sm text-primary-600 mt-1">
                      Optimisé pour {getAudienceType(value)}
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${colors.bg} ${colors.border} border rounded-full`}>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {selectedTone.color.toUpperCase()}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get usage examples
function getUsageExample(tone: string): string {
  const examples = {
    professional: 'Idéal pour investisseurs et business angels',
    fun: 'Parfait pour réseaux sociaux et Product Hunt',
    tech: 'Conçu pour CTOs et équipes techniques',
    startup: 'Optimisé pour incubateurs et accélérateurs'
  }
  return examples[tone as keyof typeof examples] || ''
}

// Helper function to get audience type
function getAudienceType(tone: string): string {
  const audiences = {
    professional: 'un public business et investisseurs',
    fun: 'les réseaux sociaux et le grand public',
    tech: 'les équipes techniques et développeurs',
    startup: 'l\'écosystème startup et innovation'
  }
  return audiences[tone as keyof typeof audiences] || 'votre audience'
}