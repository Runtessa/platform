const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./logging-harness.cjs');

const runBootstrap = async ({ existing = false, token = 'synthetic-sso-token' } = {}) => {
  const values = { AUTH_BOOTSTRAP_CLIENT_SECRET: 'synthetic-client-secret',
    AUTH_BOOTSTRAP_ADMIN_PASSWORD: 'synthetic-admin-password', AUTH_BOOTSTRAP_TENANT_SSO_TOKEN: token };
  const original = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  const output = [], writes = [], hashes = [];
  const { bootstrapAuthDefaults } = load('src/auth/lib/services/bootstrap.ts', {
    '../db': { AuthDataSource: { getRepository: () => ({ findOne: async () => existing ? {} : null,
      create: (row) => row, save: async (row) => writes.push(row) }) } },
    '../crypto': { hashPassword: async (value) => { hashes.push(value); return 'hashed'; }, randomId: () => 'random-id' },
    '../typeorm/entities': { OAuthClientEntity: 'OAuthClient' },
    './versioning': { findCurrentUserByEmail: async () => existing ? {} : null,
      schemas: { users: 'users', organizations: 'organizations' }, upsertVersionedRecord: async (...args) => writes.push(args) },
    './tenant-whitelist': { extractTenantNameFromRedirectUri: () => 'localhost',
      findWhitelistTenant: async () => existing ? {} : null,
      createOrUpdateWhitelistTenant: async (params) => { writes.push(params); return { plainToken: 'synthetic-generated-token' }; } },
  });
  let error;
  try { await bootstrapAuthDefaults({ log: (message) => output.push(message) }); }
  catch (caught) { error = caught; }
  finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
  return { output, writes, hashes, error };
};

test('new tenant bootstrap uses supplied secrets but prints no credentials', async () => {
  const result = await runBootstrap();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.hashes, ['synthetic-client-secret', 'synthetic-admin-password']);
  assert.equal(result.writes[0].token, 'synthetic-sso-token');
  assert.equal(result.writes.length, 4);
  assert.doesNotMatch(JSON.stringify(result.output), /synthetic-/);
});

test('new tenant without configured SSO token fails before any writes', async () => {
  const result = await runBootstrap({ token: '' });
  assert.match(result.error.message, /AUTH_BOOTSTRAP_TENANT_SSO_TOKEN is required/);
  const { authErrorDiagnostics } = load('src/auth/lib/error-diagnostics.ts');
  assert.equal(authErrorDiagnostics(result.error).code, 'AUTH_BOOTSTRAP_TENANT_SSO_TOKEN_REQUIRED');
  assert.equal(result.writes.length, 0);
  assert.equal(result.hashes.length, 0);
});

test('Auth exception summaries cannot expose raw messages, SQL, parameters or arbitrary codes', () => {
  const { authErrorDiagnostics } = load('src/auth/lib/error-diagnostics.ts');
  const error = Object.assign(new TypeError('synthetic-password'), {
    cause: 'synthetic-cause', code: 'synthetic-code', parameters: ['synthetic-param'],
  });
  assert.deepEqual(authErrorDiagnostics(error), { name: 'TypeError' });
  assert.doesNotMatch(JSON.stringify(authErrorDiagnostics('synthetic-thrown-value')), /synthetic-/);
});

test('existing bootstrap tenant needs no token and preserves existing credentials', async () => {
  const result = await runBootstrap({ existing: true, token: '' });
  assert.equal(result.error, undefined);
  assert.equal(result.writes.length, 1);
  assert.equal(result.writes[0].token, undefined);
  assert.equal(result.hashes.length, 0);
  assert.doesNotMatch(JSON.stringify(result.output), /synthetic-/);
});
