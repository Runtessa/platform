# Core + Auth Multi-Tenant Context For AI

This document explains only the `core` and `auth` parts of this ecosystem.
It is written as architecture context for an AI or engineer who is designing the multi-tenant data model.

## 1. Scope

This file focuses on:

- tenant identity
- tenant ownership boundaries
- auth and SSO contracts
- tenant-scoped runtime data
- current modeling problems
- recommended target direction for a cleaner multi-tenant model

## 2. High-Level System Split

There are two different bounded contexts:

1. `core`
   - runtime and tenant application platform
   - stores tenant runtime config
   - stores tenant code and ACL
   - executes tenant logic
   - owns tenant-facing application behavior

2. `auth`
   - identity, SSO, OAuth, session, role and org context
   - controls authentication and user identity flows
   - issues OAuth codes and access tokens
   - maintains tenant whitelist and tenant-level auth access policy

These two services are related, but they are not the same domain.

## 3. What `core` Owns

`core` is the application runtime for each tenant.

Its main responsibilities are:

- register and store tenants
- keep tenant runtime configuration
- keep tenant ACL definitions
- keep tenant secrets
- keep backend modules
- keep ORM models
- keep UI packages and published artifacts
- resolve adapters and database access
- run tenant code in sandbox/runtime paths
- accept tenant SSO sessions after auth callback

### Core tenant shape today

Current `Tenant` entity in shared models contains:

- `id: uuid`
- `hostname`
- `resourceConfig`
- `adapterAccess`
- `adapterConfig`
- `authDbConfig`
- `aclPermissions`
- `aclRoles`
- `aclEndpoints`
- `isSuspended`
- `allowRegistration`

Interpretation:

- `core` tenant identity is operational and runtime-oriented.
- `hostname` is currently the main external tenant locator.
- `id` is the internal tenant primary key in `core`.
- ACL and adapter config are embedded directly on tenant.

### Core tenant-owned records

The current shared entities show these tenant-scoped records:

- `tenants`
- `accounts`
- `secrets`
- `modules`
- `module_revisions`
- `orm_models`
- `ui_packages`
- `ui_package_revisions`
- `publish_requests`
- `orchestration_agents`
- `orchestration_workloads`
- `orchestration_placements`
- tenant-scoped monitoring records in some tables

### Core runtime model

In practical terms, one tenant in `core` is:

- one hostname
- one runtime config
- one ACL surface
- one codebase made of modules, models and UI packages
- one secret namespace
- one adapter access policy

## 4. What `auth` Owns

`auth` is not the tenant application runtime.
It is the identity and trust boundary.

Its main responsibilities are:

- login and registration
- cookie-backed auth sessions
- OAuth authorization code flow
- OAuth access token issuance
- `userinfo`
- tenant SSO whitelist
- tenant OAuth client provisioning
- user/org/role/membership history
- tenant-scoped access context
- tenant sync for identity/access records

### Important auth principle already present

`auth` explicitly says tenant data is not its main source-of-truth runtime table.

In practice, `auth` stores enough tenant information to:

- decide whether a tenant host is allowed
- validate tenant SSO token exchange
- issue tenant-aware tokens
- map a user into tenant/org/role context

It should not become the place where full tenant app configuration lives.

## 5. Auth Tenant Model Today

`auth` currently represents tenant identity through several related constructs instead of one clean canonical tenant aggregate.

### 5.1 Tenant whitelist

`tenant_sso_whitelist` contains:

- `tenant_name`
- `tenant_rand_id`
- `sso_token_hash`
- `is_active`
- `meta`

Purpose:

- allow or deny tenant host access
- hold tenant SSO token material
- hold some onboarding metadata

This is an access-control/onboarding table, not a full tenant domain model.

### 5.2 OAuth client per tenant

`OAuthClientEntity` includes:

- `tenantRandId`
- redirect URIs
- scopes
- PKCE requirement
- active flag
- metadata

In the managed flow, auth provisions one OAuth client for a tenant.

### 5.3 Versioned tenant-related access records

`auth` uses append-only versioned entities for identity and access records.

The shared version base includes:

- `rand_id`
- `version_no`
- `is_current`
- `previous_row_id`
- `changed_at`
- `changed_by_user_rand_id`
- `changed_by_tenant_rand_id`
- `change_reason`

This applies to records such as:

- users
- roles
- organizations
- user_roles
- user_orgs
- user_tenant_memberships

### 5.4 User tenant membership

`user_tenant_memberships` contains:

- `user_rand_id`
- `tenant_name`
- `tenant_rand_id`
- `org_rand_id`
- `source`
- `is_active`
- `meta`

Purpose:

- attach a user to a tenant context
- optionally scope that membership to an org node
- preserve history through append-only versioning

## 6. How `core` and `auth` Work Together

### 6.1 Login flow

The tenant application runs on `core`.

When a user wants to sign in:

1. user reaches a tenant host handled by `core`
2. `core` resolves tenant by hostname
3. `core` builds tenant SSO config from secrets and tenant config
4. `core` redirects user to `auth /oauth/authorize`
5. `auth` authenticates user and issues authorization code
6. `core /auth` callback exchanges code for token
7. `core` calls `auth /oauth/userinfo`
8. `core` creates its own tenant session cookie

Important point:

- `auth` is the identity issuer
- `core` is the tenant application session owner

### 6.2 Tenant provisioning flow

When tenant SSO is provisioned in `auth`, the service:

