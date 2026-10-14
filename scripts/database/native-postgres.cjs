const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomBytes } = require('node:crypto');
const { Client } = require('pg');

// Reuse the workstation's one shared service; never provision an instance.
exports.nativePostgres = async () => {
  const privateFile = path.join(os.homedir(), '.local/share/local-infra/postgres.private.env');
  const settings = {};
  if (fs.existsSync(privateFile)) for (const line of fs.readFileSync(privateFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) value = value.slice(1, -1);
    settings[match[1]] = value;
  }
  const host = process.env.TEST_PGHOST || settings.PGHOST || '127.0.0.1';
  const port = Number(process.env.TEST_PGPORT || settings.PGPORT || 5432);
  if (host !== '127.0.0.1' || port !== 5432) throw Error('Native tests require the shared PostgreSQL at 127.0.0.1:5432');
  const admin = new Client({ host, port, user: process.env.TEST_PGUSER || settings.PGUSER || settings.POSTGRES_USER,
    password: process.env.TEST_PGPASSWORD || settings.PGPASSWORD || settings.POSTGRES_PASSWORD,
    database: 'postgres', connectionTimeoutMillis: 5000 });
  const suffix = randomBytes(8).toString('hex');
  const database = `runtessa_safety_${suffix}`, username = `runtessa_safety_role_${suffix}`;
  const password = randomBytes(24).toString('hex');
  let roleCreated = false, databaseCreated = false, stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    try {
      if (databaseCreated) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      if (roleCreated) await admin.query(`DROP ROLE "${username}"`);
    } finally { await admin.end(); }
  };
  try {
    await admin.connect();
    await admin.query(`CREATE ROLE "${username}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    roleCreated = true;
    await admin.query(`CREATE DATABASE "${database}" OWNER "${username}"`);
    databaseCreated = true;
    return { config: { type: 'postgres', host, port, database, username, password, synchronize: false, installExtensions: false, logging: false }, stop };
  } catch (error) { await stop().catch(() => {}); throw error; }
};
