#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import gitFiles from '../quality/git-files.cjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Include detached checkouts (PRs), all publishable branches/remotes/tags, and their ancestry.
// refs/original, stash and local editor recovery refs are not publication targets.
for (const repository of gitFiles.gitRepositories(root)) {
  const result = spawnSync(process.env.GITLEAKS_BIN || 'gitleaks', [
    'git', '--redact=100', '--no-banner', '--ignore-gitleaks-allow',
    '--log-opts=HEAD --branches --remotes --tags', '.',
  ], { cwd: repository, stdio: 'inherit' });
  if (result.error) console.error('Gitleaks is required. Set GITLEAKS_BIN or install the documented version.');
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}
