---
title: Getting started
---

<!-- Generated from docs/getting-started.md; edit the source guide. -->

# Getting started

This guide prepares a **new, local developer installation**. Do not point it at an
existing deployment or reuse production secrets. For upgrades, start with the
[migration guide](/docs/operations/migrations) and a restored staging backup.

## 1. Prerequisites

Use Linux x86-64/arm64, Node 22.13+ in the 22.x line, npm and Docker Compose.
Podman works with a compatible Compose provider; replace `docker compose` below
with `podman compose`. Core/IDE require unprivileged user namespaces; the images
include bubblewrap. Read the [host requirements](/docs/operations/runtime).

Windows/macOS native execution is not supported. A Linux VM can provide a development
host; compatibility still depends on its namespace/container policy.

## 2. Install and generate configuration

```sh
git clone --recurse-submodules https://github.com/Runtessa/platform.git
cd platform
npm ci
npm --prefix src/auth ci
npm --prefix src/kernel ci
npm --prefix src/monitoring ci
npm --prefix src/container-agent ci
npm run docker:init-env
```

The root workspace installs Core, IDE, shared and VS Code dependencies. Other packages
have their own locked installs. Lifecycle scripts may build/download native dependencies;
review dependency changes before installing untrusted branches.

`docker:init-env` creates eight private files with coordinated random credentials.
It preserves a complete installation and refuses a partial set. Back up those files
outside the repository. Never commit or paste them into an issue.

For a local browser setup, edit **only your generated private configuration**:

| File | Local settings |
| --- | --- |
| `docker/env/core.env` | `CORE_ALLOWED_ORIGINS=http://localhost:3002,http://localhost:3015`; leave `CORE_SSO_AUTH_BASE_URL` empty for the initial module/IDE walkthrough |
| `docker/env/ide.env` | `DEV_TENANT_HOST=localhost`; choose your `ADMIN_EMAIL`; keep the generated `ADMIN_PASSWORD`/`ADMIN_TOKEN`; set `CORE_SSO_AUTH_BASE_URL=http://localhost:3015` if exercising SSO |
| `docker/env/auth.env` | Set `AUTH_BASE_URL=http://localhost:3015`, `AUTH_ALLOWED_ORIGINS=http://localhost:3015,http://localhost:3002`, `AUTH_COOKIE_SECURE=false`, `AUTH_ALLOW_INSECURE_LOCALHOST=true`, `AUTH_BOOTSTRAP_REDIRECT_URI=http://localhost:3002/auth`; retain generated bootstrap secrets |

Database URLs keep the Compose hostname `postgres`; service-internal URLs use
`core`/`auth`/`redis`. Browser-facing URLs must be reachable from your browser.
Local HTTP settings are for development; an internet-facing installation needs TLS,
its own domains, matching allowed origins and secure cookie policy.

The root Compose file passes private values with `env_file`; it does not require
loosening the generated files' permissions for the application user. Ports bind to
`127.0.0.1`. Optional engine/AI agents are disabled unless their profile is selected.

## 3. Build the existing services

```sh
npm run docker:prepare -- core auth ideNew monitoring
docker compose build core auth ide monitoring
```

The prepare command builds source and stages artifacts in the ignored `.docker-build`
directory. No tenant data or private environment files enter image build contexts.
Kernel is compiled into the Core image; it is not another service.

## 4. Initialize platform databases

```sh
docker compose up -d postgres redis
docker compose exec postgres pg_isready -U postgres -d postgres
docker compose run --rm --no-deps core npm run db:migrate
docker compose run --rm --no-deps ide npm run db:migrate
```

Retry readiness until PostgreSQL accepts connections. On a **fresh volume**, the
included initialization script creates `idpcore`, `idpnext` and `idp_auth`. PostgreSQL
does not rerun initialization scripts on an existing volume. Never delete a volume
to repair an installation that contains data; create missing databases deliberately
and follow the existing-installation migration instructions.

Core and IDE check versions but execute no platform DDL at startup. Auth uses its
own checksummed SQL migrations when its server initializes. Its installer/bootstrap
credentials are intended for this local walkthrough, not least-privilege production roles.

## 5. Start and sign in

```sh
docker compose up -d core auth ide monitoring
docker compose ps
docker compose logs --tail=100 core auth ide
```

Open the IDE at **http://localhost:3002** and use your private `ADMIN_EMAIL` and
`ADMIN_PASSWORD`. Core is at `http://localhost:3005`; Auth is at
`http://localhost:3015`. A bare Core URL is not a demo application: tenant routing
requires a configured tenant and published UI.

Use the IDE tenant-management screen to create/select the local tenant with hostname
`localhost`. Add a GET backend module at `/api/hello` using the
[first application tutorial](/docs/tutorials/first-application), save and
publish, enable anonymous access for that demonstration route in its ACL, and request
`http://localhost:3005/api/hello`. Other routes remain protected unless explicitly
configured otherwise; see the [ACL cookbook](/docs/cookbook/acl).

The IDE admin account and Auth's bootstrap account live in separate databases and
can have different generated passwords. Configure tenant SSO separately; successful
IDE login alone does not establish a Core tenant session.

## 6. Stop, inspect or upgrade

```sh
docker compose down
```

This stops containers and retains volumes. Back up databases and private configuration
before upgrades. Do not use `down -v` on data you need. Container engine/AI profiles
and the image-registry stack are covered in [docker/README.md](https://github.com/Runtessa/platform/blob/main/docker/README.md).

If live execution reports an isolation-startup error, inspect host namespace policy
and the [runtime requirements](/docs/operations/runtime). Do not enable privileged
containers or remove seccomp as a workaround. If a database reports an incompatible
version, inspect `db:status` and the migration guide rather than enabling synchronization.
