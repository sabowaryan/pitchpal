/**
 * Encryption utilities for sensitive preference data
 */

/**
 * Check if encryption is available in the current environment
 */
export function isEncryptionAvailable(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto
}

/**
 * Simple base64 encoding for basic obfuscation
 * Note: This is not true encryption, just basic obfuscation for client-side storage
 */
function simpleEncode(text: string): string {
  try {
    return btoa(encodeURIComponent(text))
  } catch (error) {
    console.warn('Failed to encode text:', error)
    return text
  }
}

/**
 * Simple base64 decoding
 */
function simpleDecode(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded))
  } catch (error) {
    console.warn('Failed to decode text:', error)
    return encoded
  }
}

/**
 * Encrypt an array of sensitive strings
 * In a real implementation, this would use proper encryption
 */
export async function encryptSensitiveArray(data: string[]): Promise<string[]> {
  if (!isEncryptionAvailable()) {
    // Fallback to simple encoding if crypto is not available
    return data.map(item => simpleEncode(item))
  }

  try {
    // For now, use simple encoding
    // In production, you would implement proper encryption here
    return data.map(item => simpleEncode(item))
  } catch (error) {
    console.warn('Encryption failed, storing unencrypted:', error)
    return data
  }
}

/**
 * Decrypt an array of sensitive strings
 */
export async function decryptSensitiveArray(data: string[]): Promise<string[]> {
  if (!Array.isArray(data)) {
    return []
  }

  try {
    return data.map(item => {
      if (typeof item === 'string') {
        return simpleDecode(item)
      }
      return item
    })
  } catch (error) {
    console.warn('Decryption failed, returning as-is:', error)
    return data
  }
}