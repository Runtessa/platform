#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const list = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
});
if (list.status !== 0) throw new Error('Unable to enumerate publishable files.');
const files = [...new Set(list.stdout.split('\0').filter(Boolean))]
  .filter((file) => existsSync(path.join(root, file)));
const privateFiles = files.filter((file) => {
  const name = path.basename(file);
  return /\.env(?:\.|$)/.test(name) && !name.endsWith('.example');
});
if (privateFiles.length) {
  console.error(`Private environment files must not be tracked: ${privateFiles.join(', ')}`);
  process.exit(1);
}

const directory = mkdtempSync(path.join(os.tmpdir(), 'idpcore-secret-scan-'));
try {
  for (const file of files) {
    const destination = path.join(directory, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(path.join(root, file), destination, { dereference: false });
  }
  const scan = spawnSync(process.env.GITLEAKS_BIN || 'gitleaks', [
    'dir', '--redact=100', '--no-banner', '--ignore-gitleaks-allow', directory,
  ], { cwd: root, stdio: 'inherit' });
  if (scan.error) console.error('Gitleaks is required. Install the version documented in docker/README.md or set GITLEAKS_BIN.');
  process.exitCode = scan.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
