// Explicit integration command: creates and removes its own disposable database.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { Client } = require('pg');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { run } = require('./runtime-harness.cjs');
const { disposablePostgres } = require('../database/disposable-postgres.cjs');

const main = async () => {
  const database = await disposablePostgres();
  const readPassword = randomBytes(24).toString('hex');
  const config = database.config;
  const client = new Client({ ...config, user: config.username });
  try {
    await client.connect();
    const modelCode = `const {Entity, PrimaryGeneratedColumn, Column} = require('typeorm');
      class Note { label() { return 'live:' + this.text; } }
      Entity('runtime_notes')(Note); PrimaryGeneratedColumn()(Note.prototype, 'id');
      Column({type: 'text'})(Note.prototype, 'text'); module.exports = {Note};`;
    const modelSources = [{ path: 'Note.js', code: modelCode }];
    const entrypoint = require.resolve('@idp/shared/dist/runtime/ormMigrationProcess.js');
    const migration = await runRestrictedProcess({ entrypoint,
      readOnlyRoots: [...runtimeDependencyRoots()], input: { models: modelSources, adapter: 'postgres', config },
      timeoutMs: 10000, memoryMb: 128 });
    assert.deepEqual(migration, { ok: true, entities: 1 });
    await client.query(`CREATE USER idpcore_read PASSWORD '${readPassword}'`);
    await client.query('GRANT USAGE ON SCHEMA public TO idpcore_read');
    await client.query('GRANT SELECT ON runtime_notes TO idpcore_read');
    const capabilities = async (operation, value) => {
      if (operation === 'models') return [{ id: 'own-model', path: 'Note.js', compiledCode: { code: modelCode } }];
      if (operation === 'adapter-config') {
        assert.equal(value.adapter, 'postgres'); assert.equal(value.key, 'own-db');
        return JSON.stringify(value.mode === 'read' ? { ...config, username: 'idpcore_read', password: readPassword } : config);
      }
      throw Error('Capability denied');
    };
    const inserted = await run(`module.exports = async (request, adapters) => {
      const orm = await adapters.orm.readWrite('own-db');
      const note = new orm.entities.Note(); note.text = 'value-' + request.body.value;
      const saved = await orm.getRepository('Note').save(note);
      return {statusCode: 201, body: {id: saved.id, text: saved.text, label: saved.label()}};
    }`, capabilities);
    assert.equal(inserted.statusCode, 201); assert.equal(inserted.body.text, 'value-3');
    assert.equal(inserted.body.label, 'live:value-3'); assert.ok(inserted.body.id > 0);
    const read = await run(`module.exports = async (_request, adapters) => {
      const orm = await adapters.orm.readOnly('own-db');
      return {body: await orm.getRepository('Note').find()};
    }`, capabilities);
    assert.equal(read.body.length, 1);
    await assert.rejects(run(`module.exports = async (_request, adapters) => {
      const orm = await adapters.orm.readOnly('own-db');
      await orm.getRepository('Note').save({text: 'forbidden-write'}); return {body: true};
    }`, capabilities), /permission denied/);
    const sql = await run(`module.exports = async (_request, adapters) => {
      const postgres = await adapters.postgres.readOnly('own-db');
      return {body: await postgres.query('SELECT text FROM runtime_notes')};
    }`, capabilities);
    assert.equal(sql.body[0].text, 'value-3');
    console.log('Disposable PostgreSQL migration, live ORM classes/CRUD, read-only permissions and SQL adapter checks passed');
  } finally {
    await client.end().catch(() => {});
    await database.stop();
  }
};
main().catch((error) => { console.error('Runtime integration failed:', error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[database URL omitted]')); process.exitCode = 1; });
