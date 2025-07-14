'use client'

import { Textarea } from '@/components/ui/textarea'
import { MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from '@/lib/constants'

interface IdeaFormProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function IdeaForm({ value, onChange, placeholder }: IdeaFormProps) {
  const remainingChars = MAX_IDEA_LENGTH - value.length
  const isValid = value.length >= MIN_IDEA_LENGTH

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Décrivez votre idée
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Ex: Une application qui connecte les freelances avec des clients locaux en utilisant l'IA pour matcher les compétences..."}
        className="min-h-[120px] resize-none"
        maxLength={MAX_IDEA_LENGTH}
      />
      <div className="flex justify-between items-center text-sm">
        <span className={isValid ? "text-green-600" : "text-gray-500"}>
          {isValid ? "✅ Idée valide" : `Minimum ${MIN_IDEA_LENGTH} caractères`}
        </span>
        <span className={remainingChars < 50 ? "text-orange-600" : "text-gray-500"}>
          {remainingChars} caractères restants
        </span>
      </div>
    </div>
  )
} 