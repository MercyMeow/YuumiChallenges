/**
 * Rune image preloader utility for better performance
 * Preloads commonly used rune images to reduce loading time
 */

import { runeImages } from '@/lib/apis/datadragon';

// Common keystone rune IDs that are frequently seen
const COMMON_KEYSTONE_RUNES = [
  8112, // Electrocute
  8124, // Predator
  8128, // Dark Harvest
  8143, // Sudden Impact
  9101, // Overheal
  9103, // Legend: Bloodline
  9104, // Legend: Alacrity
  9105, // Legend: Tenacity
  9111, // Triumph
  8005, // Press the Attack
  8008, // Lethal Tempo
  8010, // Conqueror
  8021, // Fleet Footwork
  8214, // Summon Aery
  8229, // Arcane Comet
  8230, // Phase Rush
  8437, // Grasp of the Undying
  8439, // Aftershock
  8465, // Guardian
];

// Cache for preloaded images
const imageCache = new Map<string, string>();
const preloadPromises = new Map<string, Promise<string>>();

/**
 * Preload a rune image and cache it
 */
async function preloadRuneImage(iconPath: string): Promise<string> {
  if (imageCache.has(iconPath)) {
    return imageCache.get(iconPath)!;
  }

  if (preloadPromises.has(iconPath)) {
    return preloadPromises.get(iconPath)!;
  }

  const promise = runeImages
    .icon(iconPath)
    .then((url) => {
      imageCache.set(iconPath, url);
      preloadPromises.delete(iconPath);

      // Create actual image element to trigger browser preload
      const img = new Image();
      img.src = url;

      return url;
    })
    .catch((error) => {
      console.warn('Failed to preload rune image:', iconPath, error);
      preloadPromises.delete(iconPath);
      throw error;
    });

  preloadPromises.set(iconPath, promise);
  return promise;
}

/**
 * Get a cached rune image URL if available
 */
export function getCachedRuneImage(iconPath: string): string | null {
  return imageCache.get(iconPath) || null;
}

/**
 * Preload common rune images in the background
 * Should be called once when the app loads
 */
export async function preloadCommonRuneImages(
  runeData: Array<{ id: number; icon?: string }>
): Promise<void> {
  if (!Array.isArray(runeData)) return;

  const commonRunes = runeData.filter((rune) =>
    COMMON_KEYSTONE_RUNES.includes(rune.id)
  );

  // Preload in small batches to avoid overwhelming the network
  const batchSize = 5;
  for (let i = 0; i < commonRunes.length; i += batchSize) {
    const batch = commonRunes.slice(i, i + batchSize);
    const batchPromises = batch.map((rune) =>
      rune.icon
        ? preloadRuneImage(rune.icon).catch(() => null)
        : Promise.resolve(null)
    );

    await Promise.all(batchPromises);

    // Small delay between batches
    if (i + batchSize < commonRunes.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`Preloaded ${commonRunes.length} common rune images`);
}

/**
 * Enhanced rune image loader that uses cache first
 */
export async function loadRuneImageOptimized(
  iconPath: string
): Promise<string> {
  // Check cache first
  const cached = getCachedRuneImage(iconPath);
  if (cached) {
    return cached;
  }

  // Load and cache
  return preloadRuneImage(iconPath);
}

/**
 * Clear the image cache (useful for memory management)
 */
export function clearRuneImageCache(): void {
  imageCache.clear();
  preloadPromises.clear();
}
