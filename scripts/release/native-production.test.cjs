require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const { DataSource } = require('typeorm');
const { Tenant, ModuleEntity, SourceCode, Secret, HttpMethod } = require('@idp/shared');
const { coreEntities, ideEntities } = require('@idp/shared/dist/database/entities');
const { createRequire } = require('node:module');
const { activateModelSnapshot } = require('@idp/shared/dist/runtime/model-activation');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { runPlatformMigrations } = require('@idp/shared/dist/database/migrate');
const { encryptSecretPayload, decryptSecretPayload } = require('@idp/shared/dist/security/secret-crypto');
const { nativePostgres } = require('../database/native-postgres.cjs');

test('native backup restores authenticated data, encryption keys and files into fresh targets and serves live code under load', async (t) => {
  const { backupInstallation, restoreInstallation } = await import('../operations/recovery.mjs');
  const original = await nativePostgres(), restored = await nativePostgres();
  const otherFixtures = [], sources = [];
  const pairs = {};
  for (const label of ['ide', 'auth', 'tenant']) {
    pairs[label] = [await nativePostgres(), await nativePostgres()]; otherFixtures.push(...pairs[label]);
  }
  const source = new DataSource({ ...original.config, entities: coreEntities });
  const target = new DataSource({ ...restored.config, entities: coreEntities });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'runtessa-native-rehearsal-'));
  const uploads = path.join(directory, 'uploads'), recoveredFiles = path.join(directory, 'recovered-files');
  fs.mkdirSync(uploads, { mode: 0o700 }); fs.mkdirSync(recoveredFiles, { mode: 0o700 });
  fs.writeFileSync(path.join(uploads, 'reference.txt'), 'restored attachment');
  let server;
  t.after(async () => {
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
    if (source.isInitialized) await source.destroy(); if (target.isInitialized) await target.destroy();
    for (const dataSource of sources) if (dataSource.isInitialized) await dataSource.destroy();
    for (const fixture of otherFixtures) await fixture.stop();
    await original.stop(); await restored.stop(); fs.rmSync(directory, { recursive: true, force: true });
  });
  await source.initialize(); await runPlatformMigrations(source, 'core');
  const sourceFor = async (label, entities = []) => {
    const dataSource = new DataSource({ ...pairs[label][0].config, entities }); sources.push(dataSource); await dataSource.initialize(); return dataSource;
  };
  const ideSource = await sourceFor('ide', ideEntities); await runPlatformMigrations(ideSource, 'ide');
  process.env.AUTH_MIGRATION_DIR = path.resolve('src/auth/migrations');
  process.env.AUTH_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.DATABASE_URL = `postgresql://${pairs.auth[0].config.username}:${pairs.auth[0].config.password}@127.0.0.1:5432/${pairs.auth[0].config.database}`;
  const authSource = await sourceFor('auth');
  const authRequire = createRequire(path.resolve('src/auth/package.json'));
  await authRequire('./dist/lib/typeorm/migrations').runSqlMigrations(authSource);
  const tenantSource = await sourceFor('tenant');
  process.env.RUNTIME_EGRESS_ALLOW = '127.0.0.1:5432';
  const key = crypto.randomBytes(32), passphrase = crypto.randomBytes(32).toString('hex');
  const tenant = await source.getRepository(Tenant).save({ hostname: '127.0.0.1', resourceConfig: { memory: 128, timeout: 15000 },
    adapterAccess: { postgres: { allow: ['tasks'] } },
    aclEndpoints: { '/api/hello': { allowAnonymous: true }, '/api/hold': { allowAnonymous: true }, '/api/tasks': { allowAnonymous: true } } });
  const modelSources = [{path:'Task.js',code:"const{Entity,PrimaryGeneratedColumn,Column}=require('typeorm');class Task{}Entity('rehearsal_tasks')(Task);PrimaryGeneratedColumn()(Task.prototype,'id');Column({type:'text'})(Task.prototype,'title');module.exports={Task};"}];
  await activateModelSnapshot({source,tenantId:tenant.id,adapter:'postgres',key:'tasks',config:pairs.tenant[0].config,
    readModels:async()=>modelSources,migrate:(models,adapter,config,options)=>runRestrictedProcess({
      entrypoint:require.resolve('@idp/shared/dist/runtime/ormMigrationProcess'),readOnlyRoots:runtimeDependencyRoots(),
      timeoutMs:30000,memoryMb:256,input:{models,adapter,config,...options},
    })});
  await tenantSource.query("INSERT INTO rehearsal_tasks(title) VALUES ('Recovered task')");
  await source.getRepository(Secret).save({tenant,keyName:'postgres:tasks',...encryptSecretPayload(JSON.stringify(pairs.tenant[0].config),key)});
  await source.getRepository(Secret).save({ tenant, keyName: 'restore-canary', ...encryptSecretPayload('retained-private-value', key) });
  const published = await source.getRepository(SourceCode).save({ code: "module.exports=async()=>({statusCode:200,body:{message:'restored-live-code'}})" });
  const holding = await source.getRepository(SourceCode).save({ code: "module.exports=async()=>{const until=Date.now()+1200;while(Date.now()<until){};return {statusCode:200,body:{ok:true}}}" });
  const tasks = await source.getRepository(SourceCode).save({code:"module.exports=async(_request,adapters)=>{const orm=await adapters.orm('tasks');return {body:await orm.getRepository('Task').find()};}"});
  for (const [routePath, code] of [['/api/hello', published], ['/api/hold', holding], ['/api/tasks',tasks]]) await source.getRepository(ModuleEntity).save({
    tenant, routePath, method: HttpMethod.GET, publishedRoutePath: routePath, publishedMethod: HttpMethod.GET,
    publishedSourceCode: code, publishedVersion: 'restore-v1', publishedFileExtension: 'js',
  });
  const backup = path.join(directory, 'backup');
  const backupDatabases = [{label:'core',config:original.config}, ...Object.entries(pairs).map(([label,pair])=>({label,config:pair[0].config}))];
  const restoreDatabases = [{label:'core',config:restored.config}, ...Object.entries(pairs).map(([label,pair])=>({label,config:pair[1].config}))];
  const result = await backupInstallation({ directory: backup, passphrase, encryptionKey: key.toString('hex'),
    databases: backupDatabases, files: [{ label: 'uploads', root: uploads }] });
  assert.equal(result.parts, 5);
  await assert.rejects(restoreInstallation({ directory: backup, passphrase: crypto.randomBytes(32).toString('hex'),
    databases: restoreDatabases, files: [{ label: 'uploads', root: recoveredFiles }], keyOutput: path.join(directory, 'wrong-key') }), /authenticated/);
  await target.initialize();
  assert.equal((await target.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public'"))[0].count, 0);
  const recoveredKeyFile = path.join(directory, 'recovered-key');
  await restoreInstallation({ directory: backup, passphrase, databases: restoreDatabases,
    files: [{ label: 'uploads', root: recoveredFiles }], keyOutput: recoveredKeyFile });
  assert.equal(fs.readFileSync(path.join(recoveredFiles, 'reference.txt'), 'utf8'), 'restored attachment');
  const recoveredKey = Buffer.from(fs.readFileSync(recoveredKeyFile, 'utf8').trim(), 'hex');
  const secret = await target.getRepository(Secret).findOneBy({ keyName: 'restore-canary' });
  assert.equal(decryptSecretPayload(secret, [recoveredKey]), 'retained-private-value');
  assert.equal((await target.query('SELECT count(*)::int AS count FROM idp_schema_migrations'))[0].count, 4);
  for(const [label,pair]of Object.entries(pairs)){
    const dataSource=new DataSource({...pair[1].config,entities:[]});sources.push(dataSource);await dataSource.initialize();
    const table=label==='auth'?'schema_migrations':label==='ide'?'idp_schema_migrations':'rehearsal_tasks';
    assert.ok((await dataSource.query(`SELECT count(*)::int AS count FROM ${table}`))[0].count>0);
  }
  await target.getRepository(Secret).update({keyName:'postgres:tasks'},encryptSecretPayload(JSON.stringify(pairs.tenant[1].config),recoveredKey));
  await assert.rejects(restoreInstallation({ directory: backup, passphrase, databases: [{ label: 'core', config: restored.config }],
    files: [{ label: 'uploads', root: recoveredFiles }], keyOutput: path.join(directory, 'extra-key') }), /empty destination/);
  const probe = net.createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const env = { PATH: process.env.PATH, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
    DB_HOST: restored.config.host, DB_PORT: '5432', DB_USER: restored.config.username, DB_PASS: restored.config.password,
    DB_NAME: restored.config.database, ENCRYPTION_KEY: recoveredKey.toString('hex'), TOKEN_SECRET: crypto.randomBytes(32).toString('hex'),
    MONITORING_DISABLED: 'true', CORE_ADAPTER_STAGE: 'publish', DOTENV_CONFIG_PATH: path.join(directory, 'absent.env'), RUNTIME_CGROUP_ROOT: process.env.RUNTIME_CGROUP_ROOT || '',
    RUNTIME_EGRESS_ALLOW: '127.0.0.1:5432',
  };
  server = spawn(process.execPath, ['dist/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.resume(); server.stderr.resume();
  const base = `http://127.0.0.1:${port}`;
  const request = (route) => fetch(base + route, { signal: AbortSignal.timeout(30000) });
  let ready = false, lastStatus;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw Error('Native production service exited');
    try { const response = await request('/api/hello'); lastStatus = [response.status, await response.text()]; if (response.status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, JSON.stringify(lastStatus));
  const ormResponse = await request('/api/tasks');
  assert.equal(ormResponse.status, 200);
  assert.equal((await ormResponse.json())[0].title,'Recovered task');
  const durations = [];
  for (let batch = 0; batch < 6; batch++) await Promise.all(Array.from({ length: 4 }, async () => {
    const start = performance.now(), response = await request('/api/hello');
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { message: 'restored-live-code' }); durations.push(performance.now() - start);
  }));
  const saturated = await Promise.all(Array.from({ length: 20 }, async () => {const response = await request('/api/hold'); const body = await response.text(); if (![200,503].includes(response.status)) console.log('Hold failure:', response.status, body); return response.status;}));
  assert.ok(saturated.includes(503)); assert.ok(saturated.includes(200), JSON.stringify(saturated));
  assert.equal((await request('/api/hello')).status, 200);
  durations.sort((a,b) => a-b);
  const report = { recoveredDatabaseParts: 4, recoveredFileParts: 1, publishedOrm: true, host: `${os.platform()} ${os.release()}`, node: process.version, requests: durations.length, concurrency: 4,
    p50Ms: Math.round(durations[Math.floor(durations.length * .5)]), p95Ms: Math.round(durations[Math.floor(durations.length * .95)]),
    saturation: { accepted: saturated.filter(status => status === 200).length, rejected: saturated.filter(status => status === 503).length } };
  fs.mkdirSync('.release-preview/production-hardening', { recursive: true });
  fs.writeFileSync('.release-preview/production-hardening/native-rehearsal.json', JSON.stringify(report, null, 2));
  console.log('Native recovery/load rehearsal:', JSON.stringify(report));
});
