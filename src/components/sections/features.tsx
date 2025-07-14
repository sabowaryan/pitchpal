import { 
  Sparkles, 
  Zap, 
  Target, 
  FileText, 
  Download, 
  Palette,
  Clock,
  Shield,
  Lightbulb
} from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: 'IA Avancée',
      description: 'Powered by GPT-4 pour des pitchs de qualité professionnelle adaptés à votre secteur.',
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600'
    },
    {
      icon: Zap,
      title: 'Génération Instantanée',
      description: 'Obtenez votre pitch complet en moins de 2 minutes. Fini les heures de réflexion.',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      icon: Palette,
      title: '4 Tons de Communication',
      description: 'Professionnel, Fun, Tech ou Startup - adaptez votre message à votre audience.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: FileText,
      title: 'Pitch Deck Complet',
      description: 'Structure professionnelle en 8 slides avec contenu adapté à votre marché.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: Download,
      title: 'Export Multi-Format',
      description: 'PDF haute qualité, Markdown pour édition, JSON pour intégration.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Analyse de Marché',
      description: 'Identification automatique du marché cible et des opportunités business.',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      icon: Clock,
      title: 'Sauvegarde Automatique',
      description: 'Vos pitchs sont automatiquement sauvegardés. Accédez à votre historique.',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      icon: Shield,
      title: 'Sécurisé & Privé',
      description: 'Vos idées restent confidentielles. Chiffrement et protection des données.',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      icon: Lightbulb,
      title: 'Suggestions Intelligentes',
      description: 'Recommandations personnalisées pour améliorer votre pitch et maximiser l\'impact.',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    }
  ]

  return (
    <section id="features" className="section bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Fonctionnalités
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Tout ce dont vous avez besoin pour un{' '}
            <span className="text-gradient-primary">pitch parfait</span>
          </h2>
          
          <p className="text-xl text-neutral-600 leading-relaxed">
            Des fonctionnalités avancées pensées pour les entrepreneurs modernes. 
            Créez, personnalisez et partagez vos pitchs en toute simplicité.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group card hover-lift hover-glow p-8 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-7 h-7 ${feature.textColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors duration-200">
                  {feature.title}
                </h3>
                
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200`}></div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-2xl p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-900 mb-1">
                Prêt à créer votre pitch ?
              </h3>
              <p className="text-sm text-neutral-600">
                Commencez gratuitement, aucune inscription requise
              </p>
            </div>
            <a
              href="/generate"
              className="btn btn-primary btn-md hover-lift ml-4"
            >
              Essayer maintenant
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}