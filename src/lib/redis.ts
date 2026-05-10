import Redis from "ioredis";
import { logger } from "./logger";

const redisUrl = process.env.REDIS_URL;

// Only create Redis client if REDIS_URL is set
export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    })
  : null;

if (redis) {
  redis.on("connect", () => {
    logger.info("Redis connected successfully");
  });

  redis.on("error", (err: Error) => {
    logger.error("Redis connection error:", err.message);
  });
}

export const cacheGet = async (key: string): Promise<string | null> => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    logger.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds: number = 300
): Promise<void> => {
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (error) {
    logger.error(`Cache SET error for key ${key}:`, error);
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Cache DEL error for key ${key}:`, error);
  }
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error(`Cache DEL pattern error for ${pattern}:`, error);
  }
};

export default redis;
