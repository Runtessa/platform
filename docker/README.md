# IDP Ecosystem Docker Stack

This folder contains a full image-based runtime stack for:

- nginx (edge reverse proxy)
- core
- auth
- ide
- monitoring
- container-agent
- codex-gateway
- postgres (17)
- redis (latest)

Kernel is built inside the core image (not a standalone container).

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
  owner and update agent image names in the private environment files.
- SMS and AI providers are disabled in the examples. Add their credentials only
  to private files when you configure those integrations.
- When bind-mounting these files using the root Compose stack, ensure the
  container's application user can read them. Keep access limited to that user;
  the IDE image runs as the `node` user.

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
It is expected to fail on the original history until the prepared cleanup is
applied; do not hide those findings with a baseline or allowlist.

The secret-scan workflow runs both scans on pushes and pull requests, fetching
the complete history and using a checksum-verified Gitleaks release. Historical
secret cleanup and revocation of real exposed credentials are still required
before making this repository public. Removing a file from the current tree
does not remove earlier committed copies.

## Run everything

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
