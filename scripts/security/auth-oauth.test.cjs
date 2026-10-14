const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomBytes, createHash } = require('node:crypto');
const { once } = require('node:events');
const { nativePostgres: disposablePostgres } = require('../database/native-postgres.cjs');
const authRequire = createRequire(path.resolve('src/auth/package.json'));

test('Auth OAuth HTTP contracts against disposable PostgreSQL', { timeout: 60000 }, async (t) => {
  const db = await disposablePostgres();
  t.after(() => db.stop());
  const secret = randomBytes(32).toString('hex');
  const clientSecret = randomBytes(24).toString('hex');
  const ssoToken = randomBytes(24).toString('hex');
  const redirectUri = 'http://localhost:39999/auth';
  Object.assign(process.env, {
    NODE_ENV: 'test', DATABASE_URL: `postgresql://${db.config.username}:${db.config.password}@127.0.0.1:${db.config.port}/${db.config.database}`,
    AUTH_SESSION_SECRET: secret, AUTH_MIGRATION_DIR: path.resolve('src/auth/migrations'),
    REDIS_URL: '', AUTH_TENANT_POLICY_URL: '', AUTH_TENANT_POLICY_REQUIRE_REMOTE: 'false',
    AUTH_COOKIE_SECURE: 'false', AUTH_ALLOW_INSECURE_LOCALHOST: 'true', AUTH_COOKIE_SAME_SITE: 'lax',
    AUTH_COOKIE_NAME: 'contract_auth_session', AUTH_COOKIE_DOMAIN: '', AUTH_BCRYPT_ROUNDS: '10',
    AUTH_BOOTSTRAP_TENANT_RAND_ID: 'tenant-contract', AUTH_BOOTSTRAP_TENANT_NAME_HOST: 'localhost',
    AUTH_BOOTSTRAP_TENANT_SSO_TOKEN: ssoToken, AUTH_BOOTSTRAP_CLIENT_ID: 'contract-client',
    AUTH_BOOTSTRAP_CLIENT_SECRET: clientSecret, AUTH_BOOTSTRAP_REDIRECT_URI: redirectUri,
    AUTH_BOOTSTRAP_ADMIN_EMAIL: 'contract@example.test', AUTH_BOOTSTRAP_ADMIN_PASSWORD: randomBytes(24).toString('hex'),
    AUTH_BOOTSTRAP_ORG_RAND_ID: 'org-contract',
  });
  // Import route modules only: the real entry point loads .env and starts Next.js.
  const { ensureDatabaseReady, closeDatabase, AuthDataSource } = authRequire('./dist/lib/db');
  t.after(closeDatabase);
  await ensureDatabaseReady();
  await authRequire('./dist/lib/services/bootstrap').bootstrapAuthDefaults({ log: () => {} });
  const { createOrUpdateWhitelistTenant } = authRequire('./dist/lib/services/tenant-whitelist');
  await createOrUpdateWhitelistTenant({ tenantName: 'localhost', tenantRandId: 'tenant-contract',
    token: ssoToken, isActive: true, meta: { organizationRandId: 'org-contract' } });
  const { schemas, upsertVersionedRecord, findCurrentUserByEmail } = authRequire('./dist/lib/services/versioning');
  await upsertVersionedRecord(schemas.organizations, 'org-foreign', {
    name: 'Foreign organization', code: 'foreign', parentOrgRandId: null, isActive: true, meta: {},
  }, { actorTenantRandId: 'tenant-contract', changeReason: 'contract-fixture' });
  const user = await findCurrentUserByEmail('contract@example.test');
  const { createSession, issueSessionCookie, revokeSession } = authRequire('./dist/lib/sessions');
  const { sessionToken, sessionEntity } = await createSession({ userRandId: user.randId,
    tenantRandId: 'tenant-contract', ipAddress: '127.0.0.1', userAgent: 'contract-test' });
  const express = authRequire('express');
  const app = express();
  app.use(express.urlencoded({ extended: false })); app.use(express.json());
  app.use(authRequire('cookie-parser')(secret));
  app.use(authRequire('./dist/lib/middleware/session').attachSessionContext);
  authRequire('./dist/routes/oauth').registerOAuthRoutes(app, { setLoginUiState: () => {} });
  app.get('/__test/session', (req, res) => { issueSessionCookie(req, res, sessionToken); res.json({ ok: true }); });
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cookie = (await fetch(`${base}/__test/session`)).headers.get('set-cookie').split(';')[0];
  const verifier = randomBytes(48).toString('base64url');
  const params = { response_type: 'code', client_id: 'contract-client', redirect_uri: redirectUri,
    tenant_name: 'localhost', tenant_org_id: 'org-contract', scope: 'openid profile email', state: 'contract-state',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' };
  const authorize = (overrides = {}, withSession = true) => fetch(`${base}/oauth/authorize?${new URLSearchParams({ ...params, ...overrides })}`, {
    redirect: 'manual', headers: { accept: 'application/json', ...(withSession ? { cookie } : {}) },
    signal: AbortSignal.timeout(10000),
  });
  const issueCode = async () => {
    const response = await authorize(); assert.equal(response.status, 302);
    const callback = new URL(response.headers.get('location'));
    assert.equal(callback.origin, new URL(redirectUri).origin);
    assert.equal(callback.searchParams.get('state'), 'contract-state');
    assert.ok(callback.searchParams.get('code')); return callback.searchParams.get('code');
  };
  const exchange = (code, overrides = {}) => fetch(`${base}/oauth/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: 'contract-client', client_secret: clientSecret,
      redirect_uri: redirectUri, tenant_name: 'localhost', tenant_org_id: 'org-contract',
      tenant_sso_token: ssoToken, code_verifier: verifier, code, ...overrides }), signal: AbortSignal.timeout(10000),
  });

  await t.test('unauthenticated authorization preserves the login return context', async () => {
    const response = await authorize({}, false); assert.equal(response.status, 302);
    const login = new URL(response.headers.get('location'), base);
    assert.equal(login.pathname, '/login'); assert.equal(login.searchParams.get('tenant_name'), 'localhost');
    assert.match(login.searchParams.get('returnTo'), /^\/oauth\/authorize/);
  });
  await t.test('redirect, tenant, organization, scope and missing PKCE are rejected', async () => {
    for (const overrides of [{ redirect_uri: 'http://evil.example/auth' }, { tenant_name: 'foreign.example' },
      { tenant_org_id: 'org-foreign' }, { scope: 'admin.unlisted' }, { code_challenge: '' }]) {
      const response = await authorize(overrides); assert.ok([400, 403].includes(response.status));
      assert.ok((await response.json()).error);
    }
  });
  await t.test('client credentials, tenant SSO token and wrong PKCE cannot exchange a code', async () => {
    const code = await issueCode();
    for (const overrides of [{ client_secret: 'invalid' }, { tenant_sso_token: 'invalid' }, { code_verifier: 'invalid' }]) {
      assert.ok([400, 401, 403].includes((await exchange(code, overrides)).status));
    }
    assert.equal((await exchange(code)).status, 200);
  });
  await t.test('signed session → code → token → userinfo retains identity and one-use code', async () => {
    const code = await issueCode(); const response = await exchange(code); assert.equal(response.status, 200);
    const token = await response.json();
    assert.equal(token.access_token, token.accessToken); assert.equal(token.token_type, 'Bearer');
    assert.equal(token.expires_in, token.expiresIn);
    const info = await fetch(`${base}/oauth/userinfo`, { headers: { authorization: `Bearer ${token.access_token}` } });
    assert.equal(info.status, 200); const identity = await info.json();
    assert.equal(identity.sub, user.randId); assert.equal(identity.email, 'contract@example.test');
    assert.equal(identity.tenant_rand_id, 'tenant-contract'); assert.equal(identity.tenant_org_rand_id, 'org-contract');
    assert.equal((await exchange(code)).status, 400);
    assert.equal((await fetch(`${base}/oauth/userinfo`, { headers: { authorization: 'Bearer invalid' } })).status, 401);
    const { OAuthAccessTokenEntity } = authRequire('./dist/lib/typeorm/entities');
    const { hashValue } = authRequire('./dist/lib/crypto');
    await AuthDataSource.getRepository(OAuthAccessTokenEntity).update({ tokenHash: hashValue(token.access_token) }, { revokedAt: new Date() });
    assert.equal((await fetch(`${base}/oauth/userinfo`, { headers: { authorization: `Bearer ${token.access_token}` } })).status, 401);
  });
  await t.test('concurrent exchange consumes an authorization code exactly once', async () => {
    const code = await issueCode(); const responses = await Promise.all([exchange(code), exchange(code)]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
  });
  await t.test('revoking the database session requires login again', async () => {
    await revokeSession(sessionEntity.randId);
    const response = await authorize(); assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get('location'), base).pathname, '/login');
  });
});
