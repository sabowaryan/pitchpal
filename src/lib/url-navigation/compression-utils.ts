import { CompressionMethod } from './url-encoder.service';

/**
 * Utility functions for compression analysis and optimization
 */

/**
 * Analyzes data to determine the best compression method
 * @param data The data to analyze
 * @returns Recommended compression method and analysis details
 */
export function analyzeDataForCompression(data: string): {
  recommendedMethod: CompressionMethod;
  dataSize: number;
  repetitiveness: number;
  entropy: number;
} {
  const dataSize = data.length;
  const repetitiveness = calculateRepetitiveness(data);
  const entropy = calculateEntropy(data);

  let recommendedMethod: CompressionMethod;

  // Decision logic based on data characteristics
  if (dataSize < 500) {
    recommendedMethod = CompressionMethod.LZ_URI;
  } else if (dataSize < 2000 && repetitiveness > 0.3) {
    recommendedMethod = CompressionMethod.LZ_UTF16;
  } else if (dataSize < 5000) {
    recommendedMethod = CompressionMethod.LZ_BASE64;
  } else {
    recommendedMethod = entropy < 0.7 ? CompressionMethod.LZ_UTF16 : CompressionMethod.LZ_BASE64;
  }

  return {
    recommendedMethod,
    dataSize,
    repetitiveness,
    entropy
  };
}

/**
 * Calculates the repetitiveness score of a string
 * @param str The string to analyze
 * @returns Score between 0-1 (higher = more repetitive)
 */
export function calculateRepetitiveness(str: string): number {
  if (!str || str.length < 10) return 0;

  const sampleSize = Math.min(50, Math.floor(str.length / 20));
  const samples = 5;
  let totalRepetition = 0;

  for (let i = 0; i < samples; i++) {
    const startPos = Math.floor(Math.random() * (str.length - sampleSize));
    const sample = str.substring(startPos, startPos + sampleSize);
    
    // Count occurrences
    const regex = new RegExp(escapeRegExp(sample), 'g');
    const matches = str.match(regex) || [];
    
    if (matches.length > 1) {
      totalRepetition += (matches.length - 1) / samples;
    }
  }

  return Math.min(totalRepetition, 1);
}

/**
 * Calculates the entropy (randomness) of a string
 * @param str The string to analyze
 * @returns Entropy value between 0-1 (higher = more random)
 */
export function calculateEntropy(str: string): number {
  if (!str) return 0;

  const charFreq: Record<string, number> = {};
  
  // Count character frequencies
  for (const char of str) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  const length = str.length;
  let entropy = 0;

  // Calculate Shannon entropy
  for (const freq of Object.values(charFreq)) {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  }

  // Normalize to 0-1 range (assuming max entropy for ASCII is ~6.64 bits)
  return Math.min(entropy / 6.64, 1);
}

/**
 * Estimates the compression ratio for different methods
 * @param dataSize Original data size
 * @param repetitiveness Repetitiveness score
 * @param entropy Entropy score
 * @returns Estimated compression ratios for each method
 */
export function estimateCompressionRatios(
  dataSize: number,
  repetitiveness: number,
  entropy: number
): Record<CompressionMethod, number> {
  // Base compression ratios (these are rough estimates)
  const baseRatios = {
    [CompressionMethod.LZ_URI]: 0.7,
    [CompressionMethod.LZ_BASE64]: 0.6,
    [CompressionMethod.LZ_UTF16]: 0.5,
    [CompressionMethod.LZ_RAW]: 0.55
  };

  // Adjust based on data characteristics
  const repetitivenessBonus = repetitiveness * 0.3; // Up to 30% better compression
  const entropyPenalty = entropy * 0.2; // Up to 20% worse compression for high entropy

  const adjustedRatios: Record<CompressionMethod, number> = {} as any;

  for (const [method, baseRatio] of Object.entries(baseRatios)) {
    let adjustedRatio = baseRatio - repetitivenessBonus + entropyPenalty;
    
    // UTF16 works better with repetitive data
    if (method === CompressionMethod.LZ_UTF16 && repetitiveness > 0.4) {
      adjustedRatio -= 0.1;
    }
    
    // URI encoding has overhead for special characters
    if (method === CompressionMethod.LZ_URI && entropy > 0.8) {
      adjustedRatio += 0.1;
    }

    adjustedRatios[method as CompressionMethod] = Math.max(0.1, Math.min(0.9, adjustedRatio));
  }

  return adjustedRatios;
}

/**
 * Validates that compressed data will fit within URL length limits
 * @param originalSize Original data size
 * @param compressionRatio Expected compression ratio
 * @param baseUrlLength Length of the base URL
 * @param maxUrlLength Maximum allowed URL length
 * @returns Whether the compressed data will fit
 */
