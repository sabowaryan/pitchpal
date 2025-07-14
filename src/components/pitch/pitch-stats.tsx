'use client'

import { Pitch } from '@/types/pitch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Target, 
  Zap, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'

interface PitchStatsProps {
  pitch: Pitch
}

export function PitchStats({ pitch }: PitchStatsProps) {
  // Calculate stats from pitch content
  const calculateStats = () => {
    const allText = [
      pitch.tagline,
      pitch.problem,
      pitch.solution,
      pitch.targetMarket,
      pitch.businessModel,
      pitch.competitiveAdvantage
    ].join(' ')

    const wordCount = allText.split(/\s+/).filter(word => word.length > 0).length
    const charCount = allText.length
    const slideCount = pitch.pitchDeck.slides.length
    const avgWordsPerSlide = Math.round(wordCount / slideCount)

    // Estimate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200)

    return {
      wordCount,
      charCount,
      slideCount,
      avgWordsPerSlide,
      readingTime
    }
  }

  const stats = calculateStats()

  const statCards = [
    {
      title: 'Nombre de mots',
      value: stats.wordCount.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Mots au total'
    },
    {
      title: 'Slides générés',
      value: stats.slideCount.toString(),
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Slides dans le deck'
    },
    {
      title: 'Temps de lecture',
      value: `${stats.readingTime} min`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Temps estimé'
    },
    {
      title: 'Mots par slide',
      value: stats.avgWordsPerSlide.toString(),
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Moyenne par slide'
    }
  ]

  const analysisCards = [
    {
      title: 'Marché cible',
      icon: Users,
      content: pitch.targetMarket,
      color: 'border-blue-200 bg-blue-50'
    },
    {
      title: 'Business model',
      icon: DollarSign,
      content: pitch.businessModel,
      color: 'border-green-200 bg-green-50'
    },
    {
      title: 'Avantage concurrentiel',
      icon: TrendingUp,
      content: pitch.competitiveAdvantage,
      color: 'border-purple-200 bg-purple-50'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-primary-600" />
          Statistiques du pitch
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-neutral-700 mb-1">
                    {stat.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Content Analysis */}
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-primary-600" />
          Analyse du contenu
        </h3>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {analysisCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card key={index} className={`border-2 ${card.color} hover-lift`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Icon className="w-5 h-5 mr-2" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700 leading-relaxed text-sm">
                    {card.content}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Generation Info */}
      {pitch.generatedBy && (
        <div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-6">
            Informations de génération
          </h3>
          
          <Card className="bg-neutral-50 border-2 border-neutral-200">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Modèle IA</h4>
                  <p className="text-neutral-600">
                    {pitch.generatedBy.provider.toUpperCase()} - {pitch.generatedBy.model}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Tokens utilisés</h4>
                  <p className="text-neutral-600">
                    {pitch.generatedBy.usage.totalTokens.toLocaleString()} tokens
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Ton sélectionné</h4>
                  <p className="text-neutral-600 capitalize">
                    {pitch.tone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}