const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const path = require('node:path');
const { findContainerEngine } = require('../database/disposable-postgres.cjs');
const agentRequire = createRequire(path.resolve('src/container-agent/package.json'));

test('Agent Redis worker retains heartbeat and correlated success/error replies', { timeout: 60000 }, async (t) => {
  const engine = findContainerEngine();
  const name = `runtessa-agent-contract-${process.pid}-${randomBytes(4).toString('hex')}`;
  execFileSync(engine, ['run', '--detach', '--rm', '--name', name, '--publish', '127.0.0.1::6379',
    'docker.io/library/redis:8.8-alpine', 'redis-server', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  let client, subscriber, worker;
  t.after(async () => {
    if (worker && worker.exitCode === null && worker.signalCode === null) {
      const exited = once(worker, 'exit'); worker.kill(); await exited;
    }
    if (subscriber) await subscriber.quit();
    if (client) await client.quit();
    execFileSync(engine, ['rm', '--force', name], { stdio: 'ignore' });
  });
  const port = execFileSync(engine, ['port', name, '6379/tcp'], { encoding: 'utf8' }).trim().split(':').at(-1);
  const url = `redis://127.0.0.1:${port}`;
  const Redis = agentRequire('ioredis'); client = new Redis(url, { protocol: 2 });
  if (client.status !== 'ready') await once(client, 'ready');
  subscriber = client.duplicate();
  if (subscriber.status !== 'ready') await once(subscriber, 'ready');
  const requestChannel = 'idp:orchestrator:requests:contract-agent';
  const replyChannel = `contract:replies:${name}`;
  const replies = new Map();
  subscriber.on('message', (_channel, raw) => { const reply = JSON.parse(raw); replies.set(reply.id, reply); });
  await subscriber.subscribe(replyChannel);
  // Run the production worker in a child so its long-lived clients are closed during cleanup.
  worker = spawn(process.execPath, ['-e', `
    const { createRedisOrchestratorWorker } = require('./src/container-agent/lib/redis-orchestrator-worker');
    const values = { CONTAINER_ORCHESTRATOR_REDIS_URL: process.env.CONTRACT_REDIS_URL,
      CONTAINER_ORCHESTRATOR_AGENT_ID: 'contract-agent', CONTAINER_ORCHESTRATOR_HEARTBEAT_INTERVAL_MS: '1000' };
    createRedisOrchestratorWorker({ pickEnv: (...names) => names.map(n => values[n]).find(Boolean),
      sanitizeSegment: value => value, handlers: { execute: async (command, payload) => {
        if (command === 'contract-denied') throw Object.assign(new Error('Contract denied'), { status: 403 });
        return { command, ...payload };
      } } }).start().then(() => process.send({ ready: true }),
        error => { process.send({ error: error.message }); process.exitCode = 1; });
  `], { cwd: process.cwd(), env: { ...process.env, CONTRACT_REDIS_URL: url },
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  const [ready] = await once(worker, 'message', { signal: AbortSignal.timeout(10000) });
  assert.equal(ready.ready, true, ready.error);
  const heartbeat = JSON.parse(await client.get('idp:orchestrator:agent:contract-agent'));
  assert.equal(heartbeat.agentId, 'contract-agent'); assert.equal(heartbeat.channel, requestChannel);
  assert.ok(await client.ttl('idp:orchestrator:agent:contract-agent') > 0);
  await client.publish(requestChannel, 'invalid-json');
  await client.publish(requestChannel, JSON.stringify({ id: 'success', command: 'contract-list',
    replyChannel, payload: { service: 'runtime' } }));
  await client.publish(requestChannel, JSON.stringify({ id: 'denied', command: 'contract-denied', replyChannel }));
  for (let attempt = 0; attempt < 100 && replies.size < 2; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(replies.size, 2);
  assert.deepEqual(replies.get('success'), { id: 'success', ok: true, statusCode: 200, error: '',
    data: { command: 'contract-list', service: 'runtime' } });
  assert.deepEqual(replies.get('denied'), { id: 'denied', ok: false, statusCode: 403,
    error: 'Contract denied', data: { error: 'Contract denied', statusCode: 403 } });
});
