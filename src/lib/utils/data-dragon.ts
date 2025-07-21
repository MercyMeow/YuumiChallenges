/**
 * Data Dragon API utilities for League of Legends assets
 * Handles dynamic version fetching to avoid hardcoded version strings
 */

// Cache for Data Dragon version to avoid repeated API calls
let cachedVersion: string | null = null;
let versionCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches the latest Data Dragon version via our internal API (avoids CORS issues)
 * Caches the result to avoid repeated API calls
 */
export async function getLatestDataDragonVersion(): Promise<string> {
  const now = Date.now();
  
  // Return cached version if it's still valid
  if (cachedVersion && (now - versionCacheTime) < CACHE_DURATION) {
    return cachedVersion;
  }
  
  try {
    // Use our internal API route to avoid CORS issues with Data Dragon API
    const response = await fetch('/api/data-dragon/version', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Data Dragon version: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.version) {
      throw new Error('Invalid response format from version API');
    }
    
    const latestVersion = data.version;
    
    // Update cache only if we got a fresh version (not from server cache)
    if (!data.cached || !cachedVersion) {
      cachedVersion = latestVersion;
      versionCacheTime = now;
    }
    
    return latestVersion;
  } catch (error) {
    console.error('Error fetching Data Dragon version:', error);
    
    // Fallback to a reasonable default if API fails
    // This should be updated occasionally but serves as emergency fallback
    const fallbackVersion = '15.14.1';
    
    if (!cachedVersion) {
      console.warn(`Using fallback Data Dragon version: ${fallbackVersion}`);
      return fallbackVersion;
    }
    
    // Return cached version even if expired if API call fails
    console.warn('Using cached Data Dragon version due to API failure');
    return cachedVersion;
  }
}

/**
 * Generates the URL for a profile icon using the latest Data Dragon version
 * @param iconId - The profile icon ID from Riot API
 */
export async function getProfileIconUrl(iconId: number): Promise<string> {
  const version = await getLatestDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}

/**
 * Generates the URL for a champion square image using the latest Data Dragon version
 * @param championKey - The champion key (e.g., 'Aatrox', 'Ahri')
 */
export async function getChampionImageUrl(championKey: string): Promise<string> {
  const version = await getLatestDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`;
}

/**
 * Generates the URL for an item image using the latest Data Dragon version
 * @param itemId - The item ID
 */
export async function getItemImageUrl(itemId: number): Promise<string> {
  const version = await getLatestDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

/**
 * Generates the URL for a summoner spell image using the latest Data Dragon version  
 * @param spellKey - The summoner spell key (e.g., 'Flash', 'Ignite')
 */
export async function getSummonerSpellImageUrl(spellKey: string): Promise<string> {
  const version = await getLatestDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/Summoner${spellKey}.png`;
}

/**
 * Clear the cached Data Dragon version (useful for testing or forcing refresh)
 */
export function clearDataDragonCache(): void {
  cachedVersion = null;
  versionCacheTime = 0;
}