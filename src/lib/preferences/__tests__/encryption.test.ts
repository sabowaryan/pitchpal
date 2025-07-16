/**
 * Tests for encryption utilities
 */

import {
  isEncryptionAvailable,
  encryptSensitiveArray,
  decryptSensitiveArray
} from '../encryption'

// Mock crypto API for testing

describe('Encryption Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isEncryptionAvailable', () => {
    it('should return true when crypto API is available', () => {
      // Create a more complete mock that satisfies the SubtleCrypto interface
      global.crypto = {
        subtle: {
          encrypt: jest.fn(),
          decrypt: jest.fn(),
          sign: jest.fn(),
          verify: jest.fn(),
          digest: jest.fn(),
          generateKey: jest.fn(),
          deriveKey: jest.fn(),
          deriveBits: jest.fn(),
          importKey: jest.fn(),
          exportKey: jest.fn(),
          wrapKey: jest.fn(),
          unwrapKey: jest.fn()
        }
      } as unknown as Crypto
      expect(isEncryptionAvailable()).toBe(true)
    })

    it('should return false when crypto API is not available', () => {
      // @ts-ignore
      global.crypto = undefined
      expect(isEncryptionAvailable()).toBe(false)
    })
  })

  // Single item encryption/decryption tests removed as these functions don't exist in the implementation

  describe('encryptSensitiveArray', () => {
    it('should encrypt all items in array', async () => {
      const testArray = ['item1', 'item2', 'item3']
      const result = await encryptSensitiveArray(testArray)

      expect(result).toHaveLength(3)
      expect(result).not.toEqual(testArray) // Should be different after encryption
    })

    it('should handle empty array', async () => {
      const result = await encryptSensitiveArray([])
      expect(result).toEqual([])
    })
  })

  describe('decryptSensitiveArray', () => {
    it('should decrypt all items in array', async () => {
      const originalArray = ['item1', 'item2', 'item3']
      const encrypted = await encryptSensitiveArray(originalArray)
      const decrypted = await decryptSensitiveArray(encrypted)

      expect(decrypted).toEqual(originalArray)
    })

    it('should handle empty array', async () => {
      const result = await decryptSensitiveArray([])
      expect(result).toEqual([])
    })
  })
})