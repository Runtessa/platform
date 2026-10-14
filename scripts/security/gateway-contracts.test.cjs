const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const secret = crypto.randomBytes(32).toString('hex');
const { load } = require('../../src/ideNew/tests/security-harness.cjs');
const { fetchCodexGateway } = load('src/lib/assistant/gateway-fetch.ts', { 'node:crypto': crypto });

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idp-gateway-contract-'));
const root = path.join(directory, 'workspace');
fs.mkdirSync(path.join(root, 'nested'), { recursive: true });
fs.mkdirSync(`${root}-other`);
fs.symlinkSync(`${root}-other`, path.join(root, 'escape'), 'dir');
fs.symlinkSync(path.join(root, 'nested'), path.join(root, 'local-link'), 'dir');
process.env.WORKSPACE_ROOT = root;
process.env.CODEX_GATEWAY_PROFILES_DIR = path.join(directory, 'profiles');
const { safeCwd } = require('../../src/codex-gateway/lib/codexRunner');
test.after(() => fs.rmSync(directory, { recursive: true, force: true }));

test('Gateway accepts its root, nested directories and internal symlinks', () => {
  assert.equal(safeCwd(), root);
  assert.equal(safeCwd(root), root);
  assert.equal(safeCwd(path.join(root, 'nested')), path.join(root, 'nested'));
  assert.equal(safeCwd(path.join(root, 'local-link')), path.join(root, 'local-link'));
});

test('Gateway rejects parent traversal and a sibling sharing the root prefix', () => {
  assert.throws(() => safeCwd(path.join(root, '..')), /workspace root/);
  assert.throws(() => safeCwd(`${root}-other`), /workspace root/);
});

test('Gateway rejects symlinks into directories outside its root', () => {
  assert.throws(() => safeCwd(path.join(root, 'escape')), /workspace root/);
  assert.throws(() => safeCwd(path.join(root, 'escape', 'not-created')), /workspace root/);
});

test('Gateway HTTP supports JSON and SSE execution through the CLI adapter', async (t) => {
  const fixture = path.join(directory, 'synthetic-cli.cjs');
  fs.writeFileSync(fixture, `#!/usr/bin/env node\nprocess.stdin.resume();\nprocess.stdin.on('end', () => {
    console.log(JSON.stringify({type:'item.completed', item:{type:'agent_message',text:'contract-ok'}}));
  });\n`, { mode: 0o700 });
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.execPath, ['src/codex-gateway/index.js'], {
    env: { PATH: process.env.PATH, HOST: '127.0.0.1', ASSISTANT_GATEWAY_SECRET: secret,
      CODEX_GATEWAY_WORKSPACE_ACCESS_MODE: 'repo', PORT: String(port), WORKSPACE_ROOT: root, CODEX_BIN: fixture,
      CODEX_GATEWAY_PROFILES_DIR: path.join(directory, 'profiles'),
      CODEX_GATEWAY_WORKSPACES_DIR: path.join(directory, 'sessions'),
      CODEX_GATEWAY_HISTORY_FILE: path.join(directory, 'history.json') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
  });
  child.stderr.resume();
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Gateway did not start')), 10000);
    child.stdout.on('data', () => {
      if (output.includes('listening')) { clearTimeout(timer); resolve(); }
    });
    child.once('error', reject);
    child.once('exit', () => { clearTimeout(timer); reject(Error('Gateway exited before readiness')); });
  });
  const base = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  const previous = process.env.ASSISTANT_GATEWAY_SECRET;
  process.env.ASSISTANT_GATEWAY_SECRET = secret;
  t.after(() => { if (previous === undefined) delete process.env.ASSISTANT_GATEWAY_SECRET; else process.env.ASSISTANT_GATEWAY_SECRET = previous; });
  const execute = (payload) => fetchCodexGateway(`${base}/v1/exec`, { userId: 'contract-user', scope: 'repo' }, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'synthetic contract', userId: 'contract-user', ...payload }),
    signal: AbortSignal.timeout(10000),
  });
  const rejected = await execute({ cwd: `${root}-other`, stream: false });
  assert.equal(rejected.status, 400);
  const jsonResponse = await execute({ cwd: path.join(root, 'nested'), stream: false });
  assert.equal(jsonResponse.status, 200);
  const body = await jsonResponse.json();
  assert.equal(body.ok, true); assert.equal(body.message, 'contract-ok');
  assert.deepEqual(body.changedFiles, []);
  const streamResponse = await execute({ cwd: path.join(root, 'nested') });
  assert.match(streamResponse.headers.get('content-type'), /text\/event-stream/);
  const events = await streamResponse.text();
  assert.match(events, /event: status/); assert.match(events, /event: stdout/);
  const done = events.split('\n\n').find((event) => event.startsWith('event: done'));
  const result = JSON.parse(done.split('\ndata: ')[1]);
  assert.equal(result.ok, true); assert.equal(result.message, 'contract-ok');
});
