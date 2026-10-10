#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Include detached checkouts (PRs), all publishable branches/remotes/tags, and their ancestry.
// refs/original, stash and local editor recovery refs are not publication targets.
const result = spawnSync(process.env.GITLEAKS_BIN || 'gitleaks', [
  'git', '--redact=100', '--no-banner', '--ignore-gitleaks-allow',
  '--log-opts=HEAD --branches --remotes --tags', '.',
], { cwd: root, stdio: 'inherit' });
if (result.error) console.error('Gitleaks is required. Set GITLEAKS_BIN or install the documented version.');
process.exitCode = result.status ?? 1;
