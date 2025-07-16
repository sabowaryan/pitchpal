/**
 * Cleanup utilities for user preferences
 * 
 * This module provides automatic cleanup of old history items,
 * storage optimization, and maintenance tasks for user preferences.
 */

import { UserPreferences, MAX_IDEA_HISTORY } from './types'
import { loadPreferences, savePreferences } from './storage'

/**
 * Configuration for cleanup operations
 */
export const CLEANUP_CONFIG = {
  // Maximum age for idea history items (in days)
  maxIdeaAge: 90,
  
  // Maximum number of ideas to keep
  maxIdeas: MAX_IDEA_HISTORY,
  
  // Minimum time between cleanup operations (in milliseconds)
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  
  // Maximum storage size before forcing cleanup (in bytes)
  maxStorageSize: 50 * 1024, // 50KB
  
  // Patterns for ideas that should be cleaned up more aggressively
  lowQualityPatterns: [
    /^test\s*$/i,
    /^hello\s*$/i,
    /^abc+$/i,
    /^123+$/i,
    /^\s*$/, // Empty or whitespace only
    /^(.)\1{10,}$/ // Repeated characters
  ]
} as const

/**
 * Metadata for tracking cleanup operations
 */
interface CleanupMetadata {
  lastCleanup: Date
  totalCleanupsPerformed: number
  itemsRemovedLastCleanup: number
}

/**
 * Storage key for cleanup metadata
 */
const CLEANUP_METADATA_KEY = 'pitch_generator_cleanup_metadata'

/**
 * Gets cleanup metadata from storage
 */
function getCleanupMetadata(): CleanupMetadata {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultMetadata()
    }

    const stored = localStorage.getItem(CLEANUP_METADATA_KEY)
    if (!stored) {
      return createDefaultMetadata()
    }

    const parsed = JSON.parse(stored)
    return {
      lastCleanup: new Date(parsed.lastCleanup),
      totalCleanupsPerformed: parsed.totalCleanupsPerformed || 0,
      itemsRemovedLastCleanup: parsed.itemsRemovedLastCleanup || 0
    }
  } catch {
    return createDefaultMetadata()
  }
}

/**
 * Creates default cleanup metadata
 */
function createDefaultMetadata(): CleanupMetadata {
  return {
    lastCleanup: new Date(0), // Unix epoch
    totalCleanupsPerformed: 0,
    itemsRemovedLastCleanup: 0
  }
}

/**
 * Saves cleanup metadata to storage
 */
function saveCleanupMetadata(metadata: CleanupMetadata): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLEANUP_METADATA_KEY, JSON.stringify(metadata))
    }
  } catch (error) {
    console.warn('Failed to save cleanup metadata:', error)
  }
}

/**
 * Checks if an idea is considered low quality
 */
function isLowQualityIdea(idea: string): boolean {
  return CLEANUP_CONFIG.lowQualityPatterns.some(pattern => pattern.test(idea))
}

/**
 * Calculates the age of an idea based on when it was likely added
 * Since we don't store timestamps for individual ideas, we estimate based on position
 */
function estimateIdeaAge(index: number, totalIdeas: number, lastUsed: Date): number {
  // Assume ideas were added linearly over time
  // More recent ideas (lower index) are newer
  const estimatedDaysOld = (index / totalIdeas) * 30 // Assume 30 days max spread
  return estimatedDaysOld
}

/**
 * Cleans up old and low-quality ideas from history
 */
