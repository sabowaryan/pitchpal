import { Star, Quote } from 'lucide-react'

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'CEO, TechStart',
      company: 'Startup SaaS',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=150&h=150&fit=crop&crop=face',
      content: 'PitchPal a transformé ma façon de présenter mes idées. En 2 minutes, j\'ai eu un pitch professionnel qui m\'a aidée à lever 500K€. Incroyable !',
      rating: 5,
      highlight: 'Levée de 500K€'
    },
    {
      name: 'Thomas Martin',
      role: 'Fondateur',
      company: 'GreenTech Solutions',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      content: 'L\'IA comprend parfaitement le contexte business. Le pitch généré était si bon que je l\'ai utilisé tel quel pour mon passage en incubateur.',
      rating: 5,
      highlight: 'Accepté en incubateur'
    },
    {
      name: 'Sophie Chen',
      role: 'Product Manager',
      company: 'InnovateLab',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      content: 'Fini les heures passées à structurer mes présentations. PitchPal me fait gagner un temps précieux et le résultat est toujours impeccable.',
      rating: 5,
      highlight: 'Gain de temps énorme'
    },
    {
      name: 'Alexandre Rousseau',
      role: 'Entrepreneur',
      company: 'Digital Ventures',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      content: 'Les 4 tons de communication sont parfaits. Je peux adapter mon message selon l\'audience. Un outil indispensable pour tout entrepreneur.',
      rating: 5,
      highlight: 'Polyvalence parfaite'
    },
    {
      name: 'Camille Leroy',
      role: 'Freelance Consultant',
      company: 'Indépendante',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      content: 'L\'export PDF est d\'une qualité professionnelle. Mes clients sont toujours impressionnés par la présentation de mes propositions.',
      rating: 5,
      highlight: 'Qualité professionnelle'
    },
    {
      name: 'Julien Moreau',
      role: 'CTO',
      company: 'AI Startup',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
      content: 'En tant que tech, j\'apprécie la précision de l\'IA. Elle comprend les enjeux techniques et sait les vulgariser pour les investisseurs.',
      rating: 5,
      highlight: 'Précision technique'
    }
  ]

  const stats = [
    { value: '4.9/5', label: 'Note moyenne' },
    { value: '2,500+', label: 'Utilisateurs satisfaits' },
    { value: '94%', label: 'Taux de recommandation' },
    { value: '10,000+', label: 'Pitchs créés' }
  ]

  return (
    <section id="testimonials" className="section bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Témoignages
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Ce que disent nos{' '}
            <span className="text-gradient-primary">utilisateurs</span>
          </h2>
          
          <p className="text-xl text-neutral-600 leading-relaxed">
            Découvrez comment PitchPal a aidé des entrepreneurs comme vous 
            à transformer leurs idées en succès concrets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100"
            >
              <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="card p-6 hover-lift hover-glow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="flex items-center justify-between mb-4">
                <Quote className="w-8 h-8 text-primary-200" />
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              {/* Content */}
              <blockquote className="text-neutral-700 leading-relaxed mb-6">
                "{testimonial.content}"
              </blockquote>

              {/* Highlight */}
              <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                ✅ {testimonial.highlight}
              </div>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-neutral-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-lg font-semibold">4.9/5</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Rejoignez nos utilisateurs satisfaits
            </h3>
            <p className="text-neutral-300 mb-6 text-lg">
              Plus de 2,500 entrepreneurs nous font confiance pour créer leurs pitchs
            </p>
            <a
              href="/generate"
              className="btn btn-primary btn-lg hover-lift"
            >
              Créer mon pitch gratuitement
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}