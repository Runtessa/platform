import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('History scanner covers publication refs and detached HEAD, without private recovery refs', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'idp-history-scope-'));
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const scan = () => spawnSync(process.execPath, ['scripts/security/scan-history.mjs'], {
    cwd: directory, env: process.env, stdio: 'ignore', timeout: 30000,
  });
  try {
    git('init', '--initial-branch=main'); git('config', 'user.email', 'contract@example.test');
    git('config', 'user.name', 'Contract fixture');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'core.hooksPath', path.join(directory, 'no-hooks'));
    // Generated synthetic detector input, never a provider credential or a checked-in token.
    writeFileSync(path.join(directory, 'fixture.txt'), `token=ghp_${randomBytes(18).toString('hex')}\n`);
    git('add', 'fixture.txt'); git('commit', '-m', 'synthetic historical fixture');
    const dirty = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/original/refs/heads/main', dirty);
    git('checkout', '--orphan', 'clean'); git('rm', '--force', 'fixture.txt');
    git('commit', '--allow-empty', '-m', 'clean publication history');
    const clean = git('rev-parse', 'HEAD');
    git('branch', '-D', 'main'); git('branch', '-M', 'main');
    mkdirSync(path.join(directory, 'scripts/security'), { recursive: true });
    copyFileSync(fileURLToPath(new URL('./scan-history.mjs', import.meta.url)), path.join(directory, 'scripts/security/scan-history.mjs'));
    mkdirSync(path.join(directory, 'scripts/quality'), { recursive: true });
    copyFileSync(fileURLToPath(new URL('../quality/git-files.cjs', import.meta.url)), path.join(directory, 'scripts/quality/git-files.cjs'));
    assert.equal(scan().status, 0, 'Private recovery refs should not be mistaken for publication history');
    for (const ref of ['refs/heads/disclosure', 'refs/remotes/origin/disclosure', 'refs/tags/disclosure']) {
      git('update-ref', ref, dirty);
      assert.equal(scan().status, 1, `Historical detector input in ${ref} must be rejected`);
      git('update-ref', '-d', ref);
    }
    git('checkout', '--detach', dirty);
    assert.equal(scan().status, 1, 'Detached PR/check-out history must also be scanned');
    git('checkout', '--detach', clean);
    assert.equal(scan().status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
