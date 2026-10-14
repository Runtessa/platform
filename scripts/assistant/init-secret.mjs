#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
export function initializeAssistantSecret(platformRoot = root) {
  const files = ['src/ideNew/.env', 'src/codex-gateway/.env'].map((name) => path.join(platformRoot, name));
  const contents = files.map((file) => existsSync(file) ? readFileSync(file, 'utf8') : '');
  const values = contents.map((text) => {
    const rows = [...text.matchAll(/^ASSISTANT_GATEWAY_SECRET=(.*)$/gm)];
    if (rows.length > 1) throw new Error('Duplicate assistant secret setting; resolve it before initialization');
    return rows[0]?.[1].trim() || '';
  });
  const configured = values.filter((value) => value && !value.startsWith('replace_with_'));
  if (configured.some((value) => !/^[a-f0-9]{64}$/.test(value)))
    throw new Error('Native initialization requires a 64-character hexadecimal assistant secret');
  if (new Set(configured).size > 1) throw new Error('Assistant secrets differ; existing credentials were preserved');
  const secret = configured[0] || randomBytes(32).toString('hex');
  let changed = 0;
  for (const [index, file] of files.entries()) {
    if (values[index] === secret) continue;
    const line = `ASSISTANT_GATEWAY_SECRET=${secret}`;
    const content = /^ASSISTANT_GATEWAY_SECRET=/m.test(contents[index])
      ? contents[index].replace(/^ASSISTANT_GATEWAY_SECRET=.*$/m, line)
      : `${contents[index]}${contents[index].endsWith('\n') || !contents[index] ? '' : '\n'}${line}\n`;
    writeFileSync(file, content, { mode: 0o600 });
    chmodSync(file, 0o600);
    changed++;
  }
  return changed;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { console.log(`Assistant secret initialized in ${initializeAssistantSecret()} private file(s); restart Studio and the gateway.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