function cleanupIdeaHistory(preferences: UserPreferences): {
  cleanedHistory: string[]
  itemsRemoved: number
  reasons: string[]
} {
  const reasons: string[] = []
  let itemsRemoved = 0
  
  // Start with current history
  let cleanedHistory = [...preferences.ideaHistory]
  
  // Remove low-quality ideas
  const beforeLowQuality = cleanedHistory.length
  cleanedHistory = cleanedHistory.filter(idea => !isLowQualityIdea(idea))
  const lowQualityRemoved = beforeLowQuality - cleanedHistory.length
  
  if (lowQualityRemoved > 0) {
    itemsRemoved += lowQualityRemoved
    reasons.push(`Removed ${lowQualityRemoved} low-quality ideas`)
  }
  
  // Remove duplicates while preserving order (keep first occurrence)
  const beforeDuplicates = cleanedHistory.length
  const seen = new Set<string>()
  cleanedHistory = cleanedHistory.filter(idea => {
    if (seen.has(idea)) {
      return false
    }
    seen.add(idea)
    return true
  })
  const duplicatesRemoved = beforeDuplicates - cleanedHistory.length
  
  if (duplicatesRemoved > 0) {
    itemsRemoved += duplicatesRemoved
    reasons.push(`Removed ${duplicatesRemoved} duplicate ideas`)
  }
  
  // Remove old ideas (estimate age based on position)
  const beforeAge = cleanedHistory.length
  cleanedHistory = cleanedHistory.filter((idea, index) => {
    const estimatedAge = estimateIdeaAge(index, cleanedHistory.length, preferences.lastUsed)
    return estimatedAge <= CLEANUP_CONFIG.maxIdeaAge
  })
  const ageRemoved = beforeAge - cleanedHistory.length
  
  if (ageRemoved > 0) {
    itemsRemoved += ageRemoved
    reasons.push(`Removed ${ageRemoved} old ideas (estimated > ${CLEANUP_CONFIG.maxIdeaAge} days)`)
  }
  
  // Ensure we don't exceed maximum count
  if (cleanedHistory.length > CLEANUP_CONFIG.maxIdeas) {
    const excess = cleanedHistory.length - CLEANUP_CONFIG.maxIdeas
    cleanedHistory = cleanedHistory.slice(0, CLEANUP_CONFIG.maxIdeas)
    itemsRemoved += excess
    reasons.push(`Removed ${excess} excess ideas (over limit of ${CLEANUP_CONFIG.maxIdeas})`)
  }
  
  return {
    cleanedHistory,
    itemsRemoved,
    reasons
  }
}

/**
 * Checks if cleanup is needed based on various criteria
 */
function shouldPerformCleanup(preferences: UserPreferences, metadata: CleanupMetadata): {
  shouldCleanup: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const now = new Date()
  
  // Check time since last cleanup
  const timeSinceLastCleanup = now.getTime() - metadata.lastCleanup.getTime()
  if (timeSinceLastCleanup >= CLEANUP_CONFIG.cleanupInterval) {
    reasons.push('Scheduled cleanup interval reached')
  }
  
  // Check if history is over limit
  if (preferences.ideaHistory.length > CLEANUP_CONFIG.maxIdeas) {
    reasons.push(`Idea history exceeds limit (${preferences.ideaHistory.length} > ${CLEANUP_CONFIG.maxIdeas})`)
  }
  
  // Check for low-quality ideas
  const lowQualityCount = preferences.ideaHistory.filter(isLowQualityIdea).length
  if (lowQualityCount > 0) {
    reasons.push(`Found ${lowQualityCount} low-quality ideas`)
  }
  
  // Check for duplicates
  const uniqueIdeas = new Set(preferences.ideaHistory)
  if (uniqueIdeas.size < preferences.ideaHistory.length) {
    const duplicateCount = preferences.ideaHistory.length - uniqueIdeas.size
    reasons.push(`Found ${duplicateCount} duplicate ideas`)
  }
  
  // Check storage size (estimate)
  try {
    if (typeof localStorage !== 'undefined') {
      const preferencesJson = JSON.stringify(preferences)
      const storageSize = new Blob([preferencesJson]).size
      
      if (storageSize > CLEANUP_CONFIG.maxStorageSize) {
        reasons.push(`Storage size exceeds limit (${storageSize} > ${CLEANUP_CONFIG.maxStorageSize} bytes)`)
      }
    }
  } catch {
    // Ignore storage size check if it fails
  }
  
  return {
    shouldCleanup: reasons.length > 0,
    reasons
  }
}

/**
 * Performs automatic cleanup of user preferences
 */
