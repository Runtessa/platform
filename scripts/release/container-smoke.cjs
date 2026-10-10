// Build and exercise the actual Core image with an isolated disposable database.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DataSource } = require('typeorm');
const { Tenant, SourceCode, ModuleEntity, HttpMethod } = require('@idp/shared');
const { coreEntities } = require('@idp/shared/dist/database/entities');
const { disposablePostgres, findContainerEngine } = require('../database/disposable-postgres.cjs');

const main = async () => {
  const engine = findContainerEngine();
  const suffix = randomBytes(6).toString('hex');
  const image = `localhost/idpcore-release-check:${suffix}`;
  const network = `idpcore-release-network-${suffix}`;
  const name = `idpcore-release-http-${suffix}`;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-container-smoke-'));
  let database, source, phase = 'image build';
  const command = args => execFileSync(engine, args, { stdio: 'ignore' });
  try {
    execFileSync(engine, ['build', '--tag', image, '--file', 'src/core/Dockerfile', '.'],
      { stdio: 'inherit' });
    phase = 'test network';
    command(['network', 'create', network]);
    database = await disposablePostgres({ network });
    const env = { NODE_ENV: 'production', PORT: '3005', DB_HOST: database.name,
      DB_PORT: '5432', DB_USER: database.config.username, DB_PASS: database.config.password,
      DB_NAME: database.config.database, ENCRYPTION_KEY: randomBytes(32).toString('hex'),
      TOKEN_SECRET: randomBytes(32).toString('hex'), CACHE_REDIS_URL: '', CORE_SSO_AUTH_BASE_URL: '' };
    const envFile = path.join(directory, 'synthetic.env');
    fs.writeFileSync(envFile, Object.entries(env).map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
      { mode: 0o600 });
    const policy = ['--network', network, '--env-file', envFile, '--cap-drop=all',
      '--security-opt=no-new-privileges', '--security-opt=seccomp=./docker/runtime/seccomp.json'];
    // Explicit diagnostics for this disposable fixture only; never a deployment fallback.
    if (process.argv.includes('--selinux-diagnostic')) policy.push('--security-opt=label=disable');
    phase = 'packaged migration';
    command(['run', '--rm', ...policy, image, 'npm', 'run', 'db:migrate']);
    source = new DataSource({ ...database.config, entities: coreEntities });
    await source.initialize();
    const tenant = await source.getRepository(Tenant).save({ hostname: 'localhost',
      aclEndpoints: { '/api/hello': { allowAnonymous: true } }, resourceConfig: { timeout: 5000, memory: 128 } });
    const code = await source.getRepository(SourceCode).save({
      code: 'module.exports = async () => ({statusCode:200,body:{message:"packaged-live-code"}})' });
    await source.getRepository(ModuleEntity).save({ tenant, sourceCode: code,
      routePath: '/api/hello', method: HttpMethod.GET, publishedSourceCode: code,
      publishedRoutePath: '/api/hello', publishedMethod: HttpMethod.GET,
      publishedFileExtension: 'js', publishedVersion: '1.0.0' });
    phase = 'packaged HTTP startup';
    command(['run', '--detach', '--name', name, '--publish', '127.0.0.1::3005', ...policy, image]);
    const port = Number(execFileSync(engine, ['port', name, '3005/tcp'], { encoding: 'utf8' })
      .trim().split(':').at(-1));
    let response;
    for (let attempt = 0; attempt < 150; attempt++) {
      try {
        response = await fetch(`http://localhost:${port}/api/hello`, {
          signal: AbortSignal.timeout(2000) });
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.equal(response?.status, 200, `Unexpected synthetic HTTP status: ${response?.status}`);
    assert.deepEqual(await response.json(), { message: 'packaged-live-code' });
    phase = 'packaged TypeScript compiler';
    command(['exec', '--env', 'NODE_PATH=/app/src/core/node_modules', name, 'node', '-e', `
      const {compileOrmSource}=require('/app/dist/core/orm-compiler');
      const compiled=compileOrmSource('const label: string = "live-ts"; module.exports = label;');
      const output={exports:{}}; new Function('module',compiled)(output);
      if(output.exports!=="live-ts")throw Error('Runtime compiler missing');
    `]);
    console.log('Core image migration, HTTP ingress, restricted live code and TypeScript compiler passed.');
  } catch {
    throw Error(`Disposable Core image check failed during ${phase}; inspect host policy and packaging.`);
  } finally {
    try { command(['rm', '--force', name]); } catch {}
    if (source?.isInitialized) await source.destroy();
    if (database) await database.stop();
    try { command(['network', 'rm', network]); } catch {}
    try { command(['image', 'rm', image]); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
main().catch(error => { console.error(error.message); process.exitCode = 1; });
