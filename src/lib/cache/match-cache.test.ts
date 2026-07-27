import { beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS, generateCacheKey, getMatchCache } from './match-cache';

describe('MatchCache', () => {
  beforeEach(() => {
    getMatchCache().clear();
  });

  it('isolates example and live match detail entries', () => {
    const liveKey = generateCacheKey(
      CACHE_KEYS.MATCH_DETAILS,
      'live',
      'EUW1_123456'
    );
    const exampleKey = generateCacheKey(
      CACHE_KEYS.MATCH_DETAILS,
      'example',
      'EUW1_123456'
    );

    expect(liveKey).not.toBe(exampleKey);
  });

  it('coalesces duplicate misses and clears the slot after settle', async () => {
    const cache = getMatchCache();
    let requestCount = 0;
    let resolveBarrier: (() => void) | undefined;

    const barrier = new Promise<void>((resolve) => {
      resolveBarrier = resolve;
    });

    const firstPromise = cache.getOrCreateInFlight('match-key', async () => {
      requestCount += 1;
      await barrier;
      return 'shared-result';
    });
    const secondPromise = cache.getOrCreateInFlight('match-key', async () => {
      requestCount += 1;
      return 'unexpected-second-result';
    });

    expect(firstPromise).toBe(secondPromise);
    resolveBarrier?.();

    const results = await Promise.all([firstPromise, secondPromise]);
    expect(results).toEqual(['shared-result', 'shared-result']);
    expect(requestCount).toBe(1);

    const thirdResult = await cache.getOrCreateInFlight(
      'match-key',
      async () => {
        requestCount += 1;
        return 'fresh-result';
      }
    );

    expect(thirdResult).toBe('fresh-result');
    expect(requestCount).toBe(2);
  });
});
