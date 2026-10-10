#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = spawnSync(process.env.GITLEAKS_BIN || 'gitleaks', [
  'git', '--redact=100', '--no-banner', '--ignore-gitleaks-allow', '--log-opts=--all', '.',
], { cwd: root, stdio: 'inherit' });
if (result.error) console.error('Gitleaks is required. Set GITLEAKS_BIN or install the documented version.');
process.exitCode = result.status ?? 1;
