import { YUUMI_DISCORD_SERVER_ID } from '@/lib/utils/constants';

export class DiscordAPI {
  private botToken: string;
  private baseUrl = 'https://discord.com/api/v10';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  private getHeaders(useUserToken = false, userToken?: string) {
    const token = useUserToken && userToken ? userToken : this.botToken;
    const authType = useUserToken ? 'Bearer' : 'Bot';
    
    return {
      Authorization: `${authType} ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getUser(userId: string) {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json();
  }

  async getGuildMember(userId: string, guildId = YUUMI_DISCORD_SERVER_ID) {
    const response = await fetch(`${this.baseUrl}/guilds/${guildId}/members/${userId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not in server
      }
      throw new Error(`Failed to fetch guild member: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserGuilds(userToken: string) {
    const response = await fetch(`${this.baseUrl}/users/@me/guilds`, {
      headers: this.getHeaders(true, userToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user guilds: ${response.statusText}`);
    }

    return response.json();
  }

  async getGuildRoles(guildId = YUUMI_DISCORD_SERVER_ID) {
    const response = await fetch(`${this.baseUrl}/guilds/${guildId}/roles`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guild roles: ${response.statusText}`);
    }

    return response.json();
  }

  async isUserInYuumiServer(userId: string) {
    try {
      const member = await this.getGuildMember(userId);
      return member !== null;
    } catch (error) {
      return false;
    }
  }

  static getAvatarUrl(userId: string, avatarHash: string | null, discriminator?: string) {
    if (!avatarHash) {
      // Use default avatar
      const defaultAvatarNum = discriminator 
        ? parseInt(discriminator) % 5 
        : parseInt(userId.slice(-1)) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
    }
    
    const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=256`;
  }
}