const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRuntimeCapabilities } = require('../../dist/engine/runtimeCapabilities');
const { CryptoService } = require('../../dist/core/security/CryptoService');
const { OrmModel, Secret } = require('@idp/shared');
const crypto = new CryptoService(Buffer.alloc(32, 1), Buffer.alloc(32, 2));
const tenant = { id: 'tenant-a', hostname: 'a.example.test', adapterAccess: { mysql: { allow: ['own-db'] } } };
const calls = [];
const source = { getRepository(entity) {
  if (entity === OrmModel) return { find: async (options) => { calls.push(options); return [{ id: 'own-model' }]; } };
  if (entity === Secret) return { findOne: async (options) => {
    assert.equal(options.where.tenant.id, 'tenant-a');
    return { ...crypto.encryptSecret(JSON.stringify({ read: { host: 'own-read', password: 'synthetic-own-read' },
      write: { host: 'own-write', password: 'synthetic-own-write' } })) };
  } };
  throw Error('Unexpected repository');
} };

test('parent capability enforces its own tenant and allowed adapter keys', async () => {
  const call = createRuntimeCapabilities(source, crypto, tenant, true);
  await assert.rejects(call('adapter-config', { tenantId: 'tenant-b', adapter: 'mysql', key: 'foreign-db', mode: 'read' }), /Access denied/);
  const value = JSON.parse(await call('adapter-config', { tenantId: 'tenant-b', adapter: 'mysql', key: 'own-db', mode: 'read' }));
  assert.equal(value.host, 'own-read');
  assert.equal(value.password, 'synthetic-own-read');
  assert.doesNotMatch(JSON.stringify(value), /own-write/);
  assert.deepEqual(await call('models', { tenantId: 'tenant-b', adapterKey: 'mysql:own-db' }), [{ id: 'own-model' }]);
  assert.deepEqual(calls.at(-1).where, { tenant: { id: 'tenant-a' } });
});

test('unknown, malformed or prototype-shaped capabilities fail closed', async () => {
  const call = createRuntimeCapabilities(source, crypto, tenant, false);
  for (const operation of ['constructor', '__proto__', 'query', 'getSecretValue']) await assert.rejects(call(operation, {}), /denied/);
  for (const value of [null, {}, { adapter: 'postgres', key: {}, mode: 'read' }, { adapter: 'postgres', key: 'own-db', mode: 'admin' }])
    await assert.rejects(call('adapter-config', value), /Invalid/);
});
