import { connectToDatabase } from './mongodb';
import { UserCollection } from '@/models/User';
import { ChallengeCollection, ChallengeSubmissionCollection } from '@/models/Challenge';
import { MatchCollection } from '@/models/Match';

/**
 * Initialize the database with required collections and indexes
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    const { db } = await connectToDatabase();

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // User collection
    if (!collectionNames.includes(UserCollection)) {
      console.log(`Creating ${UserCollection} collection...`);
      await db.createCollection(UserCollection);
    }

    // Challenge collection
    if (!collectionNames.includes(ChallengeCollection)) {
      console.log(`Creating ${ChallengeCollection} collection...`);
      await db.createCollection(ChallengeCollection);
    }

    // Challenge submission collection
    if (!collectionNames.includes(ChallengeSubmissionCollection)) {
      console.log(`Creating ${ChallengeSubmissionCollection} collection...`);
      await db.createCollection(ChallengeSubmissionCollection);
    }

    // Match collection
    if (!collectionNames.includes(MatchCollection)) {
      console.log(`Creating ${MatchCollection} collection...`);
      await db.createCollection(MatchCollection);
    }

    // Create indexes
    console.log('Creating indexes...');

    // User indexes
    await db.collection(UserCollection).createIndex({ discordId: 1 }, { unique: true });
    await db.collection(UserCollection).createIndex({ 'riotAccounts.summonerId': 1 });
    await db.collection(UserCollection).createIndex({ 'riotAccounts.puuid': 1 });
    await db.collection(UserCollection).createIndex({ roles: 1 });

    // Challenge indexes
    await db.collection(ChallengeCollection).createIndex({ title: 1 });
    await db.collection(ChallengeCollection).createIndex({ difficulty: 1 });
    await db.collection(ChallengeCollection).createIndex({ isActive: 1 });
    await db.collection(ChallengeCollection).createIndex({ tags: 1 });
    await db.collection(ChallengeCollection).createIndex({ createdBy: 1 });

    // Challenge submission indexes
    await db.collection(ChallengeSubmissionCollection).createIndex({ challengeId: 1 });
    await db.collection(ChallengeSubmissionCollection).createIndex({ userId: 1 });
    await db.collection(ChallengeSubmissionCollection).createIndex({ status: 1 });
    await db.collection(ChallengeSubmissionCollection).createIndex({ 
      challengeId: 1, 
      userId: 1 
    }, { unique: true });

    // Match indexes
    await db.collection(MatchCollection).createIndex({ matchId: 1 }, { unique: true });
    await db.collection(MatchCollection).createIndex({ 'participants.puuid': 1 });
    await db.collection(MatchCollection).createIndex({ 'participants.championId': 1 });
    await db.collection(MatchCollection).createIndex({ gameMode: 1 });
    await db.collection(MatchCollection).createIndex({ platformId: 1 });
    await db.collection(MatchCollection).createIndex({ gameCreation: -1 });

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export a function to run the initialization
export async function ensureDatabaseSetup() {
  try {
    await initializeDatabase();
    return true;
  } catch (error) {
    console.error('Failed to set up database:', error);
    return false;
  }
}
