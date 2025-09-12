import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
// Extract database name from URI if present, otherwise use default
const DB_NAME = 'perplexity-chatbot';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    if (!client) {
      console.log('Creating new MongoDB client...');
      console.log('MongoDB URI format check:', MONGODB_URI.startsWith('mongodb'));
      
      client = new MongoClient(MONGODB_URI, {
        // More reliable connection settings for serverless
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 0,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true,
        // Add these for better serverless compatibility
        maxIdleTimeMS: 30000,
        maxConnecting: 2,
      });
      
      console.log('Connecting to MongoDB...');
      await client.connect();
      
      // Test the connection
      await client.db('admin').admin().ping();
      console.log('MongoDB connection and ping successful');
    }
    
    if (!db) {
      db = client.db(DB_NAME);
      console.log(`Connected to database: ${DB_NAME}`);
      
      // Test database access
      const collections = await db.listCollections().toArray();
      console.log(`Found ${collections.length} collections in database`);
    }
    
    return { client, db };
  } catch (error: any) {
    console.error('MongoDB connection error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      codeName: error.codeName
    });
    
    // Reset client and db on error
    client = null;
    db = null;
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

export async function getDatabase() {
  try {
    if (!db || !client) {
      console.log('Database not connected, connecting now...');
      await connectToDatabase();
    }
    
    // Test the connection is still alive
    if (db && client) {
      await client.db('admin').admin().ping();
      console.log('Database connection verified');
    }
    
    return db!;
  } catch (error: any) {
    console.error('Database access error:', error.message);
    // Reset connection on error
    client = null;
    db = null;
    
    // Try to reconnect once
    try {
      console.log('Attempting to reconnect to database...');
      await connectToDatabase();
      return db!;
    } catch (reconnectError: any) {
      console.error('Database reconnection failed:', reconnectError.message);
      throw new Error(`Database connection failed: ${reconnectError.message}`);
    }
  }
}

// Graceful shutdown
export async function closeDatabase() {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('MongoDB connection closed');
    }
  } catch (error: any) {
    console.error('Error closing MongoDB connection:', error.message);
  }
}
