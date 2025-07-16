/**
 * Performance Utilities
 * 
 * This module provides performance optimization utilities including:
 * - Debouncing for real-time validation
 * - Memoization for expensive calculations
 * - Cleanup utilities for timers and AbortControllers
 */

import React, { useCallback, useRef, useEffect, useState } from 'react'

/**
 * Debounce hook for delaying function execution
 * Useful for real-time validation to avoid excessive API calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )
}

/**
 * Debounced value hook for delaying state updates
 * Useful for real-time validation input debouncing
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Throttle hook for limiting function execution frequency
 * Useful for scroll events or frequent user interactions
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCallRef.current

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now
        callbackRef.current(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callbackRef.current(...args)
        }, delay - timeSinceLastCall)
      }
    }) as T,
    [delay]
  )
}

/**
 * Memoization hook for expensive calculations
 * Caches results based on dependencies
 */
export function useMemoizedCallback<T extends (...args: any[]) => any, R>(
  callback: T,
  deps: React.DependencyList
): T {
  const cache = useRef<Map<string, R> | null>(null)
  const prevDepsRef = useRef<string>('')
  
  // Initialize cache if not already initialized
  if (cache.current === null) {
    cache.current = new Map()
  }
  
  // Clear cache when dependencies change
  const depsString = JSON.stringify(deps)
  
  if (prevDepsRef.current !== depsString) {
    if (cache.current) {
      cache.current.clear()
    }
    prevDepsRef.current = depsString
  }

  return useCallback(
    ((...args: Parameters<T>) => {
      // Ensure cache is initialized
      if (!cache.current) {
        cache.current = new Map()
      }
      
      const key = JSON.stringify(args)
      
      if (cache.current.has(key)) {
        return cache.current.get(key)
      }
      
      const result = callback(...args)
      cache.current.set(key, result)
      
      // Limit cache size to prevent memory leaks
      if (cache.current.size > 100) {
        const firstKey = cache.current.keys().next().value
        if (firstKey !== undefined) {
          cache.current.delete(firstKey)
        }
      }
      
      return result
    }) as T,
    deps
  )
}

/**
 * Cleanup manager for timers and AbortControllers
 * Automatically cleans up resources on unmount or dependency changes
 */
export function useCleanup() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const abortControllersRef = useRef<Set<AbortController>>(new Set())

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()

    // Clear all intervals
    intervalsRef.current.forEach(interval => clearInterval(interval))
    intervalsRef.current.clear()

    // Abort all controllers
    abortControllersRef.current.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    abortControllersRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Helper functions to register resources
  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer)
    return timer
  }, [])

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval)
    return interval
  }, [])

  const addAbortController = useCallback((controller: AbortController) => {
    abortControllersRef.current.add(controller)
    return controller
  }, [])

  // Helper functions to remove resources
  const removeTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer)
    timersRef.current.delete(timer)
  }, [])

  const removeInterval = useCallback((interval: NodeJS.Timeout) => {
    clearInterval(interval)
    intervalsRef.current.delete(interval)
  }, [])

  const removeAbortController = useCallback((controller: AbortController) => {
    if (!controller.signal.aborted) {
      controller.abort()
    }
    abortControllersRef.current.delete(controller)
  }, [])

  return {
    cleanup,
    addTimer,
    addInterval,
    addAbortController,
    removeTimer,
    removeInterval,
    removeAbortController
  }
}

/**
 * Lazy component loader with error boundary
 * Useful for code splitting and reducing initial bundle size
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn)
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return React.createElement(React.Suspense, {
      fallback: fallback ? React.createElement(fallback) : React.createElement('div', {
        className: 'flex items-center justify-center p-4'
      }, React.createElement('div', {
        className: 'animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600'
      }))
    }, React.createElement(LazyComponent, props))
  }
}

/**
 * Performance monitoring hook
 * Tracks component render times and performance metrics
 */
