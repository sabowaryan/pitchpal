export const APP_NAME = 'PitchPal'
export const APP_DESCRIPTION = 'Transformez votre idée en pitch professionnel en 2 minutes'

export const TONES = {
  professional: {
    label: 'Professionnel',
    description: 'Ton formel et business pour investisseurs et partenaires',
    icon: 'briefcase',
    color: 'blue'
  },
  fun: {
    label: 'Fun',
    description: 'Ton décontracté et engageant pour réseaux sociaux',
    icon: 'sparkles',
    color: 'purple'
  },
  tech: {
    label: 'Tech',
    description: 'Ton technique et innovant pour équipes de développement',
    icon: 'zap',
    color: 'green'
  },
  startup: {
    label: 'Startup',
    description: 'Ton disruptif et moderne pour incubateurs et accélérateurs',
    icon: 'rocket',
    color: 'orange'
  }
} as const

export const MAX_IDEA_LENGTH = 500
export const MIN_IDEA_LENGTH = 10