import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'perplexity-chatbot';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
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
