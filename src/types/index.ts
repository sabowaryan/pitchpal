// Re-export all types for easier imports
export * from './pitch'
export * from './user'
export * from './api'

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Form states
export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isValid: boolean
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system'

// Component props helpers
export type ComponentWithChildren<T = {}> = T & {
  children: React.ReactNode
}

export type ComponentWithClassName<T = {}> = T & {
  className?: string
}