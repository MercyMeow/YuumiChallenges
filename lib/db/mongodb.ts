import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import clientPromise from './mongodb-client';

if (!process.env.MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'yuumai';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to the MongoDB database
 * Uses a cached connection if available
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
	try {
		// If we already have a connection, use it
		if (cachedClient && cachedDb) {
			return { client: cachedClient, db: cachedDb };
		}

		// If no connection exists, use the client promise
		const client = await clientPromise;
		const db = client.db(dbName);

		// Cache the connection
		cachedClient = client;
		cachedDb = db;

		return { client, db };
	} catch (error) {
		console.error('Error connecting to database:', error);
		throw new Error(`Unable to connect to MongoDB: ${error.message}`);
	}
}

/**
 * Helper function to close the connection (useful for testing)
 */
export async function closeDatabase(): Promise<void> {
	try {
		if (cachedClient) {
			await cachedClient.close();
			cachedClient = null;
			cachedDb = null;
			console.log('Database connection closed successfully');
		}
	} catch (error) {
		console.error('Error closing database connection:', error);
		throw error;
	}
}

/**
 * Get the database instance
 * Useful for direct database operations
 */
export async function getDatabase(): Promise<Db> {
	const { db } = await connectToDatabase();
	return db;
}

/**
 * Ping the database to check connection
 */
export async function pingDatabase(): Promise<boolean> {
	try {
		const { db } = await connectToDatabase();
		await db.command({ ping: 1 });
		return true;
	} catch (error) {
		console.error('Database ping failed:', error);
		return false;
	}
}
