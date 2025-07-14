'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Rocket, Sparkles, Zap, Users } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Fonctionnalités', href: '#features', icon: Sparkles },
    { name: 'Comment ça marche', href: '#how-it-works', icon: Zap },
    { name: 'Témoignages', href: '#testimonials', icon: Users },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-neutral-200' 
          : 'bg-transparent'
      }`}
    >
      <nav className="container-custom" aria-label="Navigation principale">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 group focus-ring rounded-lg p-1"
            aria-label="PitchPal - Accueil"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient-primary">
                PitchPal
              </span>
              <span className="text-xs text-neutral-500 -mt-1 hidden sm:block">
                Pitch Generator
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-neutral-700 hover:text-primary-600 transition-colors duration-200 focus-ring rounded-lg px-3 py-2 group"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/generate"
              className="btn btn-outline btn-md hover-lift"
            >
              Essayer gratuitement
            </Link>
            <Link
              href="/generate"
              className="btn btn-primary btn-md hover-lift hover-glow"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Créer mon pitch
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 transition-colors duration-200 focus-ring"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'max-h-96 opacity-100 visible'
              : 'max-h-0 opacity-0 invisible'
          }`}
        >
          <div className="py-4 space-y-2 bg-white/95 backdrop-blur-md rounded-xl mt-2 shadow-xl border border-neutral-200">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200 focus-ring mx-2 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
            
            <div className="px-4 py-3 space-y-3 border-t border-neutral-200 mt-4">
              <Link
                href="/generate"
                className="btn btn-outline btn-md w-full justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Essayer gratuitement
              </Link>
              <Link
                href="/generate"
                className="btn btn-primary btn-md w-full justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Créer mon pitch
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}