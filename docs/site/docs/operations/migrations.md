---
title: Platform migrations
---

<!-- Generated from scripts/database/README.md; edit the source guide. -->

# Platform schema migrations

Core and IDE connect without TypeORM synchronization, automatic migration execution
or automatic extension installation. Startup checks migration history and checksums;
it never runs schema DDL. A missing or incompatible version blocks database-backed
requests with 503 until an operator prepares the schema. `CORE_DB_SYNC` is ignored,
including in development. Existing private environment files do not need rewriting.

The schema is PostgreSQL/public, as used by the shipped platform entities and Docker
stack. Tenant database adapters still support their existing database types. Auth
already owns a separate SQL migration stream; these commands do not migrate Auth.

## Targets

| Target | Configuration | Migration stream |
| --- | --- | --- |
| `core` | `DATABASE_URL` / `DB_*` | shared users, catalog, Core |
| `ide` | `DATABASE_URL` / `DB_*` | shared users, IDE |
| `ide-core` | `CORE_DATABASE_URL` / `CORE_DB_*`, with `DB_*` fallback | full Core |
| `catalog` | same connection settings as `ide-core` | shared code and global packages |

Core and IDE normally use different databases. If they share a database, the users
migration is recorded once. A catalog can be installed first and later extended
with Core. The catalog metadata includes SourceCode and CompiledCode, required by
its package relations. Migration IDs are global within a database.

A dedicated `CORE_DATABASE_URL` is a complete connection: its host, port, database
and credentials are not mixed with IDE's `DB_*` values. Explicit `CORE_DB_*` fields
may override it. Database commands require an explicit database name.

## Review and install

From the repository root, explicitly select the target and its private environment
file. These commands use Node 22.13+; credentials are not printed. Environment
variables already supplied to the process take precedence over the file.

```sh
npm run db:status -- --target core --env-file docker/env/core.env
npm run db:plan -- --target core --env-file docker/env/core.env
npm run db:migrate -- --target core --env-file docker/env/core.env

npm run db:status -- --target ide --env-file docker/env/ide.env
npm run db:migrate -- --target ide --env-file docker/env/ide.env
```

Docker environment files point at the Compose network's database hostname; they
are not automatically reachable from a host shell. In an existing installation,
run the packaged command inside its existing service container:

```sh
docker compose exec core npm run db:status
docker compose exec core npm run db:migrate
docker compose exec ide npm run db:status
docker compose exec ide npm run db:migrate
```

For first installation, start the database first, then use an ephemeral invocation
of the existing service image before starting application services:

```sh
docker compose up -d postgres
docker compose run --rm --no-deps core npm run db:migrate
docker compose run --rm --no-deps ide npm run db:migrate
```

Run Compose from the repository root with the appropriate Compose file and private
environment options for the installation. No additional deployment service is used.
The packages contain the compiled CLI and frozen SQL; they require no TypeScript
compiler during deployment. Development starts no longer create schemas themselves.

## Existing installations

Back up the database and rehearse on a restored staging copy before changing it.
An existing database without this migration ledger is not treated as empty. `migrate`
refuses to apply a baseline over existing managed tables.

```sh
npm run db:diff -- --target core --env-file path/to/staging-core.env
npm run db:adopt -- --target core --env-file path/to/staging-core.env
```

`status`, `plan` and `diff` execute no DDL. `plan` prints frozen pending migration
SQL. `diff` prints TypeORM's suggested schema differences; it can include destructive
operations and is a review aid, never an executable automatic upgrade plan.

`adopt` checks every baseline table's columns, defaults, keys, relations and indexes
against the frozen snapshot. When they match, it writes history only; application
rows and unrelated tables are untouched. A missing table, extra managed column or
other difference blocks adoption. A partial or older installation requires a
reviewed upgrade that preserves its data, followed by validation and adoption.
No legacy data conversion is inferred or run automatically. Only baselines can be
adopted; subsequent upgrades must be executed through their migration SQL.

## History and future changes

Frozen migrations are in `src/packages/shared/src/database/migrations`. Never edit
an applied migration. Append an `upgrade` migration with a new ID, its dependencies,
reviewed SQL and optional expected table snapshots, then register it in the relevant
stream and the complete manifest. Keep the initial baselines unchanged.

The ledger stores a SHA-256 checksum of each definition, including its SQL and
snapshots. Unknown versions, changed checksums or missing dependencies block startup
and migration commands. Migration execution is serialized by a PostgreSQL advisory
lock with a 10-second lock timeout. All pending migrations and their history writes
run in one transaction; failures roll back together. Repeating a successful command
does not apply SQL again. There is no automatic downgrade or schema repair.

Use a migration role with DDL/extension permissions for installation and upgrades.
Normal service roles need their application table permissions and SELECT on
`public.idp_schema_migrations`; the schema check works without CREATE/ALTER permission.
The existing example configurations still use the installer credentials; configure
service-role privileges as part of deployment preparation.

## Live tenant models

This stream manages platform tables, not dynamically authored tenant model tables.
The authorized IDE model-migration action remains explicit and runs against the
selected tenant database in the restricted child process. It does not synchronize
the platform schema. Preserve staging/backups when using that action; it is not a
versioned history for tenant-authored schemas.

## Verification

```sh
npm run test:database
```

Tests create and remove their own PostgreSQL 17 container and synthetic credentials.
They cover fresh installation, schema/metadata consistency, Core/IDE sharing,
legacy adoption, rejected schema differences, checksums, rollback, concurrent
execution, read-only startup, CLI packaging and lazy IDE initialization. They do not
connect to deployment databases or use the installation's private environment files.
