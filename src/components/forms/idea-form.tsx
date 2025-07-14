'use client'

import { Textarea } from '@/components/ui/textarea'
import { MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from '@/lib/constants'
import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'

interface IdeaFormProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function IdeaForm({ value, onChange, placeholder }: IdeaFormProps) {
  const remainingChars = MAX_IDEA_LENGTH - value.length
  const isValid = value.length >= MIN_IDEA_LENGTH
  const isNearLimit = remainingChars < 50

  return (
    <div className="space-y-4">
      {/* Label with Icon */}
      <div className="flex items-center space-x-2">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <label className="text-lg font-semibold text-neutral-900">
          Décrivez votre idée
        </label>
      </div>
      
      {/* Description */}
      <p className="text-neutral-600 leading-relaxed">
        Expliquez votre concept en quelques phrases. Plus vous êtes précis sur le problème, 
        la solution et votre marché cible, plus le pitch sera pertinent.
      </p>
      
      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Ex: Une application qui connecte les freelances avec des clients locaux en utilisant l'IA pour matcher les compétences..."}
          className="min-h-[140px] resize-none text-base leading-relaxed border-2 focus:border-primary-400 focus:ring-primary-400/20 transition-all duration-200"
          maxLength={MAX_IDEA_LENGTH}
        />
        
        {/* Character count overlay */}
        <div className="absolute bottom-3 right-3 text-xs text-neutral-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded">
          {value.length}/{MAX_IDEA_LENGTH}
        </div>
      </div>
      
      {/* Status and Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isValid ? (
            <>
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span className="text-sm font-medium text-success-600">
                Idée valide - Prêt à générer !
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-warning-500" />
              <span className="text-sm text-warning-600">
                Minimum {MIN_IDEA_LENGTH} caractères requis
              </span>
            </>
          )}
        </div>
        
        <span className={`text-sm ${
          isNearLimit ? 'text-warning-600 font-medium' : 'text-neutral-500'
        }`}>
          {remainingChars} caractères restants
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-200 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            isValid
              ? 'bg-gradient-to-r from-success-400 to-success-500'
              : 'bg-gradient-to-r from-warning-400 to-warning-500'
          }`}
          style={{ 
            width: `${Math.min((value.length / MIN_IDEA_LENGTH) * 100, 100)}%` 
          }}
        ></div>
      </div>
    </div>
  )
}