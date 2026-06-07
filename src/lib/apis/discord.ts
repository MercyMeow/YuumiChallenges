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
    const response = await fetch(
      `${this.baseUrl}/guilds/${guildId}/members/${userId}`,
      {
        headers: this.getHeaders(),
      }
    );

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
    } catch {
      return false;
    }
  }

  async getGuild(guildId = YUUMI_DISCORD_SERVER_ID) {
    const response = await fetch(`${this.baseUrl}/guilds/${guildId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guild: ${response.statusText}`);
    }

    return response.json();
  }

  async checkUserOwnershipAndMembership(
    userId: string,
    guildId = YUUMI_DISCORD_SERVER_ID
  ) {
    try {
      // Check if user is a member
      const member = await this.getGuildMember(userId, guildId);
      if (!member) return { isMember: false, isOwner: false, roleNames: [] };

      // Get guild info to check ownership
      const guild = await this.getGuild(guildId);
      const isOwner = guild.owner_id === userId;

      // Get role names for display purposes only
      const roles = await this.getGuildRoles(guildId);
      const memberRoles = member.roles
        .map((roleId: string) =>
          roles.find(
            (role: { id: string; name: string; permissions: string }) =>
              role.id === roleId
          )
        )
        .filter(Boolean);

      return {
        isMember: true,
        isOwner,
        roleNames: memberRoles.map(
          (role: { id: string; name: string; permissions: string }) => role.name
        ),
      };
    } catch (error) {
      console.error('Error checking user ownership and membership:', error);
      return { isMember: false, isOwner: false, roleNames: [] };
    }
  }

  static getAvatarUrl(userId: string, avatarHash: string | null) {
    if (!avatarHash) {
      // Use default avatar based on user ID (since discriminator is no longer available)
      const defaultAvatarNum = parseInt(userId.slice(-1)) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
    }

    const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=256`;
  }
}
