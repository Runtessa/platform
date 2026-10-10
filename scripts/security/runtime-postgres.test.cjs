// Explicit integration command: creates and removes its own disposable database.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Client } = require('pg');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { run } = require('./runtime-harness.cjs');

const main = async () => {
  const engine = ['podman', 'docker'].find((candidate) => {
    try { execFileSync(candidate, ['version'], { stdio: 'ignore' }); return true; } catch { return false; }
  });
  if (!engine) throw Error('A local Podman or Docker engine is required for the disposable integration test');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-runtime-db-test-'));
  const password = randomBytes(24).toString('hex'), readPassword = randomBytes(24).toString('hex');
  const name = `idpcore-runtime-test-${process.pid}`;
  const envFile = path.join(directory, 'postgres.env');
  fs.writeFileSync(envFile, `POSTGRES_USER=idpcore_test\nPOSTGRES_PASSWORD=${password}\nPOSTGRES_DB=idpcore_test\n`, { mode: 0o600 });
  let client;
  try {
    execFileSync(engine, ['run', '--detach', '--rm', '--name', name, '--env-file', envFile,
      '--publish', '127.0.0.1::5432', 'docker.io/library/postgres:17-alpine'], { stdio: 'ignore' });
    const port = Number(execFileSync(engine, ['port', name, '5432/tcp'], { encoding: 'utf8' }).trim().split(':').at(-1));
    const config = { host: '127.0.0.1', port, username: 'idpcore_test', password, database: 'idpcore_test' };
    for (let attempt = 0; attempt < 100; attempt++) {
      client = new Client({ ...config, user: config.username });
      try { await client.connect(); break; }
      catch { await client.end().catch(() => {}); client = undefined; await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    if (!client) throw Error('Disposable database did not become ready');
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
    if (client) await client.end().catch(() => {});
    try { execFileSync(engine, ['rm', '--force', name], { stdio: 'ignore' }); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
main().catch((error) => { console.error('Runtime integration failed:', error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[database URL omitted]')); process.exitCode = 1; });
