/**
 * Test script for MongoDB connection
 * Run with: node scripts/test-db.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

async function main() {
  console.log('Testing MongoDB connection...');
  
  // Check if MongoDB URI is defined
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not defined');
    process.exit(1);
  }
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'yuumai';
  
  console.log(`Connecting to database: ${dbName}`);
  console.log(`Connection string: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials
  
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // Get database
    const db = client.db(dbName);
    
    // Ping database
    const pingResult = await db.command({ ping: 1 });
    console.log('Ping result:', pingResult);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    console.log('Database connection test completed successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

main().catch(console.error);
