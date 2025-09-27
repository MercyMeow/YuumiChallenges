interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MatchCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES = 100; // Maximum cache entries

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Clean up old entries if cache is getting full
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.cleanup();
    }

    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.DEFAULT_TTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries and remove oldest if over limit
   */
  private cleanup(): void {
    const now = Date.now();

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.MAX_ENTRIES) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      // Remove oldest 20% of entries
      const entriesToRemove = Math.floor(this.MAX_ENTRIES * 0.2);
      for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        if (entry) {
          this.cache.delete(entry[0]);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
      // Rough estimate of memory usage
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      approximateSizeBytes: totalSize,
      approximateSizeKB: (totalSize / 1024).toFixed(2),
    };
  }
}

// Create singleton instance
let cacheInstance: MatchCache | null = null;

export function getMatchCache(): MatchCache {
  if (!cacheInstance) {
    cacheInstance = new MatchCache();
  }
  return cacheInstance;
}

// Utility function to generate cache keys
export function generateCacheKey(type: string, ...params: string[]): string {
  return `${type}:${params.join(':')}`;
}

// Cache key types
export const CACHE_KEYS = {
  MATCH_DETAILS: 'match-details',
  MATCH_TIMELINE: 'match-timeline',
  SUMMONER_DATA: 'summoner',
  MATCH_HISTORY: 'match-history',
} as const;

// TTL configurations (in milliseconds)
export const CACHE_TTL = {
  MATCH_DETAILS: 10 * 60 * 1000, // 10 minutes - match data doesn't change
  MATCH_TIMELINE: 10 * 60 * 1000, // 10 minutes - timeline data doesn't change
  SUMMONER_DATA: 5 * 60 * 1000, // 5 minutes - summoner data might change
  MATCH_HISTORY: 2 * 60 * 1000, // 2 minutes - new matches might appear
} as const;
