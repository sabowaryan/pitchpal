/**
 * Debug test for retry system
 */

import { renderHook } from '@testing-library/react'
import { useRetrySystem } from '../use-retry-system'

describe('useRetrySystem Debug', () => {
  it('should render without errors', () => {
    const { result } = renderHook(() => useRetrySystem())
    
    console.log('Hook result:', result.current)
    
    expect(result.current).toBeDefined()
    expect(result.current.retryCount).toBeDefined()
    expect(result.current.setRetryCount).toBeDefined()
  })
})