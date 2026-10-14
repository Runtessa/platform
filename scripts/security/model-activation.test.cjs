require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { DataSource } = require('typeorm');
const { Tenant } = require('@idp/shared');
const { coreEntities } = require('@idp/shared/dist/database/entities');
const { runPlatformMigrations } = require('@idp/shared/dist/database/migrate');
const { activateModelSnapshot } = require('@idp/shared/dist/runtime/model-activation');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { loadOrmModels } = require('../../dist/engine/ormAdapterHelpers');
const { nativePostgres } = require('../database/native-postgres.cjs');
const entity = (extra = '') => [{ path: 'models/Task.js', code: `const {Entity,PrimaryColumn,Column}=require('typeorm');
class Task{}; Entity('activation_tasks')(Task); PrimaryColumn({type:'text'})(Task.prototype,'id');
${extra} exports.Task=Task;` }];

async function setup(t) {
  const core = await nativePostgres(), tenantDb = await nativePostgres();
  const source = new DataSource({ ...core.config, entities: coreEntities, poolSize: 1 });
  const data = new DataSource({ ...tenantDb.config, entities: [], poolSize: 1 });
  const previous = process.env.RUNTIME_EGRESS_ALLOW; process.env.RUNTIME_EGRESS_ALLOW = '127.0.0.1:5432';
  t.after(async () => { await source.destroy(); await data.destroy(); await core.stop(); await tenantDb.stop();
    if (previous === undefined) delete process.env.RUNTIME_EGRESS_ALLOW; else process.env.RUNTIME_EGRESS_ALLOW = previous; });
  await source.initialize(); await data.initialize(); await runPlatformMigrations(source, 'core');
  const tenant = await source.getRepository(Tenant).save({ hostname: `activation-${Date.now()}.test` });
  let models = entity();
  const migrate = (models, adapter, config, options) => runRestrictedProcess({
    entrypoint: require.resolve('@idp/shared/dist/runtime/ormMigrationProcess'), readOnlyRoots: runtimeDependencyRoots(),
    input: { models, adapter, config, ...options }, memoryMb: 512, timeoutMs: 30000,
  });
  const activate = (options = {}) => activateModelSnapshot({ source, tenantId: tenant.id,
    adapter: 'postgres', key: 'tasks', config: tenantDb.config, readModels: async (manager) => {
      assert.equal((await manager.query('SELECT id FROM tenants WHERE id = $1', [tenant.id])).length, 1);
      return models;
    }, migrate, ...options });
  return { source, data, tenant, activate, change: (next) => { models = next; } };
}

test('published models retain their activated snapshot across draft edits, rejected schema changes and concurrent activation', async (t) => {
  const f = await setup(t);
  await assert.rejects(loadOrmModels(f.source, f.tenant, 'postgres:tasks'), { statusCode: 409 });
  const first = await f.activate();
  f.change(entity("Column({type:'text',nullable:true})(Task.prototype,'description');"));
  const old = await loadOrmModels(f.source, f.tenant, 'postgres:tasks'); assert.equal(old[0].compiledCode.code.includes('description'), false);
  const [a, b] = await Promise.all([f.activate(), f.activate()]);
  assert.notEqual(a.activeRevision, first.activeRevision); assert.equal(a.modelHash, b.modelHash);
  assert.equal((await loadOrmModels(f.source, f.tenant, 'postgres:tasks'))[0].compiledCode.code.includes('description'), true);
  await f.data.query("INSERT INTO activation_tasks(id,description) VALUES ('preserve','data')");
  f.change(entity()); await assert.rejects(f.activate(), { statusCode: 409 });
  assert.equal((await loadOrmModels(f.source, f.tenant, 'postgres:tasks'))[0].compiledCode.code.includes('description'), true);
  assert.equal((await f.data.query('SELECT description FROM activation_tasks'))[0].description, 'data');
  await assert.rejects(f.activate({ expectedModelHash: '0'.repeat(64) }), { statusCode: 409 });
});

test('activation commit failure keeps prior models; retry reconciles committed DDL without rerunning source or schema changes', async (t) => {
  const f = await setup(t);
  const first = await f.activate();
  f.change(entity("Column({type:'text',nullable:true})(Task.prototype,'nextColumn');"));
  await f.source.query(`CREATE FUNCTION fail_model_activation() RETURNS trigger AS $$
    BEGIN IF NEW.active_revision <> OLD.active_revision THEN RAISE EXCEPTION 'fixture activation failure'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql`);
  await f.source.query('CREATE TRIGGER fixture_activation_failure BEFORE UPDATE ON runtessa_model_state FOR EACH ROW EXECUTE FUNCTION fail_model_activation()');
  await assert.rejects(f.activate(), /fixture activation failure/);
  const [state] = await f.source.query('SELECT * FROM runtessa_model_state');
  assert.equal(state.active_revision, first.activeRevision); assert.ok(state.pending);
  const [committed] = await f.data.query('SELECT count(*)::int AS count FROM runtessa_model_operations');
  assert.equal(committed.count, 2);
  await f.source.query('DROP TRIGGER fixture_activation_failure ON runtessa_model_state');
  f.change(entity("Column({type:'text',nullable:true})(Task.prototype,'laterDraft');"));
  const recovered = await f.activate(); assert.equal(recovered.pendingDraftChanges, true);
  const active = await loadOrmModels(f.source, f.tenant, 'postgres:tasks');
  assert.equal(active[0].compiledCode.code.includes('nextColumn'), true); assert.equal(active[0].compiledCode.code.includes('laterDraft'), false);
  assert.equal((await f.data.query('SELECT count(*)::int AS count FROM runtessa_model_operations'))[0].count, 2);
});
