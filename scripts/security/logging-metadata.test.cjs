const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shared } = require('./logging-harness.cjs');

test('nested credential fields and raw containers are omitted without mutating input', () => {
  const input = { status: 403, userId: 4, hasSessionToken: true, path: '/auth?code=synthetic-code#synthetic-fragment',
    nested: [{ client_secret: 'synthetic-secret', accessToken: 'synthetic-token', PASSWORD: 'synthetic-password' }],
    body: '{"arbitrary":"synthetic-body"}', query: { x: 'synthetic-query' }, headers: { other: 'synthetic-header' } };
  const output = shared.safeLogMetadata(input);
  assert.equal(output.status, 403);
  assert.equal(output.hasSessionToken, true);
  assert.equal(output.path, '/auth');
  assert.doesNotMatch(JSON.stringify(output), /synthetic-/);
  assert.equal(input.nested[0].accessToken, 'synthetic-token');
});

test('metadata handles cycles, binary values, oversized arrays and getters safely', () => {
  let getterCalled = false;
  const input = { binary: Buffer.from('synthetic-binary'), array: Array(100).fill(1) };
  input.self = input;
  Object.defineProperty(input, 'getter', { enumerable: true, get() { getterCalled = true; throw Error('unexpected'); } });
  const output = shared.safeLogMetadata(input);
  assert.equal(getterCalled, false);
  assert.equal(output.self, '[omitted]');
  assert.equal(output.binary, '[omitted]');
  assert.equal(output.array.length, 50);
  assert.doesNotThrow(() => JSON.stringify(output));
  const array = [];
  Object.defineProperty(array, '0', { get() { getterCalled = true; throw Error('unexpected'); } });
  assert.deepEqual(shared.safeLogMetadata(array), ['[omitted]']);
  assert.equal(getterCalled, false);
});

test('paths drop query, fragment and URL credentials', () => {
  for (const input of ['/api/auth?token=synthetic#synthetic', 'https://synthetic:synthetic@example.test/api/auth?code=synthetic']) {
    assert.equal(shared.safeLogPath(input), '/api/auth');
  }
});

test('error diagnostics retain source frames, never messages, causes or SQL parameters', () => {
  const error = new Error('synthetic-message');
  error.name = 'QueryFailedError';
  error.stack = 'Error: synthetic-stack-message\n    at execute (/app/service.ts:12:4)\n    at /app/index.ts:3:2';
  error.cause = 'synthetic-cause';
  error.parameters = ['synthetic-parameter'];
  const output = shared.safeErrorMeta(error);
  assert.equal(output.name, 'QueryFailedError');
  assert.equal(output.frames.length, 2);
  assert.equal(output.frames[0].line, 12);
  assert.doesNotMatch(JSON.stringify(output), /synthetic/);
  error.name = 'synthetic-name';
  assert.equal(shared.safeErrorMeta(error).name, 'Error');
  assert.equal(shared.safeErrorMeta('synthetic-thrown-value').name, 'Error');
  Object.defineProperty(error, 'stack', { get() { throw Error('unavailable stack'); } });
  assert.deepEqual(shared.safeErrorMeta(error), { name: 'Error', frames: [] });
});
