// App Configuration
export const APP_NAME = 'PitchPal'
export const APP_DESCRIPTION = 'Transformez votre idée en pitch professionnel en 2 minutes'
export const APP_VERSION = '1.0.0'

// Form Validation
export const MAX_IDEA_LENGTH = 500
export const MIN_IDEA_LENGTH = 10

// Tone Configuration with Professional Icons
export const TONES = {
  professional: {
    label: 'Professionnel',
    description: 'Ton formel et business pour investisseurs et partenaires',
    icon: 'briefcase',
    color: 'blue',
    audience: 'Investisseurs, Business Angels, Partenaires',
    examples: ['Présentation investisseurs', 'Board meeting', 'Partenariats stratégiques']
  },
  fun: {
    label: 'Fun',
    description: 'Ton décontracté et engageant pour réseaux sociaux',
    icon: 'sparkles',
    color: 'purple',
    audience: 'Réseaux sociaux, Grand public, Community',
    examples: ['Product Hunt', 'LinkedIn posts', 'Campagnes marketing']
  },
  tech: {
    label: 'Tech',
    description: 'Ton technique et innovant pour équipes de développement',
    icon: 'zap',
    color: 'green',
    audience: 'CTOs, Développeurs, Équipes techniques',
    examples: ['Tech talks', 'Architecture reviews', 'Developer conferences']
  },
  startup: {
    label: 'Startup',
    description: 'Ton disruptif et moderne pour incubateurs et accélérateurs',
    icon: 'rocket',
    color: 'orange',
    audience: 'Incubateurs, Accélérateurs, Écosystème startup',
    examples: ['Demo days', 'Pitch competitions', 'Startup events']
  }
} as const

// API Configuration
export const API_ENDPOINTS = {
  GENERATE_PITCH: '/api/generate-pitch',
  EXPORT_PDF: '/api/export-pdf',
  AI_STATUS: '/api/ai-status'
} as const

// Generation Settings
export const GENERATION_CONFIG = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  RETRY_ATTEMPTS: 3,
  TIMEOUT_MS: 30000
} as const

// UI Constants
export const ANIMATION_DELAYS = {
  FAST: 100,
  NORMAL: 200,
  SLOW: 300
} as const

// File Export
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  MARKDOWN: 'md',
  JSON: 'json'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  VALIDATION_ERROR: 'Données invalides. Veuillez vérifier vos informations.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  AI_UNAVAILABLE: 'Service IA temporairement indisponible.',
  GENERATION_FAILED: 'Échec de la génération. Veuillez réessayer.',
  EXPORT_FAILED: 'Échec de l\'export. Veuillez réessayer.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  PITCH_GENERATED: 'Pitch généré avec succès !',
  EXPORT_COMPLETED: 'Export terminé avec succès !',
  DATA_SAVED: 'Données sauvegardées avec succès !'
} as const