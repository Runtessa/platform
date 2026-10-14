const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { load } = require('../../src/ideNew/tests/security-harness.cjs');
const { fetchCodexGateway } = load('src/lib/assistant/gateway-fetch.ts', { 'node:crypto': crypto });
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'runtessa-gateway-auth-'));
const secret = crypto.randomBytes(32).toString('hex');
const cli = path.join(directory, 'cli.cjs');
fs.writeFileSync(cli, `#!/usr/bin/env node
if (process.argv.includes('environment')) {
 console.log(JSON.stringify({profile:process.env.CODEX_HOME,transport:Boolean(process.env.PATH),
  leaked:['ASSISTANT_GATEWAY_SECRET','OPENAI_API_KEY','RUNTESSA_PRIVATE_FIXTURE'].filter(key=>key in process.env)})); process.exit(0);
}
if (process.argv.includes('status')) { console.log('Logged in'); process.exit(0); }
if (process.argv.includes('app-server')) {
 const send = value => console.log(JSON.stringify(value));
 require('node:readline').createInterface({input:process.stdin}).on('line', line => {
  const r=JSON.parse(line); const thread='auth-fixture-thread'; const turn='auth-fixture-turn';
  if (r.method==='initialize') send({id:r.id,result:{}});
  if (r.method==='thread/start'||r.method==='thread/resume') send({id:r.id,result:{thread:{id:thread}}});
  if (r.method==='turn/start') {
   send({id:r.id,result:{turn:{id:turn}}});
   send({method:'item/completed',params:{threadId:thread,turnId:turn,item:{type:'agentMessage',text:'Scoped reply'}}});
   send({method:'turn/completed',params:{threadId:thread,turn:{id:turn,status:'completed'}}});
  }
 });
}
`, { mode: 0o700 });
const previous = new Map();
for (const [key, value] of Object.entries({ ASSISTANT_GATEWAY_SECRET: secret, CODEX_BIN: cli,
  WORKSPACE_ROOT: directory, CODEX_GATEWAY_PROFILES_DIR: path.join(directory, 'profiles'),
  CODEX_GATEWAY_WORKSPACES_DIR: path.join(directory, 'workspaces'), CODEX_GATEWAY_WORKSPACE_ACCESS_MODE: 'tenant' })) {
  previous.set(key, process.env[key]); process.env[key] = value;
}
const { handleRequest } = require('../../src/codex-gateway/lib/router');
const { createLoginSession } = require('../../src/codex-gateway/lib/loginFlow');
const { resolveWorkspaceDir } = require('../../src/codex-gateway/lib/workspaceManager');
const { spawnCodexWithFallback } = require('../../src/codex-gateway/lib/codexRunner');
const server = http.createServer((req, res) => handleRequest(req, res).catch(() => {
  res.writeHead(500); res.end('Unexpected fixture failure');
}));
let base;
test.before(async () => { server.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; });
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(directory, { recursive: true, force: true });
  for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
const request = (route, identity, body) => fetchCodexGateway(base + route, identity, body === undefined ? {} : {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
});
const packet = (route, identity, body) => {
  const original = global.fetch;
  try {
    let captured;
    global.fetch = (url, init) => { captured = { url, init }; return Promise.resolve({}); };
    request(route, identity, body);
    return captured;
  } finally { global.fetch = original; }
};
const send = (p) => fetch(p.url, p.init);