export function validateCompressionFitsUrl(
  originalSize: number,
  compressionRatio: number,
  baseUrlLength: number = 50,
  maxUrlLength: number = 2000
): {
  willFit: boolean;
  estimatedUrlLength: number;
  availableSpace: number;
} {
  const compressedSize = Math.ceil(originalSize * compressionRatio);
  const estimatedUrlLength = baseUrlLength + compressedSize + 10; // +10 for query params
  const availableSpace = maxUrlLength - baseUrlLength - 10;

  return {
    willFit: estimatedUrlLength <= maxUrlLength,
    estimatedUrlLength,
    availableSpace
  };
}

/**
 * Optimizes data before compression by removing unnecessary whitespace and formatting
 * @param data The data to optimize
 * @returns Optimized data string
 */
export function optimizeDataForCompression(data: string): string {
  try {
    // Try to parse as JSON and minify
    const parsed = JSON.parse(data);
    return JSON.stringify(parsed);
  } catch {
    // If not JSON, apply basic optimizations
    return data
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .trim();
  }
}

/**
 * Creates a fingerprint of the data for caching purposes
 * @param data The data to fingerprint
 * @returns A short hash representing the data
 */
export function createDataFingerprint(data: string): string {
  let hash = 0;
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Escapes special regex characters in a string
 * @param str String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compression performance metrics
 */
export interface CompressionMetrics {
  method: CompressionMethod;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
}

/**
 * Benchmarks compression performance for given data
 * @param data The data to benchmark
 * @param methods Methods to test (defaults to all)
 * @returns Performance metrics for each method
 */
export async function benchmarkCompressionMethods(
  data: string,
  methods: CompressionMethod[] = Object.values(CompressionMethod)
): Promise<CompressionMetrics[]> {
  const LZString = await import('lz-string');
  const results: CompressionMetrics[] = [];
  
  for (const method of methods) {
    const startTime = performance.now();
    
    let compressed: string;
    try {
      switch (method) {
        case CompressionMethod.LZ_URI:
          compressed = LZString.compressToEncodedURIComponent(data);
          break;
        case CompressionMethod.LZ_BASE64:
          compressed = LZString.compressToBase64(data);
          break;
        case CompressionMethod.LZ_UTF16:
          compressed = LZString.compressToUTF16(data);
          break;
        case CompressionMethod.LZ_RAW:
          compressed = LZString.compress(data);
          break;
        default:
          compressed = LZString.compressToEncodedURIComponent(data);
      }
    } catch (error) {
      // If compression fails, skip this method
      continue;
    }
    
    const compressionTime = performance.now() - startTime;
    
    // Test decompression time
    const decompStartTime = performance.now();
    try {
      switch (method) {
        case CompressionMethod.LZ_URI:
          LZString.decompressFromEncodedURIComponent(compressed);
          break;
        case CompressionMethod.LZ_BASE64:
          LZString.decompressFromBase64(compressed);
          break;
        case CompressionMethod.LZ_UTF16:
          LZString.decompressFromUTF16(compressed);
          break;
        case CompressionMethod.LZ_RAW:
          LZString.decompress(compressed);
          break;
        default:
          LZString.decompressFromEncodedURIComponent(compressed);
      }
    } catch (error) {
      // If decompression fails, skip this method
      continue;
    }
    
    const decompressionTime = performance.now() - decompStartTime;
    
    results.push({
      method,
      originalSize: data.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / data.length,
      compressionTime,
      decompressionTime
    });
  }

  return results.sort((a, b) => a.compressedSize - b.compressedSize);
}

/**
 * Estimates compression time based on data size and method
 * @param dataSize Size of data to compress
 * @param method Compression method
 * @returns Estimated time in milliseconds
 */
function estimateCompressionTime(dataSize: number, method: CompressionMethod): number {
  const baseTime = dataSize / 10000; // Base: 1ms per 10KB
  
  const methodMultipliers = {
    [CompressionMethod.LZ_URI]: 1.0,
    [CompressionMethod.LZ_BASE64]: 1.2,
    [CompressionMethod.LZ_UTF16]: 1.5,
    [CompressionMethod.LZ_RAW]: 0.8
  };

  return baseTime * methodMultipliers[method];
}

/**
 * Estimates decompression time based on compressed size and method
 * @param compressedSize Size of compressed data
 * @param method Compression method used
 * @returns Estimated time in milliseconds
 */
function estimateDecompressionTime(compressedSize: number, method: CompressionMethod): number {
  const baseTime = compressedSize / 15000; // Base: 1ms per 15KB (decompression is usually faster)
  
  const methodMultipliers = {
    [CompressionMethod.LZ_URI]: 1.0,
    [CompressionMethod.LZ_BASE64]: 1.1,
    [CompressionMethod.LZ_UTF16]: 1.3,
    [CompressionMethod.LZ_RAW]: 0.9
  };

  return baseTime * methodMultipliers[method];
}