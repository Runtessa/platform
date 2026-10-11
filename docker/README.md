# Runtessa Docker Stack

This folder contains a full image-based runtime stack for:

- nginx (edge reverse proxy)
- core
- auth
- ide
- monitoring
- container-agent
- codex-gateway
- postgres (17)
- redis (8.8; its upstream license is separate from Runtessa's Apache-2.0 license)

Kernel is built inside the core image (not a standalone container).

Live code and model execution run inside the existing Core and IDE services.
Before starting them, review the [Linux isolation requirements and remaining
limits](runtime/README.md). Unsupported sandbox startup returns an error rather
than executing tenant code in the platform process.

Core and IDE require [explicit platform schema migrations](../scripts/database/README.md)
before first startup or an upgrade. They do not create or alter tables at startup.
Existing databases need baseline validation/adoption; do not run fresh-install SQL
over an unverified existing schema.

## Initialize private configuration

From the repository root, run:

```bash
npm run docker:init-env
```

This creates `docker/.env` and seven `docker/env/*.env` files from the tracked
examples. Credentials are generated randomly for each installation. Database
passwords, the Core/IDE encryption key, and internal service tokens are coordinated
across the files. Files are created with owner-only permissions on Unix.

Existing complete configurations are preserved byte for byte. A partial
configuration is rejected to avoid mixing new credentials with existing services.
Restore missing files from your private backup instead of regenerating secrets
for an installation that already has data.

Before starting services:

- Set domains and allowed origins in the private files and update the host routes
  in `nginx/conf.d/idp.conf` to match. The templates use `example.com`; the existing
  proxy configuration still uses the original deployment domains.
- For the image-based stack, set `IMAGE_REGISTRY` in `docker/.env` to your image
  owner, pin `IMAGE_TAG` to a published version, and update agent image names in
  the private environment files. Existing configuration is never overwritten.
- SMS and AI providers are disabled in the examples. Add their credentials only
  to private files when you configure those integrations.
- When bind-mounting these files using the root Compose stack, ensure the
  container's application user can read them. Keep access limited to that user;
  the Core and IDE images run as the `node` user. The root development Compose stack now uses `env_file`, so it does not require changing private-file permissions.

Runtime environment files are ignored by Git and excluded from Docker build
contexts. Publish only the `*.env.example` templates. Keep a private backup of
the generated configuration; losing encryption keys can make stored secrets
unreadable. Changing encryption keys for existing data requires a migration plan.

## Check publishable files for secrets

Install [Gitleaks 8.30.1](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1)
and run:

```bash
npm run test:env-setup
npm run security:secrets
npm run security:history
```

If Gitleaks is not on your PATH, set `GITLEAKS_BIN` to the executable path. The
scanner checks tracked and non-ignored new files from the working tree, rejects
private environment files in that set, and fully redacts its findings. It does
not scan ignored local configuration or previous commits.

The history check scans every reachable commit across the fetched references.
It also catches credentials committed and later deleted within a pull request.
Private original-history recovery references may still exist locally and make an
all-reference scan fail. Never push those references. Scan the exact public branch
also before release; do not hide findings with a baseline or allowlist.

The secret-scan workflow runs both scans on pushes and pull requests, fetching
the complete history and using a checksum-verified Gitleaks release. Historical
secret cleanup and revocation of real exposed credentials are still required
before making this repository public. Removing a file from the current tree
does not remove earlier committed copies.

## Local source installation

Use [Getting started](../docs/getting-started.md) for the root Compose build, fresh
database initialization and migrations. Its ports bind to localhost and private
values are passed through `env_file`. The registry stack below is a deployment
template: configure domains, image versions and migrations before using it.

## Run the configured registry stack

Images are published to `ghcr.io/runtessa` by the integration repository's GitHub
Release workflow. The first successful Release creates the packages; a source
push only validates builds. See the [image release guide](../docs/release/container-images.md)
for the six image names, private-registry login, version pinning and release gates.

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
```

This starts nginx with these host routes:

- `auth.adadrass.ir` -> `auth:3015`
- `ide.adadrass.ir` -> `ide:3000`
- `*.adadrass.ir` -> `core:3005` (tenant hosts)

## Stop everything

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env down
```

## Logs

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env logs -f
```

## Important notes

- Point DNS A/AAAA records to this server:
  - `auth.adadrass.ir`
  - `ide.adadrass.ir`
  - wildcard `*.adadrass.ir`
- For local browser access use:
  - Nginx: `http://localhost`
  - IDE (direct): `http://localhost:3002`
  - Core (direct): `http://localhost:3005`
  - Auth (direct): `http://localhost:3015`
  - Monitoring: `http://localhost:3011`
- Generate private configuration first, then review it for your deployment.
