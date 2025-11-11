import { Pool, PoolConfig, PoolClient } from 'pg';

// PostgreSQL connection configuration
const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  statement_timeout: 30000, // Query timeout of 30 seconds
};

// Define types for cached PostgreSQL connection
interface PostgreSQLConnection {
  pool: Pool | null;
  promise: Promise<Pool> | null;
}

// Add PostgreSQL to the global type
declare global {
  var postgresql: PostgreSQLConnection | undefined;
}

let cached: PostgreSQLConnection = global.postgresql || { pool: null, promise: null };

if (!global.postgresql) {
  global.postgresql = cached;
}

// Database connection function
async function dbConnect(): Promise<Pool> {
  // If we already have a connection pool, return immediately
  if (cached.pool) {
    return cached.pool;
  }

  // Database URL is required
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please define the DATABASE_URL environment variable inside .env.local');
  }

  // Create connection pool if we don't have one
  if (!cached.promise) {
    console.log('Attempting to connect to PostgreSQL with connection pooling...');
    
    cached.promise = new Promise(async (resolve, reject) => {
      try {
        const pool = new Pool(config);
        
        // Test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        console.log('PostgreSQL connection successful');
        
        // Handle pool errors
        pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
        });
        
        resolve(pool);
      } catch (error) {
        console.error('PostgreSQL connection failed:', error);
        reject(error);
      }
    });
  }
  
  cached.pool = await cached.promise;
  return cached.pool;
}

// Database query function
export async function query(text: string, params?: any[]) {
  const pool = await dbConnect();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  const pool = await dbConnect();
  return await pool.connect();
}

// Connection test function (for compatibility with existing code)
export async function connectToDatabase() {
  try {
    const pool = await dbConnect();
    return { pool, query };
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error(`Failed to connect to PostgreSQL database: ${error}`);
  }
}

// Graceful shutdown
export async function closeDatabase() {
  try {
    if (cached.pool) {
      await cached.pool.end();
      cached.pool = null;
      cached.promise = null;
      console.log('Database connection pool closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Export the default connection function
export default dbConnect;
