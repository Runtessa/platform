#!/usr/bin/env node
import fs from 'node:fs/promises';
import { backupInstallation, restoreInstallation } from './recovery.mjs';

const [action, manifestFile] = process.argv.slice(2);
try {
  if (!['backup', 'restore'].includes(action) || !manifestFile) throw new Error('Usage: node recovery-cli.mjs backup|restore <private-manifest.json>');
  const stat = await fs.stat(manifestFile);
  if (stat.mode & 0o077) throw new Error('Recovery configuration must be private (mode 600)');
  const input = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  const sensitive = [input.passphraseFile, ...(input.databases || []).map(entry => entry.connectionFile), ...(action === 'backup' ? [input.keyFile] : [])];
  for (const file of sensitive) if ((await fs.stat(file)).mode & 0o077) throw new Error('Recovery secrets and connection files must be private (mode 600)');
  const passphrase = (await fs.readFile(input.passphraseFile, 'utf8')).trim();
  const databases = await Promise.all(input.databases.map(async (entry) => ({ label: entry.label,
    config: JSON.parse(await fs.readFile(entry.connectionFile, 'utf8')) })));
  const result = action === 'backup'
    ? await backupInstallation({ ...input, passphrase, databases, encryptionKey: (await fs.readFile(input.keyFile, 'utf8')).trim() })
    : await restoreInstallation({ ...input, passphrase, databases });
  console.log(`${action === 'backup' ? 'Backup' : 'Recovery'} completed: ${result.parts} authenticated part(s).`);
} catch (error) { console.error(error.message || 'Recovery operation failed'); process.exitCode = 1; }
