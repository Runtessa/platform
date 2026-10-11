import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { packageAllowed, releaseCommit, releaseVersion, verificationJobs, verifiedJobs, verifiedRun } from './image-release-policy.mjs';

const published = (tag_name = 'v0.1.0', extra = {}) => ({ action: 'published', release: { tag_name, draft: false, prerelease: false, ...extra } });
test('only published, properly marked semantic releases produce image versions', () => {
  assert.equal(releaseVersion(published()), '0.1.0');
  assert.equal(releaseVersion(published('v0.2.0-rc.1', { prerelease: true })), '0.2.0-rc.1');
  for (const event of [published('v01.1.0'), published('main'), published('v0.1.0+build'), published('v1.0.0-01', { prerelease: true }), published('v0.2.0-rc.1'), published('v0.1.0', { draft: true }), { action: 'created' }, { action: 'published' }]) {
    assert.throws(() => releaseVersion(event));
  }
});

test('the latest exact main verification must pass; stale, PR and other-commit results do not qualify', () => {
  const run = { id: 123, head_sha: 'release-sha', head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', run_number: 1 };
  assert.equal(verifiedRun([run], 'release-sha').id, 123);
  for (const runs of [[], [{ ...run, head_sha: 'another-sha' }], [{ ...run, head_branch: 'feature' }], [{ ...run, event: 'pull_request' }], [run, { ...run, run_number: 2, conclusion: 'failure' }], [{ ...run, status: 'in_progress', conclusion: null }]]) {
    assert.throws(() => verifiedRun(runs, 'release-sha'));
  }
});

test('every required integration job must pass, including container and secret scans', () => {
  const jobs = verificationJobs.map(name => ({ name, conclusion: 'success' }));
  verifiedJobs(jobs);
  assert.throws(() => verifiedJobs(jobs.slice(1)));
  assert.throws(() => verifiedJobs(jobs.map(job => ({ ...job, conclusion: 'skipped' }))));
});

test('private source cannot publish into an existing public or internal package', () => {
  packageAllowed(null, true);
  packageAllowed({ visibility: 'private' }, true);
  for (const visibility of ['public', 'internal', undefined]) assert.throws(() => packageAllowed({ visibility }, true));
  packageAllowed({ visibility: 'public' }, false);
});

test('actual Git history rejects off-main tags and a checkout of another revision', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'runtessa-release-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init', '-b', 'main');
    git('config', 'user.name', 'Release fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    writeFileSync(path.join(cwd, 'source'), 'main');
    git('add', 'source');
    git('commit', '-m', 'main revision');
    const main = git('rev-parse', 'HEAD');
    git('tag', '-a', 'v0.1.0', '-m', 'annotated release');
    git('update-ref', 'refs/remotes/origin/main', main);
    assert.equal(releaseCommit('v0.1.0', cwd), main);
    git('switch', '-c', 'feature');
    writeFileSync(path.join(cwd, 'source'), 'feature');
    git('commit', '-am', 'off-main revision');
    git('tag', 'v0.2.0');
    assert.throws(() => releaseCommit('v0.2.0', cwd), /reachable from main/);
    assert.throws(() => releaseCommit('v0.1.0', cwd), /does not match/);
    git('switch', 'main');
    assert.equal(releaseCommit('v0.1.0', cwd), main);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
