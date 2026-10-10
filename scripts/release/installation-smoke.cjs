require('reflect-metadata');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const { DataSource } = require('typeorm');
const { Client } = require('pg');
const { Tenant, ModuleEntity, SourceCode, HttpMethod } = require('@idp/shared');
const { coreEntities, ideEntities } = require('@idp/shared/dist/database/entities');
const { runPlatformMigrations } = require('@idp/shared/dist/database/migrate');
const { disposablePostgres } = require('../database/disposable-postgres.cjs');
const { CryptoService } = require('../../dist/core/security/CryptoService');

const main = async () => {
  const db = await disposablePostgres();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-install-smoke-'));
  let source, child;
  try {
    const { initializeDockerEnv } = await import('../docker/init-env.mjs');
    assert.equal(initializeDockerEnv(directory).length, 8);
    // The real PostgreSQL initialization script runs only inside this disposable container.
    execFileSync(db.engine, ['exec', '--interactive', db.name, 'sh'], {
      input: fs.readFileSync('docker/postgres/init-multiple-dbs.sh'), stdio: ['pipe', 'ignore', 'pipe'],
    });
    const client = new Client({ ...db.config, user: db.config.username });
    await client.connect();
    try {
      const rows = await client.query('SELECT datname FROM pg_database');
      for (const name of ['idpcore', 'idpnext', 'idp_auth']) {
        assert.ok(rows.rows.some(row => row.datname === name));
      }
    } finally { await client.end(); }
    source = new DataSource({ ...db.config, database: 'idpcore', entities: coreEntities });
    await source.initialize();
    await runPlatformMigrations(source, 'core');
    const ide = new DataSource({ ...db.config, database: 'idpnext', entities: ideEntities });
    await ide.initialize();
    try { await runPlatformMigrations(ide, 'ide'); } finally { await ide.destroy(); }
    const tenant = await source.getRepository(Tenant).save({ hostname: 'localhost',
      resourceConfig: { memory: 128, timeout: 5000 },
      aclEndpoints: { '/api/hello': { allowAnonymous: true } } });
    const published = await source.getRepository(SourceCode).save({ code: `module.exports = async () => ({
      statusCode: 200, body: {message: 'published-live-code'} });` });
    const draft = await source.getRepository(SourceCode).save({ code: `module.exports = async () => ({
      statusCode: 200, body: {message: 'private-draft'} });` });
    await source.getRepository(ModuleEntity).save({ tenant, routePath: '/api/hello', method: HttpMethod.GET,
      sourceCode: draft, publishedSourceCode: published, publishedRoutePath: '/api/hello',
      publishedMethod: HttpMethod.GET, publishedFileExtension: 'js', publishedVersion: '1.0.0' });

    const portProbe = net.createServer(); portProbe.listen(0, '127.0.0.1');
    await once(portProbe, 'listening'); const port = portProbe.address().port;
    await new Promise(resolve => portProbe.close(resolve));
    const env = { ...process.env, NODE_ENV: 'production', PORT: String(port),
      DB_HOST: db.config.host, DB_PORT: String(db.config.port), DB_USER: db.config.username,
      DB_PASS: db.config.password, DB_NAME: 'idpcore', DATABASE_URL: '',
      CORE_DATABASE_URL: '', CORE_DB_HOST: '', CORE_DB_NAME: '', CORE_DB_USER: '', CORE_DB_PASS: '',
      ENCRYPTION_KEY: randomBytes(32).toString('hex'), TOKEN_SECRET: randomBytes(32).toString('hex'),
      CACHE_REDIS_URL: '', REDIS_URL: '', CORE_SSO_AUTH_BASE_URL: '',
      MONITORING_SERVER_URL: '', MONITORING_INGEST_PROXY_URL: '', CORE_ADMIN_TOKEN: '',
      DOTENV_CONFIG_PATH: path.join(directory, 'absent.env') };
    child = spawn(process.execPath, ['dist/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    // Drain logs without printing installation data on failure.
    child.stdout.resume(); child.stderr.resume();
    const url = `http://localhost:${port}/api/hello`;
    let response;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw Error('Disposable Core exited during startup');
      try { response = await fetch(url); break; } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    assert.equal(response?.status, 200); assert.deepEqual(await response.json(), { message: 'published-live-code' });
    const spoofed = await fetch(url, { headers: { 'x-dev-preview': 'true' } });
    assert.deepEqual(await spoofed.json(), { message: 'published-live-code' });
    const crypto = new CryptoService(Buffer.from(env.ENCRYPTION_KEY, 'hex'), Buffer.from(env.TOKEN_SECRET, 'hex'));
    const token = crypto.signToken({ sub: 'synthetic-developer', tenantId: tenant.id, role: 'DEVELOPER' }, 60);
    const preview = await fetch(url, { headers: { authorization: `Bearer ${token}`, 'x-dev-preview': 'true' } });
    assert.equal(preview.status, 200);
    assert.deepEqual(await preview.json(), { message: 'private-draft' });
    published.code = `module.exports = async () => ({statusCode: 200, body: {message: 'updated-live-code'}});`;
    await source.getRepository(SourceCode).save(published);
    const updated = await fetch(url);
    assert.deepEqual(await updated.json(), { message: 'updated-live-code' });
    console.log('Fresh database initialization, migrations, actual Core HTTP live code and draft isolation passed.');
  } finally {
    if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    if (source?.isInitialized) await source.destroy();
    fs.rmSync(directory, { recursive: true, force: true }); await db.stop();
  }
};
main().catch(() => { console.error('Disposable installation smoke failed; no deployment data was used.'); process.exitCode = 1; });
