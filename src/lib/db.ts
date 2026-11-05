import { Pool, PoolConfig, PoolClient } from 'pg';

// Function to get PostgreSQL connection configuration
// This reads DATABASE_URL dynamically, not at module load time
function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // Determine if SSL should be used
  // Only use SSL for external databases (not localhost or Docker internal hostnames)
  // Docker internal connections (db:5432, localhost, 127.0.0.1) don't need SSL
  const isInternalConnection = 
    databaseUrl.includes('@db:') || 
    databaseUrl.includes('@localhost:') || 
    databaseUrl.includes('@127.0.0.1:') ||
    databaseUrl.includes('@postgres:');
  
  const useSSL = process.env.NODE_ENV === 'production' && !isInternalConnection;
  
  return {
    connectionString: databaseUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    statement_timeout: 30000, // Query timeout of 30 seconds
  };
}

// Define types for cached PostgreSQL connection
interface PostgreSQLConnection {
  pool: Pool | null;
}

// Add PostgreSQL to the global type
declare global {
  var postgresql: PostgreSQLConnection | undefined;
}

const cached: PostgreSQLConnection = global.postgresql || { pool: null };

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

  // pg opens connections when callers query. A failed connection must never
  // become a cached rejection that outlives PostgreSQL startup or recovery.
  const pool = new Pool(getPoolConfig());
  pool.on('error', (error) => console.error('Unexpected error on idle client', error));
  cached.pool = pool;
  return pool;
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
    await pool.query('SELECT 1');
    return { pool, query };
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error(`Failed to connect to PostgreSQL database: ${error}`);
  }
}

// Clear cached connection pool (useful for reconnecting with new DATABASE_URL)
export function clearConnectionCache() {
  const pool = cached.pool;
  cached.pool = null;
  if (pool) {
    pool.end().catch(() => {
      // Ignore errors when closing
    });
  }
  console.log('Database connection cache cleared');
}

// Graceful shutdown
export async function closeDatabase() {
  const pool = cached.pool;
  cached.pool = null;
  try {
    if (pool) {
      await pool.end();
      console.log('Database connection pool closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Export the default connection function
export default dbConnect;
