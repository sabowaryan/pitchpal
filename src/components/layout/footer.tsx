import Link from 'next/link'
import { Rocket, Mail, Twitter, Github, Linkedin, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Fonctionnalités', href: '#features' },
      { name: 'Comment ça marche', href: '#how-it-works' },
      { name: 'Tarifs', href: '#pricing' },
      { name: 'Exemples', href: '#examples' },
    ],
    company: [
      { name: 'À propos', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carrières', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Guide de démarrage', href: '/getting-started' },
      { name: 'API', href: '/api' },
      { name: 'Support', href: '/support' },
    ],
    legal: [
      { name: 'Confidentialité', href: '/privacy' },
      { name: 'Conditions', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Mentions légales', href: '/legal' },
    ],
  }

  const socialLinks = [
    {
      name: 'Twitter',
      href: 'https://twitter.com/pitchpal',
      icon: Twitter,
      color: 'hover:text-blue-400',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/pitchpal',
      icon: Linkedin,
      color: 'hover:text-blue-600',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/pitchpal',
      icon: Github,
      color: 'hover:text-neutral-900',
    },
    {
      name: 'Email',
      href: 'mailto:contact@pitchpal.com',
      icon: Mail,
      color: 'hover:text-primary-600',
    },
  ]

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer */}
      <div className="container-custom section-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className="flex items-center space-x-2 group focus-ring rounded-lg p-1 w-fit"
              aria-label="PitchPal - Accueil"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">
                  PitchPal
                </span>
                <span className="text-xs text-neutral-400 -mt-1">
                  Pitch Generator
                </span>
              </div>
            </Link>
            
            <p className="mt-4 text-neutral-400 leading-relaxed max-w-md">
              Transformez votre idée en pitch professionnel en 2 minutes. 
              L'outil IA qui aide les entrepreneurs à créer des présentations 
              convaincantes et mémorables.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`p-2 rounded-lg bg-neutral-800 text-neutral-400 ${social.color} transition-all duration-200 hover:bg-neutral-700 focus-ring`}
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

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors duration-200 focus-ring rounded px-1 py-0.5"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors duration-200 focus-ring rounded px-1 py-0.5"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Ressources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors duration-200 focus-ring rounded px-1 py-0.5"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors duration-200 focus-ring rounded px-1 py-0.5"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <span>© {currentYear} PitchPal. Tous droits réservés.</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <span>Fait avec</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>par l'équipe PitchPal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}