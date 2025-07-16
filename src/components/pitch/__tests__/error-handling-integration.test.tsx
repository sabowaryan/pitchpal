/**
 * Integration tests for error handling in the Pitch Generator
 * Testing different error scenarios and recovery mechanisms
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useEnhancedPitchGenerator } from '@/hooks/use-enhanced-pitch-generator'
import { ErrorDisplay } from '@/components/forms/error-display'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'

// Mock fetch
global.fetch = jest.fn()

// Mock AbortController
const mockAbort = jest.fn()
global.AbortController = jest.fn().mockImplementation(() => ({
    signal: { aborted: false },
    abort: mockAbort
}))

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock ErrorDisplay component
jest.mock('@/components/forms/error-display', () => ({
    ErrorDisplay: jest.fn(({ error, onRetry, onDismiss, cooldownSeconds, retryDisabled }) => (
        <div data-testid="error-display">
            <div data-testid="error-type">{error?.type}</div>
            <div data-testid="error-message">{error?.message}</div>
            <div data-testid="cooldown-seconds">{cooldownSeconds || 0}</div>
            <button
                data-testid="retry-button"
                onClick={onRetry}
                disabled={retryDisabled || cooldownSeconds > 0}
            >
                Réessayer {cooldownSeconds > 0 ? `(${cooldownSeconds}s)` : ''}
            </button>
            <button data-testid="dismiss-button" onClick={onDismiss}>Fermer</button>
        </div>
    ))
}))

// Mock timers for testing retry delays
jest.useFakeTimers()

describe('Error Handling Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.getItem.mockReturnValue(null)
    })

    afterEach(() => {
        jest.clearAllTimers()
    })

    describe('Network Error Scenarios', () => {
        it('should handle network timeout with proper error classification', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            // Mock network timeout
            mockFetch.mockImplementationOnce(() =>
                new Promise((_, reject) => {
                    setTimeout(() => reject(new TypeError('Failed to fetch')), 50)
                })
            )

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                result.current.generatePitch('Network timeout test', 'professional')
            })

            // Fast forward through timeout
            act(() => {
                jest.advanceTimersByTime(50)
            })

            // Wait for error to be processed
            await waitFor(() => {
                expect(result.current.state.error).toBeDefined()
            })

            // Verify error classification
            expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)
            expect(result.current.state.error?.retryable).toBe(true)
            expect(result.current.state.isLoading).toBe(false)
        })

        it('should handle DNS resolution failures', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            // Mock DNS failure
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('DNS failure test', 'professional')
            })

            // Verify error state
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)
            expect(result.current.state.error?.message).toContain('réseau')
        })

        it('should handle connection refused errors', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            // Mock connection refused
            const connectionError = new Error('Connection refused')
            connectionError.name = 'NetworkError'
            mockFetch.mockRejectedValueOnce(connectionError)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('Connection refused test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)
            expect(result.current.state.error?.retryable).toBe(true)
        })
    })

    describe('Server Error Scenarios', () => {
        it('should handle 500 internal server errors', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    error: 'Internal server error occurred'
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('Server 500 test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
            expect(result.current.state.error?.retryable).toBe(false)
            expect(result.current.state.error?.message).toContain('serveur')
        })

        it('should handle 503 service unavailable errors', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                json: async () => ({
                    error: 'Service temporarily unavailable'
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('Service unavailable test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
            expect(result.current.state.error?.retryable).toBe(true)
        })

        it('should handle 429 rate limiting errors', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                headers: new Headers({
                    'Retry-After': '60'
                }),
                json: async () => ({
                    error: 'Rate limit exceeded'
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('Rate limit test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.SERVER)
            expect(result.current.state.error?.retryable).toBe(true)
            expect(result.current.state.error?.message).toContain('limite')
        })
    })

    describe('AI Service Error Scenarios', () => {
        it('should handle AI service quota exceeded', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 402,
                statusText: 'Payment Required',
                json: async () => ({
                    error: 'AI service quota exceeded',
                    code: 'QUOTA_EXCEEDED'
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('AI quota test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.AI_SERVICE)
            expect(result.current.state.error?.retryable).toBe(false)
        })

        it('should handle AI service content policy violations', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    error: 'Content violates AI service policy',
                    code: 'CONTENT_POLICY_VIOLATION'
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation
            await act(async () => {
                await result.current.generatePitch('Content policy test', 'professional')
            })

            // Verify error classification
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.AI_SERVICE)
            expect(result.current.state.error?.retryable).toBe(false)
        })
    })

    describe('Validation Error Scenarios', () => {
        it('should handle client-side validation errors', async () => {
            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Try to generate with empty idea
            await act(async () => {
                await result.current.generatePitch('', 'professional')
            })

            // Verify validation error
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.VALIDATION)
            expect(result.current.state.error?.retryable).toBe(false)
            expect(result.current.state.error?.message).toContain('idée')
        })

        it('should handle server-side validation errors', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    error: 'Validation failed',
                    details: {
                        idea: 'Idea is too short',
                        tone: 'Invalid tone selected'
                    }
                })
            } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation with valid client data but server rejects
            await act(async () => {
                await result.current.generatePitch('Valid client idea', 'invalid_tone')
            })

            // Verify validation error
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.VALIDATION)
            expect(result.current.state.error?.retryable).toBe(false)
        })
    })

    describe('Error Recovery Integration', () => {
        it('should integrate error display with retry functionality', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>

            // First call fails, second succeeds
            mockFetch
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        pitch: {
                            tagline: 'Recovery success',
                            problem: 'Recovery problem',
                            solution: 'Recovery solution',
                            targetMarket: 'Recovery market',
                            businessModel: 'Recovery model',
                            competitiveAdvantage: 'Recovery advantage',
                            pitchDeck: {
                                slides: [{ title: 'Recovery', content: 'Recovery', order: 1 }]
                            }
                        }
                    })
                } as Response)

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Disable auto-retry for manual control
            act(() => {
                result.current.savePreferences({ enableRetry: false })
            })

            // Start generation (will fail)
            await act(async () => {
                await result.current.generatePitch('Error recovery test', 'professional')
            })

            // Verify error state
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.type).toBe(ErrorType.NETWORK)

            // Render error display
            const { getByTestId } = render(
                <ErrorDisplay
                    error={result.current.state.error as EnhancedError}
                    onRetry={() => result.current.retryGeneration()}
                    onDismiss={() => result.current.resetState()}
                />
            )

            // Verify error display
            expect(getByTestId('error-type').textContent).toBe(ErrorType.NETWORK)
            expect(getByTestId('retry-button')).not.toBeDisabled()

            // Click retry
            fireEvent.click(getByTestId('retry-button'))

            // Wait for retry to succeed
            await waitFor(() => {
                expect(result.current.state.pitch).toBeDefined()
                expect(result.current.state.error).toBe(null)
            })

            // Verify success
            expect(result.current.state.pitch?.tagline).toBe('Recovery success')
            expect(result.current.state.retryCount).toBe(1)
        })

        it('should handle error display with cooldown periods', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Enable auto-retry to trigger cooldown
            act(() => {
                result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 1 })
            })

            // Start generation (will fail and trigger retry)
            await act(async () => {
                result.current.generatePitch('Cooldown test', 'professional')
            })

            // Wait for first failure
            await waitFor(() => {
                expect(result.current.state.error).toBeDefined()
            })

            // Render error display with cooldown
            const { getByTestId, rerender } = render(
                <ErrorDisplay
                    error={result.current.state.error as EnhancedError}
                    onRetry={() => result.current.retryGeneration()}
                    onDismiss={() => result.current.resetState()}
                    cooldownSeconds={3}
                />
            )

            // Verify cooldown is active
            expect(getByTestId('cooldown-seconds').textContent).toBe('3')
            expect(getByTestId('retry-button')).toBeDisabled()
            expect(getByTestId('retry-button').textContent).toContain('(3s)')

            // Simulate cooldown countdown
            rerender(
                <ErrorDisplay
                    error={result.current.state.error as EnhancedError}
                    onRetry={() => result.current.retryGeneration()}
                    onDismiss={() => result.current.resetState()}
                    cooldownSeconds={0}
                />
            )

            // Verify cooldown is over
            expect(getByTestId('cooldown-seconds').textContent).toBe('0')
            expect(getByTestId('retry-button')).not.toBeDisabled()
            expect(getByTestId('retry-button').textContent).not.toContain('(')
        })
    })

    describe('Error Context and Logging', () => {
        it('should capture comprehensive error context', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Start generation with specific context
            await act(async () => {
                await result.current.generatePitch('Context capture test idea', 'startup')
            })

            // Verify error context
            expect(result.current.state.error).toBeDefined()
            expect(result.current.state.error?.context).toBeDefined()
            expect(result.current.state.error?.context.idea).toBe('Context capture test idea')
            expect(result.current.state.error?.context.tone).toBe('startup')
            expect(result.current.state.error?.context.retryCount).toBe(0)
            expect(result.current.state.error?.timestamp).toBeInstanceOf(Date)
        })

        it('should update error context on retry attempts', async () => {
            const mockFetch = fetch as jest.MockedFunction<typeof fetch>
            mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

            const { result } = renderHook(() => useEnhancedPitchGenerator())

            // Enable auto-retry
            act(() => {
                result.current.savePreferences({ enableRetry: true, maxRetryAttempts: 2 })
            })

            // Start generation
            await act(async () => {
                result.current.generatePitch('Retry context test', 'professional')
            })

            // Wait for first failure
            await waitFor(() => {
                expect(result.current.state.error).toBeDefined()
                expect(result.current.state.error?.context.retryCount).toBe(0)
            })

            // Fast forward through retry
            act(() => {
                jest.advanceTimersByTime(1000)
            })

            // Wait for retry failure
            await waitFor(() => {
                expect(result.current.state.retryCount).toBe(1)
            })

            // Verify updated context
            expect(result.current.state.error?.context.retryCount).toBe(1)
        })
    })
})