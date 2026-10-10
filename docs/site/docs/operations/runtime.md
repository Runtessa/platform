---
title: Live execution boundary
---

<!-- Generated from docker/runtime/README.md; edit the source guide. -->

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

## Runtime requirements

- Linux on x86-64 or arm64, Node 22.13+ and bubblewrap. Local development must
  install bubblewrap; the existing Core and IDE images install it themselves.
- Unprivileged user namespaces must be supported by the kernel and host policy.
  The existing Compose files select `seccomp.json`, run without capabilities and
  prevent privilege escalation. Run Compose from the repository root so its
  `./docker/runtime/seccomp.json` path resolves correctly.
- The outer syscall allowlist supports Node, database clients and bubblewrap
  namespace setup. The child adds its own syscall filter: no extra processes,
  process inspection, namespace changes or mounts after setup. Node permissions
  additionally block workers, child process APIs and native addons.
- Core now runs as the existing `node` image user. IDE already uses that user.
  Do not enable privileged containers or turn off seccomp to work around a host
  that disables user namespaces. Unsupported startup fails closed.
- SELinux/container policy can also deny nested devpts mounts used by bubblewrap.
  The maintainer's Fedora Podman host rejected this mount under its default container
  label. Validate the target host's policy; the project does not automatically
  disable SELinux or add a permissive Compose setting.
- Development starts build the platform runtime once. Editing a tenant module or
  model still takes effect on the next invocation, without rebuilding the platform
  or restarting a service.

Only the Node executable, system runtime libraries/certificates, compiled runtime
code and dependency directories are mounted read-only. Service working directories,
`.env`, host home directories, `/proc` and container engine sockets are absent.
`/tmp` and `/dev` are private. Platform environment variables and `NODE_OPTIONS`
are not inherited. Tenant console output is not forwarded to platform logs.

## Limits and remaining boundaries

The parent kills a child on its deadline, including a synchronous loop in a handler,
model or shared package. Default module limits are 5 seconds and a 512 MiB V8 heap,
capped at 30 seconds and 2048 MiB. Nonpositive/invalid tenant limits select bounded
defaults, never in-process execution. IDE migration has a 30-second deadline.
There are at most eight concurrent execution processes per service process; excess
invocations receive 503. IPC frames are limited to 8 MiB and concurrent capability
calls to 64. Successful and failed invocations both terminate their child.

The memory setting limits the V8 heap, not total RSS, native buffers or temporary
files. Apply container/cgroup memory and CPU budgets for the installation. Network
access is retained for authorized database/HTTP/S3/etc. integrations; this change
does not enforce an egress allowlist or prevent SSRF. Adapter database roles must
also restrict which databases/schemas their credentials can access. Those are
separate release requirements, not guarantees of this execution boundary.

Fresh processes currently pay Node/dependency startup on every invocation. Measure
latency on the target host before sizing an installation. Any future process reuse
must preserve tenant/stage isolation, hot code changes, revocation and cleanup of
background work; it must not share a runtime across tenants.

## Verification

From the repository root:

```sh
npm run test:runtime
npm run test:runtime:integration
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
