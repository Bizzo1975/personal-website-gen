import Redis from 'ioredis';

// Redis client configuration with fallback
let redis: Redis | null = null;

try {
  // Use REDIS_URL if available, otherwise construct from host/port
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
    });
    // Set up error handler via event listener
    redis.on('error', (error) => {
      console.warn('Redis connection error:', error.message);
    });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || (process.env.NODE_ENV === 'development' ? 'localhost' : 'redis'),
      port: parseInt(process.env.REDIS_PORT || '6386'),
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
    });
    // Set up error handler via event listener
    redis.on('error', (error) => {
      console.warn('Redis connection error:', error.message);
    });
  }
} catch (error) {
  console.warn('Redis initialization failed, caching disabled:', error);
  redis = null;
}

// Cache configuration
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null;

  constructor() {
    this.redis = redis;
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null; // Cache disabled
    }
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      // If Redis fails, disable caching for this session
      this.redis = null;
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('Cache set error:', error);
      // If Redis fails, disable caching for this session
      this.redis = null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) {
      return; // Cache disabled
    }
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache pattern invalidation error:', error);
    }
  }

  // Cache key generators
  static getProjectKey(id: string): string {
    return `project:${id}`;
  }

  static getProjectsListKey(filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `projects:list:${filterStr}`;
  }

  static getPostKey(id: string): string {
    return `post:${id}`;
  }

  static getPostsListKey(filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `posts:list:${filterStr}`;
  }

  static getPageKey(slug: string): string {
    return `page:${slug}`;
  }

  static getMediaKey(id: string): string {
    return `media:${id}`;
  }

  static getMediaListKey(filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `media:list:${filterStr}`;
  }

  static getStatsKey(type: string): string {
    return `stats:${type}`;
  }
}

export default CacheService;
