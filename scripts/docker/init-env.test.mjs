import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { environmentFiles, initializeDockerEnv } from './init-env.mjs';

const parse = (directory, file) => Object.fromEntries(
  readFileSync(path.join(directory, file), 'utf8').split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

function temporaryDirectory(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'idpcore-env-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('fresh setup produces coordinated credentials and leaves paid providers disabled', (t) => {
  const directory = temporaryDirectory(t);
  assert.equal(initializeDockerEnv(directory).length, environmentFiles.length);
  const postgres = parse(directory, 'env/postgres.env');
  const core = parse(directory, 'env/core.env');
  const ide = parse(directory, 'env/ide.env');
  const auth = parse(directory, 'env/auth.env');
  const agent = parse(directory, 'env/container-agent.env');
  const monitoring = parse(directory, 'env/monitoring.env');
  assert.match(postgres.POSTGRES_PASSWORD, /^[a-f0-9]{64}$/);
  for (const url of [core.DATABASE_URL, ide.DATABASE_URL, ide.CORE_DATABASE_URL, auth.DATABASE_URL]) {
    assert.equal(new URL(url).password, postgres.POSTGRES_PASSWORD);
  }
  assert.equal(core.DB_PASS, postgres.POSTGRES_PASSWORD);
  assert.equal(core.ENCRYPTION_KEY, ide.ENCRYPTION_KEY);
  assert.equal(Buffer.from(core.ENCRYPTION_KEY, 'hex').length, 32);
  assert.notEqual(core.ENCRYPTION_KEY, core.TOKEN_SECRET);
  assert.equal(auth.AUTH_INTERNAL_API_TOKEN, ide.IDE_AUTH_SERVICE_TOKEN);
  assert.equal(core.AGENT_CONTAINER_MANAGER_TOKEN, agent.CONTAINER_MANAGER_TOKEN);
  assert.equal(ide.AGENT_CONTAINER_MANAGER_TOKEN, agent.CONTAINER_MANAGER_TOKEN);
  assert.equal(agent.CONTAINER_MANAGER_MONITORING_INGEST_TOKEN, monitoring.MONITORING_INGEST_TOKEN);
  assert.equal(core.MONITORING_SERVER_TOKEN, monitoring.MONITORING_SERVER_TOKEN);
  assert.equal(ide.MONITORING_INGEST_TOKEN, monitoring.MONITORING_INGEST_TOKEN);
  assert.equal(auth.AUTH_OTP_SMS_PROVIDER, 'none');
  assert.equal(auth.AUTH_OTP_SMS_GHASEDAK_API_KEY, '');
  assert.equal(ide.AI_API_KEY, '');
  if (process.platform !== 'win32') {
    for (const file of environmentFiles) assert.equal(statSync(path.join(directory, file)).mode & 0o777, 0o600);
  }
});

test('repeated setup keeps all existing credentials byte for byte', (t) => {
  const directory = temporaryDirectory(t);
  initializeDockerEnv(directory);
  const before = environmentFiles.map((file) => readFileSync(path.join(directory, file)));
  assert.deepEqual(initializeDockerEnv(directory), []);
  for (const [index, file] of environmentFiles.entries()) {
    assert.deepEqual(readFileSync(path.join(directory, file)), before[index]);
  }
});

test('different installations receive different credentials', (t) => {
  const first = temporaryDirectory(t);
  const second = temporaryDirectory(t);
  initializeDockerEnv(first);
  initializeDockerEnv(second);
  assert.notEqual(parse(first, 'env/core.env').ENCRYPTION_KEY, parse(second, 'env/core.env').ENCRYPTION_KEY);
});

test('partial setup fails without creating files or replacing credentials', (t) => {
  const directory = temporaryDirectory(t);
  const original = 'existing-private-environment\n';
  writeFileSync(path.join(directory, '.env'), original);
  assert.throws(() => initializeDockerEnv(directory), /Incomplete Docker environment/);
  assert.equal(readFileSync(path.join(directory, '.env'), 'utf8'), original);
  assert.equal(existsSync(path.join(directory, 'env')), false);
});

test('invalid templates fail before writing private configuration', (t) => {
  const target = temporaryDirectory(t);
  const templates = temporaryDirectory(t);
  for (const file of environmentFiles) {
    const destination = path.join(templates, `${file}.example`);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, 'TOKEN=replace_with_unknown_secret\n');
  }
  assert.throws(() => initializeDockerEnv(target, templates), /Unknown placeholder/);
  for (const file of environmentFiles) assert.equal(existsSync(path.join(target, file)), false);
});
