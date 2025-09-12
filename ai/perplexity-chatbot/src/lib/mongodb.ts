import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'perplexity-chatbot';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      // Connection timeout settings
      connectTimeoutMS: 10000, // 10 seconds
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      // Retry settings
      retryWrites: true,
      retryReads: true,
    });
    
    // Add timeout for the connection attempt
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Connected to MongoDB with optimized settings');
  }
  
  if (!db) {
    db = client.db(DB_NAME);
  }
  
  return { client, db };
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}
