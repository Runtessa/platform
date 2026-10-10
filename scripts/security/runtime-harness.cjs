require('reflect-metadata');
const path = require('node:path');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { SandboxRunner } = require('../../dist/engine/SandboxRunner');

const fixture = (input, options = {}) => runRestrictedProcess({
  entrypoint: path.resolve(__dirname, 'runtime-fixture.cjs'),
  readOnlyRoots: [...runtimeDependencyRoots(), __dirname],
  input, timeoutMs: 5000, memoryMb: 128, ...options,
});
const request = { path: '/api/live', method: 'POST', headers: {}, query: {}, params: {}, body: { value: 3 },
  tenant: { id: 'tenant-a', hostname: 'a.example.test', resourceConfig: { timeout: 5000, memory: 128 } },
  account: { id: 'user-a', email: 'a@example.test', role: 'developer' },
};
const tenant = { id: 'tenant-a', hostname: 'a.example.test', adapterAccess: { postgres: { allow: ['own-db'] } } };
const run = (code, capabilities, overrides = {}) => new SandboxRunner().run(code, {
  request: structuredClone(request), adapters: {}, tenant: structuredClone(tenant), capabilities, ...overrides,
});
module.exports = { fixture, run, request, tenant };
