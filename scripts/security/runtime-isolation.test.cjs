const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { fixture, run, request } = require('./runtime-harness.cjs');

test('live edits take effect on the next request without restarting a service', async () => {
  const first = await run('module.exports = (request) => ({statusCode: 201, headers: {"x-version": "1"}, body: request.body.value + 1})');
  const second = await run('module.exports = (request) => ({body: request.body.value + 2})');
  assert.deepEqual(first, { statusCode: 201, headers: { 'x-version': '1' }, body: 4 });
  assert.equal(second.body, 5);
});

test('escaping the JS context still cannot read the service environment or host private files', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-runtime-private-'));
  const file = path.join(directory, 'credential');
  fs.writeFileSync(file, 'synthetic-private-value');
  const previous = process.env.IDPCORE_RUNTIME_TEST_SECRET;
  process.env.IDPCORE_RUNTIME_TEST_SECRET = 'synthetic-platform-secret';
  try {
    const result = await run(`module.exports = () => {
      const host = adapters.postgres.constructor('return process')();
      const fs = host.mainModule.require('node:fs');
      let fileReadable = false, parentReadable = false;
      try { fs.readFileSync(${JSON.stringify(file)}); fileReadable = true; } catch {}
      try { fs.readFileSync('/proc/' + ${process.pid} + '/environ'); parentReadable = true; } catch {}
      return {body: { env: host.env.IDPCORE_RUNTIME_TEST_SECRET || null, fileReadable, parentReadable,
        systemToolsReadable: fs.existsSync('/usr/bin/env') }};
    }`);
    assert.deepEqual(result.body, { env: null, fileReadable: false, parentReadable: false, systemToolsReadable: false });
    assert.equal(fs.readFileSync(file, 'utf8'), 'synthetic-private-value');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
    if (previous === undefined) delete process.env.IDPCORE_RUNTIME_TEST_SECRET; else process.env.IDPCORE_RUNTIME_TEST_SECRET = previous;
  }
});

test('synchronous infinite loops are killed while the service event loop stays responsive', async () => {
  let responsive = false;
  const timer = setTimeout(() => { responsive = true; }, 25);
  const start = performance.now();
  await assert.rejects(run('module.exports = () => { while(true) {} }', undefined, {
    request: { ...request, tenant: { ...request.tenant, resourceConfig: { memory: 128, timeout: 1500 } } },
  }), (error) => error.status === 504 && /Execution timed out/.test(error.message));
  clearTimeout(timer);
  assert.equal(responsive, true);
  assert.ok(performance.now() - start < 3500);
  assert.equal((await run('module.exports = () => ({body: "still-live"})')).body, 'still-live');
});

test('host writes, child processes and native addons are denied', async () => {
  const result = await run(`module.exports = () => {
    const host = adapters.postgres.constructor('return process')();
    const require = host.mainModule.require.bind(host.mainModule);
    const denied = {};
    for (const [name, operation] of Object.entries({
      write: () => require('node:fs').writeFileSync('/usr/idpcore-write-probe', 'probe'),
      spawn: () => require('node:child_process').execFileSync('/usr/bin/true'),
      worker: () => new (require('node:worker_threads').Worker)('while(true){}', {eval: true}),
      addon: () => require('node:process').dlopen({}, '/tmp/missing.node'),
    })) { try { operation(); denied[name] = false; } catch { denied[name] = true; } }
    return {body: denied};
  }`);
  assert.deepEqual(result.body, { write: true, spawn: true, worker: true, addon: true });
});

test('invalid memory or timeout cannot select an unisolated execution fallback', async () => {
  const result = await run('module.exports = () => ({body: "restricted"})', undefined, {
    request: { ...request, tenant: { ...request.tenant, resourceConfig: { memory: 0, timeout: -1 } } },
  });
  assert.equal(result.body, 'restricted');
  await assert.rejects(fixture({ operation: 'echo' }, { timeoutMs: -1 }), /Invalid runtime resource limits/);
});

test('OS startup failures fail closed and do not execute the supplied code elsewhere', async () => {
  await assert.rejects(fixture({ operation: 'echo' }, { entrypoint: '/missing-runtime-entry.js' }), /runtime/i);
});

test('concurrent execution is bounded and capacity is released after termination', async () => {
  const executions = Array.from({ length: 8 }, () => fixture({ operation: 'hold' }, { timeoutMs: 1500 }));
  await assert.rejects(fixture({ operation: 'echo' }), (error) => error.statusCode === 503 && /capacity/.test(error.message));
  const outcomes = await Promise.allSettled(executions);
  assert.ok(outcomes.every((outcome) => outcome.status === 'rejected'));
  assert.equal((await fixture({ operation: 'echo', version: 'after-cleanup' })).version, 'after-cleanup');
});
