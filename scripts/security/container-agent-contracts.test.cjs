const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('../../src/container-agent/lib/env');
const helpers = require('../../src/container-agent/lib/dockerHelpers');
const { createContainerHandlers } = require('../../src/container-agent/lib/orchestrator-handlers-containers');
const { registerContainerReadRoutes } = require('../../src/container-agent/lib/routes-containers-read');
const { requireAuthFactory } = require('../../src/container-agent/lib/auth');

const response = () => ({ statusCode: 200, body: undefined,
  status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const fixture = (overrides = {}) => {
  const calls = [];
  const deps = { ...env, ...helpers, managedLabelValues: ['idpcore'], managerLabel: 'idpcore',
    docker: { listContainers: async (query) => {
      calls.push(query);
      return [{ Id: 'core-1', Names: ['/core'], Image: 'idp/core', Labels: { 'idp.service': 'core' } },
        { Id: 'auth-1', Names: ['/auth'], Image: 'idp/auth', Labels: { 'idp.service': 'auth' } }];
    } },
    inspectContainer: async () => null, isManagedContainer: (row) => row.Config?.Labels?.['idp.managed.by'] === 'idpcore',
    allowedActions: new Set(['start', 'stop', 'restart', 'remove']),
    resolveAllowUnmanagedActions: () => false, resolveManagedSecurityOpts: () => ['no-new-privileges:true'],
    applyAction: async (...args) => calls.push(args), ensureImage: async () => {}, ...overrides };
  return { deps, calls, handlers: createContainerHandlers(deps) };
};

test('Agent HTTP and orchestration list contracts agree on service/search/managed filters', async () => {
  const { deps, handlers, calls } = fixture();
  const routes = new Map();
  registerContainerReadRoutes({ ...deps, app: { get: (url, handler) => routes.set(url, handler) } });
  for (const query of [{}, { service: 'core', search: 'CORE-1' }, { managedOnly: 'false', search: 'missing' }]) {
    const res = response();
    await routes.get('/v1/containers/list')({ query }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, await handlers.listContainers(query));
  }
  assert.deepEqual(calls[0].filters, { label: ['idp.managed.by=idpcore'] });
  assert.equal(calls.at(-1).filters, undefined);
});

test('Agent refuses mutation of unmanaged containers; missing remove is idempotent', async () => {
  let mutated = false;
  const { handlers } = fixture({ inspectContainer: async (name) => name === 'existing' ? { Config: { Labels: {} } } : null,
    applyAction: async () => { mutated = true; } });
  await assert.rejects(handlers.containerAction({ action: 'stop', containerName: 'existing' }), { status: 403 });
  assert.equal(mutated, false);
  assert.deepEqual(await handlers.containerAction({ action: 'remove', containerName: 'missing' }),
    { ok: true, removed: true, containerName: 'missing', existed: false });
  await assert.rejects(handlers.containerAction({ action: 'unknown', containerName: 'existing' }), { status: 400 });
});

test('Agent creation preserves image, ports, labels, env and restrictive security options', async () => {
  let options; let started = false; let inspected = 0;
  const { handlers } = fixture({ docker: { createContainer: async (input) => {
    options = input; return { start: async () => { started = true; } };
  } }, inspectContainer: async () => inspected++ ? { State: { Running: true } } : null });
  const result = await handlers.createContainer({ name: 'contract-core', image: 'idp/core:test', managed: true,
    env: ['A=one'], envMap: { B: 'two' }, ports: [{ containerPort: 3000, hostPort: 3100 }], restartPolicy: 'invalid' });
  assert.equal(result.running, true); assert.equal(started, true);
  assert.deepEqual(options.Env, ['A=one', 'B=two']);
  assert.equal(options.Labels['idp.managed.by'], 'idpcore');
  assert.deepEqual(options.HostConfig.SecurityOpt, ['no-new-privileges:true']);
  assert.deepEqual(options.HostConfig.PortBindings, { '3000/tcp': [{ HostPort: '3100' }] });
  assert.equal(options.HostConfig.RestartPolicy.Name, 'unless-stopped');
});

test('Agent rejects conflicting names before touching images or the container engine', async () => {
  const { handlers } = fixture({ inspectContainer: async () => ({ Id: 'existing' }),
    ensureImage: async () => { throw Error('Must not access engine'); } });
  await assert.rejects(handlers.createContainer({ name: 'existing', image: 'idp/core' }), { status: 409 });
});

test('Agent requires configuration and a valid bearer token before invoking handlers', () => {
  let called = false;
  for (const [token, provided, expected] of [['', '', 503], ['synthetic-agent-token', '', 401],
    ['synthetic-agent-token', 'Bearer wrong', 401], ['synthetic-agent-token', 'Bearer synthetic-agent-token', 200]]) {
    const res = response();
    requireAuthFactory({ pickEnv: () => token })({ headers: { authorization: provided } }, res, () => { called = true; });
    assert.equal(res.statusCode, expected); assert.equal(called, expected === 200);
  }
});
