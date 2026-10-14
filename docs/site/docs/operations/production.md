---
title: Native production and recovery
---

<!-- Generated from docs/operations-production.md; edit the source guide. -->

# Native Linux production profile

This profile runs Core, Studio, Auth and the optional assistant gateway as native
Node 22 processes. It uses the installation's PostgreSQL and Redis services.
No additional application service is introduced. The reference rehearsal uses
Fedora Linux, PostgreSQL at 127.0.0.1:5432 and Redis at 127.0.0.1:6379.
Use separate databases, roles and file roots for each installation.

## Host requirements

Install Node 22.13+, bubblewrap 0.12+, PostgreSQL client utilities and tar. The kernel
must support unprivileged user, PID and network namespaces, seccomp and cgroup v2.
Bubblewrap 0.12 includes the required [sandbox path resolution security fix](https://github.com/containers/bubblewrap/releases/tag/v0.12.0); older hosts fail closed.
The service user needs delegated cpu, memory and pids controllers. The runtime
fails closed with 503 if delegation or isolation is unavailable.

On the reference workstation, systemd delegates controllers below
`/sys/fs/cgroup/user.slice/user-<uid>.slice/user@<uid>.service`. The default budget
root is `runtessa-runtime` there. For a different service manager, set
`RUNTIME_CGROUP_ROOT` to a dedicated writable delegated directory under
`/sys/fs/cgroup`, with a basename beginning `runtessa-`. Do not point it at
another application's group. A systemd service can use `Delegate=cpu memory pids`
and, on systemd 254+, `DelegateSubgroup=supervisor`; configure the execution root
below its empty delegated parent. Verify delegation on the target host before
starting tenant workloads. Use a distinct operating-system user per installation.

Each runtime child has one CPU core, at most 48 tasks, V8 heap limits plus 128 MiB
of native overhead, no swap and 64 MiB of temporary files. All children for the
service user share a 4 GiB / two-core / 512-task aggregate budget. The parent also
rejects invocations beyond eight active children. Deadlines include startup cost.
The gateway CLI has a 896 MiB / 128-task budget and 128 MiB of temporary files.

Tenant processes have a private network namespace. Public HTTP/HTTPS may reach
public addresses; private destinations and cloud metadata addresses are denied.
Set `RUNTIME_EGRESS_ALLOW=hostname:port,...` for reviewed installation integrations,
for example `127.0.0.1:5432,127.0.0.1:6379`. DNS is pinned by the trusted parent.
Do not allow a privileged database, internal proxy or service with unrestricted
credentials. A reviewed integration can still expose its own downstream access.
Raw Redis on port 6379 is denied. The Redis adapter performs get/set/del/publish
in the parent with the prefix `runtessa:<tenant UUID>:` and bounded values/TTLs.
Redis command credentials never enter tenant code. PostgreSQL credentials are
checked in the parent for administrative/global data privileges before disclosure;
operators must grant each tenant role access only to its own database/schema.

The assistant CLI mounts its workspace and a tenant/chat-specific profile. Host
homes, platform checkouts and other profiles are absent. Generated commands use
Codex read-only/workspace-write sandboxing with network access disabled. The
trusted CLI retains provider transport access. Studio requires this gateway and
has no platform-checkout CLI fallback. Keep its signed HTTP interface private.

## Model activation

Run `npm run db:migrate` with the appropriate private environment file before
starting the new release; startup never applies DDL. Migration
`0005_model_activation` adds the active-model ledger without changing old baselines.
Saving a model produces a draft. PostgreSQL activation reviews an additive plan,
serializes updates and commits a captured model bundle only after transactional
DDL succeeds. A durable operation marker lets a retry recover a crash between the
tenant database commit and the Core ledger commit. Published ORM uses this bundle
and checks its marker in the configured database. Destination changes require
activation there. Removal/type changes require a separately reviewed migration.

This atomic activation profile is PostgreSQL-only. MySQL/SQL Server integrations
retain their existing adapter APIs and planning support, but are not covered by
this production profile. Do not promise atomic MySQL DDL or activate unpublished
models through a different route.

## Encrypted backup and recovery

Pause writers in Core, Studio, Auth, the assistant and tenant apps before taking a
consistent multi-database/file backup. Keep the active encryption key available;
finish any key rotation first. PostgreSQL dumps are consistent individually, but
this utility is not a distributed snapshot coordinator.

Create private (mode 600) JSON connection files containing `host`, `port`,
`username`, `password`, `database`. Store the 64-hex-character encryption key and
a random passphrase of at least 24 characters in separate private files. Use a
passphrase stored independently of the backup. Never commit these inputs.

A private backup configuration has this shape; paths below are examples:

```json
{
  "directory": "/srv/backups/runtessa/2026-10-14",
  "passphraseFile": "/srv/private/backup-passphrase",
  "keyFile": "/srv/private/core-encryption-key",
  "databases": [
    {"label":"core", "connectionFile":"/srv/private/core.json"},
    {"label":"ide", "connectionFile":"/srv/private/ide.json"},
    {"label":"auth", "connectionFile":"/srv/private/auth.json"},
    {"label":"app", "connectionFile":"/srv/private/app.json"}
  ],
  "files": [{"label":"uploads", "root":"/srv/runtessa/uploads"}]
}
```

Include every tenant database and persistent file root (attachments, local object
storage, gateway profiles/workspaces). Archive roots reject escaping/absolute
symlinks and special files. External object stores need their own verified backup.
Redis caches are rebuilt; persistent Redis application data requires a separate
operator-managed export. Revoke recovered sessions/provider tokens if necessary.

```sh
npm run build:shared
node scripts/operations/recovery-cli.mjs backup /srv/private/backup.json
node scripts/operations/recovery-cli.mjs restore /srv/private/restore.json
```

The restore configuration uses the same labels, freshly provisioned empty target
databases/directories, and `keyOutput` instead of `keyFile`. Restore authenticates
all parts and checks all destinations before writing. Dumps restore in individual
transactions; files and multiple databases do not share one global transaction.
If a later restore command fails, discard those fresh targets and retry into new
empty targets. Do not overwrite an active installation. Update restored connection
secrets to the new roles/databases, apply the recovered key, verify schema history,
log in, test a published ORM route, then resume writers. Session/provider secrets
and other private service settings must be restored separately by the operator.

## Encryption-key rotation

Stop writers and take a verified encrypted backup. Create a new private random
32-byte key. Deploy the new active key together with the old key in
`ENCRYPTION_PREVIOUS_KEYS`; retain all keys needed by existing ciphertext.

```sh
node scripts/operations/rotate-key.cjs /srv/private/core.json /srv/private/old-key /srv/private/new-key
```

The utility preflights every encrypted secret, including password markers nested
in tenant configuration, before writing. It re-encrypts them in one PostgreSQL
transaction. Use `CORE_ENCRYPTION_KEY` in Studio when its Core database has a
different key. Restart services, verify adapter decryption, create and test a new
backup, then remove retired keys from active configuration. Keep historical keys
sealed with the historical backups that need them. Wrong keys/corrupt ciphertext
fail closed; no plaintext is printed.

## Rehearsal and capacity

`npm run test:production` creates uniquely owned temporary databases/roles on the
existing PostgreSQL service, uses only its own Redis prefix, and removes those
fixtures. Private local infrastructure settings are read without printing them.
It covers native resource/network boundaries, model crash recovery, encryption
rotation, full database/file recovery and HTTP load with overload rejection.
Also run `npm run test:database`, `npm run test:auth` and the relevant component
checks. No local container runtime is required.

New execution processes pay dependency startup on each invocation. Size capacity
from measured latency and cold-start costs; these checks do not establish a
high-throughput SLO, arbitrary hostile-tenant hosting, external integrations or
other operating systems. Run the rehearsal again on the intended production host.
