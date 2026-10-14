require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const shared = require('@idp/shared');
const { coreEntities } = require('@idp/shared/dist/database/entities');
const { runPlatformMigrations } = require('@idp/shared/dist/database/migrate');
const { nativePostgres } = require('../database/native-postgres.cjs');
const { publicationFixture, coreModule } = require('./publication-fixture.cjs');
const { load, response } = require('../../src/ideNew/tests/security-harness.cjs');
let database, source;
before(async () => {
  database = await nativePostgres(); source = new DataSource({ ...database.config, entities: coreEntities });
  await source.initialize(); await runPlatformMigrations(source, 'core');
});
after(async () => { if (source?.isInitialized) await source.destroy(); if (database) await database.stop(); });
const state = async (entity, id) => source.getRepository(entity).findOne({ where: { id }, relations: ['publishedSourceCode', ...(entity !== shared.ModuleEntity ? ['publishedCompiledCode'] : [])] });
const assertOld = async (fixture) => {
  for (const [entity, row] of fixture.records) assert.equal((await state(entity, row.id)).publishedVersion, 'old');
  assert.equal((await source.getRepository(shared.PublishRequest).findOneBy({ id: fixture.request.id })).status, 'pending');
};

test('backend, frontend, shared packages and submitted CSS publish together; retries and concurrent approvals do not republish', async () => {
  const fixture = await publicationFixture(source, true);
  for (const [entity, row] of fixture.records.filter(([, row]) => row.name?.endsWith('__tw'))) {
    await source.getRepository(entity).update(row.id, { sourceCode: await source.getRepository(shared.SourceCode).save({ code: 'newer-editor-css' }) });
  }
  const results = await Promise.all([fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id), fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id)]);
  const revisions = new Set();
  for (const [entity, row] of fixture.records) {
    const published = await state(entity, row.id); revisions.add(published.publishedVersion);
    assert.equal(published.publishedAt.getTime(), results[0].request.publishedAt.getTime());
    if (row.name?.endsWith('__tw')) assert.equal(published.publishedCode, 'submitted-css');
  }
  assert.equal(revisions.size, 1); assert.ok(!revisions.has('old'));
  assert.equal(results[0].request.status, 'approved'); assert.equal(results[1].request.status, 'approved');
  const count = await source.getRepository(shared.SourceCode).count();
  await fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id);
  assert.equal(await source.getRepository(shared.SourceCode).count(), count);
});

test('failure after earlier items were saved rolls back the whole publication and source rows', async () => {
  const fixture = await publicationFixture(source);
  fixture.request.items.push({ kind: 'ui', id: require('node:crypto').randomUUID(), data: { code: 'missing', fileExtension: 'js' } });
  await source.getRepository(shared.PublishRequest).save(fixture.request);
  const before = await source.getRepository(shared.SourceCode).count();
  await assert.rejects(fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id), /deleted or moved/);
  await assertOld(fixture); assert.equal(await source.getRepository(shared.SourceCode).count(), before);
});

test('failure while saving the final approval rolls back backend, frontend, shared and stylesheet snapshots', async () => {
  const fixture = await publicationFixture(source, true);
  await source.query(`CREATE FUNCTION reject_safety_approval() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.id = '${fixture.request.id}' AND NEW.status = 'approved' THEN RAISE EXCEPTION 'fixture final write failure'; END IF;
    RETURN NEW; END $$`);
  await source.query('CREATE TRIGGER reject_safety_approval BEFORE UPDATE ON publish_requests FOR EACH ROW EXECUTE FUNCTION reject_safety_approval()');
  try {
    await assert.rejects(fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id), /fixture final write failure/);
    await assertOld(fixture);
  } finally { await source.query('DROP TRIGGER reject_safety_approval ON publish_requests'); await source.query('DROP FUNCTION reject_safety_approval()'); }
});

test('approval and rejection racing each other cannot overwrite the winning status', async () => {
  const fixture = await publicationFixture(source);
  await Promise.allSettled([
    fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id),
    source.getRepository(shared.PublishRequest).update({ id: fixture.request.id, status: shared.PublishRequestStatus.PENDING }, { status: shared.PublishRequestStatus.REJECTED }),
  ]);
  const current = await source.getRepository(shared.PublishRequest).findOneBy({ id: fixture.request.id });
  assert.ok(['approved', 'rejected'].includes(current.status));
  assert.equal((await state(shared.ModuleEntity, fixture.mod.id)).publishedCode, current.status === 'approved' ? 'submitted-module' : 'old-module');
});

