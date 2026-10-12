#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultDockerDir = fileURLToPath(new URL('../../docker/', import.meta.url));
export const environmentFiles = [
  '.env',
  ...['postgres', 'core', 'auth', 'ide', 'monitoring', 'container-agent', 'codex-gateway']
    .map((service) => `env/${service}.env`),
];

export function initializeDockerEnv(targetDir = defaultDockerDir, templateDir = defaultDockerDir) {
  const existing = environmentFiles.filter((file) => existsSync(path.join(targetDir, file)));
  if (existing.length === environmentFiles.length) return [];
  if (existing.length) {
    throw new Error('Incomplete Docker environment. Restore the missing files or initialize in an empty directory; existing credentials will not be replaced.');
  }

  // Shared placeholders resolve once so services agree on database and internal credentials.
  const names = [
    'postgres_password', 'encryption_key', 'token_secret', 'admin_token',
    'ide_admin_password', 'auth_admin_password', 'auth_session_secret',
    'internal_api_token', 'bootstrap_client_secret', 'bootstrap_tenant_sso_token',
    'container_manager_token', 'monitoring_ingest_token', 'monitoring_server_token', 'studio_preview_token',
  ];
  const secrets = new Map(names.map((name) => [`replace_with_${name}`, randomBytes(32).toString('hex')]));
  const files = environmentFiles.map((file) => {
    const template = readFileSync(path.join(templateDir, `${file}.example`), 'utf8');
    const content = template.replace(/replace_with_[a-z_]+/g, (placeholder) => {
      const value = secrets.get(placeholder);
      if (!value) throw new Error(`Unknown placeholder in ${file}: ${placeholder}`);
      return value;
    });
    return { file, content };
  });

  const created = [];
  try {
    for (const { file, content } of files) {
      const target = path.join(targetDir, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
      created.push(file);
    }
    return created;
  } catch (error) {
    for (const file of created) unlinkSync(path.join(targetDir, file));
    throw error;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const created = initializeDockerEnv();
    console.log(created.length
      ? `Created ${created.length} private environment files. Review domains, image names, and optional providers before starting services.`
      : 'Existing environment files preserved.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