- normalizes tenant host name
- validates callback host matches tenant host
- creates or updates tenant whitelist entry
- creates or updates a managed OAuth client
- can rotate tenant SSO token and client secret

### 6.3 Tenant sync flow

`auth` also exposes `/api/tenant-sync/upsert`.

This is used to upsert versioned identity/access records for:

- users
- roles
- organizations
- user_roles
- user_orgs

The sync path writes with:

- `actorUserRandId`
- `actorTenantRandId`
- `changeReason`

That means `auth` can receive tenant-originated access-domain changes while preserving history.

## 7. Current Identifier Problem

Today tenant identity exists in at least three forms:

1. `core.tenants.id`
   - UUID
   - primary tenant key inside `core`

2. `core.tenants.hostname`
   - externally visible tenant locator

3. `auth.tenant_rand_id` and `auth.tenant_name`
   - tenant identity pair in auth

This is the most important modeling problem.

Because of this split, any AI or engineer must not assume there is already one universal tenant key.

## 8. Practical Truths About Ownership

If you are redesigning the multi-tenant model, assume these ownership rules:

### `core` is source of truth for

- tenant runtime existence
- tenant hostname and app endpoint identity
- tenant runtime config
- tenant ACL and endpoint permissions
- tenant code and published artifacts
- tenant secrets and adapter configuration

### `auth` is source of truth for

- human identity
- session lifecycle
- OAuth clients, codes and access tokens
- user-to-role and user-to-org history
- tenant auth allow/deny state
- tenant-scoped user access context

### `auth` should not be source of truth for

- tenant runtime config
- tenant code
- tenant app ACL implementation
- tenant adapters or databases

### `core` should not be source of truth for

- user password or login state
- OAuth token issuance
- long-lived user-role history for identity administration

## 9. Current Modeling Weak Points

These are the main weak spots visible in the current codebase.

### 9.1 Canonical tenant identity is not unified

The system needs one stable global tenant key used across all services.

Right now:

- `core` prefers `tenant.id`
- `auth` prefers `tenant_rand_id`
- flow logic also relies on `tenant_name` / hostname

### 9.2 Tenant whitelist is carrying too much semantic weight

`tenant_sso_whitelist` is good for:

- allow-listing
- SSO token validation
- onboarding state

It is not good as the long-term home for tenant-to-org or broader tenant metadata.

### 9.3 Mixed mutable vs append-only patterns

`core` is mostly mutable current-state storage.
`auth` is heavily versioned append-only storage.

This is not wrong, but it means cross-service sync must be explicit and disciplined.

### 9.4 Tenant name and hostname are overloaded

`tenant_name` in auth is effectively a host-based identifier.
That is workable, but it mixes:

- routing identity
- display identity
- business tenant identity

These should not be treated as the same thing forever.

## 10. Recommended Target Model

If the goal is a durable multi-tenant foundation, the cleanest direction is:

### 10.1 Introduce one canonical tenant key

Use one stable global tenant identifier across the ecosystem.

Suggested shape:

- `tenant_id` = canonical global ID
- `tenant_slug` or `tenant_code` = stable business key
- `primary_hostname` = routing host

Recommendation:

- stop treating hostname as the only durable tenant identity
- stop treating auth `tenant_rand_id` as a parallel identity system

### 10.2 Keep service-local tenant projections

Do not force one physical tenant table shared by all services.
Instead:

- keep one canonical tenant identity contract
- allow each service to store its own projection

For example:

- `core_tenants`
- `auth_tenant_access`
- `auth_tenant_clients`

All linked by the same canonical `tenant_id`.

### 10.3 Separate three concerns clearly

For each tenant, model these separately:

1. Identity
   - tenant id
   - code/slug
   - display name
   - status

2. Routing
   - hostnames
   - callback URL policy
   - allowed origins

3. Access/SSO
   - auth enabled
   - whitelist state
   - tenant SSO token
   - OAuth client bindings

### 10.4 Keep append-only versioning in auth

The auth approach is sound for:

- users
- role assignment history
- org assignment history
- tenant membership history

Do not regress this to plain mutable rows.

### 10.5 Keep runtime state in core mutable

`core` should remain current-state oriented for:

- tenant config
- ACL
- modules
- models
- UI
- secrets

Revisions can exist where needed, but `core` is not an identity ledger.

## 11. Suggested Minimal Cross-Service Contract

If you redesign the model, the contract between `core` and `auth` should minimally include:

- `tenant_id`
- `tenant_code`
- `primary_hostname`
- `display_name`
- `is_active`
- `allow_registration`
- `auth_enabled`

Optional but useful:

- `default_org_id`
- `auth_callback_url`
- `managed_oauth_client_id`

## 12. Guidance For AI Designing The Data Model

If an AI is asked to extend this ecosystem, it should assume:

- `core` and `auth` are separate bounded contexts
- tenant runtime config belongs in `core`
- identity and SSO belong in `auth`
- hostname is important but should not be the only tenant key
- auth whitelist is a control table, not the complete tenant model
- append-only versioning in auth is intentional
- cross-service sync should be explicit, auditable and idempotent

## 13. Short Decision Summary

If you are redesigning now, the safest strategic move is:

1. define one canonical global tenant ID
2. make both `core` and `auth` store that same ID
3. keep `core` as tenant runtime source of truth
4. keep `auth` as identity and tenant-access source of truth
5. demote hostname and whitelist rows from “tenant identity” to “tenant routing/access projections”

That gives you a much cleaner base for a serious multi-tenant architecture.
