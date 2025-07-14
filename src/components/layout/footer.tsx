import Link from 'next/link'
import { 
  Rocket, 
  Mail, 
  Twitter, 
  Github, 
  Linkedin, 
  Heart,
  Sparkles,
  FileText,
  Users,
  Building2,
  HelpCircle,
  Shield,
  Globe,
  Phone,
  MapPin,
  Star,
  Award,
  Zap,
  BarChart3
} from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = {
    product: {
      title: 'Produit',
      links: [
        { name: 'Générateur de Pitch', href: '/generate', icon: Sparkles },
        { name: 'Templates', href: '/templates', icon: FileText },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Export PDF', href: '/export', icon: FileText },
        { name: 'API', href: '/api', icon: Zap },
      ]
    },
    solutions: {
      title: 'Solutions',
      links: [
        { name: 'Pour Startups', href: '/solutions/startups', icon: Rocket },
        { name: 'Pour Entreprises', href: '/solutions/enterprise', icon: Building2 },
        { name: 'Pour Freelances', href: '/solutions/freelances', icon: Users },
        { name: 'Pour Investisseurs', href: '/solutions/investors', icon: Award },
      ]
    },
    resources: {
      title: 'Ressources',
      links: [
        { name: 'Blog', href: '/blog', icon: FileText },
        { name: 'Guides', href: '/guides', icon: HelpCircle },
        { name: 'Exemples', href: '/examples', icon: Star },
        { name: 'Documentation', href: '/docs', icon: FileText },
        { name: 'Centre d\'aide', href: '/help', icon: HelpCircle },
      ]
    },
    company: {
      title: 'Entreprise',
      links: [
        { name: 'À propos', href: '/about', icon: Users },
        { name: 'Carrières', href: '/careers', icon: Users },
        { name: 'Presse', href: '/press', icon: FileText },
        { name: 'Partenaires', href: '/partners', icon: Building2 },
        { name: 'Contact', href: '/contact', icon: Mail },
      ]
    },
    legal: {
      title: 'Légal',
      links: [
        { name: 'Confidentialité', href: '/privacy', icon: Shield },
        { name: 'Conditions d\'utilisation', href: '/terms', icon: FileText },
        { name: 'Cookies', href: '/cookies', icon: Shield },
        { name: 'Mentions légales', href: '/legal', icon: FileText },
        { name: 'RGPD', href: '/gdpr', icon: Shield },
      ]
    }
  }

  const socialLinks = [
    {
      name: 'Twitter',
      href: 'https://twitter.com/pitchpal',
      icon: Twitter,
      color: 'hover:text-blue-400 hover:bg-blue-50',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/pitchpal',
      icon: Linkedin,
      color: 'hover:text-blue-600 hover:bg-blue-50',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/pitchpal',
      icon: Github,
      color: 'hover:text-neutral-900 hover:bg-neutral-100',
    },
    {
      name: 'Email',
      href: 'mailto:contact@pitchpal.com',
      icon: Mail,
      color: 'hover:text-primary-600 hover:bg-primary-50',
    },
  ]

  const trustIndicators = [
    { icon: Shield, text: 'Données sécurisées' },
    { icon: Award, text: 'Certifié ISO 27001' },
    { icon: Users, text: '10,000+ utilisateurs' },
    { icon: Globe, text: 'Disponible en 5 langues' },
  ]

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-primary-900/50 border border-primary-700 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">
                Newsletter PitchPal
              </span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Restez informé des dernières nouveautés
            </h3>
            <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
              Recevez nos conseils d'experts, nouvelles fonctionnalités et success stories directement dans votre boîte mail.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="w-full sm:w-auto btn btn-primary px-6 py-3 hover-lift">
                S'abonner
              </button>
            </div>
            
            <p className="text-xs text-neutral-500 mt-4">
              Pas de spam. Désabonnement en un clic.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group focus-ring rounded-lg p-1 w-fit mb-6"
              aria-label="PitchPal - Accueil"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">
                  PitchPal
                </span>
                <span className="text-sm text-neutral-400 -mt-1">
                  AI Pitch Generator
                </span>
              </div>
            </Link>
            
            <p className="text-neutral-400 leading-relaxed mb-6 max-w-md">
              La plateforme IA qui transforme vos idées en présentations professionnelles. 
              Utilisée par plus de 10,000 entrepreneurs dans le monde entier.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>contact@pitchpal.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`p-3 rounded-lg bg-neutral-800 text-neutral-400 ${social.color} transition-all duration-200 focus-ring`}
                    aria-label={social.name}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-white mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors duration-200 focus-ring rounded px-1 py-1 group"
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon
              return (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-neutral-400">{indicator.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-neutral-400">
              <span>© {currentYear} PitchPal. Tous droits réservés.</span>
              <div className="flex items-center space-x-4">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Confidentialité
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Conditions
                </Link>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookies
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <span>Fait avec</span>
              <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
              <span>à Paris</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}