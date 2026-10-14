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

For local work, run the applications and commands natively. Configure private host
files with the shared PostgreSQL endpoint `127.0.0.1:5432` and dedicated project
roles/databases. The workstation database map and private connection settings live
under `$HOME/.local/share/local-infra/`; never print or commit those credentials.
Do not start a project database container, Compose stack or another PostgreSQL
instance. Use a DDL role to install the fresh schema, then start Core and Studio
as native processes. No additional deployment service is introduced.

The packages contain the compiled CLI and frozen SQL. Application startup checks
schema readiness and does not create tables itself.

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
The authorized Studio model-migration action runs against the selected tenant
adapter inside the existing restricted process. It computes a SQL plan and refuses
non-additive or unknown operations before executing planned DDL. It does not run
TypeORM `synchronize()` or mutate the platform schema.

`POST /api/models/migrate` accepts `action: "plan"` for a read-only review. The
response contains `plan.hash`, `plan.safe`, `plan.statements` and `plan.blocked`.
`action: "apply"` optionally accepts `expectedPlanHash`; a changed plan returns 409.
The default apply action retains safe creation of tables and nullable columns.
Destructive changes require a separately reviewed migration rather than an
automatic synchronization fallback.

PostgreSQL uses an advisory lock, transactional DDL, bounded lock/statement timeouts
and the `runtessa_model_migrations` history table in the selected adapter database.
Failures roll back DDL and history together. SQL Server uses a transaction-owned
application lock. MySQL uses a connection-owned advisory lock, but its DDL can
commit implicitly: the response reports `transactional: false`, and earlier
additions may remain after a later failure. Do not claim atomic MySQL recovery.
Only PostgreSQL has been verified against the shared native service in this change.

## Native data-safety verification

```sh
npm run test:data-safety
```

The native tests reuse PostgreSQL at `127.0.0.1:5432`, allocate uniquely named
`runtessa_safety_*` databases and roles, and remove only those fixtures on completion.
They never start a database instance or access an application's existing data.
Private administrator settings are read from the workstation infrastructure file;
other hosts can provide `TEST_PGUSER` and `TEST_PGPASSWORD` privately for their
existing service. No passwords are printed.

The scenarios cover publication rollback, concurrent decisions, CSS/source
snapshots, Redis cleanup failure, revision caches, read-only schema plans,
additive changes, blocked destructive changes, stale plans and transactional DDL
failure. The older full platform migration suite (`npm run test:database`) still
uses a container fixture and must be adapted before running it on this workstation.
