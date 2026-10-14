# Publication and model-schema safety — 2026-10-14

This is the first production-hardening step for a fresh installation. It does not
certify public untrusted-code hosting or every database adapter.

## Implemented behavior

- Studio single-item publication and request approval use transactions. Backend,
  frontend, shared packages, stylesheet snapshots and approval status commit or
  roll back together. Repeating an approved request does not publish new snapshots.
- Approval/rejection uses row locks and conditional status updates. Deleted or
  renamed items fail the entire request instead of being silently skipped.
- Requests capture stylesheet content at submission. Later draft edits cannot
  replace the submitted stylesheet during approval.
- Runtime and Studio copy source/compiled publication snapshots. Editing a draft
  cannot mutate its published source through a shared source-code row.
- Runtime resolves database publication revisions before using caches. Old Redis
  entries expire normally; cleanup failure does not invalidate a committed release
  or select the preceding publication revision for a later database snapshot.
- Model schema actions compute a SQL plan, accept only additive statements, and
  reject removals, renames, existing-type changes and unknown statements before
  planned DDL. Initialization cannot enable `dropSchema`, auto-migrations or
  extension installation through adapter settings.
- Plans can be reviewed without writing and applied with `expectedPlanHash`.
  PostgreSQL serializes updates, records applied plans and rolls DDL/history back
  together on failure. Planning borrows the locked connection and supports a
  single-connection pool; adapter query-cache settings cannot create tables during
  a read-only plan.

## Verification

Node **22.23.2**, native Linux execution, bubblewrap, and the shared PostgreSQL
service at **127.0.0.1:5432** were used. Test roles/databases have unique
`runtessa_safety_*` names and are removed after the run. No new service instance
or container build/test environment was created.

| Check | Result |
| --- | --- |
| New publication/schema scenarios | 14 native scenarios passed, including actual PostgreSQL rollback and concurrent writers |
| API input and existing publication/access/rollback contracts | 17 checks passed; one input-validation scenario is new |
| Combined targeted run | 31 passed, 0 failed, 0 skipped; 15 new scenarios total |
| Runtime regressions | HTTP security, registry naming and registry source suites passed |
| Shared library / Runtime | TypeScript builds passed |
| Studio | Type-check and isolated production build passed |
| Patch formatting | `git diff --check` passed in the affected repositories |

Repeat the native scenarios with `npm run test:data-safety` at the platform root.
Administrator connection settings stay in the workstation's private infrastructure
file or private `TEST_PGUSER`/`TEST_PGPASSWORD` environment settings.

The existing CI authorization job also ran these scenarios against its ephemeral
PostgreSQL fixture on the GitHub runner. All six required checks passed on
[Platform PR #27](https://github.com/Runtessa/platform/pull/27), which merged as
`e0737081a287e6220bb00d3f44ae347c8e569ad5`. Packages #2, Runtime #3 and Studio #5
merged first; their merge commits are pinned in that integration.

## Remaining boundaries

- SQL Server and MySQL have not received live integration verification in this
  change. MySQL DDL can commit implicitly; a later failure can leave earlier
  additions in place. The API reports `transactional: false` for that adapter.
- The SQL allowlist protects automatic model-schema changes. It does not restrict
  arbitrary SQL issued by tenant code using granted database credentials.
- Model source saving and schema application remain separate operations. A rejected
  schema update does not revert the saved model source; model activation/staging
  needs review before serving production traffic.
- Requests already in flight and client-side modules are not switched as one global
  transaction. Runtime cache revision checks add database reads; load sizing remains
  a later verification step.
- Gateway authentication, network/SSRF policy, resource budgets, dependency findings,
  encryption-key recovery and target-host restore/load rehearsals remain separate
  production gates.
