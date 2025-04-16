import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  discordId: string;
  username: string;
  email?: string;
  avatar?: string;
  discriminator?: string;
  createdAt: Date;
  updatedAt: Date;
  riotAccounts?: RiotAccount[];
  roles: string[];
}

export interface RiotAccount {
  summonerId: string;
  summonerName: string;
  region: string;
  accountId: string;
  puuid: string;
  verified: boolean;
  verifiedAt?: Date;
}

export const UserCollection = 'users';

// Helper functions for user operations
export const userHelpers = {
  // Format user data for client-side consumption (remove sensitive data)
  formatUser: (user: User): Omit<User, '_id'> & { id: string } => {
    const { _id, ...userData } = user;
    return {
      id: _id?.toString() || '',
      ...userData,
    };
  },
  
  // Create a new user object
  createUser: (discordUser: any): Omit<User, '_id'> => {
    const now = new Date();
    return {
      discordId: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
      createdAt: now,
      updatedAt: now,
      riotAccounts: [],
      roles: ['user'],
    };
  },
};
