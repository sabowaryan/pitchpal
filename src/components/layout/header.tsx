'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  Rocket, 
  Sparkles, 
  Zap, 
  Users, 
  FileText,
  BarChart3,
  HelpCircle,
  Building2,
  ChevronDown,
  Play,
  Star,
  ArrowRight
} from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    {
      name: 'Produit',
      href: '#',
      hasDropdown: true,
      items: [
        { 
          name: 'Générateur de Pitch', 
          href: '/generate', 
          icon: Sparkles,
          description: 'Créez votre pitch en 2 minutes'
        },
        { 
          name: 'Templates', 
          href: '/templates', 
          icon: FileText,
          description: 'Modèles prêts à utiliser'
        },
        { 
          name: 'Analytics', 
          href: '/analytics', 
          icon: BarChart3,
          description: 'Analysez vos performances'
        },
        { 
          name: 'Export PDF', 
          href: '/export', 
          icon: FileText,
          description: 'Exportez en haute qualité'
        }
      ]
    },
    {
      name: 'Solutions',
      href: '#',
      hasDropdown: true,
      items: [
        { 
          name: 'Pour Startups', 
          href: '/solutions/startups', 
          icon: Rocket,
          description: 'Outils pour entrepreneurs'
        },
        { 
          name: 'Pour Entreprises', 
          href: '/solutions/enterprise', 
          icon: Building2,
          description: 'Solutions corporate'
        },
        { 
          name: 'Pour Freelances', 
          href: '/solutions/freelances', 
          icon: Users,
          description: 'Outils pour indépendants'
        }
      ]
    },
    { name: 'Tarifs', href: '/pricing', icon: BarChart3 },
    {
      name: 'Ressources',
      href: '#',
      hasDropdown: true,
      items: [
        { 
          name: 'Blog', 
          href: '/blog', 
          icon: FileText,
          description: 'Conseils et actualités'
        },
        { 
          name: 'Guides', 
          href: '/guides', 
          icon: HelpCircle,
          description: 'Tutoriels détaillés'
        },
        { 
          name: 'Exemples', 
          href: '/examples', 
          icon: Star,
          description: 'Pitchs inspirants'
        },
        { 
          name: 'API Documentation', 
          href: '/docs/api', 
          icon: FileText,
          description: 'Documentation technique'
        }
      ]
    }
  ]

  const handleDropdownToggle = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

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
            className="flex items-center space-x-3 group focus-ring rounded-lg p-2"
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
                AI Pitch Generator
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="relative">
                  {item.hasDropdown ? (
                    <button
                      className="flex items-center space-x-1 text-neutral-700 hover:text-primary-600 transition-colors duration-200 focus-ring rounded-lg px-4 py-2 group"
                      onClick={() => handleDropdownToggle(item.name)}
                      onMouseEnter={() => setActiveDropdown(item.name)}
                    >
                      <span className="font-medium">{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center space-x-2 text-neutral-700 hover:text-primary-600 transition-colors duration-200 focus-ring rounded-lg px-4 py-2 group"
                    >
                      {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.name && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 py-2 animate-fade-in"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.items?.map((subItem) => {
                        const SubIcon = subItem.icon
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="flex items-start space-x-3 px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 group"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                              <SubIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-neutral-900 group-hover:text-primary-600">
                                {subItem.name}
                              </div>
                              <div className="text-sm text-neutral-500 mt-1">
                                {subItem.description}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-200 focus-ring rounded-lg px-3 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/demo"
              className="btn btn-ghost btn-md hover-lift group"
            >
              <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Démo
            </Link>
            <Link
              href="/generate"
              className="btn btn-primary btn-md hover-lift hover-glow group"
            >
              <Rocket className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
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
              ? 'max-h-screen opacity-100 visible'
              : 'max-h-0 opacity-0 invisible'
          }`}
        >
          <div className="py-4 space-y-2 bg-white/95 backdrop-blur-md rounded-xl mt-2 shadow-xl border border-neutral-200">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200 focus-ring mx-2 rounded-lg"
                      onClick={() => handleDropdownToggle(item.name)}
                    >
                      <span className="font-medium">{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                    {activeDropdown === item.name && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.items?.map((subItem) => {
                          const SubIcon = subItem.icon
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="flex items-center space-x-3 px-4 py-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200 focus-ring mx-2 rounded-lg"
                              onClick={() => {
                                setIsMenuOpen(false)
                                setActiveDropdown(null)
                              }}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm">{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200 focus-ring mx-2 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
            
            <div className="px-4 py-3 space-y-3 border-t border-neutral-200 mt-4">
              <Link
                href="/login"
                className="block text-center py-2 text-neutral-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/demo"
                className="btn btn-ghost btn-md w-full justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Play className="w-4 h-4 mr-2" />
                Voir la démo
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