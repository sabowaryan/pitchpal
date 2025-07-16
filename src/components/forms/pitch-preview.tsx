/**
 * PitchPreview Component
 * 
 * This component provides a preview of the generated pitch with editing capabilities,
 * quality validation, and partial regeneration options before final redirection.
 * 
 * Features:
 * - Preview display of all pitch sections
 * - Inline editing for minor modifications
 * - Quality scoring and validation
 * - Partial regeneration of specific sections
 * - Save/continue workflow
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Pitch, PitchSlide } from '@/types/pitch'
import { ValidationResult } from '@/types/enhanced-errors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  Star, 
  AlertTriangle,
  ChevronRight,
  Save,
  Sparkles
} from 'lucide-react'

interface PitchPreviewProps {
  pitch: Pitch
  onSave: (updatedPitch: Pitch) => void
  onContinue: () => void
  onRegenerateSection: (sectionKey: keyof Pitch, currentValue: string) => Promise<string>
  className?: string
}

interface EditableSection {
  key: keyof Pitch
  title: string
  value: string
  isEditing: boolean
  isRegenerating: boolean
}

interface QualityMetrics {
  overall: number
  completeness: number
  clarity: number
  engagement: number
  issues: string[]
  suggestions: string[]
}

export const PitchPreview = React.memo(function PitchPreview({
  pitch,
  onSave,
  onContinue,
  onRegenerateSection,
  className = ''
}: PitchPreviewProps) {
  // Editable sections state
  const [sections, setSections] = useState<EditableSection[]>(() => [
    { key: 'tagline', title: 'Tagline', value: pitch.tagline, isEditing: false, isRegenerating: false },
    { key: 'problem', title: 'Problème', value: pitch.problem, isEditing: false, isRegenerating: false },
    { key: 'solution', title: 'Solution', value: pitch.solution, isEditing: false, isRegenerating: false },
    { key: 'targetMarket', title: 'Marché Cible', value: pitch.targetMarket, isEditing: false, isRegenerating: false },
    { key: 'businessModel', title: 'Modèle Économique', value: pitch.businessModel, isEditing: false, isRegenerating: false },
    { key: 'competitiveAdvantage', title: 'Avantage Concurrentiel', value: pitch.competitiveAdvantage, isEditing: false, isRegenerating: false }
  ])

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Quality validation
  const qualityMetrics = useMemo((): QualityMetrics => {
    const metrics = {
      overall: 0,
      completeness: 0,
      clarity: 0,
      engagement: 0,
      issues: [] as string[],
      suggestions: [] as string[]
    }

    // Completeness check (40% of overall score)
    const completeSections = sections.filter(s => s.value.trim().length > 20).length
    metrics.completeness = Math.round((completeSections / sections.length) * 100)

    // Clarity check (30% of overall score)
    const avgLength = sections.reduce((sum, s) => sum + s.value.length, 0) / sections.length
    const hasKeywords = sections.some(s => 
      s.value.toLowerCase().includes('client') || 
      s.value.toLowerCase().includes('utilisateur') ||
      s.value.toLowerCase().includes('marché')
    )
    metrics.clarity = Math.min(100, Math.round((avgLength / 100) * 70 + (hasKeywords ? 30 : 0)))

    // Engagement check (30% of overall score)
    const hasNumbers = sections.some(s => /\d+/.test(s.value))
    const hasActionWords = sections.some(s => 
      /\b(révolutionne|transforme|optimise|améliore|simplifie)\b/i.test(s.value)
    )
    metrics.engagement = (hasNumbers ? 50 : 0) + (hasActionWords ? 50 : 0)

    // Calculate overall score
    metrics.overall = Math.round(
      metrics.completeness * 0.4 + 
      metrics.clarity * 0.3 + 
      metrics.engagement * 0.3
    )

    // Generate issues and suggestions
    if (metrics.completeness < 80) {
      metrics.issues.push('Certaines sections semblent incomplètes')
      metrics.suggestions.push('Développez les sections trop courtes pour plus d\'impact')
    }

    if (metrics.clarity < 70) {
      metrics.issues.push('Le message pourrait être plus clair')
      metrics.suggestions.push('Utilisez des termes plus précis et des exemples concrets')
    }

    if (metrics.engagement < 60) {
      metrics.issues.push('Le pitch manque d\'éléments engageants')
      metrics.suggestions.push('Ajoutez des chiffres, des bénéfices concrets ou des mots d\'action')
    }

    if (metrics.overall >= 85) {
      metrics.suggestions.push('Excellent pitch ! Prêt à convaincre vos interlocuteurs.')
    }

    return metrics
  }, [sections])

  // Performance optimization: Memoize quality styling functions
  const qualityStyles = useMemo(() => {
    const score = qualityMetrics.overall
    
    const getQualityColor = (): string => {
      if (score >= 85) return 'text-green-600 bg-green-50 border-green-200'
      if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      return 'text-red-600 bg-red-50 border-red-200'
    }

    const getQualityIcon = () => {
      if (score >= 85) return <Star className="w-4 h-4" />
      if (score >= 70) return <Sparkles className="w-4 h-4" />
      return <AlertTriangle className="w-4 h-4" />
    }

    return {
      color: getQualityColor(),
      icon: getQualityIcon()
    }
  }, [qualityMetrics.overall])

  // Handle section editing
  const handleEditSection = useCallback((index: number) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, isEditing: true } : section
    ))
  }, [])

  const handleSaveSection = useCallback((index: number, newValue: string) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, value: newValue, isEditing: false } : section
    ))
    setHasChanges(true)
  }, [])

  const handleCancelEdit = useCallback((index: number) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, isEditing: false } : section
    ))
  }, [])

  // Handle section regeneration
  const handleRegenerateSection = useCallback(async (index: number) => {
    const section = sections[index]
    
    setSections(prev => prev.map((s, i) => 
      i === index ? { ...s, isRegenerating: true } : s
    ))

    try {
      const newValue = await onRegenerateSection(section.key, section.value)
      setSections(prev => prev.map((s, i) => 
        i === index ? { ...s, value: newValue, isRegenerating: false } : s
      ))
      setHasChanges(true)
    } catch (error) {
      console.error('Failed to regenerate section:', error)
      setSections(prev => prev.map((s, i) => 
        i === index ? { ...s, isRegenerating: false } : s
      ))
    }
  }, [sections, onRegenerateSection])

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    
    try {
      const updatedPitch: Pitch = {
        ...pitch,
        tagline: sections.find(s => s.key === 'tagline')?.value || pitch.tagline,
        problem: sections.find(s => s.key === 'problem')?.value || pitch.problem,
        solution: sections.find(s => s.key === 'solution')?.value || pitch.solution,
        targetMarket: sections.find(s => s.key === 'targetMarket')?.value || pitch.targetMarket,
        businessModel: sections.find(s => s.key === 'businessModel')?.value || pitch.businessModel,
        competitiveAdvantage: sections.find(s => s.key === 'competitiveAdvantage')?.value || pitch.competitiveAdvantage
      }
      
      await onSave(updatedPitch)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }, [pitch, sections, onSave])

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Eye className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-900">
            Aperçu de votre Pitch
          </h2>
        </div>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Vérifiez et ajustez votre pitch avant de continuer. Vous pouvez modifier 
          chaque section ou régénérer celles qui ne vous conviennent pas.
        </p>
      </div>

      {/* Quality Score */}
      <Card className={`border-2 ${qualityStyles.color}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {qualityStyles.icon}
              <CardTitle className="text-lg">Qualité du Pitch</CardTitle>
            </div>
            <Badge variant="outline" className="text-lg font-semibold px-3 py-1">
              {qualityMetrics.overall}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quality Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-neutral-900">Complétude</div>
              <div className="text-neutral-600">{qualityMetrics.completeness}%</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-neutral-900">Clarté</div>
              <div className="text-neutral-600">{qualityMetrics.clarity}%</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-neutral-900">Engagement</div>
              <div className="text-neutral-600">{qualityMetrics.engagement}%</div>
            </div>
          </div>

          {/* Issues and Suggestions */}
          {(qualityMetrics.issues.length > 0 || qualityMetrics.suggestions.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                {qualityMetrics.issues.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-700">{issue}</span>
                  </div>
                ))}
                {qualityMetrics.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pitch Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.key} className="border-2 border-neutral-200 hover:border-neutral-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-neutral-900">
                  {section.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {!section.isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSection(index)}
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateSection(index)}
                        disabled={section.isRegenerating}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${section.isRegenerating ? 'animate-spin' : ''}`} />
                        Régénérer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {section.isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    defaultValue={section.value}
                    className="min-h-[100px] resize-none"
                    placeholder={`Modifiez ${section.title.toLowerCase()}...`}
                    id={`edit-${section.key}`}
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const textarea = document.getElementById(`edit-${section.key}`) as HTMLTextAreaElement
                        handleSaveSection(index, textarea.value)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelEdit(index)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {section.value}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          )}
        </div>
        
        <Button
          onClick={onContinue}
          size="lg"
          className="bg-primary-600 hover:bg-primary-700"
        >
          Continuer vers le pitch complet
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
})

export default PitchPreview