import LZString from 'lz-string';

/**
 * Interface for the pitch data structure
 * This is a simplified version - extend based on your actual Pitch type
 */
export interface Pitch {
  id?: string;
  tagline?: string;
  content?: string;
  createdAt?: string | Date;
  [key: string]: any; // Allow for additional properties
}

/**
 * Compression method options
 */
export enum CompressionMethod {
  LZ_BASE64 = 'lz-base64',
  LZ_URI = 'lz-uri',
  LZ_UTF16 = 'lz-utf16',
  LZ_RAW = 'lz-raw'
}

/**
 * Configuration options for compression
 */
export interface CompressionConfig {
  method: CompressionMethod;
  optimizeForSize?: boolean;
  preProcessData?: boolean;
}

/**
 * Error thrown when URL compression or encoding fails
 */
export class CompressionError extends Error {
  constructor(message: string, public originalData?: any) {
    super(message);
    this.name = 'CompressionError';
  }
}

/**
 * Error thrown when URL length exceeds maximum allowed length
 */
export class URLTooLongError extends Error {
  constructor(public urlLength: number, public maxLength: number) {
    super(`URL length ${urlLength} exceeds maximum ${maxLength}`);
    this.name = 'URLTooLongError';
  }
}

/**
 * Service for encoding and decoding pitch data to URL-safe strings
 */
