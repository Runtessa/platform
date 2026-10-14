# Live code execution inside the existing services

Core and IDE retain live JavaScript/TypeScript code, model decorators, class methods,
relations, shared modules and database adapters. No new deployment service, port or
message broker is introduced. Core executes each invocation in a short-lived Node
process; IDE runs model loading and schema synchronization in the same boundary.

The parent keeps the platform database and encryption/signing keys. The child gets
the current request, tenant identifier and adapter policy. Fixed RPC capabilities
return only that tenant's models, granted adapter configuration, tenant directory
configuration and permitted published/draft shared package data. The parent owns
the tenant and draft choice; child-supplied tenant IDs or grants are not trusted.
Native TypeORM classes execute entirely in the child, including constructors,
decorators, methods and model imports. No entity function is deserialized or run
by the platform process.

## Native Linux requirements

Use Node 22.13+, bubblewrap 0.12+, unprivileged user/PID/network namespaces, seccomp
and delegated cgroup v2 CPU/memory/pids controllers. Local development and testing
use host processes and the existing PostgreSQL/Redis services. Unsupported hosts
fail closed; never disable isolation or fall back to in-process execution.

Only the Node executable, system libraries/certificates, compiled runtime and
explicit dependency directories are mounted read-only. Service `.env`, host homes,
platform database credentials, process inspection and engine sockets are absent.
`/tmp` is a private 64 MiB filesystem. Tenant console output stays out of host logs.

## Resource and network policy

Each invocation has a one-core budget, bounded V8 heap plus 128 MiB native overhead,
48 tasks and no swap. A dedicated cgroup also caps aggregate use at 4 GiB, two cores
and 512 tasks. The default root is below the delegated systemd user service;
`RUNTIME_CGROUP_ROOT` can select a dedicated delegated `runtessa-*` directory.
Parent deadlines include startup and stop synchronous loops/background work.
At most eight runtime processes run per service process; excess work receives 503.
IPC frames are limited to 8 MiB and concurrent capability calls to 64.

The private network namespace reaches only a bounded parent relay. Public HTTP/HTTPS
may reach public addresses. Other integrations must be explicitly configured with
`RUNTIME_EGRESS_ALLOW=hostname:port,...`; private addresses are otherwise denied,
and metadata addresses remain denied even when listed. DNS is pinned. Redis on
6379 is available only through the scoped adapter; its credentials stay in the
parent and keys/channels receive a tenant prefix. PostgreSQL role privileges are
checked before disclosure. An allowed integration must itself use narrow
credentials and cannot serve as an unrestricted proxy into private infrastructure.

Full setup, activation, encrypted backup, key rotation and recovery instructions
are in [the native production runbook](../../docs/operations-production.md).
Fresh processes pay dependency startup per request; measure the target host before
claiming throughput or latency guarantees. Other OS/database profiles remain outside
this rehearsal's acceptance scope.

## Verification

From the repository root:

```sh
npm run test:runtime
npm run test:production
```

The first builds the platform/runtime and checks actual OS isolation, hot code
changes, tenant-bound capabilities, infinite loops and native TypeORM metadata.
The second requires a local Docker or Podman engine and creates/removes its own
disposable PostgreSQL 17 database. It verifies schema synchronization, live entity
classes, repository CRUD, read-only database permissions and the SQL adapter; it
does not use the installation's environment files or databases.

The implementation keeps `node:vm` only as a JavaScript execution convenience
inside the restricted process. Node explicitly states that it is not a security
mechanism: [Node VM documentation](https://nodejs.org/api/vm.html).
The OS boundary is configured with [bubblewrap](https://github.com/containers/bubblewrap).