export function usePerformanceMonitor(componentName: string, enabled = false) {
  const renderStartRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)

  // Track render start time and increment count
  if (enabled) {
    renderStartRef.current = performance.now()
    renderCountRef.current += 1
  }

  useEffect(() => {
    if (!enabled) return

    const renderTime = performance.now() - renderStartRef.current
    
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`
      )
    }
  })

  return {
    renderCount: renderCountRef.current,
    logPerformance: useCallback((operation: string, startTime: number) => {
      if (!enabled) return
      
      const duration = performance.now() - startTime
      console.log(`[Performance] ${componentName} ${operation}: ${duration.toFixed(2)}ms`)
    }, [componentName, enabled])
  }
}

/**
 * Intersection Observer hook for lazy loading
 * Useful for loading components only when they come into view
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement | null>(null)
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return {
    elementRef,
    isIntersecting,
    hasIntersected
  }
}
/**

 * Virtual scrolling hook for large lists
 * Optimizes rendering of large datasets by only rendering visible items
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = React.useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  }
}

/**
 * Image lazy loading hook with intersection observer
 * Optimizes image loading by only loading images when they come into view
 */
export function useImageLazyLoading(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (!hasIntersected || isLoaded || isError) return

    const img = new Image()
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
    }
    img.onerror = () => {
      setIsError(true)
    }
    img.src = src
  }, [hasIntersected, src, isLoaded, isError])

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isError
  }
}

/**
 * Batch updates hook for reducing re-renders
 * Groups multiple state updates into a single render cycle
 */
export function useBatchedUpdates<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState(initialState)
  const pendingUpdatesRef = useRef<Partial<T>>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, ...pendingUpdatesRef.current }))
      pendingUpdatesRef.current = {}
      timeoutRef.current = null
    }, 0)
  }, [])

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      setState(prevState => ({ ...prevState, ...pendingUpdatesRef.current }))
      pendingUpdatesRef.current = {}
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    batchUpdate,
    flushUpdates
  }
}

/**
 * Memory usage monitor hook
 * Tracks component memory usage and warns about potential leaks
 */
export function useMemoryMonitor(componentName: string, enabled = false) {
  const memoryRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('memory' in performance)) {
      return
    }

    const checkMemory = () => {
      // @ts-ignore - performance.memory is not in all browsers
      const currentMemory = performance.memory?.usedJSHeapSize || 0
      const memoryDiff = currentMemory - memoryRef.current

      if (memoryDiff > 10 * 1024 * 1024) { // 10MB increase
        console.warn(
          `[Memory] ${componentName} memory usage increased by ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`
        )
      }

      memoryRef.current = currentMemory
    }

    intervalRef.current = setInterval(checkMemory, 5000) // Check every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [componentName, enabled])

  return {
    getCurrentMemoryUsage: useCallback(() => {
      if (typeof window === 'undefined' || !('memory' in performance)) {
        return 0
      }
      // @ts-ignore
      return performance.memory?.usedJSHeapSize || 0
    }, [])
  }
}

/**
 * Prefetch hook for preloading resources
 * Optimizes loading by prefetching resources before they're needed
 */
export function usePrefetch() {
  const prefetchedRef = useRef<Set<string>>(new Set())

  const prefetchResource = useCallback((url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch') => {
    if (prefetchedRef.current.has(url)) {
      return Promise.resolve()
    }

    prefetchedRef.current.add(url)

    switch (type) {
      case 'script':
        return new Promise((resolve, reject) => {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.href = url
          link.onload = () => resolve(undefined)
          link.onerror = reject
          document.head.appendChild(link)
        })

      case 'style':
        return new Promise((resolve, reject) => {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.href = url
          link.onload = () => resolve(undefined)
          link.onerror = reject
          document.head.appendChild(link)
        })

      case 'image':
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(undefined)
          img.onerror = reject
          img.src = url
        })

      case 'fetch':
      default:
        return fetch(url, { method: 'HEAD' }).then(() => undefined)
    }
  }, [])

  const prefetchComponent = useCallback((importFn: () => Promise<any>) => {
    return importFn().catch(() => {
      // Silently fail prefetch attempts
    })
  }, [])

  return {
    prefetchResource,
    prefetchComponent
  }
}