export class URLEncoderService {
  private readonly MAX_URL_LENGTH: number = 2000; // Default max URL length for most browsers
  private readonly DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
    method: CompressionMethod.LZ_URI,
    optimizeForSize: true,
    preProcessData: false
  };

  /**
   * Creates a new URLEncoderService
   * @param maxUrlLength Optional custom maximum URL length
   * @param compressionConfig Optional compression configuration
   */
  constructor(
    maxUrlLength?: number,
    private compressionConfig: CompressionConfig = {} as CompressionConfig
  ) {
    if (maxUrlLength && maxUrlLength > 0) {
      this.MAX_URL_LENGTH = maxUrlLength;
    }
    
    // Merge with default config
    this.compressionConfig = {
      ...this.DEFAULT_COMPRESSION_CONFIG,
      ...compressionConfig
    };
  }

  /**
   * Encodes pitch data to a URL-safe string using the configured compression method
   * @param pitch The pitch data to encode
   * @param config Optional compression config to override the default
   * @returns Promise resolving to the encoded string
   * @throws CompressionError if encoding fails
   */
  public async encodePitchData(
    pitch: Pitch, 
    config?: Partial<CompressionConfig>
  ): Promise<string> {
    try {
      // Apply config override if provided
      const effectiveConfig = {
        ...this.compressionConfig,
        ...config
      };
      
      // Remove any sensitive data before encoding
      const sanitizedPitch = this.sanitizePitchData(pitch);
      
      // Pre-process data if configured
      let dataToEncode = sanitizedPitch;
      if (effectiveConfig.preProcessData) {
        dataToEncode = this.preProcessData(sanitizedPitch);
      }
      
      // Convert to JSON
      const json = JSON.stringify(dataToEncode);
      
      // Compress using the selected method
      const encoded = this.compressData(json, effectiveConfig.method);
      
      if (!encoded) {
        throw new CompressionError('Failed to encode pitch data', pitch);
      }
      
      return encoded;
    } catch (error) {
      if (error instanceof CompressionError) {
        throw error;
      }
      throw new CompressionError(`Error encoding pitch data: ${(error as Error).message}`, pitch);
    }
  }

  /**
   * Decodes a URL-safe string back to pitch data
   * @param encoded The encoded string to decode
   * @param method Optional compression method used for encoding (auto-detected if not specified)
   * @returns Promise resolving to the decoded pitch data or null if decoding fails
   */
  public async decodePitchData(
    encoded: string, 
    method?: CompressionMethod
  ): Promise<Pitch | null> {
    try {
      if (!encoded) {
        return null;
      }
      
      // If method is not specified, try to auto-detect or use default
      const effectiveMethod = method || this.detectCompressionMethod(encoded) || this.compressionConfig.method;
      
      // Decompress using the appropriate method
      const json = this.decompressData(encoded, effectiveMethod);
      if (!json) {
        return null;
      }
      
      const decodedData = JSON.parse(json) as Pitch;
      
      // Post-process if needed
      if (this.compressionConfig.preProcessData) {
        return this.postProcessData(decodedData);
      }
      
      return decodedData;
    } catch (error) {
      console.error('Error decoding pitch data:', error);
      return null;
    }
  }
  
  /**
   * Compresses data using the specified compression method
   * @param data The data to compress
   * @param method The compression method to use
   * @returns The compressed string
   */
  private compressData(data: string, method: CompressionMethod): string {
    switch (method) {
      case CompressionMethod.LZ_URI:
        return LZString.compressToEncodedURIComponent(data);
      case CompressionMethod.LZ_BASE64:
        return LZString.compressToBase64(data);
      case CompressionMethod.LZ_UTF16:
        return LZString.compressToUTF16(data);
      case CompressionMethod.LZ_RAW:
        return LZString.compress(data);
      default:
        return LZString.compressToEncodedURIComponent(data);
    }
  }
  
  /**
   * Decompresses data using the specified compression method
   * @param data The compressed data
   * @param method The compression method used
   * @returns The decompressed string or null if decompression fails
   */
  private decompressData(data: string, method: CompressionMethod): string | null {
    switch (method) {
      case CompressionMethod.LZ_URI:
        return LZString.decompressFromEncodedURIComponent(data);
      case CompressionMethod.LZ_BASE64:
        return LZString.decompressFromBase64(data);
      case CompressionMethod.LZ_UTF16:
        return LZString.decompressFromUTF16(data);
      case CompressionMethod.LZ_RAW:
        return LZString.decompress(data);
      default:
        return LZString.decompressFromEncodedURIComponent(data);
    }
  }
  
  /**
   * Attempts to detect which compression method was used for the encoded string
   * @param encoded The encoded string
   * @returns The detected compression method or null if detection fails
   */
  private detectCompressionMethod(encoded: string): CompressionMethod | null {
    // Check for URI encoding characteristics (mostly alphanumeric with some special chars)
    if (/^[A-Za-z0-9\-_%.~]*$/.test(encoded)) {
      return CompressionMethod.LZ_URI;
    }
    
    // Check for Base64 encoding characteristics
    if (/^[A-Za-z0-9+/=]*$/.test(encoded)) {
      return CompressionMethod.LZ_BASE64;
    }
    
    // Check for UTF16 encoding (contains many non-ASCII characters)
    if (/[^\x00-\x7F]/.test(encoded)) {
      return CompressionMethod.LZ_UTF16;
    }
    
    // If we can't detect, return null
    return null;
  }

  /**
   * Checks if a URL is too long based on the MAX_URL_LENGTH
   * @param url The URL to check
   * @returns True if the URL is too long, false otherwise
   */
  public isURLTooLong(url: string): boolean {
    return url.length > this.MAX_URL_LENGTH;
  }

  /**
   * Validates if an encoded string will result in a URL that's too long
   * @param baseUrl The base URL (e.g., '/results')
   * @param encoded The encoded string to append
   * @returns True if the resulting URL is valid, false if it's too long
   */
  public validateURLLength(baseUrl: string, encoded: string): boolean {
    // Calculate full URL length with query parameter
    const fullUrl = `${baseUrl}?d=${encoded}`;
    return !this.isURLTooLong(fullUrl);
  }

  /**
   * Generates a short hash for the pitch data
   * Used as a fallback when the encoded URL is too long
   * @param pitch The pitch data to hash
   * @returns A short hash string
   */
  public generateShortHash(pitch: Pitch): string {
    // Create a unique string based on pitch content and timestamp
    const timestamp = pitch.createdAt || new Date().toISOString();
    const content = pitch.tagline || pitch.content || JSON.stringify(pitch);
    const uniqueStr = `${content}-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Convert to base64 and make URL-safe
    try {
      // Use btoa for browser environments
      const hash = btoa(uniqueStr)
        .slice(0, 8) // Take first 8 characters
        .replace(/[+/=]/g, ''); // Remove non-URL-safe characters
      
      return hash;
    } catch (error) {
      // Fallback for non-browser environments or if btoa fails
      const str = Buffer.from(uniqueStr).toString('base64')
        .slice(0, 8)
        .replace(/[+/=]/g, '');
      
      return str;
    }
  }

  /**
   * Removes sensitive data from pitch before encoding
   * @param pitch The pitch data to sanitize
   * @returns Sanitized pitch data
   */
  private sanitizePitchData(pitch: Pitch): Pitch {
    // Create a copy to avoid modifying the original
    const sanitized = { ...pitch };
    
    // Remove any fields that might contain sensitive information
    // This is a placeholder - customize based on your actual data model
    const sensitiveFields = ['privateNotes', 'internalComments', 'userEmail'];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    
    return sanitized;
  }

  /**
   * Pre-processes data before compression to improve compression ratio
   * @param pitch The pitch data to pre-process
   * @returns Pre-processed pitch data
   */
  private preProcessData(pitch: Pitch): any {
    // Create a copy to avoid modifying the original
    const processed = { ...pitch };
    
    // Optimization techniques:
    
    // 1. Convert dates to shorter string format
    if (processed.createdAt instanceof Date) {
      processed.createdAt = processed.createdAt.toISOString();
    }
    
    // 2. Remove null or undefined values
    Object.keys(processed).forEach(key => {
      if (processed[key] === null || processed[key] === undefined) {
        delete processed[key];
      }
    });
    
    // 3. Shorten known property names if optimizeForSize is enabled
    if (this.compressionConfig.optimizeForSize) {
      const keyMap: Record<string, string> = {
        'tagline': 't',
        'content': 'c',
        'createdAt': 'd',
        'description': 'ds',
        'features': 'f',
        'benefits': 'b',
        'marketAnalysis': 'ma',
        'financialProjections': 'fp'
      };
      
      const optimized: Record<string, any> = {};
      
      Object.keys(processed).forEach(key => {
        const shortKey = keyMap[key] || key;
        optimized[shortKey] = processed[key];
      });
      
      return optimized;
    }
    
    return processed;
  }
  
  /**
   * Post-processes data after decompression to restore original structure
   * @param data The decompressed data
   * @returns Post-processed pitch data
   */
  private postProcessData(data: any): Pitch {
    // Create a copy to avoid modifying the original
    const processed = { ...data };
    
    // Restore original property names if they were shortened
    if (this.compressionConfig.optimizeForSize) {
      const keyMap: Record<string, string> = {
        't': 'tagline',
        'c': 'content',
        'd': 'createdAt',
        'ds': 'description',
        'f': 'features',
        'b': 'benefits',
        'ma': 'marketAnalysis',
        'fp': 'financialProjections'
      };
      
      const restored: Record<string, any> = {};
      
      Object.keys(processed).forEach(key => {
        const originalKey = keyMap[key] || key;
        restored[originalKey] = processed[key];
      });
      
      return restored as Pitch;
    }
    
    // Convert date strings back to Date objects
    if (typeof processed.createdAt === 'string') {
      try {
        processed.createdAt = new Date(processed.createdAt);
      } catch (e) {
        // If date parsing fails, keep the string
      }
    }
    
    return processed as Pitch;
  }
  
  /**
   * Analyzes pitch data and recommends the optimal compression method
   * @param pitch The pitch data to analyze
   * @returns The recommended compression method
   */
  public recommendCompressionMethod(pitch: Pitch): CompressionMethod {
    const json = JSON.stringify(pitch);
    
    // For very small data, URI encoding is sufficient
    if (json.length < 500) {
      return CompressionMethod.LZ_URI;
    }
    
    // For medium-sized data with mostly text
    if (json.length < 5000) {
      return CompressionMethod.LZ_BASE64;
    }
    
    // For large data with repetitive content
    const repetitivePattern = this.detectRepetitivePatterns(json);
    if (repetitivePattern > 0.3) { // If more than 30% seems repetitive
      return CompressionMethod.LZ_UTF16; // Better for repetitive content
    }
    
    // For very large data
    return CompressionMethod.LZ_BASE64;
  }
  
  /**
   * Detects repetitive patterns in a string
   * @param str The string to analyze
   * @returns A score between 0-1 indicating repetitiveness (higher = more repetitive)
   */
  private detectRepetitivePatterns(str: string): number {
    if (!str || str.length < 10) return 0;
    
    // Simple repetition detection by sampling substrings
    const sampleSize = Math.min(100, Math.floor(str.length / 10));
    let repetitionCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const startPos = Math.floor(Math.random() * (str.length - sampleSize));
      const sample = str.substring(startPos, startPos + sampleSize);
      
      // Count occurrences of this sample in the string
      let pos = -1;
      let occurrences = 0;
      
      while ((pos = str.indexOf(sample, pos + 1)) !== -1) {
        occurrences++;
      }
      
      // If we find multiple occurrences, consider it repetitive
      if (occurrences > 1) {
        repetitionCount++;
      }
    }
    
    return repetitionCount / 10;
  }
  
  /**
   * Benchmarks different compression methods on the given data
   * @param pitch The pitch data to benchmark
   * @returns Object containing benchmark results for each method
   */
  public async benchmarkCompression(pitch: Pitch): Promise<Record<CompressionMethod, { size: number, time: number }>> {
    const json = JSON.stringify(pitch);
    const results: Record<CompressionMethod, { size: number, time: number }> = {} as any;
    
    // Test each compression method
    for (const method of Object.values(CompressionMethod)) {
      const start = performance.now();
      const compressed = this.compressData(json, method as CompressionMethod);
      const end = performance.now();
      
      results[method as CompressionMethod] = {
        size: compressed.length,
        time: end - start
      };
    }
    
    return results;
  }
}