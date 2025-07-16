/**
 * IdeaValidationFeedback Demo Component
 * 
 * This component demonstrates the IdeaValidationFeedback component
 * with different validation states and scenarios for testing and showcase.
 */

'use client'

import React, { useState } from 'react'
import { IdeaValidationFeedback } from './idea-validation-feedback'
import { validateIdea } from '@/lib/validation/idea-validator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Demo scenarios
const DEMO_SCENARIOS = {
  empty: '',
  tooShort: 'App',
  minimal: 'Une app pour gérer les tâches',
  good: 'Une application mobile qui aide les petites entreprises à gérer leur comptabilité de manière simple et automatisée, en se connectant directement à leurs comptes bancaires pour catégoriser les transactions.',
  excellent: 'Une plateforme SaaS qui résout le problème de gaspillage alimentaire dans les restaurants en utilisant l\'IA pour prédire la demande et optimiser les commandes d\'ingrédients. Destinée aux restaurateurs et chaînes de restauration, elle génère des revenus via un modèle d\'abonnement mensuel et permet de réduire les coûts de 30% tout en améliorant la rentabilité.',
  tooLong: 'Une application mobile révolutionnaire qui transforme complètement la façon dont les petites entreprises gèrent leur comptabilité en proposant une solution automatisée et intelligente qui se connecte directement à tous leurs comptes bancaires pour catégoriser automatiquement toutes les transactions financières, générer des rapports détaillés, calculer les taxes, préparer les déclarations fiscales, gérer les factures clients et fournisseurs, suivre les paiements en retard, analyser la rentabilité par projet, créer des budgets prévisionnels, envoyer des rappels automatiques, synchroniser avec les logiciels de paie existants, et bien plus encore pour révolutionner la gestion financière des PME.'
}

export function IdeaValidationFeedbackDemo() {
  const [currentIdea, setCurrentIdea] = useState(DEMO_SCENARIOS.good)
  const [selectedScenario, setSelectedScenario] = useState('good')

  const validationResult = validateIdea(currentIdea)

  const handleScenarioChange = (scenario: keyof typeof DEMO_SCENARIOS) => {
    setSelectedScenario(scenario)
    setCurrentIdea(DEMO_SCENARIOS[scenario])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-neutral-900">
          Démonstration - Validation d'Idées en Temps Réel
        </h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Cette démonstration présente le composant IdeaValidationFeedback avec différents 
          scénarios de validation pour tester toutes les fonctionnalités.
        </p>
      </div>
      <Tabs
  value={selectedScenario}
  onValueChange={(value: string) => handleScenarioChange(value as keyof typeof DEMO_SCENARIOS)}
>


        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="empty">Vide</TabsTrigger>
          <TabsTrigger value="tooShort">Trop Court</TabsTrigger>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
          <TabsTrigger value="good">Bonne</TabsTrigger>
          <TabsTrigger value="excellent">Excellente</TabsTrigger>
          <TabsTrigger value="tooLong">Trop Long</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Saisie de l'Idée</CardTitle>
              <CardDescription>
                Modifiez le texte ci-dessous pour voir la validation en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentIdea}
                onChange={(e) => setCurrentIdea(e.target.value)}
                placeholder="Décrivez votre idée de startup..."
                className="min-h-[120px] text-base"
                maxLength={500}
              />
            </CardContent>
          </Card>

          {/* Validation Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback de Validation</CardTitle>
              <CardDescription>
                Validation en temps réel avec suggestions d'amélioration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdeaValidationFeedback
                validationResult={validationResult}
                currentLength={currentIdea.length}
                maxLength={500}
                minLength={10}
              />
            </CardContent>
          </Card>

          {/* Scenario Descriptions */}
          <TabsContent value="empty">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Champ Vide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste l'état initial quand aucune idée n'est saisie. 
                  Le composant doit afficher un compteur de caractères neutre sans 
                  validation ni suggestions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tooShort">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Idée Trop Courte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste la validation quand l'idée est en dessous de la 
                  longueur minimale. Le composant doit afficher des erreurs de validation 
                  et indiquer combien de caractères manquent.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="minimal">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Idée Minimale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste une idée valide mais basique. Le composant doit 
                  afficher un score faible avec de nombreuses suggestions d'amélioration 
                  pour enrichir le contenu.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="good">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Bonne Idée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste une idée bien structurée avec un bon niveau de détail. 
                  Le composant doit afficher un score correct avec quelques suggestions 
                  d'amélioration mineures.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="excellent">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Excellente Idée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste une idée complète et bien détaillée. Le composant 
                  doit afficher un score élevé avec un message de félicitations et 
                  peu ou pas de suggestions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tooLong">
            <Card>
              <CardHeader>
                <CardTitle>Scénario: Idée Trop Longue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Ce scénario teste le dépassement de la limite de caractères. 
                  Le composant doit afficher une erreur de validation et indiquer 
                  combien de caractères sont en trop.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentIdea('')}
                >
                  Vider le champ
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentIdea(currentIdea + ' avec des détails supplémentaires')}
                >
                  Ajouter du contenu
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentIdea(currentIdea.slice(0, -20))}
                  disabled={currentIdea.length < 20}
                >
                  Raccourcir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-700">Longueur:</span>
                  <p className="text-neutral-600">{currentIdea.length} / 500</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Valide:</span>
                  <p className={validationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                    {validationResult.isValid ? 'Oui' : 'Non'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Score:</span>
                  <p className="text-neutral-600">{validationResult.score} / 100</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Suggestions:</span>
                  <p className="text-neutral-600">{validationResult.suggestions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}

export default IdeaValidationFeedbackDemo