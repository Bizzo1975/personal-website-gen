import mongoose from 'mongoose';

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DB_NAME = process.env.DB_NAME || 'personal_website';

// Define types for cached mongoose connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  mockMode: boolean;
}

// Add mongoose to the global type
declare global {
  var mongoose: MongooseConnection | undefined;
}

let cached: MongooseConnection = global.mongoose || { conn: null, promise: null, mockMode: false };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // If we already have a connection, return it
  if (cached.conn) {
    return cached.conn;
  }

  // Check if we're in mock mode (no MongoDB URI in development)
  if (!MONGODB_URI) {
    if (IS_DEVELOPMENT) {
      console.log('🔶 Development mode detected with no MongoDB URI - using mock data mode');
      cached.mockMode = true;
      // Return a mock mongoose instance
      cached.conn = mongoose;
      return cached.conn;
    } else {
      // In production, we should have a MongoDB URI
      throw new Error('MongoDB URI is required in production. Please define the MONGODB_URI environment variable inside .env.local');
    }
  }

  // Connect to MongoDB if we have a URI and aren't connected yet
  if (!cached.promise) {
    // Enhanced MongoDB connection options with proper pooling
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME,
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections to maintain in the pool
      maxIdleTimeMS: 45000, // How long a connection can be idle before being closed
      socketTimeoutMS: 30000, // How long to wait for socket operations
      connectTimeoutMS: 10000, // How long to wait for an initial connection
      // Heartbeat to keep connections alive 
      heartbeatFrequencyMS: 10000,
      // Auto reconnect settings
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      retryWrites: true,
      retryReads: true
    };

    console.log('Attempting to connect to MongoDB with connection pooling...');
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connection successful');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        if (IS_DEVELOPMENT) {
          console.log('🔶 Falling back to mock data mode due to connection error');
          cached.mockMode = true;
          return mongoose;
        }
        throw error;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', error);
    if (IS_DEVELOPMENT) {
      console.log('🔶 Falling back to mock data mode due to connection error');
      cached.mockMode = true;
      cached.conn = mongoose;
      return cached.conn;
    }
    throw error;
  }
}

// Helper function to check if we're using mock data
export function isMockMode() {
  return cached.mockMode || !MONGODB_URI;
}

export default dbConnect;
