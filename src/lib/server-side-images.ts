import { championImages, itemImages } from '@/lib/apis/datadragon';

export class ServerSideImageManager {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Get a proxied champion icon URL for server-side image generation
   */
  async getChampionIcon(championId: string): Promise<string> {
    try {
      const dataDragonUrl = await championImages.icon(championId);
      const proxyPath = dataDragonUrl.replace(
        'https://ddragon.leagueoflegends.com/cdn/',
        ''
      );
      return `${this.baseUrl}/api/datadragon-proxy/${proxyPath}`;
    } catch (error) {
      console.warn(`Failed to get champion icon for ${championId}:`, error);
      return this.getPlaceholderImage('champion');
    }
  }

  /**
   * Get a proxied item icon URL for server-side image generation
   */
  async getItemIcon(itemId: string): Promise<string> {
    try {
      const dataDragonUrl = await itemImages.icon(itemId);
      const proxyPath = dataDragonUrl.replace(
        'https://ddragon.leagueoflegends.com/cdn/',
        ''
      );
      return `${this.baseUrl}/api/datadragon-proxy/${proxyPath}`;
    } catch (error) {
      console.warn(`Failed to get item icon for ${itemId}:`, error);
      return this.getPlaceholderImage('item');
    }
  }

  /**
   * Get a proxied champion splash art URL for server-side image generation
   */
  async getChampionSplash(
    championId: string,
    skinNum: number = 0
  ): Promise<string> {
    try {
      const dataDragonUrl = championImages.splash(championId, skinNum);
      const proxyPath = dataDragonUrl.replace(
        'https://ddragon.leagueoflegends.com/cdn/',
        ''
      );
      return `${this.baseUrl}/api/datadragon-proxy/${proxyPath}`;
    } catch (error) {
      console.warn(`Failed to get champion splash for ${championId}:`, error);
      return this.getPlaceholderImage('splash');
    }
  }

  /**
   * Get multiple item icons efficiently
   */
  async getMultipleItemIcons(itemIds: (string | number)[]): Promise<string[]> {
    const validItemIds = itemIds
      .map((id) => String(id))
      .filter((id) => id && id !== '0');

    if (validItemIds.length === 0) {
      return [];
    }

    const promises = validItemIds.map((itemId) => this.getItemIcon(itemId));
    return Promise.all(promises);
  }

  /**
   * Get placeholder image URL for fallback cases
   */
  private getPlaceholderImage(type: 'champion' | 'item' | 'splash'): string {
    return `${this.baseUrl}/images/${type}-placeholder.png`;
  }
}

// Create a singleton instance for use across the application
export const serverSideImageManager = new ServerSideImageManager();
