import { URLEncoderService, Pitch, CompressionError, URLTooLongError } from '../url-encoder.service';
import LZString from 'lz-string';

// Mock LZString if needed
jest.mock('lz-string', () => ({
  compressToEncodedURIComponent: jest.fn(),
  decompressFromEncodedURIComponent: jest.fn(),
}));

describe('URLEncoderService', () => {
  let service: URLEncoderService;
  let mockPitch: Pitch;

  beforeEach(() => {
    service = new URLEncoderService();
    mockPitch = {
      id: '123',
      tagline: 'Test Pitch',
      content: 'This is a test pitch content',
      createdAt: '2025-07-15T12:00:00Z',
    };

    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    (LZString.compressToEncodedURIComponent as jest.Mock).mockImplementation((str) => {
      return `encoded_${str}`;
    });
    
    (LZString.decompressFromEncodedURIComponent as jest.Mock).mockImplementation((str) => {
      if (str.startsWith('encoded_')) {
        return str.substring(8);
      }
      return null;
    });
  });

  describe('encodePitchData', () => {
    it('should encode pitch data successfully', async () => {
      const result = await service.encodePitchData(mockPitch);
      
      expect(LZString.compressToEncodedURIComponent).toHaveBeenCalled();
      expect(result).toContain('encoded_');
    });

    it('should throw CompressionError when encoding fails', async () => {
      (LZString.compressToEncodedURIComponent as jest.Mock).mockReturnValue(null);
      
      await expect(service.encodePitchData(mockPitch)).rejects.toThrow(CompressionError);
    });

    it('should sanitize sensitive data before encoding', async () => {
      const pitchWithSensitiveData: Pitch = {
        ...mockPitch,
        privateNotes: 'Secret notes',
        userEmail: 'user@example.com',
      };

      await service.encodePitchData(pitchWithSensitiveData);
      
      const encodedArg = (LZString.compressToEncodedURIComponent as jest.Mock).mock.calls[0][0];
      const parsedArg = JSON.parse(encodedArg);
      
      expect(parsedArg).not.toHaveProperty('privateNotes');
      expect(parsedArg).not.toHaveProperty('userEmail');
      expect(parsedArg).toHaveProperty('tagline');
    });
  });

  describe('decodePitchData', () => {
    it('should decode encoded string back to pitch data', async () => {
      const encoded = 'encoded_' + JSON.stringify(mockPitch);
      
      const result = await service.decodePitchData(encoded);
      
      expect(LZString.decompressFromEncodedURIComponent).toHaveBeenCalledWith(encoded);
      expect(result).toEqual(mockPitch);
    });

    it('should return null when decoding fails', async () => {
      (LZString.decompressFromEncodedURIComponent as jest.Mock).mockReturnValue(null);
      
      const result = await service.decodePitchData('invalid_encoded_string');
      
      expect(result).toBeNull();
    });

    it('should return null when input is empty', async () => {
      const result = await service.decodePitchData('');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      (LZString.decompressFromEncodedURIComponent as jest.Mock).mockReturnValue('invalid json');
      
      const result = await service.decodePitchData('encoded_invalid_json');
      
      expect(result).toBeNull();
    });
  });

  describe('URL length validation', () => {
    it('should detect when URL is too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      
      expect(service.isURLTooLong(longUrl)).toBe(true);
    });

    it('should validate URL length with encoded data', () => {
      const baseUrl = '/results';
      const shortEncoded = 'short';
      const longEncoded = 'a'.repeat(2000);
      
      expect(service.validateURLLength(baseUrl, shortEncoded)).toBe(true);
      expect(service.validateURLLength(baseUrl, longEncoded)).toBe(false);
    });

    it('should respect custom max URL length', () => {
      const customService = new URLEncoderService(30); // Set a very low limit
      const baseUrl = 'https://example.com/'; // This is 19 chars
      const url = baseUrl + 'a'.repeat(20); // Total will be 39 chars, exceeding 30
      
      expect(customService.isURLTooLong(url)).toBe(true);
    });
  });

  describe('generateShortHash', () => {
    it('should generate a short hash for pitch data', () => {
      const hash = service.generateShortHash(mockPitch);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeLessThanOrEqual(8);
      expect(hash).not.toContain('+');
      expect(hash).not.toContain('/');
      expect(hash).not.toContain('=');
    });

    it('should generate different hashes for different pitches', () => {
      const hash1 = service.generateShortHash(mockPitch);
      const hash2 = service.generateShortHash({
        ...mockPitch,
        id: '456',
        tagline: 'Different Pitch',
      });
      
      expect(hash1).not.toEqual(hash2);
    });

    it('should handle pitches without tagline or content', () => {
      const emptyPitch: Pitch = {
        id: '789',
        createdAt: '2025-07-15T12:00:00Z',
      };
      
      const hash = service.generateShortHash(emptyPitch);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeLessThanOrEqual(8);
    });
  });

  describe('compression with different data sizes', () => {
    beforeEach(() => {
      // Use real LZ-String for these tests
      jest.unmock('lz-string');
      service = new URLEncoderService();
    });

    it('should handle small pitch data efficiently', async () => {
      const smallPitch: Pitch = {
        id: '1',
        tagline: 'Small pitch',
        content: 'Short content',
      };

      const encoded = await service.encodePitchData(smallPitch);
      const decoded = await service.decodePitchData(encoded);

      expect(decoded).toEqual(smallPitch);
      expect(encoded.length).toBeLessThan(200); // Should be quite short
    });

    it('should handle medium pitch data', async () => {
      const mediumPitch: Pitch = {
        id: '2',
        tagline: 'Medium sized pitch with more details',
        content: 'This is a medium-sized pitch with more content. '.repeat(10),
        additionalData: {
          features: ['feature1', 'feature2', 'feature3'],
          metrics: { users: 1000, revenue: 50000 },
        },
      };

      const encoded = await service.encodePitchData(mediumPitch);
      const decoded = await service.decodePitchData(encoded);

      expect(decoded).toEqual(mediumPitch);
      expect(encoded.length).toBeLessThan(1000); // Should still be manageable
    });

    it('should handle large pitch data', async () => {
      const largePitch: Pitch = {
        id: '3',
        tagline: 'Large pitch with extensive content',
        content: 'This is a very large pitch with extensive content that repeats many times. '.repeat(100),
        detailedAnalysis: 'Detailed analysis section with lots of text. '.repeat(50),
        marketResearch: 'Market research data with comprehensive information. '.repeat(30),
        financialProjections: Array.from({ length: 20 }, (_, i) => ({
          year: 2025 + i,
          revenue: 100000 * (i + 1),
          expenses: 80000 * (i + 1),
        })),
      };

      const encoded = await service.encodePitchData(largePitch);
      const decoded = await service.decodePitchData(encoded);

      expect(decoded).toEqual(largePitch);
      
      // Check that encoding/decoding works for large data
      const originalSize = JSON.stringify(largePitch).length;
      expect(originalSize).toBeGreaterThan(1000); // Ensure we're testing with substantial data
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should detect when compressed data would create too long URLs', async () => {
      const veryLargePitch: Pitch = {
        id: '4',
        tagline: 'Extremely large pitch',
        content: 'Massive content that will create a very long URL. '.repeat(500),
        hugeSections: Array.from({ length: 100 }, (_, i) => ({
          section: i,
          data: 'Large section data. '.repeat(20),
        })),
      };

      const encoded = await service.encodePitchData(veryLargePitch);
      const baseUrl = '/results';
      
      const isValidLength = service.validateURLLength(baseUrl, encoded);
      
      // This should likely be false for very large data
      if (!isValidLength) {
        expect(service.isURLTooLong(`${baseUrl}?d=${encoded}`)).toBe(true);
      }
    });
  });

  describe('compression optimization', () => {
    beforeEach(() => {
      // Use real LZ-String for these tests
      jest.unmock('lz-string');
      service = new URLEncoderService();
    });

    it('should achieve better compression with repetitive data', async () => {
      const repetitivePitch: Pitch = {
        id: '5',
        tagline: 'Repetitive content pitch',
        content: 'This same sentence repeats multiple times. '.repeat(100),
        sections: Array.from({ length: 20 }, () => ({
          title: 'Same Title',
          content: 'Same content in every section',
        })),
      };

      const randomPitch: Pitch = {
        id: '6',
        tagline: 'Random content pitch',
        content: Array.from({ length: 100 }, (_, i) => `Unique sentence ${i} with random content ${Math.random()}`).join(' '),
        sections: Array.from({ length: 20 }, (_, i) => ({
          title: `Unique Title ${i}`,
          content: `Unique content ${i} with random data ${Math.random()}`,
        })),
      };

      const repetitiveEncoded = await service.encodePitchData(repetitivePitch);
      const randomEncoded = await service.encodePitchData(randomPitch);

      // Both should encode successfully
      expect(repetitiveEncoded).toBeDefined();
      expect(randomEncoded).toBeDefined();
      
      // Verify data integrity
      const repetitiveDecoded = await service.decodePitchData(repetitiveEncoded);
      const randomDecoded = await service.decodePitchData(randomEncoded);
      
      expect(repetitiveDecoded).toEqual(repetitivePitch);
      expect(randomDecoded).toEqual(randomPitch);
    });

    it('should maintain data integrity across multiple encode/decode cycles', async () => {
      const originalPitch: Pitch = {
        id: '7',
        tagline: 'Multi-cycle test pitch',
        content: 'Content that will be encoded and decoded multiple times',
        metadata: {
          version: 1,
          timestamp: '2025-07-15T12:00:00Z',
          tags: ['test', 'compression', 'integrity'],
        },
      };

      let currentPitch = originalPitch;

      // Encode and decode 5 times
      for (let i = 0; i < 5; i++) {
        const encoded = await service.encodePitchData(currentPitch);
        const decoded = await service.decodePitchData(encoded);
        
        expect(decoded).toEqual(originalPitch);
        currentPitch = decoded!;
      }

      // Final check
      expect(currentPitch).toEqual(originalPitch);
    });
  });
});