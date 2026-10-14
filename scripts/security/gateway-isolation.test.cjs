const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');
const { spawnIsolatedCodex } = require('../../src/codex-gateway/lib/isolatedSpawn');
const { prepareScope, clearScopedAuth } = require('../../src/codex-gateway/lib/profileScope');

test('assistant process can read its workspace and profile while host secrets and other profiles remain absent', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtessa-assistant-proof-'));
  try {
    const workspace = path.join(root, 'workspace'), profile = path.join(root, 'profile');
    fs.mkdirSync(workspace); fs.mkdirSync(profile);
    fs.writeFileSync(path.join(workspace, 'own.txt'), 'own'); fs.writeFileSync(path.join(profile, 'own.txt'), 'profile');
    const canary = path.join(root, 'service.env'); fs.writeFileSync(canary, 'synthetic-sensitive-value');
    const script = `const fs=require('fs'); process.stdout.write(JSON.stringify({own:fs.readFileSync(${JSON.stringify(path.join(workspace,'own.txt'))},'utf8'),profile:fs.readFileSync(${JSON.stringify(path.join(profile,'own.txt'))},'utf8'),outside:fs.existsSync(${JSON.stringify(canary)}),secret:process.env.ENCRYPTION_KEY||null}));`;
    const child = spawnIsolatedCodex({ command: process.execPath, args: ['-e', script], cwd: workspace,
      env: { PATH: process.env.PATH, CODEX_HOME: profile }, stdio: ['ignore','pipe','pipe'] });
    let output = ''; child.stdout.on('data', data => output += data); child.stderr.resume();
    const [code] = await once(child, 'close'); assert.equal(code, 0);
    assert.deepEqual(JSON.parse(output), { own: 'own', profile: 'profile', outside: false, secret: null });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('scoped credential refresh retains the account, respects logout and clears cached scope credentials', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtessa-profile-proof-'));
  try {
    const scoped = path.join(root, 'isolated-workspaces', 'a'.repeat(64)), primaryAuth = path.join(root,'auth.json');
    const write = (file, account, token) => fs.writeFileSync(file, JSON.stringify({tokens:{account_id:account,access_token:token}}));
    write(primaryAuth,'own','before'); let sync = prepareScope(root,scoped);
    write(path.join(scoped,'auth.json'),'own','refreshed'); sync(); assert.equal(JSON.parse(fs.readFileSync(primaryAuth)).tokens.access_token,'refreshed');
    sync = prepareScope(root,scoped); write(path.join(scoped,'auth.json'),'own','old-account'); write(primaryAuth,'new','new-account'); sync();
    assert.equal(JSON.parse(fs.readFileSync(primaryAuth)).tokens.account_id,'new');
    sync = prepareScope(root,scoped); fs.unlinkSync(primaryAuth); sync(); assert.equal(fs.existsSync(primaryAuth),false);
    clearScopedAuth(root); assert.equal(fs.existsSync(path.join(scoped,'auth.json')),false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
