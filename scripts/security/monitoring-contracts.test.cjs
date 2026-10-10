const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const path = require('node:path');
const { createRequire } = require('node:module');
const { findContainerEngine } = require('../database/disposable-postgres.cjs');
const monitoringRequire = createRequire(path.resolve('src/monitoring/package.json'));

test('Monitoring HTTP and Redis contracts with disposable storage', { timeout: 60000 }, async (t) => {
  const engine = findContainerEngine();
  const name = `idp-monitoring-contract-${process.pid}-${randomBytes(4).toString('hex')}`;
  execFileSync(engine, ['run', '--detach', '--rm', '--name', name, '--publish', '127.0.0.1::6379',
    'docker.io/library/redis:8.8-alpine', 'redis-server', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  let redis, subscriber, server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (subscriber) await subscriber.quit();
    if (redis) await redis.quit();
    execFileSync(engine, ['rm', '--force', name], { stdio: 'ignore' });
  });
  const port = execFileSync(engine, ['port', name, '6379/tcp'], { encoding: 'utf8' }).trim().split(':').at(-1);
  const token = randomBytes(24).toString('hex');
  process.env.CACHE_REDIS_URL = `redis://127.0.0.1:${port}`;
  process.env.MONITORING_INGEST_TOKEN = token;
  process.env.MONITORING_PUBSUB_CHANNEL = `contract:${name}`;
  const store = monitoringRequire('./lib/redisStore'); redis = store.redis;
  if (redis.status !== 'ready') await once(redis, 'ready');
  // Capture the actual duplicate client only to close the production subscriber after the test.
  const duplicate = redis.duplicate;
  redis.duplicate = (...args) => { subscriber = duplicate.apply(redis, args); return subscriber; };
  const ingest = monitoringRequire('./lib/pubsubIngest').createMonitoringPubSubIngest();
  redis.duplicate = duplicate; await ingest.start();
  const express = monitoringRequire('express'); const app = express(); app.use(express.json());
  monitoringRequire('./lib/routes').registerRoutes(app);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ error: error.message }));
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (url, method = 'GET', body) => fetch(`${base}${url}`, {
    method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
  });
  const snapshot = { id: 'sample-http', createdAt: new Date().toISOString(), serverName: 'contract-server', instanceId: 'one',
    instanceName: 'Contract instance', cpuPercent: 20, memoryRssMb: 100, storageUsedPct: 10, errorRatePct: 0,
    tenantSamples: [{ tenantId: 'tenant-a', tenantHostname: 'a.example', requestCount: 5, errorCount: 1, avgLatencyMs: 10 },
      { tenantId: 'tenant-b', tenantHostname: 'b.example', requestCount: 8, errorCount: 0, avgLatencyMs: 20 }] };
  await t.test('health is public; ingest/read require token; invalid payload is rejected', async () => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/api/admin/monitoring/summary`)).status, 401);
    assert.equal((await fetch(`${base}/ingest`, { method: 'POST' })).status, 401);
    assert.equal((await request('/ingest', 'POST', {})).status, 400);
  });
  await t.test('HTTP ingest deduplicates snapshots and retains tenant filters', async () => {
    for (const url of ['/ingest', '/api/admin/monitoring/ingest']) assert.equal((await request(url, 'POST', { snapshot })).status, 200);
    assert.equal((await store.readSnapshots('contract-server::one', 20)).length, 1);
    const response = await request('/api/admin/monitoring/summary?tenantId=tenant-a'); assert.equal(response.status, 200);
    const summary = await response.json(); assert.equal(summary.tenants.length, 1);
    assert.equal(summary.tenants[0].tenantId, 'tenant-a'); assert.equal(summary.tenants[0].requestCount, 5);
    assert.equal(summary.tenants[0].errorRatePct, 20); assert.equal(summary.instances[0].instanceName, 'Contract instance');
  });
  await t.test('actual Redis publication persists a Core-shaped snapshot and ignores invalid data', async () => {
    await redis.publish(process.env.MONITORING_PUBSUB_CHANNEL, 'invalid-json');
    await redis.publish(process.env.MONITORING_PUBSUB_CHANNEL, JSON.stringify({ snapshot: { ...snapshot, id: 'sample-pubsub' } }));
    let rows;
    for (let attempt = 0; attempt < 100; attempt++) {
      rows = await store.readSnapshots('contract-server::one', 20);
      if (rows.length === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(rows.length, 2); assert.ok(rows.some((row) => row.id === 'sample-pubsub'));
  });
  await t.test('rule CRUD persists changes and rejects incompatible tenant metrics', async () => {
    const rule = { name: 'CPU contract', scope: 'global', metricKey: 'cpu_percent', threshold: 50, enabled: true };
    assert.equal((await request('/api/admin/monitoring/rules', 'POST', { ...rule, metricKey: 'tenant_request_count' })).status, 400);
    const created = await request('/api/admin/monitoring/rules', 'POST', rule); assert.equal(created.status, 201);
    const { rule: saved } = await created.json(); assert.ok(saved.id);
    const updated = await request(`/api/admin/monitoring/rules/${saved.id}`, 'PUT', { ...rule, enabled: false });
    assert.equal(updated.status, 200); assert.equal((await updated.json()).rule.enabled, false);
    const list = await (await request('/api/admin/monitoring/rules')).json(); assert.equal(list.rules.length, 1);
    assert.equal((await request(`/api/admin/monitoring/rules/${saved.id}`, 'DELETE')).status, 200);
    assert.equal((await request(`/api/admin/monitoring/rules/${saved.id}`, 'DELETE')).status, 404);
    assert.deepEqual((await (await request('/api/admin/monitoring/rules')).json()).rules, []);
  });
});
