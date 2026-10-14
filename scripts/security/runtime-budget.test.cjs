const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { once } = require('node:events');
const { fixture } = require('./runtime-harness.cjs');
const { authorizeNetworkTarget } = require('@idp/shared/dist/runtime/network-policy');

test('private destinations and metadata are denied; explicit destinations retain native HTTP/fetch', async () => {
  let calls = 0;
  const server = http.createServer((_req, res) => { calls++; res.end('authorized-response'); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const previous = process.env.RUNTIME_EGRESS_ALLOW;
  try {
    const port = server.address().port, url = `http://127.0.0.1:${port}/`;
    delete process.env.RUNTIME_EGRESS_ALLOW;
    await assert.rejects(fixture({ operation: 'http', url }, { allowPublicHttp: true }), /fetch failed|denied/);
    assert.equal(calls, 0);
    for (const host of ['127.0.0.1', '::1', '::ffff:7f00:1', '169.254.169.254', 'fd00:ec2::254'])
      await assert.rejects(authorizeNetworkTarget({ host, port: 80 }, true));
    process.env.RUNTIME_EGRESS_ALLOW = `127.0.0.1:${port}`;
    assert.equal(await fixture({ operation: 'http', url }), 'authorized-response');
    assert.equal(await fixture({ operation: 'raw-http', url }), 'authorized-response');
    assert.equal(calls, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previous === undefined) delete process.env.RUNTIME_EGRESS_ALLOW; else process.env.RUNTIME_EGRESS_ALLOW = previous;
  }
});

test('native allocation, temporary files and deadlines are bounded and release their groups', async () => {
  await assert.rejects(fixture({ operation: 'native-memory' }, { memoryMb: 32 }), /resource budgets|exited/);
  await assert.rejects(fixture({ operation: 'temporary-files' }), /space|budget|exited/);
  await assert.rejects(fixture({ operation: 'loop' }, { timeoutMs: 800 }), /timed out/);
  assert.equal((await fixture({ operation: 'echo', version: 'survived' })).version, 'survived');
  const root = process.env.RUNTIME_CGROUP_ROOT || `/sys/fs/cgroup/user.slice/user-${process.getuid()}.slice/user@${process.getuid()}.service/runtessa-runtime`;
  assert.equal(fs.readdirSync(root).filter(name => name.startsWith(`run-${process.pid}-`)).length, 0);
});

test('missing resource delegation fails closed before tenant code', async () => {
  const previous = process.env.RUNTIME_CGROUP_ROOT;
  process.env.RUNTIME_CGROUP_ROOT = '/tmp/not-a-cgroup';
  try { await assert.rejects(fixture({ operation: 'echo' }), /delegated cgroup/); }
  finally { if (previous === undefined) delete process.env.RUNTIME_CGROUP_ROOT; else process.env.RUNTIME_CGROUP_ROOT = previous; }
});
