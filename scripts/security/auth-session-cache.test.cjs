const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const path = require('node:path');

const authRequire = createRequire(path.resolve('src/auth/package.json'));

test('Auth Redis session cache preserves identity, idle TTL and both eviction keys', { timeout: 60000 }, async (t) => {
  const name = `runtessa-auth-cache-${process.pid}-${randomBytes(4).toString('hex')}`;
  let client, cache;
  t.after(async () => {
    if (cache) await cache.closeSessionCache();
    if (client) { await client.del(`${name}:token:contract-hash`, `${name}:rand:contract-session`); await client.quit(); }
  });
  process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  process.env.AUTH_SESSION_REDIS_PREFIX = name;
  const Redis = authRequire('ioredis');
  client = new Redis(process.env.REDIS_URL);
  if (client.status !== 'ready') await once(client, 'ready');
  cache = authRequire('./dist/lib/session-cache');
  const now = new Date();
  const session = { id: 'contract-id', randId: 'contract-session', sessionTokenHash: 'contract-hash',
    userRandId: 'contract-user', tenantRandId: 'contract-tenant', csrfToken: 'contract-csrf',
    ipAddress: null, userAgent: null, expiresAt: new Date(now.getTime() + 120000),
    idleExpiresAt: new Date(now.getTime() + 30000), lastSeenAt: now, revokedAt: null, createdAt: now };
  const tokenKey = `${name}:token:${session.sessionTokenHash}`;
  const randKey = `${name}:rand:${session.randId}`;
  await cache.cacheSession(session);
  const restored = await cache.getCachedSessionByTokenHash(session.sessionTokenHash);
  assert.ok(restored);
  for (const key of Object.keys(session)) assert.deepEqual(restored[key], session[key], key);
  assert.equal(await client.get(tokenKey), await client.get(randKey));
  for (const key of [tokenKey, randKey]) {
    const ttl = await client.ttl(key);
    assert.ok(ttl > 0 && ttl <= 30, `idle expiry controls ${key}`);
  }
  await cache.evictSessionByTokenHash(session.sessionTokenHash);
  assert.equal(await client.exists(tokenKey, randKey), 0);
  assert.equal(await cache.getCachedSessionByTokenHash(session.sessionTokenHash), null);
  await cache.cacheSession(session);
  await cache.evictSessionByRandId(session.randId);
  assert.equal(await client.exists(tokenKey, randKey), 0);
});
