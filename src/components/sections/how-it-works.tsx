import { 
  Edit3, 
  Settings, 
  Sparkles, 
  Download,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Edit3,
      title: 'Décrivez votre idée',
      description: 'Expliquez votre concept en 2-3 phrases. Notre IA comprend le contexte et les enjeux de votre projet.',
      details: [
        'Minimum 10 caractères',
        'Décrivez le problème et la solution',
        'Mentionnez votre marché cible'
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      number: '02',
      icon: Settings,
      title: 'Choisissez le ton',
      description: 'Sélectionnez le style de communication adapté à votre audience : professionnel, fun, tech ou startup.',
      details: [
        '💼 Professionnel pour investisseurs',
        '🎉 Fun pour réseaux sociaux',
        '⚡ Tech pour équipes techniques',
        '🚀 Startup pour incubateurs'
      ],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      number: '03',
      icon: Sparkles,
      title: 'IA génère votre pitch',
      description: 'Notre intelligence artificielle analyse votre idée et génère un pitch structuré et convaincant en moins de 2 minutes.',
      details: [
        'Tagline percutante',
        'Analyse problème/solution',
        'Business model clair',
        'Pitch deck complet'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      number: '04',
      icon: Download,
      title: 'Exportez et partagez',
      description: 'Téléchargez votre pitch en PDF ou Markdown. Partagez-le avec vos investisseurs, partenaires ou équipe.',
      details: [
        'Export PDF haute qualité',
        'Format Markdown éditable',
        'Partage direct par email',
        'Sauvegarde automatique'
      ],
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <section id="how-it-works" className="section bg-gradient-to-br from-neutral-50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-6">
            <Settings className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Comment ça marche
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            De l'idée au pitch en{' '}
            <span className="text-gradient-primary">4 étapes simples</span>
          </h2>
          
          <p className="text-xl text-neutral-600 leading-relaxed">
            Un processus optimisé pour vous faire gagner du temps. 
            Suivez ces étapes et obtenez un pitch professionnel en quelques minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-16">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isEven = index % 2 === 1
            
            return (
              <div
                key={step.number}
                className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl text-white font-bold text-xl shadow-lg`}>
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-lg text-neutral-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 ml-20">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-neutral-700">{detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center mt-8">
                      <div className={`flex items-center space-x-2 text-neutral-400 ${isEven ? 'flex-row-reverse' : ''}`}>
                        <div className="w-12 h-px bg-neutral-300"></div>
                        <ArrowRight className="w-5 h-5" />
                        <div className="w-12 h-px bg-neutral-300"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual */}
                <div className="flex-1 max-w-md">
                  <div className={`card ${step.bgColor} border-2 border-white shadow-xl p-8 text-center hover-lift`}>
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl mb-6 shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-neutral-900 mb-3">
                      Étape {step.number}
                    </h4>
                    <p className="text-neutral-600">
                      {step.title}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Prêt à transformer votre idée ?
            </h3>
            <p className="text-primary-100 mb-6 text-lg">
              Rejoignez plus de 2,500 entrepreneurs qui ont déjà créé leur pitch avec PitchPal
            </p>
            <a
              href="/generate"
              className="btn bg-white text-primary-600 hover:bg-primary-50 btn-lg hover-lift"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Commencer maintenant
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}