# 🚀 PitchPal - Transformez votre idée en pitch professionnel

<div align="center">
  <img src="https://via.placeholder.com/800x400/3b82f6/ffffff?text=PitchPal+🚀" alt="PitchPal Banner" />
  
  <p align="center">
    <strong>De l'idée au pitch en 2 minutes</strong>
  </p>
  
  <p align="center">
    <a href="#-démo-en-ligne">Démo</a> •
    <a href="#-fonctionnalités">Fonctionnalités</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-utilisation">Utilisation</a> •
    <a href="#-api">API</a> •
    <a href="#-contribution">Contribution</a>
  </p>
</div>

---

## 📋 Table des Matières

- [🎯 À Propos](#-à-propos)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Stack Technique](#️-stack-technique)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [📖 Installation Détaillée](#-installation-détaillée)
- [🔧 Configuration](#-configuration)
- [💡 Utilisation](#-utilisation)
- [🏗️ Architecture](#️-architecture)
- [🔌 API](#-api)
- [🎨 Personnalisation](#-personnalisation)
- [🧪 Tests](#-tests)
- [📦 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 🎯 À Propos

**PitchPal** est un assistant IA révolutionnaire conçu pour les entrepreneurs, freelances et créateurs qui ont une idée brillante mais ne savent pas comment la présenter efficacement.

### 🌟 Le Problème
- 70% des entrepreneurs échouent à pitcher leur idée de manière convaincante
- La structuration d'un pitch professionnel prend habituellement 2-3 heures
- Manque de connaissances sur les bonnes pratiques de présentation

### 💡 La Solution
Avec PitchPal, il suffit de **décrire votre idée en 2 phrases** pour obtenir instantanément :
- Un pitch complet et structuré
- Un pitch deck professionnel
- Plusieurs tons de communication
- Export PDF immédiat

### 🎯 Objectif
**Réduire le temps de passage de l'idée au pitch de 3 heures à 2 minutes.**

---

## ✨ Fonctionnalités

### 🎪 Fonctionnalités Principales

- **🤖 Génération IA Avancée**
  - Powered by OpenAI GPT-4
  - Analyse contextuelle de votre idée
  - Génération en temps réel

- **🎨 4 Tons de Communication**
  - 💼 **Professionnel** : Investisseurs, business angels
  - 🎉 **Fun** : Réseaux sociaux, Product Hunt
  - 🔧 **Tech** : Équipes techniques, CTO
  - 🚀 **Startup** : Incubateurs, écosystème entrepreneurial

- **📊 Pitch Deck Complet**
  - Structure professionnelle en 8 slides
  - Design moderne et impactant
  - Contenu adapté à votre marché

- **📄 Export Multi-Format**
  - PDF haute qualité
  - Markdown pour édition
  - JSON pour intégration

### 🔧 Fonctionnalités Techniques

- **⚡ Performance**
  - Server Components (Next.js 15)
  - Streaming UI avec Suspense
  - Optimisation automatique des images

- **📱 Responsive Design**
  - Mobile-first approach
  - Interface adaptative
  - Accessibilité WCAG 2.1

- **🔒 Sécurité & Authentification**
  - NextAuth.js intégré
  - Authentification Google/GitHub
  - Protection des routes sensibles

- **💾 Persistance**
  - Sauvegarde automatique
  - Historique des pitchs
  - Gestion des favoris

---

## 🛠️ Stack Technique

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI avec Server Components
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes modernes

### Backend
- **Next.js API Routes** - API serverless
- **Prisma** - ORM type-safe
- **PostgreSQL** - Base de données relationnelle
- **NextAuth.js** - Authentification

### IA & Services
- **OpenAI GPT-4** - Génération de contenu
- **Puppeteer** - Génération PDF
- **Vercel** - Déploiement et hosting

### Outils de Développement
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatage de code
- **Jest** - Tests unitaires
- **Cypress** - Tests end-to-end

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 22+ 
- npm/yarn/pnpm
- PostgreSQL (local ou cloud)
- Clé API OpenAI

### Installation Express

```bash
# Cloner le projet
git clone https://github.com/votre-username/pitchpal.git
cd pitchpal

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local

# Configurer la base de données
npx prisma db push

# Lancer en développement
npm run dev
```

🎉 **Votre app est maintenant accessible sur [http://localhost:3000](http://localhost:3000)**

---

## 📖 Installation Détaillée

### 1. Clonage et Installation

```bash
# Cloner le repository
git clone https://github.com/sabowaryan/pitchpal.git
cd pitchpal

# Installer les dépendances
npm install
# ou
yarn install
# ou  
pnpm install
```

### 2. Configuration de la Base de Données

#### Option A: PostgreSQL Local
```bash
# Installer PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Créer une base de données
createdb pitchpal_dev
```

#### Option B: PostgreSQL Cloud (Recommandé)
- **Supabase** : [https://supabase.com](https://supabase.com)
- **Railway** : [https://railway.app](https://railway.app)
- **Neon** : [https://neon.tech](https://neon.tech)

### 3. Configuration Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la DB
npx prisma db push

# (Optionnel) Visualiser la DB
npx prisma studio
```

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# 🔑 Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/pitchpal_dev"

# 🤖 OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# 🔐 Authentification
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-super-securise"

# 📧 Google OAuth (optionnel)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 🐙 GitHub OAuth (optionnel)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# 📊 Analytics (optionnel)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### Configuration OpenAI

1. Créez un compte sur [OpenAI](https://platform.openai.com)
2. Générez une clé API
3. Ajoutez des crédits à votre compte
4. Configurez les limites de rate limiting

### Configuration OAuth

#### Google OAuth
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet
3. Activez l'API Google+
4. Créez des credentials OAuth 2.0
5. Ajoutez `http://localhost:3000/api/auth/callback/google` aux URLs autorisées

#### GitHub OAuth  
1. Allez dans Settings > Developer settings sur GitHub
2. Créez une nouvelle OAuth App
3. Configurez l'Authorization callback URL : `http://localhost:3000/api/auth/callback/github`

---

## 💡 Utilisation

### 🎯 Génération de Pitch Basique

```typescript
// Exemple d'utilisation du composant principal
import { PitchGenerator } from '@/components/forms/pitch-generator'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PitchGenerator />
    </div>
  )
}
```

### 📝 Utilisation de l'API

```typescript
// Générer un pitch via l'API
const response = await fetch('/api/generate-pitch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    idea: "Une application mobile qui connecte les dog-sitters avec les propriétaires de chiens dans leur quartier",
    tone: "professional"
  }),
})

const { pitch } = await response.json()
```

### 🎨 Personnalisation des Tons

```typescript
// Ajouter un nouveau ton personnalisé
const customPrompts = {
  ...PITCH_PROMPTS,
  creative: `
    Tu es un expert en communication créative et storytelling.
    Génère un pitch narratif et émotionnel...
  `
}
```

---

## 🏗️ Architecture

### 📁 Structure des Dossiers

```
pitchpal/
├── 📁 src/
│   ├── 📁 app/                    # App Router (Next.js 15)
│   │   ├── 📁 (auth)/            # Groupe de routes auth
│   │   ├── 📁 (dashboard)/       # Groupe de routes dashboard
│   │   ├── 📁 api/               # API Routes
│   │   ├── 📄 layout.tsx         # Layout racine
│   │   └── 📄 page.tsx           # Page d'accueil
│   ├── 📁 components/            # Composants React
│   │   ├── 📁 ui/               # Composants UI de base
│   │   ├── 📁 forms/            # Formulaires
│   │   ├── 📁 pitch/            # Composants pitch
│   │   └── 📁 layout/           # Composants layout
│   ├── 📁 lib/                   # Utilitaires et configs
│   │   ├── 📁 ai/               # Configuration IA
│   │   ├── 📁 db/               # Base de données
│   │   └── 📁 auth/             # Authentification
│   ├── 📁 hooks/                 # Hooks personnalisés
│   ├── 📁 types/                 # Types TypeScript
│   └── 📁 styles/                # Styles globaux
├── 📁 prisma/                    # Schéma base de données
├── 📁 public/                    # Assets statiques
└── 📁 docs/                      # Documentation
```

### 🔄 Flux de Données

```mermaid
graph TD
    A[Utilisateur saisit l'idée] --> B[Composant PitchGenerator]
    B --> C[Hook usePitchGenerator]
    C --> D[API Route /api/generate-pitch]
    D --> E[Service AI generatePitch]
    E --> F[OpenAI GPT-4]
    F --> G[Pitch structuré]
    G --> H[Sauvegarde DB optionnelle]
    H --> I[Retour à l'utilisateur]
    I --> J[Affichage PitchDisplay]
    J --> K[Export PDF/Markdown]
```

---

## 🔌 API

### 📡 Endpoints Disponibles

#### `POST /api/generate-pitch`
Génère un pitch à partir d'une idée

**Request Body:**
```json
{
  "idea": "Description de votre idée en 2 phrases",
  "tone": "professional|fun|tech|startup"
}
```

**Response:**
```json
{
  "pitch": {
    "tagline": "Tagline percutante",
    "problem": "Problème identifié",
    "solution": "Solution proposée",
    "targetMarket": "Marché cible",
    "businessModel": "Modèle économique",
    "competitiveAdvantage": "Avantage concurrentiel",
    "pitchDeck": {
      "slides": [
        {
          "title": "Titre du slide",
          "content": "Contenu du slide",
          "order": 1
        }
      ]
    }
  }
}
```

#### `POST /api/export-pdf`
Exporte un pitch en PDF

**Request Body:**
```json
{
  "pitchId": "pitch-id-uuid"
}
```

**Response:**
```
Content-Type: application/pdf
```

#### `GET /api/pitches`
Récupère l'historique des pitchs (authentification requise)

**Response:**
```json
{
  "pitches": [
    {
      "id": "pitch-id",
      "tagline": "Tagline",
      "createdAt": "2025-01-15T10:30:00Z",
      "tone": "professional"
    }
  ]
}
```

### 🔐 Authentification API

```typescript
// Exemple d'utilisation avec authentification
const response = await fetch('/api/pitches', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
```

---

## 🎨 Personnalisation

### 🎭 Personnaliser les Tons

```typescript
// src/lib/ai/pitch-prompts.ts
export const CUSTOM_PROMPTS = {
  influencer: `
    Tu es un expert en communication d'influence.
    Génère un pitch adapté aux réseaux sociaux...
  `,
  investor: `
    Tu es un expert en levée de fonds.
    Génère un pitch optimisé pour les investisseurs...
  `
}
```

### 🎨 Personnaliser le Design

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#your-primary-color',
          secondary: '#your-secondary-color',
        }
      }
    }
  }
}
```

### 📊 Personnaliser les Templates de Pitch

```typescript
// src/lib/ai/pitch-templates.ts
export const PITCH_TEMPLATES = {
  saas: {
    structure: ['Problem', 'Solution', 'Market', 'Traction', 'Business Model'],
    emphasis: 'scalability'
  },
  marketplace: {
    structure: ['Problem', 'Solution', 'Market Size', 'Network Effects'],
    emphasis: 'network_effects'
  }
}
```

---

## 🧪 Tests

### 🏃‍♂️ Lancer les Tests

```bash
# Tests unitaires
npm run test

# Tests avec surveillance
npm run test:watch

# Tests end-to-end
npm run test:e2e

# Coverage
npm run test:coverage
```

### 📝 Exemple de Test

```typescript
// __tests__/components/PitchGenerator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PitchGenerator } from '@/components/forms/pitch-generator'

describe('PitchGenerator', () => {
  test('génère un pitch quand le formulaire est soumis', async () => {
    render(<PitchGenerator />)
    
    const textarea = screen.getByPlaceholderText(/décrivez votre idée/i)
    const button = screen.getByRole('button', { name: /générer/i })
    
    fireEvent.change(textarea, { 
      target: { value: 'Une app révolutionnaire' } 
    })
    fireEvent.click(button)
    
    expect(screen.getByText(/génération en cours/i)).toBeInTheDocument()
  })
})
```

---

## 📦 Déploiement

### 🚀 Déploiement Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
```

### 🐳 Déploiement Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build et run
docker build -t pitchpal .
docker run -p 3000:3000 pitchpal
```

### ☁️ Déploiement Cloud

#### Netlify
```bash
# Build command
npm run build

# Publish directory
.next
```

#### Railway
```bash
# Connecter votre repo GitHub
railway login
railway link
railway up
```

---

## 🤝 Contribution

Nous accueillons les contributions avec plaisir ! 

### 🛠️ Comment Contribuer

1. **Fork** le projet
2. **Créez** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commitez** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez** une Pull Request

### 📋 Guidelines

- Utilisez des commits conventionnels
- Ajoutez des tests pour les nouvelles fonctionnalités
- Respectez le style de code existant
- Documentez les changements importants

### 🐛 Signaler un Bug

Utilisez notre [template de bug report](https://github.com/sabowaryan/pitchpal/issues/new?template=bug_report.md)

### 💡 Proposer une Fonctionnalité

Utilisez notre [template de feature request](https://github.com/sabowaryan/pitchpal/issues/new?template=feature_request.md)

---

## 📊 Roadmap

### 🎯 Version 1.0 (Actuelle)
- ✅ Génération de pitch basique
- ✅ 4 tons de communication
- ✅ Export PDF
- ✅ Interface responsive

### 🚀 Version 1.1 (Q2 2026)
- 🔄 Analyse de marché automatique
- 🔄 Intégration réseaux sociaux
- 🔄 Templates personnalisés
- 🔄 Collaboration en équipe

### 🎪 Version 2.0 (Q3 2025)
- 📅 Générateur de business plan
- 📅 Analyse de concurrence IA
- 📅 Intégration CRM
- 📅 API publique

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2025 PitchPal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Remerciements

- **OpenAI** pour l'API GPT-4
- **Vercel** pour l'infrastructure de déploiement
- **Next.js Team** pour le framework
- **Tailwind CSS** pour le framework CSS
- **Prisma** pour l'ORM
- **Tous les contributeurs** qui rendent ce projet possible

---

## 📞 Support

- 📧 **Email** : support@pitchpal.com
- 💬 **Discord** : [Rejoindre notre communauté](https://discord.gg/pitchpal)
- 🐦 **Twitter** : [@PitchPalApp](https://twitter.com/PitchPalApp)
- 📖 **Documentation** : [docs.pitchpal.com](https://docs.pitchpal.com)

---

<div align="center">
  <h3>⭐ Si PitchPal vous aide, n'hésitez pas à laisser une étoile ! ⭐</h3>
  
  <p>Fait avec ❤️ par l'équipe PitchPal</p>
</div>