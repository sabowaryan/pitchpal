export const APP_NAME = 'PitchPal'
export const APP_DESCRIPTION = 'Transformez votre idée en pitch professionnel en 2 minutes'

export const TONES = {
  professional: {
    label: 'Professionnel',
    description: 'Ton formel et business',
    icon: '💼'
  },
  fun: {
    label: 'Fun',
    description: 'Ton décontracté et engageant',
    icon: '🎉'
  },
  tech: {
    label: 'Tech',
    description: 'Ton technique et innovant',
    icon: '⚡'
  },
  startup: {
    label: 'Startup',
    description: 'Ton disruptif et moderne',
    icon: '🚀'
  }
} as const

export const MAX_IDEA_LENGTH = 500
export const MIN_IDEA_LENGTH = 10 