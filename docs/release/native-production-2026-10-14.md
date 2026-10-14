# Native production acceptance — 2026-10-14

The four remaining production gates are implemented and verified for the selected
native Linux/PostgreSQL profile. This is an acceptance record for the measured
installation, not a certification of arbitrary hosting or untested adapters.

| Gate | Result and evidence |
| --- | --- |
| Runtime isolation | Native bubblewrap namespaces, bounded egress relay, CPU/RSS/tasks/tmpfs budgets and overload rejection. Adversarial native allocation, private/metadata destinations, infinite loops and cleanup checks passed. Missing delegation fails closed. |
| Model activation | Captured PostgreSQL model snapshots, serialized additive DDL, durable operation markers and retry reconciliation. Draft edits, concurrent activation, destructive/stale plans and a failure between database commits were exercised. Published ORM verifies activation at its destination. |
| Dependencies and encryption | Patched compatible render/SDK/SQL/test dependencies; versioned AES-GCM key identity, retained legacy decryption and transactional nested-secret rotation. Wrong keys/tampering and preflight rollback passed. Unpatched parser advisories remain visible with tested input/output guards. |
| Native operations | Fresh Core/Studio/Auth/tenant schemas, authenticated encrypted backup and recovery of all four databases plus files, real restored published ORM, HTTP load and saturation/recovery. Existing PostgreSQL/Redis services only; uniquely owned fixtures were removed. |

## Measured host and load

- Fedora Linux kernel `7.2.9-200.fc44.x86_64`; Node `v22.23.2`.
- PostgreSQL `127.0.0.1:5432`; Redis `127.0.0.1:6379`.
- Restored four database parts and one persistent-file part; recovered ciphertext
  decrypted with the restored key and a published ORM route read recovered data.
- 24 successful HTTP requests at concurrency four: p50 **1541 ms**, p95 **1793 ms**.
- A 20-request saturation burst accepted eight and rejected twelve with 503;
  a subsequent normal request succeeded.
- An actual logged-in official Codex read-only execution returned the exact content
  of a synthetic workspace file inside the new filesystem/resource boundary.
  Fedora CA roots are mounted so provider TLS works without host service files.

These measurements reflect cold execution processes on this workstation. Startup
cost is material; this record does not promise low-latency/high-throughput hosting.

## Regression coverage

The focused production suite passed 12 scenarios. Platform migration/CLI/readiness
checks passed 17 scenarios. Studio security and input checks passed 173; Gateway
native protocol checks passed 12; shared/Gateway/Agent contracts passed 20; Auth
OAuth and real Redis cache checks passed eight. Core dispatch, preview, tenant
provisioning, SSO primitives and adapter configuration checks passed. The remaining
data/runtime compatibility suite passed 23 scenarios. Shared/Core/Studio/Auth
build/type checks, documentation build, source parsing and redacted secret scanning
passed. Counts overlap across suites and must not be summed as distinct coverage.

No application/customer data was used. Each native test created dedicated random
roles/databases or used only its own Redis prefix; no shared cache flush occurred.
No local application/database/Redis container was created or started.

## Accepted scope and remaining upstream limits

- Apply migration `0005_model_activation` explicitly before starting this release.
  Published ORM requires activation; atomic activation is PostgreSQL-only.
- Linux hosts need delegated cgroup v2 controllers, user namespaces, bubblewrap and
  reviewed integration destinations. Installation topology and other OS/architectures
  need their own rehearsal. Remote container images were not run on this host.
- `braces` and `sprintf-js` still lack upstream patches. Bounded parser/formatter
  guards cover the shared module boundary and provided native launch/build commands;
  separately bundled copies or unguarded commands need independent assessment.
- The older AI provider-utils v2 low-severity resource advisory remains tracked.
  Alternate AI provider paths are outside the default Codex production profile.
- Backup consistency across databases/files requires paused writers. External object
  storage, persistent Redis application data and other private service settings need
  operator-managed recovery. A later multi-part restore failure requires fresh
  empty targets; there is no cross-database/file transaction.

Use [the runbook](../operations-production.md) for host delegation, activation,
backup/restore and key rotation. Keep the [dependency snapshot](dependency-audit.md)
visible; its nonzero audit status is intentional and not suppressed.
