'use client'

import { useState } from 'react'
import { Pitch } from '@/types/pitch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  FileText, 
  Image, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Settings,
  Sparkles
} from 'lucide-react'
import { estimatePDFSize } from '@/lib/pdf/generator'

interface PitchExportProps {
  pitch: Pitch
}

export function PitchExport({ pitch }: PitchExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const pdfEstimate = estimatePDFSize(pitch)

  const exportAsMarkdown = () => {
    const markdown = `# ${pitch.tagline}

## 📋 Résumé Exécutif

**Tagline:** ${pitch.tagline}

**Ton:** ${pitch.tone.charAt(0).toUpperCase() + pitch.tone.slice(1)}

**Date de création:** ${new Date(pitch.createdAt || new Date()).toLocaleDateString('fr-FR')}

---

## ❌ Le Problème
${pitch.problem}

## ✅ La Solution
${pitch.solution}

## 👥 Marché Cible
${pitch.targetMarket}

## 💰 Business Model
${pitch.businessModel}

## 🚀 Avantage Concurrentiel
${pitch.competitiveAdvantage}

---

## 📊 Pitch Deck Détaillé

${pitch.pitchDeck.slides.map((slide, index) => `
### Slide ${index + 1}: ${slide.title}

${slide.content}

---
`).join('\n')}

## 📈 Statistiques

- **Nombre de slides:** ${pitch.pitchDeck.slides.length}
- **Mots total:** ${[pitch.tagline, pitch.problem, pitch.solution, pitch.targetMarket, pitch.businessModel, pitch.competitiveAdvantage].join(' ').split(/\s+/).length}
- **Généré par:** ${pitch.generatedBy?.provider.toUpperCase()} - ${pitch.generatedBy?.model}

---

*Généré par PitchPal - ${new Date().toLocaleDateString('fr-FR')}*
`

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pitch-${pitch.tagline.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportStatus({
      type: 'success',
      message: 'Fichier Markdown téléchargé avec succès !'
    })

    setTimeout(() => setExportStatus({ type: null, message: '' }), 3000)
  }

  const exportAsPDF = async (quality: 'high' | 'medium' = 'high') => {
    setIsExporting(true)
    setExportStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          pitch,
          options: {
            quality,
            format: 'A4',
            includeBackground: true
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pitch-deck-${pitch.tagline.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportStatus({
        type: 'success',
        message: 'PDF généré et téléchargé avec succès !'
      })

    } catch (error) {
      console.error('Erreur export PDF:', error)
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de l\'export PDF'
      })
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
    }
  }

  const exportAsJSON = () => {
    const jsonData = {
      ...pitch,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json;charset=utf-8' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pitch-data-${pitch.tagline.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportStatus({
      type: 'success',
      message: 'Données JSON exportées avec succès !'
    })

    setTimeout(() => setExportStatus({ type: null, message: '' }), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-4">
          <Download className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">
            Export & Partage
          </span>
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">
          Exportez votre pitch professionnel
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Téléchargez votre présentation dans le format de votre choix. 
          PDF haute qualité pour les présentations, Markdown pour l'édition.
        </p>
      </div>

      {/* Status Message */}
      {exportStatus.type && (
        <div className={`card p-4 animate-fade-in ${
          exportStatus.type === 'success' 
            ? 'bg-success-50 border-success-200' 
            : 'bg-error-50 border-error-200'
        }`}>
          <div className="flex items-center space-x-3">
            {exportStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-success-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error-600" />
            )}
            <span className={`font-medium ${
              exportStatus.type === 'success' ? 'text-success-800' : 'text-error-800'
            }`}>
              {exportStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PDF Export */}
        <Card className="hover-lift hover-glow">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">PDF Professionnel</CardTitle>
            <p className="text-sm text-neutral-600">
              Format idéal pour les présentations et le partage
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PDF Info */}
            <div className="bg-neutral-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-600">Pages estimées:</span>
                <span className="font-semibold">{pdfEstimate.pages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Taille estimée:</span>
                <span className="font-semibold">{pdfEstimate.estimatedSizeMB} MB</span>
              </div>
            </div>

            {/* PDF Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={() => exportAsPDF('high')}
                disabled={isExporting}
                className="w-full btn-primary"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Haute Qualité
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => exportAsPDF('medium')}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Qualité Standard
              </Button>
            </div>

            <div className="text-xs text-neutral-500 text-center">
              ✨ Design professionnel avec votre branding
            </div>
          </CardContent>
        </Card>

        {/* Markdown Export */}
        <Card className="hover-lift hover-glow">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Markdown</CardTitle>
            <p className="text-sm text-neutral-600">
              Format texte pour édition et collaboration
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              <div className="font-medium mb-1">Parfait pour :</div>
              <ul className="text-xs space-y-1">
                <li>• Édition collaborative</li>
                <li>• Documentation technique</li>
                <li>• Intégration dans des wikis</li>
              </ul>
            </div>

            <Button 
              onClick={exportAsMarkdown}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger .md
            </Button>

            <div className="text-xs text-neutral-500 text-center">
              📝 Format universel et éditable
            </div>
          </CardContent>
        </Card>

        {/* JSON Export */}
        <Card className="hover-lift hover-glow">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Données JSON</CardTitle>
            <p className="text-sm text-neutral-600">
              Format structuré pour développeurs
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
              <div className="font-medium mb-1">Inclut :</div>
              <ul className="text-xs space-y-1">
                <li>• Toutes les données du pitch</li>
                <li>• Métadonnées de génération</li>
                <li>• Format API-ready</li>
              </ul>
            </div>

            <Button 
              onClick={exportAsJSON}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger .json
            </Button>

            <div className="text-xs text-neutral-500 text-center">
              🔧 Pour intégrations techniques
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                💡 Conseils d'utilisation
              </h3>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>• <strong>PDF Haute Qualité :</strong> Idéal pour les présentations importantes et l'impression</li>
                <li>• <strong>PDF Standard :</strong> Plus léger, parfait pour l'email et le partage rapide</li>
                <li>• <strong>Markdown :</strong> Modifiable dans tout éditeur de texte, parfait pour la collaboration</li>
                <li>• <strong>JSON :</strong> Pour les développeurs souhaitant intégrer les données</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}