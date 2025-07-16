# Design Document - Amélioration de la Navigation URL

## Overview

Ce document décrit la conception d'un système d'encodage et de compression des données de pitch pour créer des URLs propres, courtes et partageables. L'approche privilégie la compression côté client avec fallback, évitant ainsi la complexité d'un stockage serveur temporaire.

## Architecture

### Approche Principale : Compression + Encodage
```
Données Pitch → Compression LZ → Encodage URL-safe → URL courte
     ↓
/results?d=N4IgdghgtgpiBcIAaIBOBTAziAXKArhAL5A
```

### Approche Fallback : Hash + LocalStorage
```
Données Pitch → Hash court → LocalStorage → URL avec hash
     ↓
/results/abc123 (données stockées localement)
```

## Components and Interfaces

### 1. URL Encoder Service
```typescript
interface URLEncoderService {
  // Encode pitch data to URL-safe string
  encodePitchData(pitch: Pitch): Promise<string>
  
  // Decode URL string back to pitch data
  decodePitchData(encoded: string): Promise<Pitch | null>
  
  // Check if URL is too long and needs fallback
  isURLTooLong(url: string): boolean
  
  // Generate short hash for fallback
  generateShortHash(pitch: Pitch): string
}
```

### 2. Navigation Service
```typescript
interface NavigationService {
  // Navigate to results with encoded data
  navigateToResults(pitch: Pitch): Promise<void>
  
  // Handle legacy URLs with query parameters
  handleLegacyURL(searchParams: URLSearchParams): Pitch | null
  
  // Create shareable URL
  createShareableURL(pitch: Pitch): Promise<string>
}
```

### 3. Storage Fallback Service
```typescript
interface StorageFallbackService {
  // Store pitch data with hash key
  storePitchData(hash: string, pitch: Pitch): void
  
  // Retrieve pitch data by hash
  retrievePitchData(hash: string): Pitch | null
  
  // Clean expired entries
  cleanExpiredEntries(): void
  
  // Check if hash exists
  hasValidHash(hash: string): boolean
}
```

## Data Models

### Encoded URL Structure
```typescript
// Option 1: Query parameter approach
// /results?d=<compressed_base64_data>

// Option 2: Path parameter approach  
// /results/<compressed_base64_data>

// Option 3: Fallback hash approach
// /results/<short_hash>
```

### Compression Strategy
```typescript
interface CompressionConfig {
  method: 'lz-string' | 'pako' | 'native'
  encoding: 'base64' | 'uri-component'
  maxURLLength: number // Default: 2000 characters
  fallbackToStorage: boolean
}
```

### Legacy Support
```typescript
interface LegacyURLHandler {
  // Detect if URL uses old format
  isLegacyURL(url: string): boolean
  
  // Convert legacy URL to new format
  convertLegacyURL(searchParams: URLSearchParams): string
  
  // Extract pitch data from legacy format
  extractLegacyData(searchParams: URLSearchParams): Pitch | null
}
```

## Implementation Strategy

### Phase 1: Core Compression System
1. **LZ-String Integration**
   ```typescript
   import LZString from 'lz-string'
   
   const encodePitch = (pitch: Pitch): string => {
     const json = JSON.stringify(pitch)
     return LZString.compressToEncodedURIComponent(json)
   }
   
   const decodePitch = (encoded: string): Pitch | null => {
     try {
       const json = LZString.decompressFromEncodedURIComponent(encoded)
       return json ? JSON.parse(json) : null
     } catch {
       return null
     }
   }
   ```

2. **URL Length Validation**
   ```typescript
   const MAX_URL_LENGTH = 2000
   
   const validateURLLength = (baseURL: string, encoded: string): boolean => {
     const fullURL = `${baseURL}?d=${encoded}`
     return fullURL.length <= MAX_URL_LENGTH
   }
   ```

### Phase 2: Fallback System
1. **Hash Generation**
   ```typescript
   const generateHash = (pitch: Pitch): string => {
     const content = `${pitch.tagline}-${pitch.createdAt}`
     return btoa(content).slice(0, 8).replace(/[+/=]/g, '')
   }
   ```

2. **LocalStorage Management**
   ```typescript
   const STORAGE_PREFIX = 'pitch_'
   const EXPIRY_HOURS = 24
   
   const storePitch = (hash: string, pitch: Pitch): void => {
     const data = {
       pitch,
       timestamp: Date.now(),
       expires: Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000)
     }
     localStorage.setItem(`${STORAGE_PREFIX}${hash}`, JSON.stringify(data))
   }
   ```

### Phase 3: Legacy Support
1. **Detection and Conversion**
   ```typescript
   const handleLegacyURL = (searchParams: URLSearchParams): Pitch | null => {
     const legacyData = searchParams.get('data')
     if (legacyData) {
       try {
         return JSON.parse(decodeURIComponent(legacyData))
       } catch {
         return null
       }
     }
     return null
   }
   ```

2. **Automatic Redirect**
   ```typescript
   const convertToNewURL = (pitch: Pitch): string => {
     const encoded = encodePitch(pitch)
     return `/results?d=${encoded}`
   }
   ```

## Error Handling

### Compression Errors
```typescript
class CompressionError extends Error {
  constructor(message: string, public originalData?: any) {
    super(message)
    this.name = 'CompressionError'
  }
}
```

### URL Length Errors
```typescript
class URLTooLongError extends Error {
  constructor(public urlLength: number, public maxLength: number) {
    super(`URL length ${urlLength} exceeds maximum ${maxLength}`)
    this.name = 'URLTooLongError'
  }
}
```

### Fallback Strategies
1. **Compression fails** → Use hash + localStorage
2. **URL too long** → Use hash + localStorage  
3. **LocalStorage full** → Show error message with download option
4. **Hash collision** → Append timestamp to hash

## Testing Strategy

### Unit Tests
- Compression/decompression accuracy
- URL length validation
- Hash generation uniqueness
- LocalStorage operations
- Legacy URL parsing

### Integration Tests
- End-to-end navigation flow
- Fallback system activation
- Legacy URL conversion
- Cross-browser compatibility

### Performance Tests
- Compression speed benchmarks
- Memory usage during large pitch processing
- LocalStorage performance with multiple entries

## Security Considerations

### Data Exposure
- URLs are visible in browser history and server logs
- Consider excluding sensitive fields from URL encoding
- Implement data sanitization before compression

### Storage Security
- LocalStorage is accessible to all scripts on domain
- Consider encryption for sensitive data in fallback storage
- Implement proper cleanup of expired entries

## Migration Strategy

### Backward Compatibility
1. **Phase 1**: Deploy new system alongside legacy support
2. **Phase 2**: Add automatic conversion of legacy URLs
3. **Phase 3**: Monitor usage and gradually deprecate legacy format
4. **Phase 4**: Remove legacy support after sufficient transition period

### User Communication
- Add subtle notification about improved URLs
- Provide migration tool for bookmarked legacy URLs
- Update documentation and help sections