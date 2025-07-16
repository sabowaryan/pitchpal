/**
 * PitchPreview Demo Component
 * 
 * This component demonstrates the PitchPreview functionality with sample data
 * and mock handlers for testing and development purposes.
 */

'use client'

import React, { useState } from 'react'
import { PitchPreview } from './pitch-preview'
import { Pitch } from '@/types/pitch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PlayCircle, RotateCcw } from 'lucide-react'

const samplePitches: Record<string, Pitch> = {
  excellent: {
    id: 'excellent-pitch',
    tagline: 'Révolutionnez la gestion comptable des PME avec l\'IA',
    problem: 'Les petites et moyennes entreprises perdent en moyenne 120 heures par an sur la comptabilité manuelle, générant des erreurs coûteuses et du stress pour les dirigeants qui préfèrent se concentrer sur leur cœur de métier.',
    solution: 'ComptaBot est une application mobile intelligente qui automatise 90% des tâches comptables en se connectant directement aux comptes bancaires, utilisant l\'IA pour catégoriser les transactions et générer automatiquement les déclarations fiscales.',
    targetMarket: 'PME françaises de 1 à 50 employés dans les secteurs services, commerce et artisanat, représentant 2,3 millions d\'entreprises avec un marché adressable de 4,2 milliards d\'euros.',
    businessModel: 'Modèle SaaS avec abonnement mensuel de 29€ (version standard) et 59€ (version premium), période d\'essai gratuite de 30 jours, objectif de 10 000 clients la première année pour un CA de 3,5M€.',
    competitiveAdvantage: 'Interface ultra-intuitive développée avec des comptables, IA propriétaire entraînée sur la réglementation française, support client en français 7j/7, et intégration native avec 15 banques françaises.',
    pitchDeck: {
      slides: [
        { title: 'Problème', content: 'Gestion comptable complexe', order: 1 },
        { title: 'Solution', content: 'Automatisation IA', order: 2 }
      ]
    },
    tone: 'professional',
    createdAt: new Date(),
    generatedBy: {
      provider: 'openai',
      model: 'gpt-4',
      usage: { promptTokens: 150, completionTokens: 300, totalTokens: 450 }
    }
  },
  
  average: {
    id: 'average-pitch',
    tagline: 'Application mobile pour la comptabilité',
    problem: 'Les entreprises ont des difficultés avec la comptabilité.',
    solution: 'Une app qui aide avec la comptabilité automatique.',
    targetMarket: 'Petites entreprises en France.',
    businessModel: 'Abonnement mensuel.',
    competitiveAdvantage: 'Interface simple et support client.',
    pitchDeck: {
      slides: [
        { title: 'Problème', content: 'Comptabilité difficile', order: 1 },
        { title: 'Solution', content: 'App mobile', order: 2 }
      ]
    },
    tone: 'professional',
    createdAt: new Date(),
    generatedBy: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      usage: { promptTokens: 80, completionTokens: 120, totalTokens: 200 }
    }
  },
  
  poor: {
    id: 'poor-pitch',
    tagline: 'App comptable',
    problem: 'Problème comptabilité',
    solution: 'Solution app',
    targetMarket: 'Entreprises',
    businessModel: 'Paiement',
    competitiveAdvantage: 'Bien',
    pitchDeck: {
      slides: [
        { title: 'Problème', content: 'Problème', order: 1 },
        { title: 'Solution', content: 'Solution', order: 2 }
      ]
    },
    tone: 'professional',
    createdAt: new Date(),
    generatedBy: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      usage: { promptTokens: 30, completionTokens: 50, totalTokens: 80 }
    }
  }
}

const regenerationSuggestions: Record<string, string[]> = {
  tagline: [
    'Transformez votre comptabilité en avantage concurrentiel avec l\'IA',
    'La première solution comptable qui pense comme votre expert-comptable',
    'Libérez-vous de la comptabilité pour vous concentrer sur votre business'
  ],
  problem: [
    'Chaque mois, 78% des dirigeants de PME passent plus de 20 heures sur leur comptabilité au lieu de développer leur activité, créant un manque à gagner estimé à 15 000€ par an.',
    'La comptabilité manuelle génère en moyenne 12 erreurs par mois dans les PME, causant des pénalités fiscales et un stress constant pour les dirigeants.',
    'Les PME françaises perdent collectivement 2,8 milliards d\'heures par an sur des tâches comptables répétitives qui pourraient être automatisées.'
  ],
  solution: [
    'ComptaBot révolutionne la gestion comptable avec une IA qui apprend de vos habitudes, automatise 95% des saisies et vous alerte en temps réel sur les anomalies.',
    'Notre plateforme connecte tous vos comptes bancaires, catégorise automatiquement vos transactions et génère vos déclarations fiscales en un clic.',
    'Une solution tout-en-un qui combine reconnaissance automatique de documents, synchronisation bancaire et tableau de bord prédictif pour anticiper votre trésorerie.'
  ]
}

