import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PitchPal - Transformez votre idée en pitch professionnel',
  description: 'Générez instantanément un pitch complet et professionnel à partir de votre idée en 2 minutes. IA avancée, 4 tons de communication, export PDF.',
  keywords: 'pitch, entrepreneur, startup, IA, présentation, business plan, investisseurs',
  authors: [{ name: 'PitchPal Team' }],
  creator: 'PitchPal',
  publisher: 'PitchPal',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://pitchpal.com',
    title: 'PitchPal - Transformez votre idée en pitch professionnel',
    description: 'Générez instantanément un pitch complet et professionnel à partir de votre idée en 2 minutes',
    siteName: 'PitchPal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitchPal - Transformez votre idée en pitch professionnel',
    description: 'Générez instantanément un pitch complet et professionnel à partir de votre idée en 2 minutes',
    creator: '@pitchpal',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
} 