test('missing credentials stop startup and never produce unsigned Studio requests', async () => {
  const child = spawn(process.execPath, ['src/codex-gateway/index.js'], { env: { PATH: process.env.PATH, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.resume();
  assert.equal((await once(child, 'exit'))[0], 1); assert.doesNotMatch(stdout, /listening/);
  delete process.env.ASSISTANT_GATEWAY_SECRET;
  try { assert.throws(() => request('/v1/models', { userId: 'alice' }), /same private/); }
  finally { process.env.ASSISTANT_GATEWAY_SECRET = secret; }
});

test('authentication rejects missing, forged, tampered, expired and replayed packets', async () => {
  assert.deepEqual(await (await fetch(base + '/health')).json(), { ok: true, service: 'codex-gateway' });
  assert.equal((await fetch(base + '/v1/login/status?userId=alice')).status, 401);
  const good = packet('/v1/login/status?userId=alice', { userId: 'alice' });
  const altered = { ...good, init: { ...good.init, headers: new Headers(good.init.headers) } };
  altered.init.headers.set('x-runtessa-signature', '0'.repeat(64));
  assert.equal((await send(altered)).status, 401);
  assert.equal((await send({ ...good, url: base + '/v1/login/status?userId=bob' })).status, 401);
  assert.equal((await send({ ...good, init: { ...good.init, method: 'POST', body: '{}' } })).status, 401);
  const expired = packet('/v1/login/status', { userId: 'alice' });
  const identity = JSON.parse(Buffer.from(expired.init.headers.get('x-runtessa-context'), 'base64url'));
  identity.iat = Date.now() - 120_000;
  const context = Buffer.from(JSON.stringify(identity)).toString('base64url');
  expired.init.headers.set('x-runtessa-context', context);
  expired.init.headers.set('x-runtessa-signature', crypto.createHmac('sha256', secret).update(['GET', '/v1/login/status', context,
    crypto.createHash('sha256').update('').digest('hex')].join('\n')).digest('hex'));
  assert.equal((await send(expired)).status, 401);
  assert.equal((await send(good)).status, 200); assert.equal((await send(good)).status, 401);
});

test('signed users cannot select other profiles or read/update another login session', async () => {
  assert.equal((await request('/v1/login/status?userId=bob', { userId: 'alice' })).status, 403);
  assert.equal((await request('/v1/login/status?userId=alice&userId=bob', { userId: 'alice' })).status, 403);
  assert.equal((await request('/v1/logout', { userId: 'alice' }, { userId: 'bob' })).status, 403);
  const session = createLoginSession({ userId: 'alice', mode: 'device-auth' });
  const route = `/v1/login/session/${session.sessionId}`;
  assert.equal((await request(route, { userId: 'alice' })).status, 200);
  assert.equal((await request(route, { userId: 'bob' })).status, 404);
  assert.equal((await request('/v1/login/callback', { userId: 'bob' }, { sessionId: session.sessionId, callbackData: { stolen: true } })).status, 404);
  assert.equal((await request('/v1/login/callback', { userId: 'alice' }, { sessionId: session.sessionId, callbackData: { accepted: true } })).status, 200);
  assert.deepEqual(session.callbackData, { accepted: true });
});

test('tenant identity cannot cross scope or fall back to repository execution', async () => {
  const alice = { userId: 'alice', tenantId: 'tenant-a' };
  assert.equal((await request('/v1/exec', alice, { prompt: 'inspect' })).status, 403);
  assert.equal((await request('/v1/exec', { userId: 'alice', scope: 'repo' }, { prompt: 'inspect' })).status, 403);
  assert.equal((await request('/v1/workspace/reset', alice, { tenantId: 'tenant-b', chatId: 'chat' })).status, 403);
  assert.equal((await request('/v1/workspace/reset', { userId: 'alice' }, { tenantId: 'tenant-a' })).status, 403);
  assert.equal((await request('/v1/workspace/reset', alice, { tenantId: 'tenant-a', chatId: '..' })).status, 400);
  const a = resolveWorkspaceDir({ userId: 'alice', tenantId: 'tenant-a__b', chatId: 'c' });
  const b = resolveWorkspaceDir({ userId: 'alice', tenantId: 'tenant-a', chatId: 'b__c' });
  assert.notEqual(a, b);
});

test('authorized tenant activation, commit, reset and native SSE remain usable', async () => {
  const identity = { userId: 'alice', tenantId: 'tenant-a' };
  const session = { tenant: { id: 'tenant-a' }, chatId: 'chat-a', files: [] };
  assert.equal((await request('/v1/workspace/activate', identity, { tenantId: 'tenant-a', chatId: 'chat-a', agentSession: session })).status, 200);
  for (const action of ['commit', 'reset']) assert.equal((await request(`/v1/workspace/${action}`, identity, { tenantId: 'tenant-a', chatId: 'chat-a' })).status, 200);
  const response = await request('/v1/exec', identity, { agentSession: session, prompt: 'Inspect', stream: true });
  assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /event-stream/);
  const events = await response.text(); assert.match(events, /Scoped reply/); assert.match(events, /"ok":true/);
});

test('Codex subprocesses inherit transport settings and isolated profiles, excluding service credentials', async () => {
  process.env.RUNTESSA_PRIVATE_FIXTURE = 'must-not-inherit'; process.env.OPENAI_API_KEY = 'must-not-inherit';
  try {
    const { child } = spawnCodexWithFallback({ args: ['environment'], cwd: directory, userId: 'alice', stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.resume(); await once(child, 'exit');
    const environment = JSON.parse(output);
    assert.deepEqual(environment.leaked, []); assert.equal(environment.profile, path.join(directory, 'profiles', 'alice'));
    assert.equal(environment.transport, true);
  } finally { delete process.env.RUNTESSA_PRIVATE_FIXTURE; delete process.env.OPENAI_API_KEY; }
});

test('native secret initialization coordinates private files, is idempotent and preserves conflicting settings', async () => {
  const { initializeAssistantSecret } = await import('../assistant/init-secret.mjs');
  const root = path.join(directory, 'initialization');
  for (const name of ['ideNew', 'codex-gateway']) fs.mkdirSync(path.join(root, 'src', name), { recursive: true });
  const studio = path.join(root, 'src/ideNew/.env'); const gateway = path.join(root, 'src/codex-gateway/.env');
  fs.writeFileSync(studio, 'UNRELATED_SETTING=preserve\n');
  assert.equal(initializeAssistantSecret(root), 2);
  const before = fs.readFileSync(studio, 'utf8'); assert.match(before, /UNRELATED_SETTING=preserve/);
  const key = before.match(/ASSISTANT_GATEWAY_SECRET=(.*)/)[1]; assert.match(key, /^[a-f0-9]{64}$/);
  assert.match(fs.readFileSync(gateway, 'utf8'), new RegExp(key)); assert.equal(initializeAssistantSecret(root), 0);
  assert.equal(fs.statSync(studio).mode & 0o777, 0o600);
  fs.writeFileSync(gateway, `ASSISTANT_GATEWAY_SECRET=${crypto.randomBytes(32).toString('hex')}\n`);
  assert.throws(() => initializeAssistantSecret(root), /differ/); assert.equal(fs.readFileSync(studio, 'utf8'), before);
});
