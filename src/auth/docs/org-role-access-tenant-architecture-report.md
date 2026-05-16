# Org / Role / Access / Tenant Architecture Report

## Scope

This report evaluates the current architecture in `src/auth` for:

- Organization management
- Role management
- User access assignments
- Tenant mapping and tenant membership

Goal: identify production risks and provide a practical target architecture and migration plan.

---

## 1) Current Architecture (As-Is)

## 1.1 Domain Entities

Primary entities currently used:

- `OrganizationEntity` (versioned/current-record model)
- `RoleEntity` (versioned/current-record model)
- `UserOrganizationEntity` (user -> org assignment, versioned)
- `UserRoleEntity` (user -> role assignment, versioned)
- `UserTenantMembershipEntity` (user -> tenant membership)
- `TenantWhitelistEntity` (tenant allow-list + metadata in `meta` JSON)
- `UserEntity` (user profile/identity base)

## 1.2 API Surface

Admin routes are split into read/write handlers:

- `routes/admin/access-read.ts`
- `routes/admin/access-write.ts`
- guarded by `routes/admin/guards.ts` and `isAuthAdmin`

## 1.3 Service Layer

Main access services:

- `lib/services/access-admin/*`
- `lib/services/tenant-whitelist.ts`
- `lib/services/tenant-directory.ts`

Notable behavior:

- Org/role and user assignment data use versioned upsert strategy.
- Tenant-to-org linkage is stored inside `TenantWhitelistEntity.meta` (JSON fields like `organizationRandId`).
- Tenant directory data is cached in-memory (process-local TTL cache).

---

## 2) Production Readiness Assessment

Status: **Not production-ready at scale** without architectural changes.

## 2.1 High-Risk Gaps

1. **Tenant-to-Org mapping is denormalized in JSON meta**
- Mapping lives in `tenant_whitelist.meta` instead of a relational mapping table.
- No strong FK guarantees, difficult data quality enforcement, weak auditing.

2. **Inconsistent lifecycle model**
- Org/role/assignments are versioned append-only current records.
- Tenant whitelist is mutable row with metadata JSON.
- Mixed write semantics increase operational complexity and rollback risk.

3. **Overly broad admin authorization**
- `isAuthAdmin` relies on global boolean flag in user meta.
- No tenant-scoped/org-scoped delegated admin model.

4. **Read model likely to degrade under scale**
- Organization/role listing not pagination-first.
- User assignment views combine multiple tables and app-side composition per page.
- Search strategy (`ILIKE`) can become expensive with large user counts.

5. **Write APIs are non-transactional from client perspective**
- Multi-step admin changes are executed as separate endpoints.
- Partial success/failure can create inconsistent effective access states.

6. **Cache coherence issues in multi-instance deployment**
- Tenant directory cache is local memory + TTL.
- No distributed invalidation; stale reads likely across replicas.

## 2.2 Medium-Risk Gaps

1. **No optimistic concurrency contract**
- Admin UI writes do not enforce entity revision checks.

2. **No idempotency for critical write commands**
- Retries can duplicate intent or race updates.

3. **Auditability is fragmented**
- Versioned entities are auditable; JSON metadata mutation path is weaker.

---

## 3) Target Architecture (To-Be)

## 3.1 Domain Model (Normalized)

Introduce explicit relational mappings:

- `tenant_organization_mapping`
  - `tenant_id` (FK -> tenant registry)
  - `organization_id` (FK -> organization)
  - `status` (active/inactive)
  - `effective_from`, `effective_to`
  - `updated_by`, `updated_at`
  - unique active constraint on `tenant_id` if one-org-per-tenant policy

- `user_access_assignment`
  - canonical effective assignment view table or materialized projection
  - links user, tenant, org, role with explicit status and effective window

Keep `TenantWhitelistEntity` only for allow/deny and onboarding controls. Do not use it as domain mapping storage.

## 3.2 Access Control Model

Move from global admin flag to scoped RBAC:

- Platform Admin (global)
- Tenant Admin (tenant-scoped)
- Organization Admin (org-scoped)
- Delegated Access Manager (limited actions)

