const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Client } = require('pg');

const findContainerEngine = () => {
  const engine = ['podman', 'docker'].find((candidate) => {
    try { execFileSync(candidate, ['version'], { stdio: 'ignore' }); return true; } catch { return false; }
  });
  if (!engine) throw Error('A local Podman or Docker engine is required');
  return engine;
};
exports.findContainerEngine = findContainerEngine;

exports.disposablePostgres = async ({ network } = {}) => {
  const engine = findContainerEngine();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-schema-test-'));
  const name = `idpcore-schema-test-${process.pid}-${randomBytes(4).toString('hex')}`;
  const password = randomBytes(24).toString('hex');
  const envFile = path.join(directory, 'postgres.env');
  fs.writeFileSync(envFile, `POSTGRES_USER=idp_schema_test\nPOSTGRES_PASSWORD=${password}\nPOSTGRES_DB=postgres\n`, { mode: 0o600 });
  const stop = async () => {
    try { execFileSync(engine, ['rm', '--force', name], { stdio: 'ignore' }); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  };
  try {
    execFileSync(engine, ['run', '--detach', '--rm', '--name', name, '--env-file', envFile,
      ...(network ? ['--network', network] : []),
      '--publish', '127.0.0.1::5432', 'docker.io/library/postgres:17-alpine'], { stdio: 'ignore' });
    const port = Number(execFileSync(engine, ['port', name, '5432/tcp'], { encoding: 'utf8' }).trim().split(':').at(-1));
    const config = { type: 'postgres', host: '127.0.0.1', port, username: 'idp_schema_test', password,
      database: 'postgres', synchronize: false, installExtensions: false, logging: false };
    let lastCode = 'unavailable';
    for (let attempt = 0; attempt < 200; attempt++) {
      const client = new Client({ ...config, user: config.username, connectionTimeoutMillis: 1000 });
      try { await client.connect(); await client.end(); return { config, stop, engine, name }; }
      catch (error) {
        if (/^[A-Z0-9_]+$/.test(error.code || '')) lastCode = error.code;
        await client.end().catch(() => {}); await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
    throw Error(`Disposable PostgreSQL did not become ready (${lastCode})`);
  } catch (error) { await stop(); throw error; }
};
