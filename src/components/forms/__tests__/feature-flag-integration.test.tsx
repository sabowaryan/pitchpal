/**
 * Integration tests for Feature Flag system with Pitch Generator
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PitchGeneratorWrapper } from '../pitch-generator-wrapper'
import { initializeFeatureFlags, FEATURE_FLAGS, devUtils } from '@/lib/feature-flags'

// Mock the API
global.fetch = jest.fn()

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('Feature Flag Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)
    devUtils.clearOverrides()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        pitch: {
          title: 'Test Pitch',
          sections: {
            problem: 'Test problem',
            solution: 'Test solution'
          }
        }
      })
    })
  })

  test('should render enhanced system when all flags are enabled', async () => {
    // Initialize with all flags enabled
    initializeFeatureFlags({
      environment: 'test',
      flags: {
        [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
          key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
          enabled: true,
          description: 'Full enhanced system',
          rolloutPercentage: 100,
          fallbackBehavior: 'legacy'
        }
      }
    })

    render(<PitchGeneratorWrapper />)
    
    // Should show enhanced features
    expect(screen.getByText('Générer mon pitch professionnel')).toBeInTheDocument()
    
    // Should have real-time validation (enhanced feature)
    const textarea = screen.getByPlaceholderText(/Une application mobile/)
    expect(textarea).toBeInTheDocument()
  })

  test('should fallback to legacy system when enhanced system is disabled', async () => {
    // Initialize with enhanced system disabled
    initializeFeatureFlags({
      environment: 'test',
      flags: {
        [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
          key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
          enabled: false,
          description: 'Full enhanced system',
          rolloutPercentage: 0,
          fallbackBehavior: 'legacy'
        }
      }
    })

    render(<PitchGeneratorWrapper />)
    
    // Should show legacy system
    expect(screen.getByText('Générer mon pitch')).toBeInTheDocument()
    
    // Should have basic textarea
    const textarea = screen.getByPlaceholderText(/Une application mobile/)
    expect(textarea).toBeInTheDocument()
  })

  test('should handle feature flag errors gracefully', async () => {
    // Initialize with enhanced system enabled
    initializeFeatureFlags({
      environment: 'test',
      flags: {
        [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
          key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
          enabled: true,
          description: 'Full enhanced system',
          rolloutPercentage: 100,
          fallbackBehavior: 'legacy'
        }
      }
    })

    // Mock console.error to avoid test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<PitchGeneratorWrapper />)
    
    // Should render without throwing
    expect(screen.getByText('Générer mon pitch professionnel')).toBeInTheDocument()
    
    consoleErrorSpy.mockRestore()
  })

  test('should show feature flag monitor in development', () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    initializeFeatureFlags({
      environment: 'development'
    })

    render(<PitchGeneratorWrapper />)
    
    // Should show feature flag monitor
    expect(screen.getByText('Feature Flags')).toBeInTheDocument()
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv
  })

  test('should handle progressive rollout correctly', async () => {
    // Test with 50% rollout
    initializeFeatureFlags({
      environment: 'test',
      userId: 'test-user-50-percent',
      flags: {
        [FEATURE_FLAGS.FULL_ENHANCED_SYSTEM]: {
          key: FEATURE_FLAGS.FULL_ENHANCED_SYSTEM,
          enabled: true,
          description: 'Full enhanced system',
          rolloutPercentage: 50,
          fallbackBehavior: 'legacy'
        }
      }
    })

    render(<PitchGeneratorWrapper />)
    
    // Should render either enhanced or legacy based on user hash
    const generateButton = screen.getByRole('button', { name: /Générer mon pitch/ })
    expect(generateButton).toBeInTheDocument()
  })

  test('should record metrics during usage', async () => {
    initializeFeatureFlags({
      environment: 'test'
    })

    render(<PitchGeneratorWrapper />)
    
    const textarea = screen.getByPlaceholderText(/Une application mobile/)
    const generateButton = screen.getByText('Générer mon pitch professionnel')
    
    // Fill in the form
    fireEvent.change(textarea, {
      target: { value: 'Une application mobile innovante qui révolutionne le marché des animaux de compagnie en connectant propriétaires et services.' }
    })
    
    // Submit the form
    fireEvent.click(generateButton)
    
    // Should record usage metrics (tested via monitoring system)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-pitch', expect.any(Object))
    })
  })

  test('should handle API errors with enhanced error handling', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    initializeFeatureFlags({
      environment: 'test',
      flags: {
        [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
          key: FEATURE_FLAGS.ENHANCED_ERROR_HANDLING,
          enabled: true,
          description: 'Enhanced error handling',
          rolloutPercentage: 100,
          fallbackBehavior: 'legacy'
        }
      }
    })

    render(<PitchGeneratorWrapper />)
    
    const textarea = screen.getByPlaceholderText(/Une application mobile/)
    const generateButton = screen.getByText('Générer mon pitch professionnel')
    
    // Fill in the form
    fireEvent.change(textarea, {
      target: { value: 'Une application mobile innovante qui révolutionne le marché des animaux de compagnie.' }
    })
    
    // Submit the form
    fireEvent.click(generateButton)
    
    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument()
    })
  })

  test('should allow manual feature flag overrides', () => {
    initializeFeatureFlags({
      environment: 'test'
    })

    // Override feature flag
    devUtils.disableFeature(FEATURE_FLAGS.FULL_ENHANCED_SYSTEM)

    render(<PitchGeneratorWrapper />)
    
    // Should show legacy system due to override
    expect(screen.getByText('Générer mon pitch')).toBeInTheDocument()
  })
})