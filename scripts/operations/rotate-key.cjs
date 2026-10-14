#!/usr/bin/env node
require('reflect-metadata');
const fs = require('node:fs');
const { DataSource } = require('typeorm');
const { rotateDatabaseSecrets } = require('@idp/shared/dist/security/secret-rotation');
const [connectionFile, previousKeyFile, nextKeyFile] = process.argv.slice(2);
(async () => {
  if (!nextKeyFile) throw Error('Usage: node rotate-key.cjs <private-connection.json> <old-key-file> <new-key-file>');
  for (const file of [connectionFile, previousKeyFile, nextKeyFile]) if (fs.statSync(file).mode & 0o077) throw Error('Key rotation inputs must be private (mode 600)');
  const keys = [previousKeyFile, nextKeyFile].map(file => {
    const value = fs.readFileSync(file, 'utf8').trim();
    if (!/^[a-f0-9]{64}$/i.test(value)) throw Error('Invalid key file'); return Buffer.from(value, 'hex');
  });
  const source = new DataSource({ ...JSON.parse(fs.readFileSync(connectionFile, 'utf8')), type: 'postgres', entities: [], synchronize: false, logging: false });
  try { await source.initialize(); const result = await rotateDatabaseSecrets(source, [keys[0], keys[1]], keys[1]); console.log(`Re-encrypted ${result.secrets} secret(s) and ${result.tenants} tenant configuration(s).`); }
  finally { if (source.isInitialized) await source.destroy(); }
})().catch(error => { console.error(error.message || 'Key rotation failed'); process.exitCode = 1; });
