const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { X509Certificate } = require('node:crypto');
const { once } = require('node:events');
const { createIngressServer } = require('../../src/monitoring/lib/tls');
const { createServerFactory } = require('../../src/container-agent/lib/tls');
const { asBool, parseIntBounded } = require('../../src/monitoring/lib/utils');

const app = (_req, res) => res.end('tls-ok');
const factories = {
  monitoring: (env) => {
    const original = { ...process.env };
    return async () => {
      try {
        for (const name of Object.keys(process.env)) {
          if (name.startsWith('MONITORING_TLS_')) delete process.env[name];
        }
        Object.assign(process.env, env);
        return await createIngressServer(app);
      } finally {
        for (const name of Object.keys(process.env)) {
          if (!(name in original)) delete process.env[name];
        }
        Object.assign(process.env, original);
      }
    };
  },
  agent: (env) => createServerFactory({ app,
    pickEnv: (...names) => names.map(name => env[name]).find(value => value !== undefined),
    asBool, parseIntBounded,
    ensureDir: directory => fs.mkdirSync(directory, { recursive: true }),
    cwd: process.cwd(), logger: { log() {} },
  }),
};

for (const [name, factory] of Object.entries(factories)) {
  const prefix = name === 'monitoring' ? 'MONITORING' : 'CONTAINER_AGENT';
  test(`${name}: awaits certificate generation, serves trusted TLS and reuses private key`, async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-tls-'));
    const keyPath = path.join(directory, 'server.key');
    const certPath = path.join(directory, 'server.crt');
    const create = factory({
      [`${prefix}_TLS_KEY_PATH`]: keyPath,
      [`${prefix}_TLS_CERT_PATH`]: certPath,
      [`${prefix}_TLS_SELF_SIGNED_DAYS`]: '2',
    });
    let server;
    try {
      const result = await create();
      server = result.server;
      assert.equal(result.protocol, 'https');
      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);
      assert.equal(fs.statSync(keyPath).mode & 0o777, 0o600);
      const x509 = new X509Certificate(cert);
      assert.ok(new Date(x509.validTo).getTime() > Date.now());
      assert.ok(new Date(x509.validTo).getTime() < Date.now() + 3 * 86400000);
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const body = await new Promise((resolve, reject) => {
        const request = https.get({ hostname: '127.0.0.1', port: server.address().port,
          ca: cert, timeout: 5000 }, response => {
          let data = '';
          response.on('data', chunk => { data += chunk; });
          response.on('end', () => resolve(data));
        });
        request.on('timeout', () => request.destroy(new Error('TLS request timed out')));
        request.on('error', reject);
      });
      assert.equal(body, 'tls-ok');
      const reused = await create();
      reused.server.close();
      assert.deepEqual(fs.readFileSync(keyPath), key);
      assert.deepEqual(fs.readFileSync(certPath), cert);
    } finally {
      if (server?.listening) await new Promise(resolve => server.close(resolve));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
  test(`${name}: refuses HTTP when TLS is required`, async () => {
    await assert.rejects(factory({ [`${prefix}_TLS_ENABLED`]: 'false',
      [`${prefix}_TLS_REQUIRED`]: 'true' })(), /TLS is required/);
  });
}
