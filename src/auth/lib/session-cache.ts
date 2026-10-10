import Redis from 'ioredis';
import { AuthSessionEntity } from './typeorm/entities';
import { authErrorDiagnostics } from './error-diagnostics';

type CachedSession = {
  id: string;
  randId: string;
  sessionTokenHash: string;
  userRandId: string;
  tenantRandId: string | null;
  csrfToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAtMs: number;
  idleExpiresAtMs: number;
  lastSeenAtMs: number;
  revokedAtMs: number | null;
  createdAtMs: number;
};

const redisUrl = (process.env.REDIS_URL || '').trim();
const sessionPrefix = (process.env.AUTH_SESSION_REDIS_PREFIX || 'auth:session').trim();

const tokenKey = (tokenHash: string): string => `${sessionPrefix}:token:${tokenHash}`;
const randKey = (sessionRandId: string): string => `${sessionPrefix}:rand:${sessionRandId}`;

let redisClient: Redis | null = null;
let redisDisabled = !redisUrl;
let warned = false;

const warnRedis = (error: unknown) => {
  if (warned || redisDisabled) return;
  warned = true;
  console.warn('[auth-service] redis session cache disabled', authErrorDiagnostics(error));
};

const getRedis = async (): Promise<Redis | null> => {
  if (redisDisabled) return null;
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });
    redisClient.on('error', (error) => warnRedis(error));
  }
  if (redisClient.status === 'wait') {
    try {
      await redisClient.connect();
    } catch (error) {
      warnRedis(error);
      redisDisabled = true;
      await redisClient.quit().catch(() => undefined);
      redisClient = null;
      return null;
    }
  }
  return redisClient;
};

const toCachedSession = (session: AuthSessionEntity): CachedSession => ({
  id: session.id,
  randId: session.randId,
  sessionTokenHash: session.sessionTokenHash,
  userRandId: session.userRandId,
  tenantRandId: session.tenantRandId ?? null,
  csrfToken: session.csrfToken,
  ipAddress: session.ipAddress ?? null,
  userAgent: session.userAgent ?? null,
  expiresAtMs: session.expiresAt.getTime(),
  idleExpiresAtMs: session.idleExpiresAt.getTime(),
  lastSeenAtMs: session.lastSeenAt.getTime(),
  revokedAtMs: session.revokedAt ? session.revokedAt.getTime() : null,
  createdAtMs: session.createdAt.getTime(),
});

const fromCachedSession = (cached: CachedSession): AuthSessionEntity => {
  const session = new AuthSessionEntity();
  session.id = cached.id;
  session.randId = cached.randId;
  session.sessionTokenHash = cached.sessionTokenHash;
  session.userRandId = cached.userRandId;
  session.tenantRandId = cached.tenantRandId;
  session.csrfToken = cached.csrfToken;
  session.ipAddress = cached.ipAddress;
  session.userAgent = cached.userAgent;
  session.expiresAt = new Date(cached.expiresAtMs);
  session.idleExpiresAt = new Date(cached.idleExpiresAtMs);
  session.lastSeenAt = new Date(cached.lastSeenAtMs);
  session.revokedAt = cached.revokedAtMs ? new Date(cached.revokedAtMs) : null;
  session.createdAt = new Date(cached.createdAtMs);
  return session;
};

const getTtlSec = (cached: CachedSession): number => {
  const limit = Math.min(cached.expiresAtMs, cached.idleExpiresAtMs);
  const ttlMs = limit - Date.now();
  return ttlMs > 0 ? Math.ceil(ttlMs / 1000) : 1;
};

export const cacheSession = async (session: AuthSessionEntity): Promise<void> => {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const cached = toCachedSession(session);
    const ttlSec = getTtlSec(cached);
    const payload = JSON.stringify(cached);
    await redis
      .multi()
      .set(tokenKey(cached.sessionTokenHash), payload, 'EX', ttlSec)
      .set(randKey(cached.randId), payload, 'EX', ttlSec)
      .exec();
  } catch (error) {
    warnRedis(error);
  }
};

export const getCachedSessionByTokenHash = async (
  sessionTokenHash: string
): Promise<AuthSessionEntity | null> => {
  const redis = await getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(tokenKey(sessionTokenHash));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedSession;
    return fromCachedSession(cached);
  } catch (error) {
    warnRedis(error);
    return null;
  }
};

export const evictSessionByTokenHash = async (sessionTokenHash: string): Promise<void> => {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const raw = await redis.get(tokenKey(sessionTokenHash));
    if (!raw) {
      await redis.del(tokenKey(sessionTokenHash));
      return;
    }
    const cached = JSON.parse(raw) as CachedSession;
    await redis.del(tokenKey(sessionTokenHash), randKey(cached.randId));
  } catch (error) {
    warnRedis(error);
  }
};

export const evictSessionByRandId = async (sessionRandId: string): Promise<void> => {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const raw = await redis.get(randKey(sessionRandId));
    if (!raw) {
      await redis.del(randKey(sessionRandId));
      return;
    }
    const cached = JSON.parse(raw) as CachedSession;
    await redis.del(randKey(sessionRandId), tokenKey(cached.sessionTokenHash));
  } catch (error) {
    warnRedis(error);
  }
};

export const closeSessionCache = async (): Promise<void> => {
  if (!redisClient) return;
  await redisClient.quit().catch(() => undefined);
  redisClient = null;
};
