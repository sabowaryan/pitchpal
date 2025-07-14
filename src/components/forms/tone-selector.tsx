'use client'

import { TONES } from '@/lib/constants'
import { ToneType } from '@/types/pitch'
import { Palette, CheckCircle } from 'lucide-react'

interface ToneSelectorProps {
  value: string
  onChange: (value: string) => void
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
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left hover-lift ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-25'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                </div>
              )}
              
              {/* Tone Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-200 ${
                  isSelected 
                    ? 'bg-primary-100 group-hover:scale-110' 
                    : 'bg-neutral-100 group-hover:scale-105'
                }`}>
                  {tone.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${
                    isSelected ? 'text-primary-700' : 'text-neutral-900'
                  }`}>
                    {tone.label}
                  </h3>
                </div>
              </div>
              
              {/* Tone Description */}
              <p className={`text-sm leading-relaxed ${
                isSelected ? 'text-primary-600' : 'text-neutral-600'
              }`}>
                {tone.description}
              </p>
              
              {/* Hover Effect */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-200 ${
                isSelected 
                  ? 'bg-primary-500' 
                  : 'bg-neutral-900'
              }`}></div>
            </button>
          )
        })}
      </div>
      
      {/* Selected Tone Info */}
      {value && TONES[value as keyof typeof TONES] && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{TONES[value as keyof typeof TONES].icon}</span>
            <span className="font-medium text-primary-800">
              Ton sélectionné : {TONES[value as keyof typeof TONES].label}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}