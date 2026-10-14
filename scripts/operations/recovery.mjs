import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';
import { once } from 'node:events';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');
const { sealRecoveryBundle, openRecoveryBundle } = require('../../src/packages/shared/dist/security/recovery-bundle');

const pgArguments = (config) => ['--host', config.host, '--port', String(config.port), '--username', config.username || config.user, '--dbname', config.database];
const pgEnvironment = (config) => ({ PATH: process.env.PATH, PGPASSWORD: config.password });
const validLabel = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{0,40}$/.test(value);
const derive = (passphrase, salt) => scryptSync(passphrase, salt, 32);

async function validateArchiveRoot(root) {
  const base = await fs.realpath(root);
  const walk = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        const target = await fs.readlink(filename), resolved = await fs.realpath(filename);
        if (path.isAbsolute(target) || (resolved !== base && !resolved.startsWith(base + path.sep)))
          throw new Error('Backup filesystem roots cannot contain links outside their root');
      } else if (entry.isDirectory()) await walk(filename);
      else if (!entry.isFile()) throw new Error('Backup roots may contain only regular files and directories');
    }
  };
  await walk(base);
}

async function encryptProcess(command, args, env, filename, passphrase) {
  const salt = randomBytes(16), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', derive(passphrase, salt), iv);
  cipher.setAAD(Buffer.from('runtessa-backup-part:v1'));
  const target = createWriteStream(filename, { flags: 'wx', mode: 0o600 });
  target.write(Buffer.concat([Buffer.from('RUNTESSA1'), salt, iv]));
  const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.resume(); const exited = once(child, 'exit');
  try {
    await pipeline(child.stdout, cipher, target, { end: false });
    if ((await exited)[0] !== 0) throw new Error('Backup command failed');
    target.end(cipher.getAuthTag()); await once(target, 'close');
  } catch (error) { child.kill('SIGKILL'); target.destroy(); throw error; }
}

async function partReader(filename, passphrase) {
  const handle = await fs.open(filename, 'r');
  try {
    const stat = await handle.stat(), header = Buffer.alloc(37), tag = Buffer.alloc(16);
    if (stat.size < 53 || (stat.mode & 0o077)) throw new Error('Backup part must be private and complete');
    await handle.read(header, 0, 37, 0); await handle.read(tag, 0, 16, stat.size - 16);
    if (header.subarray(0, 9).toString() !== 'RUNTESSA1') throw new Error('Invalid backup part');
    const cipher = () => {
      const decoder = createDecipheriv('aes-256-gcm', derive(passphrase, header.subarray(9, 25)), header.subarray(25, 37));
      decoder.setAAD(Buffer.from('runtessa-backup-part:v1')); decoder.setAuthTag(tag); return decoder;
    };
    const read = () => createReadStream(filename, { fd: handle.fd, autoClose: false, start: 37, end: stat.size - 17 });
    // Authenticate the complete part before any database or filesystem writes.
    await pipeline(read(), cipher(), new Writable({ write(_chunk, _encoding, callback) { callback(); } }));
    return { read, cipher, close: () => handle.close() };
  } catch { await handle.close(); throw new Error('Backup part could not be authenticated'); }
}

export async function backupInstallation({ directory, passphrase, encryptionKey, databases, files = [] }) {
  if (!databases.length || !/^[a-f0-9]{64}$/i.test(encryptionKey) || passphrase.length < 24) throw new Error('Incomplete recovery configuration');
  const labels = [...databases, ...files].map((part) => part.label);
  if (labels.some((label) => !validLabel(label)) || new Set(labels).size !== labels.length) throw new Error('Invalid or duplicate backup labels');
  await fs.mkdir(directory, { mode: 0o700 });
  const parts = [];
  try {
    for (const { label, config } of databases) {
      const name = `${label}.dump.enc`;
      await encryptProcess('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', ...pgArguments(config)], pgEnvironment(config), path.join(directory, name), passphrase);
      parts.push({ label, name, kind: 'database' });
    }
    for (const { label, root } of files) {
      await validateArchiveRoot(root);
      const name = `${label}.tar.enc`;
      await encryptProcess('tar', ['--create', '--gzip', '--file=-', '--directory', root, '.'], { PATH: process.env.PATH }, path.join(directory, name), passphrase);
      parts.push({ label, name, kind: 'files' });
    }
    await fs.writeFile(path.join(directory, 'manifest.enc'), sealRecoveryBundle(Buffer.from(JSON.stringify({ version: 1, encryptionKey, parts })), passphrase), { flag: 'wx', mode: 0o600 });
    return { parts: parts.length };
  } catch (error) { await fs.rm(directory, { recursive: true, force: true }); throw error; }
}

export async function restoreInstallation({ directory, passphrase, databases, files = [], keyOutput }) {
  const manifest = JSON.parse(openRecoveryBundle(await fs.readFile(path.join(directory, 'manifest.enc')), passphrase));
  if (manifest.version !== 1 || !Array.isArray(manifest.parts)) throw new Error('Invalid recovery manifest');
  // Preflight the complete backup and every destination before starting the first restore.
  const readers = [];
  try {
    for (const part of manifest.parts) {
      if (!['database', 'files'].includes(part.kind) || !validLabel(part.label) || part.name !== `${part.label}.${part.kind === 'database' ? 'dump' : 'tar'}.enc`) throw new Error('Invalid backup part name');
      const destination = (part.kind === 'database' ? databases : files).find((item) => item.label === part.label);
      if (!destination) throw new Error('A recovery destination is missing');
      if (part.kind === 'database') {
        const client = new Client({ ...destination.config, user: destination.config.username || destination.config.user });
        try {
          await client.connect();
          const result = await client.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')");
          if (result.rows[0].count) throw new Error('Recovery requires an empty destination database');
        } finally { await client.end(); }
      } else if ((await fs.readdir(destination.root)).length) throw new Error('Recovery requires an empty destination directory');
      readers.push({ ...part, destination, reader: await partReader(path.join(directory, part.name), passphrase) });
    }
    await fs.writeFile(keyOutput, manifest.encryptionKey + '\n', { flag: 'wx', mode: 0o600 });
    for (const part of readers) {
      const command = part.kind === 'database' ? 'pg_restore' : 'tar';
      const args = part.kind === 'database' ? ['--single-transaction', '--no-owner', '--no-privileges', ...pgArguments(part.destination.config)]
        : ['--extract', '--gzip', '--file=-', '--directory', part.destination.root, '--no-same-owner', '--no-same-permissions'];
      const env = part.kind === 'database' ? pgEnvironment(part.destination.config) : { PATH: process.env.PATH };
      const child = spawn(command, args, { env, stdio: ['pipe', 'ignore', 'pipe'] });
      child.stderr.resume(); const exited = once(child, 'exit');
      try { await pipeline(part.reader.read(), part.reader.cipher(), child.stdin); if ((await exited)[0] !== 0) throw new Error('Recovery command failed'); }
      catch (error) { child.kill('SIGKILL'); throw error; }
    }
    return { parts: readers.length };
  } finally { await Promise.all(readers.map((part) => part.reader.close())); }
}
