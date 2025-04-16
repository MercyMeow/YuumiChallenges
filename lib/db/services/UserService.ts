import { ObjectId } from 'mongodb';
import { userRepository } from '../repositories';
import { User, RiotAccount, userHelpers } from '@/models/User';
import { ApiError } from '@/types';

/**
 * Service for user-related operations
 */
export class UserService {
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get user', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get a user by Discord ID
   */
  async getUserByDiscordId(discordId: string): Promise<User> {
    try {
      const user = await userRepository.findByDiscordId(discordId);
      if (!user) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get user', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, '_id'>): Promise<User> {
    try {
      // Check if user with this Discord ID already exists
      const existingUser = await userRepository.findByDiscordId(userData.discordId);
      if (existingUser) {
        throw new ApiError('User with this Discord ID already exists', 'USER_EXISTS', 409);
      }

      return await userRepository.create(userData);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create user', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await userRepository.updateById(id, userData);
      if (!updatedUser) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update user', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await userRepository.deleteById(id);
      if (!result) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete user', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Add a Riot account to a user
   */
  async addRiotAccount(userId: string, riotAccount: RiotAccount): Promise<User> {
    try {
      // Check if this Riot account is already linked to another user
      const existingUser = await userRepository.findBySummonerId(riotAccount.summonerId);
      if (existingUser && existingUser._id?.toString() !== userId) {
        throw new ApiError('This Riot account is already linked to another user', 'ACCOUNT_ALREADY_LINKED', 409);
      }

      const updatedUser = await userRepository.addRiotAccount(userId, riotAccount);
      if (!updatedUser) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to add Riot account', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Remove a Riot account from a user
   */
  async removeRiotAccount(userId: string, summonerId: string): Promise<User> {
    try {
      const updatedUser = await userRepository.removeRiotAccount(userId, summonerId);
      if (!updatedUser) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to remove Riot account', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Verify a Riot account
   */
  async verifyRiotAccount(userId: string, summonerId: string): Promise<User> {
    try {
      const updatedUser = await userRepository.verifyRiotAccount(userId, summonerId);
      if (!updatedUser) {
        throw new ApiError('User or Riot account not found', 'NOT_FOUND', 404);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to verify Riot account', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Update user roles
   */
  async updateRoles(userId: string, roles: string[]): Promise<User> {
    try {
      const updatedUser = await userRepository.updateRoles(userId, roles);
      if (!updatedUser) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update user roles', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await userRepository.findByRole(role);
    } catch (error) {
      throw new ApiError('Failed to get users by role', 'DATABASE_ERROR', 500);
    }
  }

  /**
   * Find or create a user from Discord data
   */
  async findOrCreateFromDiscord(discordUser: any): Promise<User> {
    try {
      // Try to find the user first
      let user = await userRepository.findByDiscordId(discordUser.id);
      
      // If user doesn't exist, create a new one
      if (!user) {
        const userData = userHelpers.createUser(discordUser);
        user = await userRepository.create(userData);
      }
      
      return user;
    } catch (error) {
      throw new ApiError('Failed to find or create user', 'DATABASE_ERROR', 500);
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
