'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Zap, Target, TrendingUp } from 'lucide-react'

export function HeroSection() {
  const stats = [
    { label: 'Pitchs générés', value: '10,000+', icon: Target },
    { label: 'Entrepreneurs satisfaits', value: '2,500+', icon: TrendingUp },
    { label: 'Temps moyen', value: '2 min', icon: Zap },
    { label: 'Taux de succès', value: '94%', icon: Sparkles },
  ]

  return (
    <section className="relative gradient-hero section-lg overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
      
      <div className="container-custom relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Nouveau : Export PDF automatique
            </span>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 animate-slide-up">
            Transformez votre{' '}
            <span className="text-gradient-primary">idée</span>
            {' '}en{' '}
            <span className="text-gradient-accent">pitch professionnel</span>
            {' '}en 2 minutes
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed animate-slide-up delay-100">
            L'assistant IA qui aide les entrepreneurs à créer des présentations 
            convaincantes et mémorables. Plus besoin de passer des heures à structurer votre pitch.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-slide-up delay-200">
            <Link
              href="/generate"
              className="btn btn-primary btn-xl hover-lift hover-glow group"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
              Créer mon pitch gratuitement
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <button className="btn btn-ghost btn-xl group">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Voir la démo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="text-sm text-neutral-500 mb-12 animate-fade-in delay-300">
            <p>✅ Gratuit • ✅ Aucune inscription requise • ✅ Résultats instantanés</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 animate-fade-in delay-400">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 hover-lift"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}