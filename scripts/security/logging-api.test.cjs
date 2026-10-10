const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, shared, response, captureConsole } = require('./logging-harness.cjs');

const loadLogger = (save) => load('src/ideNew/src/lib/logger.ts', {
  'source-map-support': { install() {}, mapSourcePosition: (frame) => frame },
  '@idp/shared': { SystemLog: 'SystemLog', ...shared },
  './db': { ensureSchema: async () => {}, AppDataSource: { getRepository: () => ({ create: (row) => row, save }) } },
});

for (const initFails of [false, true]) test(`API failure excludes request and error data (initialization failure: ${initFails})`, async () => {
  const rows = [];
  const loggerModule = loadLogger(async (row) => rows.push(row));
  const error = Object.assign(new Error('synthetic-error-password'), { statusCode: 403 });
  const { withApiHandler } = load('src/ideNew/src/lib/api-helpers.ts', {
    '@idp/shared': shared, './logger': loggerModule,
    './init': { ensureAppInitialized: async () => { if (initFails) throw error; } },
  });
  let called = false;
  const res = response();
  await withApiHandler(async () => { called = true; throw error; })({
    method: 'POST', url: '/api/auth?code=synthetic-query#synthetic-fragment',
    query: { code: 'synthetic-query' }, body: { arbitrary: 'synthetic-body' },
    headers: { authorization: 'synthetic-header' },
  }, res);
  assert.equal(called, !initFails);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.error, error.message); // Existing client response contract.
  assert.equal(rows[0].action, 'POST /api/auth');
  assert.equal(rows[0].meta.status, 403);
  assert.doesNotMatch(JSON.stringify(rows), /synthetic-/);
});

test('direct auth warning sanitizes structured secrets and keeps useful context', async () => {
  const rows = [];
  await loadLogger(async (row) => rows.push(row)).logger.warn({
    source: 'auth', action: 'requireUser', message: 'Unauthorized',
    meta: { path: '/auth?code=synthetic-code', userId: 10, apiToken: 'synthetic-token', hasApiToken: true },
  });
  assert.equal(rows[0].action, 'requireUser');
  assert.equal(rows[0].meta.userId, 10);
  assert.equal(rows[0].meta.hasApiToken, true);
  assert.doesNotMatch(JSON.stringify(rows), /synthetic-/);
});

test('database logging failures do not reprint the rejected log record', async () => {
  const error = Object.assign(new Error('synthetic-db-password'), { parameters: ['synthetic-record'] });
  const output = await captureConsole(async () => {
    await loadLogger(async () => { throw error; }).logger.error({ source: 'api', message: 'API request failed' });
  });
  assert.deepEqual(output, [['Failed to insert log']]);
});

test('server errors preserve generic response and successes preserve payload', async () => {
  const loggerModule = loadLogger(async () => {});
  const { withApiHandler } = load('src/ideNew/src/lib/api-helpers.ts', {
    '@idp/shared': shared, './logger': loggerModule, './init': { ensureAppInitialized: async () => {} },
  });
  const failed = response();
  await withApiHandler(async () => { throw Error('synthetic'); })({ method: 'GET', url: '/api/test' }, failed);
  assert.equal(failed.statusCode, 500);
  assert.equal(failed.payload.error, 'Something went wrong on the server. Please try again later.');
  const success = response();
  await withApiHandler(async (_req, res) => res.json({ ok: true }))({ method: 'GET', url: '/api/test' }, success);
  assert.deepEqual(success.payload, { ok: true });
});

test('assistant compilation failures omit input source and preserve fallback behavior', async () => {
  const { compileUiSource } = load('src/ideNew/src/lib/assistant/compiler.ts', {
    '@/lib/shared-build/css-module-source': load('src/ideNew/src/lib/shared-build/css-module-source.ts'),
    '@idp/shared': shared,
    '@babel/core': { transformSync: () => { throw Error('synthetic-source-secret'); } },
    '@babel/preset-env': {}, '@babel/preset-react': {}, '@babel/preset-typescript': {},
  });
  const output = await captureConsole(() => assert.equal(compileUiSource('synthetic-source', 'tsx'), 'synthetic-source'));
  assert.equal(output.length, 1);
  assert.doesNotMatch(JSON.stringify(output), /synthetic-/);
});