test('Redis cleanup failure reports a committed publication instead of a failed retryable transaction', async () => {
  const fixture = await publicationFixture(source);
  const handler = load('src/pages/api/publish-requests/[id]/approve.ts', {
    '@idp/shared': shared, '@/lib/api-helpers': { withApiHandler: (handler) => handler },
    '@/lib/auth': { requireAdmin: async () => fixture.user }, '@/lib/team-tenant-access': { assertTenantReadableForUser: async () => {} },
    '@/lib/core-db': { CoreDataSource: source, ensureCoreSchema: async () => {} },
    '@/lib/core-users': { ensureCoreUserIdentity: async () => fixture.approver },
    '@/lib/publish-request-access': { assertPublishRequestItems: async () => {} },
    '@/lib/publication/approve-request': fixture,
    '@/lib/publication/cache-cleanup': load('src/lib/publication/cache-cleanup.ts', {
      '../redis': { __esModule: true, default: { del: async () => { throw Error('fixture Redis outage'); } } },
      '../logger': { logger: { warn: async () => {} } },
    }),
  }).default;
  const res = response(); await handler({ method: 'POST', query: { id: fixture.request.id } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.payload.cacheRefreshPending, true); assert.equal(res.payload.status, 'approved');
  assert.equal((await state(shared.ModuleEntity, fixture.mod.id)).publishedCode, 'submitted-module');
});

test('direct Studio and Runtime publication preserve immutable source snapshots', async () => {
  const fixture = await publicationFixture(source, true);
  for (const [entity, row] of fixture.records.filter(([, row]) => !row.name?.endsWith('__tw'))) {
    const target = { kind: entity === shared.ModuleEntity ? 'module' : entity === shared.UIPackage ? 'ui' : 'shared',
      sharedType: entity === shared.GlobalUIPackage ? 'ui' : 'backend', id: row.id };
    await fixture.publishCurrent(source, target, fixture.tenant.id, fixture.user);
    assert.equal((await state(entity, row.id)).publishedCode, 'draft');
  }
  const cache = { del: async () => {} };
  for (const [entity, className] of [[shared.ModuleEntity, 'ModuleController'], [shared.UIPackage, 'UIEntityController']]) {
    const row = fixture.records.find(([type, row]) => type === entity && !row.name?.endsWith('__tw'))[1];
    const Controller = coreModule(`app/controllers/${className}.ts`, source, cache)[className];
    const controller = new Controller(source), res = response();
    await controller.publish({ tenant: fixture.tenant, params: { id: row.id } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    const draft = await source.getRepository(entity).findOne({ where: { id: row.id }, relations: ['sourceCode', ...(entity === shared.UIPackage ? ['compiledCode'] : [])] });
    await source.getRepository(shared.SourceCode).update(draft.sourceCode.id, { code: 'later draft edit' });
    assert.equal((await state(entity, row.id)).publishedCode, 'draft');
    if (entity === shared.UIPackage) {
      await source.getRepository(shared.CompiledCode).update(draft.compiledCode.id, { code: 'later compiled edit' });
      assert.equal((await state(entity, row.id)).publishedCodeBlob, 'draft-bundle');
    }
  }
});

const memoryCache = () => {
  const values = new Map();
  return { values, get: async (key) => values.get(key) ?? null, set: async (key, value) => values.set(key, value) };
};

test('module serving uses the committed database revision even when old cache entries remain', async () => {
  const fixture = await publicationFixture(source), cache = memoryCache();
  const { loadPublishedModules } = coreModule('app/controllers/publishedModules.ts', source, cache);
  const repo = source.getRepository(shared.ModuleEntity);
  assert.equal((await loadPublishedModules(repo, fixture.tenant.id, 'GET'))[0].code, 'old-module');
  await fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id);
  const modules = await loadPublishedModules(repo, fixture.tenant.id, 'GET');
  assert.equal(modules[0].code, 'submitted-module'); assert.equal(modules[0].routePath, '/new');
  assert.equal(cache.values.size, 2);
});

test('tenant aliases and global registry packages ignore old caches; deleted packages cannot be served', async () => {
  const fixture = await publicationFixture(source, true), cache = memoryCache();
  const { RegistryController } = coreModule('app/controllers/RegistryController.ts', source, cache);
  const controller = new RegistryController(source);
  const ui = fixture.records.find(([entity, row]) => entity === shared.UIPackage && !row.name.endsWith('__tw'))[1];
  const global = fixture.records.find(([entity, row]) => entity === shared.GlobalUIPackage && !row.name.endsWith('__tw'))[1];
  const invoke = async (method, name) => {
    const res = response();
    await controller[method]({ tenant: fixture.tenant, headers: {}, params: { name: `@shared/${name}`, version: 'latest' }, query: {} }, res, (error) => { throw error; });
    return res;
  };
  assert.equal((await invoke('resolveTenantOnly', ui.name)).payload.source, 'old-bundle');
  assert.equal((await invoke('resolve', global.name)).payload.source, 'old-bundle');
  await fixture.approveRequest(source, fixture.request.id, fixture.user, fixture.approver.id);
  assert.equal((await invoke('resolveTenantOnly', ui.name)).payload.source, 'submitted-bundle');
  assert.equal((await invoke('resolve', global.name)).payload.source, 'submitted-bundle');
  assert.equal(cache.values.size, 4);
  await source.getRepository(shared.UIPackage).delete(ui.id);
  assert.equal((await invoke('resolveTenantOnly', ui.name)).statusCode, 404);
});
