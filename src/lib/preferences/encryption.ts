/**
 * Enhanced encryption utilities for sensitive preference data
 */

/**
 * Check if encryption is available in the current environment
 */
export function isEncryptionAvailable(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto
}

/**
 * Generate a cryptographic key for encryption/decryption
 */
async function generateKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )
  return key
}

/**
 * Derive a key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Get or create a master key for encryption
 */
async function getMasterKey(): Promise<CryptoKey> {
  // In a real implementation, you might:
  // 1. Derive from user password
  // 2. Use device-specific entropy
  // 3. Store key material securely
  
  // For demo purposes, derive from a fixed string + random salt
  const salt = new Uint8Array(16)
  window.crypto.getRandomValues(salt)
  
  // Store salt for later use (in real app, store securely)
  localStorage.setItem('encryption_salt', Array.from(salt).join(','))
  
  return deriveKey('default_password', salt)
}

/**
 * Encrypt text using AES-GCM
 */
async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt text using AES-GCM
 */
async function decryptText(encryptedText: string, key: CryptoKey): Promise<string> {
  try {
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    )
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.warn('Decryption failed:', error)
    throw error
  }
}

/**
 * Simple base64 encoding for basic obfuscation (fallback)
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
 * Simple base64 decoding (fallback)
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
 */
export async function encryptSensitiveArray(data: string[]): Promise<string[]> {
  if (!isEncryptionAvailable()) {
    // Fallback to simple encoding if crypto is not available
    return data.map(item => simpleEncode(item))
  }
  
  try {
    const key = await getMasterKey()
    const encrypted = await Promise.all(
      data.map(item => encryptText(item, key))
    )
    return encrypted
  } catch (error) {
    console.warn('Encryption failed, using fallback:', error)
    return data.map(item => simpleEncode(item))
  }
}

/**
 * Decrypt an array of sensitive strings
 */
export async function decryptSensitiveArray(data: string[]): Promise<string[]> {
  if (!Array.isArray(data)) {
    return []
  }
  
  if (!isEncryptionAvailable()) {
    // Fallback to simple decoding
    return data.map(item => {
      if (typeof item === 'string') {
        return simpleDecode(item)
      }
      return item
    })
  }
  
  try {
    const key = await getMasterKey()
    const decrypted = await Promise.all(
      data.map(async item => {
        if (typeof item === 'string') {
          try {
            return await decryptText(item, key)
          } catch {
            // Fallback to simple decode if real decryption fails
            return simpleDecode(item)
          }
        }
        return item
      })
    )
    return decrypted
  } catch (error) {
    console.warn('Decryption failed, using fallback:', error)
    return data.map(item => {
      if (typeof item === 'string') {
        return simpleDecode(item)
      }
      return item
    })
  }
}

/**
 * Encrypt sensitive data string
 */
export async function encryptSensitiveData(data: string): Promise<string> {
  if (!data || typeof data !== 'string') {
    return ''
  }
  
  if (!isEncryptionAvailable()) {
    return simpleEncode(data)
  }
  
  try {
    const key = await getMasterKey()
    return await encryptText(data, key)
  } catch (error) {
    console.warn('Encryption failed, using fallback:', error)
    return simpleEncode(data)
  }
}

/**
 * Decrypt sensitive data string
 */
export async function decryptSensitiveData(data: string): Promise<string> {
  if (!data || typeof data !== 'string') {
    return ''
  }
  
  if (!isEncryptionAvailable()) {
    return simpleDecode(data)
  }
  
  try {
    const key = await getMasterKey()
    return await decryptText(data, key)
  } catch (error) {
    console.warn('Decryption failed, using fallback:', error)
    return simpleDecode(data)
  }
}

/**
 * Clear encryption keys (for logout/reset)
 */
export function clearEncryptionKeys(): void {
  localStorage.removeItem('encryption_salt')
  // Clear any other key material
}

/**
 * Check if data appears to be encrypted (vs simple base64)
 */
export function isDataEncrypted(data: string): boolean {
  try {
    // Real encrypted data will be longer due to IV + encrypted content
    // Simple base64 will decode to readable text
    const decoded = atob(data)
    // Real encrypted data will be longer due to IV + encrypted content
    return decoded.length > 20 // Rough heuristic
  } catch {
    return false
  }
}