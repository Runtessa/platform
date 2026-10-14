#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const [command, ...args] = process.argv.slice(2);
if (!command) throw Error('A guarded command is required');
const compiled = path.resolve(__dirname, '../../src/packages/shared/dist/security/glob-budget.cjs');
const preload = fs.existsSync(compiled) ? compiled : path.resolve(__dirname, '../../src/packages/shared/src/security/glob-budget.cjs');
const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require=${JSON.stringify(preload)}`.trim() } });
child.on('error', () => { console.error('Guarded command could not start'); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? 1; });
