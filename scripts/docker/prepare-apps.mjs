#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const dockerBuildRoot = path.join(repoRoot, '.docker-build');

const selectedApps = process.argv.slice(2);
const appSet = new Set(selectedApps.length > 0 ? selectedApps : [
  'auth',
  'codex-gateway',
  'container-agent',
  'core',
  'ideNew',
  'monitoring',
]);

const completedSteps = new Set();

function run(command, args, cwd = repoRoot) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runOnce(key, action) {
  if (completedSteps.has(key)) {
    return;
  }

  action();
  completedSteps.add(key);
}

function resetDir(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  rmSync(absolutePath, { recursive: true, force: true });
  mkdirSync(absolutePath, { recursive: true });
}

function copyIntoStage(sourceRelativePath, stageRelativePath) {
  const sourceAbsolutePath = path.join(repoRoot, sourceRelativePath);
  const stageAbsolutePath = path.join(repoRoot, stageRelativePath);

  if (!existsSync(sourceAbsolutePath)) {
    throw new Error(`Missing required path: ${sourceRelativePath}`);
  }

  mkdirSync(path.dirname(stageAbsolutePath), { recursive: true });
  cpSync(sourceAbsolutePath, stageAbsolutePath, { recursive: true });
}

function prepareAuth() {
  runOnce('auth-build', () => run('npm', ['--prefix', 'src/auth', 'run', 'build']));

  const stageDir = '.docker-build/auth';
  resetDir(stageDir);

  copyIntoStage('src/auth/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/auth/package-lock.json', `${stageDir}/package-lock.json`);
  copyIntoStage('src/auth/.next', `${stageDir}/.next`);
  copyIntoStage('src/auth/dist', `${stageDir}/dist`);
  copyIntoStage('src/auth/public', `${stageDir}/public`);
  copyIntoStage('src/auth/migrations', `${stageDir}/migrations`);
  copyIntoStage('src/auth/next.config.mjs', `${stageDir}/next.config.mjs`);
  copyIntoStage('src/auth/branding.json', `${stageDir}/branding.json`);
}

function prepareCodexGateway() {
  const stageDir = '.docker-build/codex-gateway';
  resetDir(stageDir);

  copyIntoStage('src/codex-gateway/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/codex-gateway/index.js', `${stageDir}/dist/index.js`);
  copyIntoStage('src/codex-gateway/lib', `${stageDir}/dist/lib`);
}

function prepareContainerAgent() {
  const stageDir = '.docker-build/container-agent';
  resetDir(stageDir);

  copyIntoStage('src/container-agent/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/container-agent/package-lock.json', `${stageDir}/package-lock.json`);
  copyIntoStage('src/container-agent/index.js', `${stageDir}/dist/index.js`);
  copyIntoStage('src/container-agent/lib', `${stageDir}/dist/lib`);
}

function prepareCore() {
  runOnce('shared-build', () => run('npm', ['run', 'build:shared']));
  runOnce('core-build', () => run('npm', ['--prefix', 'src/core', 'run', 'build']));
  runOnce('kernel-build', () => run('npm', ['run', 'build:front']));

  const stageDir = '.docker-build/core';
  resetDir(stageDir);

  copyIntoStage('src/core/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/core/package-lock.json', `${stageDir}/package-lock.json`);
  copyIntoStage('dist', `${stageDir}/dist`);
  copyIntoStage('src/public', `${stageDir}/public`);
  copyIntoStage('src/packages/shared/package.json', `${stageDir}/src/packages/shared/package.json`);
  copyIntoStage('src/packages/shared/dist', `${stageDir}/src/packages/shared/dist`);
}

function prepareIdeNew() {
  runOnce('shared-build', () => run('npm', ['run', 'build:shared']));
  runOnce('ide-build', () => run('npm', ['--prefix', 'src/ideNew', 'run', 'build']));

  const stageDir = '.docker-build/ideNew';
  resetDir(stageDir);

  copyIntoStage('src/ideNew/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/ideNew/package-lock.json', `${stageDir}/package-lock.json`);
  copyIntoStage('src/ideNew/.next', `${stageDir}/.next`);
  copyIntoStage('src/ideNew/public', `${stageDir}/public`);
  copyIntoStage('src/ideNew/next.config.mjs', `${stageDir}/next.config.mjs`);
  copyIntoStage('src/packages/shared/package.json', `${stageDir}/src/packages/shared/package.json`);
  copyIntoStage('src/packages/shared/dist', `${stageDir}/src/packages/shared/dist`);
}

function prepareMonitoring() {
  const stageDir = '.docker-build/monitoring';
  resetDir(stageDir);

  copyIntoStage('src/monitoring/package.json', `${stageDir}/package.json`);
  copyIntoStage('src/monitoring/package-lock.json', `${stageDir}/package-lock.json`);
  copyIntoStage('src/monitoring/index.js', `${stageDir}/dist/index.js`);
  copyIntoStage('src/monitoring/lib', `${stageDir}/dist/lib`);
}

const preparers = {
  auth: prepareAuth,
  'codex-gateway': prepareCodexGateway,
  'container-agent': prepareContainerAgent,
  core: prepareCore,
  ideNew: prepareIdeNew,
  monitoring: prepareMonitoring,
};

const unknownApps = [...appSet].filter((app) => !preparers[app]);
if (unknownApps.length > 0) {
  console.error(`Unknown app names: ${unknownApps.join(', ')}`);
  process.exit(1);
}

mkdirSync(dockerBuildRoot, { recursive: true });

for (const app of Object.keys(preparers)) {
  if (appSet.has(app)) {
    preparers[app]();
  }
}
