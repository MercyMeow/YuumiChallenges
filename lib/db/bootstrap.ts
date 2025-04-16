import { ensureDatabaseSetup } from './init';
import { pingDatabase } from './mongodb';

/**
 * Bootstrap the database connection and setup
 * This function should be called when the application starts
 */
export async function bootstrapDatabase() {
  console.log('Bootstrapping database connection...');
  
  try {
    // First, check if we can connect to the database
    const pingResult = await pingDatabase();
    
    if (!pingResult) {
      console.error('Failed to connect to MongoDB. Please check your connection string and network.');
      return false;
    }
    
    console.log('Successfully connected to MongoDB');
    
    // Initialize the database (create collections and indexes)
    const setupResult = await ensureDatabaseSetup();
    
    if (!setupResult) {
      console.error('Failed to initialize database collections and indexes.');
      return false;
    }
    
    console.log('Database bootstrap completed successfully');
    return true;
  } catch (error) {
    console.error('Error bootstrapping database:', error);
    return false;
  }
}

// Export a function to run the bootstrap in development mode
export async function runDatabaseBootstrap() {
  if (process.env.NODE_ENV === 'development') {
    return bootstrapDatabase();
  }
  return true;
}