export function PitchPreviewDemo() {
  const [selectedPitch, setSelectedPitch] = useState<keyof typeof samplePitches>('excellent')
  const [currentPitch, setCurrentPitch] = useState<Pitch>(samplePitches.excellent)
  const [saveCount, setSaveCount] = useState(0)
  const [continueCount, setContinueCount] = useState(0)
  const [regenerationCount, setRegenerationCount] = useState(0)

  const handlePitchChange = (pitchKey: keyof typeof samplePitches) => {
    setSelectedPitch(pitchKey)
    setCurrentPitch(samplePitches[pitchKey])
  }

  const handleSave = async (updatedPitch: Pitch) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setCurrentPitch(updatedPitch)
    setSaveCount(prev => prev + 1)
    
    console.log('Pitch saved:', updatedPitch)
  }

  const handleContinue = () => {
    setContinueCount(prev => prev + 1)
    console.log('Continue to full pitch view')
  }

  const handleRegenerateSection = async (sectionKey: keyof Pitch, currentValue: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setRegenerationCount(prev => prev + 1)
    
    // Get random suggestion for the section
    const suggestions = regenerationSuggestions[sectionKey as string]
    if (suggestions) {
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      console.log(`Regenerated ${sectionKey}:`, randomSuggestion)
      return randomSuggestion
    }
    
    // Fallback: return enhanced version of current value
    const enhanced = `${currentValue} [Régénéré avec des améliorations IA]`
    console.log(`Regenerated ${sectionKey}:`, enhanced)
    return enhanced
  }

  const resetDemo = () => {
    setCurrentPitch(samplePitches[selectedPitch])
    setSaveCount(0)
    setContinueCount(0)
    setRegenerationCount(0)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Demo Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-neutral-900">
          Démo PitchPreview
        </h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Testez les fonctionnalités de prévisualisation, d'édition et de régénération 
          avec différents exemples de pitches de qualité variable.
        </p>
      </div>

      {/* Demo Controls */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PlayCircle className="w-5 h-5 text-blue-600" />
            <span>Contrôles de Démo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pitch Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Sélectionnez un exemple de pitch :
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(samplePitches).map(([key, pitch]) => (
                <Button
                  key={key}
                  variant={selectedPitch === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePitchChange(key as keyof typeof samplePitches)}
                  className="capitalize"
                >
                  {key === 'excellent' && '⭐ '}
                  {key === 'average' && '⚡ '}
                  {key === 'poor' && '⚠️ '}
                  {key}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Demo Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{saveCount}</div>
              <div className="text-sm text-neutral-600">Sauvegardes</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{continueCount}</div>
              <div className="text-sm text-neutral-600">Continuations</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">{regenerationCount}</div>
              <div className="text-sm text-neutral-600">Régénérations</div>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={resetDemo}
                className="text-neutral-600"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Quality Preview */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="outline" className="bg-white">
              Pitch: {selectedPitch}
            </Badge>
            <Badge 
              variant="outline" 
              className={
                selectedPitch === 'excellent' ? 'bg-green-50 text-green-700 border-green-200' :
                selectedPitch === 'average' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }
            >
              Qualité: {
                selectedPitch === 'excellent' ? 'Excellente (85-100)' :
                selectedPitch === 'average' ? 'Moyenne (60-84)' :
                'Faible (0-59)'
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* PitchPreview Component */}
      <PitchPreview
        pitch={currentPitch}
        onSave={handleSave}
        onContinue={handleContinue}
        onRegenerateSection={handleRegenerateSection}
        className="border-2 border-neutral-200 rounded-lg p-6 bg-white"
      />

      {/* Demo Instructions */}
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-700">
          <div className="space-y-2">
            <p><strong>1. Testez les différents niveaux de qualité :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Excellent :</strong> Contenu détaillé, score élevé, peu de suggestions</li>
              <li><strong>Average :</strong> Contenu moyen, score modéré, quelques suggestions</li>
              <li><strong>Poor :</strong> Contenu minimal, score faible, nombreuses suggestions</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p><strong>2. Testez les fonctionnalités d'édition :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Cliquez sur "Modifier" pour éditer une section</li>
              <li>Modifiez le contenu et sauvegardez</li>
              <li>Observez la mise à jour du score de qualité</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p><strong>3. Testez la régénération :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Cliquez sur "Régénérer" pour une section</li>
              <li>Observez l'animation de chargement</li>
              <li>Le contenu sera remplacé par une version améliorée</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PitchPreviewDemo