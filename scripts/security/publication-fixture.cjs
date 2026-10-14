const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const shared = require('@idp/shared');
const { load, actor } = require('../../src/ideNew/tests/security-harness.cjs');
const styleAccess = load('src/lib/shared-project-access.ts');
const permissions = load('src/lib/tenant-permissions.ts');
const tailwind = load('src/lib/tailwindBuilder.ts');

exports.publicationTools = (source, tenantId) => {
  const access = { assertTenantReadableForUser: async (_user, id) => {
    if (id !== tenantId) throw Object.assign(new Error('Forbidden tenant'), { statusCode: 403 });
  } };
  const items = load('src/lib/publish-request-access.ts', {
    './core-db': { CoreDataSource: source }, './tenant-permissions': permissions,
    './shared-project-access': styleAccess, '@idp/shared': shared,
  });
  const publisher = load('src/lib/publication/publish-item.ts', {
    '@idp/shared': shared, '../shared-project-access': styleAccess,
  });
  const approve = load('src/lib/publication/approve-request.ts', {
    '@idp/shared': shared, '../team-tenant-access': access,
    '../publish-request-access': items, './publish-item': publisher,
    '../version': { generateVersion: () => require('node:crypto').randomUUID() },
  });
  const styles = load('src/lib/publication/style-snapshot.ts', { '@idp/shared': shared, '../tailwindBuilder': tailwind });
  const current = load('src/lib/publication/publish-current.ts', {
    '@idp/shared': shared, './publish-item': publisher, './style-snapshot': styles,
    '../version': { generateVersion: () => require('node:crypto').randomUUID() },
  });
  return { ...approve, ...current, ...styles, user: actor('platform_admin') };
};

exports.publicationFixture = async (source, withPackages = false) => {
  const suffix = require('node:crypto').randomBytes(5).toString('hex');
  const tenant = await source.getRepository(shared.Tenant).save({ hostname: `safety-${suffix}.example.test` });
  const user = await source.getRepository(shared.User).save({ email: `safety-${suffix}@example.test`, role: 'admin' });
  const mod = await source.getRepository(shared.ModuleEntity).save({ tenant, routePath: '/old', method: shared.HttpMethod.GET,
    sourceCode: { code: 'draft' }, publishedSourceCode: { code: 'old-module' }, publishedVersion: 'old' });
  const records = [[shared.ModuleEntity, mod]];
  const items = [{ kind: 'module', id: mod.id, title: '/new', data: { code: 'submitted-module', routePath: '/new', method: 'GET', fileExtension: 'js' } }];
  if (withPackages) {
    for (const [entity, kind, sharedType, name] of [
      [shared.UIPackage, 'ui', undefined, `page-${suffix}`, false],
      [shared.GlobalModulePackage, 'shared', 'backend', `backend-${suffix}`, false],
      [shared.GlobalUIPackage, 'shared', 'ui', `shared-${suffix}`, false],
    ]) {
      const row = await source.getRepository(entity).save({ ...(kind === 'ui' ? { tenant } : {}), name, version: '1.0.0',
        sourceCode: { code: 'draft' }, compiledCode: { code: 'draft-bundle' }, dependencies: [], fileExtension: 'js',
        publishedSourceCode: { code: 'old-package' }, publishedCompiledCode: { code: 'old-bundle' }, publishedVersion: 'old' });
      records.push([entity, row]);
      items.push({ kind, sharedType, id: row.id, title: name, data: { name, version: '1.0.0', code: 'submitted-package', codeBlob: 'submitted-bundle', dependencies: [], fileExtension: 'js' } });
      if (sharedType === 'backend') continue;
      const style = await source.getRepository(entity).save({ ...(kind === 'ui' ? { tenant } : {}), name: `${name}__tw`, version: '1.0.0',
        sourceCode: { code: 'submitted-css' }, compiledCode: { code: 'submitted-css' }, fileExtension: 'css', dependencies: [],
        publishedSourceCode: { code: 'old-css' }, publishedCompiledCode: { code: 'old-css' }, publishedVersion: 'old' });
      records.push([entity, style]);
    }
  }
  const tools = exports.publicationTools(source, tenant.id);
  await tools.snapshotPublicationStyles(items, tenant.id, source.manager);
  const request = await source.getRepository(shared.PublishRequest).save({ tenant, requester: user, comment: 'native safety fixture', items, status: shared.PublishRequestStatus.PENDING });
  return { ...tools, tenant, approver: user, records, request, items, mod };
};

exports.coreModule = (file, source, cache) => {
  const root = path.resolve(__dirname, '../../src/core');
  const mocks = {
    '../../core/publishedCache': { publishedCache: cache }, '../../common/devAccess': { isDeveloperAccess: () => false },
    '../../core/globalDatasource': { resolveGlobalDataSource: async () => source },
    '../registry/globalPackages': { resolveGlobalPackage: () => null },
    '../registry/npmPackageResolver': { resolveNpmRegistryPackage: async () => { throw Error('Unexpected npm fallback'); } },
  };
  const loaded = new Map();
  function read(target) {
    if (loaded.has(target)) return loaded.get(target);
    const code = ts.transpileModule(fs.readFileSync(target, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: target,
    }).outputText;
    const module = { exports: {} }; loaded.set(target, module.exports);
    const resolve = (id) => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('.')
      ? read(path.resolve(path.dirname(target), `${id}.ts`)) : require(id);
    new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
    loaded.set(target, module.exports); return module.exports;
  }
  return read(path.join(root, file));
};