Enforce scope checks in all admin reads/writes.

## 3.3 API Design

Adopt command-based write endpoints:

- `POST /admin/access/commands/apply`
  - accepts atomic change-set (assign org, assign role, map tenant, etc.)
  - executes in single transaction
  - returns resulting effective state snapshot

Add version token for optimistic concurrency:

- `If-Match` or `version` field per command payload

Add idempotency key:

- `Idempotency-Key` header for write commands

## 3.4 Read Model Strategy

Use dedicated query model for admin screens:

- Paginated list endpoints only
- Filterable/sortable fields indexed for expected queries
- Optional materialized projection for “user effective access” page

## 3.5 Caching & Distribution

Replace process-local-only cache patterns with distributed strategy:

- Redis-backed cache for shared tenant directory snapshots
- Event-driven invalidation on mapping changes
- Short TTL + explicit bust on writes

---

## 4) Recommended Data Contracts

## 4.1 Tenant-Org Mapping Record

- `mapping_id` (uuid/rand id)
- `tenant_id`
- `organization_id`
- `state` (`active|inactive`)
- `policy` (`strict_single_org|multi_org`) if required
- `created_by`, `created_at`
- `updated_by`, `updated_at`
- `revision`

## 4.2 Effective User Access Record

- `user_id`
- `tenant_id`
- `organization_id`
- `role_id`
- `effective_state` (`active|suspended|revoked`)
- `source` (manual, sync, policy)
- `revision`
- `last_computed_at`

---

## 5) Migration Plan (Phased, Low-Risk)

## Phase 1: Stabilization (1-2 sprints)

- Add new normalized `tenant_organization_mapping` table.
- Dual-write tenant-org mapping:
  - keep current JSON meta path temporarily
  - write authoritative mapping table in same transaction.
- Add pagination defaults and hard limits for org/role/user list endpoints.
- Add structured audit events for every admin write action.

Exit criteria:
- All new writes include normalized mapping rows.
- Admin list endpoints are paginated and bounded.

## Phase 2: Access Command Layer (1-2 sprints)

- Introduce `apply-access-command` transactional endpoint.
- Add idempotency keys and optimistic revision checks.
- Migrate UI writes from multi-call flows to atomic command API.

Exit criteria:
- Critical admin mutations are transactionally atomic from API perspective.
- Retry-safe behavior verified.

## Phase 3: Read Model + Cache Coherency (1 sprint)

- Add effective access projection (table/materialized view).
- Add Redis cache with invalidation events.
- Remove reliance on process-local stale cache for shared admin reads.

Exit criteria:
- Cross-instance consistency for tenant/admin reads.
- p95 admin query latency within target.

## Phase 4: Cleanup (1 sprint)

- Remove tenant-org metadata from whitelist JSON.
- Deprecate old write endpoints.
- Enforce scoped admin policy checks everywhere.

Exit criteria:
- No production path depends on JSON meta mapping.
- Access governance model is role-scope based.

---

## 6) Operational Controls Required for Production

- DB constraints for mapping integrity (FK + unique active mapping policy).
- Request tracing across admin write/read calls.
- Audit log for who changed org/role/tenant mappings and when.
- Rate limiting for admin mutation endpoints.
- Alerting on mutation error rate and retry bursts.
- Backfill/reconciliation job to detect mapping drift.

---

## 7) Immediate Priority Fixes

If only a short window is available, implement in this order:

1. Normalize tenant-org mapping into first-class table.
2. Add transactional command endpoint for access mutations.
3. Add scoped admin authorization model.
4. Move cache invalidation to Redis/event-driven strategy.

These four changes address most production-failure risks (integrity, consistency, authorization blast radius, and scale behavior).

---

## 8) Conclusion

Current architecture can function for low scale and controlled operations, but it is fragile for production multi-tenant growth. The main risk drivers are denormalized tenant mapping, non-atomic write flows, broad admin authority, and non-coherent distributed caching. A phased migration to normalized mappings + transactional command API + scoped RBAC + distributed cache invalidation is the practical path to production reliability.
