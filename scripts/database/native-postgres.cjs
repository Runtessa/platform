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
  const adminConfig = { host, port, user: process.env.TEST_PGUSER || settings.PGUSER || settings.POSTGRES_USER,
    password: process.env.TEST_PGPASSWORD || settings.PGPASSWORD || settings.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 5000 };
  const admin = new Client({ ...adminConfig, database: 'postgres' });
  const suffix = randomBytes(8).toString('hex');
  const database = `runtessa_safety_${suffix}`, username = `runtessa_safety_role_${suffix}`;
  const password = randomBytes(24).toString('hex');
  let roleCreated = false, databaseCreated = false, stopped = false;
  const readers = [];
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    try {
      if (databaseCreated) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      for (const reader of readers) await admin.query(`DROP ROLE "${reader}"`);
      if (roleCreated) await admin.query(`DROP ROLE "${username}"`);
    } finally { await admin.end(); }
  };
  try {
    await admin.connect();
    await admin.query(`CREATE ROLE "${username}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    roleCreated = true;
    await admin.query(`CREATE DATABASE "${database}" OWNER "${username}"`);
    databaseCreated = true;
    // PostgreSQL 14 grants public schema creation to PUBLIC by default. Keep
    // fixtures isolated on every supported CI server without changing template1.
    const scopedAdmin = new Client({ ...adminConfig, database });
    try {
      await scopedAdmin.connect();
      await scopedAdmin.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
      await scopedAdmin.query(`GRANT USAGE, CREATE ON SCHEMA public TO "${username}"`);
    } finally { await scopedAdmin.end(); }
    return { config: { type: 'postgres', host, port, database, username, password, synchronize: false, installExtensions: false, logging: false }, stop,
      async createReader() {
        const reader = `runtessa_reader_${randomBytes(8).toString('hex')}`, readerPassword = randomBytes(24).toString('hex');
        await admin.query(`CREATE ROLE "${reader}" LOGIN PASSWORD '${readerPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE`); readers.push(reader);
        return { username: reader, password: readerPassword };
      },
    };
  } catch (error) { await stop().catch(() => {}); throw error; }
};
