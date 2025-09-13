import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('MongoDB Test: Starting connection test...');
    
    // Check if environment variable exists
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return NextResponse.json({
        success: false,
        message: 'MONGODB_URI environment variable not found',
        envVars: {
          hasMongoUri: false,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

    console.log('MongoDB Test: Environment variable found');
    console.log('MongoDB Test: Connection string starts with:', mongoUri.substring(0, 20) + '...');

    // Try to create a simple connection
    const client = new MongoClient(mongoUri, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });

    console.log('MongoDB Test: Attempting connection...');
    await client.connect();
    console.log('MongoDB Test: Connection successful!');

    // Test database access
    const dbName = process.env.NODE_ENV === 'production' ? 'aisyncs-production' : 'perplexity-chatbot-dev';
    const db = client.db(dbName);
    console.log('MongoDB Test: Accessing database:', dbName);

    // Test with a simple ping
    await db.admin().ping();
    console.log('MongoDB Test: Database ping successful!');

    // Get database name to confirm which environment we're using
    console.log('MongoDB Test: Connected to database:', db.databaseName);

    // Try to access users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('MongoDB Test: User count:', userCount);

    // Try to find one user (without sensitive data)
    const sampleUser = await usersCollection.findOne(
      {}, 
      { projection: { email: 1, username: 1, _id: 1 } }
    );

    await client.close();
    console.log('MongoDB Test: Connection closed successfully');

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      results: {
        connectionSuccessful: true,
        databaseAccessible: true,
        databaseName: dbName,
        environment: process.env.NODE_ENV,
        userCount,
        sampleUser: sampleUser ? {
          id: sampleUser._id?.toString(),
          email: sampleUser.email,
          username: sampleUser.username
        } : null
      },
      envVars: {
        hasMongoUri: true,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('MongoDB Test Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    return NextResponse.json({
      success: false,
      message: 'MongoDB connection test failed',
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      envVars: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
