---
title: Platform tour
---

<!-- Generated from docs/platform/overview.md; edit the source guide. -->

# Platform tour

IdpCore is a self-hosted application platform built around **live tenant code**.
It contains both an application runtime and its development environment: backend
handlers, native models, React interfaces, drafts, previews and publication.

## Application lifecycle and platform lifecycle

Application code is stored in platform records and compiled artifacts. Publishing
selects the module/UI code consumed by the running services. This lets a developer
change a tenant application without rebuilding Core or restarting the Studio.

A platform source change still needs the normal build/release process. Database
changes also retain their own lifecycle. There is no promise that changing a model
or publishing a revision makes every deployment change atomic or reversible.

## What belongs to a tenant application

| Resource | Purpose | Authoring location |
| --- | --- | --- |
| Backend module | Request handler associated with an HTTP method and route | Modules |
| ORM model | Executable class, fields, relations and methods | Models |
| UI entity | React component, helper, CSS or configuration package | UI Entities |
| ACL | Permission definitions, role mappings and endpoint requirements | `Modules/acl` |
| Adapter settings | Named data/integration grants and secret references | Tenant administration |
| Branding/PWA | Tenant document/manifest settings and optional service-worker support | Tenant administration |

A tenant's runtime traffic is selected by hostname. The Studio authoring APIs also
check user/team scope and the relevant resource permission. Public pages or routes
are a tenant application policy; they do not make provisioning/admin APIs public.

## The backend runtime

Core resolves the tenant, matches a route, evaluates endpoint access, chooses draft
or published state and invokes its handler. The handler receives `(req, adapters)`
and returns the supported HTTP response shape.

Live backend execution uses a short-lived restricted Linux process. The parent
chooses the tenant and grants, retains platform keys and supplies narrow capability
operations. The child can receive the approved tenant adapter configuration needed
for its connections. This boundary requires a compatible host policy and does not
remove the need for database privileges or network policy.

See [backend recipes](/docs/cookbook/backend) and
[the runtime boundary](/docs/operations/runtime).

## Native data models

Model files contain JavaScript classes with TypeORM decorators. Methods and
relations remain executable; they are not replaced by a schema-only DSL.
Backend modules use `await adapters.orm('postgres:orders')` and request repositories
by model name.

The IDE has model loading/schema tools in a restricted process. Studio model-save
actions attempt tenant schema synchronization after persisting source. Review and
back up before saving model changes against existing data. Model records and
schema actions have a separate lifecycle from published module/UI snapshots.
Changing a class without provisioning its adapter or applying its required table
changes does not make the data layer ready.

The platform's own tables use [versioned migrations](/docs/operations/migrations).
Tenant application tables require their own reviewed model operations and recovery plan.

## React UI and Kernel

Kernel is the browser runtime shipped with Core. It resolves tenant and shared
packages from registry responses, evaluates their compiled output, resolves
imports, injects CSS, manages package caching and loads route manifests.

The default entry point is `@app/dashboard` with a named `App` export. Components,
helpers and styles can live in additional packages. The built-in
`@app/datacontext` package exposes the session-aware API client.

Use backend modules for database/integration logic; browser code calls those modules.
The Studio also includes an import workflow for React applications. Imports, entry
points and API calls must be adapted to Kernel contracts; arbitrary npm/build-tool
compatibility is not guaranteed.

See [UI recipes](/docs/cookbook/ui).

## Authoring in the Studio

The Next.js Studio includes Monaco, explorer navigation, split/diff views, search,
preview and inspection. Save actions persist drafts. Module/UI history supports
revision inspection and source restoration. Staging and publication requests help
review selected changes.

Tenant administration includes hostnames, adapter grants, secret references,
resource settings, teams, registration policy, branding and optional PWA configuration.
AI assistant panels and workspace tools are available when configured.

See [authoring and publication](/docs/platform/authoring) for lifecycle semantics.

## Shared projects

Shared backend projects and UI packages carry multi-file source and versioned
publication. Backend code can load published shared exports through
`adapters.shared.require`; UI packages can import shared components through Kernel
package resolution.

Team/project access matters for shared editing and publication. Shared code is a
reuse mechanism, not an automatic claim of tenant-safe business logic. Scope any
data access within the calling tenant's granted context.

See [shared projects](/docs/cookbook/shared).

## Identity and access

Auth owns accounts, login/registration, identity sessions, organizations, roles,
OAuth clients and tenant SSO policy. Core owns runtime tenant configuration and the
tenant application's session/authorization boundary. IDE has its own operator/team
and resource permissions.

A successful IDE login alone does not establish a Core tenant session. Configure
the Auth/Core tenant flow separately, including redirect URLs, domains and cookies.
Organization/role membership can inform application access, but backend endpoints
still need their ACL policy. This preview does not claim complete OIDC conformance.

## Tools around the application

The repository also contains a VS Code tenant-development extension, monitoring,
an optional Docker/Podman management agent and a Codex CLI HTTP/SSE gateway.
These extend the existing platform; they are not new requirements for every tenant.
See [development and operations tools](/docs/platform/tooling).

## Where the responsibilities live

| Service/package | Source | Owns |
| --- | --- | --- |
| Core | `src/core` | Dispatch, registry, ACL, runtime code and adapters |
| Studio | `src/ideNew` | Authoring, preview, publication and admin workflows |
| Kernel | `src/kernel` | Browser package loading and application context |
| Auth | `src/auth` | Identity and tenant sign-in trust |
| Shared | `src/packages/shared` | Entities, contracts, restricted-process helpers and migrations |

There is no separate tenant execution service. Restricted backend/model processes
belong to Core and IDE. The [architecture map](https://github.com/Runtessa/platform/blob/main/docs/site/docs/architecture/idpcore-map.md)
connects those domains to entry points, API routes and runtime flows.

## Next steps

- [Install locally](/docs/getting-started), then [build a first application](/docs/tutorials/first-application).
- Read the [cookbook](/docs/cookbook/overview) to add models, access rules and shared code.
- Review [validation](/docs/project/validation), [security](/docs/security) and
  [dependency findings](/docs/project/dependencies) before an internet-facing deployment.
