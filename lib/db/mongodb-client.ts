import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
// Parse connection options from environment variables
const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50', 10);
const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10);

const options: MongoClientOptions = {
	connectTimeoutMS: 10000, // 10 seconds
	socketTimeoutMS: 45000, // 45 seconds
	maxPoolSize, // Maximum number of connections in the connection pool
	minPoolSize, // Minimum number of connections in the connection pool
	retryWrites: true, // Retry writes if they fail
	retryReads: true, // Retry reads if they fail
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Connection error handler
const handleConnectionError = (error: Error) => {
	console.error('MongoDB connection error:', error);
	process.exit(1); // Exit with failure
};

if (process.env.NODE_ENV === 'development') {
	// In development mode, use a global variable so that the value
	// is preserved across module reloads caused by HMR (Hot Module Replacement).
	let globalWithMongo = global as typeof globalThis & {
		_mongoClientPromise?: Promise<MongoClient>;
	};

	if (!globalWithMongo._mongoClientPromise) {
		client = new MongoClient(uri, options);
		globalWithMongo._mongoClientPromise = client.connect().catch(handleConnectionError);

		// Add event listeners for the client
		client.on('connectionCreated', () => console.log('MongoDB connection created'));
		client.on('connectionClosed', () => console.log('MongoDB connection closed'));
		client.on('error', (error) => console.error('MongoDB client error:', error));
	}
	clientPromise = globalWithMongo._mongoClientPromise;
} else {
	// In production mode, it's best to not use a global variable.
	client = new MongoClient(uri, options);
	clientPromise = client.connect().catch(handleConnectionError);

	// Add event listeners for the client
	client.on('connectionCreated', () => console.log('MongoDB connection created'));
	client.on('connectionClosed', () => console.log('MongoDB connection closed'));
	client.on('error', (error) => console.error('MongoDB client error:', error));
}

// Handle process termination
process.on('SIGINT', async () => {
	console.log('Closing MongoDB connection due to application termination');
	try {
		await client.close();
		console.log('MongoDB connection closed successfully');
		process.exit(0);
	} catch (error) {
		console.error('Error closing MongoDB connection:', error);
		process.exit(1);
	}
});

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