export async function performAutomaticCleanup(): Promise<{
  success: boolean
  cleanupPerformed: boolean
  itemsRemoved: number
  reasons: string[]
  error?: Error
}> {
  try {
    // Load current preferences
    const { preferences, error: loadError } = loadPreferences()
    if (loadError && loadError.type !== 'storage_unavailable') {
      return {
        success: false,
        cleanupPerformed: false,
        itemsRemoved: 0,
        reasons: [],
        error: new Error(`Failed to load preferences: ${loadError.message}`)
      }
    }
    
    // Get cleanup metadata
    const metadata = getCleanupMetadata()
    
    // Check if cleanup is needed
    const { shouldCleanup, reasons: checkReasons } = shouldPerformCleanup(preferences, metadata)
    
    if (!shouldCleanup) {
      return {
        success: true,
        cleanupPerformed: false,
        itemsRemoved: 0,
        reasons: ['No cleanup needed']
      }
    }
    
    // Perform cleanup
    const { cleanedHistory, itemsRemoved, reasons: cleanupReasons } = cleanupIdeaHistory(preferences)
    
    // Update preferences with cleaned history
    const updatedPreferences: UserPreferences = {
      ...preferences,
      ideaHistory: cleanedHistory,
      lastUsed: new Date()
    }
    
    // Save updated preferences
    const saveResult = savePreferences(updatedPreferences)
    if (!saveResult.success) {
      return {
        success: false,
        cleanupPerformed: false,
        itemsRemoved: 0,
        reasons: checkReasons,
        error: new Error(`Failed to save cleaned preferences: ${saveResult.error?.message}`)
      }
    }
    
    // Update cleanup metadata
    const updatedMetadata: CleanupMetadata = {
      lastCleanup: new Date(),
      totalCleanupsPerformed: metadata.totalCleanupsPerformed + 1,
      itemsRemovedLastCleanup: itemsRemoved
    }
    saveCleanupMetadata(updatedMetadata)
    
    return {
      success: true,
      cleanupPerformed: true,
      itemsRemoved,
      reasons: [...checkReasons, ...cleanupReasons]
    }
  } catch (error) {
    return {
      success: false,
      cleanupPerformed: false,
      itemsRemoved: 0,
      reasons: [],
      error: error as Error
    }
  }
}

/**
 * Forces cleanup regardless of intervals or conditions
 */
export async function forceCleanup(): Promise<{
  success: boolean
  itemsRemoved: number
  reasons: string[]
  error?: Error
}> {
  try {
    // Load current preferences
    const { preferences, error: loadError } = loadPreferences()
    if (loadError && loadError.type !== 'storage_unavailable') {
      return {
        success: false,
        itemsRemoved: 0,
        reasons: [],
        error: new Error(`Failed to load preferences: ${loadError.message}`)
      }
    }
    
    // Perform cleanup
    const { cleanedHistory, itemsRemoved, reasons } = cleanupIdeaHistory(preferences)
    
    // Update preferences with cleaned history
    const updatedPreferences: UserPreferences = {
      ...preferences,
      ideaHistory: cleanedHistory,
      lastUsed: new Date()
    }
    
    // Save updated preferences
    const saveResult = savePreferences(updatedPreferences)
    if (!saveResult.success) {
      return {
        success: false,
        itemsRemoved: 0,
        reasons,
        error: new Error(`Failed to save cleaned preferences: ${saveResult.error?.message}`)
      }
    }
    
    // Update cleanup metadata
    const metadata = getCleanupMetadata()
    const updatedMetadata: CleanupMetadata = {
      lastCleanup: new Date(),
      totalCleanupsPerformed: metadata.totalCleanupsPerformed + 1,
      itemsRemovedLastCleanup: itemsRemoved
    }
    saveCleanupMetadata(updatedMetadata)
    
    return {
      success: true,
      itemsRemoved,
      reasons: reasons.length > 0 ? reasons : ['No items needed cleanup']
    }
  } catch (error) {
    return {
      success: false,
      itemsRemoved: 0,
      reasons: [],
      error: error as Error
    }
  }
}

/**
 * Gets cleanup statistics and information
 */
export function getCleanupInfo(): {
  metadata: CleanupMetadata
  nextScheduledCleanup: Date
  estimatedStorageSize: number
  canPerformCleanup: boolean
} {
  const metadata = getCleanupMetadata()
  const nextScheduledCleanup = new Date(metadata.lastCleanup.getTime() + CLEANUP_CONFIG.cleanupInterval)
  
  let estimatedStorageSize = 0
  try {
    if (typeof localStorage !== 'undefined') {
      const { preferences } = loadPreferences()
      const preferencesJson = JSON.stringify(preferences)
      estimatedStorageSize = new Blob([preferencesJson]).size
    }
  } catch {
    // Ignore if we can't estimate size
  }
  
  return {
    metadata,
    nextScheduledCleanup,
    estimatedStorageSize,
    canPerformCleanup: typeof localStorage !== 'undefined'
  }
}

/**
 * Initializes automatic cleanup (should be called on app startup)
 */
export function initializeAutomaticCleanup(): void {
  // Perform cleanup check on initialization
  performAutomaticCleanup().catch(error => {
    console.warn('Failed to perform initial cleanup:', error)
  })
  
  // Set up periodic cleanup (if in browser environment)
  if (typeof window !== 'undefined') {
    // Check for cleanup every hour
    const checkInterval = 60 * 60 * 1000 // 1 hour
    
    setInterval(() => {
      performAutomaticCleanup().catch(error => {
        console.warn('Failed to perform scheduled cleanup:', error)
      })
    }, checkInterval)
  }
}