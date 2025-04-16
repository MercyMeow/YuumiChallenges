import { Filter, ObjectId } from 'mongodb';
import { BaseRepository } from './BaseRepository';
import { User, UserCollection, RiotAccount } from '@/models/User';

/**
 * Repository for User collection
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserCollection);
  }

  /**
   * Find a user by Discord ID
   */
  async findByDiscordId(discordId: string): Promise<User | null> {
    return this.findOne({ discordId } as Filter<User>);
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<User[]> {
    return this.find({ roles: role } as Filter<User>);
  }

  /**
   * Add a Riot account to a user
   */
  async addRiotAccount(userId: string | ObjectId, riotAccount: RiotAccount): Promise<User | null> {
    await this.initialize();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await this.collection!.findOneAndUpdate(
      { _id: objectId } as Filter<User>,
      { 
        $push: { riotAccounts: riotAccount },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Remove a Riot account from a user
   */
  async removeRiotAccount(userId: string | ObjectId, summonerId: string): Promise<User | null> {
    await this.initialize();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await this.collection!.findOneAndUpdate(
      { _id: objectId } as Filter<User>,
      { 
        $pull: { riotAccounts: { summonerId } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Update a user's roles
   */
  async updateRoles(userId: string | ObjectId, roles: string[]): Promise<User | null> {
    return this.updateById(userId, { roles, updatedAt: new Date() });
  }

  /**
   * Find users by Riot account region
   */
  async findByRiotRegion(region: string): Promise<User[]> {
    return this.find({ 'riotAccounts.region': region } as Filter<User>);
  }

  /**
   * Find a user by Riot account summoner ID
   */
  async findBySummonerId(summonerId: string): Promise<User | null> {
    return this.findOne({ 'riotAccounts.summonerId': summonerId } as Filter<User>);
  }

  /**
   * Find a user by Riot account PUUID
   */
  async findByPuuid(puuid: string): Promise<User | null> {
    return this.findOne({ 'riotAccounts.puuid': puuid } as Filter<User>);
  }

  /**
   * Verify a Riot account
   */
  async verifyRiotAccount(userId: string | ObjectId, summonerId: string): Promise<User | null> {
    await this.initialize();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await this.collection!.findOneAndUpdate(
      { 
        _id: objectId,
        'riotAccounts.summonerId': summonerId
      } as Filter<User>,
      { 
        $set: { 
          'riotAccounts.$.verified': true,
          'riotAccounts.$.verifiedAt': new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }
}
