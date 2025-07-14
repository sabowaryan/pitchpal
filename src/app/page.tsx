import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          PitchPal 🚀
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Transformez votre idée en pitch professionnel en 2 minutes
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">✨ Fonctionnalités</h2>
            <ul className="text-left space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Tagline percutante et mémorable
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Analyse du problème et de la solution
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Définition du marché cible
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Business model clair
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Avantage concurrentiel
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🎨 Tons de communication</h2>
            <ul className="text-left space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">💼</span>
                Professionnel et formel
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🚀</span>
                Innovant et dynamique
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🤝</span>
                Convivial et accessible
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">📊</span>
                Analytique et factuel
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">💡</span>
                Créatif et inspirant
              </li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/generate" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Commencer à générer mon pitch →
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            Gratuit • Rapide • Professionnel
          </p>
        </div>
      </div>
    </main>
  )
} 